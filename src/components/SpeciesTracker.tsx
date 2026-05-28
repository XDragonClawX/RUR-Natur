import React from 'react';
import { Species } from '../types';
import { Leaf, CheckCircle2, Circle, Activity, Award } from 'lucide-react';

interface SpeciesTrackerProps {
  speciesList: Species[];
  naturePoints: number;
}

export const SpeciesTracker: React.FC<SpeciesTrackerProps> = ({
  speciesList,
  naturePoints,
}) => {
  const settledCount = speciesList.filter(s => s.unlocked || s.currentProgress >= 100).length;
  const inProgressCount = speciesList.filter(s => !s.unlocked && s.currentProgress < 100 && s.currentProgress > 0).length;

  return (
    <div className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl shadow-sm flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#D4CCBA]/70 flex items-start gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-[#5A7247]/15 border border-[#5A7247]/30 mt-0.5">
          <Leaf className="w-5 h-5 text-[#5A7247]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-black font-sans text-[#2C3322] leading-tight">
              Artenschutz-Fortschritt
            </h2>
            <span className="text-[9px] font-mono font-black text-[#6B6356] bg-[#E8E2D6] px-1.5 py-0.5 rounded border border-[#D4CCBA]">
              BIOTOP
            </span>
          </div>
          <p className="text-[10px] text-[#6B6356] mt-0.5 leading-snug">
            Schaffe die richtigen Lebensräume, um bedrohte Arten zurück ins Rurtal zu holen.
          </p>
        </div>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-[#D4CCBA]/50 shrink-0">
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Natur-Punkte
          </div>
          <div className="text-sm font-black font-mono text-[#5A7247]">
            {naturePoints}
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Angesiedelt
          </div>
          <div className="text-sm font-black font-mono text-[#5A7247]">
            {settledCount}/{speciesList.length}
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">
            Pionierphase
          </div>
          <div className={`text-sm font-black font-mono ${inProgressCount > 0 ? 'text-amber-600' : 'text-[#8B8273]'}`}>
            {inProgressCount}
          </div>
        </div>
      </div>

      {/* ── Species List ─────────────────────────────────────────────────── */}
      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
        <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Activity className="w-2.5 h-2.5" />
          Leitarten im Rurtal
        </div>

        {speciesList.map((species) => {
          const isSettled = species.currentProgress >= 100;
          const accentColor = isSettled ? '#5A7247' : '#BC6C25';

          return (
            <div
              key={species.id}
              className={[
                'border-l-4 border rounded-r-xl rounded-l-none p-3 transition-all duration-200',
                isSettled ? 'bg-[#D4E0C1]/40' : 'bg-white/70',
              ].join(' ')}
              style={{ borderLeftColor: accentColor }}
            >
              {/* Row 1: Species icon + name + status badge */}
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-2xl shrink-0 leading-none" role="img" aria-label={species.name}>
                  {species.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black text-[#2C3322] leading-tight">{species.name}</span>
                    {isSettled ? (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-[#5A7247]/15 text-[#5A7247] border-[#5A7247]/30 uppercase flex items-center gap-1">
                        <Award className="w-2.5 h-2.5" />
                        Angesiedelt
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 uppercase">
                        {Math.floor(species.currentProgress)}%
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-[#8B8273] italic">{species.latinName}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[10px] text-[#6B6356] leading-snug mb-2">
                {species.description}
              </p>

              {/* Requirements */}
              <div className="bg-[#F7F3ED] rounded-lg border border-[#D4CCBA]/50 p-2">
                <span className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider block mb-1.5">
                  Anforderungen
                </span>
                <ul className="space-y-1">
                  {species.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[9.5px] text-[#2C3322]">
                      {isSettled ? (
                        <CheckCircle2 className="w-3 h-3 text-[#5A7247] shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-3 h-3 text-[#B0A898] shrink-0 mt-0.5" />
                      )}
                      <span className="leading-snug">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-[#6B6356] font-semibold">Habitat-Eignung</span>
                  <span className="text-[9px] font-mono font-black text-[#2C3322]">
                    {Math.floor(species.currentProgress)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#DCD4C4] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${species.currentProgress}%`,
                      backgroundColor: accentColor,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
