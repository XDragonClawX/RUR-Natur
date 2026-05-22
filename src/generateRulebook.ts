/**
 * Generates a complete, print-ready HTML rulebook that opens in a new tab.
 * The user can then use File → Print → Save as PDF.
 */
export function generateRulebookPDF(): void {
  const html = buildHTML();
  const win = window.open('', '_blank');
  if (!win) {
    alert('Bitte erlaube Pop-ups für diese Seite, um die PDF zu öffnen.');
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildHTML(): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<title>RUR NATUR – Vollständiges Regelwerk</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Space+Grotesk:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  /* ── Reset & Base ───────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 10pt; }
  body {
    font-family: 'Inter', sans-serif;
    color: #2C3322;
    background: #fff;
    line-height: 1.55;
  }

  /* ── Brand Colors ───────────────────────────────────── */
  :root {
    --green:    #4A7A3A;
    --green-dk: #3A6230;
    --teal:     #2A6F7E;
    --amber:    #D97706;
    --purple:   #6B52AE;
    --parchment:#F2EDE4;
    --border:   #D4CCBA;
    --text-dim: #8B8273;
    --text-mid: #5C5549;
  }

  /* ── Page Setup ─────────────────────────────────────── */
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
  }
  @media print {
    body { font-size: 9pt; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; break-before: page; }
    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    a { text-decoration: none; color: inherit; }
  }
  @media screen {
    body { max-width: 210mm; margin: 0 auto; padding: 20mm 16mm; background: #ECEDEF; }
    .page { background: #fff; padding: 18mm 16mm; margin-bottom: 8mm; box-shadow: 0 2px 16px rgba(0,0,0,.12); }
  }

  /* ── Typography ─────────────────────────────────────── */
  h1, h2, h3, h4, h5 { font-family: 'Space Grotesk', sans-serif; line-height: 1.2; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: .15em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  /* ── Cover Page ─────────────────────────────────────── */
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 240mm;
    text-align: center;
    border: 3px solid var(--green);
    border-radius: 8px;
    padding: 24mm 16mm;
  }
  .cover-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: .25em;
    text-transform: uppercase;
    color: var(--teal);
    margin-bottom: 6mm;
  }
  .cover-title {
    font-size: 36pt;
    font-weight: 900;
    color: #2C3322;
    margin-bottom: 2mm;
  }
  .cover-title span { color: var(--green); }
  .cover-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--teal);
    margin-bottom: 10mm;
  }
  .cover-tagline {
    font-size: 11pt;
    color: var(--text-mid);
    max-width: 130mm;
    margin: 0 auto 12mm;
    line-height: 1.6;
  }
  .cover-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 3mm;
    justify-content: center;
    margin-top: 8mm;
  }
  .cover-badge {
    background: var(--parchment);
    border: 1.5px solid var(--border);
    border-radius: 20px;
    padding: 2mm 5mm;
    font-size: 8pt;
    font-weight: 700;
  }

  /* ── Section Headers ────────────────────────────────── */
  .chapter-header {
    display: flex;
    align-items: center;
    gap: 4mm;
    margin-bottom: 5mm;
    padding-bottom: 3mm;
    border-bottom: 2.5px solid var(--green);
  }
  .chapter-icon { font-size: 20pt; }
  .chapter-title {
    font-size: 18pt;
    font-weight: 900;
    color: #2C3322;
  }
  .chapter-subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: .15em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-top: 1mm;
  }
  .section-title {
    font-size: 11pt;
    font-weight: 800;
    color: #2C3322;
    margin: 5mm 0 2.5mm;
    padding-bottom: 1.5mm;
    border-bottom: 1px solid var(--border);
  }

  /* ── Rule Boxes ─────────────────────────────────────── */
  .rule-box {
    border-left: 4px solid var(--green);
    background: #F4F8F1;
    border-radius: 0 6px 6px 0;
    padding: 3mm 4mm;
    margin-bottom: 3mm;
    font-size: 9pt;
  }
  .rule-box.teal  { border-color: var(--teal);   background: #F0F7FA; }
  .rule-box.amber { border-color: var(--amber);  background: #FDF6EC; }
  .rule-box.purple{ border-color: var(--purple); background: #F5F2FC; }
  .rule-box.red   { border-color: #B91C1C;       background: #FEF2F2; }

  /* ── Tables ─────────────────────────────────────────── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-bottom: 4mm;
  }
  thead tr { background: #E8E2D6; }
  th {
    text-align: left;
    padding: 2mm 3mm;
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--text-dim);
    border-bottom: 1.5px solid var(--border);
  }
  td {
    padding: 2mm 3mm;
    border-bottom: 1px solid #EDE8DF;
    vertical-align: top;
    line-height: 1.5;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #FAFAF7; }

  /* ── Building Cards ─────────────────────────────────── */
  .building-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3mm;
    margin-bottom: 4mm;
  }
  .building-card {
    border: 1.5px solid var(--border);
    border-radius: 6px;
    padding: 3mm;
    background: #fff;
  }
  .building-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2mm;
    margin-bottom: 2mm;
  }
  .building-name {
    font-weight: 800;
    font-size: 9pt;
    color: #2C3322;
  }
  .building-cost {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 9pt;
    white-space: nowrap;
  }
  .building-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5mm;
    margin-bottom: 2mm;
  }
  .tag {
    font-size: 7pt;
    font-weight: 700;
    padding: 0.5mm 2mm;
    border-radius: 10px;
    border: 1px solid;
    white-space: nowrap;
  }
  .tag-ecology  { color: #5a7247; background: rgba(90,114,71,.08);  border-color: rgba(90,114,71,.25); }
  .tag-water    { color: #457b9d; background: rgba(69,123,157,.08); border-color: rgba(69,123,157,.25); }
  .tag-fauna    { color: #d97706; background: rgba(217,119,6,.08);  border-color: rgba(217,119,6,.25); }
  .tag-economy  { color: #64748b; background: rgba(100,116,139,.08);border-color: rgba(100,116,139,.25); }
  .tag-tourism  { color: #14b8a6; background: rgba(20,184,166,.08); border-color: rgba(20,184,166,.25); }
  .tag-infra    { color: #7c3aed; background: rgba(124,58,237,.08); border-color: rgba(124,58,237,.25); }
  .tag-terrain  { color: var(--text-dim); background: var(--parchment); border-color: var(--border); }
  .tag-river    { color: #1d4ed8; background: #EFF6FF; border-color: #BFDBFE; }
  .building-effect {
    font-size: 8.5pt;
    color: var(--text-mid);
    line-height: 1.5;
    margin-bottom: 1.5mm;
  }
  .building-special {
    font-size: 7.5pt;
    font-family: 'JetBrains Mono', monospace;
    background: var(--parchment);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1.5mm 2.5mm;
    color: #3A3F45;
  }
  .building-special strong { color: var(--green); }

  /* ── Action Card ────────────────────────────────────── */
  .action-card {
    border: 2px solid;
    border-radius: 8px;
    padding: 4mm;
    margin-bottom: 4mm;
  }
  .action-card-header {
    display: flex;
    align-items: center;
    gap: 3mm;
    margin-bottom: 2.5mm;
  }
  .action-card-icon { font-size: 18pt; }
  .action-card-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: .15em;
    text-transform: uppercase;
  }
  .action-card-name {
    font-size: 13pt;
    font-weight: 900;
  }
  .action-card-desc {
    font-size: 9pt;
    color: var(--text-mid);
    margin-bottom: 2.5mm;
  }
  .strength-row {
    display: flex;
    gap: 2mm;
    align-items: flex-start;
    font-size: 8.5pt;
    padding: 1.5mm 0;
    border-bottom: 1px solid rgba(0,0,0,.06);
  }
  .strength-row:last-child { border-bottom: none; }
  .slot-badge {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 8pt;
    min-width: 14mm;
    color: var(--green);
  }

  /* ── Species Card ───────────────────────────────────── */
  .species-card {
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 4mm;
    margin-bottom: 3.5mm;
    background: #fff;
  }
  .species-header {
    display: flex;
    align-items: center;
    gap: 3mm;
    margin-bottom: 2mm;
  }
  .species-icon { font-size: 22pt; }
  .species-name { font-size: 11pt; font-weight: 800; }
  .species-latin { font-size: 8pt; color: var(--text-dim); font-style: italic; }
  .species-difficulty {
    margin-left: auto;
    font-size: 7pt;
    font-weight: 800;
    padding: 1mm 3mm;
    border-radius: 20px;
    white-space: nowrap;
  }
  .conditions-list { margin: 2mm 0 2mm 4mm; }
  .conditions-list li { font-size: 8.5pt; color: var(--text-mid); margin-bottom: 1mm; }
  .species-effect {
    background: #F8F5EF;
    border-radius: 5px;
    padding: 2mm 3mm;
    font-size: 8.5pt;
    color: var(--text-mid);
    margin-top: 1.5mm;
  }

  /* ── Research Node ──────────────────────────────────── */
  .research-node {
    border: 2px solid;
    border-radius: 7px;
    padding: 4mm;
    margin-bottom: 3.5mm;
  }
  .research-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2mm;
  }
  .research-cost {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 9pt;
    padding: 1mm 3mm;
    border-radius: 4px;
  }
  .research-req {
    font-size: 8pt;
    font-family: 'JetBrains Mono', monospace;
    color: #D97706;
    margin-bottom: 1.5mm;
  }

  /* ── Factory Mode ───────────────────────────────────── */
  .factory-mode {
    border: 2px solid;
    border-radius: 8px;
    padding: 4mm;
    margin-bottom: 3.5mm;
  }
  .factory-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2mm 6mm;
    font-size: 8.5pt;
    margin: 2.5mm 0;
  }
  .factory-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--text-dim);
    display: block;
    margin-bottom: .5mm;
  }

  /* ── Climate Event ──────────────────────────────────── */
  .climate-card {
    border: 2px solid;
    border-radius: 8px;
    padding: 4mm;
    margin-bottom: 3.5mm;
  }
  .climate-header {
    display: flex;
    align-items: center;
    gap: 3mm;
    margin-bottom: 2mm;
  }
  .trigger-badge {
    font-size: 7pt;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    padding: 1mm 2.5mm;
    border-radius: 4px;
    margin-left: auto;
    white-space: nowrap;
  }
  .option-box {
    background: rgba(255,255,255,.6);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 2mm 3mm;
    font-size: 8.5pt;
    margin-top: 1.5mm;
  }
  .option-box strong { color: #2C3322; display: block; margin-bottom: .5mm; }

  /* ── Misc ───────────────────────────────────────────── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 4mm; }
  .stat-card {
    border: 2px solid var(--border);
    border-radius: 7px;
    padding: 3mm;
    background: #fff;
  }
  .stat-icon { font-size: 16pt; margin-bottom: 1.5mm; }
  .stat-name { font-weight: 800; font-size: 10pt; margin-bottom: 1.5mm; }
  .stat-row { font-size: 8pt; margin-bottom: 1mm; }
  .stat-key { font-family: 'JetBrains Mono', monospace; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-dim); }
  .toc { padding: 4mm 0; }
  .toc-item {
    display: flex;
    align-items: center;
    gap: 3mm;
    padding: 2mm 0;
    border-bottom: 1px dotted var(--border);
    font-size: 10pt;
  }
  .toc-num {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    color: var(--teal);
    min-width: 7mm;
  }
  .print-btn {
    position: fixed; bottom: 20px; right: 20px;
    background: var(--green); color: #fff;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 800; font-size: 11pt;
    padding: 3.5mm 7mm; border-radius: 8px;
    border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.25);
    z-index: 999;
  }
  .print-btn:hover { background: var(--green-dk); }
  @media print { .print-btn { display: none; } }
  .footer-bar {
    margin-top: 8mm;
    border-top: 1.5px solid var(--border);
    padding-top: 3mm;
    font-size: 7.5pt;
    color: var(--text-dim);
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    justify-content: space-between;
  }
  hr.divider { border: none; border-top: 1px solid var(--border); margin: 4mm 0; }
  ul.bullet-list { margin-left: 5mm; margin-bottom: 3mm; }
  ul.bullet-list li { font-size: 9pt; margin-bottom: 1.5mm; color: var(--text-mid); }
  ul.bullet-list li strong { color: #2C3322; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Als PDF speichern</button>

<!-- ══════════════════════════════════════════════════════ COVER PAGE -->
<div class="page">
<div class="cover">
  <div class="cover-eyebrow">Renaturierungs-Simulator · Kreis Düren</div>
  <h1 class="cover-title">RUR <span>NATUR</span></h1>
  <div class="cover-sub">Vollständiges Regelwerk & Spielanleitung</div>
  <p class="cover-tagline">
    Der komplette Leitfaden für den Renaturierungs-Simulator der Rur –
    alle Mechaniken, Gebäude, Karten, Forschungspfade, Tierarten und Siegbedingungen.
  </p>
  <div style="display:flex;justify-content:center;margin:6mm 0 4mm;">
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 50 C10 15, 50 10, 85 20 C90 55, 65 85, 50 90 C35 90, 10 75, 10 50 Z" fill="#4A7A3A" />
      <path d="M85 20 C60 25, 50 45, 30 50 C15 52, 22 65, 35 70 C55 65, 60 40, 85 20 Z" fill="#2A6F7E" />
      <path d="M85 20 C68 23, 58 41, 38 48 C28 49, 31 56, 42 63 C58 56, 62 38, 85 20 Z" fill="#7FA8B5" />
      <path d="M85 20 C73 22, 65 37, 45 44 C38 45, 40 50, 48 56 C62 50, 67 33, 85 20 Z" fill="#ECEDEF" />
    </svg>
  </div>
  <div class="cover-badges">
    <span class="cover-badge">🎮 10 Kapitel</span>
    <span class="cover-badge">🏗️ 25 Gebäude</span>
    <span class="cover-badge">🎴 6 Aktionskarten</span>
    <span class="cover-badge">🦫 5 Zielarten</span>
    <span class="cover-badge">🔬 6 Technologien</span>
    <span class="cover-badge">⚡ 4 Klimaereignisse</span>
    <span class="cover-badge">🏆 4 Achievements</span>
  </div>
</div>
<div class="footer-bar">
  <span>RUR NATUR Regelwerk · Kreis Düren</span>
  <span>Spieljahr ab 2026</span>
</div>
</div>

<!-- ══════════════════════════════════════════════════════ TOC -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">📋</span>
  <div>
    <div class="chapter-title">Inhaltsverzeichnis</div>
  </div>
</div>
<div class="toc">
  ${[
    ['1', '🎮', 'Spielübersicht – Ressourcen & Rundensystem'],
    ['2', '🎴', 'Aktionskarten-System – Alle 5 Karten & Stärke-Mechanik'],
    ['3', '🏗️', 'Gebäudekatalog – Alle 25 Projekte in 6 Kategorien'],
    ['4', '🌱', 'Terrain & Bepflanzung – 6 Geländetypen & BEPFLANZUNG-Karte'],
    ['5', '🔬', 'Forschungsbaum – 6 Technologien & Abhängigkeiten'],
    ['6', '🏭', 'Papierfabrik Schoellershammer – 4 Betriebsmodi'],
    ['7', '🦫', 'Artenschutz & Zielarten – 5 bedrohte Leitarten der Rur'],
    ['8', '⚡', 'Klimaereignisse – 4 Krisenereignisse & Entscheidungen'],
    ['9', '🗺️', 'Kartenebenen & Visualisierung'],
    ['10', '🏆', 'Siegbedingungen & Strategietipps'],
  ].map(([n, icon, label]) => `
  <div class="toc-item">
    <span class="toc-num">${n}</span>
    <span>${icon}</span>
    <span>${label}</span>
  </div>`).join('')}
</div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 1: OVERVIEW -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">🎮</span>
  <div>
    <div class="chapter-title">Spielübersicht</div>
    <div class="chapter-subtitle">Ziel · Ressourcen · Rundensystem · Globale Metriken</div>
  </div>
</div>

<div class="rule-box teal">
  <strong>Deine Mission:</strong> Als leitender Umweltbeauftragter im Kreis Düren rettest du die Rur.
  Verbessere die Gewässergüte nach EU-Wasserrahmenrichtlinie (WRRL), maximiere den FFH-Artenschutz
  und ermögliche die Rückkehr bedrohter Tierarten – allen voran des Atlantischen Lachses.
</div>

<div class="section-title">Ressourcen</div>
<div class="grid-2">
  ${[
    { icon:'💶', name:'Budget (€)',        start:'25 €',    gen:'+5 €/Runde Grundsteuer + Gebäudeerträge',                     use:'Gebäude errichten, Forschung, Krisenbewältigung',     color:'#5A7247' },
    { icon:'🧪', name:'Forschungspunkte',  start:'3',       gen:'FORSCHEN-Karte, Natura-Zentrum (+1/Rd), Fabrik-Umbau-Modus', use:'Technologien im Forschungsbaum erforschen',           color:'#2A6F7E' },
    { icon:'🌿', name:'Naturpunkte',       start:'0',       gen:'Gebäude (+3), Artfreischaltung (+15), passive Quellen',       use:'Siegpunkte – kein direkter Verbrauch',                color:'#BC6C25' },
    { icon:'⚠️', name:'Klimarisiko (%)',   start:'15 %',    gen:'+2 % pro Runde (−0,25 % je Auenwald)',                       use:'Löst Katastrophenereignisse aus, ab 30 % Hochwasser', color:'#B91C1C' },
  ].map(r => `
  <div class="stat-card" style="border-color:${r.color}40;">
    <div class="stat-icon">${r.icon}</div>
    <div class="stat-name">${r.name}</div>
    <div class="stat-row"><span class="stat-key">Start:</span> ${r.start}</div>
    <div class="stat-row"><span class="stat-key">Einnahmen:</span> ${r.gen}</div>
    <div class="stat-row"><span class="stat-key">Verwendung:</span> ${r.use}</div>
  </div>`).join('')}
</div>

<div class="section-title">Rundensystem</div>
<div class="rule-box teal">
  <strong>4 Runden = 1 Jahr</strong> · Start: 2026 · Jahreszeitenfolge: Frühling → Sommer → Herbst → Winter<br><br>
  <strong>Pro Runde automatisch:</strong> Budget-Einnahmen · Unterhaltskosten · Passive Punkte · Klimarisiko +2 % · Sommerrunde: Klimaereignisprüfung
</div>

<div class="section-title">Globale Metriken</div>
<table class="avoid-break">
  <thead><tr><th style="width:35%">Metrik</th><th>Schwellenwerte & Bedeutung</th></tr></thead>
  <tbody>
    ${[
      ['💧 WRRL-Güte (1,0 – 5,0)', '≤ 2,2 = Spitzenklasse (Lachstauglich) · ≤ 2,8 = Gut (Eisvogel) · ≤ 3,5 = Mäßig (Bachforelle) · > 3,5 = Kanalisiert'],
      ['🦅 FFH-Biotopschutz (0 – 100 %)', '≥ 65 % = Natura-2000-Großschutzgebiet (Achievement) · Jedes Gebäude erhöht lokalen Wert'],
      ['🐟 Durchgängigkeit (0 – 100 %)', 'Start 30 % · +15 % je Fischpass · +12 % je Sohlgleite · −20 % bei aktivem Kleinkraftwerk · ≥ 60 % = Lachsmigration'],
      ['⚠️ Klimarisiko (0 – 100 %)', '< 20 % = Achievement · ≥ 30 % = Hochwasser · ≥ 40 % = Dürre · Jeder Auwald dämpft −0,25 %/Runde'],
    ].map(([m,d]) => `<tr><td><strong>${m}</strong></td><td>${d}</td></tr>`).join('')}
  </tbody>
</table>
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 1 – Spielübersicht</span></div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 2: ACTION CARDS -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">🎴</span>
  <div>
    <div class="chapter-title">Aktionskarten-System</div>
    <div class="chapter-subtitle">5 permanente Slots · Stärke-Mechanik · Rurtalbahn-Sonderkarte</div>
  </div>
</div>

<div class="rule-box">
  <strong>Kern-Prinzip:</strong> 5 Slots mit Stärken 1–5. Aktivierst du eine Karte, kehrt sie auf Slot 1 zurück.
  Alle Karten rechts rücken nach links (−1 Stärke), alle links rücken nach rechts (+1 Stärke).
  <strong>Taktik:</strong> Lass Karten anwachsen, bevor du sie zündest!
</div>

${[
  { icon:'🏗️', name:'BAUEN',        eyebrow:'Aktionskarte 1', desc:'Platziert ein Gebäude aus dem Katalog auf einem erlaubten Geländefeld. Stärke bestimmt Kostenfreigabe und Rabatt.',
    color:'#5A7247', bg:'#F4F8F1',
    rows:[['⚡1','Max. 4 € Baukosten'],['⚡2','Max. 6 € Baukosten'],['⚡3','Max. 8 € · Materialrabatt −1 €'],['⚡4','Max. 10 € · Materialrabatt −1 €'],['⚡5','Unbegrenzt · Materialrabatt −2 € (Elite)']] },
  { icon:'🌱', name:'BEPFLANZUNG',  eyebrow:'Aktionskarte 2', desc:'Verwandelt Acker→Wiese oder Wiese→Auenwald. Verbessert FFH, reduziert Klimarisiko, schafft Lebensräume.',
    color:'#4A7A3A', bg:'#F4F8F1',
    rows:[['⚡1','1 Acker → Wiese (2 €)'],['⚡2','2 Äcker → Wiesen (je 1,5 €)'],['⚡3','1 Auenwald auf Wiese (kostenlos)'],['⚡4','1 Auenwald + 1 Acker umpflügen (kostenlos)'],['⚡5','2 Äcker/Gewerbe → Auenwald (kostenlos) · Klimarisiko −2 %']] },
  { icon:'🌊', name:'HYDROLOGIE',   eyebrow:'Aktionskarte 3', desc:'Verbessert Flussdynamik, Durchgängigkeit und Selbstreinigung. Reduziert Hochwasserrisiken im gesamten Tal.',
    color:'#2A6F7E', bg:'#F0F7FA',
    rows:[['⚡1','+5 FFH-Potenzial lokal'],['⚡2','+8 % Durchgängigkeit'],['⚡3','+8 % Durchgängigkeit + Feuchtigkeitsaktivierung'],['⚡4','+12 % Durchgängigkeit (global)'],['⚡5','+15 % Durchgängigkeit + −10 % Hochwasserrisiko alle Siedlungsfelder']] },
  { icon:'💶', name:'FÖRDERUNG',    eyebrow:'Aktionskarte 4', desc:'Direkteinspeisung von Fördermitteln aus kommunalen, Landes- und EU-Töpfen.',
    color:'#D97706', bg:'#FDF6EC',
    rows:[['⚡1','+3 € (Kreisförderung)'],['⚡2','+6 € (Naturstiftung NRW)'],['⚡3','+9 € (Landesmittel NRW)'],['⚡4','+12 € + 1 Forschungspunkt (Bundesumweltministerium)'],['⚡5','+16 € + 2 Forschungspunkte (EU LIFE+ Programm)']] },
  { icon:'🧪', name:'FORSCHEN',     eyebrow:'Aktionskarte 5', desc:'Generiert Forschungspunkte für den Technologiebaum.',
    color:'#6B52AE', bg:'#F5F2FC',
    rows:[['⚡1','+1 Forschungspunkt'],['⚡2','+2 Forschungspunkte'],['⚡3','+3 Forschungspunkte + 1 Naturpunkt'],['⚡4','+5 Forschungspunkte + 2 Naturpunkte'],['⚡5','+7 Forschungspunkte + 4 Naturpunkte (Exzellenzcluster)']] },
].map(c => `
<div class="action-card avoid-break" style="border-color:${c.color}50;background:${c.bg};">
  <div class="action-card-header">
    <span class="action-card-icon">${c.icon}</span>
    <div>
      <div class="action-card-eyebrow" style="color:${c.color};">${c.eyebrow}</div>
      <div class="action-card-name" style="color:#2C3322;">${c.name}</div>
    </div>
  </div>
  <div class="action-card-desc">${c.desc}</div>
  ${c.rows.map(([slot,fx]) => `<div class="strength-row"><span class="slot-badge" style="color:${c.color};">${slot}</span><span>${fx}</span></div>`).join('')}
</div>`).join('')}

<div class="action-card avoid-break" style="border-color:#4C3B9A50;background:#F2F0FA;">
  <div class="action-card-header">
    <span class="action-card-icon">🚇</span>
    <div>
      <div class="action-card-eyebrow" style="color:#4C3B9A;">Sonderkarte</div>
      <div class="action-card-name" style="color:#2C3322;">RURTALBAHN-TICKET</div>
    </div>
  </div>
  <div class="action-card-desc">
    Kann für <strong>2 €</strong> geleast werden. Ersetzt Slot 1 temporär für <strong>3 Runden</strong> mit Einnahmen-/Forschungs-/Naturpunkt-Boni.
    Gebäude <em>Rurtalbahn-Haltepunkt</em> muss auf der Karte stehen.<br>
    <strong>Sperrung:</strong> Nicht verfügbar wenn Fabrik im PRODUKTION-Modus (Güterzug-Vorrang).
  </div>
</div>
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 2 – Aktionskarten</span></div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 3: BUILDINGS -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">🏗️</span>
  <div>
    <div class="chapter-title">Gebäudekatalog</div>
    <div class="chapter-subtitle">25 Projekte · 6 Kategorien · Bauregeln & Spezialeffekte</div>
  </div>
</div>

<div class="rule-box avoid-break">
  <strong>Bauregeln:</strong> Jedes Gebäude hat erlaubte Geländetypen.
  <strong>Nur auf Fluss:</strong> Kieslaichbett, Totholz, Sohlgleite.
  <strong>Flussangrenzend:</strong> Altarm, Auenwald-Anpflanzung, Fischpass, Ufer-Entfesselung.
  <strong>Abriss:</strong> Im Rückbau-Modus entfernbar, Feld kehrt zu Urgelände zurück.
  <strong>Upgrades:</strong> 3 Stufen (3–5 Forschungspunkte) → je +15 % FFH, −0,5 WRRL lokal.
</div>

<div class="section-title" style="color:#5a7247;">🌿 Ökologie & Renaturierung</div>
<div class="building-grid">
${[
  { icon:'🔀', name:'Altarm-Anschluss', cost:'8 €', maint:'−1 €/Rd', cat:'Ökologie', terrain:'Auenwiese, Acker', river:'Flussangrenzend',
    effect:'Wiederanbindung von Altarmen. −15 % lokales Hochwasserrisiko, +15 FFH, verbessert WRRL benachbarter Wasserfelder.',
    special:'Verbessert WRRL aller angrenzenden Wasserfelder um −0,5.' },
  { icon:'🌳', name:'Auenwald-Anpflanzung', cost:'5 €', maint:'kostenlos', cat:'Ökologie', terrain:'Wiese, Auenwiese', river:'Flussangrenzend',
    effect:'+20 Feuchtigkeit, senkt Wassertemperatur, ermöglicht Biberreviere. Jeder Auwald dämpft Klimarisiko.',
    special:'Voraussetzung für Biber-Schutzstation. Schaltet Biber-Lebensraum frei.' },
  { icon:'🪵', name:'Totholz-Eintrag', cost:'3 €', maint:'kostenlos', cat:'Ökologie', terrain:'Fluss (Wasser)', river:'Nur Fluss',
    effect:'+10 FFH durch Strukturvielfalt. Totholz schafft Unterschlupf und Laichhabitate für Fische.', special:'' },
  { icon:'⛏️', name:'Ufer-Entfesselung', cost:'6 €', maint:'−1 €/Rd', cat:'Ökologie', terrain:'Wiese, Acker, Ufer', river:'Flussangrenzend',
    effect:'Entfernt Uferbefestigungen, ermöglicht natürliche Flussdynamik. +1 WRRL-Verbesserung.',
    special:'Voraussetzung für Eisvogel-Freischaltung (mit WRRL ≤ 2,8).' },
  { icon:'🪨', name:'Kieslaichbett', cost:'4 €', maint:'kostenlos', cat:'Ökologie', terrain:'Fluss (Wasser)', river:'Nur Fluss',
    effect:'+20 Fischbiodiversität durch saubere Kiessubstrate. Laich für Bachforellen und Neunaugen.',
    special:'Voraussetzung für Bachforellen/Groppe-Freischaltung.' },
].map(b => buildingCard(b)).join('')}
</div>

<div class="section-title" style="color:#457b9d;">🌊 Wasserwirtschaft & Hochwasserschutz</div>
<div class="building-grid">
${[
  { icon:'🐟', name:'Fischpass / Fischtreppe', cost:'7 €', maint:'−1 €/Rd', cat:'Hydrologie', terrain:'Fluss, Wehr', river:'Flussangrenzend',
    effect:'+15 % Durchgängigkeit. Grundvoraussetzung für Lachsmigration flussaufwärts.',
    special:'Voraussetzung für Lachs-Freischaltung. Kleinkraftwerk in der Nähe −20 % Wirkung.' },
  { icon:'🏞️', name:'Deichrückverlegung', cost:'10 €', maint:'−1 €/Rd', cat:'Hydrologie', terrain:'Wiese, Acker', river:'',
    effect:'−25 % Hochwasserrisiko im Sektor, +Feuchtigkeit. Schafft natürlichen Überflutungsraum.', special:'' },
  { icon:'💧', name:'Retentionsraum / Polder', cost:'9 €', maint:'−1 €/Rd', cat:'Hydrologie', terrain:'Wiese, Acker', river:'',
    effect:'Flutungspolder puffert Hochwasserwellen. Schützt benachbarte Siedlungsfelder.',
    special:'Mit Technologie „Auen-Vitalisierung": 100 % Wirksamkeit gegen Hochwasser-Ereignisse.' },
  { icon:'🏔️', name:'Rauhe Sohlgleite', cost:'5 €', maint:'kostenlos', cat:'Hydrologie', terrain:'Fluss (Wasser)', river:'Nur Fluss',
    effect:'+10 % Durchgängigkeit, +Sauerstoffeintrag, verbessert WRRL.',
    special:'Mit „Sohlgleiten-Technologie": −1 € Baukosten, +10 extra FFH.' },
  { icon:'🌧️', name:'Regenrückhaltebecken', cost:'6 €', maint:'−2 €/Rd', cat:'Hydrologie', terrain:'Siedlung, Gewerbe', river:'',
    effect:'Verhindert Starkregen-Überflutung in Siedlungen. Verbessert WRRL aller angrenzenden Flussfelder um −1.', special:'' },
].map(b => buildingCard(b)).join('')}
</div>

<div class="section-title" style="color:#d97706;">🦫 Fauna & Artenschutz</div>
<div class="building-grid">
${[
  { icon:'🦫', name:'Biber-Schutzstation', cost:'5 €', maint:'−1 €/Rd', cat:'Artenschutz', terrain:'Auenwiese, Wiese', river:'',
    effect:'+2 Naturpunkte/Runde. Schadensersatz bei Biberkonflikten halbiert.',
    special:'Voraussetzung: 2+ Auwälder + Biber-Management-Plan erforscht.' },
  { icon:'🐟', name:'Lachs-Zuchtstation', cost:'8 €', maint:'−2 €/Rd', cat:'Artenschutz', terrain:'Fluss, Siedlung', river:'',
    effect:'+3 Naturpunkte/Runde. Zucht und Wiederansiedlung junger Lachse.',
    special:'Freigabe: Durchgängigkeit ≥ 50 % + Lachsprogramm NRW. Voraussetzung für Atlantischen Lachs.' },
  { icon:'🐦', name:'Eisvogel-Nisthilfe', cost:'3 €', maint:'kostenlos', cat:'Artenschutz', terrain:'Steilufer, Wiese', river:'Flussangrenzend',
    effect:'+10 FFH lokal. +1 Naturpunkt/Runde durch Brutpaar-Monitoring.', special:'' },
  { icon:'🦋', name:'Insektenhotel & Blühstreifen', cost:'2 €', maint:'kostenlos', cat:'Artenschutz', terrain:'Wiese, Acker, Siedlung', river:'',
    effect:'+12 FFH lokal durch Blütenvielfalt. Fördert Bestäuber-Netzwerke.',
    special:'Voraussetzung für Blauschillernden Feuerfalter (mit FFH ≥ 45 %).' },
  { icon:'🏛️', name:'Natura 2000 Infozentrum', cost:'12 €', maint:'−3 €/Rd', cat:'Artenschutz', terrain:'Siedlung, Wiese', river:'',
    effect:'+1 Forschungspunkt/Runde + 3 Naturpunkte/Runde. Steigert öffentliche Akzeptanz.', special:'' },
].map(b => buildingCard(b)).join('')}
</div>

<div class="section-title" style="color:#64748b;">💶 Wirtschaft & Landwirtschaft</div>
<div class="building-grid">
${[
  { icon:'🛶', name:'Öko-Tourismus-Station', cost:'6 €', maint:'kostenlos', cat:'Wirtschaft', terrain:'Siedlung, Wiese', river:'',
    effect:'+2 €/Runde. Kanuverleih und geführte Naturführungen.',
    special:'Geringer Wildtier-Stress: −5 FFH lokal.' },
  { icon:'⚡', name:'Klein-Wasserkraftwerk', cost:'15 €', maint:'−1 €/Rd', cat:'Wirtschaft', terrain:'Fluss', river:'Flussangrenzend',
    effect:'+5 €/Runde. Grüne Energiegewinnung.',
    special:'Ohne angrenzenden Fischpass: −20 % Durchgängigkeit. Blockiert Rurtalbahn-Ticket.' },
  { icon:'🚜', name:'Intensive Landwirtschaft', cost:'8 €', maint:'kostenlos', cat:'Wirtschaft', terrain:'Acker', river:'',
    effect:'+8 €/Runde. Hochertragsanbau.',
    special:'Risiko: −1 WRRL durch Nitrat-/Pestizideintrag. Im Dürresommer: −1,5 WRRL zusätzlich.' },
  { icon:'🐄', name:'Extensive Viehweide', cost:'4 €', maint:'kostenlos', cat:'Wirtschaft', terrain:'Wiese, Acker', river:'',
    effect:'+2 €/Runde. Extensivlandwirtschaft bewahrt Artenvielfalt. Keine Wasserverschmutzung.', special:'' },
  { icon:'🏭', name:'Kläranlagen-Upgrade', cost:'14 €', maint:'−3 €/Rd', cat:'Wirtschaft', terrain:'Siedlung, Gewerbe', river:'',
    effect:'+1,5 WRRL für alle Flussfelder flussabwärts. 4. Reinigungsstufe mit Aktivkohle und Ozon.',
    special:'Mit „Fortschrittliche Abwasserreinigung" erforscht: Unterhalt entfällt.' },
].map(b => buildingCard(b)).join('')}
</div>

<div class="section-title" style="color:#7c3aed;">🚇 Infrastruktur & Tourismus</div>
<div class="building-grid">
${[
  { icon:'🚂', name:'Rurtalbahn-Haltepunkt', cost:'8 €', maint:'−1 €/Rd', cat:'Infrastruktur', terrain:'Siedlung, Gewerbe', river:'',
    effect:'Schaltet Rurtalbahn-Sonderkarte frei. −1 € Baurabatt für alle Gebäude im Umkreis von 2 Feldern.', special:'' },
  { icon:'🏕️', name:'Natur-Campingplatz', cost:'6 €', maint:'kostenlos', cat:'Tourismus', terrain:'Wiese, Auenwiese', river:'',
    effect:'+3 €/Runde. Naturnahes Camping im Rurtal.',
    special:'Leichte Störung der Tierwelt: −5 FFH lokal.' },
  { icon:'🏛️', name:'Besucherzentrum Rurtal', cost:'10 €', maint:'−1 €/Rd', cat:'Tourismus', terrain:'Siedlung', river:'',
    effect:'+4 €/Runde + 2 Naturpunkte/Runde. Modernes Informationszentrum zur Renaturierung.', special:'' },
  { icon:'🛶', name:'Kanuverleih & Anlegestelle', cost:'4 €', maint:'kostenlos', cat:'Tourismus', terrain:'Fluss, Siedlung', river:'Flussangrenzend',
    effect:'+2 €/Runde.',
    special:'Leichte Wasserqualitätsbeeinträchtigung durch Bootsverkehr.' },
].map(b => buildingCard(b)).join('')}
</div>
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 3 – Gebäudekatalog</span></div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 4: TERRAIN -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">🌱</span>
  <div>
    <div class="chapter-title">Terrain & Bepflanzung</div>
    <div class="chapter-subtitle">6 Geländetypen · Umwandlungslogik · Flusszonen</div>
  </div>
</div>

<div class="section-title">Geländetypen</div>
<table class="avoid-break">
  <thead><tr><th style="width:22%">Typ</th><th>Beschreibung & Eigenschaften</th></tr></thead>
  <tbody>
    ${[
      ['💧 Wasser (Fluss)', 'Hauptkorridor der Rur. Alle WRRL-Werte. Nur Fluss-exklusive Gebäude (Kieslaichbett, Totholz, Sohlgleite). Grundlage aller Fischwanderungen.'],
      ['🌾 Wiese (Grünland)', 'Standardnaturgelände. Erlaubt die meisten ökologischen Gebäude. Per BEPFLANZUNG-Karte zu Auenwald umwandelbar.'],
      ['🌳 Auenwald', 'Hochwertiger Lebensraum. Entsteht durch BEPFLANZUNG-Karte. Jeder Auenwald: −0,25 % Klimarisiko/Runde, hohe FFH-Werte, Biber-Voraussetzung.'],
      ['🚜 Acker (Landwirtschaft)', 'Intensive Landwirtschaftsfläche. Trägt Intensiv- und Extensivlandwirtschaft. Per BEPFLANZUNG-Karte zu Wiese oder Auenwald umwandelbar.'],
      ['🏘️ Siedlung', 'Urbaner Bereich. Trägt Infrastruktur- und Tourismusgebäude. Besonders hochwassergefährdet. Klärwerk hier möglich.'],
      ['🏭 Gewerbe/Industrie', 'Industriegelände mit Schoellershammer-Fabrik. Im PRODUKTION-Modus senkt die Fabrik die WRRL massiv. Klärwerk und Rurtalbahn-Haltepunkt baubar.'],
    ].map(([t,d]) => `<tr><td><strong>${t}</strong></td><td>${d}</td></tr>`).join('')}
  </tbody>
</table>

<div class="section-title">BEPFLANZUNG-Karte – Umwandlungslogik</div>
<div class="rule-box avoid-break">
  <strong>Acker → Wiese:</strong> 1,5–2 € (je nach Stärke). Entfernt Dünger-/Pestizidrückstände, verbessert lokale FFH.<br>
  <strong>Wiese → Auenwald:</strong> Kostenlos ab Stärke 3. Dämpft ab nächster Runde das Klimarisiko dauerhaft.<br>
  <strong>Acker/Gewerbe → Auenwald (Stärke 5):</strong> Direkte Transformation, Klimarisiko sofort −2 %.
</div>

<div class="section-title">Flusszonen</div>
<table class="avoid-break">
  <thead><tr><th>Zone</th><th>Charakteristik</th><th>WRRL Start</th></tr></thead>
  <tbody>
    <tr><td><strong>Oberlauf (Süd)</strong></td><td>Stausee Obermaubach, naturnahe Eifelstrecke. Hohe FFH-Werte (35), Schutzgebiet.</td><td style="color:#15803d;font-weight:700;">1,8 – Gut</td></tr>
    <tr><td><strong>Mittellauf (Düren)</strong></td><td>Industriegebiet, Schoellershammer-Fabrik. Kritisch belastet, FFH (10), hohes Hochwasserrisiko.</td><td style="color:#b91c1c;font-weight:700;">4,5 – Schlecht</td></tr>
    <tr><td><strong>Unterlauf (Jülich)</strong></td><td>Agrarlandschaft Jülicher Börde. Moderate Belastung durch Landwirtschaft, FFH 18.</td><td style="color:#b45309;font-weight:700;">3,9 – Mäßig</td></tr>
  </tbody>
</table>
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 4 – Terrain & Bepflanzung</span></div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 5: RESEARCH -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">🔬</span>
  <div>
    <div class="chapter-title">Forschungsbaum</div>
    <div class="chapter-subtitle">6 Technologien · 3 Stufen · Abhängigkeitskaskade</div>
  </div>
</div>

<div class="rule-box teal avoid-break">
  Erforsche Technologien über die FORSCHEN-Aktionskarte oder passive Quellen (Natura-Zentrum, Fabrik-Umbau).
  Viele Technologien haben <strong>Voraussetzungen</strong> – das Vorgänger-Projekt muss zuerst erforscht sein.
  Jede Technologie bringt permanente Effekte und schaltet ggf. neue Gebäude oder Zielarten frei.
</div>

<div class="section-title">Stufe I – Grundlagen (keine Voraussetzungen)</div>
${[
  { icon:'🦫', name:'Biber-Management-Plan', cost:'5 🧪', color:'#15803d', bg:'#F0FDF4', req:'',
    effect:'Biberkonflikte kosten 50 % weniger. Biber-Schutzstationen: 2× Naturpunkte. Schaltet Biber-Schutzstation frei.',
    path:'→ Auen-Vitalisierung (Stufe II)' },
  { icon:'🐟', name:'Lachsprogramm NRW', cost:'8 🧪', color:'#be123c', bg:'#FFF1F2', req:'',
    effect:'+30 % Lachs-Wiederansiedlungschance. Lachs-Zuchtstation wird baubar. Voraussetzung für Atlantischen Lachs-Freischaltung.',
    path:'→ Fabrik-Transformationskonzept (Stufe III)' },
  { icon:'🧱', name:'Sohlgleiten-Technologie', cost:'6 🧪', color:'#1d4ed8', bg:'#EFF6FF', req:'',
    effect:'Rauhe Sohlgleite: −1 € Baukosten, +10 extra FFH-Potenzial. Verbesserter ökologischer Wirkungsgrad.',
    path:'→ Fortschrittliche Abwasserreinigung (Stufe II)' },
].map(r => researchNode(r)).join('')}

<div class="section-title">Stufe II – Synergien (Voraussetzungen erforderlich)</div>
${[
  { icon:'🌳', name:'Auen-Vitalisierung & Poldereffizienz', cost:'10 🧪', color:'#15803d', bg:'#F0FDF4',
    req:'Voraussetzung: Biber-Management-Plan',
    effect:'Retentionsräume 100 % effektiv gegen Hochwasser-Ereignisse. Auwälder wachsen 2× schneller. Deichrückbauten erhalten Bonuseffekte.',
    path:'' },
  { icon:'💧', name:'Fortschrittliche Abwasserreinigung', cost:'12 🧪', color:'#0891b2', bg:'#ECFEFF',
    req:'Voraussetzung: Sohlgleiten-Technologie',
    effect:'Kläranlagen-Upgrade-Gebäude: Unterhalt entfällt (−3 €/Runde gespart). Aktivkohle-Ozonstufe für alle Klärwerke.',
    path:'→ Fabrik-Transformationskonzept (Stufe III)' },
].map(r => researchNode(r)).join('')}

<div class="section-title">Stufe III – Transformation (Endziel)</div>
<div class="research-node avoid-break" style="border-color:#7c3aed50;background:#F5F2FC;">
  <div class="research-header">
    <div style="display:flex;align-items:center;gap:3mm;">
      <span style="font-size:18pt;">🏭</span>
      <div style="font-size:12pt;font-weight:900;color:#2C3322;">Fabrik-Transformationskonzept</div>
    </div>
    <span class="research-cost" style="background:#EDE9FE;color:#6d28d9;">18 🧪</span>
  </div>
  <div class="research-req">Voraussetzungen: Lachsprogramm NRW + Fortschrittliche Abwasserreinigung</div>
  <div style="font-size:9pt;color:var(--text-mid);margin-bottom:3mm;">
    Wissenschaftliche Machbarkeitsstudie zur emissionsfreien Umrüstung der Papierfabrik Schoellershammer.
  </div>
  <div style="border:2px solid #7c3aed40;border-radius:6px;padding:3mm;text-align:center;font-weight:800;color:#4c1d95;background:#fff;">
    👑 ULTIMATIVER EFFEKT: Schaltet Fabrik-Modus "VOLLSTÄNDIGE RENATURIERUNG" frei → Heimkehr des Atlantischen Lachses!
  </div>
</div>
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 5 – Forschungsbaum</span></div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 6: FACTORY -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">🏭</span>
  <div>
    <div class="chapter-title">Papierfabrik Schoellershammer</div>
    <div class="chapter-subtitle">4 Betriebsmodi · Wirtschaft vs. Ökologie · Strategische Entscheidung</div>
  </div>
</div>

<div class="rule-box amber avoid-break">
  Die Fabrik ist fix auf Feld (6,6) platziert und kann nicht abgerissen werden.
  Nur ein Modus gleichzeitig aktiv. Der Modus bestimmt maßgeblich WRRL im Mittellauf und dein Budget!
</div>

${[
  { icon:'⚙️', name:'PRODUKTION', avail:'Immer verfügbar', color:'#475569', bg:'#F8FAFC',
    income:'+15 €/Runde', wrrl:'−1,0 WRRL/Jahr (starke Verschmutzung)', rurtalbahn:'❌ Gesperrt (Güterzugvorrang)', research:'—',
    effect:'Maximale Steuereinnahmen. Hohe industrielle Wasserbelastung. Rurtalbahn-Ticket nicht verfügbar.' },
  { icon:'🔧', name:'UMBAU / MODERNISIERUNG', avail:'Immer verfügbar', color:'#b45309', bg:'#FFFBEB',
    income:'+5 €/Runde (−3 € Umbaukosten = +2 € netto)', wrrl:'Neutral', rurtalbahn:'⚠️ Teilweise verfügbar', research:'+1 Forschungspunkt/Runde',
    effect:'Übergangsphase. Weniger Einnahmen, aber passive Forschungsproduktion.' },
  { icon:'🔒', name:'STILLLEGUNG', avail:'Immer verfügbar', color:'#374151', bg:'#F9FAFB',
    income:'−2 €/Runde (Versiegelungskosten)', wrrl:'+0,5 WRRL/Jahr (langsame Regeneration)', rurtalbahn:'✅ Voll verfügbar', research:'—',
    effect:'Keine Einnahmen, Fluss erholt sich langsam. Rurtalbahn-Ticket frei. Nur sinnvoll bei ausreichendem Budget.' },
  { icon:'🌿', name:'VOLLSTÄNDIGE RENATURIERUNG', avail:'Benötigt: Fabrik-Transformationskonzept', color:'#15803d', bg:'#F0FDF4',
    income:'−3 €/Runde (subventioniert)', wrrl:'+2,0 WRRL/Jahr (stärkste Verbesserung im Spiel)', rurtalbahn:'✅ Öko-Express-Netz (Bonus)', research:'Lachsmigration möglich',
    effect:'Endzustand. +35 FFH im Dürener Stadtsektor. Lachsmigration wird ermöglicht (mit Lachs-Zuchtstation + 60 % Durchgängigkeit).' },
].map(m => `
<div class="factory-mode avoid-break" style="border-color:${m.color}40;background:${m.bg};">
  <div style="display:flex;align-items:center;gap:3mm;margin-bottom:2.5mm;">
    <span style="font-size:18pt;">${m.icon}</span>
    <div>
      <div style="font-size:12pt;font-weight:900;color:#2C3322;">${m.name}</div>
      <span style="font-size:7pt;font-weight:700;font-family:'JetBrains Mono',monospace;color:${m.color};text-transform:uppercase;letter-spacing:.1em;">${m.avail}</span>
    </div>
  </div>
  <div class="factory-grid">
    <div><span class="factory-label">Einnahmen</span><strong style="font-family:'JetBrains Mono',monospace;">${m.income}</strong></div>
    <div><span class="factory-label">WRRL-Effekt</span><strong style="font-family:'JetBrains Mono',monospace;">${m.wrrl}</strong></div>
    <div><span class="factory-label">Rurtalbahn</span>${m.rurtalbahn}</div>
    <div><span class="factory-label">Forschung</span>${m.research}</div>
  </div>
  <div style="font-size:8.5pt;color:var(--text-mid);">${m.effect}</div>
</div>`).join('')}
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 6 – Papierfabrik</span></div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 7: SPECIES -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">🦫</span>
  <div>
    <div class="chapter-title">Artenschutz & Zielarten</div>
    <div class="chapter-subtitle">5 bedrohte Leitarten der Rur · Freischaltbedingungen · Effekte</div>
  </div>
</div>

<div class="rule-box amber avoid-break">
  Fünf gefährdete Rur-Leitarten können wiederangesiedelt werden (Fortschrittsbalken 0–100 %).
  Bei 100 % gilt die Art als etabliert: <strong>+15 Naturpunkte sofort</strong> + permanente Ökosystem-Vorteile.
</div>

${[
  { icon:'🐟', name:'Bachforelle & Groppe', latin:'Salmo trutta fario / Cottus gobio', diff:'Einsteiger', diffColor:'#0891b2',
    color:'#0891b2', bg:'#ECFEFF',
    conds:['Globale WRRL ≤ 3,5 (Mäßig oder besser)','Mindestens 1 Kieslaichbett auf der Karte'],
    effect:'Bioindikatoren für gesunden Oberlauf. Voraussetzung für Eisvogel-Freischaltung.' },
  { icon:'🦫', name:'Eurasischer Biber', latin:'Castor fiber', diff:'Mittel', diffColor:'#b45309',
    color:'#b45309', bg:'#FFFBEB',
    conds:['Mindestens 2 Auwälder auf der Karte','Biber-Management-Plan erforscht','Biber-Schutzstation gebaut'],
    effect:'Öko-Ingenieur schafft sekundäre Feuchtbiotope. Erzeugt Biber-Konflikte. +2 Naturpunkte/Runde.' },
  { icon:'🦋', name:'Blauschillernder Feuerfalter', latin:'Lycaena helle', diff:'Mittel', diffColor:'#7c3aed',
    color:'#7c3aed', bg:'#F5F3FF',
    conds:['Mindestens 2 Insektenhotels & Blühstreifen auf der Karte','Globale FFH ≥ 45 %'],
    effect:'Wiesenspezialist, fragil. Indikator für intakte Feuchtwiesen. Dauerhaft +8 FFH durch Bestäuber-Netzwerk.' },
  { icon:'🐦', name:'Eisvogel', latin:'Alcedo atthis', diff:'Schwer', diffColor:'#1d4ed8',
    color:'#1d4ed8', bg:'#EFF6FF',
    conds:['Ufer-Entfesselung gebaut (natürliche Steilufer)','Globale WRRL ≤ 2,8 (Gut)','Bachforelle & Groppe bereits freigeschaltet'],
    effect:'Benötigt kristallklares Wasser und natürliche Ufer. Indikator für Spitzenqualität. +3 Naturpunkte/Runde.' },
  { icon:'👑', name:'Atlantischer Lachs', latin:'Salmo salar', diff:'ENDZIEL', diffColor:'#92400e',
    color:'#92400e', bg:'#FFF7ED',
    conds:['Durchgängigkeit ≥ 60 %','Fabrik NICHT im PRODUKTION-Modus','Lachs-Zuchtstation gebaut','Lachsprogramm NRW erforscht','Fabrik-Transformationskonzept erforscht (für optimales Ergebnis)'],
    effect:'Ultimativer Sieg! +15 Naturpunkte + Achievement „Rückkehr des Königs". Die Rur lebt wieder!' },
].map(s => `
<div class="species-card avoid-break" style="border-color:${s.color}40;">
  <div class="species-header">
    <span class="species-icon">${s.icon}</span>
    <div>
      <div class="species-name">${s.name}</div>
      <div class="species-latin">${s.latin}</div>
    </div>
    <span class="species-difficulty" style="background:${s.color}15;color:${s.color};border:1.5px solid ${s.color}40;">${s.diff}</span>
  </div>
  <div class="label" style="margin-bottom:1.5mm;">Freischaltbedingungen:</div>
  <ul class="conditions-list">
    ${s.conds.map(c => `<li>✓ ${c}</li>`).join('')}
  </ul>
  <div class="species-effect"><strong>Effekt: </strong>${s.effect}</div>
</div>`).join('')}
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 7 – Artenschutz</span></div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 8: CLIMATE -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">⚡</span>
  <div>
    <div class="chapter-title">Klimaereignisse</div>
    <div class="chapter-subtitle">4 Krisenereignisse · Auslöser · Entscheidungsoptionen</div>
  </div>
</div>

<div class="rule-box red avoid-break">
  <strong>Klimarisiko-System:</strong> +2 % pro Runde. Ab Schwellenwerten werden in Sommerrunden Ereignisse ausgewürfelt.
  Jedes Ereignis erzwingt eine Entscheidung mit wirtschaftlichen oder ökologischen Konsequenzen.<br>
  <strong>Dämpfung:</strong> Jeder Auenwald −0,25 % pro Runde dauerhaft. Schutzbauten reduzieren Schäden erheblich.
</div>

${[
  { icon:'🌊', name:'Extrem-Hochwasser', trigger:'Klimarisiko ≥ 30 %', tColor:'#1d4ed8', tBg:'#DBEAFE',
    color:'#1d4ed8', bg:'#EFF6FF',
    desc:'Außergewöhnliche Pegelstände bedrohen Siedlungen und Infrastruktur im Rurtal.',
    opts:[{ label:'Hochwasserschutz prüfen', effect:'Schaden wird durch Deichrückverlegung ODER (Polder + Auen-Vitalisierung) abgefangen. Ohne Schutz: −12 € Katastrophenschaden.' }] },
  { icon:'☀️', name:'Jahrhundert-Dürresommer', trigger:'Klimarisiko ≥ 40 %', tColor:'#c2410c', tBg:'#FFEDD5',
    color:'#c2410c', bg:'#FFF7ED',
    desc:'Extremhitze und Wassermangel. Niedrigwasser gefährdet alle Wasserlebewesen.',
    opts:[
      { label:'Talsperre-Notflutung (−4 €)', effect:'Erzwungene Wasserabgabe aus Stausee Obermaubach mindert Niedrigwasserschäden.' },
      { label:'Naturereignis aussitzen', effect:'−1 WRRL global. Intensive Landwirtschaft: zusätzlich −1,5 WRRL. Hält 2 Runden an.' },
    ] },
  { icon:'🦫', name:'Biber-Konflikt', trigger:'Nach Biber-Freischaltung', tColor:'#b45309', tBg:'#FEF3C7',
    color:'#b45309', bg:'#FFFBEB',
    desc:'Biber-Dämme überfluten Ackerflächen. Landwirte fordern Entschädigung oder Entfernung.',
    opts:[
      { label:'Ausgleichszahlung (−6 € / −3 € mit Management)', effect:'+5 Naturpunkte. Biberbauten bleiben. Mit Biber-Management-Plan: Kosten halbiert.' },
      { label:'Dämme abtragen', effect:'−30 % Biber-Fortschritt. Art verliert Etablierungsstatus temporär.' },
    ] },
  { icon:'📢', name:'Bürgerdialog & Gegenwind', trigger:'Nach Ufer-Entfesselung', tColor:'#be123c', tBg:'#FFE4E6',
    color:'#be123c', bg:'#FFF1F2',
    desc:'Anwohner protestieren gegen Renaturierungsmaßnahmen.',
    opts:[
      { label:'Aufklärungskampagne (−4 €)', effect:'Öffentliche Akzeptanz steigt. Natura-2000-Infozentrum reduziert dieses Risiko dauerhaft.' },
      { label:'Abwarten', effect:'Nächste Aktionskarten-Ausführung kostet eine zusätzliche Runde Verzögerung.' },
    ] },
].map(ev => `
<div class="climate-card avoid-break" style="border-color:${ev.color}50;background:${ev.bg};">
  <div class="climate-header">
    <span style="font-size:20pt;">${ev.icon}</span>
    <div>
      <div style="font-size:12pt;font-weight:900;color:#2C3322;">${ev.name}</div>
    </div>
    <span class="trigger-badge" style="background:${ev.tBg};color:${ev.tColor};">Auslöser: ${ev.trigger}</span>
  </div>
  <div style="font-size:9pt;color:var(--text-mid);margin-bottom:2mm;">${ev.desc}</div>
  ${ev.opts.map(o => `<div class="option-box"><strong>Option: „${o.label}"</strong>${o.effect}</div>`).join('')}
</div>`).join('')}
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 8 – Klimaereignisse</span></div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 9: MAP LAYERS -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">🗺️</span>
  <div>
    <div class="chapter-title">Kartenebenen & Visualisierung</div>
    <div class="chapter-subtitle">4 Anzeigemodi · Gebäude-Inspektor · Bau- & Rückbau-Modus</div>
  </div>
</div>

<div class="section-title">Kartenebenen</div>
<table class="avoid-break">
  <thead><tr><th style="width:18%">Ebene</th><th>Beschreibung & Nutzen</th></tr></thead>
  <tbody>
    ${[
      ['🏞️ NORMAL', 'Standardansicht mit Gelände und Gebäuden. Gültige Bauplätze leuchten auf, wenn ein Gebäude ausgewählt ist.'],
      ['💧 WRRL-GÜTE', 'Farbskala der ökologischen Gewässergüte. Dunkelgrün = Spitze (1,0), Rot/Braun = Schlecht (5,0). Zeigt wo Renaturierungsbedarf besteht.'],
      ['🦅 FFH-BIOTOP', 'Artenvielfalt-Heatmap. Je grüner, desto artenreicher. Braune Flächen brauchen Aufwertung.'],
      ['🏠 HOCHWASSER', 'Überflutungsrisiko. Rote Felder akut gefährdet. Blaue Felder geschützt. Deiche, Polder und Auwälder reduzieren das Risiko.'],
    ].map(([l,d]) => `<tr><td><strong>${l}</strong></td><td>${d}</td></tr>`).join('')}
  </tbody>
</table>

<div class="section-title">Gebäude-Inspektor</div>
<div class="rule-box teal">
  Klicke auf ein bereits gebautes Gebäude, um den Inspektor anzuzeigen: Name, Kategorie, Koordinaten,
  Geländetyp, Baukosten, Unterhalt, Spezialeffekte, Upgrade-Level.
</div>

<div class="section-title">Bau- & Rückbau-Modus</div>
<div class="rule-box">
  <strong>Bau-Modus:</strong> Gebäude im Katalog wählen → auf hervorgehobenes Feld klicken. Kosten werden BAUEN-Karten-Rabatte eingerechnet.<br><br>
  <strong>Rückbau-Modus:</strong> Werkzeug-Button aktivieren → bebautes Feld klicken. Feld kehrt zu Urgelände zurück.
  Sinnvoll um z.B. Intensive Landwirtschaft durch ökologische Alternativen zu ersetzen.
</div>
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 9 – Kartenebenen</span></div>
</div>

<!-- ══════════════════════════════════════════════════════ CH 10: VICTORY -->
<div class="page page-break">
<div class="chapter-header">
  <span class="chapter-icon">🏆</span>
  <div>
    <div class="chapter-title">Siegbedingungen & Strategietipps</div>
    <div class="chapter-subtitle">4 Achievements · Wirtschaftsloop · 6 Strategietipps</div>
  </div>
</div>

<div class="rule-box amber avoid-break">
  RUR NATUR hat <strong>keine fixe Rundengrenze</strong>. Du spielst so lange, bis du alle Ziele erreicht hast.
  Achievements können im Reports-Tab eingesehen werden.
</div>

<div class="section-title">4 Haupt-Achievements</div>
<table class="avoid-break">
  <thead><tr><th style="width:28%">Achievement</th><th>Bedingung</th><th>Schlüsselstrategie</th></tr></thead>
  <tbody>
    ${[
      ['👑 Rückkehr des Königs', 'Atlantischen Lachs wiederansiedeln', 'Durchgängigkeit ≥ 60 % · Fabrik auf RENATURIERUNG · Lachs-Zuchtstation · Lachsprogramm NRW'],
      ['💧 Flüssiges Gold', 'WRRL ≤ 2,2 (Spitzenklasse)', 'Fabrik auf RENATURIERUNG · Kläranlagen-Upgrade + Fortschr. Abwasserreinigung · Altarm-Anschlüsse'],
      ['🦅 Natura-2000 Schutzgebiet', 'FFH ≥ 65 %', 'Viele Insektenhotels · Mehrere Auwälder · Auenwald-Anpflanzungen · Kieslaichbetten'],
      ['🛡️ Klimaresistenz-Festung', 'Klimarisiko < 20 %', 'Viele Auwälder (−0,25 % / Stück) · Deichrückverlegungen · Polder · Auen-Vitalisierung'],
    ].map(([a,c,s]) => `<tr><td><strong>${a}</strong></td><td>${c}</td><td>${s}</td></tr>`).join('')}
  </tbody>
</table>

<div class="section-title">Wirtschaftsloop pro Runde</div>
<table class="avoid-break">
  <thead><tr><th>Einnahmequelle</th><th style="width:28%">Betrag</th></tr></thead>
  <tbody>
    ${[
      ['Grundsteuer (Kreishaushalt)', '+5 €/Runde – immer'],
      ['Fabrik: PRODUKTION', '+15 €/Runde'],
      ['Fabrik: UMBAU (netto)', '+2 €/Runde'],
      ['Fabrik: RENATURIERUNG', '−3 €/Runde'],
      ['Besucherzentrum Rurtal', '+4 €/Runde'],
      ['Natur-Campingplatz', '+3 €/Runde'],
      ['Klein-Wasserkraftwerk', '+5 €/Runde'],
      ['Öko-Tourismus / Kanuverleih', '+2 €/Runde je Station'],
      ['Extensive Viehweide', '+2 €/Runde'],
      ['Intensive Landwirtschaft', '+8 €/Runde (−WRRL!)'],
    ].map(([s,a]) => `<tr><td>${s}</td><td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--green);">${a}</td></tr>`).join('')}
  </tbody>
</table>

<div class="section-title">6 Strategietipps</div>
<table class="avoid-break">
  <tbody>
    ${[
      ['💡','Baue früh ein Natura-2000-Infozentrum – es liefert +1 Forschungspunkt/Runde passiv und beschleunigt den gesamten Forschungsbaum erheblich.'],
      ['⚡','Lass die FORSCHEN-Karte auf Stärke 4–5 anwachsen, bevor du sie zündest. So sammelst du bis zu 7 Forschungspunkte in einer einzigen Aktion.'],
      ['🌳','Pflanze Auwälder strategisch: Sie dämpfen dauerhaft das Klimarisiko (−0,25 %/Rd) und sind Biber-Voraussetzung. Je mehr, desto besser.'],
      ['🏭','Schalte frühzeitig auf Fabrik-UMBAU um: Forschungspunkt-Passivproduktion spart Aktionskarten-Züge und hält das Budget noch tragbar.'],
      ['🐟','Für den Lachs-Sieg: Durchgängigkeit zuerst! Fischtreppen und Sohlgleiten bauen, bevor du in andere Gebäude investierst.'],
      ['💶','Die FÖRDERUNG-Karte bei Stärke 5 bringt 16 € + 2 Forschungspunkte – ein enormer Schub. Spare sie für kritische Investitionsmomente.'],
    ].map(([i,t]) => `<tr><td style="width:12mm;font-size:14pt;vertical-align:top;padding-top:2mm;">${i}</td><td style="font-size:9pt;color:var(--text-mid);padding:2mm 0 2mm 3mm;">${t}</td></tr>`).join('')}
  </tbody>
</table>

<div style="margin-top:10mm;text-align:center;padding:6mm;background:var(--parchment);border:2px solid var(--border);border-radius:8px;">
  <div style="font-family:'Space Grotesk',sans-serif;font-size:14pt;font-weight:900;color:#2C3322;margin-bottom:2mm;">
    RUR <span style="color:var(--green);">NATUR</span>
  </div>
  <div style="font-family:'JetBrains Mono',monospace;font-size:8pt;color:var(--teal);letter-spacing:.18em;text-transform:uppercase;">
    Renaturierungs-Simulator · Kreis Düren
  </div>
  <div style="font-size:8pt;color:var(--text-dim);margin-top:2mm;">Vollständiges Regelwerk · Spieljahr ab 2026</div>
</div>
<div class="footer-bar"><span>RUR NATUR Regelwerk</span><span>Kapitel 10 – Sieg & Strategie</span></div>
</div>

</body>
</html>`;
}

// ─── Helper renderers ─────────────────────────────────────────────────────────

function buildingCard(b: {
  icon: string; name: string; cost: string; maint: string;
  cat: string; terrain: string; river: string; effect: string; special: string;
}): string {
  const catClass: Record<string, string> = {
    'Ökologie': 'tag-ecology', 'Hydrologie': 'tag-water', 'Artenschutz': 'tag-fauna',
    'Wirtschaft': 'tag-economy', 'Tourismus': 'tag-tourism', 'Infrastruktur': 'tag-infra',
  };
  return `
<div class="building-card avoid-break">
  <div class="building-card-header">
    <div style="display:flex;align-items:center;gap:2mm;">
      <span style="font-size:16pt;">${b.icon}</span>
      <span class="building-name">${b.name}</span>
    </div>
    <div style="text-align:right;">
      <div class="building-cost">${b.cost}</div>
      <div style="font-size:7.5pt;color:#b45309;font-family:'JetBrains Mono',monospace;">${b.maint}</div>
    </div>
  </div>
  <div class="building-tags">
    <span class="tag ${catClass[b.cat] || ''}">${b.cat}</span>
    <span class="tag tag-terrain">${b.terrain}</span>
    ${b.river ? `<span class="tag tag-river">${b.river}</span>` : ''}
  </div>
  <div class="building-effect">${b.effect}</div>
  ${b.special ? `<div class="building-special"><strong>Spezialeffekt:</strong> ${b.special}</div>` : ''}
</div>`;
}

function researchNode(r: {
  icon: string; name: string; cost: string; color: string; bg: string;
  req: string; effect: string; path: string;
}): string {
  return `
<div class="research-node avoid-break" style="border-color:${r.color}40;background:${r.bg};">
  <div class="research-header">
    <div style="display:flex;align-items:center;gap:3mm;">
      <span style="font-size:16pt;">${r.icon}</span>
      <div style="font-size:11pt;font-weight:800;color:#2C3322;">${r.name}</div>
    </div>
    <span class="research-cost" style="background:${r.color}15;color:${r.color};">${r.cost}</span>
  </div>
  ${r.req ? `<div class="research-req">${r.req}</div>` : ''}
  <div style="font-size:9pt;color:var(--text-mid);margin-bottom:${r.path ? '1.5mm' : '0'};">${r.effect}</div>
  ${r.path ? `<div style="font-size:8pt;font-family:'JetBrains Mono',monospace;color:#7c3aed;font-weight:700;">${r.path}</div>` : ''}
</div>`;
}
