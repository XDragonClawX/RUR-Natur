import React, { useState } from 'react';
import { PaperFactoryMode, GameStats, ResearchNode } from '../types';
import {
  Factory, AlertTriangle, Zap, PauseCircle, Leaf,
  Coins, Waves, TrainFront, Users, TrendingDown,
  CheckCircle2, Lock, ChevronDown, ChevronUp, Activity
} from 'lucide-react';

interface SchoellershammerConsoleProps {
  stats: GameStats;
  onChangeMode: (mode: PaperFactoryMode) => void;
  researchTree: ResearchNode[];
}

// ─── Mode metadata ──────────────────────────────────────────────────────────
const MODE_CONFIG = {
  PRODUCTION: {
    icon: <Factory className="w-4 h-4" />,
    label: 'Vollbetrieb',
    sublabel: 'Industrielle Produktion',
    accentColor: '#BC6C25',
    borderClass: 'border-l-[#BC6C25]',
    activeBg: 'bg-orange-50',
    pillClass: 'bg-orange-100 text-orange-800 border-orange-300/60',
  },
  RETROFITTING: {
    icon: <Zap className="w-4 h-4" />,
    label: 'Umrüstung',
    sublabel: 'Reinigung & CO₂-Neutral',
    accentColor: '#CA8A04',
    borderClass: 'border-l-amber-500',
    activeBg: 'bg-amber-50',
    pillClass: 'bg-amber-100 text-amber-800 border-amber-300/60',
  },
  SHUTDOWN: {
    icon: <PauseCircle className="w-4 h-4" />,
    label: 'Stilllegung',
    sublabel: 'Ruhender Kessel',
    accentColor: '#457B9D',
    borderClass: 'border-l-[#457B9D]',
    activeBg: 'bg-sky-50',
    pillClass: 'bg-sky-100 text-sky-800 border-sky-300/60',
  },
  RENATURIZATION: {
    icon: <Leaf className="w-4 h-4" />,
    label: 'Forschungspark',
    sublabel: 'Renaturierter Fluss',
    accentColor: '#5A7247',
    borderClass: 'border-l-[#5A7247]',
    activeBg: 'bg-green-50',
    pillClass: 'bg-green-100 text-green-800 border-green-300/60',
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function WRRLBar({ mode }: { mode: PaperFactoryMode }) {
  const barConfig = {
    PRODUCTION:    { pct: 15,  color: 'bg-red-400',    label: 'Belastend',      labelColor: 'text-red-700'     },
    RETROFITTING:  { pct: 50,  color: 'bg-amber-400',  label: 'Stabilisierend', labelColor: 'text-amber-700'   },
    SHUTDOWN:      { pct: 70,  color: 'bg-sky-400',    label: 'Regenerativ',    labelColor: 'text-sky-700'     },
    RENATURIZATION:{ pct: 100, color: 'bg-[#5A7247]',  label: 'Optimal',        labelColor: 'text-[#5A7247]'  },
  };
  const c = barConfig[mode];
  return (
    <div className="mt-3 pt-3 border-t border-[#D4CCBA]/60">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B6356] uppercase tracking-wider">
          <Waves className="w-3 h-3" />
          WRRL Rurwasser-Zustand
        </span>
        <span className={`text-[10px] font-black ${c.labelColor}`}>{c.label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#D4CCBA]/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${c.color}`}
          style={{ width: `${c.pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const SchoellershammerConsole: React.FC<SchoellershammerConsoleProps> = ({
  stats,
  onChangeMode,
  researchTree,
}) => {
  const [loreExpanded, setLoreExpanded] = useState(false);

  const isRenaturizationTechUnlocked = researchTree.find(
    r => r.id === 'schoeller_renat'
  )?.unlocked || false;

  const penalty = stats.factoryObsolescencePenalty ?? 0;
  const modernizationGrade = Math.max(0, 100 - penalty * 20);
  const activeCfg = MODE_CONFIG[stats.paperFactoryMode];

  const getYearStatus = (y: number) => {
    const curYear = stats.year;
    if (y > curYear) return { label: 'Ausstehend', cls: 'text-stone-400 bg-stone-100 border-stone-200/60' };
    if (y === curYear) {
      if (stats.paperFactoryMode !== 'PRODUCTION') return { label: 'Ruhend', cls: 'text-indigo-700 bg-indigo-50 border-indigo-200/50' };
      return stats.investedThisYear
        ? { label: 'Gesichert ✓', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200/60' }
        : { label: 'Wartung nötig ⚠', cls: 'text-amber-700 bg-amber-50 border-amber-200/60' };
    }
    const pastYearsPassed = curYear - 2026;
    let isPenaltyYear = false;
    if (pastYearsPassed > 0) {
      if (y === 2026 && penalty >= 1) isPenaltyYear = true;
      if (y === 2027 && penalty >= 2) isPenaltyYear = true;
      if (y === 2028 && penalty >= 3) isPenaltyYear = true;
    }
    return isPenaltyYear
      ? { label: '-1 € Abzug', cls: 'text-red-700 bg-red-50 border-red-200/60' }
      : { label: 'Gepflegt ✓',  cls: 'text-emerald-700 bg-emerald-50/70 border-emerald-200/50' };
  };

  const modesInfo = [
    {
      id: 'PRODUCTION' as PaperFactoryMode,
      budget: stats.factoryObsolescencePenalty && stats.factoryObsolescencePenalty > 0
        ? `+${Math.max(5, 15 - stats.factoryObsolescencePenalty)} €`
        : '+15 €',
      budgetNote: penalty > 0 ? `(Abzug: -${penalty} €)` : 'pro Runde',
      ecology: '-1,0 Flussqualität / Jahr',
      train: 'Gleis-Rabatte deaktiviert',
      social: 'Hohe Akzeptanz, gesicherte Arbeitsplätze',
    },
    {
      id: 'RETROFITTING' as PaperFactoryMode,
      budget: '+5 €',
      budgetNote: 'pro Runde',
      ecology: 'Kein Negativeinfluss',
      train: 'Gleis-Rabatte reaktiviert',
      social: '+1 Forschungspunkt / Runde',
    },
    {
      id: 'SHUTDOWN' as PaperFactoryMode,
      budget: '-2 €',
      budgetNote: 'Sicherungsgebühr',
      ecology: '+0,5 Flussqualität / Jahr',
      train: 'Bautransporte priorisiert',
      social: '-10% Natur-Akzeptanz temporär',
    },
    {
      id: 'RENATURIZATION' as PaperFactoryMode,
      budget: '-3 €',
      budgetNote: 'Subventioniert',
      ecology: 'FFH-Potenzial ungedeckelt',
      train: 'Öko-Express-Knotenpunkt',
      social: 'Globales Vorzeige-Projekt',
      locked: !isRenaturizationTechUnlocked,
    },
  ];

  return (
    <div
      id="SchoellershammerConsole"
      className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl shadow-sm flex flex-col h-full overflow-hidden"
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#D4CCBA]/70 flex items-start gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-[#D4A373]/15 border border-[#D4A373]/30 mt-0.5">
          <Factory className="w-5 h-5 text-[#BC6C25]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-black font-sans text-[#2C3322] leading-tight">
              Papierfabrik Schoellershammer
            </h2>
            <span className="text-[9px] font-mono font-black text-[#6B6356] bg-[#E8E2D6] px-1.5 py-0.5 rounded border border-[#D4CCBA]">
              DÜREN
            </span>
          </div>
          {/* Active mode badge */}
          <div
            className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold ${activeCfg.pillClass}`}
            style={{ borderLeftColor: activeCfg.accentColor, borderLeftWidth: '3px' }}
          >
            {activeCfg.icon}
            <span>{activeCfg.label}</span>
            <span className="opacity-60">— {activeCfg.sublabel}</span>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-[#D4CCBA]/50 shrink-0">
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Ertrag / Runde
          </div>
          <div className={`text-sm font-black font-mono ${penalty > 0 ? 'text-amber-700' : 'text-[#2C3322]'}`}>
            {stats.paperFactoryMode === 'PRODUCTION'
              ? `+${Math.max(5, 15 - penalty)} €`
              : stats.paperFactoryMode === 'RETROFITTING' ? '+5 €'
              : stats.paperFactoryMode === 'SHUTDOWN' ? '-2 €'
              : '-3 €'}
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Modernität
          </div>
          <div className={`text-sm font-black font-mono ${modernizationGrade < 80 ? 'text-amber-700' : 'text-[#5A7247]'}`}>
            {modernizationGrade}%
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Jahres-Status
          </div>
          <div className={`text-[10px] font-black leading-tight ${stats.investedThisYear ? 'text-[#5A7247]' : 'text-amber-700'}`}>
            {stats.investedThisYear ? '✓ Gesichert' : '⚠ Wartung'}
          </div>
        </div>
      </div>

      {/* ── Scrollable Body ──────────────────────────────────────────────── */}
      <div className="flex-grow overflow-y-auto custom-scrollbar">

        {/* Obsolescence Alert */}
        {(penalty > 0 || !stats.investedThisYear) && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200/80 rounded-lg p-2.5">
            <TrendingDown className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-amber-800 leading-snug">
              <span className="font-black">Veraltungsdruck aktiv.</span>{' '}
              {penalty > 0
                ? <>Dauerhafte Ertragsminderung: <span className="font-black">-{penalty} €/Runde.</span></>
                : <>Noch keine Investition dieses Jahr — Abzug droht zum Jahresende.</>}
            </div>
          </div>
        )}

        {/* Lore collapsible */}
        <div className="mx-4 mt-3">
          <button
            onClick={() => setLoreExpanded(v => !v)}
            className="w-full flex items-center justify-between text-[9.5px] font-bold text-[#6B6356] hover:text-[#2C3322] transition-colors cursor-pointer"
          >
            <span className="uppercase tracking-wider font-mono">Historischer Hintergrund</span>
            {loreExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {loreExpanded && (
            <div className="mt-1.5 text-[10px] text-[#6B6356] leading-relaxed bg-[#EAE4D8]/50 p-2.5 rounded-lg border border-[#D4CCBA]/60">
              Das Papiergewerbe prägt Düren seit dem 16. Jahrhundert. Die Rur lieferte weiches Wasser zur Energie- und Papiererzeugung, wurde dadurch aber massiv kanalisiert und historisch verschmutzt. Deine Entscheidung bestimmt den Spagat zwischen Industrie-Identität und FFH-Artenschutz!
            </div>
          )}
        </div>

        {/* ── Mode Selector Cards ───────────────────────────────────────── */}
        <div className="px-4 mt-4 space-y-2">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Activity className="w-2.5 h-2.5" />
            Betriebsmodus wählen
          </div>

          {modesInfo.map((mode) => {
            const cfg = MODE_CONFIG[mode.id];
            const isActive = stats.paperFactoryMode === mode.id;
            const locked = !!mode.locked;

            return (
              <div
                key={mode.id}
                onClick={() => { if (!locked) onChangeMode(mode.id); }}
                className={[
                  'border-l-4 border rounded-r-xl rounded-l-none p-3 transition-all duration-200 select-none',
                  locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  isActive
                    ? `${cfg.activeBg} border-[#D4CCBA] shadow-sm`
                    : 'bg-white/60 border-[#D4CCBA] hover:bg-white/90 hover:shadow-sm',
                ].join(' ')}
                style={{ borderLeftColor: cfg.accentColor }}
              >
                {/* Row 1: Icon + Name + Active/Locked badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: cfg.accentColor }}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-black text-[#2C3322] leading-tight block">
                      {cfg.label}
                    </span>
                    <span className="text-[9px] text-[#6B6356]">{cfg.sublabel}</span>
                  </div>
                  {isActive && (
                    <span className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded border bg-white/80"
                      style={{ color: cfg.accentColor, borderColor: `${cfg.accentColor}40` }}>
                      AKTIV
                    </span>
                  )}
                  {locked && (
                    <span className="flex items-center gap-0.5 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">
                      <Lock className="w-2.5 h-2.5" />
                      GESPERRT
                    </span>
                  )}
                </div>

                {/* Row 2: Effect chips */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {/* Budget */}
                  <div className="flex items-start gap-1.5">
                    <Coins className="w-3 h-3 shrink-0 text-[#8B8273] mt-0.5" />
                    <div className="min-w-0">
                      <span className={`text-[11px] font-black block leading-none ${
                        mode.budget.startsWith('+') ? 'text-[#5A7247]'
                        : mode.budget.startsWith('-') ? 'text-red-600'
                        : 'text-[#2C3322]'
                      }`}>{mode.budget}</span>
                      <span className="text-[8.5px] text-[#8B8273] leading-none">{mode.budgetNote}</span>
                    </div>
                  </div>
                  {/* Ecology */}
                  <div className="flex items-start gap-1.5">
                    <Waves className="w-3 h-3 shrink-0 text-[#8B8273] mt-0.5" />
                    <span className="text-[9px] text-[#6B6356] leading-tight">{mode.ecology}</span>
                  </div>
                  {/* Train */}
                  <div className="flex items-start gap-1.5">
                    <TrainFront className="w-3 h-3 shrink-0 text-[#8B8273] mt-0.5" />
                    <span className="text-[9px] text-[#6B6356] leading-tight">{mode.train}</span>
                  </div>
                  {/* Social */}
                  <div className="flex items-start gap-1.5">
                    <Users className="w-3 h-3 shrink-0 text-[#8B8273] mt-0.5" />
                    <span className="text-[9px] text-[#6B6356] leading-tight">{mode.social}</span>
                  </div>
                </div>

                {locked && (
                  <div className="mt-2 flex items-center gap-1 text-[9px] text-[#BC6C25] font-semibold">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Erfordert Forschung: &bdquo;Fabrik-Transformationskonzept&ldquo;
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Maintenance Audit Table ────────────────────────────────────── */}
        <div className="mx-4 mt-4 mb-4">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-2.5 h-2.5" />
              Wartungs-Audit
            </span>
            <span className="bg-white/60 border border-[#D4CCBA]/60 px-1.5 py-0.5 rounded text-[7.5px]">
              S-PORTAL
            </span>
          </div>

          <div className="bg-white/70 border border-[#D4CCBA]/70 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[48px_1fr_88px] bg-[#F2EDE4] border-b border-[#D4CCBA]/60 px-3 py-1.5 text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider">
              <span>Jahr</span>
              <span>Status</span>
              <span className="text-right">Abzug</span>
            </div>
            {/* Table rows */}
            {[2026, 2027, 2028, 2029].map((y) => {
              const s = getYearStatus(y);
              const isCurrent = y === stats.year;
              return (
                <div
                  key={y}
                  className={`grid grid-cols-[48px_1fr_88px] items-center px-3 py-2 border-b last:border-b-0 border-[#D4CCBA]/30 ${isCurrent ? 'bg-[#F2EDE4]/60' : ''}`}
                >
                  <span className={`font-mono text-[10px] font-bold ${isCurrent ? 'text-[#2C3322]' : 'text-[#6B6356]'}`}>
                    {y}
                    {isCurrent && <span className="ml-1 text-[7px] text-[#5A7247] font-black">↑ Aktuell</span>}
                  </span>
                  <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded border mr-1 ${s.cls}`}>
                    {s.label}
                  </span>
                  <span className={`text-[9px] font-mono font-black text-right ${
                    s.label.includes('-1') ? 'text-red-600' : 'text-[#8B8273]'
                  }`}>
                    {s.label.includes('-1') ? '-1 €' : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-2 text-[9px] text-[#8B8273] leading-snug">
            Pro Jahr ohne Investition verliert der Vollbetrieb dauerhaft <strong className="text-[#6B6356]">-1 €/Runde</strong>.
          </p>
        </div>

      </div>

      {/* ── WRRL Gauge Footer ────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-2 border-t border-[#D4CCBA]/60 shrink-0 bg-[#EAE4D8]/40">
        <WRRLBar mode={stats.paperFactoryMode} />
      </div>
    </div>
  );
};
