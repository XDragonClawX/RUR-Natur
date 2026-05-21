import React, { useMemo } from 'react';
import { GameStats, TileData, BuildingType } from '../types';
import { BUILDIONS_CATALOG } from '../gameData';
import { Award, Droplets, ShieldAlert, Sparkles, Check } from 'lucide-react';

interface OekoZentraleHUDProps {
  stats: GameStats;
  grid: TileData[][];
  selectedBuilding: BuildingType | null;
  onSelectBuilding: (b: BuildingType | null) => void;
  isDemolishMode: boolean;
  onDemolishModeToggle: () => void;
}

export const OekoZentraleHUD: React.FC<OekoZentraleHUDProps> = ({
  stats,
  grid,
  selectedBuilding,
  onSelectBuilding,
  isDemolishMode,
  onDemolishModeToggle,
}) => {
  // 1. WASSERQUALITÄT PERCENT
  const [wasserPercent, wasserLabel, wasserColor] = useMemo(() => {
    // globalWrrl runs 1 (best) to 5 (worst)
    const pct = Math.max(5, Math.min(100, Math.round((5 - stats.globalWrrl) * 25)));
    let label = 'MÄSSIG';
    let color = 'stroke-[#BC6C25] text-[#BC6C25]';
    if (stats.globalWrrl <= 2.2) {
      label = 'SPITZENKLASSE';
      color = 'stroke-[#5A7247] text-[#5A7247]';
    } else if (stats.globalWrrl <= 2.8) {
      label = 'GUT';
      color = 'stroke-[#2A6F7E] text-[#2A6F7E]';
    } else if (stats.globalWrrl <= 3.6) {
      label = 'MÄSSIG';
      color = 'stroke-[#7FA8B5] text-[#7FA8B5]';
    } else {
      label = 'BELASTET';
      color = 'stroke-rose-600 text-rose-600';
    }
    return [pct, label, color];
  }, [stats.globalWrrl]);

  // 2. BIODIVERSITÄT PERCENT
  const [bioPercent, bioLabel, bioColor] = useMemo(() => {
    const pct = Math.max(5, Math.min(100, Math.round(stats.globalFfh)));
    let label = 'KRITISCH';
    let color = 'stroke-rose-600 text-rose-600';
    if (pct >= 60) {
      label = 'HOHER WERT';
      color = 'stroke-[#5A7247] text-[#5A7247]';
    } else if (pct >= 40) {
      label = 'STABIL';
      color = 'stroke-[#2A6F7E] text-[#2A6F7E]';
    } else if (pct >= 25) {
      label = 'GEFÄHRDET';
      color = 'stroke-[#BC6C25] text-[#BC6C25]';
    }
    return [pct, label, color];
  }, [stats.globalFfh]);

  // 3. HOCHWASSER-RISIKO PERCENT
  const [floodPercent, floodLabel, floodColor] = useMemo(() => {
    // Let's compute average flood risk across the grid tiles
    const size = grid.length || 1;
    let totalRisk = 0;
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        totalRisk += grid[r][c].flood_risk;
        count++;
      }
    }
    const rawPct = count > 0 ? totalRisk / count : 35;
    const pct = Math.max(0, Math.min(100, Math.round(rawPct + (stats.climateRisk / 2))));
    let label = 'HOCH';
    let color = 'stroke-rose-600 text-rose-600';
    if (pct <= 25) {
      label = 'MINIMAL';
      color = 'stroke-[#5A7247] text-[#5A7247]';
    } else if (pct <= 45) {
      label = 'MODERAT';
      color = 'stroke-[#2A6F7E] text-[#2A6F7E]';
    } else if (pct <= 65) {
      label = 'ERHÖHT';
      color = 'stroke-[#BC6C25] text-[#BC6C25]';
    }
    return [pct, label, color];
  }, [grid, stats.climateRisk]);

  // 4. MAP DYNAMIC MEASURES SELECTORS FOR RAPID CLICK
  // Find key action buildings from the catalog corresponding to the template list
  const measuresList = useMemo(() => {
    const ids = ['biber_station', 'ufer_entfesselung', 'polder', 'fischpass'];
    return BUILDIONS_CATALOG.filter(b => ids.includes(b.id)).map(b => {
      // replace matching visual name to fit photo
      let displayName = b.name;
      if (b.id === 'biber_station') displayName = 'Biberdamm bauen';
      if (b.id === 'ufer_entfesselung') displayName = 'Ufer renaturieren';
      if (b.id === 'polder') displayName = 'Retentionsfläche';
      if (b.id === 'fischpass') displayName = 'Fischpass errichten';
      return { ...b, name: displayName };
    });
  }, []);

  // 5. MONITORING PEGLING SENE-WAVE DATA
  // returns simulated water-level heights in cm for consecutive seasons based on current round
  const mockWaterLevels = useMemo(() => {
    const levels = [];
    const baseRound = stats.round;
    // Generate previous 6 intervals
    for (let i = 5; i >= 0; i--) {
      const r = Math.max(1, baseRound - i);
      const isWinterOrSpring = (r - 1) % 4 === 0 || (r - 1) % 4 === 3;
      let height = isWinterOrSpring ? 140 : 85; // Summer/Autumn dry
      // Adjust with research
      height += Math.round(Math.sin(r * 1.5) * 20); // Fluctuations
      if (stats.climateRisk > 35) height += 15; // Climatic instability rising
      levels.push({ roundIdx: r, value: height });
    }
    return levels;
  }, [stats.round, stats.climateRisk]);

  // 6. RADAR CHART GEOM MATH - SPIDER PEN
  // Climatic health (inv), Water, Soil (Auwald), Biodiversity, Landscape (Continuity)
  const radarPolygonPoints = useMemo(() => {
    const cx = 55;
    const cy = 55;
    const r = 38;

    // Normalize counts to 0 .. 1 range
    const valKlima = Math.max(0.15, Math.min(1.0, (100 - stats.climateRisk) / 100));
    const valWasser = Math.max(0.15, Math.min(1.0, wasserPercent / 100));
    
    // Soil indicator calculation based on wetlands and Auwald trees ratio
    let soilScore = 30;
    grid.forEach(row => row.forEach(tile => {
      if (tile.terrain === 'Auwald') soilScore += 1.5;
      if (tile.terrain === 'Wiese') soilScore += 0.3;
    }));
    const valBoden = Math.max(0.15, Math.min(1.0, soilScore / 100));
    
    const valBio = Math.max(0.15, Math.min(1.0, bioPercent / 100));
    const valLandschaft = Math.max(0.15, Math.min(1.0, stats.continuity / 100));

    // Array of indices: [Klima, Wasser, Boden, Landschaft, Biodiversität]
    const vals = [valKlima, valWasser, valBoden, valLandschaft, valBio];
    
    // Coordinates
    const coords = vals.map((val, idx) => {
      // Straight up is -90 degrees (-Math.PI / 2). Dynamic spacing 5-axis:
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
      const x = cx + r * val * Math.cos(angle);
      const y = cy + r * val * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return coords.join(' ');
  }, [stats.climateRisk, stats.continuity, grid, wasserPercent, bioPercent]);

  return (
    <div className="bg-[#3A3F45] text-white rounded-xl p-5 border border-[#3A434D] shadow-xl w-full select-none shrink-0 font-sans">
      
      {/* Title block */}
      <div className="border-b border-white/10 pb-2 mb-4 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#7FA8B5]" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#7FA8B5] uppercase">
            UI / GAMEPLAY-INTEGRATION &bull; ÖKO-ZENTRALE DÜREN
          </span>
        </div>
        <div className="text-[10px] font-mono text-white/50">
          SYSTEM-COORDINATES: RUR-DECK-PROJ
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* SECTION 1: ECOLOGICAL PROGRESS CIRCLES */}
        <div className="md:col-span-5 grid grid-cols-3 gap-3 border-r border-white/5 pr-4">
          
          {/* Circular item 1: WASSERQUALITÄT */}
          <div className="bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-between text-center border border-white/5 relative group hover:bg-white/10 transition-colors">
            <span className="text-[10px] font-black tracking-wider text-white/70 block uppercase">
              Wasserqualität
            </span>
            
            <div className="relative w-18 h-18 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-white/10" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${wasserColor} transition-all duration-500`} strokeDasharray={`${wasserPercent}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black tracking-tight leading-none">{wasserPercent}</span>
                <span className="text-[7.5px] font-bold text-white/60 leading-none mt-0.5">{wasserLabel}</span>
              </div>
            </div>

            {/* Sparkline wave effect overlay */}
            <div className="w-full h-4 mt-1 overflow-hidden opacity-80">
              <svg className="w-full h-full" viewBox="0 0 60 15" fill="none">
                <path d="M0 8 C10 12, 15 2, 25 8 C35 14, 45 -1, 60 8" stroke="#7FA8B5" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Circular item 2: BIODIVERSITÄT */}
          <div className="bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-between text-center border border-white/5 relative group hover:bg-white/10 transition-colors">
            <span className="text-[10px] font-black tracking-wider text-white/70 block uppercase">
              Biodiversität
            </span>
            
            <div className="relative w-18 h-18 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-white/10" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${bioColor} transition-all duration-500`} strokeDasharray={`${bioPercent}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black tracking-tight leading-none">{bioPercent}%</span>
                <span className="text-[7.5px] font-bold text-white/60 leading-none mt-0.5">{bioLabel}</span>
              </div>
            </div>

            {/* Sparkline wave */}
            <div className="w-full h-4 mt-1 overflow-hidden opacity-80">
              <svg className="w-full h-full" viewBox="0 0 60 15" fill="none">
                <path d="M0 6 C8 1, 18 13, 28 6 C38 -1, 48 10, 60 4" stroke="#4A7A3A" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Circular item 3: HOCHWASSER-RISIKO */}
          <div className="bg-white/5 rounded-xl p-2.5 flex flex-col items-center justify-between text-center border border-white/5 relative group hover:bg-white/10 transition-colors">
            <span className="text-[10px] font-black tracking-wider text-white/70 block uppercase">
              Hochwasser-Risiko
            </span>
            
            <div className="relative w-18 h-18 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-white/10" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${floodColor} transition-all duration-500`} strokeDasharray={`${floodPercent}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black tracking-tight leading-none">{floodPercent}%</span>
                <span className="text-[7.5px] font-bold text-white/60 leading-none mt-0.5">{floodLabel}</span>
              </div>
            </div>

            {/* Sparkline wave */}
            <div className="w-full h-4 mt-1 overflow-hidden opacity-80">
              <svg className="w-full h-full" viewBox="0 0 60 15" fill="none">
                <path d="M0 10 C12 6, 20 14, 32 5 C40 -2, 48 11, 60 8" stroke="#BC6C25" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* SECTION 2: MAP QUICK MEASURES (MASSNAHMEN) */}
        <div className="md:col-span-3 flex flex-col justify-between border-r border-white/5 pr-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-white/60 uppercase block mb-2">
              🔧 MASSNAHMEN (BAUWERK)
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {measuresList.map(measure => {
                const isSelected = selectedBuilding?.id === measure.id;
                return (
                  <button
                    key={measure.id}
                    onClick={() => {
                      if (isDemolishMode) onDemolishModeToggle();
                      onSelectBuilding(isSelected ? null : measure);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#4A7A3A] text-white border-transparent shadow-[#4A7A3A]/20'
                        : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-xs shrink-0">{measure.id === 'fischpass' ? '🐟' : measure.id === 'biber_station' ? '🦫' : measure.id === 'ufer_entfesselung' ? '🌿' : '🏠'}</span>
                      <span className="truncate leading-none">{measure.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={onDemolishModeToggle}
            className={`mt-2 py-1 px-2.5 rounded-lg text-center text-[10.5px] font-bold transition-all border duration-200 cursor-pointer ${
              isDemolishMode
                ? 'bg-amber-850/80 text-white border-transparent'
                : 'bg-white/5 text-white/50 border-white/5 hover:border-amber-700/50 hover:text-white/80'
            }`}
          >
            {isDemolishMode ? 'Rückbau aktiv' : 'Rückbau-Tool starten'}
          </button>
        </div>

        {/* SECTION 3: MONITORING RIVER LEVEL */}
        <div className="md:col-span-2 flex flex-col justify-between border-r border-white/5 pr-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-white/60 uppercase block mb-2.5">
              💧 MONITORING PEGLING
            </span>
            
            {/* Horizontal or vertical tiny bar display */}
            <div className="flex items-end justify-between h-20 px-1 border-b border-white/10 pb-1">
              {mockWaterLevels.map((lvl, index) => {
                // MAX height is 220cm of water. Cap at 100%
                const barHeightPercent = Math.max(15, Math.min(100, Math.round((lvl.value / 200) * 100)));
                const isCurrent = index === mockWaterLevels.length - 1;
                return (
                  <div key={index} className="flex flex-col items-center gap-1 group relative flex-grow mx-0.5">
                    
                    {/* Hover readout info box */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 bg-[#ECEDEF] text-slate-800 text-[9px] font-bold px-1 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-55 whitespace-nowrap">
                      Round {lvl.roundIdx}: {lvl.value} cm
                    </div>

                    <div className="w-3.5 bg-white/10 rounded-t h-20 flex items-end">
                      <div
                        className={`w-full rounded-t transition-all duration-500 ${
                          isCurrent ? 'bg-[#7FA8B5]' : lvl.value > 130 ? 'bg-[#2A6F7E]' : 'bg-[#4A7A3A]/60'
                        }`}
                        style={{ height: `${barHeightPercent}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-mono text-white/40 group-hover:text-white/80">
                      R{lvl.roundIdx}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[9px] text-[#7FA8B5] font-mono text-center mb-1">
            Status: Pegel Rur stabil in Sektor Düren ({mockWaterLevels[mockWaterLevels.length - 1].value}cm)
          </div>
        </div>

        {/* SECTION 4: ÖKOLOGISCHE INDIZES (DYNAMIC SPIDER WEB RADAR CHART) */}
        <div className="md:col-span-2 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono font-bold tracking-widest text-white/60 uppercase text-center block mb-1">
            🕸️ ÖKOLOGISCHE INDIZES
          </span>

          <div className="relative w-28 h-28 flex items-center justify-center">
            
            {/* SVG Star Plot / Radar Chart */}
            <svg className="w-full h-full" viewBox="0 0 110 110">
              
              {/* Spider outline grid lines (Max outer, inside, center) */}
              {/* Radius 38, center 55, 55 */}
              {/* Web line 1 - 100% */}
              <polygon points="55,17 91.1,43.2 77.3,85.8 32.7,85.8 18.9,43.2" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {/* Web line 2 - 66% */}
              <polygon points="55,29.7 79.1,47.1 69.9,75.5 40.1,75.5 30.9,47.1" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              {/* Web line 3 - 33% */}
              <polygon points="55,42.3 67.1,51.1 62.5,65.3 47.5,65.3 42.9,51.1" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

              {/* Spider radial axis lines */}
              <line x1="55" y1="55" x2="55" y2="17" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
              <line x1="55" y1="55" x2="91.1" y2="43.2" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
              <line x1="55" y1="55" x2="77.3" y2="85.8" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
              <line x1="55" y1="55" x2="32.7" y2="85.8" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
              <line x1="55" y1="55" x2="18.9" y2="43.2" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />

              {/* DYNAMIC POLYGON PLUGGED BY Math */}
              <polygon
                points={radarPolygonPoints}
                fill="rgba(127, 168, 181, 0.35)"
                stroke="#7FA8B5"
                strokeWidth="1.8"
                strokeLinejoin="round"
                className="transition-all duration-700"
              />

              {/* Vertex vertices markers */}
              {radarPolygonPoints.split(' ').map((point, index) => {
                const [px, py] = point.split(',');
                return (
                  <circle
                    key={index}
                    cx={px}
                    cy={py}
                    r="2.5"
                    fill="#ECEDEF"
                    stroke="#2A6F7E"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Micro text overlay for vertices labels */}
              <text x="55" y="13" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="7" fontWeight="bold">KLIMA</text>
              <text x="94" y="44" textAnchor="start" fill="rgba(255,255,255,0.6)" fontSize="7" fontWeight="bold">WASSER</text>
              <text x="79" y="93" textAnchor="start" fill="rgba(255,255,255,0.6)" fontSize="7" fontWeight="bold">BODEN</text>
              <text x="31" y="93" textAnchor="end" fill="rgba(255,255,255,0.6)" fontSize="7" fontWeight="bold">LANDSCH.</text>
              <text x="16" y="44" textAnchor="end" fill="rgba(255,255,255,0.6)" fontSize="7" fontWeight="bold">BIO</text>

            </svg>
          </div>
          <div className="text-[8px] font-mono text-white/40 mt-1">
            Radar-Indizes aktualisiert
          </div>
        </div>

      </div>

    </div>
  );
};
