import React, { useState } from 'react';
import { BuildingType, GameStats, ResearchNode, TerrainType, TileData } from '../types';
import { BUILDIONS_CATALOG } from '../gameData';
import {
  Euro, Hammer, Trash, Waves, AlertTriangle, Search, X,
  Wrench, Star, CheckCircle2, Leaf, Droplets, TreePine,
  Home, Building2, TrainFront, Coins, Filter, MapPin
} from 'lucide-react';

interface BuildingCatalogProps {
  stats: GameStats;
  selectedBuilding: BuildingType | null;
  onSelectBuilding: (building: BuildingType | null) => void;
  researchTree: ResearchNode[];
  hasRurtalbahnStationNear: boolean;
  onDemolishModeToggle: () => void;
  isDemolishMode: boolean;
  selectedTileInfo?: { x: number; y: number; building: BuildingType; tile: TileData } | null;
  onUpgradeBuilding?: (x: number, y: number, costPoints: number) => void;
}

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  all:            { label: 'Alle',           icon: <Filter    className="w-3 h-3" />, accent: '#5C564C',  activeBg: 'bg-[#2C3322]',  activeText: 'text-white',  inactiveBg: 'bg-white',  inactiveText: 'text-[#5C564C]',  border: 'border-[#D4CCBA]' },
  ecology:        { label: 'Ökologie',       icon: <Leaf      className="w-3 h-3" />, accent: '#5A7247',  activeBg: 'bg-[#5A7247]',  activeText: 'text-white',  inactiveBg: 'bg-emerald-50/40', inactiveText: 'text-[#2C3311]', border: 'border-emerald-200/70' },
  water:          { label: 'Wasser',         icon: <Waves     className="w-3 h-3" />, accent: '#457B9D',  activeBg: 'bg-[#457B9D]',  activeText: 'text-white',  inactiveBg: 'bg-blue-50/40',    inactiveText: 'text-[#1D4E5B]',  border: 'border-blue-200/70' },
  fauna:          { label: 'Fauna',          icon: <Droplets  className="w-3 h-3" />, accent: '#BC6C25',  activeBg: 'bg-[#BC6C25]',  activeText: 'text-white',  inactiveBg: 'bg-amber-50/40',   inactiveText: 'text-[#7A3F1F]',  border: 'border-amber-200/70' },
  tourism:        { label: 'Tourismus',      icon: <MapPin    className="w-3 h-3" />, accent: '#0D9488',  activeBg: 'bg-teal-600',   activeText: 'text-white',  inactiveBg: 'bg-teal-50/40',    inactiveText: 'text-teal-800',   border: 'border-teal-200/70' },
  economy:        { label: 'Wirtschaft',     icon: <Coins     className="w-3 h-3" />, accent: '#5C564C',  activeBg: 'bg-neutral-600', activeText: 'text-white', inactiveBg: 'bg-[#F5EAD4]/40',  inactiveText: 'text-[#7A3F1F]',  border: 'border-[#DCC5A3]/60' },
  infrastructure: { label: 'Bahn & Industrie', icon: <TrainFront className="w-3 h-3" />, accent: '#7C3AED', activeBg: 'bg-purple-600', activeText: 'text-white', inactiveBg: 'bg-purple-50/40', inactiveText: 'text-purple-800', border: 'border-purple-200/70' },
} as const;

type CategoryId = keyof typeof CATEGORY_CONFIG;

// ── Terrain config ────────────────────────────────────────────────────────────
const TERRAIN_CONFIG: { id: TerrainType; label: string; icon: React.ReactNode; accentColor: string }[] = [
  { id: 'Wiese',    label: 'Wiese',    icon: <Leaf       className="w-3 h-3" />, accentColor: '#5A7247' },
  { id: 'Acker',    label: 'Acker',    icon: <TreePine   className="w-3 h-3" />, accentColor: '#92400E' },
  { id: 'Water',    label: 'Wasser',   icon: <Droplets   className="w-3 h-3" />, accentColor: '#457B9D' },
  { id: 'Auwald',   label: 'Auwald',   icon: <TreePine   className="w-3 h-3" />, accentColor: '#166534' },
  { id: 'Siedlung', label: 'Siedlung', icon: <Home       className="w-3 h-3" />, accentColor: '#4338CA' },
  { id: 'Gewerbe',  label: 'Gewerbe',  icon: <Building2  className="w-3 h-3" />, accentColor: '#475569' },
];

// ── Building card left-border by category ─────────────────────────────────────
const CARD_ACCENT: Record<string, string> = {
  ecology:        '#5A7247',
  water:          '#457B9D',
  fauna:          '#BC6C25',
  tourism:        '#0D9488',
  economy:        '#5C564C',
  infrastructure: '#7C3AED',
};

export const BuildingCatalog: React.FC<BuildingCatalogProps> = ({
  stats,
  selectedBuilding,
  onSelectBuilding,
  researchTree,
  hasRurtalbahnStationNear,
  onDemolishModeToggle,
  isDemolishMode,
  selectedTileInfo,
  onUpgradeBuilding
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [selectedTerrains, setSelectedTerrains] = useState<TerrainType[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showTerrainFilter, setShowTerrainFilter] = useState<boolean>(false);

  const isLocked = (buildingId: string): { locked: boolean; reason?: string } => {
    if (buildingId === 'lachs_zucht') {
      const researchUnlocked = researchTree.find(r => r.id === 'lachs_nrw')?.unlocked;
      if (!researchUnlocked) return { locked: true, reason: 'Forschung "Lachsprogramm NRW" benötigt' };
    }
    return { locked: false };
  };

  const filteredBuildings = BUILDIONS_CATALOG.filter(b => {
    if (b.id === 'schoellershammer') return false;
    if (activeCategory !== 'all' && b.category !== activeCategory) return false;
    if (selectedTerrains.length > 0 && !b.allowedTerrains.some(t => selectedTerrains.includes(t))) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      if (!b.name.toLowerCase().includes(s) && !b.description.toLowerCase().includes(s) && !b.detailEffect.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const activeCfg = CATEGORY_CONFIG[activeCategory];

  return (
    <div className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#D4CCBA]/70 flex items-center gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-[#5A7247]/15 border border-[#5A7247]/30">
          <Hammer className="w-5 h-5 text-[#5A7247]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-black font-sans text-[#2C3322] leading-tight">Baustoff-Katalog</h2>
            <span className="text-[9px] font-mono font-black text-[#6B6356] bg-[#E8E2D6] px-1.5 py-0.5 rounded border border-[#D4CCBA]">
              {BUILDIONS_CATALOG.length - 1} Anlagen
            </span>
          </div>
          <p className="text-[10px] text-[#6B6356] mt-0.5">Wähle eine Anlage und platziere sie auf der Karte.</p>
        </div>
        {/* Demolish toggle */}
        <button
          onClick={onDemolishModeToggle}
          className={[
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9.5px] font-bold border transition-all cursor-pointer shrink-0 uppercase tracking-wide',
            isDemolishMode
              ? 'bg-amber-700 text-white border-transparent shadow-sm'
              : 'bg-white hover:bg-[#E8E2D6] text-[#2C3322] border-[#D4CCBA]',
          ].join(' ')}
        >
          <Trash className="w-3.5 h-3.5" />
          {isDemolishMode ? 'Aktiv' : 'Rückbau'}
        </button>
      </div>

      {/* ── Upgrade Panel (context-sensitive) ───────────────────────────── */}
      {selectedTileInfo && (
        <div className="mx-4 mt-3 border-l-4 border border-[#D4CCBA] rounded-r-xl rounded-l-none bg-white/80 p-3 shrink-0" style={{ borderLeftColor: '#5A7247' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Wrench className="w-3.5 h-3.5 text-[#5A7247]" />
            <span className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest">Gebäude-Upgrade</span>
            <span className="ml-auto text-[8px] font-mono font-bold text-[#6B6356] bg-[#F2EDE4] px-1.5 py-0.5 rounded border border-[#D4CCBA]">
              ({selectedTileInfo.x}, {selectedTileInfo.y})
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black text-[#2C3322] truncate mb-1">
                {selectedTileInfo.building.name}
              </div>
              {/* Star rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(lvl => {
                  const currentLvl = selectedTileInfo.tile.upgradeLevel || 1;
                  return (
                    <Star
                      key={lvl}
                      className={`w-3.5 h-3.5 ${lvl <= currentLvl ? 'text-amber-500 fill-amber-500' : 'text-[#D4CCBA]'}`}
                    />
                  );
                })}
                <span className="text-[9px] font-mono font-black text-[#6B6356] ml-1">
                  Stufe {selectedTileInfo.tile.upgradeLevel || 1}
                </span>
              </div>
              <p className="text-[9px] text-[#6B6356] mt-1 leading-snug">
                +15% FFH-Potenzial, -0.5 WRRL-Belastung
              </p>
            </div>

            {/* Upgrade CTA */}
            {(() => {
              const currentLvl = selectedTileInfo.tile.upgradeLevel || 1;
              const isMax = currentLvl >= 3;
              const upgradeCost = currentLvl === 1 ? 3 : 5;
              const canAfford = stats.researchPoints >= upgradeCost;
              return isMax ? (
                <div className="flex items-center gap-1 bg-[#D4E0C1]/60 text-[#5A7247] px-2.5 py-1.5 rounded-lg text-[9.5px] font-black border border-[#5A7247]/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Max. Stufe 3
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => onUpgradeBuilding && onUpgradeBuilding(selectedTileInfo.x, selectedTileInfo.y, upgradeCost)}
                    disabled={!canAfford}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wide transition-all cursor-pointer',
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-sm'
                        : 'bg-[#E8E2D6] text-[#B0A898] cursor-not-allowed',
                    ].join(' ')}
                  >
                    <Wrench className="w-3 h-3" />
                    Aufwerten
                  </button>
                  <span className={`text-[8.5px] font-mono ${canAfford ? 'text-emerald-700 font-black' : 'text-red-600 font-semibold'}`}>
                    {upgradeCost} 🧪 nötig
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="px-4 mt-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B0A898] pointer-events-none" />
          <input
            type="text"
            placeholder="Name, Beschreibung oder Wirkung suchen…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white/80 hover:bg-white focus:bg-white border border-[#D4CCBA] focus:border-[#5A7247] focus:ring-1 focus:ring-[#5A7247]/25 rounded-xl text-[12px] font-sans text-[#2C3322] placeholder-[#B0A898] outline-none transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0A898] hover:text-[#6B6356] cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category chips — single scrollable row, no wrap ──────────────── */}
      <div className="px-4 mt-2 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {(Object.entries(CATEGORY_CONFIG) as [CategoryId, typeof CATEGORY_CONFIG[CategoryId]][]).map(([id, cfg]) => {
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveCategory(id); onSelectBuilding(null); }}
                className={[
                  'flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer active:scale-95 shrink-0',
                  isActive
                    ? `${cfg.activeBg} ${cfg.activeText} border-transparent shadow-sm`
                    : `${cfg.inactiveBg} ${cfg.inactiveText} ${cfg.border} hover:brightness-95`,
                ].join(' ')}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Terrain filter — collapsed by default to maximise list space ──── */}
      <div className="px-4 mt-1.5 mb-1 shrink-0">
        {/* Toggle row */}
        <button
          onClick={() => setShowTerrainFilter(v => !v)}
          className="flex items-center gap-1.5 text-[9px] font-mono font-black text-[#8B8273] uppercase tracking-widest cursor-pointer hover:text-[#5A7247] transition-colors"
        >
          <Filter className="w-2.5 h-2.5" />
          Geländefilter
          {selectedTerrains.length > 0 && (
            <span className="ml-1 bg-[#5A7247] text-white rounded-full px-1.5 py-0.5 text-[8px] font-black leading-none">
              {selectedTerrains.length}
            </span>
          )}
          <span className="ml-auto text-[8px]">{showTerrainFilter ? '▲' : '▼'}</span>
        </button>

        {/* Collapsible terrain chips */}
        {showTerrainFilter && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {TERRAIN_CONFIG.map(terrain => {
              const isSelected = selectedTerrains.includes(terrain.id);
              return (
                <button
                  key={terrain.id}
                  onClick={() => setSelectedTerrains(prev =>
                    prev.includes(terrain.id) ? prev.filter(t => t !== terrain.id) : [...prev, terrain.id]
                  )}
                  className={[
                    'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-all cursor-pointer',
                    isSelected ? 'text-white border-transparent shadow-sm' : 'bg-white text-[#6B6356] border-[#D4CCBA] hover:bg-[#F2EDE4]',
                  ].join(' ')}
                  style={isSelected ? { backgroundColor: terrain.accentColor } : undefined}
                >
                  {terrain.icon}
                  {terrain.label}
                </button>
              );
            })}
            {selectedTerrains.length > 0 && (
              <button onClick={() => setSelectedTerrains([])} className="text-[9px] font-bold text-[#5A7247] hover:underline cursor-pointer ml-1">
                Zurücksetzen
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Building List — flex-1 fills remaining height within panel ───── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 pt-2 pb-3 space-y-2">
        {filteredBuildings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2 bg-[#F7F3ED]/40 rounded-xl border border-dashed border-[#D4CCBA]">
            <Search className="w-8 h-8 text-[#D4CCBA]" />
            <div className="text-[10px] font-black text-[#2C3322]">Keine Anlagen gefunden</div>
            <div className="text-[9.5px] text-[#6B6356] max-w-[200px] text-center leading-relaxed">
              Passe die Filter an oder leere das Suchfeld.
            </div>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="px-3 py-1.5 text-[9px] bg-[#5A7247] text-white font-black rounded-lg cursor-pointer uppercase tracking-wide">
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          filteredBuildings.map(building => {
            const lockStatus = isLocked(building.id);
            const isSelected = selectedBuilding?.id === building.id;
            const finalCost = hasRurtalbahnStationNear ? Math.max(1, building.cost - 1) : building.cost;
            const accent = CARD_ACCENT[building.category] ?? '#5C564C';

            return (
              <div
                key={building.id}
                onClick={() => { if (!lockStatus.locked && !isDemolishMode) onSelectBuilding(isSelected ? null : building); }}
                className={[
                  'border-l-4 border rounded-r-xl rounded-l-none p-3.5 transition-colors duration-150',
                  lockStatus.locked ? 'opacity-50 cursor-not-allowed bg-[#E8E2D6]/40' : isSelected ? 'cursor-pointer bg-white shadow-sm ring-1' : 'cursor-pointer bg-white/70 hover:bg-white hover:border-[#C0B8A8]',
                ].join(' ')}
                style={{
                  borderLeftColor: accent,
                  ...(isSelected ? { ringColor: accent } : {}),
                }}
              >
                {/* Row 1: Name + category tag + cost */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-black text-[#2C3322] leading-tight">{building.name}</span>
                      <span
                        className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded uppercase border"
                        style={{ color: accent, backgroundColor: `${accent}18`, borderColor: `${accent}30` }}
                      >
                        {CATEGORY_CONFIG[building.category as CategoryId]?.label ?? building.category}
                      </span>
                    </div>
                    <p className={`text-[12px] text-[#6B6356] leading-snug mt-0.5 ${isSelected ? '' : 'line-clamp-1'}`}>{building.description}</p>
                  </div>
                  {/* Cost */}
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-0.5 text-[14px] font-mono font-black text-[#2C3322]">
                      {finalCost}
                      <Euro className="w-4 h-4 text-[#5A7247]" />
                    </div>
                    {building.maintenance > 0 && (
                      <div className="text-[10px] text-[#8B8273] font-mono">-{building.maintenance} €/Rnd</div>
                    )}
                    {hasRurtalbahnStationNear && building.cost > 1 && (
                      <div className="text-[10px] text-[#5A7247] font-bold bg-[#D4E0C1]/50 px-1 rounded mt-0.5">-1 Gleis</div>
                    )}
                  </div>
                </div>

                {/* Expanded details — only when this card is selected */}
                {isSelected && (
                  <>
                    {/* Effect */}
                    <div className="mt-2 bg-[#F7F3ED] border border-[#D4CCBA]/50 rounded-lg px-2.5 py-2 text-[12px]">
                      <span className="text-[10px] font-mono font-black text-[#8B8273] uppercase tracking-wider mr-1">Wirkung:</span>
                      <span className="text-[#2C3322]">{building.detailEffect}</span>
                    </div>

                    {/* Terrain tags */}
                    <div className="mt-2 flex flex-wrap gap-1 items-center">
                      <span className="text-[10.5px] text-[#8B8273] font-mono">Boden:</span>
                      {building.allowedTerrains.map(t => {
                        const tc = TERRAIN_CONFIG.find(x => x.id === t);
                        const isHighlighted = selectedTerrains.includes(t);
                        return (
                          <span
                            key={t}
                            className={[
                              'flex items-center gap-0.5 text-[10.5px] px-2 py-0.5 rounded-full border font-semibold transition-all',
                              isHighlighted ? 'text-white border-transparent' : 'bg-[#F2EDE4] text-[#6B6356] border-[#D4CCBA]',
                            ].join(' ')}
                            style={isHighlighted && tc ? { backgroundColor: tc.accentColor } : undefined}
                          >
                            {tc?.icon}
                            {tc?.label ?? t}
                          </span>
                        );
                      })}
                      {building.isRiverOnly && (
                        <span className="text-[10.5px] bg-[#D4E0C1] text-[#2C3322] px-2 rounded-full font-bold border border-[#5A7247]/20">Im Fluss</span>
                      )}
                      {building.isRiverAdjacentOnly && (
                        <span className="text-[10.5px] bg-[#D4E0C1] text-[#2C3322] px-2 rounded-full font-bold border border-[#5A7247]/20">Ufernah</span>
                      )}
                    </div>
                  </>
                )}

                {/* Lock notice — always visible */}
                {lockStatus.locked && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] bg-red-50 text-red-800 border border-red-200 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    {lockStatus.reason}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Selected building status bar ─────────────────────────────────── */}
      {selectedBuilding && (
        <div
          className="mx-4 mb-3 border-l-4 border border-[#D4CCBA] rounded-r-xl rounded-l-none bg-[#D4E0C1]/60 p-2.5 flex items-center justify-between shrink-0"
          style={{ borderLeftColor: CARD_ACCENT[selectedBuilding.category] ?? '#5A7247' }}
        >
          <div>
            <div className="text-[10px] font-mono font-black text-[#5A7247] uppercase tracking-widest">Platzierung bereit</div>
            <div className="text-[12px] font-black text-[#2C3322]">{selectedBuilding.name}</div>
          </div>
          <button
            onClick={() => onSelectBuilding(null)}
            className="flex items-center gap-1 text-[11px] font-bold text-[#6B6356] bg-white hover:bg-[#F2EDE4] px-2.5 py-1.5 rounded-lg border border-[#D4CCBA] cursor-pointer transition-colors"
          >
            <X className="w-3 h-3" />
            Abbrechen
          </button>
        </div>
      )}
    </div>
  );
};
