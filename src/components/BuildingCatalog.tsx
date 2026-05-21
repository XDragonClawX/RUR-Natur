import React, { useState } from 'react';
import { BuildingType, GameStats, ResearchNode, TerrainType, TileData } from '../types';
import { BUILDIONS_CATALOG } from '../gameData';
import { Euro, Hammer, Trash, Landmark, Droplets, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BuildingCatalogProps {
  stats: GameStats;
  selectedBuilding: BuildingType | null;
  onSelectBuilding: (building: BuildingType | null) => void;
  researchTree: ResearchNode[];
  hasRurtalbahnStationNear: boolean; // Dynamic check context (if true, shows rebate)
  onDemolishModeToggle: () => void;
  isDemolishMode: boolean;
  selectedTileInfo?: { x: number; y: number; building: BuildingType; tile: TileData } | null;
  onUpgradeBuilding?: (x: number, y: number, costPoints: number) => void;
}

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
  const [activeTab, setActiveTab] = useState<'all' | 'ecology' | 'water' | 'fauna' | 'economy' | 'infrastructure' | 'tourism'>('all');
  const [selectedTerrains, setSelectedTerrains] = useState<TerrainType[]>([]);

  const categories = [
    { id: 'all', name: 'Alle' },
    { id: 'ecology', name: '🌿 Ökologie', color: 'bg-emerald-550/10 text-emerald-400 border-emerald-500/20' },
    { id: 'water', name: '🌊 Wasser', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { id: 'fauna', name: '🦫 Fauna', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { id: 'tourism', name: '🏕️ Tourismus', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    { id: 'economy', name: '💶 Wirtschaft', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
    { id: 'infrastructure', name: '🚇 Bahn & Industrie', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  ];

  const terrainFilters: { id: TerrainType; name: string; icon: string; activeBg: string }[] = [
    { id: 'Wiese', name: 'Wiese', icon: '🌱', activeBg: 'bg-[#5A7247]' },
    { id: 'Acker', name: 'Acker', icon: '🚜', activeBg: 'bg-amber-600' },
    { id: 'Water', name: 'Wasser', icon: '💧', activeBg: 'bg-[#457B9D]' },
    { id: 'Auwald', name: 'Auwald', icon: '🌳', activeBg: 'bg-emerald-700' },
    { id: 'Siedlung', name: 'Siedlung', icon: '🏡', activeBg: 'bg-indigo-600' },
    { id: 'Gewerbe', name: 'Gewerbe', icon: '🏭', activeBg: 'bg-slate-600' },
  ];

  const filteredBuildings = BUILDIONS_CATALOG.filter(b => {
    // Hide schoellershammer as it's preplaced, unless we want to view it
    if (b.id === 'schoellershammer') return false;
    
    // 1. Filter by category
    if (activeTab !== 'all' && b.category !== activeTab) return false;
    
    // 2. Filter by selected terrains (OR connection)
    if (selectedTerrains.length > 0) {
      const match = b.allowedTerrains.some(t => selectedTerrains.includes(t));
      if (!match) return false;
    }
    
    return true;
  });

  // Check if a building is locked by research
  const isLocked = (buildingId: string): { locked: boolean; reason?: string } => {
    if (buildingId === 'lachs_zucht') {
      const researchUnlocked = researchTree.find(r => r.id === 'lachs_nrw')?.unlocked;
      if (!researchUnlocked) {
        return { locked: true, reason: 'Forschung "Lachsprogramm NRW" benötigt' };
      }
    }
    if (buildingId === 'fischpass') {
      const research = researchTree.find(r => r.id === 'sohlgleiten_tech')?.unlocked;
      // Not locked, let's keep all others unlocked as basic, but we can have soft dependencies
    }
    return { locked: false };
  };

  return (
    <div className="bg-white border border-brand-lightsky/20 rounded-xl p-5 shadow-sm flex flex-col h-full max-h-[750px] overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-brand-lightsky/10 pb-3 font-display">
        <div>
          <h2 className="text-lg font-black text-brand-dark flex items-center gap-2">
            <span>🏗️ Baustoff-Katalog</span>
            <span className="text-xs font-normal text-slate-500">({BUILDIONS_CATALOG.length - 1} Gebäude)</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Wähle ein Element und platziere es auf der Karte.</p>
        </div>

        {/* Demolish Mode Button */}
        <button
          onClick={onDemolishModeToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            isDemolishMode 
              ? 'bg-amber-800 text-white border-transparent hover:bg-amber-905 shadow-sm' 
              : 'bg-white hover:bg-[#E8E2D6] text-brand-dark border-brand-lightsky/20'
          }`}
        >
          <Trash className="w-3.5 h-3.5" />
          <span>{isDemolishMode ? 'Rückbau aktiv' : 'Rückbau-Tool'}</span>
        </button>
      </div>

      {/* Dynamic Upgrade Panel for currently selected placed building */}
      {selectedTileInfo && (
        <div className="mb-4 bg-gradient-to-r from-emerald-50/50 to-indigo-50/50 border-2 border-[#5A7247]/20 rounded-xl p-3.5 shadow-sm font-sans shrink-0 transition-all duration-300">
          <div className="flex items-center justify-between mb-1.5 border-b border-emerald-100/60 pb-1.5 flex-wrap gap-1">
            <span className="text-[10px] font-mono tracking-widest font-black uppercase text-[#5a7247] flex items-center gap-1">
              🔧 Gebäude-Upgrade-Center
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200">
              Sektor ({selectedTileInfo.x}, {selectedTileInfo.y})
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-grow">
              <h3 className="text-xs font-black text-slate-800 leading-tight">
                {selectedTileInfo.building.name}
              </h3>
              
              {/* Star Rating for Upgrade level */}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] font-mono text-slate-500 font-semibold mr-1">Status:</span>
                {[1, 2, 3].map((lvl) => {
                  const currentLvl = selectedTileInfo.tile.upgradeLevel || 1;
                  const isGold = lvl <= currentLvl;
                  return (
                    <span 
                      key={lvl} 
                      className={`text-xs ${isGold ? 'text-amber-500 font-extrabold' : 'text-slate-300'}`}
                      title={`Stufe ${lvl}`}
                    >
                      ★
                    </span>
                  );
                })}
                <span className="text-[10px] font-mono text-slate-750 bg-amber-50/80 px-1 py-0.2 rounded border border-amber-200 ml-1 font-black">
                  Stufe {selectedTileInfo.tile.upgradeLevel || 1}
                </span>
              </div>

              <p className="text-[9.5px] text-[#5C5549] mt-1.5 leading-snug">
                Nächste Stufe erhöht FFH-Potenzial (+15%) und senkt die Belastung (-0.5 WRRL).
              </p>
            </div>

            {/* Upgrade CTA */}
            <div className="shrink-0 text-right flex flex-col items-end justify-center self-center">
              {(() => {
                const currentLvl = selectedTileInfo.tile.upgradeLevel || 1;
                const isMax = currentLvl >= 3;
                
                // Determine costs
                const upgradeCost = currentLvl === 1 ? 3 : 5;
                const canAfford = stats.researchPoints >= upgradeCost;
                
                return (
                  <div className="space-y-1">
                    {!isMax ? (
                      <>
                        <button
                          onClick={() => onUpgradeBuilding && onUpgradeBuilding(selectedTileInfo.x, selectedTileInfo.y, upgradeCost)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-tight transition-all duration-200 uppercase cursor-pointer flex items-center gap-1.5 ${
                            canAfford 
                              ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-sm border border-amber-600' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          }`}
                        >
                          <span>Aufwerten</span>
                        </button>
                        <div className="text-[9px] font-mono text-slate-600 flex items-center justify-end gap-0.5">
                          Kosten: <span className={canAfford ? 'font-black text-emerald-800' : 'font-semibold text-red-650'}>{upgradeCost} 🧪</span>
                        </div>
                      </>
                    ) : (
                      <div className="bg-emerald-100 text-emerald-800 px-2 py-1.5 rounded-lg text-[10px] border border-emerald-300 font-black tracking-tight uppercase flex items-center gap-1">
                        ✨ Max. Stufe 3!
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Categories Horizontal Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveTab(cat.id as any);
              onSelectBuilding(null); // Clear selected
            }}
            className={`px-2.5 py-1 text-xs rounded-lg border font-sans font-medium transition-all duration-200 cursor-pointer ${
              activeTab === cat.id
                ? 'bg-brand-green hover:bg-brand-green/90 text-white border-transparent font-semibold shadow-sm'
                : 'bg-white hover:bg-slate-50 text-[#6B6356] border-slate-205'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Terrain Filter Selection Row */}
      <div className="space-y-1.5 mb-4 border-b border-brand-lightsky/10 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-[#8B8273] flex items-center gap-1">
            🗺️ Geländetyp-Filter:
          </span>
          {selectedTerrains.length > 0 && (
            <button
              onClick={() => setSelectedTerrains([])}
              className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 duration-100 hover:underline cursor-pointer"
            >
              Filter loeschen
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {terrainFilters.map(terrain => {
            const isSelected = selectedTerrains.includes(terrain.id);
            return (
              <button
                key={terrain.id}
                onClick={() => {
                  setSelectedTerrains(prev =>
                    prev.includes(terrain.id)
                      ? prev.filter(t => t !== terrain.id)
                      : [...prev, terrain.id]
                  );
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? `${terrain.activeBg} text-white font-black border-transparent shadow-sm scale-102`
                    : 'bg-white hover:bg-slate-50 text-[#6B6356] border-slate-200'
                }`}
              >
                <span className="text-xs">{terrain.icon}</span>
                <span>{terrain.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Buildings list container */}
      <div className="flex-grow overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
        {filteredBuildings.map(building => {
          const lockStatus = isLocked(building.id);
          const isSelected = selectedBuilding?.id === building.id;

          // Rurtalbahn rebate calculations
          const finalCost = hasRurtalbahnStationNear ? Math.max(1, building.cost - 1) : building.cost;

          // Colors based on categories
          const categoryColors = 
            building.category === 'ecology' ? { border: 'border-slate-100 hover:border-brand-green', bg: 'bg-brand-green/10', text: 'text-brand-green', label: 'Ökologie' } :
            building.category === 'water' ? { border: 'border-slate-100 hover:border-brand-teal', bg: 'bg-brand-teal/10', text: 'text-brand-teal', label: 'Hydrologie' } :
            building.category === 'fauna' ? { border: 'border-slate-100 hover:border-[#BC6C25]', bg: 'bg-[#BC6C25]/10', text: 'text-[#BC6C25]', label: 'Artenschutz' } :
            building.category === 'tourism' ? { border: 'border-slate-100 hover:border-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-700', label: 'Tourismus' } :
            building.category === 'economy' ? { border: 'border-slate-100 hover:border-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-700', label: 'Wirtschaft' } :
            { border: 'border-slate-100 hover:border-purple-500', bg: 'bg-purple-50/10', text: 'text-purple-600', label: 'Infrastruktur' };

          return (
            <div
              key={building.id}
              onClick={() => {
                if (!lockStatus.locked && !isDemolishMode) {
                  onSelectBuilding(isSelected ? null : building);
                }
              }}
              className={`border rounded-lg p-3 transition-all duration-200 ${
                lockStatus.locked ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50 border-slate-200' : 'cursor-pointer'
              } ${
                isSelected 
                  ? 'bg-slate-50 border-brand-green ring-1 ring-brand-green/30' 
                  : `bg-white ${categoryColors.border}`
              }`}
            >
              {/* Top info */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h4 className="text-xs font-bold text-[#2C3322] flex items-center gap-1.5">
                    <span>{building.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider ${
                      building.category === 'ecology' ? 'bg-[#D4E0C1] text-[#2C3322] border border-[#5A7247]/20' :
                      building.category === 'water' ? 'bg-[#457B9D]/15 text-[#457B9D] border border-[#457B9D]/20' :
                      building.category === 'fauna' ? 'bg-amber-100 text-[#BC6C25] border border-amber-200' :
                      building.category === 'tourism' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                      building.category === 'economy' ? 'bg-[#E8E2D6] text-[#2C3322] border border-[#D4CCBA]' :
                      'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {categoryColors.label}
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#6B6356] leading-snug mt-1 font-sans">
                    {building.description}
                  </p>
                </div>

                {/* Costs Badge */}
                <div className="text-right flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-0.5 text-xs font-mono font-bold text-[#2C3322]">
                    <span>{finalCost}</span>
                    <Euro className="w-3.5 h-3.5 text-[#5A7247]" />
                  </div>
                  {building.maintenance > 0 && (
                    <div className="text-[9px] text-[#8B8273] font-mono">
                      -{building.maintenance} €/Rnd
                    </div>
                  )}
                  {hasRurtalbahnStationNear && building.cost > 1 && (
                    <div className="text-[8px] text-[#5A7247] font-semibold bg-[#D4E0C1]/50 px-1 rounded">
                      -1 Gleis-Rabatt
                    </div>
                  )}
                </div>
              </div>

              {/* Action effect list */}
              <div className="mt-2 bg-[#F7F3ED] border border-[#D4CCBA]/50 rounded p-2 text-[10.5px] font-sans flex items-start gap-1">
                <div className="text-[#6B6356] shrink-0 font-medium">Wirkung:</div>
                <div className="text-[#2C3322] leading-normal">{building.detailEffect}</div>
              </div>

              {/* Requirement highlights */}
              <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                <span className="text-[9px] text-[#8B8273]">Boden:</span>
                {building.allowedTerrains.map(t => {
                  const isHighlighted = selectedTerrains.includes(t);
                  const terrainLabels: { [key: string]: { label: string; activeBg: string } } = {
                    Wiese: { label: '🌱 Wiese', activeBg: 'bg-[#5A7247] text-white ring-2 ring-[#5A7247]/35 font-bold' },
                    Acker: { label: '🚜 Acker', activeBg: 'bg-amber-600 text-white ring-2 ring-amber-600/35 font-bold' },
                    Water: { label: '💧 Wasser', activeBg: 'bg-[#457B9D] text-white ring-2 ring-[#457B9D]/35 font-bold' },
                    Auwald: { label: '🌳 Auwald', activeBg: 'bg-emerald-700 text-white ring-2 ring-emerald-700/35 font-bold' },
                    Siedlung: { label: '🏡 Siedlung', activeBg: 'bg-indigo-600 text-white ring-2 ring-indigo-600/35 font-bold' },
                    Gewerbe: { label: '🏭 Gewerbe', activeBg: 'bg-slate-600 text-white ring-2 ring-slate-600/35 font-bold' },
                  };
                  const info = terrainLabels[t] || { label: t, activeBg: 'bg-[#E8E2D6] text-[#6B6356]' };
                  return (
                    <span 
                      key={t} 
                      className={`text-[9.5px] px-1.5 py-0.5 rounded transition-all duration-200 ${
                        isHighlighted 
                          ? info.activeBg 
                          : 'bg-[#E8E2D6] text-[#6B6356] border border-[#D4CCBA]/30'
                      }`}
                    >
                      {info.label}
                    </span>
                  );
                })}
                {building.isRiverOnly && (
                    <span className="text-[9px] bg-[#D4E0C1] text-[#2C3322] px-1 rounded uppercase font-bold border border-[#5A7247]/20">
                      Im Fluss
                    </span>
                )}
                {building.isRiverAdjacentOnly && (
                    <span className="text-[9px] bg-[#D4E0C1] text-[#2C3322] px-1 rounded uppercase font-bold border border-[#5A7247]/20">
                      Ufernah
                    </span>
                )}
              </div>

              {/* Lock Alert */}
              {lockStatus.locked && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] bg-red-50 text-red-800 border border-red-200 p-1.5 rounded font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>{lockStatus.reason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected building floating state tracker */}
      {selectedBuilding && (
        <div className="mt-4 p-3 bg-[#D4E0C1]/50 border border-[#5A7247]/30 rounded-lg flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-[#5A7247]">Platzierung bereit:</div>
            <div className="text-[#2C3322]">{selectedBuilding.name}</div>
          </div>
          <button
            onClick={() => onSelectBuilding(null)}
            className="text-[10px] bg-[#E8E2D6] hover:bg-[#DCD4C4] text-[#2C3322] px-2 py-1 rounded cursor-pointer border border-[#D4CCBA]"
          >
            Abbrechen
          </button>
        </div>
      )}
    </div>
  );
};
