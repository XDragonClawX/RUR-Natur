import React, { useState, useMemo } from 'react';
import {
  TileData, BuildingType, ResearchNode, Species, PaperFactoryMode, GameLog, GameStats
} from '../types';
import {
  Hammer, Factory, Microscope, Leaf, FileText, ChevronRight,
  Droplets, ShieldAlert, Footprints, Users,
  Gauge, Activity, ChevronDown, ChevronUp,
  Shield, Zap, AlertTriangle, TrendingUp
} from 'lucide-react';
import { BuildingCatalog } from './BuildingCatalog';
import { SchoellershammerConsole } from './SchoellershammerConsole';
import { ResearchTree } from './ResearchTree';
import { SpeciesTracker } from './SpeciesTracker';
import { DashboardReports } from './DashboardReports';

interface ActiveSimulationPanelProps {
  activeTab: 'map' | 'schoeller' | 'research' | 'species' | 'reports';
  setActiveTab: (tab: 'map' | 'schoeller' | 'research' | 'species' | 'reports') => void;
  stats: GameStats;
  grid: TileData[][];
  researchTree: ResearchNode[];
  speciesList: Species[];
  selectedBuilding: BuildingType | null;
  onSelectBuilding: (building: BuildingType | null) => void;
  checkRurtalbahnDiscountActiveOnMap: boolean;
  onDemolishModeToggle: () => void;
  isDemolishMode: boolean;
  selectedTileInfo: { x: number, y: number, building: BuildingType, tile: TileData } | null;
  handleUpgradeBuilding: (x: number, y: number) => void;
  handleChangePaperFactoryMode: (mode: PaperFactoryMode) => void;
  handleUnlockResearch: (nodeId: string) => void;
  handleTriggerPdfSim: () => void;
  pdfSimulated: boolean;
  logs: GameLog[];
  invasiveThreatEnabled: boolean;
  energyChallengeEnabled: boolean;
  onToggleInvasive: (enabled: boolean) => void;
  onToggleEnergy: (enabled: boolean) => void;
  onShowInvasiveRules: () => void;
  onShowEnergyRules: () => void;
  roundInvested: boolean;
  rurtalbahnLeased: boolean;
  rurtalbahnTimeRemaining: number;
  onLeaseRurtalbahn: () => void;
}

// ── Tab colour tokens ─────────────────────────────────────────────────────────
const TAB_PALETTE = {
  map: {
    bg:      'bg-[#5A7247]/10',
    text:    'text-[#5A7247]',
    badge:   'bg-[#D4E0C1] text-[#2C3322] border-[#5A7247]/30',
    bar:     'bg-[#5A7247]',
    accent:  'border-l-[#5A7247]',
    headerBg: 'bg-[#EEF5E8]',
    bodyBg:  'bg-[#F5FAF2]',
    led:     'bg-[#5A7247]',
    ring:    'focus-visible:ring-[#5A7247]/40',
    divider: 'border-[#C8DDB3]',
  },
  schoeller: {
    bg:      'bg-[#BC6C25]/10',
    text:    'text-[#BC6C25]',
    badge:   'bg-amber-100 text-[#7A3F1F] border-[#BC6C25]/20',
    bar:     'bg-[#BC6C25]',
    accent:  'border-l-[#BC6C25]',
    headerBg: 'bg-amber-50',
    bodyBg:  'bg-[#FDFAF6]',
    led:     'bg-[#BC6C25]',
    ring:    'focus-visible:ring-[#BC6C25]/40',
    divider: 'border-[#E8C99A]',
  },
  research: {
    bg:      'bg-sky-500/10',
    text:    'text-sky-700',
    badge:   'bg-sky-50 text-sky-800 border-sky-200',
    bar:     'bg-sky-500',
    accent:  'border-l-sky-500',
    headerBg: 'bg-sky-50',
    bodyBg:  'bg-[#F5FAFD]',
    led:     'bg-sky-500',
    ring:    'focus-visible:ring-sky-400/40',
    divider: 'border-sky-200',
  },
  species: {
    bg:      'bg-emerald-500/10',
    text:    'text-emerald-700',
    badge:   'bg-emerald-50 text-emerald-800 border-emerald-300/50',
    bar:     'bg-emerald-600',
    accent:  'border-l-emerald-500',
    headerBg: 'bg-emerald-50',
    bodyBg:  'bg-[#F4FBF7]',
    led:     'bg-emerald-500',
    ring:    'focus-visible:ring-emerald-400/40',
    divider: 'border-emerald-200',
  },
  reports: {
    bg:      'bg-[#457b9d]/10',
    text:    'text-[#1D4E5B]',
    badge:   'bg-[#EBF3F5] text-[#1D4E5B] border-[#457b9d]/30',
    bar:     'bg-[#457b9d]',
    accent:  'border-l-[#457b9d]',
    headerBg: 'bg-[#EBF3F5]',
    bodyBg:  'bg-[#F3F8FB]',
    led:     'bg-[#457b9d]',
    ring:    'focus-visible:ring-[#457b9d]/40',
    divider: 'border-[#A8CADA]',
  },
} as const;

// ── Tab metadata ──────────────────────────────────────────────────────────────
const TAB_META = {
  map: {
    label:    'Baumodus',
    sublabel: 'PLANUNG',
    title:    'Baukatalog & Planung',
    desc:     'Errichte renaturierende Wasserbauten, Fischlaichbetten und biodiverse Uferbereiche entlang der Flusskarte.',
    icon:     Hammer,
  },
  schoeller: {
    label:    'Industrie',
    sublabel: 'FABRIK',
    title:    'Werk Schoellershammer',
    desc:     'Steuere den Betriebsmodus der Papierfabrik. Balanciere Gewinne, Arbeitsplätze und Filtertechnik-Investitionen.',
    icon:     Factory,
  },
  research: {
    label:    'Forschung',
    sublabel: 'INNOVATION',
    title:    'Innovationszentrum',
    desc:     'Schalte technologische Filter-Upgrades, Gewässerschutzkonzepte und LIFE+ Fördergelder frei.',
    icon:     Microscope,
  },
  species: {
    label:    'Fauna & Arten',
    sublabel: 'BIOTOP',
    title:    'Biotop-Beobachtung',
    desc:     'Verfolge Leitarten wie Biber, Flusskrebs und Lachs. Bewerte die Biotop-Güte aller Habitatzonen.',
    icon:     Leaf,
  },
  reports: {
    label:    'Controlling',
    sublabel: 'AUDIT',
    title:    'Umwelt-Audit',
    desc:     'Analysiere WRRL-Güte, globale Resilienzen und erstelle offizielle Jahresberichte der Kreisbehörde.',
    icon:     FileText,
  },
} as const;

// ── WRRL colour helper ────────────────────────────────────────────────────────
const wrrlColor = (v: number) =>
  v <= 2.2 ? 'bg-emerald-500' :
  v <= 3.0 ? 'bg-teal-500' :
  v <= 3.8 ? 'bg-amber-500' : 'bg-rose-500';

const wrrlTextColor = (v: number) =>
  v <= 2.2 ? 'text-emerald-700' :
  v <= 3.0 ? 'text-teal-700' :
  v <= 3.8 ? 'text-amber-700' : 'text-rose-700';

// ── Component ─────────────────────────────────────────────────────────────────
export const ActiveSimulationPanel: React.FC<ActiveSimulationPanelProps> = ({
  activeTab,
  setActiveTab,
  stats,
  grid,
  researchTree,
  speciesList,
  selectedBuilding,
  onSelectBuilding,
  checkRurtalbahnDiscountActiveOnMap,
  onDemolishModeToggle,
  isDemolishMode,
  selectedTileInfo,
  handleUpgradeBuilding,
  handleChangePaperFactoryMode: onChangePaperFactoryMode,
  handleUnlockResearch: onUnlockResearch,
  handleTriggerPdfSim: onTriggerPdfSim,
  pdfSimulated,
  logs,
  invasiveThreatEnabled,
  energyChallengeEnabled,
  onToggleInvasive,
  onToggleEnergy,
  onShowInvasiveRules,
  onShowEnergyRules,
  roundInvested,
  rurtalbahnLeased,
  rurtalbahnTimeRemaining,
  onLeaseRurtalbahn,
}) => {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [scenariosOpen, setScenariosOpen] = useState(false);

  const energyCalc = useMemo(() => {
    const isGreenEnergyTechUnlocked = researchTree.find(r => r.id === 'green_energy_tech')?.unlocked || false;
    const flatGrid = grid.flat();
    const hydroCount  = flatGrid.filter(t => t.buildingId === 'wasserkraft').length;
    const solarCount  = flatGrid.filter(t => t.buildingId === 'solarpark').length;
    const windCount   = flatGrid.filter(t => t.buildingId === 'windkraft').length;
    const decay = isGreenEnergyTechUnlocked ? -5 : -10;
    const generation  = (hydroCount * 12) + (solarCount * 10) + (windCount * 15);
    const investBonus = roundInvested ? 10 : 0;
    const netDelta    = decay + generation + investBonus;
    const projected   = Math.max(0, Math.min(100, (stats.renewableEnergy ?? 25) + netDelta));
    return { hydroCount, solarCount, windCount, decay, generation, investBonus, netDelta, projected };
  }, [researchTree, grid, roundInvested, stats.renewableEnergy]);

  const tabsArray = ['map', 'schoeller', 'research', 'species', 'reports'] as const;
  const p  = TAB_PALETTE[activeTab];
  const m  = TAB_META[activeTab];

  // ── Live badge per tab ──
  const getBadge = (tabId: typeof tabsArray[number]) => {
    switch (tabId) {
      case 'map': {
        const n = grid.flat().filter(t => t.buildingId && t.buildingId !== 'schoellershammer').length;
        return { text: `${n} aktive Bauten`, color: 'bg-[#5A7247]/8 text-[#4A5D3A] border-[#5A7247]/20' };
      }
      case 'schoeller': {
        const modeMap: Record<string, string> = {
          PRODUCTION: 'Vollbetrieb', RETROFITTING: 'Filter-Sektor',
          SHUTDOWN: 'Stillgelegt', RENATURIZATION: 'Rückbau',
        };
        const colorMap: Record<string, string> = {
          PRODUCTION:    'bg-rose-50 text-rose-800 border-rose-200',
          RETROFITTING:  'bg-amber-50 text-amber-800 border-amber-300',
          SHUTDOWN:      'bg-stone-100 text-stone-700 border-stone-300',
          RENATURIZATION:'bg-emerald-50 text-emerald-800 border-emerald-300',
        };
        return { text: modeMap[stats.paperFactoryMode] ?? stats.paperFactoryMode, color: colorMap[stats.paperFactoryMode] ?? '' };
      }
      case 'research': {
        const u = researchTree.filter(r => r.unlocked).length;
        return { text: `${u} / ${researchTree.length} erforscht`, color: 'bg-sky-50 text-sky-800 border-sky-200' };
      }
      case 'species': {
        const a = speciesList.filter(s => s.unlocked || s.currentProgress >= 100).length;
        return { text: `${a} / ${speciesList.length} Arten`, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      }
      case 'reports': {
        const grade = stats.globalWrrl <= 2.8 ? 'A' : stats.globalWrrl <= 3.5 ? 'B' : 'C';
        return { text: `Klasse ${grade} — WRRL-Siegel`, color: 'bg-blue-50 text-blue-800 border-blue-200' };
      }
    }
  };

  const activeBadge = getBadge(activeTab);

  // ── System metrics (4 cards) ──
  const metrics = [
    {
      Icon:       Droplets,
      label:      'Gewässergüte',
      unit:       'WRRL-Index',
      value:      stats.globalWrrl.toFixed(2),
      suffix:     '',
      barWidth:   `${Math.max(4, Math.min(100, ((5 - stats.globalWrrl) / 4) * 100))}%`,
      barColor:   wrrlColor(stats.globalWrrl),
      valueColor: wrrlTextColor(stats.globalWrrl),
    },
    {
      Icon:       Leaf,
      label:      'FFH-Biotop',
      unit:       'Habitatwert',
      value:      String(stats.globalFfh),
      suffix:     '%',
      barWidth:   `${stats.globalFfh}%`,
      barColor:   'bg-[#5A7247]',
      valueColor: 'text-[#5A7247]',
    },
    {
      Icon:       Footprints,
      label:      'Durchgängigkeit',
      unit:       'Fischwanderpfad',
      value:      String(stats.continuity),
      suffix:     '%',
      barWidth:   `${stats.continuity}%`,
      barColor:   'bg-indigo-500',
      valueColor: 'text-indigo-700',
    },
    {
      Icon:       Users,
      label:      'Bürgerakzeptanz',
      unit:       'Kreisbevölkerung',
      value:      String(stats.citizenAcceptance),
      suffix:     '%',
      barWidth:   `${stats.citizenAcceptance}%`,
      barColor:   'bg-[#BC6C25]',
      valueColor: 'text-[#BC6C25]',
    },
  ];

  return (
    <div className="bg-[#FAF8F5] border border-[#D4CCBA] rounded-xl shadow-md overflow-hidden flex flex-col h-[724px] lg:h-[874px]">

      {/* ── COCKPIT HEADER ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#D4CCBA] gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#5A7247] shrink-0" aria-hidden="true" />
              <h2 className="text-[13px] font-black text-[#262A1F] uppercase tracking-wider font-sans leading-none truncate">
                Steuer-Cockpit &amp; System-Zentralen
              </h2>
            </div>
            <p className="text-[11px] text-[#8B8273] font-mono uppercase leading-none mt-1 truncate">
              Rur-Ökomodell · Simulation läuft · Jahr {stats.year} · Q{((stats.round - 1) % 4) + 1}
            </p>
          </div>
        </div>
        {/* ── Rurtalbahn Ticket action button ───────────────────────── */}
        {rurtalbahnLeased ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 shrink-0 select-none" title="Rurtalbahn-Karte ist aktiv">
            <span className="text-sm leading-none">🚇</span>
            <div className="text-left">
              <div className="text-[10px] font-black uppercase tracking-wide text-indigo-700 leading-none">Rurtalbahn</div>
              <div className="text-[11px] font-mono font-black text-indigo-900 leading-tight tabular-nums">
                {rurtalbahnTimeRemaining} Rd. verbleibend
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onLeaseRurtalbahn}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F3EDE2] border border-[#D4CCBA] hover:bg-indigo-50 hover:border-indigo-300 transition-all active:scale-95 cursor-pointer shrink-0 group"
            title="Rurtalbahn Sonderticket mieten — ersetzt Aktionsslot 1 für 3 Runden (Kosten: 2 €)"
          >
            <span className="text-sm leading-none">🚇</span>
            <div className="text-left">
              <div className="text-[10px] font-black uppercase tracking-wide text-[#8B8273] group-hover:text-indigo-700 leading-none transition-colors">Rurtalbahn</div>
              <div className="text-[11px] font-mono font-black text-[#5C564C] group-hover:text-indigo-900 leading-tight transition-colors">
                Ticket mieten · 2 €
              </div>
            </div>
          </button>
        )}

        {/* Year / Round pill */}
        <div className="flex items-stretch gap-0 border border-[#D4CCBA] rounded-lg overflow-hidden shrink-0 bg-[#F3EDE2]">
          <div className="px-2.5 py-1.5 text-center">
            <div className="text-[10px] font-mono text-[#8B8273] uppercase leading-none">Jahr</div>
            <div className="text-[13px] font-black text-[#2C3322] font-mono tabular-nums leading-tight mt-0.5">{stats.year}</div>
          </div>
          <div className="w-px bg-[#D4CCBA]" />
          <div className="px-2.5 py-1.5 text-center">
            <div className="text-[10px] font-mono text-[#8B8273] uppercase leading-none">Runde</div>
            <div className={`text-[13px] font-black font-mono tabular-nums leading-tight mt-0.5 ${p.text}`}>R{stats.round}</div>
          </div>
        </div>
      </div>

      {/* ── TAB STRIP ────────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Cockpit-Bereiche"
        className="grid grid-cols-5 divide-x divide-[#D4CCBA] border-b border-[#D4CCBA] bg-[#EAE4D7]/70"
      >
        {tabsArray.map((tId) => {
          const isActive = activeTab === tId;
          const tp  = TAB_PALETTE[tId];
          const tm  = TAB_META[tId];
          const TabIcon = tm.icon;
          const badge   = getBadge(tId);
          return (
            <button
              key={tId}
              role="tab"
              aria-selected={isActive}
              aria-controls="cockpit-workspace"
              onClick={() => { setActiveTab(tId); if (tId !== 'map') onSelectBuilding(null); }}
              className={`
                relative flex flex-col items-center justify-center gap-1.5
                py-3 px-2 min-h-[56px] cursor-pointer transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${tp.ring}
                ${isActive ? 'bg-white' : 'bg-[#F2ECE1]/80 hover:bg-white/70'}
              `}
              title={`${tm.title} — ${badge.text}`}
            >
              {isActive && (
                <span className={`absolute bottom-0 left-0 right-0 h-[3px] ${tp.bar} rounded-t-sm`} aria-hidden="true" />
              )}
              <div className={`p-1.5 rounded-lg transition-all duration-150 ${isActive ? `${tp.bg} ${tp.text}` : 'text-[#A29A8C]'}`}>
                <TabIcon className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wide leading-none transition-colors duration-150 ${isActive ? tp.text : 'text-[#8B8273]'}`}>
                {tm.sublabel}
              </span>
              {!isActive && (
                <span className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full opacity-0 group-hover:opacity-30 transition-opacity ${tp.bar}`} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── INFO ACCORDION ───────────────────────────────────────────────── */}
      <div className={`border-b ${p.divider} border-l-4 ${p.accent}`}>

        {/* Accordion toggle header — always visible */}
        <button
          onClick={() => setInfoPanelOpen(v => !v)}
          aria-expanded={infoPanelOpen}
          aria-controls="cockpit-info-body"
          className={`
            w-full flex items-center justify-between
            px-4 py-2.5 cursor-pointer transition-colors duration-150
            ${p.headerBg} hover:brightness-[0.97]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${p.ring}
          `}
        >
          {/* Left: zone badge + icon + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0 ${p.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${p.led}`} aria-hidden="true" />
              Bereich {tabsArray.indexOf(activeTab) + 1} — {m.sublabel}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`shrink-0 ${p.text}`} aria-hidden="true">
                {React.createElement(m.icon, { className: 'w-4 h-4' })}
              </span>
              <span className="text-[11px] font-black text-[#2C3322] truncate font-sans">
                {m.title}
              </span>
            </div>
          </div>

          {/* Right: metric chips + chevron — kept compact to not crowd left title */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {/* Only 2 key metrics to prevent overflow in narrow column */}
            <div className="hidden lg:flex items-center gap-2">
              {metrics.slice(0, 2).map(({ Icon, label, value, suffix, valueColor }) => (
                <div key={label} className="flex items-center gap-0.5" title={label}>
                  <Icon className="w-3 h-3 text-[#B0A898]" aria-hidden="true" />
                  <span className={`text-[9px] font-mono font-bold tabular-nums ${valueColor}`}>
                    {value}{suffix}
                  </span>
                </div>
              ))}
              <div className="w-px h-3 bg-[#D4CCBA]" aria-hidden="true" />
            </div>
            {/* Toggle chevron only — text label removed to save space */}
            <div className={`flex items-center gap-0.5 text-[9px] font-mono font-bold ${p.text} uppercase tracking-wide`}>
              {infoPanelOpen
                ? <ChevronUp   className="w-3.5 h-3.5" aria-hidden="true" />
                : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              }
            </div>
          </div>
        </button>

        {/* Accordion body — collapsible */}
        {infoPanelOpen && (
          <div
            id="cockpit-info-body"
            className={`px-4 py-3 ${p.bodyBg} border-t ${p.divider}`}
          >
            {/* Description + badge in one compact row */}
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[9.5px] text-[#6B6356] leading-snug font-sans flex-1 line-clamp-2">
                {m.desc}
              </p>
              <div className={`text-[8.5px] font-mono font-bold px-2 py-1 rounded-md border text-center whitespace-nowrap shrink-0 ${activeBadge.color}`}>
                {activeBadge.text}
              </div>
            </div>

            {/* Metric strip — single compact row instead of 4-card grid */}
            <div className="flex gap-2">
              {metrics.map(({ Icon, label, unit, value, suffix, barWidth, barColor, valueColor }) => (
                <div
                  key={label}
                  className="flex-1 bg-white rounded-lg border border-[#E8E2D6] px-2 py-1.5 min-w-0"
                  title={`${label} — ${unit}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                    <Icon className="w-3 h-3 text-[#B0A898] shrink-0" aria-hidden="true" />
                    <span className={`font-mono font-black text-[10px] tabular-nums leading-none ${valueColor}`}>
                      {value}{suffix}
                    </span>
                  </div>
                  <div className="w-full bg-[#EAE4D7] rounded-full h-1 overflow-hidden">
                    <div
                      style={{ width: barWidth }}
                      className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                    />
                  </div>
                  <div className="text-[7px] text-[#B0A898] font-mono uppercase tracking-wide mt-1 leading-none truncate">
                    {label}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* ── SZENARIEN — compact collapsible strip, always accessible ─────── */}
      <div className="border-b border-[#D4CCBA]">
        <button
          onClick={() => setScenariosOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2 bg-stone-50/80 hover:bg-stone-100/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#8B8273]" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B8273]">
              Zusatz-Szenarien / Schwierigkeit
            </span>
            {/* Active indicators */}
            {invasiveThreatEnabled && (
              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-[#5A7247]/10 text-[#5A7247] border border-[#5A7247]/20">
                Bio: {stats.biosecurity ?? 100}%
              </span>
            )}
            {energyChallengeEnabled && (
              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Energie: {stats.renewableEnergy ?? 25}%
              </span>
            )}
          </div>
          {scenariosOpen
            ? <ChevronUp className="w-3.5 h-3.5 text-[#8B8273]" />
            : <ChevronDown className="w-3.5 h-3.5 text-[#8B8273]" />
          }
        </button>

        {scenariosOpen && (
          <div className="px-3 py-3 bg-stone-50/50 grid grid-cols-2 gap-2">
            {/* Bio-Sicherheit */}
            <div className={`p-2.5 rounded-lg border transition-all ${
              invasiveThreatEnabled
                ? (stats.biosecurity ?? 100) < 30 ? 'bg-rose-50 border-rose-200'
                : (stats.biosecurity ?? 100) < 70 ? 'bg-amber-50 border-amber-200'
                : 'bg-[#5A7247]/5 border-[#5A7247]/20'
                : 'bg-white border-stone-200/60'
            }`}>
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Shield className={`w-3.5 h-3.5 shrink-0 ${invasiveThreatEnabled ? 'text-[#5A7247]' : 'text-stone-400'}`} />
                  <div>
                    <div className={`text-[11px] font-black leading-tight ${invasiveThreatEnabled ? 'text-stone-800' : 'text-stone-500'}`}>Bio-Sicherheit</div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#8B8273]">Invasive Bedrohung</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {invasiveThreatEnabled && (
                    <button onClick={onShowInvasiveRules} className="w-4 h-4 rounded-full bg-white border border-[#D4CCBA] hover:bg-[#FAF8F5] flex items-center justify-center text-[9px] font-black text-stone-600 transition-colors" title="Regeln">?</button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input type="checkbox" checked={invasiveThreatEnabled} onChange={e => onToggleInvasive(e.target.checked)} className="sr-only peer" />
                    <div className="w-7 h-4 bg-stone-300 rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#5A7247]" />
                  </label>
                </div>
              </div>
              {invasiveThreatEnabled && (
                <>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-stone-400">Stabilität</span>
                    <span className={`font-black ${(stats.biosecurity ?? 100) >= 70 ? 'text-[#5A7247]' : (stats.biosecurity ?? 100) >= 30 ? 'text-amber-700' : 'text-rose-700 animate-pulse'}`}>
                      {stats.biosecurity ?? 100}%
                    </span>
                  </div>
                  <div className="w-full bg-[#EAE4D7]/50 rounded-full h-1 overflow-hidden">
                    <div style={{ width: `${stats.biosecurity ?? 100}%` }} className={`h-full rounded-full transition-all duration-500 ${(stats.biosecurity ?? 100) >= 70 ? 'bg-[#5A7247]' : (stats.biosecurity ?? 100) >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                  </div>
                  {(stats.biosecurity ?? 100) < 30 && (
                    <div className="flex items-center gap-1 text-[11px] text-rose-700 font-bold animate-pulse mt-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />Kritisch!
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Energiewende */}
            <div className={`p-2.5 rounded-lg border transition-all ${
              energyChallengeEnabled
                ? (stats.renewableEnergy ?? 25) < 35 ? 'bg-rose-50 border-rose-200'
                : (stats.renewableEnergy ?? 25) < 70 ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50/50 border-emerald-200'
                : 'bg-white border-stone-200/60'
            }`}>
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Zap className={`w-3.5 h-3.5 shrink-0 ${energyChallengeEnabled ? 'text-amber-500 animate-pulse' : 'text-stone-400'}`} />
                  <div>
                    <div className={`text-[11px] font-black leading-tight ${energyChallengeEnabled ? 'text-stone-800' : 'text-stone-500'}`}>Energiewende</div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#8B8273]">Dürener Dekarbonisierung</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {energyChallengeEnabled && (
                    <button onClick={onShowEnergyRules} className="w-4 h-4 rounded-full bg-white border border-[#D4CCBA] hover:bg-[#FAF8F5] flex items-center justify-center text-[9px] font-black text-stone-600 transition-colors" title="Regeln">?</button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input type="checkbox" checked={energyChallengeEnabled} onChange={e => onToggleEnergy(e.target.checked)} className="sr-only peer" />
                    <div className="w-7 h-4 bg-stone-300 rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>
              </div>
              {energyChallengeEnabled && (
                <>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-stone-400">Ökostrom</span>
                    <span className={`font-black ${(stats.renewableEnergy ?? 25) >= 70 ? 'text-emerald-700' : (stats.renewableEnergy ?? 25) >= 35 ? 'text-amber-700' : 'text-rose-700 animate-pulse'}`}>
                      {stats.renewableEnergy ?? 25}%
                      <span className={`ml-1 text-[10px] px-1 rounded ${energyCalc.netDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{energyCalc.netDelta >= 0 ? '+' : ''}{energyCalc.netDelta}%/Rd</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#EAE4D7]/50 rounded-full h-1 overflow-hidden">
                    <div style={{ width: `${stats.renewableEnergy ?? 25}%` }} className={`h-full rounded-full transition-all duration-500 ${(stats.renewableEnergy ?? 25) >= 70 ? 'bg-emerald-500' : (stats.renewableEnergy ?? 25) >= 35 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Climate alert — shown when critical, always visible */}
        {stats.climateRisk >= 55 && (
          <div className="mx-3 mb-2 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
            <ShieldAlert className="w-3 h-3 text-red-600 shrink-0" aria-hidden="true" />
            <p className="text-xs text-red-800 font-sans leading-snug">
              <strong>Klima-Alarm:</strong> Risikostufe {stats.climateRisk}% — Renaturierung priorisieren!
            </p>
          </div>
        )}
      </div>

      {/* ── WORKSPACE (full width, always visible) ───────────────────────── */}
      <div
        id="cockpit-workspace"
        role="tabpanel"
        className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#FAF8F5]"
      >
        {/* Workspace breadcrumb bar */}
        <div className="bg-white border-b border-[#D4CCBA] px-3.5 py-2 flex items-center justify-between shrink-0">
          <nav className="flex items-center gap-1.5 text-[10px] font-mono" aria-label="Bereichspfad">
            <span className="font-bold text-[#5C564C] uppercase tracking-wider">Cockpit</span>
            <ChevronRight className="w-3 h-3 text-[#B0A898]" aria-hidden="true" />
            <span className={`font-black uppercase tracking-wider ${p.text}`}>{m.label}</span>
          </nav>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
        </div>

        {/* Scrollable content — flex flex-col propagates height to BuildingCatalog h-full chain */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {activeTab === 'map' && (
            <BuildingCatalog
              stats={stats}
              selectedBuilding={selectedBuilding}
              onSelectBuilding={onSelectBuilding}
              researchTree={researchTree}
              hasRurtalbahnStationNear={checkRurtalbahnDiscountActiveOnMap}
              onDemolishModeToggle={() => { onSelectBuilding(null); onDemolishModeToggle(); }}
              isDemolishMode={isDemolishMode}
              selectedTileInfo={selectedTileInfo}
              onUpgradeBuilding={handleUpgradeBuilding}
            />
          )}
          {activeTab === 'schoeller' && (
            <SchoellershammerConsole
              stats={stats}
              onChangeMode={onChangePaperFactoryMode}
              researchTree={researchTree}
            />
          )}
          {activeTab === 'research' && (
            <ResearchTree
              researchNodes={researchTree}
              stats={stats}
              onUnlockResearch={onUnlockResearch}
            />
          )}
          {activeTab === 'species' && (
            <SpeciesTracker
              speciesList={speciesList}
              naturePoints={stats.naturePoints}
            />
          )}
          {activeTab === 'reports' && (
            <DashboardReports
              stats={stats}
              speciesList={speciesList}
              logs={logs}
              onTriggerPdfSim={onTriggerPdfSim}
              pdfSimulated={pdfSimulated}
              grid={grid}
            />
          )}
        </div>
      </div>

    </div>
  );
};
