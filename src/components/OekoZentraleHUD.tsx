import React, { useMemo } from 'react';
import { GameStats, TileData, BuildingType, StakeholderQuest, ResearchNode, ActionCard } from '../types';
import { BUILDIONS_CATALOG } from '../gameData';
import { Award, Droplets, ShieldAlert, Sparkles, Check, Zap, Cpu, Activity, ShieldCheck, TrendingUp, Users } from 'lucide-react';

interface OekoZentraleHUDProps {
  stats: GameStats;
  grid: TileData[][];
  selectedBuilding: BuildingType | null;
  onSelectBuilding: (b: BuildingType | null) => void;
  isDemolishMode: boolean;
  onDemolishModeToggle: () => void;
  invasiveThreatEnabled: boolean;
  energyChallengeEnabled: boolean;
  onUpdateStats?: (updater: (prev: GameStats) => GameStats) => void;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error' | 'event') => void;
  quests: StakeholderQuest[];
  checkQuestRequirements?: (q: StakeholderQuest) => boolean;
  completeStakeholderQuest?: (id: string) => void;
  researchTree: ResearchNode[];
  selectedTileInfo?: { x: number, y: number, building: BuildingType, tile: TileData } | null;
  cards?: ActionCard[];
  maxActionsPerRound?: number;
  actionsUsed?: number;
}

export const OekoZentraleHUD: React.FC<OekoZentraleHUDProps> = ({
  stats,
  grid,
  selectedBuilding,
  onSelectBuilding,
  isDemolishMode,
  onDemolishModeToggle,
  invasiveThreatEnabled,
  energyChallengeEnabled,
  onUpdateStats,
  addLog,
  quests,
  checkQuestRequirements,
  completeStakeholderQuest,
  researchTree,
  selectedTileInfo,
  cards,
  maxActionsPerRound,
  actionsUsed,
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

  // 4. BIOLOGISCHE SICHERHEIT (BIO-SECURITY) PERCENT
  const [biosecurityPercent, biosecurityLabel, biosecurityColor] = useMemo(() => {
    if (!invasiveThreatEnabled) {
      return [100, 'INAKTIV', 'stroke-stone-400 text-stone-400'];
    }
    const pct = stats.biosecurity !== undefined ? stats.biosecurity : 100;
    let label = 'STABIL';
    let color = 'stroke-[#5A7247] text-[#5A7247]';
    if (pct <= 30) {
      label = 'BEDROHT';
      color = 'stroke-rose-600 text-rose-600';
    } else if (pct <= 60) {
      label = 'GESTÖRT';
      color = 'stroke-[#BC6C25] text-[#BC6C25]';
    } else if (pct < 100) {
      label = 'STABIL';
      color = 'stroke-[#2A6F7E] text-[#2A6F7E]';
    } else {
      label = 'EXZELLENT';
      color = 'stroke-[#4A7A3A] text-[#4A7A3A]';
    }
    return [pct, label, color];
  }, [stats.biosecurity, invasiveThreatEnabled]);

  // 5. ERNEUBARE ENERGIEN (RENEWABLE ENERGY) PERCENT
  const [energyPercent, energyLabel, energyColor] = useMemo(() => {
    if (!energyChallengeEnabled) {
      return [100, 'INAKTIV', 'stroke-stone-400 text-stone-400'];
    }
    const pct = stats.renewableEnergy !== undefined ? stats.renewableEnergy : 25;
    let label = 'STABIL';
    let color = 'stroke-[#2A6F7E] text-[#2A6F7E]';
    if (pct < 35) {
      label = 'KRITISCH';
      color = 'stroke-rose-600 text-rose-600';
    } else if (pct >= 75) {
      label = 'VORBILDLICH';
      color = 'stroke-[#4A7A3A] text-[#4A7A3A]';
    } else if (pct >= 50) {
      label = 'STABIL';
      color = 'stroke-[#5A7247] text-[#5A7247]';
    } else {
      label = 'MÄSSIG';
      color = 'stroke-[#BC6C25] text-[#BC6C25]';
    }
    return [pct, label, color];
  }, [stats.renewableEnergy, energyChallengeEnabled]);

  // 6. BÜRGERAKZEPTANZ / SOZIAL-ÖKOLOGISCHE METRIK
  const [acceptancePercent, acceptanceLabel, acceptanceColor] = useMemo(() => {
    const pct = stats.citizenAcceptance !== undefined ? stats.citizenAcceptance : 80;
    let label = 'STABIL';
    let color = 'stroke-[#2A6F7E] text-[#2A6F7E]';
    if (stats.year === 2026) {
      label = 'SCHONZEIT';
      color = 'stroke-[#7FA8B5] text-[#7FA8B5]';
    } else if (pct < 40) {
      label = 'PROTESTE';
      color = 'stroke-rose-600 text-rose-600';
    } else if (pct < 65) {
      label = 'NIMBY-TREND';
      color = 'stroke-orange-500 text-orange-500';
    } else if (pct >= 85) {
      label = 'BEGEISTERT';
      color = 'stroke-[#4A7A3A] text-[#4A7A3A]';
    } else {
      label = 'STABIL';
      color = 'stroke-[#5A7247] text-[#5A7247]';
    }
    return [pct, label, color];
  }, [stats.citizenAcceptance, stats.year]);

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

  // Read ÖKO-Zentrale status parameters
  const hqLevel = stats.oekoZentraleLevel !== undefined ? stats.oekoZentraleLevel : 1;
  const hqMode = stats.oekoZentraleMode !== undefined ? stats.oekoZentraleMode : 'STANDARD';
  const ewsActive = stats.earlyWarningSystemActive !== undefined ? stats.earlyWarningSystemActive : false;

  const handleUpgradeHQ = () => {
    if (!onUpdateStats) return;
    const nextLevel = hqLevel + 1;
    let costBudget = 0;
    let costSci = 0;
    let title = "";

    if (nextLevel === 2) {
      costBudget = 8;
      costSci = 2;
      title = "Stufe II: Vernetzte Umweltstation";
    } else if (nextLevel === 3) {
      costBudget = 14;
      costSci = 4;
      title = "Stufe III: Autonome Rurtal-Klimawarte";
    } else {
      return;
    }

    if (stats.budget < costBudget || stats.researchPoints < costSci) {
      if (addLog) addLog(`❌ UPGRADE FEHLGESCHLAGEN: Für "${title}" werden ${costBudget} € und ${costSci} 🧪 benötigt!`, 'error');
      return;
    }

    onUpdateStats(prev => ({
      ...prev,
      budget: prev.budget - costBudget,
      researchPoints: prev.researchPoints - costSci,
      oekoZentraleLevel: nextLevel
    }));

    if (addLog) addLog(`🎉 ÖKO-ZENTRALE REBOOT: Sektor Düren meldet erfolgreiches Upgrade auf ${title}! Neue passive Überwachungseffekte aktiv.`, 'success');
  };

  const handleToggleMode = (mode: 'STANDARD' | 'WATER' | 'FAUNA' | 'RESILIENCE') => {
    if (!onUpdateStats) return;
    onUpdateStats(prev => ({
      ...prev,
      oekoZentraleMode: mode
    }));
    const label = mode === 'STANDARD' ? 'Standard-Messung' : mode === 'WATER' ? 'Aquatische Sanierung' : mode === 'FAUNA' ? 'Ranger-Artenschutz' : 'Klimaresilienz-Stab';
    if (addLog) addLog(`⚙️ SYSTEM-FOKUS GEWECHSELT: Die Öko-Zentrale operiert nun im Modus: "${label}".`, 'info');
  };

  const handleBuyEWS = () => {
    if (!onUpdateStats) return;
    if (ewsActive) return;
    const costBudget = 5;
    const costSci = 3;
    if (stats.budget < costBudget || stats.researchPoints < costSci) {
      if (addLog) addLog(`❌ UPGRADE FEHLGESCHLAGEN: Für das Frühwarn- & Schadensabwehrsystem werden ${costBudget} € und ${costSci} 🧪 benötigt!`, 'error');
      return;
    }

    onUpdateStats(prev => ({
      ...prev,
      budget: prev.budget - costBudget,
      researchPoints: prev.researchPoints - costSci,
      earlyWarningSystemActive: true
    }));

    if (addLog) addLog('📡 MODULE INTEGRATION ONLINE: Das Frühwarnsystem registriert Rurpegel und Wettermuster. Katastrophenschäden dauerhaft halbiert.', 'success');
  };

  const handleCreateCooperatives = () => {
    if (!onUpdateStats) return;
    if (stats.cooperativesActive) return;
    const costBudget = 12;
    const costSci = 4;
    if (stats.budget < costBudget || stats.researchPoints < costSci) {
      if (addLog) addLog(`❌ UPGRADE FEHLGESCHLAGEN: Für die Gründung der Bürgergenossenschaft werden ${costBudget} € und ${costSci} 🧪 benötigt!`, 'error');
      return;
    }

    onUpdateStats(prev => ({
      ...prev,
      budget: prev.budget - costBudget,
      researchPoints: prev.researchPoints - costSci,
      cooperativesActive: true,
      citizenAcceptance: Math.min(100, (prev.citizenAcceptance !== undefined ? prev.citizenAcceptance : 80) + 40)
    }));

    if (addLog) addLog('👥 BÜRGER-ENERGIEGENOSSENSCHAFT ETRANSMISSION EG GEGRÜNDET: Die Dürener Bürger sind am Ertrag der Solarparks und Windkraftwerke beteiligt! Akzeptanz steigt schlagartig um +40%, und NIMBY-Abzüge bei künftigen Bauten sind passé!', 'success');
  };

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

      {/* CO2 FOOTPRINT DYNAMIC DASHBOARD BLOCK */}
      <div className="bg-[#2D3136] rounded-xl p-4 mb-5 border border-[#3E454E] flex flex-col lg:flex-row items-stretch justify-between gap-4">
        {/* Left column: Footprint gauge and status */}
        <div className="flex items-center gap-4 min-w-[280px]">
          <div className="relative w-14 h-14 shrink-0 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
            <span className="text-2xl filter drop-shadow-sm">🌱</span>
            {/* Pulsing indicator ring */}
            <span className={`absolute inset-0 rounded-full border-2 animate-ping opacity-25 ${
              (stats.co2Footprint ?? 190.0) <= 60.0 ? 'border-emerald-500' :
              (stats.co2Footprint ?? 190.0) <= 120.0 ? 'border-green-500' :
              (stats.co2Footprint ?? 190.0) <= 180.0 ? 'border-amber-500' : 'border-rose-500'
            }`} style={{ animationDuration: '3s' }} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-white/50 block uppercase leading-none">
                CO₂-BILANZ RURTAL
              </span>
              <span className={`text-[8px] font-mono leading-none px-1.5 py-0.5 rounded font-black uppercase ${
                (stats.co2Footprint ?? 190.0) <= 60.0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                (stats.co2Footprint ?? 190.0) <= 120.0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                (stats.co2Footprint ?? 190.0) <= 180.0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {(stats.co2Footprint ?? 190.0) <= 60.0 ? 'Klimaneutral-Ziel' :
                 (stats.co2Footprint ?? 190.0) <= 120.0 ? 'Nachhaltig' :
                 (stats.co2Footprint ?? 190.0) <= 180.0 ? 'Erhöht' : 'Kritisch'}
              </span>
            </div>
            
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black font-mono tracking-tight text-white leading-none">
                {(stats.co2Footprint ?? 190.0).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-white/60 font-mono">t CO₂-Äq / Runde</span>
            </div>
            
            <p className="text-[10px] text-white/70 leading-relaxed font-sans mt-1 max-w-sm">
              Geringere Werte schützen das Rurtal vor Extremwetter. Erneuerbare Anlagen, Auwald & Klärwerk-Upgrades senken den Ausstoß!
            </p>
          </div>
        </div>

        {/* Right column: Dynamic factor indicators breakdown */}
        <div className="flex-grow bg-black/15 p-3 rounded-xl border border-white/5 flex flex-col gap-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[10px] items-center">
            
            {/* Factor 1: Schoellershammer Paper Factory mode */}
            <div className="space-y-1">
              <span className="text-white/40 block font-mono text-[8px] uppercase tracking-wider">🏭 Industrie (Schoellershammer)</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  stats.paperFactoryMode === 'PRODUCTION' ? 'bg-rose-500' :
                  stats.paperFactoryMode === 'RETROFITTING' ? 'bg-amber-500' :
                  stats.paperFactoryMode === 'SHUTDOWN' ? 'bg-stone-500' : 'bg-emerald-500'
                }`} />
                <div className="font-bold text-white/95 truncate">
                  {stats.paperFactoryMode === 'PRODUCTION' ? 'Vollbetrieb (+40t)' :
                   stats.paperFactoryMode === 'RETROFITTING' ? 'Filter-Technik (+12t)' :
                   stats.paperFactoryMode === 'SHUTDOWN' ? 'Stillgelegt (0t)' : 'Rückbau (-10t)'}
                </div>
              </div>
            </div>

            {/* Factor 2: Renewables Decking */}
            <div className="space-y-1 sm:border-l sm:border-white/5 sm:pl-2.5">
              <span className="text-white/40 block font-mono text-[8px] uppercase tracking-wider font-semibold">⚡ Erneuerbare Energie</span>
              <div className="font-bold text-emerald-400">
                {(() => {
                  let wind = 0, solar = 0, hydro = 0;
                  grid.forEach(r => r.forEach(t => {
                    if (t.buildingId === 'windkraft') wind++;
                    if (t.buildingId === 'solarpark') solar++;
                    if (t.buildingId === 'wasserkraft') hydro++;
                  }));
                  const totalRe = (wind * 18) + (solar * 12) + (hydro * 6);
                  return totalRe > 0 ? `-${totalRe}t (${wind}W / ${solar}S / ${hydro}H)` : '0t (Inaktiv)';
                })()}
              </div>
            </div>

            {/* Factor 3: Infrastructure (Klärwerk & Rurtalbahn) */}
            <div className="space-y-1 sm:border-l sm:border-white/5 sm:pl-2.5">
              <span className="text-white/40 block font-mono text-[8px] uppercase tracking-wider">💧 Infrastruktur & Bahn</span>
              <div className="font-bold text-emerald-400">
                {(() => {
                  let klaer = 0, bahn = 0;
                  grid.forEach(r => r.forEach(t => {
                    if (t.buildingId === 'klaerwerk_upgrade') klaer++;
                    if (t.buildingId === 'rurtalbahn_halt') bahn++;
                  }));
                  const totalInfra = (klaer * 22) + (bahn * 8);
                  return totalInfra > 0 ? `-${totalInfra}t (${klaer} K-Upgr, ${bahn} Gleis)` : '0t (Keine Upgrades)';
                })()}
              </div>
            </div>

            {/* Factor 4: Carbon Sinks (Auwald forests) & Agriculture */}
            <div className="space-y-1 sm:border-l sm:border-white/5 sm:pl-2.5">
              <span className="text-white/40 block font-mono text-[8px] uppercase tracking-wider">🌳 Senken (Auwald) & Farm</span>
              <div className="font-bold text-[#D4E0C1] truncate">
                {(() => {
                  let auwald = 0, farm = 0;
                  grid.forEach(r => r.forEach(t => {
                    if (t.terrain === 'Auwald') auwald++;
                    if (t.buildingId === 'intensiv_farm') farm++;
                  }));
                  const forests = auwald * 4;
                  const farms = farm * 15;
                  return `Auwald: -${forests}t${farms > 0 ? ` | Farmen: +${farms}t` : ''}`;
                })()}
              </div>
            </div>

          </div>

          {/* Active Cooperation & Research CO2 Buffers Line */}
          {(() => {
            const zerkallDone = researchTree.some(r => r.id === 'zerkall_faserzentrum' && r.unlocked);
            const rurQuestDone = quests.some(q => q.id === 'quest_rurtalbahn' && q.status === 'completed');
            const schoellerQuestDone = quests.some(q => q.id === 'quest_schoellershammer' && q.status === 'completed');
            
            if (!zerkallDone && !rurQuestDone && !schoellerQuestDone) return null;
            
            return (
              <div className="border-t border-white/5 pt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-[#A6E22E] font-mono">
                <span className="text-white/40 uppercase tracking-wider font-bold">Aktivierte CO₂-Minderungen:</span>
                {zerkallDone && (
                  <span className="flex items-center gap-1">🌱 Faserzentrum Zerkall (-15t CO₂)</span>
                )}
                {schoellerQuestDone && (
                  <span className="flex items-center gap-1">🤝 GreenPulse Schoellershammer (-15t CO₂)</span>
                )}
                {rurQuestDone && (
                  <span className="flex items-center gap-1">🚇 Rurtalbahn-Allianz (-10t CO₂)</span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* STAKEHOLDER-ALLIANZEN & COOPERATION QUESTS BLOCK */}
      <div className="bg-[#2D3136] rounded-xl p-4 mb-6 border border-[#3E454E]">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
          <Users className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] font-mono font-black tracking-widest text-[#7FA8B5] uppercase block leading-none">
              TRANSFORMATION IM DIALOG &bull; KOOPERATIONEN
            </span>
            <h3 className="text-sm font-black text-white mt-1">
              Industrie-Allianzen &amp; Public-Private-Partnerships (PPP)
            </h3>
          </div>
        </div>

        <p className="text-xs text-white/75 mb-4 max-w-4xl leading-relaxed">
          Große ökologische Sprünge lassen sich nicht im Alleingang realisieren. Gewinne das Vertrauen von Industrie, Wissenschaft und Kommunen, indem du ihre Kriterien erfüllst, und besiegele strategische Partnerschaften für nachhaltigen Sektor-Vorteil!
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {quests.map((q) => {
            const isCompleted = q.status === 'completed';
            
            // Evaluate requirements dynamically
            const reqs = q.requirements;
            const hasResearchPoints = reqs.researchPoints === undefined || stats.researchPoints >= reqs.researchPoints;
            const hasBudget = reqs.budget === undefined || stats.budget >= reqs.budget;
            
            let hasBuilding = true;
            if (reqs.buildingId) {
              hasBuilding = grid.flat().some(t => t.buildingId === reqs.buildingId);
            }
            
            const hasPaperMode = reqs.paperFactoryMode === undefined || stats.paperFactoryMode === reqs.paperFactoryMode;
            
            // Calculate progress percentages per requirement (0 to 100)
            const rpPercent = reqs.researchPoints !== undefined && reqs.researchPoints > 0
              ? Math.min(100, Math.round((stats.researchPoints / reqs.researchPoints) * 100))
              : 100;

            const budgetPercent = reqs.budget !== undefined && reqs.budget > 0
              ? Math.min(100, Math.round((stats.budget / reqs.budget) * 100))
              : 100;

            const buildingPercent = hasBuilding ? 100 : 0;
            const paperModePercent = hasPaperMode ? 100 : 0;

            // Total requirement tracker to count completion rate
            const reqListCount = [
              reqs.researchPoints !== undefined,
              reqs.budget !== undefined && reqs.budget > 0,
              reqs.buildingId !== undefined,
              reqs.paperFactoryMode !== undefined
            ].filter(Boolean).length;

            const reqListMet = [
              reqs.researchPoints !== undefined && hasResearchPoints,
              reqs.budget !== undefined && reqs.budget > 0 && hasBudget,
              reqs.buildingId !== undefined && hasBuilding,
              reqs.paperFactoryMode !== undefined && hasPaperMode
            ].filter(Boolean).length;

            const overallPercent = reqListCount > 0 ? Math.round((reqListMet / reqListCount) * 100) : 100;
            
            let hasResearchNode = true;
            const areAllRequirementsMet = checkQuestRequirements ? checkQuestRequirements(q) : (hasResearchPoints && hasBudget && hasBuilding && hasPaperMode);

            return (
              <div 
                key={q.id} 
                className={`rounded-xl p-4 flex flex-col justify-between border transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-950/25 border-emerald-500/30 ring-1 ring-emerald-500/10' 
                    : areAllRequirementsMet 
                      ? 'bg-white/5 border-emerald-400/40 shadow-md shadow-emerald-500/5' 
                      : 'bg-white/[0.02] border-white/5'
                }`}
              >
                {/* Header: Stakeholder */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                      {q.avatar}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-mono text-[8.5px] text-emerald-400 font-extrabold uppercase tracking-wide leading-none select-none">
                        {q.stakeholderTitle}
                      </h4>
                      <span className="text-xs font-black text-white block truncate leading-tight mt-0.5">
                        {q.stakeholder}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md border ${
                      isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : overallPercent === 100 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                          : 'bg-white/5 text-white/60 border-white/10'
                    }`}>
                      {isCompleted ? '100% Bereit' : `${overallPercent}% Gelöst`}
                    </span>
                  </div>
                </div>

                {/* Speech Bubble */}
                <div className="bg-black/25 rounded-lg p-2.5 text-[10.5px] text-white/80 leading-relaxed font-sans mb-3 border border-white/5 relative">
                  <span className="absolute -top-1.5 left-4 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-black/20" />
                  &bdquo;{q.message}&ldquo;
                </div>

                {/* Overall Alliance Progress Visual Indicator */}
                {!isCompleted && (
                  <div className="mb-3 px-1">
                    <div className="flex justify-between items-center text-[8.5px] font-mono text-white/40 mb-1">
                      <span>BÜNDNIS-STATUS:</span>
                      <span className="font-black text-white/70">{reqListMet} von {reqListCount} erfüllt</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" 
                        style={{ width: `${overallPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Requirements Checklist with individual visual progress bars */}
                <div className="space-y-2.5 mb-3 bg-black/15 p-2.5 rounded-lg border border-white/5">
                  <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest font-extrabold block">AUFLAGEN FÜR BÜNDNIS:</span>
                  
                  {/* Research Points */}
                  {reqs.researchPoints !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/70 font-mono flex items-center gap-1">🧪 Forschungspunkte:</span>
                        <span className={`font-bold font-mono text-[9px] ${hasResearchPoints ? 'text-emerald-400 font-extrabold' : 'text-rose-400'}`}>
                          {stats.researchPoints} / {reqs.researchPoints} ({rpPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full duration-500 transition-all ${hasResearchPoints ? 'bg-emerald-400' : 'bg-sky-500'}`} 
                          style={{ width: `${rpPercent}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Budget */}
                  {reqs.budget !== undefined && reqs.budget > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/70 font-mono flex items-center gap-1">🪙 Budget-Zuschuss:</span>
                        <span className={`font-bold font-mono text-[9px] ${hasBudget ? 'text-emerald-400 font-extrabold' : 'text-rose-400'}`}>
                          {stats.budget} € / {reqs.budget} € ({budgetPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full duration-500 transition-all ${hasBudget ? 'bg-emerald-400' : 'bg-[#BC6C25]'}`} 
                          style={{ width: `${budgetPercent}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Building */}
                  {reqs.buildingId && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/70 font-mono flex items-center gap-1">🏗️ Errichtetes Bauwerk:</span>
                        <span className={`font-bold text-[9px] ${hasBuilding ? 'text-emerald-400 font-extrabold' : 'text-rose-450'}`}>
                          {reqs.buildingId === 'klaerwerk_upgrade' ? 'Klärwerk-Upgrade' : 'Rurtalbahn-Halt'} {hasBuilding ? '✓ (100%)' : '✗ (0%)'}
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full duration-500 transition-all ${hasBuilding ? 'bg-emerald-400' : 'bg-rose-500/20'}`} 
                          style={{ width: `${buildingPercent}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Paper Production Mode */}
                  {reqs.paperFactoryMode && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/70 font-mono flex items-center gap-1">🏭 Fabrik-Betrieb:</span>
                        <span className={`font-bold text-[9px] ${hasPaperMode ? 'text-emerald-400 font-extrabold' : 'text-rose-450'}`}>
                          {reqs.paperFactoryMode} {hasPaperMode ? '✓ (100%)' : '✗ (0%)'}
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full duration-500 transition-all ${hasPaperMode ? 'bg-emerald-400' : 'bg-rose-500/20'}`} 
                          style={{ width: `${paperModePercent}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* General requirements description */}
                  <p className="text-[9px] text-[#A69E8F] mt-1.5 font-sans italic leading-tight">
                    Vorgabe: {q.requirementsText}
                  </p>
                </div>

                {/* Rewards Panel */}
                <div className="bg-[#1F2327] p-2.5 rounded-lg mb-3.5 border border-white/5 text-[10px]">
                  <span className="text-[8px] font-mono text-amber-400 uppercase tracking-widest font-extrabold block mb-1">PROJEKT-ERFOLG &amp; EFFEKTE:</span>
                  <p className="text-white/90 leading-tight">{q.rewardText}</p>
                </div>

                {/* Bottom Trigger */}
                <div>
                  {isCompleted ? (
                    <div className="w-full py-2 rounded-lg bg-emerald-600/25 border border-emerald-500/50 text-emerald-300 text-center font-bold text-[10.5px] uppercase tracking-wide flex items-center justify-center gap-1.5 select-none font-mono">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Allianz geschlossen ✓
                    </div>
                  ) : (
                    <button
                      onClick={() => completeStakeholderQuest && completeStakeholderQuest(q.id)}
                      disabled={!areAllRequirementsMet}
                      className={`w-full py-2.5 rounded-lg text-center font-extrabold text-[10.5px] uppercase tracking-wide font-mono transition-all duration-200 cursor-pointer ${
                        areAllRequirementsMet 
                          ? 'bg-brand-green hover:bg-brand-green/90 text-white shadow-md shadow-emerald-500/20 active:scale-95' 
                          : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      {areAllRequirementsMet ? '🤝 BÜNDNIS BEGIEGELN' : '🔒 AUFLAGEN ERFÜLLEN'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* SECTION 1: ECOLOGICAL PROGRESS CIRCLES */}
        <div className="md:col-span-6 grid grid-cols-3 sm:grid-cols-6 gap-2 border-r border-white/5 pr-3">
          
          {/* Circular item 1: WASSERQUALITÄT */}
          <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-between text-center border border-white/5 relative group hover:bg-white/10 transition-colors">
            <span className="text-[9px] font-black tracking-wider text-white/70 block uppercase leading-tight">
              Wasserqualität
            </span>
            
            <div className="relative w-16 h-16 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-white/10" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${wasserColor} transition-all duration-500`} strokeDasharray={`${wasserPercent}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black tracking-tight leading-none">{wasserPercent}</span>
                <span className="text-[6.5px] font-bold text-white/60 leading-none mt-0.5">{wasserLabel}</span>
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
          <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-between text-center border border-white/5 relative group hover:bg-white/10 transition-colors">
            <span className="text-[9px] font-black tracking-wider text-white/70 block uppercase leading-tight">
              Biodiversität
            </span>
            
            <div className="relative w-16 h-16 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-white/10" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${bioColor} transition-all duration-500`} strokeDasharray={`${bioPercent}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black tracking-tight leading-none">{bioPercent}%</span>
                <span className="text-[6.5px] font-bold text-white/60 leading-none mt-0.5">{bioLabel}</span>
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
          <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-between text-center border border-white/5 relative group hover:bg-white/10 transition-colors">
            <span className="text-[9px] font-black tracking-wider text-white/70 block uppercase leading-tight">
              Hochwasser-Risiko
            </span>
            
            <div className="relative w-16 h-16 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-white/10" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${floodColor} transition-all duration-500`} strokeDasharray={`${floodPercent}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black tracking-tight leading-none">{floodPercent}%</span>
                <span className="text-[6.5px] font-bold text-white/60 leading-none mt-0.5">{floodLabel}</span>
              </div>
            </div>

            {/* Sparkline wave */}
            <div className="w-full h-4 mt-1 overflow-hidden opacity-80">
              <svg className="w-full h-full" viewBox="0 0 60 15" fill="none">
                <path d="M0 10 C12 6, 20 14, 32 5 C40 -2, 48 11, 60 8" stroke="#BC6C25" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Circular item 4: BIO-SICHERHEIT */}
          <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-between text-center border border-white/5 relative group hover:bg-white/10 transition-colors">
            <span className="text-[9px] font-black tracking-wider text-white/70 block uppercase leading-tight" title="Biologische Sicherheit (Invasionsresistenz)">
              Bio-Sicherheit
            </span>
            
            <div className="relative w-16 h-16 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-white/10" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${biosecurityColor} transition-all duration-500`} strokeDasharray={`${invasiveThreatEnabled ? biosecurityPercent : 0}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black tracking-tight leading-none">{invasiveThreatEnabled ? `${biosecurityPercent}%` : 'OFF'}</span>
                <span className="text-[6.5px] font-bold text-white/60 leading-none mt-0.5">{biosecurityLabel}</span>
              </div>
            </div>

            {/* Sparkline wave */}
            <div className="w-full h-4 mt-1 overflow-hidden opacity-80">
              <svg className="w-full h-full" viewBox="0 0 60 15" fill="none">
                <path d="M0 5 L10 12 L20 2 L33 11 L45 4 L60 11" stroke={!invasiveThreatEnabled ? "#78716c" : biosecurityPercent <= 30 ? "#e11d48" : biosecurityPercent <= 60 ? "#D4A373" : "#5A7247"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Circular item 5: GRÜNE ENERGIE */}
          <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-between text-center border border-white/5 relative group hover:bg-white/10 transition-colors">
            <span className="text-[9px] font-black tracking-wider text-white/70 block uppercase leading-tight" title="Anteil erneuerbarer Stromdeckung der Dürener Industrie">
              Grüne Energie
            </span>
            
            <div className="relative w-16 h-16 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-white/10" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${energyColor} transition-all duration-500`} strokeDasharray={`${energyChallengeEnabled ? energyPercent : 100}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black tracking-tight leading-none">{energyChallengeEnabled ? `${energyPercent}%` : 'OFF'}</span>
                <span className="text-[6.5px] font-bold text-white/60 leading-none mt-0.5">{energyLabel}</span>
              </div>
            </div>

            {/* Sparkline wave */}
            <div className="w-full h-4 mt-1 overflow-hidden opacity-80">
              <svg className="w-full h-full" viewBox="0 0 60 15" fill="none">
                <path d="M0 12 L12 4 L24 10 L36 3 L48 8 L60 2" stroke={!energyChallengeEnabled ? "#78716c" : energyPercent < 35 ? "#e11d48" : energyPercent >= 75 ? "#5A7247" : "#BC6C25"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Circular item 6: BÜRGERAKZEPTANZ */}
          <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-between text-center border border-white/5 relative group hover:bg-white/10 transition-colors" title="Bürger-Zufriedenheit / Akzeptanz der grünen Wende">
            <span className="text-[9px] font-black tracking-wider text-white/70 block uppercase leading-tight">
              Bürgerakzeptanz
            </span>
            
            <div className="relative w-16 h-16 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="stroke-white/10" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${acceptanceColor} transition-all duration-500`} strokeDasharray={`${acceptancePercent}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black tracking-tight leading-none">{acceptancePercent}%</span>
                <span className="text-[6.5px] font-bold text-white/60 leading-none mt-0.5">{acceptanceLabel}</span>
              </div>
            </div>

            {/* Sparkline wave */}
            <div className="w-full h-4 mt-1 overflow-hidden opacity-80">
              <svg className="w-full h-full" viewBox="0 0 60 15" fill="none">
                <path d="M0 8 Q15 2, 30 8 T60 8" stroke={stats.cooperativesActive ? "#5A7247" : acceptancePercent < 40 ? "#e11d48" : "#2A6F7E"} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

        </div>

        {/* SECTION 2: MAP QUICK MEASURES (MASSNAHMEN) */}
        <div className="md:col-span-2 flex flex-col justify-between border-r border-white/5 pr-3">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-white/60 uppercase block mb-2">
              🔧 MASSNAHMEN (BAUWERK)
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {measuresList.map(measure => {
                const isSelected = selectedBuilding?.id === measure.id;

                let isSofortBereit = false;
                let buildStrength = 1;
                let constructRebate = 0;
                if (cards) {
                  const buildCard = cards.find(c => c.type === 'BUILD');
                  buildStrength = buildCard ? cards.indexOf(buildCard) + 1 : 1;
                  if (buildStrength === 3 || buildStrength === 4) constructRebate = 1;
                  else if (buildStrength === 5) constructRebate = 2;
                }

                const hasRurtalbahnStationNear = false; // default false for quick hud
                const discountValue = constructRebate + (hasRurtalbahnStationNear ? 1 : 0);
                let acceptanceSurcharge = 0;
                if (stats.year > 2026 && stats.citizenAcceptance < 40) {
                  acceptanceSurcharge = 2;
                }

                const finalCost = Math.max(1, measure.cost - discountValue + acceptanceSurcharge);
                const canAfford = stats.budget >= finalCost;

                let costLimit = 4;
                if (buildStrength === 2) costLimit = 6;
                else if (buildStrength === 3) costLimit = 8;
                else if (buildStrength === 4) costLimit = 10;
                else if (buildStrength === 5) costLimit = 100;
                const strengthFits = measure.cost <= costLimit;

                if (selectedTileInfo) {
                  const tile = selectedTileInfo.tile;
                  const tx = selectedTileInfo.x;
                  const ty = selectedTileInfo.y;

                  const hasWaterAdj = (): boolean => {
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

                  const allowedTerrain = measure.allowedTerrains.includes(tile.terrain);
                  const isRiverCheck = !measure.isRiverOnly || tile.terrain === 'Water';
                  const isRiverAdjacentCheck = !measure.isRiverAdjacentOnly || hasWaterAdj();
                  const isEligible = allowedTerrain && isRiverCheck && isRiverAdjacentCheck && !tile.buildingId;
                  
                  const actionsLeft = maxActionsPerRound !== undefined && actionsUsed !== undefined
                    ? Math.max(0, maxActionsPerRound - actionsUsed)
                    : 1;

                  isSofortBereit = isEligible && strengthFits && canAfford && actionsLeft > 0;
                }

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
                        : isSofortBereit
                        ? 'bg-[#4A7A3A]/20 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.25)] animate-pulse'
                        : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-xs shrink-0">{measure.id === 'fischpass' ? '🐟' : measure.id === 'biber_station' ? '🦫' : measure.id === 'ufer_entfesselung' ? '🌿' : '🏠'}</span>
                      <span className="truncate leading-none">{measure.name}</span>
                      {isSofortBereit && !isSelected && (
                        <span className="text-[7.5px] font-extrabold uppercase px-1 py-0.5 rounded bg-emerald-600 text-white leading-none scale-90 tracking-wide animate-pulse">
                          ✨ Bereit
                        </span>
                      )}
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
        <div className="md:col-span-2 flex flex-col justify-between border-r border-white/5 pr-3">
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

      {/* SECTION 5: INTERACTIVE CONTROL PANEL & UPGRADE CENTER */}
      <div className="border-t border-white/10 pt-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#7FA8B5] uppercase">
            ⚡ HQ-ZENTRALEN CONTROL PANEL &amp; INTERAKTIVES UPGRADE-ARTEN-SYSTEM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Column A: HQ-Zentrale Stufe */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#A7C080] uppercase tracking-wider">
                  1. HQ-MODERNISIERUNG
                </span>
                <span className="text-[10px] font-mono select-none px-2 py-0.5 rounded bg-lime-950/40 text-emerald-400 border border-emerald-500/20">
                  Stufe {hqLevel}
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-3">
                Rüste die Öko-Zentrale Düren auf, um neue Drohnensensoren und automatisierte Satelliten-Umweltdiagnostik einzusetzen.
              </p>
              
              {/* Level summary info */}
              <div className="space-y-1.5 text-[10.5px] bg-black/20 p-2 rounded-lg border border-white/5 mb-4 font-mono">
                <div className="flex justify-between">
                  <span className="text-white/50">Stufe I (Basis):</span>
                  <span className="text-white/80 font-medium">Ufer-Patrouillen</span>
                </div>
                <div className={`flex justify-between ${hqLevel >= 2 ? 'text-emerald-400 font-semibold' : 'text-white/30'}`}>
                  <span>Stufe II (Ausbau):</span>
                  <span>Bio-Schutz (+10% Schutz)</span>
                </div>
                <div className={`flex justify-between ${hqLevel >= 3 ? 'text-emerald-400 font-semibold' : 'text-white/30'}`}>
                  <span>Stufe III (Klimawarte):</span>
                  <span>+1 🧪, +2 🌿, -1% Risiko/Rd.</span>
                </div>
              </div>
            </div>

            {hqLevel < 3 ? (
              <button
                onClick={handleUpgradeHQ}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-[#A7C080] hover:bg-[#8da765] text-slate-900 transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01]"
              >
                <span>Upgrade auf Stufe {hqLevel + 1}</span>
                <span className="font-mono text-[9.5px] opacity-85">
                  ({hqLevel === 1 ? '8 € / 2 🧪' : '14 € / 4 🧪'})
                </span>
              </button>
            ) : (
              <div className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-white/5 text-emerald-400 border border-emerald-400/20 text-center select-none flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Rurtal-Klimawarte Stufe III (MAX LEVEL)</span>
              </div>
            )}
          </div>

          {/* Column B: Betriebs-Fokus */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#7FA8B5] uppercase tracking-wider">
                  2. BETRIEBSFOKUS (OPERATIV)
                </span>
                <span className="text-[10px] font-mono select-none px-1.5 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-500/10">
                  Fokus aktiv
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-3">
                Wähle den saisonalen Einsatzbereich deiner Einsatztruppe. Jeder Betriebsmodus steuert gezielte Sanierungsaktivitäten.
              </p>

              {/* Focus mode Buttons */}
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <button
                  onClick={() => handleToggleMode('STANDARD')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                    hqMode === 'STANDARD'
                      ? 'bg-slate-700/60 text-white border-white/30'
                      : 'bg-[#40454c] text-white/60 border-transparent hover:bg-slate-700/30'
                  }`}
                >
                  <span className="text-xs">📊</span>
                  <span className="mt-0.5">Basis-Messung</span>
                  <span className="text-[8px] opacity-70 mt-0.5">Keine Boni/Kosten</span>
                </button>

                <button
                  onClick={() => handleToggleMode('WATER')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                    hqMode === 'WATER'
                      ? 'bg-sky-900 text-sky-200 border-sky-500/40'
                      : 'bg-[#40454c] text-white/60 border-transparent hover:bg-sky-950/20'
                  }`}
                >
                  <span className="text-xs">🌊</span>
                  <span className="mt-0.5">Rursanierung</span>
                  <span className="text-[8px] text-sky-300/80 mt-0.5">-1 € • +0.1 Rurgüte</span>
                </button>

                <button
                  onClick={() => handleToggleMode('FAUNA')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                    hqMode === 'FAUNA'
                      ? 'bg-emerald-900 text-emerald-200 border-emerald-500/40'
                      : 'bg-[#40454c] text-white/60 border-transparent hover:bg-emerald-950/20'
                  }`}
                >
                  <span className="text-xs">🐾</span>
                  <span className="mt-0.5">Artenschutz</span>
                  <span className="text-[8px] text-emerald-300/85 mt-0.5">-1 🧪 • +8% Arten</span>
                </button>

                <button
                  onClick={() => handleToggleMode('RESILIENCE')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                    hqMode === 'RESILIENCE'
                      ? 'bg-amber-900 text-amber-200 border-amber-500/40'
                      : 'bg-[#40454c] text-white/60 border-transparent hover:bg-amber-950/20'
                  }`}
                >
                  <span className="text-xs">🛡️</span>
                  <span className="mt-0.5">Klimaresilienz</span>
                  <span className="text-[8px] text-amber-300/85 mt-0.5">-1 € • -2% Risiko</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column C: Katastrophen-Schutz EWS */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#E6935C] uppercase tracking-wider">
                  3. KATASTROPHEN-SCHUTZ
                </span>
                <span className="text-[10px] font-mono select-none px-1.5 py-0.5 rounded bg-orange-950/40 text-orange-400 border border-orange-500/10">
                  Frühwarnung (EWS)
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-3">
                Integriere ein dichtebezogenes Boden-Sensorennetzwerk und Alarmbojen zur Erkennung kritischer Pegelstände und Temperaturschocks.
              </p>

              {/* Status information */}
              <div className="text-[10.5px] bg-black/20 p-2 rounded-lg border border-white/5 mb-4 space-y-2">
                <div className="font-semibold text-[#E6935C] uppercase tracking-wide border-b border-white/5 pb-1 text-[9.5px]">
                  Systemvorteile:
                </div>
                <div className="text-white/80 leading-relaxed text-[10px]">
                  Halbiert jegliche budgetären und ökologischen Verluste bei unvorhersehbaren Extremereignissen (<b>Hochwasser</b>, <b>Dürrewelle</b>, <b>Schädlingsplage Sektor Rur</b>).
                </div>
              </div>
            </div>

            {ewsActive ? (
              <div className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-[#4A7A3A]/20 text-[#A7C080] border border-[#4A7A3A]/40 text-center select-none flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>FRÜHWARNANSTALTS-NETZWERK AKTIV</span>
              </div>
            ) : (
              <button
                onClick={handleBuyEWS}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-[#E6935C] hover:bg-[#c37b46] text-slate-950 transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01]"
              >
                <span>Frühwarnsystem kaufen</span>
                <span className="font-mono text-[9.5px] opacity-85">(5 € / 3 🧪)</span>
              </button>
            )}
          </div>

          {/* Column D: Bürger-Energiegenossenschaften */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#7FA8B5] uppercase tracking-wider">
                  4. SOZIALE AKZEPTANZ
                </span>
                <span className="text-[10px] font-mono select-none px-1.5 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-500/10">
                  Genossenschaft
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-3">
                Gründe Bürger-Energiegenossenschaften zur gemeinsamen Gewinnbeteiligung an Windrädern und Solarparks im Rurtal.
              </p>

              {/* Status information */}
              <div className="text-[10.5px] bg-black/20 p-2 rounded-lg border border-white/5 mb-4 space-y-2">
                <div className="font-semibold text-[#7FA8B5] uppercase tracking-wide border-b border-white/5 pb-1 text-[9.5px]">
                  Effekte &amp; Vorteile:
                </div>
                <div className="text-white/80 leading-relaxed text-[10px]">
                  Beteiligt Bürger an Erträgen. Steigert Akzeptanz schlagartig um <b>+40%</b> und verhindert jeglichen NIMBY-Verlust zukünftiger Sektor-Infrastrukturprojekte.
                </div>
              </div>
            </div>

            {stats.cooperativesActive ? (
              <div className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-[#4A7A3A]/20 text-[#A7C080] border border-[#4A7A3A]/40 text-center select-none flex items-center justify-center gap-1.5 font-mono">
                <Check className="w-3.5 h-3.5" />
                <span>GENOSSENSCHAFT AKTIV</span>
              </div>
            ) : (
              <button
                onClick={handleCreateCooperatives}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-[#7FA8B5] hover:bg-[#6c95a2] text-slate-950 transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.01]"
              >
                <span>Genossenschaft gründen</span>
                <span className="font-mono text-[9.5px] opacity-85">(12 € / 4 🧪)</span>
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
