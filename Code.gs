// ── Troogood IMS — Google Sheets Webhook ─────────────────────────────────────
// Deploy this as a Google Apps Script Web App:
//   Extensions → Apps Script → paste this code → Deploy → New Deployment
//   Type: Web app | Execute as: Me | Access: Anyone → Deploy → copy URL
//   Paste that URL into the app's "Sheets Web App URL" field.

var SHEET_NAME = 'Invoices'; // change if you want a different sheet tab name

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Write header row on first use
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Direction', 'Invoice Date', 'Vendor', 'Consignee',
        'Invoice No.', 'PO Number', 'GSTIN',
        'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Amount',
        'Items', 'Qty', 'UOM', 'Factory', 'Type'
      ]);
      // Freeze header row
      sheet.setFrozenRows(1);
      // Bold the header
      sheet.getRange(1, 1, 1, 18).setFontWeight('bold');
    }

    var itemsArray = data.items;
    
    if (itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0) {
      var timestamp = new Date();
      itemsArray.forEach(function(itemObj) {
        sheet.appendRow([
          timestamp,                        // Timestamp
          data.direction    || '',          // INWARDS / OUTWARDS
          data.date         || '',          // Invoice date
          data.vendor       || '',
          data.consignee    || '',
          data.invoice_no   || '',
          data.po_number    || '',
          data.gstin        || '',
          Number(data.taxable_value) || 0,
          Number(data.cgst)          || 0,
          Number(data.sgst)          || 0,
          Number(data.igst)          || 0,
          Number(data.amount)        || 0,
          itemObj.name      || '',          // EXPLICITLY grab just the item name text
          itemObj.qty       || '',
          itemObj.uom       || '',
          data.factory      || '',
          data.type         || ''
        ]);
      });
    } else {
      // Fallback
      sheet.appendRow([
        new Date(),                       // Timestamp
        data.direction    || '',          // INWARDS / OUTWARDS
        data.date         || '',          // Invoice date
        data.vendor       || '',
        data.consignee    || '',
        data.invoice_no   || '',
        data.po_number    || '',
        data.gstin        || '',
        Number(data.taxable_value) || 0,
        Number(data.cgst)          || 0,
        Number(data.sgst)          || 0,
        Number(data.igst)          || 0,
        Number(data.amount)        || 0,
        data.item || '',                  // item names joined by ", "
        data.qty  || '',                  // quantities joined by ", "
        data.uom  || '',                  // UOMs joined by ", "
        data.factory || '',
        data.type    || '',
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Health-check — visiting the URL in a browser should return { "status": "ok" }
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', app: 'Troogood IMS Webhook' }))
    .setMimeType(ContentService.MimeType.JSON);
}
