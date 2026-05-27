import React, { useState, useMemo } from 'react';
import {
  ActionCard, ActionCardType, BuildingType, ResearchNode, TileData, GameStats
} from '../types';
import {
  Play, Train, ChevronLeft, Hammer, Leaf, Droplets,
  Coins, Microscope, ArrowRight
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
  BUILD:      { icon: <Hammer   className="w-3.5 h-3.5" />, color: 'text-amber-700',   label: '🏗️' },
  PLANT:      { icon: <Leaf     className="w-3.5 h-3.5" />, color: 'text-[#5A7247]',   label: '🌱' },
  HYDROLOGY:  { icon: <Droplets className="w-3.5 h-3.5" />, color: 'text-[#2A6F7E]',   label: '🌊' },
  FUNDING:    { icon: <Coins    className="w-3.5 h-3.5" />, color: 'text-amber-600',   label: '💶' },
  RESEARCH:   { icon: <Microscope className="w-3.5 h-3.5" />, color: 'text-purple-700', label: '🧪' },
  rurtalbahn: { icon: <Train    className="w-3.5 h-3.5" />, color: 'text-[#2A6F7E]',   label: '🚇' },
};

// ── Building category icons ────────────────────────────────────────────────────
const CAT_ICON: Record<string, string> = {
  ecology: '🌿', water: '💧', fauna: '🦅', economy: '🏭', infrastructure: '🔧', tourism: '🎯'
};

// ─────────────────────────────────────────────────────────────────────────────
export const ActionSlotSystem: React.FC<ActionSlotSystemProps> = ({
  cards, onExecuteCard,
  rurtalbahnLeased, leaseRurtalbahn, rurtalbahnTimeRemaining,
  stats, buildingsCatalog, researchTree, grid,
  onSelectBuilding, onUnlockResearch,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const card     = selectedIdx !== null ? cards[selectedIdx] : null;
  const strength = selectedIdx !== null ? selectedIdx + 1 : 0;
  const typeKey: CardTypeKey = card?.id === 'rurtalbahn_card' ? 'rurtalbahn' : (card?.type ?? 'BUILD');

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

  // ── helpers ────────────────────────────────────────────────────────────────
  const pal = (s: number) => STR_PALETTE[Math.min(s - 1, 4)];

  const execAndClose = () => {
    if (card) { onExecuteCard(card, strength); setSelectedIdx(null); }
  };

  // ── Options panel ──────────────────────────────────────────────────────────
  const OptionsPanel = () => {
    if (!card) return null;

    /* ── BUILD ── */
    if (card.type === 'BUILD') return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#2C3322] uppercase tracking-wide">
            🏗️ Baubare Projekte
          </span>
          <span className="text-[10px] text-[#6B6356]">
            Budget: <strong className="text-[#2C3322]">{stats.budget} €</strong>
            {discount > 0 && <span className="text-brand-green font-bold ml-1">−{discount} € Rabatt</span>}
          </span>
        </div>

        {buildOptions.length === 0 ? (
          <div className="text-center py-8 text-[#8B8273] text-xs bg-[#F7F3ED] rounded-lg border border-[#D4CCBA]/50">
            Kein ausreichendes Budget für Baumaßnahmen.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {buildOptions.map(b => (
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
        )}
      </div>
    );

    /* ── RESEARCH ── */
    if (card.type === 'RESEARCH') return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#2C3322] uppercase tracking-wide">🔬 Forschungen</span>
          <span className="text-[10px] text-[#6B6356]">
            Punkte: <strong className="text-purple-700">{stats.researchPoints} 🧪</strong>
          </span>
        </div>

        {researchNow.length > 0 && (
          <div>
            <div className="text-[9px] text-brand-green font-bold uppercase tracking-wide mb-1.5">
              ✓ Jetzt freischaltbar
            </div>
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
              {researchNow.map(r => (
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

        {researchAfter.length > 0 && (
          <div>
            <div className="text-[9px] text-amber-600 font-bold uppercase tracking-wide mb-1.5">
              ◉ Nach Ausführen erreichbar (+{researchGain[strength] ?? 1} 🧪)
            </div>
            <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
              {researchAfter.map(r => (
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

        {researchNow.length === 0 && researchAfter.length === 0 && (
          <p className="text-center py-5 text-[10px] text-[#8B8273] bg-[#F7F3ED] rounded-lg border border-[#D4CCBA]/50">
            Keine weiteren Forschungen verfügbar.<br />Führe die Karte aus, um Punkte zu sammeln.
          </p>
        )}

        <button onClick={execAndClose}
          className="mt-1 w-full py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Forschungsaktion ausführen (+{researchGain[strength] ?? 1} 🧪)
        </button>
      </div>
    );

    /* ── PLANT ── */
    if (card.type === 'PLANT') {
      const max = strength;
      const actual = Math.min(max, plantableCount);
      return (
        <div className="flex flex-col gap-3">
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
          <button onClick={execAndClose} disabled={plantableCount === 0}
            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              plantableCount > 0
                ? 'bg-[#5A7247] hover:bg-[#3d6830] text-white cursor-pointer'
                : 'bg-[#E8E2D6] text-[#8B8273] cursor-not-allowed'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {plantableCount > 0 ? `${actual} Flächen bepflanzen` : 'Keine freien Flächen'}
          </button>
        </div>
      );
    }

    /* ── HYDROLOGY ── */
    if (card.type === 'HYDROLOGY') {
      const wrrl = (strength * 0.15 * waterTileCount).toFixed(1);
      const ffh  = Math.floor(strength * 2.5 * waterTileCount);
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
          <button onClick={execAndClose}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-[#2A6F7E] hover:bg-[#1f5a6a] text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Hydrologie verbessern
          </button>
        </div>
      );
    }

    /* ── FUNDING ── */
    if (card.type === 'FUNDING') {
      const bud = fundingBudget[strength]   ?? 3;
      const res = fundingResearch[strength] ?? 0;
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
          <button onClick={execAndClose}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Förderung beantragen (+{bud} €)
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
          className="w-full py-2 rounded-lg text-xs font-semibold bg-[#2A6F7E] hover:bg-[#1f5a6a] text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Rurtalbahn-Sonderaktion ausführen
        </button>
      </div>
    );

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#F7F3ED] border border-[#D4CCBA] rounded-xl shadow-sm mb-6 overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#D4CCBA]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#2C3322]">🎴 Aktions-Slot-System</span>
          <span className="text-[9px] bg-[#5A7247]/10 text-[#5A7247] px-2 py-0.5 rounded-full border border-[#5A7247]/22 font-bold uppercase tracking-wide">
            {selectedIdx === null ? 'Slot wählen' : `Slot 0${strength} aktiv`}
          </span>
        </div>

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

      {/* ── Slot strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 divide-x divide-[#D4CCBA]">
        {cards.map((c, idx) => {
          const str  = idx + 1;
          const p    = pal(str);
          const sel  = selectedIdx === idx;
          const meta = c.id === 'rurtalbahn_card' ? TYPE_META['rurtalbahn'] : TYPE_META[c.type];

          return (
            <button
              key={c.id}
              onClick={() => setSelectedIdx(sel ? null : idx)}
              className={`relative flex flex-col gap-1.5 p-3 text-left cursor-pointer transition-all duration-200 group border-b-2 ${
                sel
                  ? `bg-white ${p.ring}`
                  : 'bg-[#F7F3ED] hover:bg-white/70 border-b-transparent'
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
            </button>
          );
        })}
      </div>

      {/* ── Hint when nothing selected ───────────────────────────────────── */}
      {selectedIdx === null && (
        <div className="px-5 py-2 text-center text-[10px] text-[#8B8273] border-t border-[#D4CCBA]/60 bg-white/50">
          Klicke auf einen Slot oben, um die verfügbaren Aktionen zu sehen
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
                  className="text-[#8B8273] hover:text-[#2C3322] transition-colors"
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
