import React from 'react';
import { ActionCard, ActionCardType } from '../types';
import { Play, RotateCcw, Train, AlertCircle } from 'lucide-react';

interface ActionSlotSystemProps {
  cards: ActionCard[];
  onExecuteCard: (card: ActionCard, strength: number) => void;
  rurtalbahnLeased: boolean;
  leaseRurtalbahn: () => void;
  rurtalbahnTimeRemaining: number;
}

export const ActionSlotSystem: React.FC<ActionSlotSystemProps> = ({
  cards,
  onExecuteCard,
  rurtalbahnLeased,
  leaseRurtalbahn,
  rurtalbahnTimeRemaining
}) => {
  return (
    <div className="bg-[#E8E2D6] border border-[#D4CCBA] rounded-xl p-5 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-[#D4CCBA] pb-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-[#2C3322] tracking-tight flex items-center gap-2">
            <span>🎴 Aktions-Slot-System</span>
            <span className="text-xs bg-[#5A7247]/15 text-[#5A7247] px-2 py-0.5 rounded-full uppercase border border-[#5A7247]/30">
              Aktionsreihen-Prinzip
            </span>
          </h2>
          <p className="text-xs text-[#6B6356] mt-1 font-sans">
            Wähle eine Aktion. Je weiter rechts eine Karte liegt (Slot 1 bis 5), desto mächtiger ist ihre Stärke. Nach Nutzung fällt sie zurück auf Slot 1.
          </p>
        </div>

        {/* Rurtalbahn Special action Integration */}
        <div className="flex items-center gap-3 bg-white border border-[#D4CCBA] px-3 py-2 rounded-lg">
          <Train className={`w-5 h-5 ${rurtalbahnLeased ? 'text-[#5A7247] animate-pulse' : 'text-[#8B8273]'}`} />
          <div className="text-left">
            <div className="text-xs font-bold text-[#2C3322]">Rurtalbahn Ticket-Sonderkarte</div>
            <div className="text-[10px] text-[#6B6356]">
              {rurtalbahnLeased 
                ? `Aktiv für noch ${rurtalbahnTimeRemaining} Runden` 
                : 'Ersetzt temporär Slot 1 für Spezialaktionen'}
            </div>
          </div>
          {!rurtalbahnLeased ? (
            <button
              onClick={leaseRurtalbahn}
              className="px-3 py-1 text-xs font-semibold rounded bg-[#5A7247] hover:bg-[#606C38] text-white transition-colors cursor-pointer"
            >
              Ticket (2 €)
            </button>
          ) : (
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#D4E0C1] text-[#2C3322] border border-[#5A7247]/20">
              EINBAHN
            </span>
          )}
        </div>
      </div>

      {/* The 5 slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card, index) => {
          const strength = index + 1; // 1 to 5
          const cardCategoryIcon = 
            card.type === 'BUILD' ? '🏗️' :
            card.type === 'PLANT' ? '🌱' :
            card.type === 'HYDROLOGY' ? '🌊' :
            card.type === 'FUNDING' ? '💶' :
            '🧪';

          return (
            <div
              key={card.id}
              className={`flex flex-col justify-between border rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md bg-white ${
                strength === 1 ? 'border-l-4 border-l-slate-400 border-y-[#D4CCBA] border-r-[#D4CCBA] hover:border-slate-400' :
                strength === 2 ? 'border-l-4 border-l-cyan-500 border-y-[#D4CCBA] border-r-[#D4CCBA] hover:border-cyan-500' :
                strength === 3 ? 'border-l-4 border-l-amber-500 border-y-[#D4CCBA] border-r-[#D4CCBA] hover:border-amber-500' :
                strength === 4 ? 'border-l-4 border-l-purple-500 border-y-[#D4CCBA] border-r-[#D4CCBA] hover:border-purple-500' :
                'border-l-4 border-l-[#5A7247] ring-2 ring-[#5A7247]/30 border-y-[#5A7247] border-r-[#5A7247] shadow-lg'
              }`}
            >
              {/* Header: Slot Power Indicator */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#F7F3ED] border-b border-[#D4CCBA]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono tracking-widest text-[#8B8273] uppercase">
                    Slot 0{strength}
                  </span>
                  {/* Visual Power Cells Meter block */}
                  <div className="flex gap-0.5 ml-1 select-none">
                    {[1, 2, 3, 4, 5].map((cellIdx) => {
                      const isActive = cellIdx <= strength;
                      return (
                        <div
                          key={cellIdx}
                          className={`w-1.5 h-3 rounded-[1px] transition-colors duration-200 ${
                            isActive
                              ? strength === 1 ? 'bg-slate-400' :
                                strength === 2 ? 'bg-cyan-500' :
                                strength === 3 ? 'bg-amber-500' :
                                strength === 4 ? 'bg-purple-500' :
                                'bg-[#5A7247] animate-pulse'
                              : 'bg-slate-200/50'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
                <span className={`text-[9px] font-mono font-black tracking-tight px-1.5 py-0.5 rounded-md ${
                  strength === 1 ? 'bg-slate-100 text-slate-700 border border-slate-300/40' :
                  strength === 2 ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' :
                  strength === 3 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                  strength === 4 ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                  'bg-[#D4E0C1] text-[#2C3322] border border-[#5A7247]'
                }`}>
                  ⚡ Lvl {strength}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-2 mb-2 justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{cardCategoryIcon}</span>
                      <h3 className="text-sm font-black text-[#2C3322] tracking-tight leading-tight">
                        {card.name}
                      </h3>
                    </div>
                    {/* Compact circular badge indicating current strength level */}
                    <span 
                      className={`text-[10.5px] font-mono font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                        strength === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        strength === 2 ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                        strength === 3 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        strength === 4 ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        'bg-[#D4E0C1] text-[#2C3322] border-2 border-[#5A7247]'
                      }`}
                      title={`Aktionsstärke: ${strength}`}
                    >
                      {strength}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-[#6B6356] leading-normal mb-3">
                    {card.description}
                  </p>

                  {/* Dynamic effect based on containing slot strength */}
                  <div className="mt-2 pt-2 border-t border-[#D4CCBA]/50">
                    <div className="text-[10px] font-semibold text-[#5A7247] uppercase tracking-wide flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3 h-3 text-[#5A7247]" />
                      Effekt bei Stärke {strength}:
                    </div>
                    <p className="text-[11px] text-[#2C3322] font-sans leading-relaxed italic bg-[#F7F3ED] p-1.5 rounded border border-[#D4CCBA]/40">
                      {card.strengthEffects[strength]}
                    </p>
                  </div>
                </div>

                {/* Execute Button */}
                <button
                  type="button"
                  onClick={() => onExecuteCard(card, strength)}
                  className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    strength === 5
                      ? 'bg-[#5A7247] hover:bg-[#606C38] text-white shadow-sm shadow-[#5A7247]/20 btn-primary'
                      : 'bg-[#E8E2D6] hover:bg-[#DCD4C4] text-[#2C3322] border border-[#D4CCBA]/60'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Aktion ausführen</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
