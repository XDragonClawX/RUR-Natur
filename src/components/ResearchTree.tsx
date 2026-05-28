import React from 'react';
import { ResearchNode, GameStats } from '../types';
import {
  Microscope, CheckCircle2, Lock, Zap,
  GitBranch, FlaskConical, ChevronRight
} from 'lucide-react';

interface ResearchTreeProps {
  researchNodes: ResearchNode[];
  stats: GameStats;
  onUnlockResearch: (nodeId: string) => void;
}

export const ResearchTree: React.FC<ResearchTreeProps> = ({
  researchNodes,
  stats,
  onUnlockResearch,
}) => {
  const areDependenciesMet = (node: ResearchNode): boolean =>
    node.dependencies.every(depId => researchNodes.find(r => r.id === depId)?.unlocked ?? false);

  const unlockedCount = researchNodes.filter(r => r.unlocked).length;
  const availableCount = researchNodes.filter(r => !r.unlocked && areDependenciesMet(r) && stats.researchPoints >= r.cost).length;
  const totalCount = researchNodes.length;

  return (
    <div className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl shadow-sm flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#D4CCBA]/70 flex items-start gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-[#457B9D]/15 border border-[#457B9D]/30 mt-0.5">
          <Microscope className="w-5 h-5 text-[#457B9D]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-black font-sans text-[#2C3322] leading-tight">
              Forschungs-Zentrum
            </h2>
            <span className="text-[9px] font-mono font-black text-[#6B6356] bg-[#E8E2D6] px-1.5 py-0.5 rounded border border-[#D4CCBA]">
              INNOVATION
            </span>
          </div>
          <p className="text-[10px] text-[#6B6356] mt-0.5 leading-snug">
            Finanziere Forschungsprojekte über den Aktionsslot, um ökologische Technologien freizuschalten.
          </p>
        </div>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-[#D4CCBA]/50 shrink-0">
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Forschungspunkte
          </div>
          <div className="text-sm font-black font-mono text-[#457B9D]">
            {stats.researchPoints}
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Erforscht
          </div>
          <div className="text-sm font-black font-mono text-[#5A7247]">
            {unlockedCount}/{totalCount}
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Freischaltbar
          </div>
          <div className={`text-sm font-black font-mono ${availableCount > 0 ? 'text-amber-600' : 'text-[#8B8273]'}`}>
            {availableCount}
          </div>
        </div>
      </div>

      {/* ── Research Node List ───────────────────────────────────────────── */}
      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
        <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <FlaskConical className="w-2.5 h-2.5" />
          Technologie-Baum
        </div>

        {researchNodes.map((node) => {
          const depMet = areDependenciesMet(node);
          const canAfford = stats.researchPoints >= node.cost;
          const isEligible = !node.unlocked && depMet && canAfford;

          // Border accent and bg by state
          const accentColor = node.unlocked
            ? '#5A7247'
            : !depMet
            ? '#B0A898'
            : canAfford
            ? '#457B9D'
            : '#BC6C25';

          const cardBg = node.unlocked
            ? 'bg-[#D4E0C1]/40'
            : !depMet
            ? 'bg-[#E8E2D6]/40 opacity-55'
            : canAfford
            ? 'bg-white hover:shadow-sm'
            : 'bg-white/60';

          return (
            <div
              key={node.id}
              onClick={() => { if (isEligible) onUnlockResearch(node.id); }}
              className={[
                'border-l-4 border rounded-r-xl rounded-l-none p-3 transition-all duration-200',
                isEligible ? 'cursor-pointer' : !depMet ? 'cursor-not-allowed' : 'cursor-default',
                cardBg,
              ].join(' ')}
              style={{ borderLeftColor: accentColor }}
            >
              {/* Row 1: Status icon + name + cost badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {node.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-[#5A7247] shrink-0" />
                  ) : !depMet ? (
                    <Lock className="w-4 h-4 text-[#B0A898] shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 text-[#457B9D] shrink-0" />
                  )}
                  <span className="text-[11px] font-black text-[#2C3322] leading-tight">
                    {node.name}
                  </span>
                </div>
                <div className="shrink-0">
                  {node.unlocked ? (
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-[#5A7247]/15 text-[#5A7247] border-[#5A7247]/30 uppercase">
                      Erlernt
                    </span>
                  ) : (
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                      canAfford
                        ? 'bg-sky-50 text-[#457B9D] border-[#457B9D]/30'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {node.cost} 🧪
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-[10px] text-[#6B6356] leading-snug mb-2">
                {node.description}
              </p>

              {/* Effect box */}
              <div className="bg-[#EEF5FB] border border-[#457B9D]/20 rounded-lg p-2 text-[10px] font-sans">
                <span className="text-[8px] font-mono font-black text-[#457B9D] uppercase tracking-wider block mb-0.5">Effekt</span>
                <span className="text-[#2C3322] leading-snug">{node.effect}</span>
              </div>

              {/* Dependencies */}
              {node.dependencies.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[9px] text-[#8B8273]">
                  <GitBranch className="w-3 h-3 shrink-0" />
                  <span>
                    Voraussetzung:{' '}
                    <span className={depMet ? 'text-[#5A7247] font-semibold' : 'text-amber-700 font-semibold'}>
                      {node.dependencies
                        .map(depId => researchNodes.find(r => r.id === depId)?.name || depId)
                        .join(', ')}
                    </span>
                  </span>
                </div>
              )}

              {/* CTA button */}
              {isEligible && (
                <button
                  onClick={() => onUnlockResearch(node.id)}
                  className="mt-2.5 w-full py-1.5 flex items-center justify-center gap-1.5 bg-[#457B9D] hover:bg-[#396885] active:scale-[0.98] text-white font-black text-[9.5px] rounded-lg uppercase tracking-wide cursor-pointer transition-all"
                >
                  <FlaskConical className="w-3 h-3" />
                  <span>Für {node.cost} 🧪 erforschen</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
