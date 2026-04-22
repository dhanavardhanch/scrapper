from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import base64
import requests
import fitz  # PyMuPDF
import re
import json
import os

app = Flask(__name__)
CORS(app)

GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ── Serve frontend ────────────────────────────────────────────────────────────
@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)


def get_prompt(direction):
    if direction == "OUTWARDS":
        vendor_rule = (
            '1. VENDOR (MANDATORY): This is a SALES invoice. '
            'Troogood/Millet Foods is the SELLER. '
            'Extract "Troogood" or "Millet Foods" as the vendor.'
        )
    else:
        vendor_rule = (
            '1. VENDOR (MANDATORY): This is a PURCHASE invoice. '
            'Find the company that SOLD the goods to Troogood/Millet Foods. '
            'Look for labels like "Sold By", "Supplier", "From", "Billed By", or the topmost company header. '
            'DO NOT return Troogood or Millet Foods as the vendor here. '
            'Return the OTHER company name.'
        )

    return f"""You are a precise invoice data extraction engine. Extract structured data from the invoice text or image below.

STEP 1 — REASON FIRST:
Use the "reasoning" key to explain:
- Which company is the Vendor and why
- How you found the Grand Total (Amount)
- How you found the first line item's Qty and row-level Value

CRITICAL EXTRACTION RULES:
{vendor_rule}
2. CONSIGNEE: The "Ship To" or "Consignee" company — the party receiving the goods. Look for labels like "Ship To", "Consignee", "Deliver To", "Shipped To". Return only the company name, no address.
3. AMOUNT: The final Grand Total payable (after all taxes). NOT a subtotal.
4. TAXABLE_VALUE: The total pre-tax subtotal of ALL items combined.
5. GSTIN: Must belong to the SELLER/VENDOR only.
6. DATE: Prefer ISO format YYYY-MM-DD if possible.

ALL LINE ITEMS (extract every numbered row in the invoice into the items array):
- name: Product/item description for that row
- qty: The NUMBER OF UNITS for this row (e.g. 59). NEVER the per-unit rate. MANDATORY.
- uom: Unit of measure strictly (Pac, KG, NOS, Box, Case, Ltr, etc.)
- value: The ROW TOTAL = qty × unit_rate. NOT the per-unit price. MANDATORY.

NUMBER FORMAT RULES:
- Strip all commas from numbers (e.g. "1,500.00" → 1500.00)
- All numeric fields must be plain floats or integers, never strings
- Use 0.0 for any field not found

Return ONLY a valid JSON object with this exact structure. No markdown, no explanation outside the JSON:
{{
    "reasoning": "...",
    "date": "",
    "vendor": "",
    "consignee": "",
    "invoice_no": "",
    "po_number": "",
    "gstin": "",
    "taxable_value": 0.0,
    "cgst": 0.0,
    "sgst": 0.0,
    "igst": 0.0,
    "amount": 0.0,
    "currency": "INR",
    "items": [
        {{ "name": "", "qty": 0.0, "uom": "UNIT", "value": 0.0 }}
    ]
}}"""


def clean_extracted_text(raw_text: str) -> str:
    """
    Normalize PyMuPDF raw text:
    - Collapse 3+ consecutive newlines into 2
    - Strip trailing whitespace per line
    - Remove null bytes or odd control characters
    """
    # Remove control characters except newlines/tabs
    text = re.sub(r'[^\S\n\t ]+', ' ', raw_text)
    # Collapse excessive blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip trailing spaces per line
    text = '\n'.join(line.rstrip() for line in text.splitlines())
    return text.strip()


def extract_text_blocks(doc) -> str:
    """
    Extract text from all PDF pages preserving spatial/reading order.
    Uses block-level extraction sorted by row (y) then column (x) so that
    multi-column invoice headers come out in the correct order.
    """
    full_text = ""
    for page in doc:
        blocks = page.get_text("blocks")
        # Keep only text blocks (type 0), sort top-to-bottom then left-to-right
        text_blocks = [b for b in blocks if b[6] == 0]
        text_blocks.sort(key=lambda b: (int(b[1] / 15), b[0]))
        page_lines = [b[4].strip() for b in text_blocks if b[4].strip()]
        full_text += "\n".join(page_lines) + "\n\n"
    return full_text


def extract_pdf_content(file_bytes: bytes) -> dict:
    """
    Attempt text extraction from all pages. If text is too short,
    fall back to rendering ALL pages as a stitched JPEG image.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    # --- Try text extraction across all pages (spatial block order) ---
    full_text = extract_text_blocks(doc)
    cleaned = clean_extracted_text(full_text)

    if len(cleaned) > 100:  # Raised threshold slightly for better confidence
        return {"is_text": True, "content": cleaned}

    # --- Fallback: render pages to image ---
    # Stitch all pages vertically into one JPEG for the vision model
    import io
    from PIL import Image as PILImage

    images = []
    for page in doc:
        pix = page.get_pixmap(dpi=200)
        img = PILImage.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)

    if not images:
        raise ValueError("Could not render any pages from PDF.")

    total_height = sum(img.height for img in images)
    max_width = max(img.width for img in images)
    stitched = PILImage.new("RGB", (max_width, total_height), (255, 255, 255))
    y_offset = 0
    for img in images:
        stitched.paste(img, (0, y_offset))
        y_offset += img.height

    buffer = io.BytesIO()
    stitched.save(buffer, format="JPEG", quality=90)
    base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return {"is_text": False, "content": base64_str}


def safe_parse_json(raw: str) -> dict:
    """
    Robustly extract JSON from a model response string.
    Handles markdown fences, leading/trailing noise, and nested structures.
    """
    # Strip markdown code fences if present
    raw = re.sub(r'```(?:json)?', '', raw).strip()

    # Try direct parse first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Find the outermost JSON object using brace matching
    start = raw.find('{')
    if start == -1:
        raise ValueError("No JSON object found in response.")

    depth = 0
    end = -1
    for i, ch in enumerate(raw[start:], start):
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i
                break

    if end == -1:
        raise ValueError("Unbalanced braces in JSON response.")

    candidate = raw[start:end + 1]
    return json.loads(candidate)


_BUYER_NAMES_LOWER = [
    'troogood', 'troo good', 'tro good', 'troo-good',
    'millet foods', 'milletfoods', 'm for millet', 'm millet', 'mformillet'
]

_COMPANY_SUFFIX_RE = re.compile(
    r'([A-Z][A-Za-z0-9 &.,\'()-]{2,60}?'
    r'(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|Limited|Ltd\.?|LLP|LLC|Inc\.?|Corp\.?|Co\.?\s*Ltd\.?))',
    re.IGNORECASE
)


def extract_vendor_from_text(text: str, direction: str) -> str:
    """
    Regex fallback: scan extracted text for company-name patterns.
    INWARDS: returns first match that is NOT a Troogood/Millet buyer name.
    OUTWARDS: returns first match that IS a Troogood/Millet name (they are the seller).
    Only used when both LLM passes return empty vendor.
    """
    matches = _COMPANY_SUFFIX_RE.findall(text)
    if direction == "OUTWARDS":
        for m in matches:
            clean = m.strip().strip(',').strip()
            if any(b in clean.lower() for b in _BUYER_NAMES_LOWER):
                return clean
    else:
        for m in matches:
            clean = m.strip().strip(',').strip()
            if not any(b in clean.lower() for b in _BUYER_NAMES_LOWER):
                return clean
    return ""


def get_vendor_focus_prompt(direction):
    """Single-purpose prompt: extract ONLY the vendor/supplier company name."""
    if direction == "OUTWARDS":
        rule = (
            "This is a SALES invoice. Troogood or Millet Foods is the SELLER.\n"
            "Return their exact company name as printed on the invoice."
        )
    else:
        rule = (
            "This is a PURCHASE invoice sent TO Troogood/Millet Foods.\n"
            "Find the SUPPLIER who issued this invoice — the company name at the top, "
            "or labeled 'From', 'Sold By', 'Supplier', 'Billed By', or in the letterhead.\n"
            "DO NOT return Troogood or Millet Foods — return the OTHER company."
        )
    return (
        "Extract only the vendor/supplier company name from this invoice.\n\n"
        f"{rule}\n\n"
        "Return ONLY this JSON (no markdown, no extra text):\n"
        '{"vendor": "Exact Company Name"}'
    )


def call_groq_vendor_only(is_text: bool, content_payload: str, direction: str, api_key: str) -> str:
    """
    Second-pass agent: fires a focused vendor-only extraction call.
    Returns the vendor string, or empty string on any failure.
    """
    prompt = get_vendor_focus_prompt(direction)

    if is_text:
        model_name = "llama-3.3-70b-versatile"
        messages = [{
            "role": "user",
            "content": (
                f"{prompt}\n\n"
                f"=== INVOICE TEXT ===\n{content_payload}\n=== END ==="
            )
        }]
        extra_params = {"response_format": {"type": "json_object"}}
    else:
        model_name = "meta-llama/llama-4-scout-17b-16e-instruct"
        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{content_payload}"}}
            ]
        }]
        extra_params = {}

    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.0,
        **extra_params
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    try:
        resp = requests.post(GROQ_ENDPOINT, headers=headers, json=payload, timeout=30)
        if not resp.ok:
            return ""
        data = resp.json()
        reply = data["choices"][0]["message"]["content"].strip()
        parsed = safe_parse_json(reply)
        return parsed.get("vendor", "").strip()
    except Exception:
        return ""


@app.route('/api/scan', methods=['POST'])
def scan_invoice():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    api_key = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not api_key:
        api_key = os.environ.get('GROQ_API_KEY', '').strip()
    
    if not api_key:
        return jsonify({"error": "No API key provided in Authorization header or environment variable"}), 401

    direction = request.form.get('direction', 'INWARDS').upper()

    file = request.files['file']
    file_bytes = file.read()

    is_text = False
    content_payload = ""

    filename_lower = (file.filename or '').lower()
    mime = file.mimetype or ''

    # --- Pre-process file ---
    if filename_lower.endswith('.pdf') or 'pdf' in mime:
        try:
            res = extract_pdf_content(file_bytes)
            is_text = res['is_text']
            content_payload = res['content']
        except Exception as e:
            print(f"[PDF ERROR] {type(e).__name__}: {e}")
            return jsonify({"error": f"Failed to process PDF: {str(e)}"}), 400
    else:
        # Raw image upload (JPEG/PNG etc.)
        content_payload = base64.b64encode(file_bytes).decode('utf-8')
        is_text = False

    prompt_text = get_prompt(direction)

    # --- Build Groq request ---
    if is_text:
        # Text-capable large model — supports json_object response format
        model_name = "llama-3.3-70b-versatile"
        messages = [{
            "role": "user",
            "content": (
                f"{prompt_text}\n\n"
                f"=== INVOICE TEXT (extracted from PDF) ===\n{content_payload}\n"
                f"=== END OF INVOICE TEXT ==="
            )
        }]
        extra_params = {"response_format": {"type": "json_object"}}
    else:
        # Vision model — does NOT support response_format json_object reliably
        model_name = "meta-llama/llama-4-scout-17b-16e-instruct"
        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt_text},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{content_payload}"}
                }
            ]
        }]
        extra_params = {}  # No response_format for vision model

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.1,
        **extra_params
    }

    # --- Call Groq API ---
    try:
        response = requests.post(GROQ_ENDPOINT, headers=headers, json=payload, timeout=60)

        if not response.ok:
            try:
                err_data = response.json()
                err_msg = err_data.get('error', {}).get('message', 'Groq API Error')
            except Exception:
                err_msg = response.text or 'Groq API Error'
            return jsonify({"error": err_msg}), response.status_code

        data = response.json()
        reply_content = data['choices'][0]['message']['content'].strip()

        parsed_json = safe_parse_json(reply_content)

        # Pass 2: if vendor is empty, fire a focused vendor-only LLM call
        if not parsed_json.get("vendor", "").strip():
            vendor_retry = call_groq_vendor_only(is_text, content_payload, direction, api_key)
            if vendor_retry:
                parsed_json["vendor"] = vendor_retry

        # Pass 3 (text PDFs only): regex fallback scanning for company-name suffixes
        if not parsed_json.get("vendor", "").strip() and is_text:
            vendor_regex = extract_vendor_from_text(content_payload, direction)
            if vendor_regex:
                parsed_json["vendor"] = vendor_regex
                print(f"[VENDOR REGEX] Found via regex fallback: {vendor_regex}")

        return jsonify(parsed_json)

    except (ValueError, json.JSONDecodeError) as e:
        print(f"[PARSE ERROR] {e}")
        return jsonify({"error": f"Failed to parse AI output into JSON: {str(e)}"}), 500
    except requests.exceptions.Timeout:
        print("[TIMEOUT] Groq API timed out")
        return jsonify({"error": "Request to Groq API timed out."}), 504
    except requests.exceptions.RequestException as e:
        print(f"[NETWORK ERROR] {e}")
        return jsonify({"error": f"Failed to connect to Groq API: {str(e)}"}), 502
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)