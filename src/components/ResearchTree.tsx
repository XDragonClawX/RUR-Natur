import React from 'react';
import { ResearchNode, GameStats } from '../types';
import { Microscope, Check, Lock, Star, Network } from 'lucide-react';

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
  
  // Helper to check if dependencies are unlocked
  const areDependenciesMet = (node: ResearchNode): boolean => {
    return node.dependencies.every(depId => {
      const depNode = researchNodes.find(r => r.id === depId);
      return depNode ? depNode.unlocked : false;
    });
  };

  return (
    <div className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl p-5 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2.5 mb-4 border-b border-[#D4CCBA] pb-3 justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#457B9D]/15 border border-[#457B9D]/30">
            <Microscope className="w-5 h-5 text-[#457B9D]" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-sans text-[#2C3322] flex items-center gap-1.5">
              <span>🔬 Forschungs-Zentrum</span>
              <span className="text-xs font-mono font-bold bg-[#457B9D] text-white px-2 py-0.5 rounded">
                {stats.researchPoints} 🧪
              </span>
            </h2>
            <p className="text-xs text-[#6B6356] font-sans mt-0.5">
              Generiere Forschungspunkte durch den &quot;Forschen&quot;-Aktionsslot, um ökologische Verbesserungen freizuschalten.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Tree Nodes grid */}
      <div className="flex-grow overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
        {researchNodes.map((node) => {
          const depMet = areDependenciesMet(node);
          const canAfford = stats.researchPoints >= node.cost;
          const isEligible = !node.unlocked && depMet && canAfford;

          let cardStatusStyle = '';
          if (node.unlocked) {
            cardStatusStyle = 'border-[#5A7247]/50 bg-[#D4E0C1] text-[#2C3322]';
          } else if (!depMet) {
            cardStatusStyle = 'opacity-55 border-[#D4CCBA] bg-[#E8E2D6]/40 text-[#8A8374] cursor-not-allowed';
          } else if (canAfford) {
            cardStatusStyle = 'border-[#457B9D]/40 hover:border-[#457B9D] bg-white text-[#2C3322] cursor-pointer shadow-sm';
          } else {
            cardStatusStyle = 'border-[#D4CCBA] bg-white text-[#6B6356] cursor-any';
          }

          return (
            <div
              key={node.id}
              onClick={() => {
                if (isEligible) {
                  onUnlockResearch(node.id);
                }
              }}
              className={`border rounded-lg p-3 transition-all duration-200 ${cardStatusStyle}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    {node.unlocked ? (
                      <Check className="w-3.5 h-3.5 text-[#5A7247]" />
                    ) : !depMet ? (
                      <Lock className="w-3.5 h-3.5 text-[#8A8374]" />
                    ) : (
                      <Star className="w-3.5 h-3.5 text-[#457B9D]" />
                    )}
                    <span className="text-[#2C3322] font-bold">
                      {node.name}
                    </span>
                  </h4>

                  <p className="text-[11px] text-[#6B6356] mt-1 font-sans leading-normal">
                    {node.description}
                  </p>
                </div>

                {/* Cost Label */}
                <div className="shrink-0 text-right">
                  {!node.unlocked ? (
                    <div className="flex items-center gap-0.5 text-xs font-mono font-bold text-[#457B9D] bg-sky-50 px-2 py-0.5 rounded border border-[#457B9D]/20">
                      <span>{node.cost}</span>
                      <span className="text-[10px]">🧪</span>
                    </div>
                  ) : (
                    <span className="text-[9px] bg-[#5A7247]/20 text-[#5A7247] px-1.5 py-0.5 rounded border border-[#5A7247]/30 font-bold uppercase">
                      Erlernt
                    </span>
                  )}
                </div>
              </div>

              {/* Effekt-Anzeige */}
              <div className="mt-2.5 bg-[#F7F3ED] p-2 rounded text-[10px] font-mono leading-relaxed text-[#2C3322] border border-[#D4CCBA]/50">
                <span className="font-semibold text-[#457B9D]">Effekt:</span> {node.effect}
              </div>

              {/* Dependencies info */}
              {node.dependencies.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[9px] text-[#8A8374] font-sans">
                  <Network className="w-3 h-3 text-[#8A8374]" />
                  <span>
                    Bedingung:{' '}
                    {node.dependencies
                      .map(
                        (depId) =>
                          researchNodes.find((r) => r.id === depId)?.name || depId
                      )
                      .join(', ')}
                  </span>
                </div>
              )}

              {/* Action Prompt */}
              {isEligible && (
                <button
                  onClick={() => onUnlockResearch(node.id)}
                  className="mt-2 w-full py-1 text-center bg-[#457B9D] hover:bg-[#396885] text-white font-bold text-[10px] rounded uppercase cursor-pointer"
                >
                  Erforschen freischalten (Kosten: {node.cost} 🧪)
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
