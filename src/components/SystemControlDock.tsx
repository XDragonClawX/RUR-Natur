import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, FolderOpen, RotateCcw, HelpCircle, BookOpen, 
  MessageSquare, Sliders, X, Database, LifeBuoy, Info
} from 'lucide-react';

interface SystemControlDockProps {
  saveGame: () => void;
  loadGame: () => void;
  handleUndo: () => void;
  historyLength: number;
  undoActionName?: string;
  onStartTutorial: () => void;
  onShowRules: () => void;
  onShowQuickGuide: () => void;
  onShowFeedback: () => void;
}

export const SystemControlDock: React.FC<SystemControlDockProps> = ({
  saveGame,
  loadGame,
  handleUndo,
  historyLength,
  undoActionName,
  onStartTutorial,
  onShowRules,
  onShowQuickGuide,
  onShowFeedback,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside to maintain perfect user experience
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-5 right-5 z-[100]" ref={menuRef} id="system-control-dock">
      {/* ── Collapsed Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg border transition-all duration-300 active:scale-95 cursor-pointer font-sans select-none relative ${
          isOpen
            ? 'bg-[#5A7247] border-[#415531] text-white'
            : 'bg-white/95 hover:bg-white border-[#D4CCBA] text-[#2C3322] hover:border-[#5A7247]/50'
        }`}
        title="Fluss-Werkzeuge und Spieleinstellungen"
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOpen ? 'bg-white' : 'bg-emerald-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpen ? 'bg-white' : 'bg-emerald-500'}`}></span>
        </span>
        <Sliders className={`w-4 h-4 transition-transform duration-500 ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
        <span className="text-[10px] font-black tracking-widest uppercase font-mono">Werkzeuge &amp; System</span>
      </button>

      {/* ── Expanded Utility Panel console ── */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-[280px] bg-[#FAF8F5]/98 backdrop-blur-md border border-[#D4CCBA] shadow-[0_5px_22px_rgba(0,0,0,0.12)] rounded-2xl p-4 space-y-3.5 animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D4CCBA]/60 pb-2">
            <div>
              <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none">
                System-Optionen
              </div>
              <h3 className="text-xs font-black text-[#2C3322] font-sans mt-0.5">
                🛠️ Werkzeuge &amp; Speichern
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-[#F2EDE4] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section 1: Memory Slots (Save & Load) */}
          <div className="space-y-1.5">
            <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
              <Database className="w-2.5 h-2.5" />
              <span>SPIELSTAND-MANAGEMENT</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  saveGame();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-brand-green/6 hover:bg-brand-green/12 border border-brand-green/18 hover:border-brand-green/35 text-brand-green transition-all active:scale-95 cursor-pointer text-left"
                title="Spielstand im Browser sichern"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[9.5px] font-black font-sans leading-none uppercase tracking-wide">Speichern</span>
              </button>
              
              <button
                onClick={() => {
                  loadGame();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-brand-teal/6 hover:bg-brand-teal/12 border border-brand-teal/18 hover:border-brand-teal/35 text-brand-teal transition-all active:scale-95 cursor-pointer"
                title="Spielstand aus Browser laden"
              >
                <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[9.5px] font-black font-sans leading-none uppercase tracking-wide">Laden</span>
              </button>
            </div>
          </div>

          {/* Section 2: Chrono Action Undo loop */}
          <div className="space-y-1.5 border-t border-[#D4CCBA]/50 pt-2.5">
            <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
              <RotateCcw className="w-2.5 h-2.5" />
              <span>ZEITSCHLEIFE (UNDO)</span>
            </div>
            
            <button
              onClick={() => {
                handleUndo();
  // We can keep open or close as desired
              }}
              disabled={historyLength === 0}
              className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border transition-all duration-150 text-left ${
                historyLength > 0
                  ? 'bg-[#BC6C25]/8 hover:bg-[#BC6C25]/14 border-[#BC6C25]/20 hover:border-[#BC6C25]/45 text-[#9E5314] cursor-pointer'
                  : 'bg-stone-50 border-stone-200/50 text-stone-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase leading-none truncate">Zug zurückziehen</div>
                  {historyLength > 0 && undoActionName && (
                    <div className="text-[8px] opacity-75 truncate leading-none mt-1 font-mono">
                      Wiederherstellen: {undoActionName}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[7.5px] font-mono font-black bg-white/60 px-1 py-0.2 rounded border shadow-3xs shrink-0 self-center">
                {historyLength > 0 ? `${historyLength} Verf.` : 'Kein'}
              </span>
            </button>
          </div>

          {/* Section 3: Manuals & Game Info */}
          <div className="space-y-1.5 border-t border-[#D4CCBA]/50 pt-2.5">
            <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
              <LifeBuoy className="w-2.5 h-2.5" />
              <span>HANDBÜCHER &amp; SYSTEMHILFEN</span>
            </div>

            <div className="space-y-1">
              {/* Tutorial Step Trigger */}
              <button
                onClick={() => {
                  onStartTutorial();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg text-left text-[9.5px] font-bold text-[#5A7247] hover:bg-[#5A7247]/6 transition-all border border-transparent hover:border-[#5A7247]/15 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#5A7247]" />
                <span className="flex-1 uppercase tracking-wide">📖 Einführung starten</span>
              </button>

              {/* Quick Guide */}
              <button
                onClick={() => {
                  onShowQuickGuide();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg text-left text-[9.5px] font-bold text-[#2A6F7E] hover:bg-[#2A6F7E]/6 transition-all border border-transparent hover:border-[#2A6F7E]/15 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-[#2A6F7E]" />
                <span className="flex-1 uppercase tracking-wide">🚀 Kurzanleitung Prototyp</span>
              </button>

              {/* Official Game Rules */}
              <button
                onClick={() => {
                  onShowRules();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg text-left text-[9.5px] font-bold text-[#BC6C25] hover:bg-[#BC6C25]/6 transition-all border border-transparent hover:border-[#BC6C25]/15 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#BC6C25]" />
                <span className="flex-1 uppercase tracking-wide">⚔ Spielanleitung öffnen</span>
              </button>

              {/* Send Feedback System */}
              <button
                onClick={() => {
                  onShowFeedback();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg text-left text-[9.5px] font-bold text-[#6B52AE] hover:bg-[#6B52AE]/6 transition-all border border-transparent hover:border-[#6B52AE]/15 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#6B52AE]" />
                <span className="flex-1 uppercase tracking-wide">✉ System-Feedback geben</span>
              </button>
            </div>
          </div>

          {/* Environmental info stamp */}
          <div className="bg-[#F3EDE2] p-2.5 rounded-xl border border-[#D4CCBA]/70 text-[8.5px] text-[#8B8273] space-y-1">
            <div className="font-bold text-[#5A7247] uppercase tracking-wide">RurNatur Leitfaden-Schnittstelle</div>
            <p className="leading-relaxed">
              Speichern legt einen Cookie im Browser an. Durchgängigkeiten und ökologische Parameter werden kontinuierlich überwacht.
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
