import React from 'react';
import { PaperFactoryMode, GameStats, ResearchNode } from '../types';
import { Factory, AlertTriangle } from 'lucide-react';

interface SchoellershammerConsoleProps {
  stats: GameStats;
  onChangeMode: (mode: PaperFactoryMode) => void;
  researchTree: ResearchNode[];
}

export const SchoellershammerConsole: React.FC<SchoellershammerConsoleProps> = ({
  stats,
  onChangeMode,
  researchTree,
}) => {
  const isRenaturizationTechUnlocked = researchTree.find(
    r => r.id === 'schoeller_renat'
  )?.unlocked || false;

  const modesInfo = [
    {
      id: 'PRODUCTION' as PaperFactoryMode,
      name: 'Vollbetrieb (Industrielle Produktion)',
      budgetEffect: '+15 €/Runde',
      ecologyEffect: '-1,0 Flussqualität pro Jahr regional. Erwärmt das Wasser.',
      rurtalbahnEffect: 'Blockiert Güterbahnen (Personenverkehr priorisiert) -> Gleis-Rabatte deaktiviert.',
      socialEffect: 'Sehr hohe Akzeptanz bei Arbeitgebern & Arbeitnehmern (Steuereinnahmen hoch, Arbeitsplätze gesichert).',
      colorClass: 'border-[#D4CCBA] text-[#8B4513] bg-white hover:border-[#BC6C25]',
      activeColor: 'border-[#BC6C25] bg-red-50 text-[#8B4513] ring-1 ring-[#BC6C25]/20'
    },
    {
      id: 'RETROFITTING' as PaperFactoryMode,
      name: 'Umrüstung (Reinigungskreisläufe & CO2-Neutral)',
      budgetEffect: '+5 €/Runde',
      ecologyEffect: 'Neutraler Abflusseinfluss. Keine weitere Belastung.',
      rurtalbahnEffect: 'Schaltet Schienenzufluss teilweise frei. Gleis-Rabatte reaktiviert.',
      socialEffect: 'Forschungsförderung hoch: Generiert +1 Forschungspunkt/Runde.',
      colorClass: 'border-[#D4CCBA] text-yellow-800 bg-white hover:border-yellow-600',
      activeColor: 'border-yellow-600 bg-yellow-50 text-yellow-905 ring-1 ring-yellow-500/20'
    },
    {
      id: 'SHUTDOWN' as PaperFactoryMode,
      name: 'Temporäre Stilllegung (Ruhender Kessel)',
      budgetEffect: '-2 €/Runde (Sicherungsgebühr)',
      ecologyEffect: 'Flusswasser klärt langsam auf. Flussqualität steigt um +0.5 pro Jahr.',
      rurtalbahnEffect: 'Gleiskorridor frei für Bautransporte. Gleis-Rabatte aktiv.',
      socialEffect: 'Proteste von Gewerkschaften wegen befürchteter Kurzarbeit. -10% Natur-Akzeptanz temporär.',
      colorClass: 'border-[#D4CCBA] text-[#457B9D] bg-white hover:border-[#457B9D]',
      activeColor: 'border-[#457B9D] bg-sky-50 text-[#457B9D] ring-1 ring-[#457B9D]/20'
    },
    {
      id: 'RENATURIZATION' as PaperFactoryMode,
      name: 'Renaturierter Fluss-Forschungspark',
      budgetEffect: '-3 €/Runde (Subventioniert)',
      ecologyEffect: 'Absoluter Naturoase-Zustand! FFH-Potenzial ungedeckelt (+35 in Düren).',
      rurtalbahnEffect: 'Komplette Transformation zum Öko-Express-Knotenpunkt.',
      socialEffect: 'Globale Vorzeige-Kompensation. Ermöglicht Wildlachse in der gesamten Rur!',
      locked: !isRenaturizationTechUnlocked,
      colorClass: 'border-[#D4CCBA] text-[#5A7247] bg-white hover:border-[#5A7247]',
      activeColor: 'border-[#5A7247] bg-[#D4E0C1] text-[#2C3322] ring-1 ring-[#5A7247]/30'
    }
  ];

  return (
    <div className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl p-5 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4 border-b border-[#D4CCBA] pb-3">
        <div className="p-1.5 rounded bg-[#D4A373]/15 border border-[#D4A373]/30">
          <svg className="w-5 h-5 text-[#BC6C25]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 22h20V10l-4-4V2H6v4L2 10v12zm4-12l2-2h4l2 2v10H6V10zm10 10v-6h2v6h-2z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold font-sans text-[#2C3322]">
            Papierfabrik Schoellershammer DÜREN
          </h2>
          <p className="text-xs text-[#6B6356] font-sans mt-0.5">
            Der ökonomische Spannungskern der Rur-Renaturierung.
          </p>
        </div>
      </div>

      {/* Historical Facts & Lore Alert */}
      <div className="mb-4 bg-[#E8E2D6] p-3 rounded-lg border border-[#D4CCBA] text-xs font-sans leading-relaxed text-[#2C3322]">
        <span className="font-bold text-[#2C3322]">Hintergrund:</span> Das Papiergewerbe prägt Düren seit dem 16. Jahrhundert. Die Rur lieferte weiches Wasser zur Energie- und Papiererzeugung, wurde dadurch aber massiv kanalisiert und historisch verschmutzt. Deine Entscheidung bestimmt den Spagat zwischen Industrie-Identität und FFH-Artenschutz!
      </div>

      {/* Mode selectors */}
      <div className="flex-grow overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
        {modesInfo.map((mode) => {
          const isActive = stats.paperFactoryMode === mode.id;
          
          return (
            <div
              key={mode.id}
              onClick={() => {
                if (!mode.locked) {
                  onChangeMode(mode.id);
                }
              }}
              className={`border rounded-lg p-3 transition-all duration-200 ${
                mode.locked 
                  ? 'opacity-40 cursor-not-allowed bg-[#E8E2D6]/40 border-[#D4CCBA]' 
                  : 'cursor-pointer'
              } ${
                isActive 
                  ? mode.activeColor 
                  : `${mode.colorClass}`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {mode.id === 'PRODUCTION' ? '🏭' :
                     mode.id === 'RETROFITTING' ? '⚡' :
                     mode.id === 'SHUTDOWN' ? '🔑' : '🌱'}
                  </span>
                  <span className="text-xs font-bold leading-tight">{mode.name}</span>
                </div>
                {isActive && (
                  <span className="bg-[#5A7247]/20 text-[#5A7247] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#5A7247]/30">
                    AKTIV
                  </span>
                )}
                {mode.locked && (
                  <span className="bg-red-50 text-red-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-red-200">
                    GESPERRT (Forschung)
                  </span>
                )}
              </div>

              {/* Impact parameters grid */}
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-sans border-t border-[#D4CCBA]/50 pt-2 text-[#2C3322]">
                <div>
                  <span className="font-semibold text-[#6B6356]">Haushalt:</span> {mode.budgetEffect}
                </div>
                <div>
                  <span className="font-semibold text-[#6B6356]">WRRL:</span> {mode.ecologyEffect}
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold text-[#6B6356]">Rurtalbahn:</span> {mode.rurtalbahnEffect}
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold text-[#6B6356]">Sozialer Spagat:</span> {mode.socialEffect}
                </div>
              </div>

              {/* Informative warning on unlocked conditions */}
              {mode.locked && (
                <div className="mt-2 text-[9px] text-[#BC6C25] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-[#BC6C25]" />
                  <span>Erfordert Technologie &quot;Fabrik-Transformationskonzept&quot; (Forschung)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Schoellershammer Operational Summary Gauge */}
      <div className="mt-4 p-3 bg-[#E8E2D6]/60 border border-[#D4CCBA] rounded-lg">
        <div className="flex justify-between items-center text-xs text-[#6B6356] mb-1">
          <span>Fabrik-Einfluss auf Kreisdürener Rurwasser (WRRL):</span>
          <span className={`font-bold ${
            stats.paperFactoryMode === 'PRODUCTION' ? 'text-red-700' :
            stats.paperFactoryMode === 'RETROFITTING' ? 'text-yellow-700' :
            'text-[#5A7247]'
          }`}>
            {stats.paperFactoryMode === 'PRODUCTION' ? 'Belastend (-1.0/Runde)' :
             stats.paperFactoryMode === 'RETROFITTING' ? 'Stabilisierend' :
             stats.paperFactoryMode === 'SHUTDOWN' ? 'Regenerativ (+0.5/Runde)' :
             'Optimaler Auenzustand (+2.0/Runde)'}
          </span>
        </div>
      </div>
    </div>
  );
};
