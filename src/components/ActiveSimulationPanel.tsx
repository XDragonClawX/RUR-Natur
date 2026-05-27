import React from 'react';
import {
  TileData, BuildingType, ResearchNode, Species, PaperFactoryMode, GameLog, GameStats
} from '../types';
import {
  Hammer, Factory, Microscope, Leaf, FileText, ChevronRight,
  Droplets, ShieldAlert, Award, Footprints, Users, Zap
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
}

// ── Tab Palette with premium cockpit branding ─────────────────────────────────
const TAB_PALETTE = {
  map: {
    bg: 'bg-[#5A7247]/10',
    border: 'border-[#5A7247]/30',
    ring: 'border-b-[#5A7247]',
    text: 'text-[#5A7247]',
    hoverText: 'hover:text-[#4A5D3A]',
    badge: 'bg-[#D4E0C1] text-[#2C3322] border-[#5A7247]/30',
    glowing: 'bg-[#5A7247]',
    accent: 'border-l-[#5A7247]',
    leftBg: 'bg-[#F0F7EC]',
    glowBg: 'rgba(90, 114, 71, 0.15)',
    led: 'bg-[#5A7247]',
  },
  schoeller: {
    bg: 'bg-[#BC6C25]/10',
    border: 'border-[#BC6C25]/30',
    ring: 'border-b-[#BC6C25]',
    text: 'text-[#BC6C25]',
    hoverText: 'hover:text-[#914F18]',
    badge: 'bg-amber-100 text-[#7A3F1F] border-[#BC6C25]/20',
    glowing: 'bg-[#BC6C25]',
    accent: 'border-l-[#BC6C25]',
    leftBg: 'bg-amber-50/40',
    glowBg: 'rgba(188, 108, 37, 0.15)',
    led: 'bg-[#BC6C25]',
  },
  research: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-300/30',
    ring: 'border-b-sky-500',
    text: 'text-sky-650',
    hoverText: 'hover:text-sky-800',
    badge: 'bg-sky-50 text-sky-800 border-sky-305/30',
    glowing: 'bg-sky-500',
    accent: 'border-l-sky-500',
    leftBg: 'bg-sky-50/40',
    glowBg: 'rgba(14, 165, 233, 0.15)',
    led: 'bg-sky-500',
  },
  species: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-300/30',
    ring: 'border-b-emerald-500',
    text: 'text-emerald-700',
    hoverText: 'hover:text-emerald-900',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300/35',
    glowing: 'bg-emerald-600',
    accent: 'border-l-emerald-500',
    leftBg: 'bg-emerald-50/40',
    glowBg: 'rgba(16, 185, 129, 0.15)',
    led: 'bg-emerald-500',
  },
  reports: {
    bg: 'bg-[#457b9d]/10',
    border: 'border-[#457b9d]/30',
    ring: 'border-b-[#457b9d]',
    text: 'text-[#1D4E5B]',
    hoverText: 'hover:text-[#143B45]',
    badge: 'bg-[#EBF3F5] text-[#1D4E5B] border-[#457b9d]/30',
    glowing: 'bg-[#457b9d]',
    accent: 'border-l-[#457b9d]',
    leftBg: 'bg-[#EBF3F5]',
    glowBg: 'rgba(69, 123, 157, 0.15)',
    led: 'bg-[#457b9d]',
  },
} as const;

// ── Tab Metadata ─────────────────────────────────────────────────────────────
const TAB_META = {
  map: {
    index: '01',
    label: 'BAUMODUS',
    title: '📐 Baukatalog & Planung',
    desc: 'Errichte renaturierende Wasserbauten, kiesgelegte Fischlaichbetten oder biodiverse Uferbereiche entlang der Flusskarte.',
    icon: Hammer,
  },
  schoeller: {
    index: '02',
    label: 'INDUSTRIE',
    title: '🏭 Werk Schoellershammer',
    desc: 'Steuere den Betriebsmodus der Papierfabrik. Balanciere Gewinne, Arbeitsplätze und Filtertechnik-Investitionen.',
    icon: Factory,
  },
  research: {
    index: '03',
    label: 'FORSCHUNG',
    title: '🔬 Innovationszentrum',
    desc: 'Schalte technologische Filter-Upgrades, Gewässerschutzkonzepte oder europäische LIFE+ Fördergelder frei.',
    icon: Microscope,
  },
  species: {
    index: '04',
    label: 'FAUNA & ARTEN',
    title: '🦫 Biotop-Beobachtung',
    desc: 'Verfolge und sichere die Ansiedlung bedrohter Leitarten wie Biber, Flusskrebs und Lachs durch Biotop-Güte.',
    icon: Leaf,
  },
  reports: {
    index: '05',
    label: 'CONTROLLING',
    title: '📊 Umwelt-Audit',
    desc: 'Analysiere ökologische Kennzahlen, WRRL-Gewässergüte, globale Resilienzen und erstelle offizielle Jahresberichte.',
    icon: FileText,
  },
} as const;

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
}) => {

  // 计算选项卡徽章的值和样式
  const getBadgeValueAndStyle = (tabId: 'map' | 'schoeller' | 'research' | 'species' | 'reports') => {
    switch (tabId) {
      case 'map': {
        const bcount = grid.flat().filter(t => t.buildingId && t.buildingId !== 'schoellershammer').length;
        return {
          text: `${bcount} Aktive Bauten`,
          color: 'bg-[#5A7247]/10 text-[#4A5D3A] border-[#5A7247]/20'
        };
      }
      case 'schoeller': {
        let text = 'Vollbetrieb';
        if (stats.paperFactoryMode === 'RETROFITTING') text = 'Filter-Sektor';
        if (stats.paperFactoryMode === 'SHUTDOWN') text = 'Stillgelegt';
        if (stats.paperFactoryMode === 'RENATURIZATION') text = 'Rückbau';
        const color = stats.paperFactoryMode === 'PRODUCTION' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          stats.paperFactoryMode === 'RETROFITTING' ? 'bg-amber-50 text-amber-800 border-amber-300' :
          stats.paperFactoryMode === 'SHUTDOWN' ? 'bg-stone-100 text-stone-700 border-stone-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300';
        return { text, color };
      }
      case 'research': {
        const unlocked = researchTree.filter(r => r.unlocked).length;
        return {
          text: `${unlocked} / ${researchTree.length} Erforschten`,
          color: 'bg-sky-50 text-sky-850 border-sky-200'
        };
      }
      case 'species': {
        const activeSpeciesCount = speciesList.filter(s => s.unlocked || s.currentProgress >= 100).length;
        return {
          text: `${activeSpeciesCount} / ${speciesList.length} Arten`,
          color: 'bg-emerald-50 text-emerald-850 border-emerald-200'
        };
      }
      case 'reports': {
        const grade = stats.globalWrrl <= 2.8 ? 'A' : stats.globalWrrl <= 3.5 ? 'B' : 'C';
        return {
          text: `Siegel: Klasse ${grade}`,
          color: 'bg-blue-50 text-blue-800 border-blue-200'
        };
      }
    }
  };

  const tabsArray = ['map', 'schoeller', 'research', 'species', 'reports'] as const;

  // Render water quality rating color helper
  const getWrrlColorClass = (val: number) => {
    if (val <= 2.2) return 'bg-emerald-500 text-emerald-50 border-emerald-600';
    if (val <= 3.0) return 'bg-teal-500 text-teal-50 border-teal-600';
    if (val <= 3.8) return 'bg-amber-500 text-amber-950 border-amber-600';
    return 'bg-rose-500 text-rose-50 border-rose-600';
  };

  return (
    <div className="bg-[#FAF8F5] border border-[#D4CCBA] rounded-xl shadow-md overflow-hidden flex flex-col">

      {/* ── COCKPIT HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 bg-white border-b border-[#D4CCBA] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-emerald-600"></div>
          <div>
            <h2 className="text-xs font-black text-[#262A1F] uppercase tracking-wider flex items-center gap-1.5 font-sans">
              🎛️ Steuer-Cockpit & System-Zentralen
            </h2>
            <p className="text-[9px] text-[#8B8273] font-mono uppercase leading-tight mt-0.5">
              Live-Überwachung des Rur-Ökomodells • Jahr {stats.year} • Quartal {((stats.round - 1) % 4) + 1}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#F3EDE2] border border-[#D4CCBA]/80 px-2.5 py-1 rounded-md shrink-0">
          <span className="text-[9.5px] font-mono font-black text-[#5A7247]">SYSTEM: ACTIVE</span>
          <span className="text-[9px] text-[#8B8273]">| DEV MODE</span>
        </div>
      </div>

      {/* ── COCKPIT INTERFACE TAB-STRIP (High-Fidelity mechanical design) ── */}
      <div className="grid grid-cols-5 divide-x divide-[#D4CCBA] border-b border-[#D4CCBA] bg-[#EAE4D7]">
        {tabsArray.map((tId, idx) => {
          const isActive = activeTab === tId;
          const p = TAB_PALETTE[tId];
          const m = TAB_META[tId];
          const badgeInfo = getBadgeValueAndStyle(tId);
          const Icon = m.icon;

          return (
            <button
              key={tId}
              onClick={() => {
                setActiveTab(tId);
                if (tId !== 'map') onSelectBuilding(null);
              }}
              style={{
                boxShadow: isActive ? `inset 0 -2px 0 0 ${p.glowing}` : undefined,
              }}
              className={`relative flex flex-col gap-2 p-3 text-left cursor-pointer transition-all duration-200 group overflow-hidden ${
                isActive
                  ? 'bg-white font-extrabold shadow-sm'
                  : 'bg-[#F2ECE1] hover:bg-white/60'
              }`}
            >
              {/* Monospace Indicator Deck */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[8px] font-mono font-black text-[#8B8273] tracking-widest uppercase">
                  SLOT 0{m.index}
                </span>
                
                {/* Visual Status Led and small mechanical dots */}
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? `${p.led} ring-2 ring-white` : 'bg-stone-300/60'
                  }`} />
                </div>
              </div>

              {/* Tab Label with Responsive Icons */}
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-md transition-colors ${
                  isActive ? p.bg + ' ' + p.text : 'bg-transparent text-[#8B8273] group-hover:text-[#2C3322]'
                }`}>
                  <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                </div>
                <div className="hidden md:block">
                  <div className="text-[9px] text-[#A29A8C] font-mono font-black uppercase tracking-wider leading-none">
                    {m.label}
                  </div>
                  <div className="text-[11px] font-black text-[#2C3322] leading-tight font-sans mt-0.5">
                    {tId === 'schoeller' ? 'Konsolen' : m.title.split(' ')[1]}
                  </div>
                </div>
                {/* Fallback compact text for mobile */}
                <span className="md:hidden text-[11px] font-black text-[#2C3322] truncate leading-tight">
                  {tId === 'schoeller' ? 'Fabrik' : m.title.split(' ')[1]}
                </span>
              </div>

              {/* Custom Badge to convey high-fidelity data density */}
              <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border leading-none truncate w-full text-center transition-all ${
                isActive ? 'bg-[#5A7247]/5 border-[#5A7247]/15 text-[#5A7247]' : badgeInfo.color
              }`}>
                {badgeInfo.text}
              </span>

              {/* Color horizontal strip indicator in un-selected mode */}
              {!isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] opacity-25 group-hover:opacity-100 transition-opacity ${p.glowing}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── COCKPIT WORKSPACE ── */}
      <div className="bg-white p-4">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Left Panel: Real-time Cockpit Controller HUD with gauges */}
          <div className={`w-full lg:w-56 shrink-0 rounded-xl border border-[#D4CCBA] border-l-[5px] p-3 shadow-sm ${TAB_PALETTE[activeTab].accent} ${TAB_PALETTE[activeTab].leftBg}`}>
            
            {/* Tag line */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded border ${TAB_PALETTE[activeTab].badge} tracking-wider`}>
                ZONE {tabsArray.indexOf(activeTab) + 1} ACTIVE
              </span>
              <span className="text-[8px] font-bold text-[#8B8273] tracking-widest font-mono">
                {TAB_META[activeTab].label}
              </span>
            </div>

            {/* Header info */}
            <div className="flex items-start gap-2 mb-2">
              <span className={`p-1 rounded-md bg-white border border-[#D4CCBA]/80 ${TAB_PALETTE[activeTab].text}`}>
                {React.createElement(TAB_META[activeTab].icon, { className: 'w-4 h-4' })}
              </span>
              <div>
                <h3 className="text-xs font-black text-[#2C3322] leading-tight font-sans">
                  {TAB_META[activeTab].title}
                </h3>
                <p className="text-[8px] font-mono text-[#8B8273] uppercase mt-0.5">ZUSTÄNDIGKEITSBEREICH</p>
              </div>
            </div>

            {/* Short functional description */}
            <p className="text-[10px] text-[#6B6356] leading-relaxed mb-3 font-sans bg-white/40 p-2 rounded-lg border border-[#D4CCBA]/30">
              {TAB_META[activeTab].desc}
            </p>

            {/* Dynamic Sytem Metrics & Progress Indicators (High Fidelity Interface) */}
            <div className="border-t border-[#D4CCBA]/60 pt-3">
              <div className="text-[8.5px] font-black text-[#5C564C] uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
                <span>RUR-SYSTEMSTATISTIKEN</span>
                <span className="text-[7.5px] bg-slate-100 px-1 py-0.2 rounded border border-slate-200">REALTIME</span>
              </div>
              
              <div className="space-y-2.5">
                {/* Gauge Metric 1: WRRL Water Quality */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-bold text-[#3E382F]">
                    <span className="flex items-center gap-1">🌊 Gewässergüte WRRL:</span>
                    <span className={`font-mono font-black text-[9px] px-1.5 py-0.2 rounded border shadow-2xs ${getWrrlColorClass(stats.globalWrrl)}`}>
                      {stats.globalWrrl.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden flex">
                    {/* WRRL goes from 1 (excellent) to 5 (bad), so let's reverse bar display to represent success */}
                    <div 
                      style={{ width: `${Math.max(5, Math.min(100, ((5 - stats.globalWrrl) / 4) * 100))}%` }} 
                      className={`h-full transition-all duration-500 ${
                        stats.globalWrrl <= 2.2 ? 'bg-emerald-500' :
                        stats.globalWrrl <= 3.0 ? 'bg-teal-500' :
                        stats.globalWrrl <= 3.8 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Gauge Metric 2: FFH Biodiversity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-bold text-[#3E382F]">
                    <span className="flex items-center gap-1">🌿 FFH-Wert (Biotop):</span>
                    <span className="font-mono font-black text-[#5A7247]">{stats.globalFfh}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      style={{ width: `${stats.globalFfh}%` }} 
                      className="bg-[#5A7247] h-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Gauge Metric 3: Longitudinal connectivity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-bold text-[#3E382F]">
                    <span className="flex items-center gap-1">🐟 Durchgängigkeit:</span>
                    <span className="font-mono font-black text-indigo-700">{stats.continuity}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      style={{ width: `${stats.continuity}%` }} 
                      className="bg-indigo-600 h-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Gauge Metric 4: Bürgerakzeptanz or CO2 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-bold text-[#3E382F]">
                    <span className="flex items-center gap-1">👥 Akzeptanz im Kreis:</span>
                    <span className="font-mono font-black text-[#BC6C25]">{stats.citizenAcceptance}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      style={{ width: `${stats.citizenAcceptance}%` }} 
                      className="bg-[#BC6C25] h-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Legend / Status alert warning box for high immersion */}
            {stats.climateRisk >= 55 && (
              <div className="mt-3 bg-red-50 border border-red-200 p-2 rounded-lg flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-[8px] text-red-800 font-sans leading-snug">
                  <strong>🚨 KLIMA-ALARM:</strong> Risiko bei {stats.climateRisk}%. Renaturierungen priorisieren!
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: The Modular Console Controller View Container */}
          <div className="flex-1 min-w-0 bg-[#F4EFEB] border border-[#D4CCBA] rounded-xl overflow-hidden min-h-[480px] lg:h-[620px] max-h-[720px] p-1 shadow-inner relative flex flex-col">
            
            {/* Top tiny bar detailing inner workspace */}
            <div className="bg-[#FAF8F5] px-3 py-1.5 border-b border-[#D4CCBA] flex items-center justify-between text-[8px] text-[#8B8273] font-mono shrink-0">
              <span className="uppercase">MODULE_CONTROLLER_WORKSPACE_STABLE v1.0.4</span>
              <span className="text-[#5A7247] font-bold uppercase">✔ CONNECTION LIVE</span>
            </div>

            {/* Inner scrollable block wrapper to host the specific views */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar focus:outline-none">
              {activeTab === 'map' && (
                <BuildingCatalog
                  stats={stats}
                  selectedBuilding={selectedBuilding}
                  onSelectBuilding={onSelectBuilding}
                  researchTree={researchTree}
                  hasRurtalbahnStationNear={checkRurtalbahnDiscountActiveOnMap}
                  onDemolishModeToggle={() => {
                    onSelectBuilding(null);
                    onDemolishModeToggle();
                  }}
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
      </div>

    </div>
  );
};
