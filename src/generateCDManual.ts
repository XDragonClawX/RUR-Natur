/**
 * Generates the RUR NATUR Corporate Design Manual as a printable HTML document.
 */
export function generateCDManual(): void {
  const html = buildHTML();
  const win = window.open('', '_blank');
  if (!win) {
    alert('Bitte erlaube Pop-ups für diese Seite, um das CD Manual zu öffnen.');
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 700);
}

// ─── Color data ───────────────────────────────────────────────────────────────

const BRAND_COLORS = [
  { name: 'Brand Green',    hex: '#4A7A3A', token: '--color-brand-green',    role: 'Primärfarbe · Hauptbuttons · Aktive Zustände · Erfolg' },
  { name: 'Brand Teal',     hex: '#2A6F7E', token: '--color-brand-teal',     role: 'Sekundärfarbe · Links · Labels · Eyebrow-Text · Icons' },
  { name: 'Brand Lightsky', hex: '#7FA8B5', token: '--color-brand-lightsky', role: 'Akzentfarbe · Borders · Divider · Scrollbar · Dekorativ' },
  { name: 'Brand Dark',     hex: '#3A3F45', token: '--color-brand-dark',     role: 'Neutralfarbe · Datentext · Subtitel · Grafik-Elemente' },
  { name: 'Brand BG',       hex: '#ECEDEF', token: '--color-brand-bg',       role: 'Hintergrund · App-Canvas · Außenflächen' },
];

const SURFACE_COLORS = [
  { name: 'Parchment Deep', hex: '#E8E2D6', role: 'Tabellen-Header · Sidebar-BG · Trennflächen' },
  { name: 'Parchment Mid',  hex: '#F2EDE4', role: 'Modal-Hintergrund · Card-BG · Warm-Surfaces' },
  { name: 'Parchment Soft', hex: '#F8F5EF', role: 'Hover-Zustände · Zebra-Streifen · Sanfte Flächen' },
  { name: 'White Warm',     hex: '#FCFBF9', role: 'Karten-Hintergrund · Kontrastfläche auf Parchment' },
  { name: 'White Pure',     hex: '#FFFFFF', role: 'Modal-Innenfläche · Formularfelder · Maximum Kontrast' },
];

const TEXT_COLORS = [
  { name: 'Text Primary',   hex: '#2C3322', role: 'Alle Haupttexte · Headings · Beschriftungen' },
  { name: 'Text Forest',    hex: '#3C4331', role: 'Fließtext auf Parchment · Detailtexte' },
  { name: 'Text Mid',       hex: '#5C5549', role: 'Sekundärtexte · Beschreibungen · Subtexte' },
  { name: 'Text Dim',       hex: '#8B8273', role: 'Label-Text · Metadaten · Platzhalter · Timestamps' },
  { name: 'Border Warm',    hex: '#D4CCBA', role: 'Standardrahmen · Trennlinien · Input-Borders' },
];

const FUNCTIONAL_COLORS = [
  { name: 'Amber / Warnung', hex: '#BC6C25', role: 'Kosten · Unterhalt · Warnung · Klimarisiko' },
  { name: 'Purple / Spezial', hex: '#6B52AE', role: 'Feedback-CTA · Forschungsbaum · Upgrade · Spezialaktionen' },
  { name: 'Red / Fehler',    hex: '#B91C1C', role: 'Kritische Fehler · Katastrophen · Rote Liste Warnungen' },
];

const CATEGORY_COLORS = [
  { name: 'Ökologie',      hex: '#5A7247', bg: 'rgba(90,114,71,.1)',   label: 'ecology',      icon: '🌿' },
  { name: 'Hydrologie',    hex: '#457B9D', bg: 'rgba(69,123,157,.1)', label: 'water',        icon: '🌊' },
  { name: 'Artenschutz',   hex: '#D97706', bg: 'rgba(217,119,6,.1)',  label: 'fauna',        icon: '🦫' },
  { name: 'Tourismus',     hex: '#14B8A6', bg: 'rgba(20,184,166,.1)', label: 'tourism',      icon: '🏕️' },
  { name: 'Wirtschaft',    hex: '#64748B', bg: 'rgba(100,116,139,.1)',label: 'economy',      icon: '💶' },
  { name: 'Infrastruktur', hex: '#A855F7', bg: 'rgba(168,85,247,.1)', label: 'infra',        icon: '🚇' },
];

// ─── Main HTML ────────────────────────────────────────────────────────────────

function buildHTML(): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"/>
<title>RUR NATUR – Corporate Design Manual</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
/* ── Reset ─────────────────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{font-size:10pt;}
body{font-family:'Inter',sans-serif;color:#2C3322;background:#fff;line-height:1.55;}

/* ── Tokens ────────────────────────────────────────── */
:root{
  --green:#4A7A3A; --green-dk:#3A6230; --green-lt:#E2EBD5;
  --teal:#2A6F7E;  --sky:#7FA8B5;      --dark:#3A3F45;
  --bg:#ECEDEF;    --amber:#BC6C25;    --purple:#6B52AE;
  --red:#B91C1C;
  --parch-deep:#E8E2D6; --parch-mid:#F2EDE4; --parch-soft:#F8F5EF;
  --white-warm:#FCFBF9;
  --text-1:#2C3322; --text-2:#5C5549;  --text-3:#8B8273;
  --border:#D4CCBA;
  --font-sans:'Inter',sans-serif;
  --font-display:'Space Grotesk',sans-serif;
  --font-mono:'JetBrains Mono',monospace;
}

/* ── Page ──────────────────────────────────────────── */
@page{size:A4;margin:16mm 14mm 16mm 14mm;}
@media print{
  body{font-size:8.5pt;}
  .no-print{display:none!important;}
  .page-break{page-break-before:always;break-before:page;}
  .avoid-break{page-break-inside:avoid;break-inside:avoid;}
}
@media screen{
  body{max-width:210mm;margin:0 auto;padding:16mm 14mm;background:#DDD8CC;}
  .page{background:#fff;padding:16mm 14mm;margin-bottom:8mm;box-shadow:0 2px 20px rgba(0,0,0,.14);}
}

/* ── Type Scale ────────────────────────────────────── */
h1,h2,h3,h4,h5{font-family:var(--font-display);line-height:1.2;}
.label{font-family:var(--font-mono);font-size:7pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--text-3);}
.mono{font-family:var(--font-mono);}
code{font-family:var(--font-mono);font-size:8pt;background:var(--parch-deep);padding:0 2mm;border-radius:3px;color:var(--dark);}

/* ── Cover ─────────────────────────────────────────── */
.cover{min-height:240mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;border:3px solid var(--green);border-radius:10px;padding:24mm 20mm;position:relative;overflow:hidden;}
.cover::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(74,122,58,.04) 0%,transparent 50%,rgba(42,111,126,.04) 100%);pointer-events:none;}
.cover-eyebrow{font-family:var(--font-mono);font-size:7.5pt;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:var(--teal);margin-bottom:5mm;}
.cover-title{font-size:48pt;font-weight:900;color:var(--text-1);line-height:1;}
.cover-title span{color:var(--green);}
.cover-rule{width:40mm;height:3px;background:linear-gradient(90deg,var(--green),var(--teal));border-radius:2px;margin:6mm auto;}
.cover-subtitle{font-size:13pt;font-weight:700;color:var(--teal);letter-spacing:.08em;margin-bottom:8mm;}
.cover-desc{font-size:10pt;color:var(--text-2);max-width:130mm;line-height:1.65;margin-bottom:12mm;}
.cover-meta{font-family:var(--font-mono);font-size:8pt;color:var(--text-3);border-top:1px solid var(--border);padding-top:4mm;width:100%;}

/* ── Chapter Header ────────────────────────────────── */
.chapter{margin-bottom:7mm;}
.chapter-label{font-family:var(--font-mono);font-size:7pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--teal);margin-bottom:1mm;}
.chapter-title{font-size:20pt;font-weight:900;color:var(--text-1);margin-bottom:1.5mm;}
.chapter-sub{font-size:9pt;color:var(--text-2);margin-bottom:4mm;}
.chapter-rule{height:3px;background:linear-gradient(90deg,var(--green) 0%,var(--sky) 60%,transparent 100%);border-radius:2px;margin-bottom:6mm;}

/* ── Section ───────────────────────────────────────── */
.section-title{font-size:11pt;font-weight:800;color:var(--text-1);margin:6mm 0 3mm;padding-bottom:1.5mm;border-bottom:1.5px solid var(--border);}
.section-sub{font-size:8.5pt;color:var(--text-2);margin-bottom:3mm;}

/* ── Color Swatches ────────────────────────────────── */
.swatch-row{display:grid;gap:3mm;margin-bottom:4mm;}
.swatch-row-5{grid-template-columns:repeat(5,1fr);}
.swatch-row-4{grid-template-columns:repeat(4,1fr);}
.swatch-row-3{grid-template-columns:repeat(3,1fr);}
.swatch-row-6{grid-template-columns:repeat(6,1fr);}
.swatch{border-radius:8px;overflow:hidden;border:1.5px solid rgba(0,0,0,.08);}
.swatch-color{height:20mm;}
.swatch-info{background:var(--parch-soft);padding:2.5mm;border-top:1px solid var(--border);}
.swatch-name{font-weight:700;font-size:8pt;color:var(--text-1);display:block;}
.swatch-hex{font-family:var(--font-mono);font-size:7.5pt;color:var(--text-2);display:block;margin:0.5mm 0;}
.swatch-role{font-size:7pt;color:var(--text-3);line-height:1.4;display:block;}

/* ── Typography Samples ────────────────────────────── */
.type-sample{border:1.5px solid var(--border);border-radius:8px;padding:4mm;margin-bottom:3mm;}
.type-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:2mm;}
.type-badge{font-family:var(--font-mono);font-size:7pt;font-weight:700;background:var(--parch-deep);padding:1mm 2.5mm;border-radius:4px;color:var(--text-2);}
.type-scale{margin-bottom:5mm;}
.type-scale-row{display:flex;align-items:baseline;gap:5mm;padding:2mm 0;border-bottom:1px solid var(--parch-deep);}
.type-scale-row:last-child{border:none;}
.type-scale-label{font-family:var(--font-mono);font-size:7pt;color:var(--text-3);min-width:28mm;}
.weight-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;}
.weight-card{border:1.5px solid var(--border);border-radius:8px;padding:3.5mm;text-align:center;}

/* ── Component Demos ───────────────────────────────── */
.comp-row{display:flex;flex-wrap:wrap;gap:3mm;align-items:flex-start;margin-bottom:4mm;}
.comp-section{border:1.5px solid var(--border);border-radius:10px;padding:4mm;margin-bottom:4mm;}
.comp-section-title{font-size:8pt;font-weight:800;font-family:var(--font-display);color:var(--text-1);margin-bottom:3mm;padding-bottom:1.5mm;border-bottom:1px dashed var(--border);}

/* ── Buttons ───────────────────────────────────────── */
.btn{display:inline-flex;align-items:center;gap:2mm;padding:2.5mm 5mm;border-radius:8px;font-family:var(--font-display);font-size:8pt;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border:1.5px solid transparent;cursor:default;}
.btn-primary{background:var(--green);color:#fff;border-color:var(--green);}
.btn-secondary{background:var(--parch-deep);color:var(--text-1);border-color:var(--border);}
.btn-teal{background:#E5F2F5;color:#1D4E5B;border-color:#B0D3DC;}
.btn-green-soft{background:var(--green-lt);color:#2C3311;border-color:#B8C8A3;}
.btn-amber{background:#FDF6EC;color:#7A3F1F;border-color:#DCC5A3;}
.btn-purple{background:#EDE8F5;color:#3D2C6E;border-color:#C8BAE8;}
.btn-danger{background:#FEF2F2;color:#B91C1C;border-color:#FECACA;}
.btn-round{border-radius:9999px;}

/* ── Cards ─────────────────────────────────────────── */
.card{border:1.5px solid var(--border);border-radius:12px;padding:4mm;background:#fff;}
.card-modal{border:2px solid var(--border);border-radius:16px;padding:5mm;background:var(--parch-mid);}
.card-highlight{border:2px solid var(--green);border-radius:12px;padding:4mm;background:#fff;}

/* ── Badges / Pills ────────────────────────────────── */
.badge{display:inline-block;padding:0.5mm 2.5mm;border-radius:20px;font-size:7.5pt;font-weight:700;border:1px solid;}
.badge-ecology {color:#5a7247;background:rgba(90,114,71,.1); border-color:rgba(90,114,71,.25);}
.badge-water   {color:#457b9d;background:rgba(69,123,157,.1);border-color:rgba(69,123,157,.25);}
.badge-fauna   {color:#d97706;background:rgba(217,119,6,.1); border-color:rgba(217,119,6,.25);}
.badge-tourism {color:#14b8a6;background:rgba(20,184,166,.1);border-color:rgba(20,184,166,.25);}
.badge-economy {color:#64748b;background:rgba(100,116,139,.1);border-color:rgba(100,116,139,.25);}
.badge-infra   {color:#a855f7;background:rgba(168,85,247,.1);border-color:rgba(168,85,247,.25);}
.badge-mono    {font-family:var(--font-mono);font-size:7pt;background:var(--parch-deep);color:var(--text-2);border-color:var(--border);border-radius:4px;}

/* ── Table ─────────────────────────────────────────── */
table.demo{width:100%;border-collapse:collapse;font-size:8.5pt;}
table.demo thead tr{background:var(--parch-deep);}
table.demo th{text-align:left;padding:2mm 3mm;font-family:var(--font-mono);font-size:7pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-3);border-bottom:1.5px solid var(--border);}
table.demo td{padding:2mm 3mm;border-bottom:1px solid #EDE8DF;vertical-align:top;}
table.demo tr:last-child td{border:none;}
table.demo tr:nth-child(even) td{background:var(--parch-soft);}

/* ── Rule Boxes ────────────────────────────────────── */
.rule-box{border-left:4px solid var(--green);background:#F4F8F1;border-radius:0 8px 8px 0;padding:3.5mm 4mm;margin-bottom:3mm;font-size:9pt;}
.rule-box.teal  {border-color:var(--teal);  background:#F0F7FA;}
.rule-box.amber {border-color:var(--amber); background:#FDF6EC;}
.rule-box.purple{border-color:var(--purple);background:#F5F2FC;}
.rule-box.red   {border-color:var(--red);   background:#FEF2F2;}
.rule-box.sky   {border-color:var(--sky);   background:#F3F8FA;}

/* ── Mono Label pattern ─────────────────────────────── */
.eyebrow{font-family:var(--font-mono);font-size:7pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;}
.hud-stat{border:1.5px solid var(--border);border-radius:10px;padding:2.5mm 3.5mm;background:var(--parch-mid);}

/* ── Icon circle ────────────────────────────────────── */
.icon-circle{width:12mm;height:12mm;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16pt;}

/* ── Spacing grid ───────────────────────────────────── */
.spacing-row{display:flex;align-items:center;gap:4mm;padding:1.5mm 0;border-bottom:1px solid var(--parch-deep);font-size:8pt;}
.spacing-row:last-child{border:none;}
.spacing-bar{background:var(--green);border-radius:2px;height:4mm;}
.spacing-label{font-family:var(--font-mono);font-size:7.5pt;min-width:18mm;color:var(--text-1);font-weight:700;}
.spacing-val{font-family:var(--font-mono);font-size:7.5pt;color:var(--text-3);}

/* ── Radius samples ─────────────────────────────────── */
.radius-grid{display:flex;gap:4mm;flex-wrap:wrap;margin-bottom:4mm;}
.radius-box{width:22mm;height:14mm;border:2px solid var(--green);display:flex;align-items:center;justify-content:center;font-size:7.5pt;font-family:var(--font-mono);font-weight:700;color:var(--text-2);}

/* ── Do/Don't ───────────────────────────────────────── */
.dd-grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-bottom:4mm;}
.dd-do{border:2px solid #15803d;border-radius:10px;padding:4mm;}
.dd-dont{border:2px solid var(--red);border-radius:10px;padding:4mm;}
.dd-header{font-size:9pt;font-weight:800;margin-bottom:2mm;display:flex;align-items:center;gap:2mm;}
.dd-do .dd-header{color:#15803d;}
.dd-dont .dd-header{color:var(--red);}
.dd-item{font-size:8.5pt;color:var(--text-2);margin-bottom:1.5mm;padding-left:3mm;position:relative;}
.dd-item::before{content:'•';position:absolute;left:0;}

/* ── Motion ─────────────────────────────────────────── */
.motion-row{display:flex;align-items:center;gap:4mm;padding:2mm 0;border-bottom:1px solid var(--parch-deep);font-size:8.5pt;}
.motion-row:last-child{border:none;}
.motion-name{font-family:var(--font-mono);font-weight:700;min-width:36mm;color:var(--text-1);}
.motion-val{font-family:var(--font-mono);color:var(--teal);min-width:30mm;}

/* ── Grid preview ───────────────────────────────────── */
.grid-preview{display:grid;gap:2mm;margin-bottom:3mm;}
.grid-preview-2{grid-template-columns:1fr 1fr;}
.grid-preview-3{grid-template-columns:1fr 1fr 1fr;}
.grid-col{background:rgba(42,111,126,.08);border:1.5px solid rgba(42,111,126,.2);border-radius:6px;padding:2.5mm;font-size:7.5pt;font-family:var(--font-mono);color:var(--teal);text-align:center;}

/* ── Logo construction ──────────────────────────────── */
.logo-zone{border:1.5px dashed var(--border);border-radius:8px;padding:6mm;display:flex;align-items:center;justify-content:center;gap:4mm;}

/* ── Print btn ──────────────────────────────────────── */
.print-btn{position:fixed;bottom:20px;right:20px;background:var(--green);color:#fff;font-family:var(--font-display);font-weight:800;font-size:11pt;padding:3mm 7mm;border-radius:8px;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);z-index:999;}
@media print{.print-btn{display:none;}}
.footer-bar{margin-top:8mm;border-top:1.5px solid var(--border);padding-top:3mm;display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7.5pt;color:var(--text-3);}
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Als PDF speichern</button>

<!-- ═══ COVER ═══════════════════════════════════════════════════════════════ -->
<div class="page">
<div class="cover">
  <div class="cover-eyebrow">Corporate Design Manual</div>
  <h1 class="cover-title">RUR <span>NATUR</span></h1>
  <div class="cover-rule"></div>
  <div class="cover-subtitle">Brand Identity Guidelines</div>
  <p class="cover-desc">
    Vollständige Gestaltungsrichtlinien für den Renaturierungs-Simulator Kreis Düren.
    Dieses Manual definiert Farben, Typografie, Komponenten, Abstände und
    Anwendungsregeln für eine konsistente Markenerscheinung.
  </p>

  <div style="display:flex;gap:4mm;flex-wrap:wrap;justify-content:center;margin-bottom:10mm;">
    ${[
      ['Kapitel 1', 'Markenidentität & Logo'],
      ['Kapitel 2', 'Farbsystem'],
      ['Kapitel 3', 'Typografie'],
      ['Kapitel 4', 'Abstände & Layout'],
      ['Kapitel 5', 'Komponenten'],
      ['Kapitel 6', 'Ikonografie & Emojis'],
      ['Kapitel 7', 'Motion & Interaktion'],
      ['Kapitel 8', 'Do\'s & Don\'ts'],
    ].map(([n, l]) => `<span style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;background:var(--parch-mid);border:1.5px solid var(--border);border-radius:20px;padding:1.5mm 4mm;color:var(--text-2);"><strong style="color:var(--teal);">${n}</strong> ${l}</span>`).join('')}
  </div>

  <div class="cover-meta">
    <div style="display:flex;justify-content:space-between;">
      <span>RUR NATUR · Renaturierungs-Simulator · Kreis Düren</span>
      <span>Version 1.0 · 2026</span>
    </div>
  </div>
</div>
</div>

<!-- ═══ CH 1: BRAND IDENTITY ════════════════════════════════════════════════ -->
<div class="page page-break">
<div class="chapter avoid-break">
  <div class="chapter-label">Kapitel 1</div>
  <h2 class="chapter-title">Markenidentität & Logo</h2>
  <div class="chapter-sub">Markenkern · Logo-Konstruktion · Schutzraum · Falsche Anwendungen</div>
  <div class="chapter-rule"></div>
</div>

<div class="rule-box teal avoid-break">
  <strong>Markenkern:</strong> RUR NATUR steht für den ökologischen Aufbruch – die Rückkehr von Wildnis, Artenvielfalt
  und sauberem Wasser in eine industriell geprägte Region. Die Marke verbindet Natürlichkeit, wissenschaftliche
  Seriosität und spielerische Erkundung.
</div>

<div class="section-title">Logo-Konstruktion</div>
<div class="logo-zone avoid-break" style="margin-bottom:4mm;">
  <svg width="52" height="52" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 50 C10 15, 50 10, 85 20 C90 55, 65 85, 50 90 C35 90, 10 75, 10 50 Z" fill="#4A7A3A"/>
    <path d="M85 20 C60 25, 50 45, 30 50 C15 52, 22 65, 35 70 C55 65, 60 40, 85 20 Z" fill="#2A6F7E"/>
    <path d="M85 20 C68 23, 58 41, 38 48 C28 49, 31 56, 42 63 C58 56, 62 38, 85 20 Z" fill="#7FA8B5"/>
    <path d="M85 20 C73 22, 65 37, 45 44 C38 45, 40 50, 48 56 C62 50, 67 33, 85 20 Z" fill="#ECEDEF"/>
  </svg>
  <div>
    <div style="display:flex;align-items:baseline;gap:3mm;">
      <span style="font-family:'Space Grotesk',sans-serif;font-size:28pt;font-weight:900;color:#3A3F45;letter-spacing:-.02em;">RUR</span>
      <span style="font-family:'Space Grotesk',sans-serif;font-size:28pt;font-weight:600;color:#4A7A3A;letter-spacing:-.02em;">NATUR</span>
    </div>
    <div style="font-family:'Space Grotesk',sans-serif;font-size:8pt;font-weight:700;letter-spacing:.18em;color:#2A6F7E;text-transform:uppercase;margin-top:-1mm;">RENATURIERUNGS-SIMULATOR</div>
  </div>
</div>

<table class="demo avoid-break" style="margin-bottom:5mm;">
  <thead><tr><th>Logo-Element</th><th>Schriftart</th><th>Gewicht</th><th>Farbe</th></tr></thead>
  <tbody>
    <tr><td><strong>Wordmark „RUR"</strong></td><td><code>Space Grotesk</code></td><td>900 Black</td><td><code>#3A3F45</code> Brand Dark</td></tr>
    <tr><td><strong>Wordmark „NATUR"</strong></td><td><code>Space Grotesk</code></td><td>600 Semibold</td><td><code>#4A7A3A</code> Brand Green</td></tr>
    <tr><td><strong>Tagline</strong></td><td><code>Space Grotesk</code></td><td>700 Bold</td><td><code>#2A6F7E</code> Brand Teal</td></tr>
    <tr><td><strong>Icon-Signet</strong></td><td>SVG-Vektorgrafik</td><td>—</td><td>4-Farb-Schichtung (Green, Teal, Sky, BG)</td></tr>
  </tbody>
</table>

<div class="section-title">Logo-Schutzraum</div>
<div class="rule-box sky avoid-break">
  Der Mindest-Schutzraum um das Logo entspricht der <strong>Höhe des Buchstabens „R"</strong> auf jeder Seite.
  Innerhalb dieses Bereichs dürfen keine anderen Gestaltungselemente platziert werden.
</div>

<div class="section-title">Falsche Logo-Anwendungen</div>
<div class="dd-grid avoid-break">
  <div class="dd-do">
    <div class="dd-header">✓ Korrekte Anwendungen</div>
    <div class="dd-item">Logo auf weißem oder hellem Parchment-Hintergrund</div>
    <div class="dd-item">Wordmark in Originalfarben</div>
    <div class="dd-item">Signet und Wordmark gemeinsam im definierten Abstand</div>
    <div class="dd-item">Minimalgröße: Signet ≥ 24px / 8mm</div>
    <div class="dd-item">Nur die zwei genehmigten Schriftschnitte (Black + Semibold)</div>
  </div>
  <div class="dd-dont">
    <div class="dd-header">✗ Verbotene Anwendungen</div>
    <div class="dd-item">Farben vertauschen oder umfärben</div>
    <div class="dd-item">Logo verzerren, stauchen oder kippen</div>
    <div class="dd-item">Wordmark ohne Signet verwenden</div>
    <div class="dd-item">Auf farbige oder unruhige Hintergründe setzen</div>
    <div class="dd-item">Schriftgewichte oder -familien tauschen</div>
  </div>
</div>
<div class="footer-bar"><span>RUR NATUR · Corporate Design Manual</span><span>Kapitel 1 – Markenidentität & Logo</span></div>
</div>

<!-- ═══ CH 2: COLOR SYSTEM ═══════════════════════════════════════════════════ -->
<div class="page page-break">
<div class="chapter avoid-break">
  <div class="chapter-label">Kapitel 2</div>
  <h2 class="chapter-title">Farbsystem</h2>
  <div class="chapter-sub">Primärpalette · Oberflächen · Texte · Funktionsfarben · Kategoriefarben</div>
  <div class="chapter-rule"></div>
</div>

<div class="section-title">Primärpalette – Brand Colors</div>
<div class="swatch-row swatch-row-5 avoid-break">
  ${BRAND_COLORS.map(c => swatchCard(c.hex, c.name, c.token, c.role)).join('')}
</div>

<div class="section-title">Oberflächenfarben – Surfaces</div>
<div class="swatch-row swatch-row-5 avoid-break">
  ${SURFACE_COLORS.map(c => swatchCard(c.hex, c.name, '', c.role)).join('')}
</div>

<div class="section-title">Textfarben & Rahmen</div>
<div class="swatch-row swatch-row-5 avoid-break">
  ${TEXT_COLORS.map(c => swatchCard(c.hex, c.name, '', c.role)).join('')}
</div>

<div class="section-title">Funktionsfarben – Semantic Colors</div>
<div class="swatch-row swatch-row-3 avoid-break">
  ${FUNCTIONAL_COLORS.map(c => swatchCard(c.hex, c.name, '', c.role)).join('')}
</div>

<div class="section-title">Kategorie-Farbsystem – 6 Spielkategorien</div>
<div class="rule-box avoid-break">
  Jede Gebäude- und Spielkategorie hat eine fest zugeordnete Farbe. Das System wird
  konsequent über alle Badges, Icons, Karten-Borders und Highlights angewendet.
</div>
<div class="swatch-row swatch-row-6 avoid-break">
  ${CATEGORY_COLORS.map(c => `
  <div class="swatch">
    <div class="swatch-color" style="background:${c.hex};display:flex;align-items:center;justify-content:center;font-size:22pt;">${c.icon}</div>
    <div class="swatch-info">
      <span class="swatch-name">${c.name}</span>
      <span class="swatch-hex">${c.hex}</span>
      <span class="badge badge-${c.label}" style="margin-top:1.5mm;font-size:6.5pt;">${c.name}</span>
    </div>
  </div>`).join('')}
</div>

<div class="section-title">Farb-Anwendungsregeln</div>
<table class="demo avoid-break">
  <thead><tr><th>Token</th><th>Hex-Wert</th><th>Verwendung</th></tr></thead>
  <tbody>
    <tr><td><code>brand-green</code></td><td><code>#4A7A3A</code></td><td>Primäre Buttons, Aktive Nav-Items, Erfolgs-Badges, Fortschrittsbalken</td></tr>
    <tr><td><code>brand-teal</code></td><td><code>#2A6F7E</code></td><td>Eyebrow-Labels, Icons, sekundäre Links, WRRL-Layer, Teal-Buttons</td></tr>
    <tr><td><code>brand-lightsky</code></td><td><code>#7FA8B5</code></td><td>Divider, Borders bei Hover, Scrollbar-Thumb, dekorative Elemente</td></tr>
    <tr><td><code>brand-dark</code></td><td><code>#3A3F45</code></td><td>Daten-Text, subtile Überschriften, Logo-Wordmark „RUR"</td></tr>
    <tr><td><code>brand-bg</code></td><td><code>#ECEDEF</code></td><td>App-Canvas-Hintergrund, äußerste Fläche, Logo-Signet Füllung</td></tr>
    <tr><td><code>#F2EDE4</code></td><td>—</td><td>Parchment: Modal-Hintergründe, Card-Background, warme Surfaces</td></tr>
    <tr><td><code>#D4CCBA</code></td><td>—</td><td>Standard-Rahmenfarbe für Karten, Inputs, Trennlinien</td></tr>
    <tr><td><code>#BC6C25</code></td><td>—</td><td>Warn-Farbe: Kosten, Unterhalt, Klimarisiko, Amber-Akzente</td></tr>
    <tr><td><code>#6B52AE</code></td><td>—</td><td>Spezial-Farbe: Feedback, Forschungsbaum, Upgrade-Aktionen</td></tr>
  </tbody>
</table>
<div class="footer-bar"><span>RUR NATUR · Corporate Design Manual</span><span>Kapitel 2 – Farbsystem</span></div>
</div>

<!-- ═══ CH 3: TYPOGRAPHY ═════════════════════════════════════════════════════ -->
<div class="page page-break">
<div class="chapter avoid-break">
  <div class="chapter-label">Kapitel 3</div>
  <h2 class="chapter-title">Typografie</h2>
  <div class="chapter-sub">Schriftfamilien · Hierarchie · Gewichte · Anwendungsregeln</div>
  <div class="chapter-rule"></div>
</div>

<!-- Font 1: Space Grotesk -->
<div class="type-sample avoid-break">
  <div class="type-meta">
    <span style="font-family:'Space Grotesk',sans-serif;font-size:16pt;font-weight:900;color:var(--text-1);">Space Grotesk</span>
    <div style="display:flex;gap:2mm;">
      <span class="type-badge">font-display</span>
      <span class="type-badge">Google Fonts</span>
      <span class="type-badge">Headings · Buttons · Brand</span>
    </div>
  </div>
  <p style="font-family:'Space Grotesk',sans-serif;font-size:9pt;color:var(--text-2);margin-bottom:3mm;">
    Primäre Schrift für alle Überschriften, Seitentitel, Schaltflächen und das Logo-Wordmark.
    Charakteristisch: geometrisch, modern, selbstbewusst – steht für die wissenschaftliche Kompetenz des Projekts.
  </p>
  <div style="font-family:'Space Grotesk',sans-serif;">
    <div style="font-size:22pt;font-weight:900;color:var(--text-1);line-height:1.1;">RUR NATUR Renaturierung</div>
    <div style="font-size:16pt;font-weight:800;color:var(--text-1);line-height:1.2;">Gewässergüte verbessern</div>
    <div style="font-size:12pt;font-weight:700;color:var(--text-2);">Artenvielfalt maximieren</div>
    <div style="font-size:10pt;font-weight:600;color:var(--text-2);">Atlantischen Lachs wiederansiedeln</div>
    <div style="font-size:9pt;font-weight:500;color:var(--text-3);margin-top:1mm;">UPPERCASE TRACKING LABEL</div>
  </div>
</div>

<!-- Font 2: Inter -->
<div class="type-sample avoid-break">
  <div class="type-meta">
    <span style="font-family:'Inter',sans-serif;font-size:16pt;font-weight:800;color:var(--text-1);">Inter</span>
    <div style="display:flex;gap:2mm;">
      <span class="type-badge">font-sans</span>
      <span class="type-badge">Google Fonts</span>
      <span class="type-badge">Body · UI · Beschreibungen</span>
    </div>
  </div>
  <p style="font-family:'Inter',sans-serif;font-size:9pt;color:var(--text-2);margin-bottom:3mm;">
    Standard-Schrift für alle Fließtexte, Beschreibungen, Listen und UI-Inhalte.
    Optimale Lesbarkeit bei kleinen Schriftgrößen. Neutral, klar, professionell.
  </p>
  <div style="font-family:'Inter',sans-serif;">
    <div style="font-size:13pt;font-weight:800;color:var(--text-1);">Gebäude-Inspektor</div>
    <div style="font-size:11pt;font-weight:700;color:var(--text-1);">Altarm-Anschluss · 8 €</div>
    <div style="font-size:9pt;font-weight:400;color:var(--text-2);line-height:1.6;max-width:140mm;">Wiederanbindung von Altarmen. Senkt lokales Hochwasserrisiko um 15 %, erhöht den FFH-Wert und verbessert die WRRL-Gewässergüte der benachbarten Wasserfelder.</div>
    <div style="font-size:8pt;font-weight:500;color:var(--text-3);margin-top:1.5mm;">Kategorie: Ökologie · Terrain: Auenwiese · Flussangrenzend</div>
  </div>
</div>

<!-- Font 3: JetBrains Mono -->
<div class="type-sample avoid-break">
  <div class="type-meta">
    <span style="font-family:'JetBrains Mono',monospace;font-size:14pt;font-weight:700;color:var(--text-1);">JetBrains Mono</span>
    <div style="display:flex;gap:2mm;">
      <span class="type-badge">font-mono</span>
      <span class="type-badge">Google Fonts</span>
      <span class="type-badge">Labels · Daten · Metainfo · Code</span>
    </div>
  </div>
  <p style="font-family:'Inter',sans-serif;font-size:9pt;color:var(--text-2);margin-bottom:3mm;">
    Technische Schrift für Labels, Metadaten, Werte, Eyebrow-Text und alle numerischen Anzeigen.
    Schafft den wissenschaftlichen, präzisen Charakter der Datenebene im Spiel.
  </p>
  <div style="font-family:'JetBrains Mono',monospace;">
    <div style="font-size:7.5pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--teal);margin-bottom:1.5mm;">RENATURIERUNGS-SIMULATOR · KREIS DÜREN</div>
    <div style="display:flex;gap:6mm;align-items:baseline;">
      <div><div style="font-size:7pt;color:var(--text-3);text-transform:uppercase;letter-spacing:.1em;">Guthaben</div><div style="font-size:14pt;font-weight:900;color:var(--dark);">25 €</div></div>
      <div><div style="font-size:7pt;color:var(--text-3);text-transform:uppercase;letter-spacing:.1em;">Forschung</div><div style="font-size:14pt;font-weight:900;color:var(--dark);">3 🧪</div></div>
      <div><div style="font-size:7pt;color:var(--text-3);text-transform:uppercase;letter-spacing:.1em;">Naturpunkte</div><div style="font-size:14pt;font-weight:900;color:var(--dark);">0 🌿</div></div>
      <div><div style="font-size:7pt;color:var(--text-3);text-transform:uppercase;letter-spacing:.1em;">WRRL</div><div style="font-size:14pt;font-weight:900;color:var(--dark);">3.60</div></div>
    </div>
    <div style="font-size:9pt;font-weight:600;color:var(--text-2);margin-top:2mm;">Sektor (6,6) · Terrain: Gewerbe · Stufe 1 · W:1</div>
  </div>
</div>

<div class="section-title">Typografische Hierarchie</div>
<div class="type-scale avoid-break">
  ${[
    ['Display / Cover',   '36pt – 48pt', 'Space Grotesk', '900 Black',    'Seitentitel, Cover, Splash-Screens'],
    ['Chapter Title',     '18pt – 22pt', 'Space Grotesk', '900 Black',    'Kapitelüberschriften, Modale Titel'],
    ['Section Heading',   '13pt – 16pt', 'Space Grotesk', '800 Extrabold','Abschnittstitel, Panel-Überschriften'],
    ['Card Title',        '11pt – 13pt', 'Space Grotesk', '800 Extrabold','Karten, Gebäudenamen, Tabs'],
    ['Body Large',        '10pt – 11pt', 'Inter',         '400 Regular',  'Einleitungstexte, Beschreibungen'],
    ['Body',              '9pt',         'Inter',         '400 Regular',  'Standard-Fließtext, Listen'],
    ['Body Small',        '8pt – 8.5pt', 'Inter',         '400 Regular',  'Hilfstexte, Tooltips, Untertexte'],
    ['Label / Eyebrow',   '7pt – 8pt',   'JetBrains Mono','700 Bold',     'Uppercase Labels, Kategoriebezeichner'],
    ['Data / Value',      '8pt – 14pt',  'JetBrains Mono','700 – 900',    'Zahlenwerte, Metriken, Koordinaten'],
    ['Caption / Micro',   '7pt',         'JetBrains Mono','400 – 600',    'Zeitstempel, Version, Copyright'],
  ].map(([role, size, font, weight, use]) => `
  <div class="type-scale-row">
    <span class="type-scale-label">${role}</span>
    <span style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:var(--teal);min-width:16mm;">${size}</span>
    <span style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:var(--text-3);min-width:30mm;">${font}</span>
    <span style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:var(--text-3);min-width:26mm;">${weight}</span>
    <span style="font-size:8pt;color:var(--text-2);">${use}</span>
  </div>`).join('')}
</div>
<div class="footer-bar"><span>RUR NATUR · Corporate Design Manual</span><span>Kapitel 3 – Typografie</span></div>
</div>

<!-- ═══ CH 4: SPACING & LAYOUT ═══════════════════════════════════════════════ -->
<div class="page page-break">
<div class="chapter avoid-break">
  <div class="chapter-label">Kapitel 4</div>
  <h2 class="chapter-title">Abstände & Layout</h2>
  <div class="chapter-sub">Spacing-Skala · Grid-System · Border-Radius · Schatten</div>
  <div class="chapter-rule"></div>
</div>

<div class="section-title">Spacing-Skala (Tailwind 4px-Basis)</div>
<div class="avoid-break">
  ${[
    ['1',   '4px',   '1mm',  'Enge Icons, Micro-Gaps'],
    ['1.5', '6px',   '1.5mm','Sehr enge Abstände, Bullet-Gaps'],
    ['2',   '8px',   '2mm',  'Kompakte UI-Elemente, Icon-Text-Gap'],
    ['2.5', '10px',  '2.5mm','Standard Tag-Padding, kleine Gaps'],
    ['3',   '12px',  '3mm',  'Standard Card-Padding, Listen-Gaps'],
    ['3.5', '14px',  '3.5mm','Badge-Padding, enge Abschnitte'],
    ['4',   '16px',  '4mm',  'Standard-Padding Panels, Gaps'],
    ['4.5', '18px',  '4.5mm','Erweitertes Padding, Modal-Sections'],
    ['5',   '20px',  '5mm',  'Section-Gaps, großzügige Panels'],
    ['6',   '24px',  '6mm',  'Page-Padding, Haupt-Layout-Gap'],
  ].map(([t, px, mm, use]) => `
  <div class="spacing-row">
    <span class="spacing-label">gap/p-${t}</span>
    <div class="spacing-bar" style="width:${parseFloat(t)*6}mm;"></div>
    <span class="spacing-val">${px} / ${mm}</span>
    <span style="font-size:8pt;color:var(--text-2);">${use}</span>
  </div>`).join('')}
</div>

<div class="section-title">Border-Radius</div>
<div class="radius-grid avoid-break">
  ${[
    ['rounded-lg',   '8px',  'Buttons, Tags, kleine Elemente'],
    ['rounded-xl',   '12px', 'Cards, Panels, Input-Felder'],
    ['rounded-2xl',  '16px', 'Modals, Hauptkarten'],
    ['rounded-3xl',  '24px', 'Große Overlays, Splash-Screens'],
    ['rounded-full', '9999px','Pills, Badges, Avatare, Dots'],
  ].map(([cls, px, use]) => `
  <div style="text-align:center;min-width:28mm;">
    <div class="radius-box" style="border-radius:${px};margin:0 auto 2mm;">${cls.replace('rounded-','')}</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:7pt;color:var(--teal);">${px}</div>
    <div style="font-size:7pt;color:var(--text-3);margin-top:0.5mm;">${use}</div>
  </div>`).join('')}
</div>

<div class="section-title">Schatten-System</div>
<table class="demo avoid-break">
  <thead><tr><th>Token</th><th>Verwendung</th><th>Demo</th></tr></thead>
  <tbody>
    ${[
      ['shadow-sm', 'Dezente Erhebung: Buttons, Tags, kleine Karten', '0 1px 2px rgba(0,0,0,.06)'],
      ['shadow-md', 'Mittlere Erhebung: Standard-Karten, Panels', '0 4px 6px rgba(0,0,0,.07)'],
      ['shadow-lg', 'Hohe Erhebung: Dropdown-Menüs, Popovers', '0 10px 15px rgba(0,0,0,.1)'],
      ['shadow-xl', 'Starke Erhebung: Wichtige Modale, Overlays', '0 20px 25px rgba(0,0,0,.1)'],
      ['shadow-2xl', 'Maximale Erhebung: Vollbild-Modale, Spielanleitung', '0 25px 50px rgba(0,0,0,.25)'],
      ['shadow-inner', 'Eingebettete Flächen: Log-Viewer, Textareas', 'inset 0 2px 4px rgba(0,0,0,.06)'],
    ].map(([t, use, css]) => `<tr>
      <td><code>${t}</code></td>
      <td>${use}</td>
      <td><div style="width:16mm;height:8mm;border-radius:6px;background:#fff;box-shadow:${css};border:1px solid var(--border);"></div></td>
    </tr>`).join('')}
  </tbody>
</table>

<div class="section-title">Grid-System</div>
<div class="rule-box avoid-break">
  Das Layout basiert auf einem <strong>flexiblen CSS Grid und Flexbox-System</strong> via Tailwind.
  Zwei Hauptlayouts werden verwendet:<br><br>
  <strong>App-Layout:</strong> Sidebar-Links (40 %) + Hauptinhalt-Rechts (60 %) via <code>flex-row</code><br>
  <strong>Karten-Grid:</strong> 2-spaltig (<code>grid-cols-2</code>) für Gebäude- und Stat-Karten<br>
  <strong>Statistik-Zeile:</strong> Flexbox mit <code>flex-wrap</code> für responsive HUD-Elemente
</div>
<div class="grid-preview grid-preview-2">
  <div class="grid-col">Linke Spalte · Karte &amp; Aktionskarten (md:w-3/5)</div>
  <div class="grid-col">Rechte Spalte · Tabs &amp; Panels (md:w-2/5)</div>
</div>
<div class="grid-preview grid-preview-3">
  <div class="grid-col">Forschungs-Stufe I</div>
  <div class="grid-col">Forschungs-Stufe II</div>
  <div class="grid-col">Stufe III (Ziel)</div>
</div>
<div class="footer-bar"><span>RUR NATUR · Corporate Design Manual</span><span>Kapitel 4 – Abstände & Layout</span></div>
</div>

<!-- ═══ CH 5: COMPONENTS ═════════════════════════════════════════════════════ -->
<div class="page page-break">
<div class="chapter avoid-break">
  <div class="chapter-label">Kapitel 5</div>
  <h2 class="chapter-title">Komponenten-Bibliothek</h2>
  <div class="chapter-sub">Buttons · Cards · Badges · Tabellen · Rule-Boxes · HUD-Elemente · Modals</div>
  <div class="chapter-rule"></div>
</div>

<!-- Buttons -->
<div class="comp-section avoid-break">
  <div class="comp-section-title">5.1 Buttons & CTAs</div>
  <div class="comp-row">
    <span class="btn btn-primary">✓ Primär (Green)</span>
    <span class="btn btn-secondary">Sekundär (Parchment)</span>
    <span class="btn btn-teal">💾 Speichern (Teal)</span>
    <span class="btn btn-green-soft">📖 Spielanleitung</span>
    <span class="btn btn-amber">📄 PDF (Amber)</span>
    <span class="btn btn-purple">💬 Feedback (Purple)</span>
    <span class="btn btn-danger">⚠ Gefahr (Red)</span>
  </div>
  <table class="demo" style="margin-top:2mm;">
    <thead><tr><th>Variante</th><th>BG / Text / Border</th><th>Verwendung</th></tr></thead>
    <tbody>
      <tr><td>Primär Green</td><td><code>#4A7A3A / #fff / #4A7A3A</code></td><td>Haupt-CTAs: „Runde beenden", „Spielen!", primäre Bestätigungen</td></tr>
      <tr><td>Sekundär</td><td><code>#E8E2D6 / #2C3311 / #D4CCBA</code></td><td>Sekundär-Aktionen: „Zurück", „Abbrechen", neutrale Optionen</td></tr>
      <tr><td>Teal</td><td><code>#E5F2F5 / #1D4E5B / #B0D3DC</code></td><td>Laden, Importieren, Datenoperationen</td></tr>
      <tr><td>Green Soft</td><td><code>#E2EBD5 / #2C3311 / #B8C8A3</code></td><td>Regeln, Spielanleitung, sekundäre Infoaktionen</td></tr>
      <tr><td>Amber</td><td><code>#FDF6EC / #7A3F1F / #DCC5A3</code></td><td>PDF, Export, Datei-Operationen</td></tr>
      <tr><td>Purple</td><td><code>#EDE8F5 / #3D2C6E / #C8BAE8</code></td><td>Feedback, Forschungsbaum-Aktionen, Specials</td></tr>
    </tbody>
  </table>
</div>

<!-- Cards -->
<div class="comp-section avoid-break">
  <div class="comp-section-title">5.2 Karten-Typen</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;">
    <div class="card">
      <div style="font-family:'JetBrains Mono',monospace;font-size:7pt;letter-spacing:.15em;text-transform:uppercase;color:var(--text-3);margin-bottom:1.5mm;">Standard Card</div>
      <div style="font-weight:800;font-family:'Space Grotesk',sans-serif;margin-bottom:1.5mm;font-size:11pt;">Altarm-Anschluss</div>
      <div style="font-size:8.5pt;color:var(--text-2);">Weiße Karte mit <code>border-[#D4CCBA]</code>, <code>rounded-xl</code>. Basis-Pattern für Gebäude, Aktionen und Infopanele.</div>
    </div>
    <div class="card-modal">
      <div style="font-family:'JetBrains Mono',monospace;font-size:7pt;letter-spacing:.15em;text-transform:uppercase;color:var(--teal);margin-bottom:1.5mm;">Modal Card</div>
      <div style="font-weight:800;font-family:'Space Grotesk',sans-serif;margin-bottom:1.5mm;font-size:11pt;">Klimaereignis!</div>
      <div style="font-size:8.5pt;color:var(--text-2);">Parchment-Hintergrund (<code>#F2EDE4</code>) mit stärkerem Border. Für Modale und wichtige Overlays.</div>
    </div>
    <div class="card-highlight">
      <div style="font-family:'JetBrains Mono',monospace;font-size:7pt;letter-spacing:.15em;text-transform:uppercase;color:var(--green);margin-bottom:1.5mm;">Highlight Card</div>
      <div style="font-weight:800;font-family:'Space Grotesk',sans-serif;margin-bottom:1.5mm;font-size:11pt;">Aktive Auswahl</div>
      <div style="font-size:8.5pt;color:var(--text-2);">Green-Border (<code>border-[#5A7247]</code>) für selektierte, aktive oder hervorgehobene Elemente.</div>
    </div>
  </div>
</div>

<!-- Badges -->
<div class="comp-section avoid-break">
  <div class="comp-section-title">5.3 Badges & Pills</div>
  <div class="comp-row">
    <span class="badge badge-ecology">🌿 Ökologie</span>
    <span class="badge badge-water">🌊 Hydrologie</span>
    <span class="badge badge-fauna">🦫 Artenschutz</span>
    <span class="badge badge-tourism">🏕️ Tourismus</span>
    <span class="badge badge-economy">💶 Wirtschaft</span>
    <span class="badge badge-infra">🚇 Infrastruktur</span>
    <span class="badge badge-mono">W:12</span>
    <span class="badge badge-mono">Sektor (6,6)</span>
  </div>
  <div style="font-size:8.5pt;color:var(--text-2);margin-top:1.5mm;">
    <strong>Konstruktion:</strong> <code>10% bg-Opacity</code> der Kategoriefarbe + volle Kategoriefarbe für Text + <code>25% border-Opacity</code>. Immer <code>rounded-full</code> + <code>font-bold</code>.
    Mono-Badges für Metadaten: <code>#E8E2D6</code> Background, <code>rounded</code> (kein Full).
  </div>
</div>

<!-- Rule Boxes -->
<div class="comp-section avoid-break">
  <div class="comp-section-title">5.4 Regel-Boxen (Rule Boxes)</div>
  <div class="rule-box" style="margin-bottom:2mm;"><strong>Green (Standard):</strong> Für allgemeine Spielregeln, Bau-Hinweise, positive Informationen. Border: <code>#5A7247</code> · BG: <code>#F4F8F1</code></div>
  <div class="rule-box teal" style="margin-bottom:2mm;"><strong>Teal:</strong> Systemmechaniken, strategische Hinweise, Rundenlogik. Border: <code>#2A6F7E</code> · BG: <code>#F0F7FA</code></div>
  <div class="rule-box amber" style="margin-bottom:2mm;"><strong>Amber:</strong> Kosten, Warnungen, Risiken, ökonomische Hinweise. Border: <code>#BC6C25</code> · BG: <code>#FDF6EC</code></div>
  <div class="rule-box purple" style="margin-bottom:2mm;"><strong>Purple:</strong> Spezialaktionen, Forschungssystem, Upgrade-Hinweise. Border: <code>#6B52AE</code> · BG: <code>#F5F2FC</code></div>
  <div class="rule-box red"><strong>Red:</strong> Kritische Fehler, Klimakatastrophen, Verlustmeldungen. Border: <code>#B91C1C</code> · BG: <code>#FEF2F2</code></div>
</div>

<!-- HUD Stats -->
<div class="comp-section avoid-break">
  <div class="comp-section-title">5.5 HUD-Statistiken (Header-Leiste)</div>
  <div style="display:flex;gap:3mm;flex-wrap:wrap;align-items:center;background:rgba(242,237,228,.65);border:1.5px solid rgba(127,168,181,.2);border-radius:12px;padding:3mm;">
    ${[
      ['💶','GUTHABEN','25 €'],['🧪','FORSCHUNG','3 🧪'],['🌿','NATURPUNKTE','0 🌿'],
      ['💧','WRRL-GÜTE','3.60 Mäßig'],['⚠️','KLIMARISIKO','15 %'],
    ].map(([icon,label,val]) => `
    <div style="display:flex;align-items:center;gap:2mm;padding:0 2.5mm;border-right:1px solid var(--border);">
      <span style="font-size:12pt;">${icon}</span>
      <div style="font-family:'JetBrains Mono',monospace;">
        <div style="font-size:7pt;color:var(--text-3);letter-spacing:.08em;text-transform:uppercase;">${label}</div>
        <div style="font-size:11pt;font-weight:900;color:var(--dark);">${val}</div>
      </div>
    </div>`).join('')}
  </div>
  <div style="font-size:8pt;color:var(--text-2);margin-top:2mm;">
    Pattern: <code>#F2EDE4/65</code> BG + <code>brand-lightsky/20</code> Border + Icon + <code>JetBrains Mono</code> UPPERCASE Label (7pt) + Black Value (11–14pt)
  </div>
</div>
<div class="footer-bar"><span>RUR NATUR · Corporate Design Manual</span><span>Kapitel 5 – Komponenten</span></div>
</div>

<!-- ═══ CH 6: ICONOGRAPHY ════════════════════════════════════════════════════ -->
<div class="page page-break">
<div class="chapter avoid-break">
  <div class="chapter-label">Kapitel 6</div>
  <h2 class="chapter-title">Ikonografie & Emojis</h2>
  <div class="chapter-sub">Lucide-React Icons · Spielemojis · Anwendungsregeln</div>
  <div class="chapter-rule"></div>
</div>

<div class="section-title">Lucide-React Icon-Set (UI-Icons)</div>
<div class="rule-box avoid-break">
  Für alle UI-Funktions-Icons wird ausschließlich das <strong>Lucide-React</strong>-Set verwendet.
  Standardgröße: <code>w-4 h-4</code> (16×16px) für Button-Icons, <code>w-5 h-5</code> für Header-Icons,
  <code>w-6 h-6</code> bis <code>w-8 h-8</code> für Modal-Header-Icons.
  Farbe immer kontextuell: auf grünen Buttons weiß, auf hellen Flächen die jeweilige Akzentfarbe.
</div>
<table class="demo avoid-break">
  <thead><tr><th>Icon</th><th>Name</th><th>Verwendungskontext</th></tr></thead>
  <tbody>
    ${[
      ['📖','BookOpen','Spielanleitung öffnen'],['💾','Save','Spielstand speichern'],['📂','FolderOpen','Spielstand laden'],
      ['❓','HelpCircle','Einführungs-Tutorial'],['💬','MessageSquare','Feedback-Modal'],['📄','FileText','PDF-Export'],
      ['🔖','BookOpen','Regelwerk öffnen'],['⚙️','Wrench','Technische Einstellungen'],['ℹ️','Info','Infopanele, Tooltips'],
      ['🏆','Award','Achievements, Naturpunkte'],['⚠️','ShieldAlert','Klimaereignis-Warnung'],['🔄','RotateCcw','Neustarten'],
      ['⚡','Zap','Forschungspunkte (animiert)'],['💰','Coins','Budget-Anzeige'],['📈','TrendingUp','Fortschritts-Metriken'],
    ].map(([em, name, use]) => `<tr><td style="font-size:14pt;">${em}</td><td><code>${name}</code></td><td style="font-size:8.5pt;color:var(--text-2);">${use}</td></tr>`).join('')}
  </tbody>
</table>

<div class="section-title">Spiel-Emojis – Semantisches System</div>
<div class="rule-box teal avoid-break">
  Emojis werden im Spiel bewusst als <strong>visuelle Shortcodes</strong> eingesetzt – nicht als dekorative Elemente.
  Jedes Emoji trägt eine feste semantische Bedeutung und wird konsistent über alle Texte, Logs und Labels angewendet.
</div>
<table class="demo avoid-break">
  <thead><tr><th>Emoji</th><th>Semantik</th><th>Beispiel-Kontext</th></tr></thead>
  <tbody>
    ${[
      ['💶','Budget / Euro-Betrag','Gebäudekosten, Einkommen, Fördermittel'],
      ['🧪','Forschungspunkte','Forschungsbaum, Aktionskarte FORSCHEN'],
      ['🌿','Naturpunkte / Ökologie allgemein','Sieg-Punkte, Artenschutzerfolge'],
      ['⚠️','Klimarisiko / Warnung','HUD-Anzeige, Ereignis-Trigger'],
      ['💧','Wasserqualität (WRRL)','WRRL-Werte, Kläranlagen, Hydrologie'],
      ['🦫','Artenschutz / Biber speziell','Biber-Karte, Artenschutz-Panel'],
      ['🐟','Fisch / Durchgängigkeit','Fischpass, Lachs, Bachforelle'],
      ['🏗️','Bauen / Gebäude','BAUEN-Aktionskarte, Bau-Modus'],
      ['🌱','Bepflanzung / Terrain-Umwandlung','BEPFLANZUNG-Karte, Auenwald'],
      ['🌊','Hydrologie / Wasser-Aktion','HYDROLOGIE-Karte, Flussebene'],
      ['🔬','Forschung / Wissenschaft','Forschungsbaum, Labor'],
      ['🏆','Achievement / Sieg','Victory-Conditions, Reports-Tab'],
      ['👑','Ultimativer Sieg (Lachs)','Atlantischer Lachs, Rückkehr des Königs'],
      ['✅','Erfolg / Abgeschlossen','Log-Einträge success, Art freigeschaltet'],
      ['❌','Fehler / Negativereignis','Log-Einträge error, Ablehnung'],
    ].map(([em, sem, ctx]) => `<tr><td style="font-size:16pt;padding:1.5mm 3mm;">${em}</td><td style="font-weight:700;">${sem}</td><td style="font-size:8.5pt;color:var(--text-2);">${ctx}</td></tr>`).join('')}
  </tbody>
</table>
<div class="footer-bar"><span>RUR NATUR · Corporate Design Manual</span><span>Kapitel 6 – Ikonografie & Emojis</span></div>
</div>

<!-- ═══ CH 7: MOTION ══════════════════════════════════════════════════════════ -->
<div class="page page-break">
<div class="chapter avoid-break">
  <div class="chapter-label">Kapitel 7</div>
  <h2 class="chapter-title">Motion & Interaktion</h2>
  <div class="chapter-sub">Animationen · Übergänge · Hover-States · Framer Motion</div>
  <div class="chapter-rule"></div>
</div>

<div class="rule-box teal avoid-break">
  Alle Animationen folgen dem Prinzip <strong>„funktional, nie dekorativ"</strong>.
  Motion unterstützt das Nutzerverständnis (was hat sich verändert?) und gibt Feedback (wurde mein Klick registriert?).
  Verwendete Bibliothek: <strong>Framer Motion</strong> via <code>motion/react</code>.
</div>

<div class="section-title">Transitions (CSS / Tailwind)</div>
<div class="avoid-break">
  ${[
    ['Hover-Buttons',     'duration-200',    'background-color, transform',      'Alle interaktiven Schaltflächen'],
    ['Active-Scale',      'active:scale-95', 'transform',                         'Buttons beim Drücken: visuelles Klick-Feedback'],
    ['Tab-Wechsel',       'duration-150',    'background-color, color, border',   'Navigation-Tabs bei Auswahl'],
    ['Karten-Hover',      'transition-all',  'border-color, box-shadow',          'Gebäude-Karten, Forschungs-Nodes'],
    ['Icon-Pulse',        'animate-pulse',   'opacity',                           'Zap-Icon beim Forschungspunkte-Display'],
    ['Badge-Shine',       'animate-pulse',   'background-color',                  'Upgrade-Level-Badges auf platzierten Gebäuden'],
  ].map(([name, token, prop, use]) => `
  <div class="motion-row">
    <span class="motion-name">${name}</span>
    <span class="motion-val">${token}</span>
    <span style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:var(--text-3);min-width:40mm;">${prop}</span>
    <span style="font-size:8.5pt;color:var(--text-2);">${use}</span>
  </div>`).join('')}
</div>

<div class="section-title">Framer Motion – AnimatePresence Patterns</div>
<table class="demo avoid-break">
  <thead><tr><th>Kontext</th><th>Initial → Animate → Exit</th><th>Transition</th></tr></thead>
  <tbody>
    ${[
      ['Modal öffnen/schließen', 'opacity:0, scale:.95 → opacity:1, scale:1 → opacity:0, scale:.95', 'duration: 0.2s'],
      ['Gebäude-Inspektor (unten)', 'opacity:0, y:15, scale:.95 → opacity:1, y:0, scale:1 → exit', 'duration: 0.2s'],
      ['Kontextuelle Tipps (rechts)', 'opacity:0, x:50, scale:.9 → opacity:1, x:0, scale:1 → exit', 'spring: damping 20, stiffness 120'],
      ['Klimaereignis-Warning', 'opacity:0 → opacity:1', 'className: animate-fade-in / animate-scale-up'],
    ].map(([ctx, anim, trans]) => `<tr><td><strong>${ctx}</strong></td><td style="font-family:'JetBrains Mono',monospace;font-size:7pt;">${anim}</td><td style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:var(--teal);">${trans}</td></tr>`).join('')}
  </tbody>
</table>

<div class="section-title">Interaktions-Zustände</div>
<table class="demo avoid-break">
  <thead><tr><th>Zustand</th><th>Visuelle Änderung</th><th>Implementation</th></tr></thead>
  <tbody>
    ${[
      ['Default', 'Basisfarbe, Basis-Border', 'Normaler CSS-State'],
      ['Hover', 'Leicht dunkleres BG (10–15 % darker)', 'hover:bg-* Tailwind-Klassen'],
      ['Active / Pressed', 'Scale-Down: transform scale(0.95)', 'active:scale-95'],
      ['Focus', 'Outline entfernt, Border-Farbe ändert sich', 'focus:outline-none focus:border-*'],
      ['Disabled', 'opacity-40 + cursor-not-allowed', 'disabled:opacity-40 disabled:cursor-not-allowed'],
      ['Selected / Active Nav', 'Grüner Left-Border (4px) + White BG', 'border-l-4 border-l-[#5A7247] bg-white'],
      ['Loading', 'Text wechselt zu „Wird gesendet…"', 'State-basiert via useState'],
    ].map(([state, change, impl]) => `<tr><td><strong>${state}</strong></td><td>${change}</td><td style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:var(--teal);">${impl}</td></tr>`).join('')}
  </tbody>
</table>
<div class="footer-bar"><span>RUR NATUR · Corporate Design Manual</span><span>Kapitel 7 – Motion & Interaktion</span></div>
</div>

<!-- ═══ CH 8: DO'S & DON'TS ══════════════════════════════════════════════════ -->
<div class="page page-break">
<div class="chapter avoid-break">
  <div class="chapter-label">Kapitel 8</div>
  <h2 class="chapter-title">Do's & Don'ts</h2>
  <div class="chapter-sub">Konsistenzregeln · Häufige Fehler · Best Practices</div>
  <div class="chapter-rule"></div>
</div>

<div class="dd-grid avoid-break">
  <div class="dd-do">
    <div class="dd-header">✓ Farben</div>
    <div class="dd-item">Primäre Aktionen immer in Brand Green <code>#4A7A3A</code></div>
    <div class="dd-item">Kategorie-Farben konsistent dem Farbsystem zuordnen</div>
    <div class="dd-item">Parchment-Töne als Hintergründe für Karten und Modals verwenden</div>
    <div class="dd-item">Kontrastverhältnis WCAG AA (4.5:1 für Text) einhalten</div>
    <div class="dd-item">Semantische Farben: Rot=Fehler, Grün=Erfolg, Amber=Warnung</div>
  </div>
  <div class="dd-dont">
    <div class="dd-header">✗ Farben</div>
    <div class="dd-item">Keine Primärfarben auf dunklen Hintergründen verwenden</div>
    <div class="dd-item">Nicht mehr als 3 Farben pro Komponente (exkl. Text/Border)</div>
    <div class="dd-item">Keine undefinierten Farben außerhalb des Token-Systems</div>
    <div class="dd-item">Brand Green nicht als Warnfarbe missbrauchen</div>
    <div class="dd-item">Kategorie-Farben nicht zwischen Kategorien mischen</div>
  </div>
</div>

<div class="dd-grid avoid-break">
  <div class="dd-do">
    <div class="dd-header">✓ Typografie</div>
    <div class="dd-item">Space Grotesk für alle Headings, Buttons, Labels im Display-Kontext</div>
    <div class="dd-item">Inter für Fließtext und UI-Beschreibungen</div>
    <div class="dd-item">JetBrains Mono für alle Datenwerte, Metriken, Koordinaten</div>
    <div class="dd-item">Eyebrow-Text: immer Mono, Uppercase, letter-spacing .15em+</div>
    <div class="dd-item">Schriftgrößen aus definierter Hierarchie wählen</div>
  </div>
  <div class="dd-dont">
    <div class="dd-header">✗ Typografie</div>
    <div class="dd-item">Keine System-Schriften oder anderen Google Fonts einmischen</div>
    <div class="dd-item">Inter nicht für Logo-Wordmark oder Display-Headlines</div>
    <div class="dd-item">Keine kursive Schrift für UI-Texte (nur für lateinische Artnamen)</div>
    <div class="dd-item">Nicht mehr als 3 verschiedene Gewichte in einer Komponente</div>
    <div class="dd-item">Keinen übermäßigen letter-spacing bei Fließtext</div>
  </div>
</div>

<div class="dd-grid avoid-break">
  <div class="dd-do">
    <div class="dd-header">✓ Abstände & Layout</div>
    <div class="dd-item">Tailwind-Spacing-Skala konsequent verwenden (kein <code>px-7</code> etc.)</div>
    <div class="dd-item">Konsistente Padding-Werte: p-3/p-4 für kompakt, p-5/p-6 für locker</div>
    <div class="dd-item">Gap-System: gap-2 eng, gap-3 standard, gap-4/6 locker</div>
    <div class="dd-item">2-spaltige Karten-Grids für Gebäude und Statistiken</div>
    <div class="dd-item">Rounded-xl als Standard-Radius für Karten und Panels</div>
  </div>
  <div class="dd-dont">
    <div class="dd-header">✗ Abstände & Layout</div>
    <div class="dd-item">Keine magic pixel-Werte (<code>style="padding:13px"</code>)</div>
    <div class="dd-item">Nicht mehr als 4 Spalten in einem Karten-Grid auf A4</div>
    <div class="dd-item">Keine unterschiedlichen Radius-Werte in derselben Karten-Gruppe</div>
    <div class="dd-item">Kein overflow-hidden auf scrollbaren Containern ohne custom-scrollbar</div>
    <div class="dd-item">Kein hardgecodetes <code>width</code> ohne responsive Breakpoints</div>
  </div>
</div>

<div class="dd-grid avoid-break">
  <div class="dd-do">
    <div class="dd-header">✓ Emojis & Icons</div>
    <div class="dd-item">Emojis als semantische Shortcodes – jedes hat eine feste Bedeutung</div>
    <div class="dd-item">Lucide-React für alle Funktions-Icons in der UI</div>
    <div class="dd-item">Icon + Text: immer <code>flex items-center gap-1.5</code></div>
    <div class="dd-item">Lucide-Icons nur in definierten Größen (w-4, w-5, w-6, w-8)</div>
    <div class="dd-item">Pro Button/Label max. 1 Emoji oder 1 Icon – nie beide</div>
  </div>
  <div class="dd-dont">
    <div class="dd-header">✗ Emojis & Icons</div>
    <div class="dd-item">Keine Emojis rein dekorativ ohne semantische Bedeutung</div>
    <div class="dd-item">Nicht 2 verschiedene Icon-Sets mischen</div>
    <div class="dd-item">Kein Emoji als Logo-Ersatz oder in Headlines</div>
    <div class="dd-item">Keine Emoji-Wände (mehr als 3 Emojis hintereinander)</div>
    <div class="dd-item">Lucide-Icons nicht freihändig resizen außerhalb der Skala</div>
  </div>
</div>

<div class="section-title" style="margin-top:5mm;">Token-Referenz auf einen Blick</div>
<table class="demo avoid-break">
  <thead><tr><th>Kontext</th><th>Font</th><th>Größe</th><th>Gewicht</th><th>Farbe</th></tr></thead>
  <tbody>
    ${[
      ['Seitentitel (Display)','Space Grotesk','22–36pt','900','#2C3322'],
      ['Panel-Überschrift','Space Grotesk','13–16pt','800','#2C3322'],
      ['Karten-Titel','Space Grotesk','11–13pt','800','#2C3322'],
      ['Eyebrow-Label','JetBrains Mono','7–8pt','700 + Uppercase','#2A6F7E / #8B8273'],
      ['Fließtext','Inter','9–10pt','400','#5C5549'],
      ['Datenwert (HUD)','JetBrains Mono','11–14pt','900','#3A3F45'],
      ['Button-Text','Space Grotesk','8–10pt','800 + Uppercase','kontextuell'],
      ['Badge-Text','Inter / Mono','7–8pt','700','Kategoriefarbe'],
    ].map(([ctx, font, size, weight, color]) => `<tr>
      <td><strong>${ctx}</strong></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;">${font}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;color:var(--teal);">${size}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:7.5pt;">${weight}</td>
      <td><code>${color}</code></td>
    </tr>`).join('')}
  </tbody>
</table>

<!-- Final -->
<div style="margin-top:10mm;text-align:center;padding:7mm;background:var(--parch-mid);border:2px solid var(--border);border-radius:10px;">
  <svg width="44" height="44" viewBox="0 0 100 100" fill="none" style="margin-bottom:3mm;" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 50 C10 15, 50 10, 85 20 C90 55, 65 85, 50 90 C35 90, 10 75, 10 50 Z" fill="#4A7A3A"/>
    <path d="M85 20 C60 25, 50 45, 30 50 C15 52, 22 65, 35 70 C55 65, 60 40, 85 20 Z" fill="#2A6F7E"/>
    <path d="M85 20 C68 23, 58 41, 38 48 C28 49, 31 56, 42 63 C58 56, 62 38, 85 20 Z" fill="#7FA8B5"/>
    <path d="M85 20 C73 22, 65 37, 45 44 C38 45, 40 50, 48 56 C62 50, 67 33, 85 20 Z" fill="#ECEDEF"/>
  </svg>
  <div style="font-family:'Space Grotesk',sans-serif;font-size:16pt;font-weight:900;color:#2C3322;">
    RUR <span style="color:#4A7A3A;">NATUR</span>
  </div>
  <div style="font-family:'JetBrains Mono',monospace;font-size:8pt;color:#2A6F7E;letter-spacing:.18em;text-transform:uppercase;margin-top:1mm;">
    Corporate Design Manual · Version 1.0 · 2026
  </div>
  <div style="font-size:8pt;color:#8B8273;margin-top:2mm;">Renaturierungs-Simulator · Kreis Düren</div>
</div>
<div class="footer-bar"><span>RUR NATUR · Corporate Design Manual</span><span>Kapitel 8 – Do's & Don'ts</span></div>
</div>

</body>
</html>`;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function swatchCard(hex: string, name: string, token: string, role: string): string {
  const textColor = isLight(hex) ? '#2C3322' : '#ffffff';
  return `
<div class="swatch">
  <div class="swatch-color" style="background:${hex};"></div>
  <div class="swatch-info">
    <span class="swatch-name">${name}</span>
    <span class="swatch-hex">${hex}${token ? ` · ${token}` : ''}</span>
    <span class="swatch-role">${role}</span>
  </div>
</div>`;
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}
