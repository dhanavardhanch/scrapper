const { useState, useEffect, useRef, useCallback } = React;

// ─── MOCK SCAN DATA ───────────────────────────────────────────────────────────
const MOCK_INWARD = {
    date: new Date().toISOString().split('T')[0],
    vendor: 'Apex Raw Materials Pvt Ltd',
    items: [
        { id: 1, name: 'Polypropylene Granules', qty: 250, uom: 'KG', value: 87500 },
        { id: 2, name: 'HDPE Pellets', qty: 100, uom: 'KG', value: 42000 },
    ],
};
const MOCK_OUTWARD = {
    date: new Date().toISOString().split('T')[0],
    vendor: 'Bharat Logistics Pvt Ltd',
    items: [
        { id: 1, name: 'Finished Bottles 1L', qty: 500, uom: 'PCS', value: 62500 },
        { id: 2, name: 'Corrugated Cartons', qty: 80, uom: 'PCS', value: 9600 },
        { id: 3, name: 'Stretch Film Roll', qty: 12, uom: 'PCS', value: 7200 },
    ],
};

const FACTORIES = ['TGK-1', 'TGK-2', 'TGK-3', 'TGK-4', 'TGR-1'];
const TYPES = ['Direct', 'Internal', 'Discard'];

// ─── VENDOR LIST ──────────────────────────────────────────────────────────────
const VENDOR_LIST = [
    'Singhania Flexo Pack Pvt. Ltd.', 'Shrinath Rotopack Pvt. Ltd.', 'Venkateshwara Roto Pack Pvt. Ltd.',
    'PM Gravure LLP', 'SS Gravures Pvt. Ltd.', 'Rudra Graphics Pvt Ltd', 'Pyramid Roto Print Pvt. Ltd.',
    'Tirumala Poly Prints', 'VKR Polypack', 'Magicpack Automations Pvt. Ltd.',
    'Sri Gayatri Packaging Industries', 'Nikita Containers Pvt Ltd', 'Ratna Plastics Limited',
    'Star Plast Industries', 'Visipak Private Limited', 'Devi Corrugators', 'Sri Maruti Corrugators',
    'Caxton Offset Pvt. Ltd.', 'Ruby Paper Products', 'Bharat Packaging', 'Vaibhav Packaging',
    'Antilia Tec Pack', 'Prompt Packging Pvt Ltd', 'Vivala Cartons Pvt. Ltd.', 'VRL Logistics Ltd',
    'Safexpress Private Limited', 'Om Logistics', 'Lokesh Transport', 'Signature Logistics',
    'TotalEnergies Marketing India Pvt Ltd', 'Deepak Starch & Chemicals', 'Pristine Organics Pvt Ltd',
    'RainMaker Food & Agro Pvt Ltd', 'Coastal Foods', 'Jiffy Foods Pvt. Ltd.',
    'Sri Rajya Lakshmi Traders', 'TSSPDCL', 'APCPDCL', 'Gati', 'Blue Dart Express Limited',
];

let _id = 200;
const uid = () => ++_id;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const Styles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&family=Inter:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #07091A;
      --bg2:       #0B0F24;
      --surface:   #111828;
      --surface2:  #182132;
      --surface3:  #1F2D42;
      --border:    #1E2D47;
      --border2:   #27406A;
      --orange:    #F59E0B;
      --orange-mid: #D97706;
      --orange-deep: #B45309;
      --orange-glow: rgba(245,158,11,0.2);
      --orange-dim:  rgba(245,158,11,0.08);
      --blue:      #38BDF8;
      --blue-dim:  rgba(56,189,248,0.08);
      --white:     #F8FAFC;
      --text:      #E2E8F0;
      --text2:     #94A3B8;
      --text3:     #4A5568;
      --green:     #10B981;
      --red:       #F87171;
      --yellow:    #FCD34D;
      --r:         10px;
      --r-lg:      16px;
      --mono:      'IBM Plex Mono', monospace;
      --sans:      'Syne', sans-serif;
      --ui:        'Inter', sans-serif;
      --shadow:    0 12px 40px rgba(0,0,0,0.7);
      --shadow-sm: 0 4px 16px rgba(0,0,0,0.5);
      --glow:      0 0 0 3px var(--orange-glow);
    }

    html { font-size: 15px; -webkit-text-size-adjust: 100%; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--ui);
      min-height: 100dvh;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* Subtle grid background */
    body::after {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(245,158,11,.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(245,158,11,.02) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
      z-index: 0;
    }

    #root { position: relative; z-index: 1; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 3px; }

    /* Forms */
    input, select {
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: var(--mono);
      font-size: .83rem;
      border-radius: var(--r);
      padding: .65rem .9rem;
      width: 100%;
      outline: none;
      transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
      -webkit-appearance: none;
      appearance: none;
    }
    input:focus, select:focus {
      border-color: var(--orange);
      background: var(--surface);
      box-shadow: var(--glow);
    }
    input::placeholder { color: var(--text3); }
    input[type=date]::-webkit-calendar-picker-indicator { filter: invert(.5) sepia(1) saturate(5) hue-rotate(0deg); }
    input[type=number]::-webkit-inner-spin-button { opacity: .2; }

    label {
      font-size: .68rem;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--text2);
      display: block;
      margin-bottom: .4rem;
    }

    button { cursor: pointer; border: none; line-height: 1; font-family: var(--ui); }

    /* Animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseDot {
      0%,100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,.5); }
      50%      { opacity: .8; transform: scale(.85); box-shadow: 0 0 0 4px rgba(16,185,129,0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes scanLine {
      0%   { top: 0; opacity: 1; }
      45%  { opacity: 1; }
      50%  { top: calc(100% - 2px); opacity: .3; }
      51%  { top: 0; opacity: .3; }
      55%  { opacity: 1; }
      100% { top: calc(100% - 2px); opacity: 1; }
    }
    @keyframes toastIn {
      from { opacity:0; transform: translateY(16px) scale(.95); }
      to   { opacity:1; transform: translateY(0)   scale(1); }
    }
    @keyframes toastOut {
      from { opacity:1; transform: translateY(0)    scale(1); }
      to   { opacity:0; transform: translateY(16px) scale(.95); }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }

    .fade-up { animation: fadeUp .4s cubic-bezier(0.16, 1, 0.3, 1) both; }

    /* ── Buttons ── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: .55rem;
      font-weight: 700;
      border-radius: var(--r);
      transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-primary {
      background: var(--orange);
      color: #000;
      font-size: .88rem;
      letter-spacing: .02em;
      padding: .8rem 1.6rem;
    }
    .btn-primary:hover { background: #FBBF24; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(245,158,11,.35); }
    .btn-primary:active { transform: translateY(0px) scale(.98); }
    .btn-primary:disabled { opacity: .3; cursor: not-allowed; transform: none; box-shadow: none; }

    .btn-save {
      width: 100%;
      padding: 1.1rem;
      font-size: 1rem;
      background: linear-gradient(135deg, var(--orange) 0%, var(--orange-deep) 100%);
      color: #000;
      border-radius: var(--r-lg);
      letter-spacing: .02em;
      box-shadow: 0 8px 24px rgba(245,158,11,.22);
    }
    .btn-save:hover { filter: brightness(1.08); transform: translateY(-2px); box-shadow: 0 14px 36px rgba(245,158,11,.4); }
    .btn-save:active { transform: translateY(0px) scale(.98); }
    .btn-save:disabled { opacity: .25; cursor: not-allowed; transform: none; filter: none; box-shadow:none; }

    .btn-ghost {
      background: transparent;
      color: var(--orange);
      border: 1px solid var(--border);
      font-size: .8rem;
      padding: .6rem 1.2rem;
    }
    .btn-ghost:hover { border-color: var(--orange); background: var(--orange-dim); }

    .btn-icon {
      background: var(--surface2);
      color: var(--text2);
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: .5rem .7rem;
    }
    .btn-icon:hover { color: var(--red); border-color: var(--red); background: rgba(248,113,113,.1); }

    /* ── Pill toggles ── */
    .pills { display: flex; flex-wrap: wrap; gap: .5rem; }
    .pill {
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text2);
      border-radius: 8px;
      font-family: var(--ui);
      font-size: .78rem;
      font-weight: 600;
      padding: .5rem 1.2rem;
      transition: all .2s;
    }
    .pill:hover { border-color: var(--orange); color: var(--orange); }
    .pill.on {
      background: var(--orange);
      border-color: var(--orange);
      color: #000;
      font-weight: 800;
      box-shadow: 0 4px 16px rgba(245,158,11,.35);
    }

    /* ── Drop zone ── */
    .dropzone {
      border: 2px dashed var(--border);
      border-radius: var(--r-lg);
      padding: 2.5rem 1.5rem;
      text-align: center;
      position: relative;
      cursor: pointer;
      transition: all .2s;
    }
    .dropzone:hover { border-color: var(--orange); background: var(--orange-dim); }
    .dropzone.over  { border-color: var(--orange); background: var(--orange-dim); }

    /* ── Upload action cards ── */
    .upload-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .85rem;
      margin-bottom: 1rem;
    }
    .upload-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: .6rem;
      padding: 1.4rem .5rem;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      cursor: pointer;
      transition: all .2s;
    }
    .upload-card:hover { border-color: var(--orange); transform: translateY(-2px); background: var(--surface3); box-shadow: 0 8px 24px rgba(0,0,0,.4); }
    .upload-card:active { transform: translateY(0) scale(.98); }
    .upload-card input[type=file] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .upload-card .card-icon { font-size: 1.8rem; }
    .upload-card .card-label {
      font-size: .7rem; font-weight: 700;
      color: var(--text2); letter-spacing: .08em; text-transform: uppercase;
    }

    /* ── Preview ── */
    .preview-box {
      width: 100%;
      aspect-ratio: 1/1.3;
      border-radius: var(--r-lg);
      overflow: hidden;
      border: 1px solid var(--border);
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: inset 0 0 40px rgba(0,0,0,.5);
    }
    .preview-box img { width:100%; height:100%; object-fit:contain; }
    .preview-box .placeholder-inner {
      display:flex; flex-direction:column; align-items:center; gap:.8rem;
      color: var(--text3); font-size:.85rem; text-align:center; padding:2rem;
    }

    /* Scan overlay */
    .scan-overlay {
      position: absolute; inset: 0;
      background: rgba(7,9,26,.65);
    }
    .scan-laser {
      position: absolute; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--orange), transparent);
      box-shadow: 0 0 16px var(--orange), 0 0 6px rgba(245,158,11,.5);
      animation: scanLine 1.8s ease-in-out infinite;
    }

    /* ── Section heading ── */
    .sec {
      display:flex; align-items:center; gap:1rem;
      font-family:var(--sans); font-size:.7rem; font-weight:700;
      color:var(--text3); letter-spacing:.15em; text-transform:uppercase;
      margin-bottom:1.2rem;
    }
    .sec::after { content:''; flex:1; height:1px; background: linear-gradient(90deg, var(--border), transparent); }

    /* ── Item card row ── */
    .item-row-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: 1.1rem 1rem .8rem;
      margin-bottom: .6rem;
      transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .item-row-card:hover { border-color: var(--border2); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.35); }
    .item-row-card .field label { 
        font-size: .62rem; color: var(--orange); opacity: 0.7; 
        margin-bottom: .35rem; font-weight: 800; 
    }
    .item-row-card input { background: var(--bg2); border: 1px solid var(--border); }
    .item-row-card input:focus { border-color: var(--orange); background: var(--bg); }

    /* ── Toast ── */
    .prefix-wrap .pfx {
      position:absolute; left:.75rem; top:50%; transform:translateY(-50%);
      color:var(--orange); font-size:.82rem; pointer-events:none; font-family:var(--mono);
    }
    .toast {
      position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
      background: linear-gradient(135deg, var(--orange), var(--orange-deep));
      border:none;
      color:#000; border-radius:50px; padding:.85rem 2rem;
      font-size:.88rem; font-weight:800; z-index:999;
      box-shadow:0 10px 32px rgba(245,158,11,.4);
      animation: toastIn .3s cubic-bezier(0.16, 1, 0.3, 1) both;
      white-space: nowrap;
    }
    .toast.out { animation: toastOut .25s ease-in forwards; }

    /* ── Table ── */
    .entries-table { width:100%; border-collapse:collapse; font-size:.8rem; }
    .entries-table th {
      text-align:left; color:var(--text3); font-size:.65rem; letter-spacing:.14em;
      text-transform:uppercase; padding:.8rem 1rem;
      border-bottom:1px solid var(--border); font-weight:700;
    }
    .entries-table td {
      padding:.9rem 1rem; border-bottom:1px solid var(--border);
      color:var(--text); vertical-align:middle;
    }
    .entries-table tbody tr { transition: background .15s; }
    .entries-table tbody tr:hover td { background: rgba(245,158,11,.04); }

    .tag {
      display:inline-block; font-size:.63rem; font-weight:800;
      padding:.2rem .65rem; border-radius:6px; letter-spacing:.05em; text-transform:uppercase;
    }
    .tag-orange-brand { background:rgba(245,158,11,.12); color:var(--orange); border:1px solid rgba(245,158,11,.2); }
    .tag-blue  { background:rgba(56,189,248,.1);  color:var(--blue);   border:1px solid rgba(56,189,248,.2); }
    .tag-green { background:rgba(16,185,129,.1);  color:var(--green);  border:1px solid rgba(16,185,129,.2); }
    .tag-orange { background:rgba(252,211,77,.1); color:var(--yellow); border:1px solid rgba(252,211,77,.2); }

    /* ── Progress ── */
    .scan-progress {
      width:100%; height:4px; background:var(--surface2); border-radius:10px; overflow:hidden;
    }
    .scan-progress-fill {
      height:100%;
      background: linear-gradient(90deg, var(--orange-mid), var(--orange), #FBBF24);
      box-shadow:0 0 10px rgba(245,158,11,.6);
      border-radius:10px;
    }

    /* ── Layout ── */
    .two-col {
      display:grid; grid-template-columns: minmax(0, 340px) 1fr; gap:1.5rem; align-items:start;
    }
    .field-row { display:grid; gap:.65rem; align-items:end; }
    .field-row-4 { grid-template-columns: 2.5fr 80px 80px 110px 42px; }
    
    @media (max-width:768px) {
      .field-row-4 { grid-template-columns: 1.8fr 70px 70px 95px 38px; }
    }
    
    @media (max-width:540px) {
      /* On very small screens, use a horizontal scroll container or tighter grid */
      .items-container { overflow-x: auto; padding-bottom: .5rem; }
      .items-inner { min-width: 480px; }
    }

    .prefix-wrap { position:relative; }
    .prefix-wrap input { padding-left: 1.75rem; }
    @media (max-width:860px) { .two-col { grid-template-columns:1fr; } }

    /* ── Empty form placeholder ── */
    .form-placeholder {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:.85rem; padding:3rem 1.5rem;
      border:1px dashed var(--border); border-radius:var(--r-lg);
      color:var(--text3); font-size:.82rem; text-align:center;
      min-height:320px; background: rgba(7,9,26,.4);
    }
    .form-placeholder .big-icon { font-size:2.5rem; opacity:.25; }

    /* ── Nav active tab ── */
    .nav-tab {
      position:relative; background:transparent; border:1px solid transparent;
      font-family:var(--sans); font-size:.78rem; font-weight:600;
      letter-spacing:.1em; text-transform:uppercase;
      padding:.45rem 1.1rem; border-radius:6px;
      transition: all .18s;
      -webkit-tap-highlight-color: transparent;
    }
    .nav-tab.active { color:#fff; background: var(--surface2); border-color: var(--border); }
    .nav-tab:not(.active) { color:var(--text3); }
    .nav-tab:not(.active):hover { color:var(--text2); background:var(--surface); }

    /* ── Mobile friendly bottom padding ── */
    @media (max-width:600px) {
      main { padding: 1rem 1rem 5rem; }
    }

    .shimmer-bg {
      background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
      background-size: 400px 100%;
      animation: shimmer 1.5s infinite;
    }

    /* ── Dot indicators ── */
    .dot-ok {
      display:inline-block; width:6px; height:6px;
      background:var(--green); border-radius:50%;
      box-shadow:0 0 6px rgba(16,185,129,.6);
      flex-shrink:0;
    }
    .dot-live {
      display:inline-block; width:7px; height:7px;
      background:var(--green); border-radius:50%;
      animation:pulseDot 2s ease-in-out infinite;
      box-shadow:0 0 8px rgba(16,185,129,.7);
    }

    /* ── Spinner ── */
    .spinner {
      display:inline-block;
      border:2px solid var(--surface3);
      border-top-color:var(--orange);
      border-radius:50%;
      animation:spin .7s linear infinite;
      flex-shrink:0;
      width:16px; height:16px;
    }
    .spinner-blue { border-top-color:var(--blue); }

    /* ── Scan state (right col placeholder while scanning) ── */
    .scan-state {
      display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:1.25rem; min-height:280px;
      border:1px dashed var(--border); border-radius:var(--r-lg);
      padding:2rem 1rem; background: rgba(7,9,26,.4);
    }
  `}</style>
);

// ─── ICONS (SVG) ──────────────────────────────────────────────────────────────
const Ico = ({ d, size = 18, stroke = 'currentColor', sw = 1.7 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const icons = {
    camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
    doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
    plus: "M12 5v14 M5 12h14",
    trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8",
    check: "M20 6L9 17l-5-5",
    refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    rows: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, onDone }) => {
    const [out, setOut] = useState(false);
    useEffect(() => {
        const a = setTimeout(() => setOut(true), 2600);
        const b = setTimeout(() => onDone(), 3000);
        return () => { clearTimeout(a); clearTimeout(b); };
    }, []);
    return <div className={`toast${out ? ' out' : ''}`}>{msg}</div>;
};

// ─── RECENT ENTRIES ───────────────────────────────────────────────────────────
const typeColor = t => t === 'Direct' ? 'tag-blue' : t === 'Internal' ? 'tag-green' : 'tag-orange';

const RecentEntries = ({ entries }) => {
    if (!entries.length) return (
        <p style={{ color: 'var(--text3)', fontSize: '.78rem', padding: '.5rem 0', fontFamily: 'var(--mono)' }}>
            No saved entries yet — complete a scan and save to see records here.
        </p>
    );
    return (
        <div style={{ overflowX: 'auto' }}>
            <table className="entries-table">
                <thead>
                    <tr>
                        {['Date', 'Invoice No.', 'Vendor', 'Factory', 'Type', 'Amount (₹)'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>

                    {[...entries].reverse().slice(0, 5).map(e => (
                        <tr key={e.id}>
                            <td style={{ color: 'var(--text2)' }}>{e.date}</td>
                            <td style={{ fontFamily: 'var(--mono)', fontSize: '.72rem' }}>{e.invoiceNo || '—'}</td>
                            <td>{e.vendor || '—'}</td>
                            <td><span className="tag tag-orange-brand">{e.factory}</span></td>
                            <td><span className={`tag ${typeColor(e.type)}`}>{e.type}</span></td>
                            <td style={{ fontWeight: 800, color: 'var(--white)' }}>
                                ₹{Number(e.totalValue || 0).toLocaleString('en-IN')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── LINE ITEM ────────────────────────────────────────────────────────────────
const LineItem = ({ item, idx, isNew, onChange, onRemove }) => (
    <div className={`item-row-card fade-up`} style={{ animationDelay: `${idx * 40}ms` }}>
        <div className="field-row field-row-4">
            <div className="field">
                {idx === 0 && <label>Item Description</label>}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                        value={item.name}
                        placeholder="Item name"
                        onChange={e => onChange(item.id, 'name', e.target.value)}
                        style={{ paddingRight: !isNew ? '1.5rem' : undefined }}
                    />
                    {!isNew && (
                        <span className="dot-ok"
                            style={{ position: 'absolute', right: '.5rem', opacity: 0.6 }}
                            title="Extracted by ML"
                        />
                    )}
                </div>
            </div>
            <div className="field">
                {idx === 0 && <label>Qty</label>}
                <input type="number" min="0" value={item.qty} placeholder="0"
                    onChange={e => onChange(item.id, 'qty', e.target.value)} />
            </div>
            <div className="field">
                {idx === 0 && <label>UOM</label>}
                <input value={item.uom} placeholder="UOM"
                    style={{ textTransform: 'uppercase' }}
                    onChange={e => onChange(item.id, 'uom', e.target.value)} />
            </div>
            <div className="field">
                {idx === 0 && <label>Value</label>}
                <div className="prefix-wrap">
                    <span className="pfx">₹</span>
                    <input type="number" min="0" value={item.value} placeholder="0"
                        onChange={e => onChange(item.id, 'value', e.target.value)} />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: idx === 0 ? 'flex-end' : 'center', justifyContent: 'center' }}>
                <button
                    className="btn btn-icon"
                    onClick={() => onRemove(item.id)}
                    title="Remove"
                    style={{ padding: '.45rem', borderRadius: '8px' }}
                >
                    <Ico d={icons.trash} size={14} />
                </button>
            </div>
        </div>
    </div>
);

// ─── TAB PANEL ────────────────────────────────────────────────────────────────
const TabPanel = ({ direction, savedEntries, onSave, onWarnDirection }) => {

    const fileRef = useRef();
    const cameraRef = useRef();
    const streamRef = useRef(null);

    const [file, setFile] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [preview, setPreview] = useState(null);
    const [dragging, setDragging] = useState(false);

    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [scanPct, setScanPct] = useState(0);

    const [date, setDate] = useState('');
    const [vendor, setVendor] = useState('');
    const [consignee, setConsignee] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [poNumber, setPoNumber] = useState('');
    const [gstin, setGstin] = useState('');
    const [taxableValue, setTaxableValue] = useState('');
    const [cgst, setCgst] = useState('');
    const [sgst, setSgst] = useState('');
    const [igst, setIgst] = useState('');
    const [amount, setAmount] = useState('');
    const [items, setItems] = useState([]);
    const [newItemIds, setNewItemIds] = useState(new Set());

    const [factory, setFactory] = useState('');
    const [type, setType] = useState('');
    const [saving, setSaving] = useState(false);
    const [scanError, setScanError] = useState(null);

    // Initialise API key from user request if not set
    useEffect(() => {
        const defaultKey = ''; // Enter API Key here or set in Vercel env
        if (typeof localStorage !== 'undefined' && !localStorage.getItem('AI_API_KEY')) {
            localStorage.setItem('AI_API_KEY', defaultKey);
        }
    }, []);

    // Reset form
    const reset = () => {
        setFile(null);
        setPreview(null);
        setScanned(false);
        setScanning(false);
        setScanPct(0);
        setDate('');
        setVendor('');
        setConsignee('');
        setInvoiceNo('');
        setPoNumber('');
        setGstin('');
        setTaxableValue('');
        setCgst('');
        setSgst('');
        setIgst('');
        setAmount('');
        setItems([]);
        setNewItemIds(new Set());
        setFactory('');
        setType('');
    };

    // Handle file (from any source)
    const handleFile = async f => {
        if (!f) return;
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (!allowed.includes(f.type)) return;

        setFile(f);
        setScanned(false);
        setScanError(null);
        onWarnDirection && onWarnDirection(null);

        if (f.type === 'application/pdf') {
            setPreview('__loading__');
            try {
                const reader = new FileReader();
                reader.onload = async () => {
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    if (!pdfjsLib) return setPreview('__pdf__');
                    const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 0.5 });
                    const canvas = document.createElement('canvas');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                    setPreview(canvas.toDataURL());
                };
                reader.readAsArrayBuffer(f);
            } catch (e) {
                setPreview('__pdf__');
            }
        } else {
            const url = URL.createObjectURL(f);
            setPreview(url);
        }
    };

    // Drag handlers
    const onDragOver = e => { e.preventDefault(); setDragging(true); };
    const onDragLeave = () => setDragging(false);
    const onDrop = e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); };

    useEffect(() => {
        if (showCamera && cameraRef.current && streamRef.current) {
            cameraRef.current.srcObject = streamRef.current;
            cameraRef.current.play().catch(() => { });
        }
    }, [showCamera]);

    const openCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            streamRef.current = s;
            setShowCamera(true);
        } catch (err) {
            alert('Cannot access camera: ' + (err.message || 'Permission denied'));
        }
    };

    const capturePhoto = () => {
        const video = cameraRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) {
            setScanError('Camera not ready — wait for the live feed to appear and try again.');
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        // toDataURL is more reliable than toBlob across browsers
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64 = dataUrl.split(',')[1];
        if (!base64) { setScanError('Capture failed — canvas export error.'); return; }
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        if (!blob.size) { setScanError('Capture failed — empty image.'); return; }
        const f = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        handleFile(f);
        doScan(f);
        closeCamera();
    };

    const closeCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const doScan = async (fileArg = null) => {
        const fileToScan = fileArg || file;
        if (!fileToScan || fileToScan.size === 0) return;
        setScanError(null);
        onWarnDirection && onWarnDirection(null);
        setScanning(true);
        setScanPct(10);

        const apiKey = localStorage.getItem('AI_API_KEY') || '';

        try {
            setScanPct(30);

            // Create FormData to send file to Flask backend
            const formData = new FormData();
            formData.append('file', fileToScan, fileToScan.name || 'invoice.jpg');
            formData.append('direction', direction);

            setScanPct(50);

            // Call Local or Vercel Backend
            const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5000/api/scan' : '/api/scan';
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `Backend Error (${response.status})`);
            }

            const result = await response.json();
            if (!result) throw new Error('No data returned from backend engine');

            setScanPct(90);

            // Populate fields with fallback values
            setDate(result.date || new Date().toISOString().split('T')[0]);

            let extractedVendor = result.vendor || '';
            let extractedConsignee = result.consignee || '';

            const mfmtKeywords = [
                'm for millet', 'mformillet', 'm-for-millet', 'mformillet foods',
                'troogood', 'troo good', 'tro good', 'troo-good',
                'millet foods', 'milletfoods'
            ];
            const isMfmt = s => mfmtKeywords.some(k => s.toLowerCase().includes(k));

            if (direction === 'INWARDS' && isMfmt(extractedVendor)) {
                onWarnDirection && onWarnDirection({ detected: 'OUTWARDS', message: 'This invoice is not supported for Inwards — Mformillet / Troogood appears as the Vendor (seller), which means it is an Outwards invoice. Please switch to the Outwards tab and rescan.' });
                setScanning(false); setScanPct(0); return;
            }
            if (direction === 'OUTWARDS' && isMfmt(extractedConsignee)) {
                onWarnDirection && onWarnDirection({ detected: 'INWARDS', message: 'This invoice is not supported for Outwards — Mformillet / Troogood appears as the Consignee (receiver), which means it is an Inwards invoice. Please switch to the Inwards tab and rescan.' });
                setScanning(false); setScanPct(0); return;
            }

            setVendor(extractedVendor);
            setConsignee(extractedConsignee);
            setInvoiceNo(result.invoice_no || '');
            setPoNumber(result.po_number || '');
            setGstin(result.gstin || '');
            const num = v => (v !== null && v !== undefined && v !== '') ? String(v) : '';
            setTaxableValue(num(result.taxable_value));
            setCgst(num(result.cgst));
            setSgst(num(result.sgst));
            setIgst(num(result.igst));
            setAmount(num(result.amount));

            let itemsRaw = Array.isArray(result.items) ? result.items : [];

            const mappedItems = itemsRaw.map(i => {
                // Ensure qty is numeric only (focus on numbers, not letters)
                const numericQty = String(i.qty || '').replace(/[^0-9.]/g, '');
                return {
                    id: uid(),
                    name: i.name || '',
                    qty: numericQty || 0,
                    uom: i.uom || 'NOS',
                    value: i.value || 0
                };
            });

            setItems(mappedItems.length ? mappedItems : [{ id: uid(), name: '', qty: '', uom: '', value: '' }]);
            setNewItemIds(new Set());

            setScanPct(100);
            setTimeout(() => {
                setScanning(false);
                setScanned(true);
            }, 300);

        } catch (err) {
            setScanError(err.message || 'Scan failed. Check if Python backend is running.');
            setScanning(false);
            setScanPct(0);
        }
    };

    // Item CRUD
    const updateItem = (id, k, v) => setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i));
    const removeItem = id => setItems(p => p.filter(i => i.id !== id));
    const addItem = () => {
        const newId = uid();
        setItems(p => [...p, { id: newId, name: '', qty: '', uom: '', value: '' }]);
        setNewItemIds(p => new Set([...p, newId]));
    };

    // Save to Google Sheets via Apps Script Web App
    const doSave = async () => {
        if (!factory || !type) return;
        setSaving(true);
        const totalValue = amount ? Number(amount) : items.reduce((s, i) => s + Number(i.value || 0), 0);

        const payload = {
            direction,
            date,
            vendor,
            consignee,
            invoice_no: invoiceNo,
            po_number: poNumber,
            gstin,
            taxable_value: taxableValue,
            cgst,
            sgst,
            igst,
            amount: totalValue,
            item: items.map(i => i.name).filter(Boolean).join(', '),
            qty: items.map(i => i.qty).filter(Boolean).join(', '),
            uom: items.map(i => i.uom).filter(Boolean).join(', '),
            factory,
            type,
            items,
        };

        // Get Apps Script Web App URL from localStorage
        const SHEETS_URL = localStorage.getItem('SHEETS_WEBHOOK_URL') || 'https://script.google.com/macros/s/AKfycbxhYeC_LpAS7nYfGTF6NcStnIO9Sh7tSPxNA8sthWrbVfrkMd9qrPdqjCVPD39WgMPFiw/exec';

        try {
            if (SHEETS_URL) {
                const response = await fetch(SHEETS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });

                const resultText = await response.text();
                let result;
                try {
                    result = JSON.parse(resultText);
                } catch (e) {
                    throw new Error("Invalid response from Google Sheets webhook.");
                }

                if (result.success === false || result.status && result.status !== "success") {
                    throw new Error(result.error || "Apps script returned an error.");
                }
            }
            onSave({ id: uid(), date, vendor, invoiceNo, factory, type, totalValue, direction, items });
            setSaving(false);
            reset();
        } catch (err) {
            setSaving(false);
            alert('Save failed: ' + (err.message || 'Check your Sheets URL.'));
        }
    };

    const canSave = scanned && factory && type;

    return (
        <div>
            <div className="two-col" style={{ marginBottom: '2rem' }}>

                {/* ── LEFT column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Preview */}
                    <div className="preview-box">
                        {preview === '__loading__' ? (
                            <div className="placeholder-inner">
                                <div className="spinner" style={{ width: 30, height: 30, borderTopColor: 'var(--orange)' }} />
                                <span style={{ fontSize: '.75rem', marginTop: '.5rem' }}>Processing PDF...</span>
                            </div>
                        ) : preview && preview !== '__pdf__' ? (
                            <>
                                <img src={preview} alt="Invoice" />
                                {scanning && (
                                    <div className="scan-overlay">
                                        <div className="scan-laser" />
                                        <div style={{
                                            position: 'absolute', bottom: '1rem',
                                            background: 'rgba(6,9,15,.75)', borderRadius: '6px',
                                            padding: '.4rem .8rem', fontSize: '.72rem', color: 'var(--blue)',
                                            fontFamily: 'var(--mono)', letterSpacing: '.08em'
                                        }}>
                                            SCANNING… {scanPct}%
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="placeholder-inner">
                                <Ico d={icons.doc} size={38} stroke="var(--text3)" />
                                <span>{preview === '__pdf__' ? 'PDF Loaded' : 'No document selected'}</span>
                                <span style={{ fontSize: '.67rem', color: 'var(--text3)' }}>
                                    {preview === '__pdf__' ? file?.name : 'Capture or upload below'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Upload cards */}
                    <div className="upload-cards">
                        {/* Camera card — opens live in-browser camera */}
                        <div className="upload-card" onClick={openCamera} style={{ cursor: 'pointer' }}>
                            <span className="card-icon">📷</span>
                            <span className="card-label">Camera</span>
                        </div>

                        {/* File upload card */}
                        <label className="upload-card" htmlFor="file-input">
                            <span className="card-icon">📂</span>
                            <span className="card-label">Upload</span>
                            <input
                                id="file-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={e => handleFile(e.target.files?.[0])}
                                onClick={e => e.target.value = ''}
                            />
                        </label>
                    </div>

                    {/* Drag-drop OR drag hint */}
                    <div
                        className={`dropzone${dragging ? ' over' : ''}`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileRef.current?.click()}
                        style={{ padding: '1rem' }}
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            style={{ display: 'none' }}
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={e => handleFile(e.target.files?.[0])}
                        />
                        <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                            {file
                                ? <span style={{ color: 'var(--text2)' }}>📄 {file.name}</span>
                                : <>Drop invoice here &ndash; <span style={{ color: 'var(--blue)' }}>JPG · PNG · PDF</span></>
                            }
                        </div>
                    </div>

                    {/* Groq Vision — Smart Extraction */}
                    <div style={{ fontSize: '.7rem', color: 'var(--text3)', padding: '.4rem .6rem', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                        🚀 Smart Extraction via Groq Llama-4 Vision (Ultra Fast)
                    </div>

                    {/* Scan button */}
                    <button
                        id="btn-scan"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '.8rem', fontSize: '.88rem', letterSpacing: '.05em' }}
                        disabled={!file || scanning}
                        onClick={() => doScan()}
                    >
                        {scanning
                            ? <><div className="spinner" style={{ width: 15, height: 15 }} /> Reading invoice…</>
                            : <><Ico d={icons.rows} size={16} /> Scan Invoice</>
                        }
                    </button>
                    {scanning && (
                        <div className="scan-progress">
                            <div className="scan-progress-fill" style={{ width: `${scanPct}%`, transition: 'width .3s ease' }} />
                        </div>
                    )}
                    {scanError && (
                        <div style={{
                            background: 'rgba(248,113,113,.09)', border: '1px solid rgba(248,113,113,.3)',
                            borderRadius: 'var(--r)', padding: '.7rem .9rem',
                            fontSize: '.75rem', color: 'var(--red)', fontFamily: 'var(--mono)',
                            display: 'flex', gap: '.5rem', alignItems: 'flex-start',
                        }}>
                            <span style={{ flexShrink: 0 }}>⚠</span>
                            <span>{scanError}</span>
                        </div>
                    )}
                </div>

                {/* ── RIGHT column ── */}
                <div>
                    {/* Empty state */}
                    {!scanned && !scanning && (
                        <div className="form-placeholder">
                            <div className="big-icon">🧾</div>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '.3rem', color: 'var(--text2)' }}>No invoice scanned yet</div>
                                <div style={{ fontSize: '.75rem', lineHeight: 1.7 }}>
                                    Upload or photograph your invoice,<br />then tap <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Scan Invoice</span> to extract data.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scanning skeleton */}
                    {scanning && (
                        <div className="scan-state">
                            <div className="spinner spinner-blue" style={{ width: 32, height: 32 }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.3rem' }}>AI Processing…</div>
                                <div style={{ color: 'var(--text3)', fontSize: '.75rem', fontFamily: 'var(--mono)' }}>
                                    {scanPct < 50 ? 'Reading image data…' : 'Extracting fields with Groq Llama-4 Vision…'}
                                </div>
                            </div>
                            <div style={{ width: '100%', maxWidth: '240px' }}>
                                <div style={{ fontSize: '.68rem', color: 'var(--text3)', textAlign: 'center', marginBottom: '.4rem', fontFamily: 'var(--mono)' }}>
                                    {scanPct}% complete
                                </div>
                                <div className="scan-progress" style={{ height: '4px' }}>
                                    <div className="scan-progress-fill" style={{ width: `${scanPct}%`, transition: 'width .3s ease' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scanned form */}
                    {scanned && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="sec">Confirm Extracted Fields</div>

                            {/* Row: Date + Invoice No */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' }}>
                                <div className="field fade-up">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                        <span className="dot-ok" />Date
                                    </label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                                <div className="field fade-up">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                        <span className="dot-ok" />Invoice No.
                                    </label>
                                    <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV/2024/001" />
                                </div>
                            </div>

                            {/* Row: Vendor + Consignee */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' }}>
                                <div className="field fade-up">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                        <span className="dot-ok" />Vendor / Supplier
                                    </label>
                                    <input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Supplier name" />
                                </div>
                                <div className="field fade-up">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                        <span className="dot-ok" />Consignee (Ship To)
                                    </label>
                                    <input value={consignee} onChange={e => setConsignee(e.target.value)} placeholder="Ship to company name" />
                                </div>
                            </div>

                            {/* Row: PO Number + GSTIN */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' }}>
                                <div className="field fade-up">
                                    <label>PO / Order No.</label>
                                    <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="PO number" />
                                </div>
                                <div className="field fade-up">
                                    <label>GSTIN</label>
                                    <input value={gstin} onChange={e => setGstin(e.target.value)} placeholder="15-char GSTIN" style={{ fontFamily: 'var(--mono)', fontSize: '.78rem' }} />
                                </div>
                            </div>

                            {/* ── Integrated Calculation & Items Section ── */}
                            <div style={{
                                background: 'var(--bg2)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--r-lg)',
                                padding: '1.25rem',
                                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.2)'
                            }}>
                                <div className="sec" style={{ marginBottom: '.9rem' }}>Invoice Calculation & Summary</div>

                                {/* Totals Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                                    gap: '.8rem',
                                    marginBottom: '1.5rem',
                                    background: 'var(--surface)',
                                    padding: '1rem',
                                    borderRadius: 'var(--r)',
                                    border: '1px solid var(--border)'
                                }}>
                                    {[
                                        { label: 'Taxable Val', val: taxableValue, set: setTaxableValue },
                                        { label: 'CGST (₹)', val: cgst, set: setCgst },
                                        { label: 'SGST (₹)', val: sgst, set: setSgst },
                                        { label: 'IGST (₹)', val: igst, set: setIgst },
                                        { label: 'Total Amount', val: amount, set: setAmount, highlight: true },
                                    ].filter(x => x.label !== 'IGST (₹)' || x.val).map(({ label, val, set, highlight }) => (
                                        <div className="field fade-up" key={label}>
                                            <label style={{ fontSize: '.65rem', color: highlight ? 'var(--orange)' : 'var(--text3)' }}>{label}</label>
                                            <div className="prefix-wrap">
                                                <span className="pfx" style={{ fontSize: '.7rem' }}>₹</span>
                                                <input
                                                    type="number"
                                                    value={val}
                                                    onChange={e => set(e.target.value)}
                                                    placeholder="0"
                                                    style={{
                                                        fontSize: highlight ? '.9rem' : '.8rem',
                                                        fontWeight: highlight ? 800 : 500,
                                                        borderColor: highlight ? 'var(--orange)' : 'var(--border)',
                                                        background: highlight ? 'var(--orange-dim)' : 'var(--bg)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Items Header Label (Optional reference) */}
                                <div style={{ marginBottom: '.6rem', marginLeft: '.5rem' }}>
                                    <span style={{ fontSize: '.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                                        Itemized Breakdown
                                    </span>
                                </div>

                                {/* Items List */}
                                <div>
                                    {items.map((item, idx) => (
                                        <LineItem
                                            key={item.id}
                                            item={item}
                                            idx={idx}
                                            isNew={newItemIds.has(item.id)}
                                            onChange={updateItem}
                                            onRemove={removeItem}
                                        />
                                    ))}
                                </div>
                                <button
                                    className="btn btn-ghost"
                                    style={{ marginTop: '.65rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}
                                    onClick={addItem}
                                >
                                    <Ico d={icons.plus} size={13} /> Add Row
                                </button>
                            </div>

                            {/* Factory & Type */}
                            <div>
                                <div className="sec">Factory &amp; Type</div>
                                <div className="field" style={{ marginBottom: '.75rem' }}>
                                    <label>Factory</label>
                                    <div className="pills">
                                        {FACTORIES.map(f => (
                                            <button key={f} className={`pill btn${factory === f ? ' on' : ''}`} onClick={() => setFactory(f)}>{f}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="field">
                                    <label>Type</label>
                                    <div className="pills">
                                        {TYPES.map(t => (
                                            <button key={t} className={`pill btn${type === t ? ' on' : ''}`} onClick={() => setType(t)}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* OCR info */}
                            {/* API config */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' }}>
                                <div className="field">
                                    <label style={{ color: 'var(--text3)' }}>Groq API Key</label>
                                    <input
                                        type="password"
                                        placeholder="gsk_..."
                                        defaultValue={typeof localStorage !== 'undefined' ? localStorage.getItem('AI_API_KEY') || '' : ''}
                                        onChange={e => localStorage.setItem('AI_API_KEY', e.target.value.trim())}
                                        style={{ fontSize: '.73rem', fontFamily: 'var(--mono)', borderColor: 'var(--surface2)' }}
                                    />
                                </div>
                                <div className="field">
                                    <label style={{ color: 'var(--text3)' }}>Google Sheet Webhook (Link to Sheet: https://docs.google.com/spreadsheets/d/1bCjWn9PBbYzEKhQR6QronAC1IkfeaaTMsHmGUmo5R-k/edit)</label>
                                    <input
                                        placeholder="https://script.google.com/..."
                                        defaultValue={typeof localStorage !== 'undefined' ? localStorage.getItem('SHEETS_WEBHOOK_URL') || '' : ''}
                                        onChange={e => localStorage.setItem('SHEETS_WEBHOOK_URL', e.target.value.trim())}
                                        style={{ fontSize: '.73rem', fontFamily: 'var(--mono)' }}
                                    />
                                </div>
                            </div>

                            {/* Save */}
                            <button
                                id="btn-save"
                                className="btn btn-save"
                                disabled={!canSave || saving}
                                onClick={doSave}
                            >
                                {saving
                                    ? <><div className="spinner" /> Saving to Sheet…</>
                                    : <><Ico d={icons.save} size={17} /> Confirm &amp; Save to Sheet</>
                                }
                            </button>
                            {(!factory || !type) && scanned && (
                                <p style={{ fontSize: '.7rem', color: 'var(--text3)', textAlign: 'center', marginTop: '-.4rem' }}>
                                    Select a factory and type to save
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Camera modal */}
            {showCamera && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.96)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
                    padding: '1rem'
                }}>
                    <video
                        ref={cameraRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            maxWidth: '100%', maxHeight: '70vh',
                            borderRadius: 'var(--r-lg)',
                            border: '2px solid var(--border2)',
                            background: '#000'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={closeCamera}
                            style={{
                                background: 'var(--surface2)', color: 'var(--text2)',
                                border: '1px solid var(--border)', borderRadius: 'var(--r)',
                                padding: '.6rem 1.2rem', cursor: 'pointer', fontSize: '.85rem'
                            }}
                        >✕ Close</button>
                        <button
                            onClick={capturePhoto}
                            style={{
                                background: 'var(--orange)', color: '#000',
                                border: 'none', borderRadius: '50%',
                                width: '64px', height: '64px',
                                cursor: 'pointer', fontSize: '1.6rem',
                                boxShadow: '0 0 0 4px var(--orange-dim)'
                            }}
                        >📸</button>
                    </div>
                </div>
            )}

            {/* Recent entries */}
            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '1.25rem 1.25rem',
            }}>
                <div className="sec">Recent Entries</div>
                <RecentEntries entries={savedEntries} />
            </div>
        </div>
    );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
const App = () => {
    const [tab, setTab] = useState('INWARDS');
    const [entries, setEntries] = useState([]);
    const [toast, setToast] = useState(null);
    const [directionWarning, setDirectionWarning] = useState(null);

    const handleSave = e => {
        setEntries(p => [...p, e]);
        setToast(`✓ Saved · ${e.factory} · ₹${Number(e.totalValue).toLocaleString('en-IN')}`);
    };

    const inward = entries.filter(e => e.direction === 'INWARDS');
    const outward = entries.filter(e => e.direction === 'OUTWARDS');
    const current = tab === 'INWARDS' ? inward : outward;

    return (
        <>
            <Styles />

            {/* ── Topbar ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(7,9,26,.92)',
                backdropFilter: 'blur(18px)',
                borderBottom: '1px solid var(--border)',
                padding: '0 1.5rem',
                height: '58px',
                display: 'flex', alignItems: 'center', gap: '1.25rem',
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexShrink: 0 }}>
                    <div style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: 'linear-gradient(135deg,var(--orange-mid),var(--orange-deep))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.85rem', fontWeight: 800, color: '#000', fontFamily: 'var(--sans)',
                        boxShadow: '0 2px 10px rgba(249,115,22,.35)',
                    }}>T</div>
                    <div>
                        <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: '1rem', letterSpacing: '.03em', lineHeight: 1 }}>
                            TROOGOOD
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '.58rem', color: 'var(--text3)', letterSpacing: '.12em', lineHeight: 1, marginTop: '.15rem' }}>
                            INVOICE MGMT
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <nav style={{ display: 'flex', gap: '.35rem', marginLeft: '.5rem' }}>
                    {[
                        { id: 'INWARDS', label: '↓ Inwards' },
                        { id: 'OUTWARDS', label: '↑ Outwards' },
                    ].map(t => (
                        <button
                            key={t.id}
                            id={`tab-${t.id.toLowerCase()}`}
                            className={`nav-tab${tab === t.id ? ' active' : ''}`}
                            onClick={() => { setTab(t.id); setDirectionWarning(null); }}
                        >{t.label}</button>
                    ))}
                </nav>

                {/* Right */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.7rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                        <span className="dot-live" />
                        LIVE
                    </div>
                    <div style={{
                        fontFamily: 'var(--mono)', fontSize: '.68rem', color: 'var(--text3)',
                        display: 'none',
                    }}
                        className="hide-mobile"
                    >
                        {current.length} record{current.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </header>

            {/* ── Direction warning banner ── */}
            {directionWarning && (
                <div style={{
                    position: 'sticky', top: '58px', zIndex: 99,
                    background: '#78350f',
                    borderBottom: '3px solid #f59e0b',
                    padding: '.75rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    animation: 'slideDownBanner .2s ease',
                }}>
                    <style>{`@keyframes slideDownBanner{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}`}</style>
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>⚠️</span>
                    <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.78rem', color: '#fde68a', textTransform: 'uppercase', letterSpacing: '.06em', marginRight: '.5rem' }}>
                                Wrong Tab —
                            </span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: '#fef3c7' }}>
                                {directionWarning.message}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                            <button
                                onClick={() => { setTab(directionWarning.detected); setDirectionWarning(null); }}
                                style={{
                                    background: '#f59e0b', border: 'none', borderRadius: '5px',
                                    color: '#000', fontFamily: 'var(--mono)', fontWeight: 700,
                                    fontSize: '.74rem', padding: '.38rem .9rem',
                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                            >
                                Switch to {directionWarning.detected === 'OUTWARDS' ? '↑ Outwards' : '↓ Inwards'}
                            </button>
                            <button
                                onClick={() => setDirectionWarning(null)}
                                style={{
                                    background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)',
                                    borderRadius: '5px', color: '#fde68a',
                                    fontFamily: 'var(--mono)', fontWeight: 600,
                                    fontSize: '.74rem', padding: '.38rem .75rem',
                                    cursor: 'pointer',
                                }}
                            >✕ Dismiss</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page header ── */}
            <div style={{
                borderBottom: '1px solid var(--border)',
                padding: '1.25rem 1.5rem .9rem',
                background: 'var(--bg2)',
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                        <h1 style={{
                            fontFamily: 'var(--sans)', fontWeight: 800,
                            fontSize: 'clamp(1.3rem,3vw,1.75rem)',
                            letterSpacing: '.02em', lineHeight: 1.1,
                            color: 'var(--white)',
                        }}>
                            {tab === 'INWARDS' ? 'Goods Inward' : 'Goods Outward'}
                        </h1>
                        <p style={{ fontSize: '.76rem', color: 'var(--text3)', marginTop: '.3rem', fontFamily: 'var(--ui)' }}>
                            {tab === 'INWARDS'
                                ? 'Scan and log incoming supplier invoices'
                                : 'Record and log outgoing dispatch invoices'
                            }
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Saved today</div>
                        <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--orange)', lineHeight: 1 }}>
                            {current.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main ── */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
                {tab === 'INWARDS' ? (
                    <TabPanel key="in" direction="INWARDS" savedEntries={inward} onSave={handleSave} onWarnDirection={setDirectionWarning} />
                ) : (
                    <TabPanel key="out" direction="OUTWARDS" savedEntries={outward} onSave={handleSave} onWarnDirection={setDirectionWarning} />
                )}
            </main>

            {/* ── Footer ── */}
            <footer style={{
                borderTop: '1px solid var(--border)', padding: '.85rem 1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg2)',
            }}>
                <span style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.72rem', color: 'var(--text3)' }}>
                    Troogood · IMS
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: 'var(--text3)' }}>
                    Internal Operations · ML Edition
                </span>
            </footer>

            {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);