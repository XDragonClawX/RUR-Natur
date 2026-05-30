import React, { useState, useMemo } from 'react';
import {
  ActionCard, ActionCardType, BuildingType, ResearchNode, TileData, GameStats, TerrainType
} from '../types';
import {
  X, Lock, Play, Check, TrendingUp, Coins, Microscope, Droplets, Leaf, Hammer,
  Train, Anchor, Sparkles, Trash2, ArrowUpCircle, Info, HelpCircle, ArrowLeft
} from 'lucide-react';

interface TileActionModalProps {
  x: number;
  y: number;
  tile: TileData;
  cards: ActionCard[];
  stats: GameStats;
  buildingsCatalog: BuildingType[];
  researchTree: ResearchNode[];
  grid: TileData[][];
  actionsUsed: number;
  maxActionsPerRound: number;
  rurtalbahnLeased: boolean;
  onClose: () => void;
  onBuild: (building: BuildingType, finalCost: number) => void;
  onDemolish: () => void;
  onUpgrade: (researchCost: number) => void;
  onExecutePlant: (local: boolean, bulkCount?: number) => void;
  onExecuteHydrology: (local: boolean, strength?: number) => void;
  onExecuteFunding: (card: ActionCard, strength: number) => void;
  onExecuteResearch: (card: ActionCard, strength: number) => void;
  onUnlockResearch: (nodeId: string) => void;
  onExecuteRurtalbahn: (card: ActionCard, strength: number) => void;
}

// ── Color palette per strength ────────────────────────────────────────────────
const STR_PALETTE = [
  { bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-300', text: 'text-slate-700' },
  { bar: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-800 border-cyan-200', text: 'text-cyan-700' },
  { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border-amber-200', text: 'text-amber-700' },
  { bar: 'bg-purple-500', badge: 'bg-purple-50 text-purple-800 border-purple-200', text: 'text-purple-700' },
  { bar: 'bg-emerald-600 animate-pulse', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300', text: 'text-emerald-700' },
] as const;

// ── Card type metadata ─────────────────────────────────────────────────────────
type CardTypeKey = ActionCardType | 'rurtalbahn';
const TYPE_META: Record<CardTypeKey, { icon: React.ReactNode; color: string; label: string; tag: string }> = {
  BUILD: { icon: <Hammer className="w-4 h-4" />, color: 'text-amber-600', label: '🏗️', tag: 'Bauen & Errichten' },
  PLANT: { icon: <Leaf className="w-4 h-4" />, color: 'text-emerald-600', label: '🌱', tag: 'Biotopschutz' },
  HYDROLOGY: { icon: <Droplets className="w-4 h-4" />, color: 'text-cyan-600', label: '🌊', tag: 'Hydrologischer Ausbau' },
  FUNDING: { icon: <Coins className="w-4 h-4" />, color: 'text-rose-600', label: '💶', tag: 'Natur-Förderung' },
  RESEARCH: { icon: <Microscope className="w-4 h-4" />, color: 'text-purple-600', label: '🧪', tag: 'Gewässer-Forschung' },
  rurtalbahn: { icon: <Train className="w-4 h-4" />, color: 'text-blue-600', label: '🚇', tag: 'Rurtalbahn Sonderfahrt' },
};

// ── Visual Card Themes (Physical/Board Game aesthetic) ──────────────────────
const CARD_THEME: Record<CardTypeKey, {
  bg: string;
  borderActive: string;
  accentText: string;
  badgeBg: string;
  illustration: string;
  cardBgHighlight: string;
}> = {
  BUILD: {
    bg: 'bg-gradient-to-b from-[#FDFBF7] to-[#FAF5EC] border-[#D4CBB6]',
    borderActive: 'border-amber-600 ring-2 ring-amber-500 shadow-md',
    accentText: 'text-amber-800',
    badgeBg: 'bg-amber-600 text-stone-100',
    illustration: '🏗️',
    cardBgHighlight: 'bg-amber-600',
  },
  PLANT: {
    bg: 'bg-gradient-to-b from-[#F6FAF1] to-[#E9F3DF] border-[#C3D4B6]',
    borderActive: 'border-emerald-600 ring-2 ring-emerald-500 shadow-md',
    accentText: 'text-emerald-800',
    badgeBg: 'bg-emerald-600 text-stone-100',
    illustration: '🌱',
    cardBgHighlight: 'bg-emerald-600',
  },
  HYDROLOGY: {
    bg: 'bg-gradient-to-b from-[#FAFDFE] to-[#E5F6FD] border-[#B6D1D4]',
    borderActive: 'border-cyan-600 ring-2 ring-cyan-500 shadow-md',
    accentText: 'text-cyan-800',
    badgeBg: 'bg-cyan-600 text-white',
    illustration: '🌊',
    cardBgHighlight: 'bg-cyan-600',
  },
  FUNDING: {
    bg: 'bg-gradient-to-b from-[#FDF9FA] to-[#FCE8EB] border-[#D4B6BB]',
    borderActive: 'border-rose-600 ring-2 ring-rose-500 shadow-md',
    accentText: 'text-rose-800',
    badgeBg: 'bg-rose-600 text-white',
    illustration: '💶',
    cardBgHighlight: 'bg-rose-600',
  },
  RESEARCH: {
    bg: 'bg-gradient-to-b from-[#FCF9FD] to-[#F7EAFD] border-[#CBD4B6]', // warm border blend
    borderActive: 'border-purple-600 ring-2 ring-purple-500 shadow-md',
    accentText: 'text-purple-800',
    badgeBg: 'bg-purple-600 text-white',
    illustration: '🧪',
    cardBgHighlight: 'bg-purple-600',
  },
  rurtalbahn: {
    bg: 'bg-gradient-to-b from-[#FAFBFD] to-[#E6EEFD] border-[#B6C2D4]',
    borderActive: 'border-blue-600 ring-2 ring-blue-500 shadow-md',
    accentText: 'text-blue-800',
    badgeBg: 'bg-blue-600 text-white',
    illustration: '🚇',
    cardBgHighlight: 'bg-blue-600',
  },
};

// ── General Helper: Get Categories ──────────────────────────────────────────
const getNodeCategory = (nodeId: string): 'nature' | 'water' | 'energy' => {
  switch (nodeId) {
    case 'biber_management':
    case 'lachs_nrw':
    case 'auen_vitalisierung':
      return 'nature';
    case 'sohlgleiten_tech':
    case 'mikroschadstoffe':
      return 'water';
    case 'schoeller_renat':
    case 'green_energy_tech':
    case 'zerkall_faserzentrum':
      return 'energy';
    default:
      return 'nature';
  }
};

const getCategoryConfig = (cat: 'nature' | 'water' | 'energy') => {
  switch (cat) {
    case 'nature': return { label: 'Ökologie', accent: '#5A7247', icon: '🌿' };
    case 'water': return { label: 'Wasser', accent: '#457B9D', icon: '💧' };
    case 'energy': return { label: 'Werk & Energie', accent: '#BC6C25', icon: '⚡' };
  }
};

const TERRAIN_META: Record<TerrainType, { label: string; icon: string; bg: string; text: string; border: string }> = {
  Water: { label: 'Rur-Flusslauf', icon: '💧', bg: 'bg-[#EBF5FB]', text: 'text-[#1B4F72]', border: 'border-[#AED6F1]' },
  Wiese: { label: 'Auenwiese', icon: '🌾', bg: 'bg-[#EBF5FB]/40', text: 'text-[#5A7247]', border: 'border-[#D4E0C1]' },
  Auwald: { label: 'Bannauwald', icon: '🌳', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  Acker: { label: 'Intensiv-Acker', icon: '🍂', bg: 'bg-amber-50/50', text: 'text-amber-800', border: 'border-amber-200/50' },
  Gewerbe: { label: 'Gewerbegebiet', icon: '🏭', bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-300' },
  Siedlung: { label: 'Wohnsiedlung', icon: '🏠', bg: 'bg-rose-50/50', text: 'text-rose-800', border: 'border-rose-200/40' },
};

export const TileActionModal: React.FC<TileActionModalProps> = ({
  x, y, tile, cards, stats, buildingsCatalog, researchTree, grid,
  actionsUsed, maxActionsPerRound, rurtalbahnLeased, onClose,
  onBuild, onDemolish, onUpgrade, onExecutePlant, onExecuteHydrology,
  onExecuteFunding, onExecuteResearch, onUnlockResearch, onExecuteRurtalbahn
}) => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingCategoryFilter, setBuildingCategoryFilter] = useState<string>('all');
  const [filterOnlyBebaubar, setFilterOnlyBebaubar] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'karten' | 'info'>('karten');
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingType | null>(null);

  const getPrognosisValues = (bId: string): {
    wrrl?: number;
    ffh?: number;
    flood?: number;
    moisture?: number;
  } => {
    switch (bId) {
      case 'altarm':
        return {
          wrrl: Math.max(1.0, tile.wrrl_quality - 0.5),
          ffh: Math.min(100, tile.ffh_value + 25),
          flood: Math.max(0, tile.flood_risk - 15)
        };
      case 'auenwald':
        return {
          ffh: Math.min(100, tile.ffh_value + 30),
          moisture: Math.min(100, tile.moisture + 20)
        };
      case 'totholz':
        return {
          ffh: Math.min(100, tile.ffh_value + 10)
        };
      case 'ufer_entfesselung':
        return {
          wrrl: Math.max(1.0, tile.wrrl_quality - 1.0),
          ffh: Math.min(100, tile.ffh_value + 15)
        };
      case 'kiesbett':
        return {
          ffh: Math.min(100, tile.ffh_value + 15)
        };
      case 'fischpass':
        return {
          ffh: Math.min(100, tile.ffh_value + 10)
        };
      case 'deichrueck':
        return {
          flood: Math.max(0, tile.flood_risk - 25),
          moisture: Math.min(100, tile.moisture + 20)
        };
      case 'polder':
        return {
          flood: Math.max(0, tile.flood_risk - 30),
          moisture: Math.min(100, tile.moisture + 25)
        };
      case 'sohlgleite':
        return {
          wrrl: Math.max(1.0, tile.wrrl_quality - 0.5),
          ffh: Math.min(100, tile.ffh_value + 10)
        };
      case 'regenbecken':
        return {
          wrrl: Math.max(1.0, tile.wrrl_quality - 1.0)
        };
      case 'biber_station':
        return {
          ffh: Math.min(100, tile.ffh_value + 15)
        };
      case 'lachs_zucht':
        return {
          ffh: Math.min(100, tile.ffh_value + 10)
        };
      case 'eisvogel_nist':
        return {
          ffh: Math.min(100, tile.ffh_value + 10)
        };
      case 'insektenhotel':
        return {
          ffh: Math.min(100, tile.ffh_value + 12)
        };
      case 'natura_zentrum':
        return {
          ffh: Math.min(100, tile.ffh_value + 15)
        };
      case 'oeko_tourismus':
        return {
          ffh: Math.max(0, tile.ffh_value - 5)
        };
      case 'wasserkraft':
        return {
          wrrl: Math.min(5.0, tile.wrrl_quality + 0.5),
          ffh: Math.max(0, tile.ffh_value - 10),
          flood: Math.min(100, tile.flood_risk + 5)
        };
      case 'solarpark':
        return {
          ffh: Math.min(100, tile.ffh_value + 5)
        };
      case 'windkraft':
        return {
          ffh: Math.max(0, tile.ffh_value - 2)
        };
      case 'intensiv_farm':
        return {
          wrrl: Math.min(5.0, tile.wrrl_quality + 1.0),
          ffh: Math.max(0, tile.ffh_value - 15),
          flood: Math.min(100, tile.flood_risk + 10)
        };
      case 'extensive_weide':
        return {
          ffh: Math.min(100, tile.ffh_value + 5)
        };
      case 'klaerwerk_upgrade':
        return {
          wrrl: Math.max(1.0, tile.wrrl_quality - 1.5)
        };
      case 'besucherzentrum':
        return {
          ffh: Math.min(100, tile.ffh_value + 10)
        };
      case 'campingplatz':
        return {
          ffh: Math.max(0, tile.ffh_value - 5)
        };
      case 'kanuverleih':
        return {
          wrrl: Math.min(5.0, tile.wrrl_quality + 0.1)
        };
      default:
        return {};
    }
  };

  const prog = hoveredBuilding ? getPrognosisValues(hoveredBuilding.id) : {};

  const actionsLeft = Math.max(0, maxActionsPerRound - actionsUsed);
  const budgetExhausted = actionsUsed >= maxActionsPerRound;

  // ── Helper check for nearby Rurtalbahn station (for distance-based discount)
  const hasRurtalbahnStationNearby = (tx: number, ty: number): boolean => {
    let found = false;
    const radius = 2; // Manhattan distance 2
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= radius) {
          const nx = tx + dx;
          const ny = ty + dy;
          if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
            if (grid[ny][nx]?.buildingId === 'bahn_station') {
              found = true;
              break;
            }
          }
        }
      }
      if (found) break;
    }
    return found;
  };

  // ── Helper: Check neighboring water tile (adjacency check for water)
  const hasWaterAdjacent = (tx: number, ty: number): boolean => {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of dirs) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
        if (grid[ny][nx]?.terrain === 'Water') {
          return true;
        }
      }
    }
    return false;
  };

  const tMeta = TERRAIN_META[tile.terrain];
  const existingBuilding = buildingsCatalog.find(b => b.id === tile.buildingId);

  // ── Rurtalbahn active modifier ──────────────────────────────────────────────
  const activeRailwayBonus = hasRurtalbahnStationNearby(x, y);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Container */}
      <div className="bg-[#FAF8F5] border-2 border-[#D4CCBA] rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#D4CCBA]">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border ${tMeta.border} ${tMeta.bg}`}>
              {tMeta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#2C3322]">Aktions-Cockpit</h2>
                <span className="font-mono text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  Kachel ({x}, {y})
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                <span className="sm:hidden">
                  💶 <strong>{stats.budget} €</strong> · 🧪 <strong>{stats.researchPoints}</strong>
                </span>
                <span className="hidden sm:inline">
                  Untergrund: <strong className={tMeta.text}>{tMeta.label}</strong> • 🧪 Forschung: <strong>{stats.researchPoints}</strong> • 💶 Budget: <strong>{stats.budget} €</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Action indicator – compact on mobile */}
            <div className="flex items-center gap-1.5 bg-[#F2EDE4] px-2 sm:px-3 py-1.5 rounded-xl border border-[#D4CCBA] shrink-0">
              <span className={`hidden sm:block text-[10px] font-bold uppercase ${budgetExhausted ? 'text-rose-600' : 'text-emerald-800'}`}>
                {budgetExhausted ? 'Runde beendet' : `Aktionen: ${actionsLeft}/${maxActionsPerRound}`}
              </span>
              <span className={`sm:hidden text-[9px] font-black tabular-nums ${budgetExhausted ? 'text-rose-600' : 'text-emerald-800'}`}>
                {actionsLeft}/{maxActionsPerRound}
              </span>
              <div className="flex gap-0.5 sm:gap-1">
                {Array.from({ length: maxActionsPerRound }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border transition-colors ${
                    i < actionsUsed
                      ? 'bg-stone-400 border-stone-500'
                      : budgetExhausted
                      ? 'bg-rose-100 border-rose-300'
                      : 'bg-emerald-500 border-emerald-600 animate-pulse'
                  }`} />
                ))}
              </div>
            </div>

            {/* Sektor-wechsel – hidden on mobile (available in Info-Tab) */}
            <button
              onClick={onClose}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 hover:border-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-3xs hover:-translate-y-0.5 active:translate-y-0"
            >
              🗺️ Sektor wechseln
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer border border-transparent hover:border-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Workspace Body */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ── Mobile Tab Bar (hidden on md+) ───────────────────────────── */}
          <div className="md:hidden shrink-0 flex bg-white border-b border-[#D4CCBA]">
            <button
              onClick={() => setMobileTab('karten')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                mobileTab === 'karten'
                  ? 'text-[#5A7247] bg-[#F5F2EC] border-b-2 border-[#5A7247]'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
              }`}
            >
              🎴 Aktions-Karten
            </button>
            <button
              onClick={() => setMobileTab('info')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                mobileTab === 'info'
                  ? 'text-[#5A7247] bg-[#F5F2EC] border-b-2 border-[#5A7247]'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
              }`}
            >
              📍 Sektor-Info
            </button>
          </div>

          {/* ── Panels (side-by-side on md+, tab-switched on mobile) ──── */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row md:divide-x divide-[#D4CCBA]">

          {/* LEFT PANEL: Selected Tile Details & Existing Buildings */}
          <div className={`w-full md:w-1/3 p-5 overflow-y-auto bg-[#FAF8F5] flex-col gap-3 ${mobileTab === 'info' ? 'flex' : 'hidden'} md:flex`}>
            <button
              onClick={onClose}
              className="w-full py-2 bg-amber-50/70 hover:bg-amber-100/80 border border-dashed border-amber-300 hover:border-amber-400 rounded-xl text-amber-900 font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer shadow-3xs"
            >
              🗺️ Anderen Sektor wählen
            </button>

            <div>
              <span className="text-[9px] font-bold uppercase text-stone-400 tracking-wider">
                Sektor-Zustandsbericht
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className={`p-2.5 rounded-xl border transition-all duration-300 ${prog.wrrl !== undefined ? 'bg-blue-50/50 border-blue-400 shadow-sm scale-[1.02]' : 'bg-white border-[#E8E2D6] shadow-xs'}`}>
                  <span className="text-[9px] text-[#8B8273] flex items-center justify-between">
                    <span>WRRL Qualität</span>
                    {prog.wrrl !== undefined && (
                      <span className={`text-[7px] font-black uppercase px-1 rounded-sm ${prog.wrrl < tile.wrrl_quality ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {prog.wrrl < tile.wrrl_quality ? 'Besser ▲' : 'Schlechter ▼'}
                      </span>
                    )}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <strong className={`text-base font-black ${prog.wrrl !== undefined ? (prog.wrrl < tile.wrrl_quality ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold') : 'text-blue-700'}`}>
                      {prog.wrrl !== undefined ? prog.wrrl.toFixed(1) : tile.wrrl_quality.toFixed(1)}
                    </strong>
                    {prog.wrrl !== undefined && (
                      <span className="text-[8.5px] font-mono font-bold text-stone-400 line-through">
                        ({tile.wrrl_quality.toFixed(1)})
                      </span>
                    )}
                    <span className="text-[8px] font-mono text-stone-400 font-bold uppercase">Zustand</span>
                  </div>
                  <div className="w-full bg-[#E8E2D6] h-1 rounded-full overflow-hidden mt-1.5 font-sans">
                    <div 
                      className={`h-full transition-all duration-300 ${prog.wrrl !== undefined ? (prog.wrrl < tile.wrrl_quality ? 'bg-[#5A7247]' : 'bg-rose-500') : 'bg-blue-500'}`} 
                      style={{ width: `${(6 - (prog.wrrl !== undefined ? prog.wrrl : tile.wrrl_quality)) * 20}%` }} 
                    />
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border transition-all duration-300 ${prog.ffh !== undefined ? 'bg-emerald-50/55 border-emerald-400 shadow-sm scale-[1.02]' : 'bg-white border-[#E8E2D6] shadow-xs'}`}>
                  <span className="text-[9px] text-[#8B8273] flex items-center justify-between">
                    <span>FFH Wert</span>
                    {prog.ffh !== undefined && (
                      <span className={`text-[7px] font-black uppercase px-1 rounded-sm ${prog.ffh > tile.ffh_value ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {prog.ffh > tile.ffh_value ? `+${(prog.ffh - tile.ffh_value).toFixed(0)}% ▲` : `${(prog.ffh - tile.ffh_value).toFixed(0)}% ▼`}
                      </span>
                    )}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <strong className={`text-base font-black ${prog.ffh !== undefined ? (prog.ffh > tile.ffh_value ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold') : 'text-emerald-700'}`}>
                      {prog.ffh !== undefined ? `${prog.ffh}%` : `${tile.ffh_value}%`}
                    </strong>
                    {prog.ffh !== undefined && (
                      <span className="text-[8.5px] font-mono font-bold text-stone-400 line-through">
                        ({tile.ffh_value}%)
                      </span>
                    )}
                    <span className="text-[8px] font-mono text-stone-400 font-bold uppercase">Biom</span>
                  </div>
                  <div className="w-full bg-[#E8E2D6] h-1 rounded-full overflow-hidden mt-1.5 font-sans">
                    <div 
                      className={`h-full transition-all duration-300 ${prog.ffh !== undefined ? (prog.ffh > tile.ffh_value ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-emerald-500'}`} 
                      style={{ width: `${prog.ffh !== undefined ? prog.ffh : tile.ffh_value}%` }} 
                    />
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border transition-all duration-300 ${prog.flood !== undefined ? 'bg-orange-50/50 border-orange-400 shadow-sm scale-[1.02]' : 'bg-white border-[#E8E2D6] shadow-xs'}`}>
                  <span className="text-[9px] text-[#8B8273] flex items-center justify-between">
                    <span>Hochwasserrisiko</span>
                    {prog.flood !== undefined && (
                      <span className={`text-[7px] font-black uppercase px-1 rounded-sm ${prog.flood < tile.flood_risk ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {prog.flood < tile.flood_risk ? `-${(tile.flood_risk - prog.flood).toFixed(0)}% ▲` : `+${(prog.flood - tile.flood_risk).toFixed(0)}% ▼`}
                      </span>
                    )}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <strong className={`text-sm font-black ${prog.flood !== undefined ? (prog.flood < tile.flood_risk ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold') : 'text-orange-700'}`}>
                      {prog.flood !== undefined ? `${prog.flood}%` : `${tile.flood_risk}%`}
                    </strong>
                    {prog.flood !== undefined && (
                      <span className="text-[8.5px] font-mono font-bold text-stone-400 line-through">
                        ({tile.flood_risk}%)
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-[#E8E2D6] h-1 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full transition-all duration-300 ${prog.flood !== undefined ? (prog.flood < tile.flood_risk ? 'bg-[#5A7247]' : 'bg-rose-500') : 'bg-orange-500'}`} 
                      style={{ width: `${prog.flood !== undefined ? prog.flood : tile.flood_risk}%` }} 
                    />
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border transition-all duration-300 ${prog.moisture !== undefined ? 'bg-cyan-50/50 border-cyan-400 shadow-sm scale-[1.02]' : 'bg-white border-[#E8E2D6] shadow-xs'}`}>
                  <span className="text-[9px] text-[#8B8273] flex items-center justify-between">
                    <span>Bodenfeuchte</span>
                    {prog.moisture !== undefined && (
                      <span className={`text-[7px] font-black uppercase px-1 rounded-sm ${prog.moisture > tile.moisture ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {prog.moisture > tile.moisture ? `+${(prog.moisture - tile.moisture).toFixed(0)}% ▲` : `${(prog.moisture - tile.moisture).toFixed(0)}% ▼`}
                      </span>
                    )}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <strong className={`text-sm font-black ${prog.moisture !== undefined ? (prog.moisture > tile.moisture ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold') : 'text-cyan-700'}`}>
                      {prog.moisture !== undefined ? `${prog.moisture}%` : `${tile.moisture}%`}
                    </strong>
                    {prog.moisture !== undefined && (
                      <span className="text-[8.5px] font-mono font-bold text-stone-400 line-through">
                        ({tile.moisture}%)
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-[#E8E2D6] h-1 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full transition-all duration-300 ${prog.moisture !== undefined ? (prog.moisture > tile.moisture ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-cyan-500'}`} 
                      style={{ width: `${prog.moisture !== undefined ? prog.moisture : tile.moisture}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Building Info */}
            <div className="bg-white border border-[#D4CCBA] rounded-xl p-4 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">
                  Gebäude auf diesem Sektor
                </span>
                
                {existingBuilding ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="text-2xl mt-0.5 select-none text-[#5A7247]">
                        🏛️
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-stone-800 leading-tight">
                          {existingBuilding.name}
                        </h4>
                        <span className="text-[8px] font-mono font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1 inline-block uppercase">
                          Stufe {tile.upgradeLevel || 1} / 3 Upgraded
                        </span>
                        <p className="text-[10px] text-stone-500 leading-snug mt-1.5">
                          {existingBuilding.description}
                        </p>
                      </div>
                    </div>

                    <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200/60 text-[10px] text-stone-600 leading-normal">
                      <span className="font-bold text-stone-700 block mb-0.5">Aktiver Einfluss:</span>
                      {existingBuilding.detailEffect}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-stone-400">
                    <div className="text-3xl filter saturate-50 mb-2">🌾</div>
                    <span className="text-[10.5px] font-medium leading-normal">
                      Dieser Sektor ist aktuell unbebaut.<br />Nutze das Aktions-Kartensystem rechts, um hier etwas zu bewirken!
                    </span>
                  </div>
                )}
              </div>

              {/* Building controls (Demolish / Upgrade) */}
              {existingBuilding && (
                <div className="flex flex-col gap-1.5 mt-4 border-t border-stone-200 pt-3">
                  {tile.buildingId !== 'schoellershammer' && (
                    <button
                      onClick={() => {
                        if (confirm(`Möchtest du das Gebäude '${existingBuilding.name}' wirklich zurückbauen (abreißen)? Das Terrain wird renaturiert.`)) {
                          onDemolish();
                        }
                      }}
                      className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Gebäude zurückbauen & Boden freigeben
                    </button>
                  )}

                  {tile.buildingId === 'schoellershammer' && (
                    <div className="text-[9px] text-[#BC6C25] bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-start gap-1.5 leading-snug">
                      <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Die historische Papierfabrik kann nicht abgerissen werden. Steuere ihren Betriebsmodus im Fabrik-Cockpit in der Seitenleiste.</span>
                    </div>
                  )}

                  {(tile.upgradeLevel || 1) < 3 && tile.buildingId !== 'schoellershammer' && (
                    <button
                      onClick={() => onUpgrade(3)} // 3 research points cost
                      disabled={stats.researchPoints < 3}
                      className={`w-full py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                        stats.researchPoints < 3
                          ? 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed'
                          : 'bg-purple-600 border-purple-700 text-white hover:bg-purple-700 cursor-pointer shadow-xs'
                      }`}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      Auf Stufe {(tile.upgradeLevel || 1) + 1} upgraden (Kostet 3 🧪)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Expandable Action Cards for the Round */}
          <div className={`flex-1 p-4 sm:p-5 overflow-y-auto flex-col gap-4 ${mobileTab === 'karten' ? 'flex' : 'hidden'} md:flex`}>
            <div>
              <span className="text-[9px] font-bold uppercase text-stone-400 tracking-wider">
                Verfügbare Runden-Karten (Handdeck)
              </span>
              <p className="text-[10px] text-stone-500">
                Die Stärken entsprechen der aktuellen Slot-Position (Slot 1–5). Drücke auf eine Spielkarte, um sie zu aktivieren.
              </p>
            </div>

            {/* Horizontal playing cards list with horizontal scroll support on small screens */}
            <div className="flex flex-col gap-3 select-none">
              {/* Continuous Slot Strength Bar – fully responsive, no forced min-width */}
              <div className="bg-[#FAF9F5] border border-[#D4CCBA]/55 rounded-lg py-1.5 px-3.5 flex items-center justify-between shadow-3xs">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[7.5px] font-black uppercase text-[#8B8273] tracking-widest font-mono">Slot-Handdeck</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                </div>
                
                <div className="flex-1 max-w-md mx-6 relative flex items-center">
                  {/* Track line */}
                  <div className="absolute inset-x-0 h-1 bg-stone-200/80 rounded-full" />
                  
                  {/* Highlight bar filling up to current active level */}
                  {(() => {
                    const selectedIdx = cards.findIndex(c => c.id === expandedCardId);
                    const percentage = selectedIdx === -1 ? 0 : (selectedIdx / 4) * 100;
                    return (
                      <div 
                        className="absolute left-0 h-1 bg-gradient-to-r from-amber-500 to-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    );
                  })()}

                  {/* 5 Slot Progress Nodes */}
                  <div className="absolute inset-x-0 flex justify-between">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const strength = idx + 1;
                      const cardInSlot = cards[idx];
                      const isSelected = cardInSlot && expandedCardId === cardInSlot.id;
                      const selectedIdx = cards.findIndex(c => c.id === expandedCardId);
                      const isActive = idx <= (selectedIdx !== -1 ? selectedIdx : 0);

                      return (
                        <div 
                          key={idx} 
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-mono text-[8px] font-black shadow-3xs transition-all duration-200 ${
                            isSelected
                              ? 'bg-stone-800 text-white ring-2 ring-stone-800 scale-110'
                              : isActive
                              ? 'bg-amber-500 text-white'
                              : 'bg-stone-100 text-stone-400 border border-stone-200'
                          }`}
                        >
                          {strength}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[7.5px] font-black uppercase tracking-wider text-stone-400 font-mono flex items-center gap-1 shrink-0">
                  <span>Energie: Lvl {cards.findIndex(c => c.id === expandedCardId) !== -1 ? cards.findIndex(c => c.id === expandedCardId) + 1 : 1}</span>
                </div>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 pb-2 scrollbar-thin">
              <div className="flex sm:grid sm:grid-cols-5 gap-3 sm:gap-3.5 min-w-[460px] sm:min-w-full pt-2 pb-1.5 px-0.5">
                {cards.map((card, idx) => {
                  const isSelected = expandedCardId === card.id;
                  const strength = idx + 1;
                  const palette = STR_PALETTE[strength - 1];
                  const key: CardTypeKey = card.id === 'rurtalbahn_card' ? 'rurtalbahn' : card.type;
                  const theme = CARD_THEME[key];

                  // Locked conditions
                  const cardLocked = budgetExhausted && card.type !== 'BUILD';

                  // Dynamic name clean up to keep it elegant inside tight vertical space
                  const cleanedName = card.name.replace(/^(🏗️|🌱|🌊|💶|🧪|🚇)\s+/, '');

                  return (
                    <div
                      key={card.id}
                      onClick={() => !cardLocked && setExpandedCardId(card.id)}
                      className={`relative flex flex-col justify-between h-[190px] sm:h-[235px] w-[100px] sm:w-full shrink-0 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? `${theme.bg} ${theme.borderActive} sm:-translate-y-2 shadow-xl`
                          : cardLocked
                          ? 'bg-stone-100 border-stone-200 opacity-30 grayscale cursor-not-allowed contrast-75'
                          : `${theme.bg} cursor-pointer hover:border-[#D4CCBA] sm:hover:-translate-y-1 hover:shadow-md`
                      }`}
                    >
                      {/* Unplayable Overlay / Locked state text indicator */}
                      {cardLocked && (
                        <div className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded-md z-30 tracking-wider shadow-3xs flex items-center gap-0.5">
                          <span>🔒 Gesperrt</span>
                        </div>
                      )}

                      {/* Subdued Background Logo Watermark */}
                      <span className="absolute inset-0 flex items-center justify-center text-7xl select-none pointer-events-none opacity-[0.06] font-black z-0">
                        {theme.illustration}
                      </span>

                      {/* Header block with Slot Badge on top-left and tiny category symbol on top-right */}
                      <div className="p-2.5 flex items-center justify-between z-10">
                        <div className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-black tracking-tight flex flex-col items-center leading-none shadow-3xs ${palette.badge}`}>
                          <span className="text-[6.5px] text-stone-500 font-bold uppercase">Slot</span>
                          <span>0{strength}</span>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-white/85 flex items-center justify-center shadow-3xs text-xs border border-[#D4CCBA]/30">
                          {theme.illustration}
                        </div>
                      </div>

                      {/* Middle text: Card Name & short info */}
                      <div className="px-2 text-center z-10 flex-1 flex flex-col justify-center gap-1">
                        <h3 className="text-[11px] sm:text-[10.5px] font-black tracking-tight text-stone-800 leading-tight line-clamp-2 uppercase">
                          {cleanedName}
                        </h3>
                        <p className="hidden sm:block text-[8.5px] text-stone-500 leading-snug line-clamp-3 px-0.5">
                          {card.description}
                        </p>
                      </div>

                      {/* Bottom Strength Dots & Pill indicator */}
                      <div className="p-2 pt-0 flex flex-col items-center gap-1 z-10">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, starIdx) => (
                            <div
                              key={starIdx}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                starIdx < strength ? theme.cardBgHighlight : 'bg-stone-200/55'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-[8px] font-black tracking-widest uppercase ${theme.accentText}`}>
                          ⚡ Stärke {strength}
                        </span>
                      </div>

                      {/* Selection glow highlight ring bar on active state-card top edge */}
                      {isSelected && (
                        <div className={`absolute top-0 inset-x-0 h-1.5 ${theme.cardBgHighlight}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              </div>{/* end overflow-x-auto card scroll */}
            </div>

            {/* DETAILED WORKFLOW IN PLAY-ZONE FOR THE SELECTED ACTIVE CARD */}
            {(() => {
              const card = cards.find(c => c.id === expandedCardId);
              if (!card) {
                return (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-[#FAF8F5]/80 border-2 border-dashed border-[#D4CCBA]/60 rounded-xl mt-1 min-h-[220px]">
                    <div className="text-4xl opacity-50 animate-pulse mb-3">🎴</div>
                    <span className="text-xs font-black text-stone-600 uppercase tracking-wider">Wähle eine Spielkarte aus</span>
                    <p className="text-[10.5px] text-stone-500 mt-1.5 max-w-xs leading-relaxed">
                      Klicke oben auf eine der 5 Aktions-Karten, um den jeweiligen Wirkungsbereich und die Baupatente an Position ({x}, {y}) zu konfigurieren.
                    </p>
                  </div>
                );
              }

              const idx = cards.indexOf(card);
              const strength = idx + 1;
              const palette = STR_PALETTE[strength - 1];
              const key: CardTypeKey = card.id === 'rurtalbahn_card' ? 'rurtalbahn' : card.type;
              const meta = TYPE_META[key];
              const theme = CARD_THEME[key];

              return (
                <div className="mt-1 bg-white border border-[#D4CCBA] rounded-xl p-3 shadow-xs flex flex-col gap-2.5 animate-in fade-in duration-200">
                  {/* Card Title Details Line */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 pb-1.5 border-b border-[#D4CCBA]/30">
                    <span className="text-[8.5px] font-black text-[#8B8273] tracking-wider uppercase font-mono sm:text-right">
                      Aktives Patent: <strong className="text-stone-800 font-extrabold">{card.name.replace(/^(🏗️|🌱|🌊|💶|🧪|🚇)\s+/, '')}</strong>
                    </span>
                  </div>

                  {/* Selected Card Action Banner - Highly Compact Single-Line Bar to maximize vertical visibility */}
                  <div className="bg-[#FAF8F5] px-2.5 py-1.5 rounded-lg border border-[#D4CCBA]/45 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm select-none">{meta.icon}</span>
                      <span className="text-[9px] text-stone-500 uppercase tracking-wide font-medium">
                        Effekt (Lvl {strength}): <strong className="text-stone-800 font-extrabold normal-case italic">{card.strengthEffects[strength]}</strong>
                      </span>
                    </div>
                    <div className={`px-2 py-0.5 rounded border font-mono text-[8px] font-black shrink-0 tracking-wider uppercase text-center ${palette.badge}`}>
                      Lvl {strength}
                    </div>
                  </div>

                  {/* Core Card Action Handlers and Menus */}
                  <div className="flex-1">
                    {/* Case 1: BUILD Card Options */}
                    {card.type === 'BUILD' && (
                      <div className="flex flex-col gap-2">
                        {/* Catalog Filtering UI - Elegant Single Line */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 bg-[#FAF8F5] px-2.5 py-1.5 rounded-lg border border-[#D4CCBA]/35">
                          <span className="text-[8.5px] font-black uppercase tracking-wider text-[#A09787] font-mono">Baukatalog-Filter</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <input
                              type="text"
                              value={searchTerm}
                              onClick={(e) => e.stopPropagation()}
                              onChange={e => setSearchTerm(e.target.value)}
                              placeholder="🔍 Suchen..."
                              className="px-2 py-1 sm:py-0.5 text-xs sm:text-[9px] font-medium rounded border border-stone-300 bg-white flex-1 min-w-[80px] sm:w-28 placeholder:text-stone-400 focus:outline-none focus:border-amber-400"
                            />
                            <select
                              value={buildingCategoryFilter}
                              onChange={e => setBuildingCategoryFilter(e.target.value)}
                              className="px-2 py-1 sm:py-0.5 text-xs sm:text-[9px] font-medium rounded border border-stone-300 bg-white text-stone-700 cursor-pointer focus:outline-none focus:border-amber-400"
                            >
                              <option value="all">Alle Arten</option>
                              <option value="ecology">Natur</option>
                              <option value="water">Wasser</option>
                              <option value="fauna">Wildnis</option>
                              <option value="tourism">Tourismus</option>
                            </select>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterOnlyBebaubar(prev => !prev);
                              }}
                              className={`px-2 py-1 sm:py-0.5 text-xs sm:text-[9px] font-black rounded border cursor-pointer transition-all ${
                                filterOnlyBebaubar
                                  ? 'bg-[#5A7247] text-white border-[#5A7247] shadow-3xs'
                                  : 'bg-white text-stone-700 border-stone-300 hover:border-amber-400 hover:bg-stone-50'
                              }`}
                              title="Zeige nur Bauwerke, die mit der aktuellen Kartenstärke auf diesem Sektor bebaubar sind"
                            >
                              {filterOnlyBebaubar ? '✅ Nur passende' : '🌱 Nur passende?'}
                            </button>
                          </div>
                        </div>

                        {/* Catalog Cards – single column on mobile (panel scrolls), 2-col on desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-1.5 sm:max-h-40 sm:overflow-y-auto sm:pr-1">
                          {buildingsCatalog
                            .filter(b => b.id !== 'schoellershammer')
                            .filter(b => buildingCategoryFilter === 'all' || b.category === buildingCategoryFilter)
                            .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.description.toLowerCase().includes(searchTerm.toLowerCase()))
                            .filter(b => {
                              if (!filterOnlyBebaubar) return true;
                              const allowedTerrain = b.allowedTerrains.includes(tile.terrain);
                              const isRiverCheck = !b.isRiverOnly || tile.terrain === 'Water';
                              const isRiverAdjacentCheck = !b.isRiverAdjacentOnly || hasWaterAdjacent(x, y);
                              const isEligible = allowedTerrain && isRiverCheck && isRiverAdjacentCheck;
                              let costLimit = 4;
                              if (strength === 2) costLimit = 6;
                              else if (strength === 3) costLimit = 8;
                              else if (strength === 4) costLimit = 10;
                              else if (strength === 5) costLimit = 100;
                              const strengthFits = b.cost <= costLimit;
                              let constructRebate = 0;
                              if (strength === 3 || strength === 4) constructRebate = 1;
                              else if (strength === 5) constructRebate = 2;
                              const discountValue = constructRebate + (activeRailwayBonus ? 1 : 0);
                              let acceptanceSurcharge = 0;
                              if (stats.year > 2026 && stats.citizenAcceptance < 40) {
                                acceptanceSurcharge = 2;
                              }
                              const finalCost = Math.max(1, b.cost - discountValue + acceptanceSurcharge);
                              const canAfford = stats.budget >= finalCost;
                              return isEligible && strengthFits && canAfford && !tile.buildingId && actionsLeft > 0;
                            })
                            .map(b => {
                              // Adjacency and placement allowance validations
                              const allowedTerrain = b.allowedTerrains.includes(tile.terrain);
                              const isRiverCheck = !b.isRiverOnly || tile.terrain === 'Water';
                              const isRiverAdjacentCheck = !b.isRiverAdjacentOnly || hasWaterAdjacent(x, y);

                              const isEligible = allowedTerrain && isRiverCheck && isRiverAdjacentCheck;

                              // Strength limit check
                              let costLimit = 4;
                              if (strength === 2) costLimit = 6;
                              else if (strength === 3) costLimit = 8;
                              else if (strength === 4) costLimit = 10;
                              else if (strength === 5) costLimit = 100;

                              const strengthFits = b.cost <= costLimit;

                              // Discount rebate calculations
                              let constructRebate = 0;
                              if (strength === 3 || strength === 4) constructRebate = 1;
                              else if (strength === 5) constructRebate = 2;

                              const discountValue = constructRebate + (activeRailwayBonus ? 1 : 0);
                              
                              // low citizen acceptance surcharge
                              let acceptanceSurcharge = 0;
                              if (stats.year > 2026 && stats.citizenAcceptance < 40) {
                                acceptanceSurcharge = 2;
                              }

                              const finalCost = Math.max(1, b.cost - discountValue + acceptanceSurcharge);
                              const canAfford = stats.budget >= finalCost;

                              // Error messages for display
                              let errText = '';
                              if (tile.buildingId) errText = 'Bereits belegt.';
                              else if (!allowedTerrain) errText = `Erfordert: ${b.allowedTerrains.join('/')}.`;
                              else if (!isRiverCheck) errText = 'Nur Flussbett.';
                              else if (!isRiverAdjacentCheck) errText = 'Am Fluss.';
                              else if (!strengthFits) errText = `Stärke ${strength} ungenügend.`;
                              else if (!canAfford) errText = `Kostet ${finalCost} € (Spargroschen aufgebraucht).`;

                              const allowedToConstruct = isEligible && strengthFits && canAfford && !tile.buildingId && actionsLeft > 0;

                              return (
                                <div
                                  key={b.id}
                                  onMouseEnter={() => setHoveredBuilding(b)}
                                  onMouseLeave={() => setHoveredBuilding(null)}
                                  className={`p-3 sm:p-2 rounded-lg border text-left flex flex-col justify-between gap-2 sm:gap-1 transition-all duration-200 cursor-help relative overflow-hidden ${
                                    hoveredBuilding?.id === b.id
                                      ? 'bg-[#FAF8F5] border-amber-500 scale-[1.01] shadow-2xs'
                                      : allowedToConstruct
                                      ? 'bg-emerald-50/10 border-emerald-500 hover:border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20 shadow-emerald-500/5 hover:-translate-y-0.5'
                                      : 'bg-stone-50 border-stone-200 opacity-65'
                                  }`}
                                >
                                  {/* Green indicator ping for constructible buildings */}
                                  {allowedToConstruct && (
                                    <>
                                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    </>
                                  )}

                                  <div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-sm sm:text-[10px] font-black text-stone-800 truncate pr-3">
                                        {b.name}
                                      </span>
                                      <span className="text-sm sm:text-[9px] font-black text-amber-700 shrink-0">
                                        {finalCost} €
                                      </span>
                                    </div>
                                    <p className="text-[11px] sm:text-[8.5px] text-stone-500 leading-snug line-clamp-2 sm:line-clamp-1 mt-0.5">
                                      {b.description}
                                    </p>
                                  </div>

                                  {allowedToConstruct ? (
                                    <button
                                      onClick={() => onBuild(b, finalCost)}
                                      className="w-full py-2 sm:py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs sm:text-[8.5px] font-black uppercase text-center transition-colors cursor-pointer"
                                    >
                                      Jetzt errichten (-{finalCost} €)
                                    </button>
                                  ) : (
                                    <div className="text-[10px] sm:text-[8px] font-bold text-rose-700 bg-rose-50 px-1.5 py-1 sm:py-0.5 rounded border border-rose-100 text-center leading-snug">
                                      ⚠️ {errText}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>

                        {/* Interactive Building Impact Preview & Prognosis Box */}
                        <div className="mt-1 border border-[#D4CCBA]/55 rounded-lg bg-[#FAF9F5] p-2 transition-all duration-300 shadow-3xs min-h-[64px] flex flex-col justify-center">
                          {hoveredBuilding ? (
                            <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2 border-b border-[#D4CCBA]/35 pb-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black uppercase text-stone-800 font-mono">
                                    📈 Einfluss: {hoveredBuilding.name}
                                  </span>
                                  <span className={`text-[6.5px] font-black uppercase tracking-wider px-1 rounded-sm ${
                                    hoveredBuilding.category === 'ecology' ? 'bg-[#5A7247]/10 text-[#5A7247]' :
                                    hoveredBuilding.category === 'water' ? 'bg-cyan-50 text-cyan-800' :
                                    hoveredBuilding.category === 'economy' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {hoveredBuilding.category === 'ecology' ? '🌿 Ökologie' :
                                     hoveredBuilding.category === 'water' ? '🌊 Wasser' :
                                     hoveredBuilding.category === 'economy' ? '🏭 Wirtschaft' :
                                     hoveredBuilding.category === 'tourism' ? '🎒 Freizeit' : '🔧 Infrastruktur'}
                                  </span>
                                </div>
                                
                                <span className="text-[8px] text-[#8B8273] font-mono font-bold">
                                  Unterhalt: {hoveredBuilding.maintenance} €/Runde
                                </span>
                              </div>

                              <div className="grid grid-cols-12 gap-1.5 mt-0.5">
                                <div className="col-span-8">
                                  <span className="text-[6.5px] font-black text-stone-400 uppercase tracking-widest block leading-3">
                                    Systemische Wirkkraft der Errichtung
                                  </span>
                                  <p className="text-[8.5px] text-[#5A7247] font-black font-mono leading-tight">
                                    ⚡ {hoveredBuilding.detailEffect}
                                  </p>
                                </div>
                                <div className="col-span-4 self-center text-right">
                                  <span className="text-[6.5px] font-black text-stone-400 uppercase tracking-widest block leading-3">
                                    Terrains
                                  </span>
                                  <span className="inline-block mt-0.5 bg-white text-stone-600 font-bold border border-[#D4CCBA]/40 rounded px-1 py-0.2 text-[7.5px] font-mono truncate max-w-full">
                                    {hoveredBuilding.allowedTerrains.join('/')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-stone-400 text-[8px] font-semibold italic flex items-center justify-center gap-1 py-0.5">
                              <Info className="w-3 h-3 text-stone-400/80 shrink-0" />
                              <span>Mauszeiger über ein Bauvorhaben bewegen, um dessen systemische Wirkung anzuzeigen.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Case 2: PLANT Card Options */}
                    {card.type === 'PLANT' && (
                      <div className="flex flex-col gap-2 bg-white rounded-lg p-2.5 border border-[#E8E2D6]">
                        {tile.terrain === 'Acker' && !tile.buildingId ? (
                          <button
                            onClick={() => onExecutePlant(true)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                            Dieses Feld bepflanzen: Intensiv-Acker → Auenwiese (Frei)
                          </button>
                        ) : tile.terrain === 'Wiese' && !tile.buildingId && strength >= 3 ? (
                          <button
                            onClick={() => onExecutePlant(true)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                            Dieses Feld schattieren: Wiese → Auwald (Klimaresistent)
                          </button>
                        ) : (
                          <div className="text-[10px] text-stone-500 bg bg-[#FAF8F5] p-2 rounded text-center">
                            Dieses Kachel-Terrain ({tile.terrain}) eignet sich nicht für eine direkte lokale Pflanzmaßnahme in dieser Runde.
                          </div>
                        )}

                        <div className="border-t border-stone-200 my-2 pt-2">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
                            Großräumige Landschafts-Aktion
                          </span>
                          <button
                            onClick={() => onExecutePlant(false)}
                            className="w-full py-2 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-stone-700 font-bold border border-[#D4CCBA] rounded text-xs transition-all cursor-pointer"
                          >
                            Großflächiges Programm aktivieren (Bis zu {strength} Kacheln bewalden)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Case 3: HYDROLOGY Card Options */}
                    {card.type === 'HYDROLOGY' && (
                      <div className="flex flex-col gap-2 bg-white rounded-lg p-2.5 border border-[#E8E2D6]">
                        {tile.terrain === 'Water' ? (
                          <button
                            onClick={() => onExecuteHydrology(true)}
                            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 shrink-0" />
                            Lokale Gewässerstruktur vertiefen (Flussbett-Aufwertung)
                          </button>
                        ) : (
                          <div className="text-[10px] text-stone-500 bg bg-[#FAF8F5] p-2 rounded text-center">
                            Dieses Feld ist kein Flussbett. Hydrologischer Ausbau wirkt primär im Flussbett-Gewässerlauf.
                          </div>
                        )}

                        <div className="border-t border-stone-200 my-1.5 pt-2">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
                            Systemischer Hydrologie-Auslass
                          </span>
                          <button
                            onClick={() => onExecuteHydrology(false, strength)}
                            className="w-full py-2 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-stone-700 font-bold border border-[#D4CCBA] rounded text-xs transition-all cursor-pointer"
                          >
                            System-Durchgängigkeit im Einzugsgebiet steigern (+{strength * 4}%)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Case 4: FUNDING Card Options */}
                    {card.type === 'FUNDING' && (
                      <div className="bg-white rounded-lg p-3 border border-[#E8E2D6] text-center flex flex-col items-center gap-2">
                        <Coins className="w-8 h-8 text-rose-500 shrink-0" />
                        <div className="text-xs font-bold text-stone-700">
                          Beantrage EU LIFE+ Förderungsgelder
                        </div>
                        <p className="text-[10px] text-stone-500 max-w-sm">
                          Höhere Stärke schaltet umfangreichere Fördertöpfe frei. Bei Stärke {strength} erhältst du sofort finanzielle Zulagen von <strong>
                            {strength === 1 ? '3' : strength === 2 ? '6' : strength === 3 ? '9' : strength === 4 ? '12' : '16'} €
                          </strong>.
                        </p>
                        <button
                          onClick={() => onExecuteFunding(card, strength)}
                          className="mt-1 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wide rounded-lg cursor-pointer transition-all"
                        >
                          Förderung einlösen
                        </button>
                      </div>
                    )}

                    {/* Case 5: RESEARCH Card Options */}
                    {card.type === 'RESEARCH' && (
                      <div className="flex flex-col gap-2.5">
                        {/* Option A: Study / Points Generation */}
                        <div className="bg-white rounded-lg p-2.5 border border-[#E8E2D6] flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-stone-700 uppercase">Gewässeranalysen betreiben</span>
                            <p className="text-[9.5px] text-stone-500 mt-0.5">Führe Feldstudien durch für +{strength === 3 ? '3 (und +1🌿)' : strength === 4 ? '5 (und +2🌿)' : strength === 5 ? '7 (und +4🌿)' : strength} 🧪</p>
                          </div>
                          <button
                            onClick={() => onExecuteResearch(card, strength)}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer"
                          >
                            Laborstudie ausführen
                          </button>
                        </div>

                        {/* Option B: Active unlocks tree list */}
                        <div className="border-t border-stone-200 pt-2">
                          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">
                            Sofort erforschbare Innovationen (Tech-Zwischenstufe)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {researchTree
                              .filter(r => !r.unlocked && r.cost <= stats.researchPoints)
                              .map(r => {
                                const cat = getNodeCategory(r.id);
                                const cfg = getCategoryConfig(cat);
                                return (
                                  <div key={r.id} className="p-2.5 bg-[#FAF8F5] hover:bg-white rounded border border-[#D4CCBA] flex flex-col justify-between gap-2 text-left transition-all">
                                    <div>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-black text-[#2C3322]">
                                          {cfg.icon} {r.name}
                                        </span>
                                        <span className="text-[9px] font-mono font-black text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200">
                                          {r.cost} 🧪
                                        </span>
                                      </div>
                                      <p className="text-[9px] text-stone-500 leading-snug line-clamp-2">
                                        {r.effect}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => onUnlockResearch(r.id)}
                                      className="w-full py-1 text-center bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[9px] rounded uppercase cursor-pointer"
                                    >
                                      Technik Erforschen
                                    </button>
                                  </div>
                                );
                              })}
                            {researchTree.filter(r => !r.unlocked && r.cost <= stats.researchPoints).length === 0 && (
                              <div className="col-span-1 sm:col-span-2 text-center text-stone-400 py-3 text-[9px] italic">
                                Keine erforschbaren Patente im Budget. Beantrage Forschungspunkte via Laborstudie oben!
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Case 6: RurTalbahn special Action */}
                    {card.id === 'rurtalbahn_card' && (
                      <div className="bg-white rounded-lg p-3 border border-[#E8E2D6] text-center flex flex-col items-center gap-2">
                        <Train className="w-8 h-8 text-blue-500 shrink-0" />
                        <div className="text-xs font-bold text-stone-700">
                          Rurtalbahn Charter Logistik & Tourismus
                        </div>
                        <p className="text-[10px] text-stone-500">
                          Sonderfahrt-Bedingung: {card.strengthEffects[strength]}
                        </p>
                        {stats.paperFactoryMode === 'PRODUCTION' ? (
                          <div className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded border border-rose-200">
                            ⚠️ Werk verstopft Gleisbett. Papierfabrik darf nicht im Produktionsmodus sein!
                          </div>
                        ) : (
                          <button
                            onClick={() => onExecuteRurtalbahn(card, strength)}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wide rounded-lg cursor-pointer"
                          >
                            Sonderfahrt losschicken
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          </div>{/* end panels container */}

        </div>{/* end body wrapper */}

      </div>
    </div>
  );
};
