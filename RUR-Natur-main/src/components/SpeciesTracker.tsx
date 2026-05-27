import React from 'react';
import { Species } from '../types';
import { Leaf, Award, Compass, HeartHandshake } from 'lucide-react';

interface SpeciesTrackerProps {
  speciesList: Species[];
  naturePoints: number;
}

export const SpeciesTracker: React.FC<SpeciesTrackerProps> = ({
  speciesList,
  naturePoints,
}) => {
  return (
    <div className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl p-5 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-[#D4CCBA] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#5A7247]/15 border border-[#5A7247]/30">
            <Leaf className="w-5 h-5 text-[#5A7247]" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-sans text-[#2C3322] flex items-center gap-1.5">
              <span>🦫 Artenschutz-Fortschritt</span>
            </h2>
            <p className="text-xs text-[#6B6356] font-sans mt-0.5">
              Schaffe die richtigen Lebensräume, um bedrohte Arten zurück ins Rurtal zu holen.
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#8B8273]">Natur-Siegpunkte:</div>
          <div className="text-sm font-bold font-mono text-[#5A7247] flex items-center gap-1 justify-end">
            <span>🌿 {naturePoints}</span>
          </div>
        </div>
      </div>

      {/* Species Card Slider/List */}
      <div className="flex-grow overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
        {speciesList.map((species) => {
          const isAktiv = species.currentProgress >= 100;
          const progressColor = isAktiv ? 'bg-[#5A7247]' : 'bg-[#D4A373]';
          
          return (
            <div
              key={species.id}
              className={`border rounded-lg p-3 transition-all duration-200 ${
                isAktiv 
                  ? 'border-[#5A7247]/50 bg-[#D4E0C1]/40' 
                  : 'border-[#D4CCBA] bg-white'
              }`}
            >
              {/* Header species */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl shrink-0" role="img" aria-label={species.name}>
                    {species.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#2C3322]">{species.name}</h4>
                    <p className="text-[9.5px] text-[#6B6356] font-sans italic">{species.latinName}</p>
                  </div>
                </div>

                <div>
                  {isAktiv ? (
                    <span className="text-[9px] bg-[#5A7247]/20 text-[#5A7247] font-mono font-bold px-2 py-0.5 rounded border border-[#5A7247]/30 uppercase">
                      Angesiedelt
                    </span>
                  ) : (
                    <span className="text-[9px] bg-[#E8E2D6] border border-[#D4CCBA] text-[#6B6356] font-mono font-bold px-2 py-0.5 rounded uppercase">
                      Pionierphase ({Math.floor(species.currentProgress)}%)
                    </span>
                  )}
                </div>
              </div>

              {/* description */}
              <p className="text-[11px] text-[#6B6356] leading-snug mt-2 font-sans">
                {species.description}
              </p>

              {/* Requirements Checks */}
              <div className="mt-2.5 bg-[#F7F3ED] rounded border border-[#D4CCBA]/50 p-2 text-[10px] font-sans">
                <span className="font-semibold text-[#6B6356] block mb-1 uppercase tracking-wider text-[8.5px]">Anforderungen für Wiederbesiedlung:</span>
                <ul className="space-y-1 text-[#2C3322]">
                  {species.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-[#5A7247]">✔</span>
                      <span className="leading-snug">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Progress Bar slider */}
              <div className="mt-2.5">
                <div className="flex justify-between text-[9px] text-[#6B6356] mb-1">
                  <span>Habitat-Eignung</span>
                  <span className="font-mono font-bold text-[#2C3322]">{Math.floor(species.currentProgress)}%</span>
                </div>
                <div className="w-full bg-[#DCD4C4] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${progressColor} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${species.currentProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
