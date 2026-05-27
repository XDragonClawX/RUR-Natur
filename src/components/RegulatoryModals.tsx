import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Info, Leaf, Droplets, CheckCircle2, AlertTriangle, 
  HelpCircle, Sparkles, Compass, Shield, Award, Landmark 
} from 'lucide-react';
import { GameStats, Species, TileData } from '../types';

interface RegulatoryModalsProps {
  showNatura: boolean;
  onCloseNatura: () => void;
  showWrrl: boolean;
  onCloseWrrl: () => void;
  stats: GameStats;
  speciesList: Species[];
  grid: TileData[][];
}

export const RegulatoryModals: React.FC<RegulatoryModalsProps> = ({
  showNatura,
  onCloseNatura,
  showWrrl,
  onCloseWrrl,
  stats,
  speciesList,
  grid,
}) => {
  // Count specific game items for the calculator
  const auwaldCount = grid.flat().filter(t => t.terrain === 'Auwald').length;
  const naturalRiverbankCount = grid.flat().filter(t => t.buildingId === 'ufer_renaturierung' || t.buildingId === 'kiesbank').length;
  const isBiberManagementUnlocked = speciesList.some(s => s.id === 'biber' && s.unlocked);
  const activeSpeciesCount = speciesList.filter(s => s.unlocked || s.currentProgress >= 100).length;

  return (
    <AnimatePresence>
      {/* ── NATURA 2000 MODAL ── */}
      {showNatura && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 text-[#2C3322]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="bg-[#F8F6F2] border-4 border-[#3F633E] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans"
          >
            {/* Modal Brand Header */}
            <div className="bg-gradient-to-r from-[#2F4F2F] to-[#436E42] p-5 shrink-0 flex items-center justify-between text-white relative">
              {/* European Star Ring overlay pattern */}
              <div className="absolute right-12 opacity-8 select-none pointer-events-none text-6xl">
                🇪🇺
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/12 p-2 rounded-xl border border-white/20">
                  <Leaf className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#B3DFB2] uppercase font-black block">
                    EU-Flora-Fauna-Habitat Guidelines
                  </span>
                  <h3 className="text-lg font-black font-display text-white">
                    🇪🇺 Natura 2000 Fluss-Schutzgebiet Rur
                  </h3>
                </div>
              </div>
              <button
                onClick={onCloseNatura}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Workspace */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Summary Goal Intro Card */}
              <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <div className="p-1.5 bg-emerald-500 text-white rounded-lg shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-xs leading-relaxed text-[#2C3520]">
                  Das europäische Schutzgebietsnetz **Natura 2000** schützt wildlebende Pflanzen- und Tierarten sowie deren natürliche Lebensräume. Im Landkreis Düren umfasst dies vor allem die schützenswerten **Hartholz-Auwälder**, die Rurböschungen und gefährdete Leitarten wie den **Eurasischen Biber (Castor fiber)**.
                </p>
              </div>

              {/* Game Mechanics Integration Block */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black tracking-widest text-[#3F633E] uppercase border-b border-[#3F633E]/15 pb-1 flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>SPIEL-Schnittstelle: FFH &amp; Artenschutz</span>
                </h4>
                <p className="text-[11px] text-[#5A5E53] leading-relaxed">
                  Deine Bemühungen zur Tier- und Biotopanpflanzung im Rurtal spiegeln sich direkt im globalen **FFH-Artenschutzindex (🌿)** wider.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-[#D4CCBA] flex flex-col justify-between">
                    <div>
                      <div className="text-[9px] font-mono font-bold text-[#8B8273] uppercase">FFH-Qualitäts-Level</div>
                      <div className="text-xl font-black text-brand-green mt-1">
                        {stats.globalFfh}%
                      </div>
                    </div>
                    <div className="text-[9.5px] text-[#5A5E53] leading-snug mt-2 pt-1.5 border-t border-stone-100 italic">
                      {stats.globalFfh >= 75 ? 'Optimaler Schutzstatus erreicht!' : 'Verbesserungsbedarf nötig.'}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#D4CCBA] flex flex-col justify-between">
                    <div>
                      <div className="text-[9px] font-mono font-bold text-[#8B8273] uppercase">Angesiedelte Leitarten</div>
                      <div className="text-xl font-black text-[#5A7247] mt-1 flex items-center gap-1.5">
                        <span>🦫</span>
                        <span>{activeSpeciesCount} / {speciesList.length}</span>
                      </div>
                    </div>
                    <div className="text-[9.5px] text-[#5A5E53] leading-snug mt-2 pt-1.5 border-t border-stone-100 italic">
                      Biber, Lachs &amp; Edelkrebs
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE Audit Checklist (Checks current board state) */}
              <div className="bg-[#EFECE6]/70 border border-[#D4CCBA]/80 rounded-2xl p-4 space-y-3 shadow-inner">
                <div className="text-[10px] font-mono font-black text-[#8B8273] uppercase tracking-wider flex items-center justify-between">
                  <span>📊 LIVE-EVALUIERUNG DEINES SCHUTZGEBIETS</span>
                  <span className="text-[8px] bg-slate-200/50 px-1 py-0.2 rounded font-extrabold text-slate-700">DÜREN STATUS</span>
                </div>

                <div className="space-y-2.5">
                  {/* Metric 1 */}
                  <div className="flex items-start justify-between text-xs gap-4">
                    <div className="flex gap-2">
                      <span className="text-emerald-600 mt-0.5 shrink-0">
                        {auwaldCount >= 2 ? <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100" /> : <div className="w-3.5 h-3.5 border border-amber-400 rounded-full bg-amber-50" />}
                      </span>
                      <div>
                        <div className="font-extrabold text-[#2C3322]">Auwald-Biotopvernetzung</div>
                        <p className="text-[10px] text-[#6B6356] leading-tight mt-0.5">Mindestens 2 Auenwald-Zonen auf der Basiskarte pflanzen.</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#3F633E] text-right shrink-0">
                      {auwaldCount} / 2 gepflanzt
                    </span>
                  </div>

                  {/* Metric 2 */}
                  <div className="flex items-start justify-between text-xs gap-4 border-t border-[#D4CCBA]/40 pt-2.5">
                    <div className="flex gap-2">
                      <span className="text-emerald-600 mt-0.5 shrink-0">
                        {naturalRiverbankCount >= 2 ? <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100" /> : <div className="w-3.5 h-3.5 border border-amber-400 rounded-full bg-amber-50" />}
                      </span>
                      <div>
                        <div className="font-extrabold text-[#2C3322]">Uferstruktur &amp; Kiesbänke</div>
                        <p className="text-[10px] text-[#6B6356] leading-tight mt-0.5">Kiesbetten oder Ufer-Renaturierungen zur Dynamisierung errichten.</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#3F633E] text-right shrink-0">
                      {naturalRiverbankCount} aktive Bauten
                    </span>
                  </div>

                  {/* Metric 3 */}
                  <div className="flex items-start justify-between text-xs gap-4 border-t border-[#D4CCBA]/40 pt-2.5">
                    <div className="flex gap-2">
                      <span className="text-emerald-600 mt-0.5 shrink-0">
                        {isBiberManagementUnlocked ? <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100" /> : <div className="w-3.5 h-3.5 border border-amber-400 rounded-full bg-amber-50" />}
                      </span>
                      <div>
                        <div className="font-extrabold text-[#2C3322]">Biber-Managementplan</div>
                        <p className="text-[10px] text-[#6B6356] leading-tight mt-0.5">Forschung abschließen, um Akzeptanz im Kulturland Düren zu sichern.</p>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] font-bold text-stone-500 text-right shrink-0">
                      {isBiberManagementUnlocked ? '✔ ERFORSCHT' : '❌ AUSSTEHEND'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actionable Advice to Win */}
              <div className="space-y-2">
                <span className="text-[8.5px] font-mono font-black text-[#8B8273] uppercase tracking-wide">💡 ACTION-TIPP</span>
                <p className="text-[10.5px] text-[#5A5E53] leading-relaxed">
                  Ziehe gezielt **Aktionskarten aus der Kategorie "Fauna &amp; Wald"**, um Flussreviere zu schützen. Durch die Biotop-Beobachtung im Öko-Panel siehst du zudem, welche Voraussetzungen noch fehlen, um die Leitarten zu 100% erfolgreich im Altarmsystem der Rur anzusiedeln.
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-white px-6 py-4 border-t border-[#D4CCBA] flex justify-end shrink-0">
              <button
                onClick={onCloseNatura}
                className="bg-[#2F4F2F] hover:bg-[#203620] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer transition-colors active:scale-95 shadow-sm"
              >
                Verstanden
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── EU-WRRL MODAL ── */}
      {showWrrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 text-[#2C3322]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="bg-[#FAF9F6] border-4 border-[#2A6F7E] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans"
          >
            {/* Modal Brand Header */}
            <div className="bg-gradient-to-r from-[#1E4E58] to-[#2E7E8D] p-5 shrink-0 flex items-center justify-between text-white relative">
              <div className="absolute right-12 opacity-8 select-none pointer-events-none text-6xl">
                🌊
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/12 p-2 rounded-xl border border-white/20">
                  <Droplets className="w-6 h-6 text-sky-300" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-sky-200 uppercase font-black block">
                    EUROPEAN COCKPIT DIRECTIVE
                  </span>
                  <h3 className="text-lg font-black font-display text-white">
                    🌊 EU-Wasserrahmenrichtlinie (WRRL)
                  </h3>
                </div>
              </div>
              <button
                onClick={onCloseWrrl}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Workspace */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Summary Goal Intro Card */}
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <div className="p-1.5 bg-sky-500 text-white rounded-lg shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <p className="text-xs leading-relaxed text-sky-950">
                  Die **EU-Wasserrahmenrichtlinie (WRRL)** schreibt vor, dass alle europäischen Oberflächengewässer einen **"Guten ökologischen und chemischen Zustand"** einnehmen müssen. Für die industriell genutzte Rur von Heimbach über Düren bis Jülich fordert dies eine Verringerung von Fabrikschadstoffen und die Wiederherstellung freier Strömungsverläufe.
                </p>
              </div>

              {/* WRRL Water Quality metrics explanation */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black tracking-widest text-[#2A6F7E] uppercase border-b border-[#2A6F7E]/15 pb-1 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Deine System-Güteparameter</span>
                </h4>
                <p className="text-[11px] text-[#5A5E53] leading-relaxed">
                  Die WRRL misst die Wasserqualität auf einer Skala von **1 (Hervorragend)** bis **5 (Schlecht)**. Je niedriger deine globale Rur-Güte ist, desto näher bist du dem gesetzlichen EU-Zielwert (&lt; 2.50).
                </p>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-white p-4 rounded-xl border border-[#D4CCBA] flex flex-col justify-between shadow-xs">
                    <div>
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase">Globale Gewässergüte</span>
                      <div className="text-2xl font-black text-sky-700 mt-1 flex items-baseline gap-1">
                        <span>{stats.globalWrrl.toFixed(2)}</span>
                        <span className="text-xs font-normal text-stone-500">/ 5.0</span>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-stone-600">Aktuelles Gütesiegel:</span>
                      <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded border ${
                        stats.globalWrrl <= 2.2 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        stats.globalWrrl <= 3.0 ? 'bg-teal-50 text-teal-800 border-teal-300' :
                        stats.globalWrrl <= 3.8 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        {stats.globalWrrl <= 2.8 ? 'A-ZERTIFIKAT' : stats.globalWrrl <= 3.5 ? 'B-ZERTIFIKAT' : 'C-ZERTIFIKAT'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-[#D4CCBA] flex flex-col justify-between shadow-xs">
                    <div>
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase">Fluss-Durchgängigkeit</span>
                      <div className="text-2xl font-black text-indigo-700 mt-1">
                        {stats.continuity}%
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-500 leading-snug mt-2.5 pt-2 border-t border-stone-100">
                      Sichert den hindernisfreien Aufstieg wandernder Lachse von der Nordsee in die Rurtäler.
                    </p>
                  </div>
                </div>
              </div>

              {/* Realistic Regional Rur context */}
              <div className="bg-[#EFECE6]/70 border border-[#D4CCBA]/80 rounded-2xl p-4 space-y-2.5 shadow-inner">
                <span className="text-[8.5px] font-mono font-black text-[#8B8273] uppercase tracking-wide block">✏ REGIONALE ANALYSE: HISTORISCHE ARTIFAKTE</span>
                <p className="text-[11px] text-[#5A5E53] leading-relaxed">
                  In den vergangenen Industrieepochen des Kreises Düren wurde die Rur stark begradigt, eingeengt und als Zuleitungskorridor für Papierfabriken verwendet. Hierdurch sank die ökologische Durchgängigkeit drastisch. 
                </p>
                <div className="bg-white p-2.5 rounded-lg border border-[#D4CCBA]/40 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#2C3322]">
                    <span className="text-rose-600">⚠</span>
                    <span>Haupt-Einflussfaktor: Werk Schoellershammer</span>
                  </div>
                  <p className="text-[9.5px] text-[#6B6356] leading-relaxed">
                    Der <strong>Vollbetrieb (PRODUCTION)</strong> der Papierwerke generiert zwar massive Steuern (+15 €) und Arbeitsplätze (+15% Wohlstand), schwächt die Wasserqualität allerdings durch Mikrochemikalien und Wärme-Abwässer permanent.
                  </p>
                  <p className="text-[9.5px] text-[#6B6356] leading-relaxed">
                    Stelle im Simulations-Panel der Papierfabrik auf <strong>RETROFITTING (Filtertechnik)</strong> oder treibe <strong>RÜCKBAUE</strong>-Forschungen voran, um die Wasserwerte signifikant zu verbessern.
                  </p>
                </div>
              </div>

              {/* Interactive Checklist to improve WRRL score */}
              <div className="space-y-2 text-xs">
                <span className="text-[8.5px] font-mono font-black text-[#5B554D] uppercase tracking-wide">🏆 EMPFOHLENE MAẞNAHMEN ZU GÜTE-KLASSE A</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-[#D4CCBA] flex items-center gap-2">
                    <span className="text-sky-650 shrink-0">🌊</span>
                    <span className="text-[10px] text-stone-700 leading-tight">Installiere <strong>Fischlaichbetten</strong> oder <strong>Altarme</strong> auf Sandbänken</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#D4CCBA] flex items-center gap-2">
                    <span className="text-sky-650 shrink-0">🔬</span>
                    <span className="text-[10px] text-stone-700 leading-tight">Erforsche im Innovationszentrum <strong>Feuchtgebietsstudien</strong></span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-white px-6 py-4 border-t border-[#D4CCBA] flex justify-end shrink-0">
              <button
                onClick={onCloseWrrl}
                className="bg-[#1E4E58] hover:bg-[#123138] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer transition-colors active:scale-95 shadow-sm"
              >
                Bestätigen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
