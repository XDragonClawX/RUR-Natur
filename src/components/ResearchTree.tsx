import React, { useState } from 'react';
import { ResearchNode, GameStats } from '../types';
import {
  Microscope, CheckCircle2, Lock, Zap,
  GitBranch, FlaskConical, ChevronRight,
  Search, X, Filter, Leaf, Waves, AlertTriangle
} from 'lucide-react';

interface ResearchTreeProps {
  researchNodes: ResearchNode[];
  stats: GameStats;
  onUnlockResearch: (nodeId: string) => void;
}

// ── Category config matching BuildingCatalog aesthetics ─────────────────────
const CATEGORY_CONFIG = {
  all:    { label: 'Alle',           icon: <Filter className="w-3 h-3" />, activeBg: 'bg-[#2C3322]',  activeText: 'text-white',  inactiveBg: 'bg-white',  inactiveText: 'text-[#5C564C]',  border: 'border-[#D4CCBA]' },
  nature: { label: 'Ökologie',       icon: <Leaf className="w-3 h-3" />,   activeBg: 'bg-[#5A7247]',  activeText: 'text-white',  inactiveBg: 'bg-emerald-50/40', inactiveText: 'text-[#2C3311]', border: 'border-emerald-200/70' },
  water:  { label: 'Wasser & Tech',  icon: <Waves className="w-3 h-3" />,  activeBg: 'bg-[#457B9D]',  activeText: 'text-white',  inactiveBg: 'bg-blue-50/40',    inactiveText: 'text-[#1D4E5B]',  border: 'border-blue-200/70' },
  energy: { label: 'Werk & Energie', icon: <Zap className="w-3 h-3" />,    activeBg: 'bg-[#BC6C25]',  activeText: 'text-white',  inactiveBg: 'bg-amber-50/40',   inactiveText: 'text-[#7A3F1F]',  border: 'border-amber-200/70' },
} as const;

type CategoryId = keyof typeof CATEGORY_CONFIG;

// ── Status config matching BuildingCatalog style ──────────────────────────────
const STATUS_CONFIG = {
  all:       { label: 'Alle Status', activeBg: 'bg-[#5C564C]', activeText: 'text-white', inactiveBg: 'bg-white', inactiveText: 'text-[#5C564C]', border: 'border-[#D4CCBA]' },
  available: { label: 'Freischaltbar', activeBg: 'bg-amber-500', activeText: 'text-white', inactiveBg: 'bg-white', inactiveText: 'text-amber-700', border: 'border-amber-200' },
  locked:    { label: 'Gesperrt',      activeBg: 'bg-[#8B8273]', activeText: 'text-white', inactiveBg: 'bg-white', inactiveText: 'text-[#8B8273]', border: 'border-[#D4CCBA]' },
  unlocked:  { label: 'Erlernt',      activeBg: 'bg-[#5A7247]', activeText: 'text-white', inactiveBg: 'bg-white', inactiveText: 'text-[#5A7247]', border: 'border-emerald-200/70' },
} as const;

type StatusId = keyof typeof STATUS_CONFIG;

export const ResearchTree: React.FC<ResearchTreeProps> = ({
  researchNodes,
  stats,
  onUnlockResearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [activeStatus, setActiveStatus] = useState<StatusId>('all');

  const areDependenciesMet = (node: ResearchNode): boolean =>
    node.dependencies.every(depId => researchNodes.find(r => r.id === depId)?.unlocked ?? false);

  // Map research node ID to category
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

  const unlockedCount = researchNodes.filter(r => r.unlocked).length;
  const availableCount = researchNodes.filter(r => !r.unlocked && areDependenciesMet(r) && stats.researchPoints >= r.cost).length;
  const totalCount = researchNodes.length;

  const filteredNodes = researchNodes.filter(node => {
    // 1. Search filter
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      if (!node.name.toLowerCase().includes(s) &&
          !node.description.toLowerCase().includes(s) &&
          !node.effect.toLowerCase().includes(s)) {
        return false;
      }
    }

    // 2. Category filter
    if (activeCategory !== 'all') {
      const cat = getNodeCategory(node.id);
      if (cat !== activeCategory) return false;
    }

    // 3. Status filter
    if (activeStatus !== 'all') {
      const depMet = areDependenciesMet(node);
      const canAfford = stats.researchPoints >= node.cost;

      if (activeStatus === 'unlocked' && !node.unlocked) return false;
      if (activeStatus === 'available' && (node.unlocked || !depMet || !canAfford)) return false;
      if (activeStatus === 'locked' && (node.unlocked || depMet)) return false;
    }

    return true;
  });

  return (
    <div className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl shadow-sm flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#D4CCBA]/70 flex items-center gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-[#457B9D]/15 border border-[#457B9D]/30">
          <Microscope className="w-5 h-5 text-[#457B9D]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-black font-sans text-[#2C3322] leading-tight">Innovationszentrum</h2>
            <span className="text-[9px] font-mono font-black text-[#6B6356] bg-[#E8E2D6] px-1.5 py-0.5 rounded border border-[#D4CCBA]">
              {totalCount} Projekte
            </span>
          </div>
          <p className="text-[10px] text-[#6B6356] mt-0.5">Gib Forschungspunkte (🧪) aus, um ökologische Upgrades freizuschalten.</p>
        </div>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-[#D4CCBA]/50 shrink-0 bg-[#F7F3ED]/60">
        <div className="bg-white rounded-xl border border-[#D4CCBA]/55 p-2 text-center shadow-xs">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Forschungspunkte
          </div>
          <div className="text-xs font-black font-mono text-[#457B9D]">
            {stats.researchPoints} 🧪
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#D4CCBA]/55 p-2 text-center shadow-xs">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Erforscht
          </div>
          <div className="text-xs font-black font-mono text-[#5A7247]">
            {unlockedCount} / {totalCount}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#D4CCBA]/55 p-2 text-center shadow-xs">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Möglich
          </div>
          <div className={`text-xs font-black font-mono ${availableCount > 0 ? 'text-amber-600' : 'text-[#8B8273]'}`}>
            {availableCount} bereit
          </div>
        </div>
      </div>

      {/* ── Search Input (same style as BuildingCatalog) ─────────────────── */}
      <div className="px-4 mt-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B0A898] pointer-events-none" />
          <input
            type="text"
            placeholder="Nach Forschung, Wirkung oder Effekt suchen…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white/80 hover:bg-white focus:bg-white border border-[#D4CCBA] focus:border-[#457B9D] focus:ring-1 focus:ring-[#457B9D]/25 rounded-xl text-[10.5px] font-sans text-[#2C3322] placeholder-[#B0A898] outline-none transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0A898] hover:text-[#6B6356] cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category tabs matching BuildingCatalog ──────────────────────── */}
      <div className="px-4 mt-2.5 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(CATEGORY_CONFIG) as [CategoryId, typeof CATEGORY_CONFIG[CategoryId]][]).map(([id, cfg]) => {
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveCategory(id); }}
                className={[
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[9.5px] font-bold transition-all cursor-pointer active:scale-95',
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

      {/* ── Status filters matching BuildingCatalog ─────────────────────── */}
      <div className="px-4 mt-2.5 mb-1 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest flex items-center gap-1.5">
            <Filter className="w-2.5 h-2.5" />
            Status-Filter
          </span>
          {(activeCategory !== 'all' || activeStatus !== 'all' || searchTerm) && (
            <button
              onClick={() => { setActiveCategory('all'); setActiveStatus('all'); setSearchTerm(''); }}
              className="text-[8.5px] font-bold text-[#457B9D] hover:underline cursor-pointer"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {(Object.entries(STATUS_CONFIG) as [StatusId, typeof STATUS_CONFIG[StatusId]][]).map(([id, cfg]) => {
            const isActive = activeStatus === id;
            return (
              <button
                key={id}
                onClick={() => setActiveStatus(id)}
                className={[
                  'px-2 py-1 rounded-full border text-[9px] font-semibold transition-all cursor-pointer',
                  isActive
                    ? `${cfg.activeBg} ${cfg.activeText} border-transparent shadow-sm`
                    : `${cfg.inactiveBg} ${cfg.inactiveText} ${cfg.border} hover:bg-[#F2EDE4]`,
                ].join(' ')}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Research Node List ───────────────────────────────────────────── */}
      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2 bg-[#F7F3ED]/40 rounded-xl border border-dashed border-[#D4CCBA]">
            <Search className="w-8 h-8 text-[#D4CCBA]" />
            <div className="text-[10px] font-black text-[#2C3322]">Keine Forschungsprojekte gefunden</div>
            <div className="text-[9.5px] text-[#6B6356] max-w-[200px] text-center leading-relaxed">
              Passe deine Filter oder Sucheinstellungen an.
            </div>
            {(activeCategory !== 'all' || activeStatus !== 'all' || searchTerm) && (
              <button
                onClick={() => { setActiveCategory('all'); setActiveStatus('all'); setSearchTerm(''); }}
                className="px-3 py-1.5 text-[9px] bg-[#457B9D] text-white font-black rounded-lg cursor-pointer uppercase tracking-wide"
              >
                Alle Filter löschen
              </button>
            )}
          </div>
        ) : (
          filteredNodes.map((node) => {
            const depMet = areDependenciesMet(node);
            const canAfford = stats.researchPoints >= node.cost;
            const isEligible = !node.unlocked && depMet && canAfford;

            const cat = getNodeCategory(node.id);
            const accent = cat === 'nature' ? '#5A7247' : cat === 'water' ? '#457B9D' : '#BC6C25';

            // Card background & state styling
            const cardBg = node.unlocked
              ? 'bg-[#D4E0C1]/25 ring-1 ring-[#5A7247]/10'
              : !depMet
              ? 'bg-[#E8E2D6]/40 opacity-55'
              : 'bg-white hover:bg-white hover:shadow-sm shadow-xs';

            const activeTextClass = node.unlocked ? 'text-[#3B4D2C]' : 'text-[#2C3322]';

            return (
              <div
                key={node.id}
                onClick={() => { if (isEligible) onUnlockResearch(node.id); }}
                className={[
                  'border-l-4 border rounded-r-xl rounded-l-none p-3 transition-all duration-150',
                  isEligible ? 'cursor-pointer hover:border-l-[6px]' : !depMet ? 'cursor-not-allowed' : 'cursor-default',
                  cardBg,
                ].join(' ')}
                style={{ borderLeftColor: accent }}
              >
                {/* Row 1: Status icon + name + cost badge */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {node.unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#5A7247] shrink-0" />
                    ) : !depMet ? (
                      <Lock className="w-4 h-4 text-[#8B8273] shrink-0" />
                    ) : (
                      <Zap className={`w-4 h-4 shrink-0 animate-pulse`} style={{ color: accent }} />
                    )}
                    <span className={`text-[11px] font-black ${activeTextClass} leading-tight`}>
                      {node.name}
                    </span>
                  </div>

                  {/* Cost Badge */}
                  <div className="shrink-0 text-right">
                    {node.unlocked ? (
                      <span className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded border bg-[#5A7247]/15 text-[#5A7247] border-[#5A7247]/25 uppercase">
                        Erlernt
                      </span>
                    ) : (
                      <span className={`text-[9.5px] font-mono font-black px-2 py-0.5 rounded border flex items-center gap-1 ${
                        canAfford
                          ? 'bg-sky-50 text-[#457B9D] border-[#457B9D]/20 shadow-2xs'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {node.cost} 🧪
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-[10px] text-[#6B6356] leading-snug mt-0.5 mb-2 font-sans">
                  {node.description}
                </p>

                {/* Effect box matched perfectly to category accent */}
                <div
                  className="rounded-lg p-2 text-[10px] border"
                  style={{
                    backgroundColor: `${accent}0c`,
                    borderColor: `${accent}25`
                  }}
                >
                  <span className="text-[8px] font-mono font-black uppercase tracking-wider block mb-0.5" style={{ color: accent }}>
                    Projekt-Effekt:
                  </span>
                  <span className="text-[#2C3322] leading-snug font-sans">{node.effect}</span>
                </div>

                {/* Dependencies bottom line */}
                {node.dependencies.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[8.5px] text-[#8B8273] font-mono">
                    <GitBranch className="w-3 h-3 shrink-0 text-[#B0A898]" />
                    <span>
                      Voraussetzung:{' '}
                      <span className={depMet ? 'text-[#5A7247] font-bold' : 'text-amber-700 font-bold'}>
                        {node.dependencies
                          .map(depId => researchNodes.find(r => r.id === depId)?.name || depId)
                          .join(', ')}
                      </span>
                    </span>
                  </div>
                )}

                {/* Quick Unlock Button inside the card when Eligible */}
                {isEligible && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnlockResearch(node.id);
                    }}
                    className="mt-2.5 w-full py-1.5 flex items-center justify-center gap-1.5 bg-[#457B9D] hover:bg-[#396885] active:scale-[0.98] text-white font-black text-[9.5px] rounded-lg uppercase tracking-wide cursor-pointer transition-all"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Mit {node.cost} 🧪 erforschen</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
