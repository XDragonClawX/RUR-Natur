import React, { useState, useMemo } from 'react';
import {
  ActionCard, ActionCardType, BuildingType, ResearchNode, TileData, GameStats
} from '../types';
import {
  Play, Train, ChevronLeft, Hammer, Leaf, Droplets,
  Coins, Microscope, ArrowRight, AlertTriangle, Zap, Shield, TrendingUp, Lock
} from 'lucide-react';

interface ActionSlotSystemProps {
  cards: ActionCard[];
  onExecuteCard: (card: ActionCard, strength: number) => void;
  rurtalbahnLeased: boolean;
  leaseRurtalbahn: () => void;
  rurtalbahnTimeRemaining: number;
  // context for filtered options
  stats: GameStats;
  buildingsCatalog: BuildingType[];
  researchTree: ResearchNode[];
  grid: TileData[][];
  onSelectBuilding: (building: BuildingType) => void;
  onUnlockResearch: (nodeId: string) => void;
  // simulation challenges — integrated contextually into each panel
  invasiveThreatEnabled: boolean;
  energyChallengeEnabled: boolean;
  roundInvested: boolean;
  onToggleInvasive: (enabled: boolean) => void;
  onToggleEnergy: (enabled: boolean) => void;
  onShowInvasiveRules: () => void;
  onShowEnergyRules: () => void;
  // round action budget
  actionsUsed: number;
  maxActionsPerRound: number;
}

// ── Strength palette ──────────────────────────────────────────────────────────
const STR_PALETTE = [
  { bar: 'bg-slate-400',    badge: 'bg-slate-100  text-slate-700  border-slate-300/50',  ring: 'border-b-slate-400',  text: 'text-slate-700'  },
  { bar: 'bg-cyan-500',     badge: 'bg-cyan-50    text-cyan-800   border-cyan-200',       ring: 'border-b-cyan-500',   text: 'text-cyan-700'   },
  { bar: 'bg-amber-500',    badge: 'bg-amber-50   text-amber-800  border-amber-200',      ring: 'border-b-amber-500',  text: 'text-amber-700'  },
  { bar: 'bg-purple-500',   badge: 'bg-purple-50  text-purple-800 border-purple-200',     ring: 'border-b-purple-500', text: 'text-purple-700' },
  { bar: 'bg-[#5A7247] animate-pulse', badge: 'bg-[#D4E0C1] text-[#2C3322] border-[#5A7247]', ring: 'border-b-[#5A7247]', text: 'text-[#5A7247]' },
] as const;

// ── Card type metadata ─────────────────────────────────────────────────────────
type CardTypeKey = ActionCardType | 'rurtalbahn';
const TYPE_META: Record<CardTypeKey, { icon: React.ReactNode; color: string; label: string }> = {
  BUILD:      { icon: <Hammer   className="w-3.5 h-3.5" />, color: 'text-amber-700',    label: '🏗️' },
  PLANT:      { icon: <Leaf     className="w-3.5 h-3.5" />, color: 'text-[#5A7247]',    label: '🌱' },
  HYDROLOGY:  { icon: <Droplets className="w-3.5 h-3.5" />, color: 'text-[#2A6F7E]',    label: '🌊' },
  FUNDING:    { icon: <Coins    className="w-3.5 h-3.5" />, color: 'text-amber-600',    label: '💶' },
  RESEARCH:   { icon: <Microscope className="w-3.5 h-3.5" />, color: 'text-purple-700', label: '🧪' },
  rurtalbahn: { icon: <Train    className="w-3.5 h-3.5" />, color: 'text-[#2A6F7E]',    label: '🚇' },
};

// ── Building category icons ────────────────────────────────────────────────────
const CAT_ICON: Record<string, string> = {
  ecology: '🌿', water: '💧', fauna: '🦅', economy: '🏭', infrastructure: '🔧', tourism: '🎯'
};

// ── Energy building contributions ──────────────────────────────────────────────
const ENERGY_BUILDINGS: Record<string, { pct: number; label: string; color: string }> = {
  wasserkraft: { pct: 12, label: 'Wasserkraft',   color: 'text-blue-700' },
  solarpark:   { pct: 10, label: 'Solarpark',     color: 'text-yellow-700' },
  windkraft:   { pct: 15, label: 'Windkraftanl.', color: 'text-sky-700' },
};

// ─────────────────────────────────────────────────────────────────────────────
// ── Shared mini progress bar ──────────────────────────────────────────────────
const ProgressBar: React.FC<{
  value: number; max?: number;
  color: string; bg?: string;
  height?: string;
}> = ({ value, max = 100, color, bg = 'bg-[#E8E2D6]', height = 'h-1.5' }) => (
  <div className={`${height} ${bg} rounded-full overflow-hidden`}>
    <div
      className={`h-full ${color} rounded-full transition-all duration-500`}
      style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
    />
  </div>
);

// ── Challenge toggle pill ──────────────────────────────────────────────────────
const ChallengePill: React.FC<{
  active: boolean; label: string; value?: number;
  okColor: string; warnColor: string; critColor: string;
  thresholds: [number, number]; // [warn, crit]
  onToggle: (v: boolean) => void;
  onRules: () => void;
}> = ({ active, label, value, okColor, warnColor, critColor, thresholds, onToggle, onRules }) => {
  const [warn, crit] = thresholds;
  const color = !active ? 'bg-stone-100 text-stone-400 border-stone-200'
    : (value ?? 100) >= warn ? `${okColor} border-transparent`
    : (value ?? 100) >= crit ? `${warnColor} border-transparent`
    : `${critColor} border-transparent animate-pulse`;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-mono font-black ${color}`}>
      <span>{label}</span>
      {active && value !== undefined && <span className="opacity-80">{value}%</span>}
      {active && (
        <button onClick={() => onRules()} className="underline decoration-dotted opacity-75 hover:opacity-100 cursor-pointer ml-0.5" title="Regeln">?</button>
      )}
      <label className="relative inline-flex items-center cursor-pointer select-none ml-1">
        <input type="checkbox" checked={active} onChange={e => onToggle(e.target.checked)} className="sr-only peer" />
        <div className="w-6 h-3.5 bg-black/20 rounded-full peer peer-checked:after:translate-x-2.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-white/30" />
      </label>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export const ActionSlotSystem: React.FC<ActionSlotSystemProps> = ({
  cards, onExecuteCard,
  rurtalbahnLeased, leaseRurtalbahn, rurtalbahnTimeRemaining,
  stats, buildingsCatalog, researchTree, grid,
  onSelectBuilding, onUnlockResearch,
  invasiveThreatEnabled, energyChallengeEnabled, roundInvested,
  onToggleInvasive, onToggleEnergy, onShowInvasiveRules, onShowEnergyRules,
  actionsUsed, maxActionsPerRound,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const card     = selectedIdx !== null ? cards[selectedIdx] : null;
  const strength = selectedIdx !== null ? selectedIdx + 1 : 0;
  const typeKey: CardTypeKey = card?.id === 'rurtalbahn_card' ? 'rurtalbahn' : (card?.type ?? 'BUILD');

  // Action budget helpers
  const actionsLeft    = Math.max(0, maxActionsPerRound - actionsUsed);
  const budgetExhausted = actionsLeft === 0;
  // BUILD uses the action budget on tile placement, not here — still show the count
  const isBuildCard    = card?.type === 'BUILD';

  // ── Derived options ────────────────────────────────────────────────────────
  const discount = strength >= 5 ? 2 : strength >= 3 ? 1 : 0;

  const buildOptions = useMemo(() => {
    if (!card || card.type !== 'BUILD') return [];
    return buildingsCatalog.filter(b => (b.cost - discount) <= stats.budget);
  }, [card, discount, buildingsCatalog, stats.budget]);

  const researchNow = useMemo(() => {
    if (!card || card.type !== 'RESEARCH') return [];
    return researchTree.filter(r =>
      !r.unlocked &&
      r.cost <= stats.researchPoints &&
      r.dependencies.every(d => researchTree.find(n => n.id === d)?.unlocked)
    );
  }, [card, researchTree, stats.researchPoints]);

  const researchGain: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 7 };
  const researchAfter = useMemo(() => {
    if (!card || card.type !== 'RESEARCH') return [];
    const pts = stats.researchPoints + (researchGain[strength] ?? 1);
    return researchTree.filter(r =>
      !r.unlocked &&
      r.cost > stats.researchPoints &&
      r.cost <= pts &&
      r.dependencies.every(d => researchTree.find(n => n.id === d)?.unlocked)
    );
  }, [card, researchTree, stats.researchPoints, strength]);

  const plantableCount = useMemo(() =>
    (!card || card.type !== 'PLANT') ? 0
    : grid.flat().filter(t => (t.terrain === 'Acker' || t.terrain === 'Wiese') && !t.buildingId).length,
    [card, grid]
  );

  const waterTileCount = useMemo(() =>
    (!card || card.type !== 'HYDROLOGY') ? 0
    : grid.flat().filter(t => t.terrain === 'Water').length,
    [card, grid]
  );

  const fundingBudget:   Record<number, number> = { 1: 3, 2: 6,  3: 9,  4: 12, 5: 16 };
  const fundingResearch: Record<number, number> = { 1: 0, 2: 0,  3: 0,  4: 1,  5: 2  };

  // ── Energy projection (shared calc) ───────────────────────────────────────
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

  // ── helpers ────────────────────────────────────────────────────────────────
  const pal = (s: number) => STR_PALETTE[Math.min(s - 1, 4)];

  const execAndClose = () => {
    if (card) { onExecuteCard(card, strength); setSelectedIdx(null); }
  };

  // ── Challenge idle banner (no card selected) ───────────────────────────────
  const ChallengeIdleBanner = () => {
    const bio    = stats.biosecurity ?? 100;
    const energy = stats.renewableEnergy ?? 25;
    const bioDelta    = invasiveThreatEnabled ? (roundInvested ? 15 : -25) : 0;
    const bioBarColor = bio >= 70 ? 'bg-[#5A7247]' : bio >= 30 ? 'bg-amber-500' : 'bg-rose-500';
    const energyBarColor = energy >= 70 ? 'bg-emerald-500' : energy >= 35 ? 'bg-amber-500' : 'bg-rose-500';
    const hasAny = invasiveThreatEnabled || energyChallengeEnabled;

    return (
      <div className="border-t border-[#D4CCBA]/60 bg-gradient-to-b from-white/40 to-[#F7F3ED]/60 px-4 py-3">
        {/* Prompt text */}
        <p className="text-[9.5px] text-[#8B8273] text-center mb-2.5 font-semibold">
          Klicke einen Slot oben, um die verfügbaren Aktionen zu sehen
        </p>

        {/* Challenge status section */}
        <div className="flex items-center gap-2">
          {/* Bio challenge */}
          <div className={`flex-1 rounded-lg border px-2.5 py-2 space-y-1.5 transition-all ${
            invasiveThreatEnabled
              ? bio < 30  ? 'bg-rose-50/80 border-rose-300/60'
              : bio < 70  ? 'bg-amber-50/60 border-amber-200/50'
                          : 'bg-[#5A7247]/5 border-[#5A7247]/20'
              : 'bg-stone-50/60 border-stone-200/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-black uppercase tracking-wide text-[#2C3322] flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Bio-Sicherheit
              </span>
              <div className="flex items-center gap-1.5">
                {invasiveThreatEnabled && (
                  <span className={`text-[9px] font-mono font-black ${
                    bio >= 70 ? 'text-[#5A7247]' : bio >= 30 ? 'text-amber-700' : 'text-rose-700'
                  }`}>{bio}% {bioDelta !== 0 && <span className="text-[8px] opacity-75">({bioDelta > 0 ? '+' : ''}{bioDelta})</span>}</span>
                )}
                <ChallengePill
                  active={invasiveThreatEnabled}
                  label="🦠"
                  value={bio}
                  okColor="bg-[#5A7247]/15 text-[#2C3322]"
                  warnColor="bg-amber-100 text-amber-900"
                  critColor="bg-rose-100 text-rose-900"
                  thresholds={[70, 30]}
                  onToggle={onToggleInvasive}
                  onRules={onShowInvasiveRules}
                />
              </div>
            </div>
            {invasiveThreatEnabled && (
              <ProgressBar value={bio} color={bioBarColor} />
            )}
            {invasiveThreatEnabled && bio < 30 && (
              <div className="flex items-center gap-1 text-[8px] text-rose-700 font-bold animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                KRITISCH — PFLANZUNG ausführen!
              </div>
            )}
            {!invasiveThreatEnabled && (
              <p className="text-[8px] text-stone-400">Invasive Bedrohung inaktiv</p>
            )}
          </div>

          {/* Energy challenge */}
          <div className={`flex-1 rounded-lg border px-2.5 py-2 space-y-1.5 transition-all ${
            energyChallengeEnabled
              ? energy < 35 ? 'bg-rose-50/80 border-rose-300/60'
              : energy < 70 ? 'bg-amber-50/60 border-amber-200/50'
                            : 'bg-emerald-50/60 border-emerald-200/50'
              : 'bg-stone-50/60 border-stone-200/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-black uppercase tracking-wide text-[#2C3322] flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Erneuerbare
              </span>
              <div className="flex items-center gap-1.5">
                {energyChallengeEnabled && (
                  <span className={`text-[9px] font-mono font-black ${
                    energy >= 70 ? 'text-emerald-700' : energy >= 35 ? 'text-amber-700' : 'text-rose-700'
                  }`}>{energy}% <span className="text-[8px] opacity-75">({energyCalc.netDelta >= 0 ? '+' : ''}{energyCalc.netDelta})</span></span>
                )}
                <ChallengePill
                  active={energyChallengeEnabled}
                  label="⚡"
                  value={energy}
                  okColor="bg-emerald-100 text-emerald-900"
                  warnColor="bg-amber-100 text-amber-900"
                  critColor="bg-rose-100 text-rose-900"
                  thresholds={[70, 35]}
                  onToggle={onToggleEnergy}
                  onRules={onShowEnergyRules}
                />
              </div>
            </div>
            {energyChallengeEnabled && (
              <ProgressBar value={energy} color={energyBarColor} />
            )}
            {energyChallengeEnabled && energy < 35 && (
              <div className="flex items-center gap-1 text-[8px] text-rose-700 font-bold animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                NIEDRIG — BAUEN: Energieanlage!
              </div>
            )}
            {!energyChallengeEnabled && (
              <p className="text-[8px] text-stone-400">Energiewende inaktiv</p>
            )}
          </div>
        </div>

        {/* Quick action hints when challenges are critical */}
        {hasAny && (invasiveThreatEnabled && bio < 30 || energyChallengeEnabled && energy < 35) && (
          <div className="mt-2 text-[8px] text-center text-[#8B8273] italic">
            Tipp: Wähle die passende Aktionskarte links oben, um die Krise abzuwenden.
          </div>
        )}
      </div>
    );
  };

  // ── Options panel ──────────────────────────────────────────────────────────
  const OptionsPanel = () => {
    if (!card) return null;

    /* ── BUILD ── */
    if (card.type === 'BUILD') {
      const energyBuildOptions  = buildOptions.filter(b => b.id in ENERGY_BUILDINGS);
      const regularBuildOptions = buildOptions.filter(b => !(b.id in ENERGY_BUILDINGS));
      const energy = stats.renewableEnergy ?? 25;
      const ec     = energyCalc;

      return (
        <div className="flex flex-col gap-2.5">

          {/* ── Budget header ── */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#2C3322] uppercase tracking-wide">🏗️ Baubare Projekte</span>
            <span className="text-[10px] text-[#6B6356]">
              Budget: <strong className="text-[#2C3322]">{stats.budget} €</strong>
              {discount > 0 && <span className="text-brand-green font-bold ml-1">−{discount} € Rabatt</span>}
            </span>
          </div>

          {/* ── Energiewende Section (always shown when active) ── */}
          {energyChallengeEnabled && (
            <div className={`rounded-xl border p-2.5 ${
              energy < 35 ? 'bg-rose-50/80 border-rose-300/60'
              : energy < 70 ? 'bg-amber-50/60 border-amber-200/50'
                            : 'bg-emerald-50/40 border-emerald-200/40'
            }`}>
              {/* Status bar */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black text-[#2C3322] uppercase tracking-wide flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-600 shrink-0" /> Energiewende
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[9.5px] font-mono font-black ${
                    energy >= 70 ? 'text-emerald-700' : energy >= 35 ? 'text-amber-700' : 'text-rose-700'
                  }`}>{energy}%</span>
                  <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                    ec.netDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {ec.netDelta >= 0 ? '+' : ''}{ec.netDelta}%/Rd → {ec.projected}%
                  </span>
                </div>
              </div>
              <ProgressBar
                value={energy}
                color={energy >= 70 ? 'bg-emerald-500' : energy >= 35 ? 'bg-amber-500' : 'bg-rose-500'}
                bg="bg-white/60"
              />

              {/* Energy building grid */}
              {energyBuildOptions.length > 0 ? (
                <div className="mt-2">
                  <div className="text-[8px] text-[#8B8273] font-bold uppercase tracking-wide mb-1">
                    Energieanlagen im Budget:
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {energyBuildOptions.map(b => {
                      const meta = ENERGY_BUILDINGS[b.id];
                      return (
                        <button
                          key={b.id}
                          onClick={() => { onSelectBuilding(b); onExecuteCard(card, strength); setSelectedIdx(null); }}
                          className="text-left p-1.5 rounded-lg bg-white border border-amber-300/50 hover:border-amber-500 hover:bg-amber-50/60 transition-all duration-150 cursor-pointer group"
                        >
                          <div className="text-[9px] font-black text-[#2C3322] leading-tight truncate">{b.name.split(' ')[0]}</div>
                          <div className={`text-[8px] font-mono font-black ${meta.color} mt-0.5`}>+{meta.pct}%</div>
                          <div className="text-[8px] text-amber-700 font-mono">
                            {discount > 0 ? `${b.cost - discount} €` : `${b.cost} €`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-[8.5px] text-amber-800 font-semibold mt-1.5">
                  Kein Budget für Energieanlagen — nutze FÖRDERUNG zuerst.
                </p>
              )}

              {/* Quick source breakdown */}
              <div className="flex items-center gap-2 mt-1.5 text-[8px] text-[#6B6356] font-mono">
                <span>💧 {ec.hydroCount}×+12%</span>
                <span>☀️ {ec.solarCount}×+10%</span>
                <span>💨 {ec.windCount}×+15%</span>
                <span className="ml-auto text-[#8B8273]">
                  <button onClick={onShowEnergyRules} className="underline cursor-pointer hover:text-[#2C3322] transition-colors">Regeln</button>
                </span>
              </div>
            </div>
          )}

          {/* ── Standard building catalog ── */}
          {buildOptions.length === 0 && !energyChallengeEnabled ? (
            <div className="text-center py-8 text-[#8B8273] text-xs bg-[#F7F3ED] rounded-lg border border-[#D4CCBA]/50">
              Kein ausreichendes Budget für Baumaßnahmen.
            </div>
          ) : regularBuildOptions.length > 0 ? (
            <>
              {energyChallengeEnabled && (
                <div className="text-[8.5px] text-[#8B8273] font-bold uppercase tracking-wide -mb-1">
                  Weitere Projekte:
                </div>
              )}
              <div className={`grid grid-cols-2 gap-1.5 overflow-y-auto pr-1 ${energyChallengeEnabled ? 'max-h-32' : 'max-h-56'}`}>
                {regularBuildOptions.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { onSelectBuilding(b); onExecuteCard(card, strength); setSelectedIdx(null); }}
                    className="text-left p-2.5 rounded-lg bg-white border border-[#D4CCBA] hover:border-amber-400/70 hover:bg-amber-50/40 transition-all duration-150 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black text-[#2C3322] leading-tight group-hover:text-amber-900">
                        {CAT_ICON[b.category] ?? '🏗️'} {b.name}
                      </span>
                      <span className="text-[10px] font-mono font-black text-amber-700 shrink-0">
                        {discount > 0
                          ? <><s className="opacity-35 text-[9px]">{b.cost}</s> {b.cost - discount}</>
                          : b.cost} €
                      </span>
                    </div>
                    <p className="text-[9px] text-[#8B8273] leading-snug line-clamp-2">{b.description}</p>
                    <div className="mt-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-3 h-3 text-amber-600" />
                      <span className="text-[9px] text-amber-700 font-semibold">Auswählen → zur Karte</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : energyChallengeEnabled && regularBuildOptions.length === 0 && energyBuildOptions.length === 0 ? (
            <div className="text-center py-4 text-[#8B8273] text-xs bg-[#F7F3ED] rounded-lg border border-[#D4CCBA]/50">
              Kein ausreichendes Budget für Baumaßnahmen.
            </div>
          ) : null}
        </div>
      );
    }

    /* ── RESEARCH ── */
    if (card.type === 'RESEARCH') {
      const greenEnergyNode = researchTree.find(r => r.id === 'green_energy_tech' && !r.unlocked);
      const canUnlockGreen  = greenEnergyNode && greenEnergyNode.cost <= stats.researchPoints;
      const greenAfterExec  = greenEnergyNode && greenEnergyNode.cost <= stats.researchPoints + (researchGain[strength] ?? 1);
      const showEnergyHighlight = energyChallengeEnabled && greenEnergyNode;

      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#2C3322] uppercase tracking-wide">🔬 Forschungen</span>
            <span className="text-[10px] text-[#6B6356]">
              Punkte: <strong className="text-purple-700">{stats.researchPoints} 🧪</strong>
            </span>
          </div>

          {/* ── Energiewende research highlight ── */}
          {showEnergyHighlight && (
            <div className="rounded-xl bg-amber-50/80 border border-amber-300/60 p-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-800 uppercase tracking-wide">
                <Zap className="w-3 h-3 shrink-0" /> Energiewende — Empfohlen
              </div>
              <button
                onClick={() => { if (canUnlockGreen) { onUnlockResearch('green_energy_tech'); setSelectedIdx(null); }}}
                disabled={!canUnlockGreen}
                className={`w-full text-left p-2 rounded-lg border transition-all ${
                  canUnlockGreen
                    ? 'bg-amber-100/80 border-amber-400 hover:border-amber-500 hover:bg-amber-200/60 cursor-pointer'
                    : greenAfterExec
                    ? 'bg-amber-50/60 border-amber-200/50 cursor-default'
                    : 'bg-amber-50/30 border-amber-100 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#2C3322]">Dürener Energiewende-Konzept</span>
                  <span className="text-[9px] font-black text-amber-700">{greenEnergyNode.cost} 🧪</span>
                </div>
                <p className="text-[8.5px] text-[#6B6356] mt-0.5 leading-snug">
                  Halbiert Industrie-Verfall: {energyCalc.decay}%→{Math.ceil(energyCalc.decay / 2)}%/Runde
                </p>
                {canUnlockGreen && (
                  <div className="text-[8px] text-amber-700 font-bold mt-1">→ Jetzt freischalten</div>
                )}
                {!canUnlockGreen && greenAfterExec && (
                  <div className="text-[8px] text-amber-600 font-semibold mt-1 italic">
                    Nach Ausführen dieser Karte (+{researchGain[strength] ?? 1} 🧪) erreichbar
                  </div>
                )}
              </button>
            </div>
          )}

          {researchNow.filter(r => r.id !== 'green_energy_tech').length > 0 && (
            <div>
              <div className="text-[9px] text-brand-green font-bold uppercase tracking-wide mb-1.5">
                ✓ Jetzt freischaltbar
              </div>
              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                {researchNow.filter(r => !(energyChallengeEnabled && r.id === 'green_energy_tech')).map(r => (
                  <button key={r.id}
                    onClick={() => { onUnlockResearch(r.id); setSelectedIdx(null); }}
                    className="text-left p-2.5 rounded-lg bg-purple-50/60 border border-purple-200/50 hover:bg-purple-100/70 hover:border-purple-400 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#2C3322]">{r.name}</span>
                      <span className="text-[9px] font-black text-purple-700">{r.cost} 🧪</span>
                    </div>
                    <p className="text-[9px] text-[#6B6356] mt-0.5 leading-snug">{r.effect}</p>
                    <div className="text-[9px] text-purple-600 font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      → Jetzt freischalten
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {researchAfter.filter(r => !(energyChallengeEnabled && r.id === 'green_energy_tech')).length > 0 && (
            <div>
              <div className="text-[9px] text-amber-600 font-bold uppercase tracking-wide mb-1.5">
                ◉ Nach Ausführen erreichbar (+{researchGain[strength] ?? 1} 🧪)
              </div>
              <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                {researchAfter.filter(r => !(energyChallengeEnabled && r.id === 'green_energy_tech')).map(r => (
                  <div key={r.id}
                    className="p-2 rounded-lg bg-amber-50/40 border border-amber-200/40 opacity-80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#2C3322]">{r.name}</span>
                      <span className="text-[9px] text-amber-700 font-black">{r.cost} 🧪</span>
                    </div>
                    <p className="text-[9px] text-[#8B8273] mt-0.5">{r.effect}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {researchNow.length === 0 && researchAfter.length === 0 && !showEnergyHighlight && (
            <p className="text-center py-5 text-[10px] text-[#8B8273] bg-[#F7F3ED] rounded-lg border border-[#D4CCBA]/50">
              Keine weiteren Forschungen verfügbar.<br />Führe die Karte aus, um Punkte zu sammeln.
            </p>
          )}

          <button onClick={execAndClose}
            disabled={budgetExhausted}
            className={`mt-1 w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              budgetExhausted
                ? 'bg-[#E8E2D6] text-[#8B8273] cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
            }`}
          >
            {budgetExhausted ? <Lock className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {budgetExhausted ? 'Limit erreicht – Runde beenden' : `Forschungsaktion ausführen (+${researchGain[strength] ?? 1} 🧪)`}
          </button>
        </div>
      );
    }

    /* ── PLANT ── */
    if (card.type === 'PLANT') {
      const max    = strength;
      const actual = Math.min(max, plantableCount);
      const bio    = stats.biosecurity ?? 100;

      return (
        <div className="flex flex-col gap-3">

          {/* ── Bio-Sicherheit Section ── */}
          {invasiveThreatEnabled && (
            <div className={`rounded-xl border p-3 space-y-1.5 ${
              bio >= 70 ? 'bg-[#5A7247]/6 border-[#5A7247]/20'
              : bio >= 30 ? 'bg-amber-50/70 border-amber-300/50'
                          : 'bg-rose-50/80 border-rose-300/60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-[#2C3322] uppercase tracking-wide flex items-center gap-1">
                  <Shield className="w-3 h-3 shrink-0" /> Bio-Sicherheit
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[9.5px] font-mono font-black ${
                    bio >= 70 ? 'text-[#5A7247]' : bio >= 30 ? 'text-amber-700' : 'text-rose-700 animate-pulse'
                  }`}>{bio}%</span>
                  <button onClick={onShowInvasiveRules}
                    className="text-[8px] text-[#8B8273] underline decoration-dotted hover:text-[#2C3322] cursor-pointer transition-colors">
                    Regeln
                  </button>
                </div>
              </div>
              <ProgressBar
                value={bio}
                color={bio >= 70 ? 'bg-[#5A7247]' : bio >= 30 ? 'bg-amber-500' : 'bg-rose-500'}
                bg="bg-white/60"
              />
              <div className="flex items-start gap-1.5 text-[8.5px] font-semibold">
                <TrendingUp className="w-3 h-3 text-[#5A7247] mt-0.5 shrink-0" />
                <span className={bio >= 30 ? 'text-[#5A7247]' : 'text-rose-700'}>
                  Bepflanzung = Investition → <strong>+15% Bio</strong> nächste Runde
                </span>
              </div>
              {bio < 30 && (
                <div className="flex items-center gap-1 text-[8px] text-rose-700 font-black animate-pulse">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  KRITISCH! Sofort bepflanzen, um Plagen-Event abzuwenden!
                </div>
              )}
            </div>
          )}

          <span className="text-[10px] font-bold text-[#2C3322] uppercase tracking-wide">🌱 Bepflanzungs-Vorschau</span>
          <div className="rounded-xl bg-brand-green/6 border border-brand-green/18 p-4">
            <div className="grid grid-cols-3 gap-3 text-center mb-2">
              <div>
                <div className="text-[8px] text-[#8B8273] font-bold uppercase tracking-wide">Freie Flächen</div>
                <div className="text-2xl font-black text-[#5A7247]">{plantableCount}</div>
                <div className="text-[8px] text-[#6B6356]">Acker + Wiese</div>
              </div>
              <div>
                <div className="text-[8px] text-[#8B8273] font-bold uppercase tracking-wide">Max. Stärke {strength}</div>
                <div className="text-2xl font-black text-[#5A7247]">{actual}</div>
                <div className="text-[8px] text-[#6B6356]">Umwandlungen</div>
              </div>
              <div>
                <div className="text-[8px] text-[#8B8273] font-bold uppercase tracking-wide">Naturpunkte</div>
                <div className="text-2xl font-black text-[#5A7247]">+{actual * 2}</div>
                <div className="text-[8px] text-[#6B6356]">🌿</div>
              </div>
            </div>
            {strength >= 3 && (
              <div className="text-[9px] text-[#5A7247] font-semibold border-t border-brand-green/20 pt-2">
                ✓ Stärke {strength}: Wiese → Auwald-Upgrade aktiv
              </div>
            )}
          </div>
          <button onClick={execAndClose} disabled={plantableCount === 0 || budgetExhausted}
            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              budgetExhausted
                ? 'bg-[#E8E2D6] text-[#8B8273] cursor-not-allowed'
                : plantableCount > 0
                ? 'bg-[#5A7247] hover:bg-[#3d6830] text-white cursor-pointer'
                : 'bg-[#E8E2D6] text-[#8B8273] cursor-not-allowed'
            }`}
          >
            {budgetExhausted ? <Lock className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {budgetExhausted ? 'Limit erreicht – Runde beenden' : plantableCount > 0 ? `${actual} Flächen bepflanzen` : 'Keine freien Flächen'}
          </button>
        </div>
      );
    }

    /* ── HYDROLOGY ── */
    if (card.type === 'HYDROLOGY') {
      const wrrl = (strength * 0.15 * waterTileCount).toFixed(1);
      const ffh  = Math.floor(strength * 2.5 * waterTileCount);
      const bio  = stats.biosecurity ?? 100;
      const globalWrrl = stats.globalWrrl ?? 3.5;
      const wrrlAfter  = Math.max(1.0, globalWrrl - Number(wrrl));

      return (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold text-[#2C3322] uppercase tracking-wide">🌊 Hydrologische Vorschau</span>
          <div className="rounded-xl bg-sky-50/60 border border-sky-200/50 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[8px] text-[#8B8273] font-bold uppercase tracking-wide">Wasser-Tiles</div>
                <div className="text-2xl font-black text-[#2A6F7E]">{waterTileCount}</div>
              </div>
              <div>
                <div className="text-[8px] text-[#8B8273] font-bold uppercase tracking-wide">WRRL −</div>
                <div className="text-2xl font-black text-sky-600">{wrrl}</div>
              </div>
              <div>
                <div className="text-[8px] text-[#8B8273] font-bold uppercase tracking-wide">FFH +</div>
                <div className="text-2xl font-black text-[#5A7247]">{ffh}</div>
              </div>
            </div>
          </div>

          {/* Bio challenge connection */}
          {invasiveThreatEnabled && (
            <div className={`rounded-lg border px-3 py-2 text-[8.5px] flex items-start gap-2 ${
              bio < 70 ? 'bg-[#5A7247]/6 border-[#5A7247]/20 text-[#5A7247]'
                       : 'bg-sky-50/40 border-sky-200/40 text-sky-800'
            }`}>
              <Shield className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                <strong>Bio-Sicherheit: {bio}%</strong><br />
                {wrrlAfter <= 3.0
                  ? `WRRL fällt auf ${wrrlAfter.toFixed(1)} ≤ 3.0 → Bio-Sicherheit stabilisiert sich passiv`
                  : `WRRL bei ${globalWrrl.toFixed(1)} → Ziel: ≤ 3.0 für passiven Bio-Schutz`
                }
              </span>
            </div>
          )}

          <button onClick={execAndClose}
            disabled={budgetExhausted}
            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              budgetExhausted
                ? 'bg-[#E8E2D6] text-[#8B8273] cursor-not-allowed'
                : 'bg-[#2A6F7E] hover:bg-[#1f5a6a] text-white cursor-pointer'
            }`}
          >
            {budgetExhausted ? <Lock className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {budgetExhausted ? 'Limit erreicht – Runde beenden' : 'Hydrologie verbessern'}
          </button>
        </div>
      );
    }

    /* ── FUNDING ── */
    if (card.type === 'FUNDING') {
      const bud = fundingBudget[strength]   ?? 3;
      const res = fundingResearch[strength] ?? 0;
      const hasActiveChallenges = invasiveThreatEnabled || energyChallengeEnabled;

      return (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold text-[#2C3322] uppercase tracking-wide">💶 Förderungs-Vorschau</span>
          <div className="rounded-xl bg-amber-50/60 border border-amber-200/50 p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-[8px] text-[#8B8273] font-bold uppercase tracking-wide mb-1">Budget-Ertrag</div>
                <div className="text-3xl font-black text-amber-700">+{bud}</div>
                <div className="text-[10px] text-[#6B6356]">€</div>
              </div>
              {res > 0 ? (
                <div>
                  <div className="text-[8px] text-[#8B8273] font-bold uppercase tracking-wide mb-1">Forschungs-Bonus</div>
                  <div className="text-3xl font-black text-purple-700">+{res}</div>
                  <div className="text-[10px] text-[#6B6356]">🧪</div>
                </div>
              ) : (
                <div className="flex items-center justify-center text-[9px] text-[#8B8273] text-center leading-relaxed">
                  Ab Stärke 4:<br/>+1 🧪 Bonus
                </div>
              )}
            </div>
          </div>

          {/* Challenge investment advice */}
          {hasActiveChallenges && (
            <div className="rounded-xl bg-white/70 border border-[#D4CCBA]/60 px-3 py-2.5 space-y-1.5">
              <div className="text-[8.5px] font-black text-[#2C3322] uppercase tracking-wide">
                Investitions-Empfehlung
              </div>
              {energyChallengeEnabled && (
                <div className="flex items-start gap-1.5 text-[8.5px] text-[#6B6356]">
                  <Zap className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                  <span>
                    Energie {stats.renewableEnergy ?? 25}% — Bau Solarpark (7€) oder Windkraft (12€) für +10–15%/Tile.{' '}
                    {bud >= 7 && <strong className="text-amber-700">Budget reicht für Solarpark!</strong>}
                  </span>
                </div>
              )}
              {invasiveThreatEnabled && (
                <div className="flex items-start gap-1.5 text-[8.5px] text-[#6B6356]">
                  <Shield className="w-3 h-3 text-[#5A7247] mt-0.5 shrink-0" />
                  <span>
                    Bio {stats.biosecurity ?? 100}% — Anschließend PFLANZUNG ausführen für +15% Bio-Erholung.
                  </span>
                </div>
              )}
            </div>
          )}

          <button onClick={execAndClose}
            disabled={budgetExhausted}
            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              budgetExhausted
                ? 'bg-[#E8E2D6] text-[#8B8273] cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
            }`}
          >
            {budgetExhausted ? <Lock className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {budgetExhausted ? 'Limit erreicht – Runde beenden' : `Förderung beantragen (+${bud} €)`}
          </button>
        </div>
      );
    }

    /* ── RURTALBAHN ── */
    if (card.id === 'rurtalbahn_card') return (
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-bold text-[#2C3322] uppercase tracking-wide">🚇 Rurtalbahn-Aktion</span>
        <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-200/50 text-xs text-[#6B6356] leading-relaxed">
          {card.strengthEffects[strength]}
        </div>
        <button onClick={execAndClose}
          disabled={budgetExhausted}
          className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            budgetExhausted
              ? 'bg-[#E8E2D6] text-[#8B8273] cursor-not-allowed'
              : 'bg-[#2A6F7E] hover:bg-[#1f5a6a] text-white cursor-pointer'
          }`}
        >
          {budgetExhausted ? <Lock className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {budgetExhausted ? 'Limit erreicht – Runde beenden' : 'Rurtalbahn-Sonderaktion ausführen'}
        </button>
      </div>
    );

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#F7F3ED] border border-[#D4CCBA] rounded-xl shadow-sm overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#D4CCBA]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#2C3322]">🎴 Aktions-Slot-System</span>
          <span className="text-[9px] bg-[#5A7247]/10 text-[#5A7247] px-2 py-0.5 rounded-full border border-[#5A7247]/22 font-bold uppercase tracking-wide">
            {selectedIdx === null ? 'Slot wählen' : `Slot 0${strength} aktiv`}
          </span>
        </div>

        {/* ── Action budget pips ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 mr-2">
          <span className={`text-[9px] font-bold uppercase tracking-wide ${
            budgetExhausted ? 'text-rose-600' : actionsLeft === 1 ? 'text-amber-600' : 'text-[#5A7247]'
          }`}>
            Aktionen
          </span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: maxActionsPerRound }).map((_, i) => (
              <div key={i} className={`w-3.5 h-3.5 rounded-sm border transition-all duration-300 flex items-center justify-center ${
                i < actionsUsed
                  ? 'bg-[#D4CCBA] border-[#B0A898]'
                  : budgetExhausted
                  ? 'bg-rose-100 border-rose-300'
                  : actionsLeft === 1 && i === actionsUsed
                  ? 'bg-amber-100 border-amber-400 animate-pulse'
                  : 'bg-[#5A7247]/15 border-[#5A7247]/40'
              }`}>
                {i < actionsUsed && (
                  <div className="w-1.5 h-1.5 rounded-[1px] bg-[#8B8273]" />
                )}
              </div>
            ))}
          </div>
          {budgetExhausted ? (
            <span className="flex items-center gap-0.5 text-[8.5px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
              <Lock className="w-2.5 h-2.5" /> LIMIT
            </span>
          ) : (
            <span className={`text-[9px] font-mono font-black tabular-nums ${
              actionsLeft === 1 ? 'text-amber-700' : 'text-[#5A7247]'
            }`}>
              {actionsLeft}/{maxActionsPerRound}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Challenge status chips in header */}
          {invasiveThreatEnabled && (
            <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded-md ${
              (stats.biosecurity ?? 100) >= 70 ? 'bg-[#5A7247]/15 text-[#2C3322]'
              : (stats.biosecurity ?? 100) >= 30 ? 'bg-amber-100 text-amber-900'
              : 'bg-rose-100 text-rose-900 animate-pulse'
            }`}>
              🦠 {stats.biosecurity}%
            </span>
          )}
          {energyChallengeEnabled && (
            <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded-md ${
              (stats.renewableEnergy ?? 25) >= 70 ? 'bg-emerald-100 text-emerald-900'
              : (stats.renewableEnergy ?? 25) >= 35 ? 'bg-amber-100 text-amber-900'
              : 'bg-rose-100 text-rose-900 animate-pulse'
            }`}>
              ⚡ {stats.renewableEnergy}%
            </span>
          )}

          {/* Rurtalbahn compact */}
          <div className="flex items-center gap-1.5">
            <Train className={`w-3.5 h-3.5 ${rurtalbahnLeased ? 'text-[#5A7247]' : 'text-[#8B8273]'}`} />
            <span className="text-[9px] text-[#6B6356]">
              {rurtalbahnLeased
                ? `Rurtalbahn aktiv (${rurtalbahnTimeRemaining} Rd.)`
                : 'Rurtalbahn Ticket'}
            </span>
            {!rurtalbahnLeased
              ? <button onClick={leaseRurtalbahn}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-[#5A7247] hover:bg-[#606C38] text-white font-bold cursor-pointer transition-colors">
                  2 €
                </button>
              : <span className="text-[8px] font-black px-1.5 rounded bg-[#D4E0C1] text-[#2C3322] border border-[#5A7247]/20">AKTIV</span>
            }
          </div>
        </div>
      </div>

      {/* ── Slot strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 divide-x divide-[#D4CCBA]">
        {cards.map((c, idx) => {
          const str  = idx + 1;
          const p    = pal(str);
          const sel  = selectedIdx === idx;
          const meta = c.id === 'rurtalbahn_card' ? TYPE_META['rurtalbahn'] : TYPE_META[c.type];

          // Highlight BUILD when energy low, PLANT when bio low
          const isEnergyUrgent = energyChallengeEnabled && (stats.renewableEnergy ?? 25) < 35 && c.type === 'BUILD';
          const isBioUrgent    = invasiveThreatEnabled  && (stats.biosecurity ?? 100) < 30  && c.type === 'PLANT';

          // A slot is "free" for BUILD (locks on tile placement) or when budget remains
          const slotLocked = budgetExhausted && c.type !== 'BUILD';

          return (
            <button
              key={c.id}
              onClick={() => !slotLocked && setSelectedIdx(sel ? null : idx)}
              title={slotLocked ? 'Aktionslimit erreicht – Runde beenden' : undefined}
              className={`relative flex flex-col gap-1.5 p-3 text-left transition-all duration-200 group border-b-2 ${
                slotLocked
                  ? 'bg-[#F7F3ED]/60 border-b-transparent opacity-50 cursor-not-allowed'
                  : sel
                  ? `bg-white ${p.ring} cursor-pointer`
                  : isEnergyUrgent || isBioUrgent
                  ? 'bg-rose-50/60 hover:bg-rose-50/80 border-b-rose-400 animate-pulse cursor-pointer'
                  : 'bg-[#F7F3ED] hover:bg-white/70 border-b-transparent cursor-pointer'
              }`}
            >
              {/* Top: slot label + power bar */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[8.5px] font-mono text-[#8B8273] tracking-widest uppercase">
                  Slot 0{str}
                </span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i}
                      className={`w-1 h-2 rounded-[1px] transition-colors ${i <= str ? p.bar : 'bg-[#D4CCBA]/50'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Card identity */}
              <div className="flex items-center gap-1.5">
                <span className={`${meta.color} group-hover:scale-110 transition-transform duration-150 shrink-0`}>
                  {meta.icon}
                </span>
                <span className="text-[10px] font-black text-[#2C3322] leading-tight line-clamp-2">
                  {c.name}
                </span>
              </div>

              {/* Lvl badge */}
              <span className={`self-start text-[8px] font-mono font-black px-1.5 py-0.5 rounded border ${p.badge}`}>
                ⚡{str}
              </span>

              {/* Urgent indicator dot */}
              {(isEnergyUrgent || isBioUrgent) && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── No slot selected: challenge idle banner ───────────────────────── */}
      {selectedIdx === null && <ChallengeIdleBanner />}

      {/* ── Budget exhausted banner (shown when detail panel is open) ───── */}
      {card && budgetExhausted && !isBuildCard && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-50 border-t border-rose-200">
          <Lock className="w-4 h-4 text-rose-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-rose-700 uppercase tracking-wide">Aktionslimit erreicht</span>
            <p className="text-[9.5px] text-rose-600 leading-snug">
              Du hast alle {maxActionsPerRound} Aktionen dieser Runde verbraucht.
              Klicke auf <strong>„Runde beenden"</strong>, um fortzufahren.
            </p>
          </div>
        </div>
      )}

      {/* ── Detail panel ─────────────────────────────────────────────────── */}
      {card && (
        <div className="bg-white border-t border-[#D4CCBA] p-4">
          <div className="flex gap-4">

            {/* Left: Card info card */}
            <div className={`w-52 shrink-0 rounded-xl border-l-4 p-3 border border-[#D4CCBA]/60 ${
              strength === 1 ? 'border-l-slate-400  bg-slate-50/50'  :
              strength === 2 ? 'border-l-cyan-500   bg-cyan-50/40'   :
              strength === 3 ? 'border-l-amber-500  bg-amber-50/40'  :
              strength === 4 ? 'border-l-purple-500 bg-purple-50/40' :
                               'border-l-[#5A7247]  bg-[#F0F7EC]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded border ${pal(strength).badge}`}>
                  ⚡ Lvl {strength}
                </span>
                <button onClick={() => setSelectedIdx(null)}
                  className="text-[#8B8273] hover:text-[#2C3322] transition-colors cursor-pointer"
                  title="Schließen"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <span className={TYPE_META[typeKey].color}>{TYPE_META[typeKey].icon}</span>
                <h3 className="text-sm font-black text-[#2C3322] leading-tight">{card.name}</h3>
              </div>

              <p className="text-[10px] text-[#6B6356] leading-relaxed mb-3">{card.description}</p>

              <div className="border-t border-[#D4CCBA]/50 pt-2">
                <div className={`text-[8px] font-bold uppercase tracking-wide mb-1 ${pal(strength).text}`}>
                  Effekt bei Stärke {strength}
                </div>
                <p className="text-[10px] text-[#2C3322] italic leading-relaxed bg-[#F7F3ED] p-2 rounded border border-[#D4CCBA]/40">
                  {card.strengthEffects[strength]}
                </p>
              </div>
            </div>

            {/* Right: Type-specific options */}
            <div className="flex-1 min-w-0">
              <OptionsPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
