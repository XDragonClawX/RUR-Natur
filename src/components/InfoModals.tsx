import React from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  onClose: () => void;
}

/**
 * Statische Kurzanleitung (Schritt-für-Schritt-Onboarding für Tester:innen).
 * Reines Präsentations-Modal — wird vom Parent konditional gerendert.
 */
export const KurzanleitungModal: React.FC<InfoModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
    <div className="bg-[#F2EDE4] border-4 border-[#2A6F7E] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-[#2A6F7E]/20 p-5 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚀</span>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#2A6F7E] uppercase font-black block">PROTOTYP-TEST · SCHRITT FÜR SCHRITT</span>
            <h3 className="text-lg font-black text-[#2C3311]">RurNova: Kurzanleitung für Testerinnen &amp; Tester</h3>
          </div>
        </div>
        <button onClick={onClose} className="text-[#8B8273] hover:text-[#2C3311] p-2 rounded-full hover:bg-[#E8E2D6]/70 transition-colors cursor-pointer border border-[#D4CCBA]">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">

        {/* Intro */}
        <div className="bg-[#2A6F7E]/10 border border-[#2A6F7E]/25 rounded-2xl p-4 text-[11px] text-[#1A3F48] leading-relaxed">
          Diese Kurzanleitung führt dich in ca. <b>10–15 Minuten</b> durch alle wesentlichen Bereiche des Prototypen. Folge den nummerierten Schritten der Reihe nach. Alle Aktionen lösen direkt sichtbare Rückmeldungen aus — beobachte das <b>Simulationsprotokoll</b> unten und die <b>Ressourcenanzeige</b> oben.
        </div>

        {/* Steps */}
        {[
          {
            n: '01', icon: '📖', color: 'border-sky-400/50 bg-sky-50', tc: 'text-sky-800', bc: 'bg-sky-500',
            title: 'Tutorial lesen',
            area: 'Tutorial-Fenster (öffnet sich automatisch beim Start)',
            steps: [
              'Das Tutorial-Fenster erscheint automatisch. Lies die erste Seite.',
              'Klicke mehrfach auf den "Weiter →"-Button, um alle 6 Seiten durchzublättern.',
              'Auf der letzten Seite: "Spiel starten!" klicken.',
              '→ Das Tutorial schließt sich und das Spiel beginnt.',
            ],
          },
          {
            n: '02', icon: '🗺️', color: 'border-green-400/50 bg-green-50', tc: 'text-green-900', bc: 'bg-green-600',
            title: 'Oberfläche kennenlernen',
            area: 'Gesamte Bildschirmfläche',
            steps: [
              'Oben: Ressourcen-HUD — Budget (€), Forschungspunkte (🧪), Naturpunkte (🌿), WRRL-Güte.',
              'Mitte: Isometrische Karte der Rur (von der Eifel bis Jülich).',
              'Links/Unten: Aktionskarten-System — hier spielst du deine Züge.',
              'Rechts: Tabpanel mit Karte, Schoellershammer, Forschung, Arten, Berichte.',
              'Ganz unten: Simulationsprotokoll — zeigt alle Spielereignisse.',
            ],
          },
          {
            n: '03', icon: '🔭', color: 'border-teal-400/50 bg-teal-50', tc: 'text-teal-900', bc: 'bg-teal-600',
            title: 'Karte erkunden',
            area: 'Isometrische Karte (Mitte)',
            steps: [
              'Mausrad drehen oder Pinch-Geste: Karte zoomen.',
              'Linksklick + Ziehen: Karte verschieben.',
              'Auf den "⊙ Zentrieren"-Button (unten rechts in der Karte) klicken: Ansicht zurücksetzen.',
              'Ein Fluss-Hexfeld (blaue Kachel) anklicken → Felddetails erscheinen im Log.',
              'Eine Wiesen- oder Auwald-Kachel anklicken → Terrain und Werte werden angezeigt.',
            ],
          },
          {
            n: '04', icon: '💧', color: 'border-blue-400/50 bg-blue-50', tc: 'text-blue-900', bc: 'bg-blue-600',
            title: 'Kartenebenen wechseln',
            area: 'Obere Leiste in der Karte (oben rechts)',
            steps: [
              'Oben rechts in der Karte befinden sich 4 Filter-Buttons: 🗺️ Satellit | 💧 WRRL | 🌿 FFH | 🌊 Schutz.',
              '"💧 WRRL Wasser" anklicken → Karte zeigt farbkodierte Gewässerqualität (dunkelgrün = gut, rot = schlecht).',
              '"🌿 FFH-Flora" anklicken → Biotopschutzpotenzial der Flächen wird sichtbar.',
              '"🌊 HWRM Hochwasser" anklicken → Hochwasserrisiko-Zonen werden angezeigt.',
              'Zurück auf "🗺️ Satellit" klicken für die Normalansicht.',
            ],
          },
          {
            n: '05', icon: '💶', color: 'border-yellow-400/50 bg-yellow-50', tc: 'text-yellow-900', bc: 'bg-yellow-600',
            title: 'Erste Aktion: Förderung beantragen',
            area: 'Aktionskarten-Leiste (linker Bereich / unten)',
            steps: [
              'Im Aktionskarten-Bereich die Karte "💶 Förderung beantragen" suchen und anklicken.',
              'Die Karte expandiert und zeigt Stärke-Details.',
              '"Karte ausspielen" klicken.',
              '→ Das Budget (€) in der Ressourcenanzeige steigt sofort.',
              '→ Eine Toast-Meldung erscheint unten rechts.',
              '"Runde beenden" klicken (Button am Ende der Aktionskarten-Leiste).',
            ],
          },
          {
            n: '06', icon: '🏗️', color: 'border-amber-400/50 bg-amber-50', tc: 'text-amber-900', bc: 'bg-amber-600',
            title: 'Bauen: erstes Gebäude errichten',
            area: 'Aktionskarten + Karte',
            steps: [
              'Die "🏗️ Bauen & Errichten"-Karte anklicken → Gebäudekatalog öffnet sich im rechten Panel.',
              'Ein günstiges Gebäude wählen, z.B. "Biber-Station" (3 €) oder "Insektenhotel" (2 €).',
              'Auf ein geeignetes Feld der Karte klicken (grüne Hervorhebung zeigt erlaubte Felder).',
              'Der Bestätigungsdialog erscheint mit Kosten und Rabatten — "Bestätigen & Bauen" klicken.',
              '→ Das Gebäude erscheint auf der Karte, Budget sinkt, Naturpunkte steigen.',
              '"Runde beenden" klicken.',
            ],
          },
          {
            n: '07', icon: '🧪', color: 'border-purple-400/50 bg-purple-50', tc: 'text-purple-900', bc: 'bg-purple-600',
            title: 'Forschung betreiben',
            area: 'Aktionskarten + Forschungs-Tab',
            steps: [
              'Die "🧪 Gewässer-Forschung"-Karte ausspielen → Forschungspunkte steigen.',
              'Im oberen Tabmenü auf "🔬 Forschung" klicken.',
              'Im Tech-Baum einen verfügbaren Knoten (grün umrandet) anklicken, z.B. "Biber-Management-Plan".',
              '"Forschung freischalten" klicken wenn genug Punkte vorhanden.',
              '→ Der Knoten leuchtet auf, Effekte werden permanent aktiv.',
            ],
          },
          {
            n: '08', icon: '🏭', color: 'border-zinc-400/50 bg-zinc-50', tc: 'text-zinc-800', bc: 'bg-zinc-600',
            title: 'Schoellershammer konfigurieren',
            area: 'Schoellershammer-Tab (oben im Tabmenü)',
            steps: [
              'Im Tabmenü oben auf "🏭 Schoellershammer" klicken.',
              'Den aktuellen Betriebsmodus ablesen (Standard: Vollbetrieb).',
              'Auf "🔧 Umrüstung" klicken um den Modus zu wechseln.',
              '→ Log zeigt Auswirkungen auf Budget und Bürgerakzeptanz.',
              'Beobachte die WRRL-Güte oben im HUD — sie verbessert sich nach dem nächsten Rundenwechsel.',
            ],
          },
          {
            n: '09', icon: '🐟', color: 'border-cyan-400/50 bg-cyan-50', tc: 'text-cyan-900', bc: 'bg-cyan-600',
            title: 'Artenschutz-Status einsehen',
            area: 'Arten-Tab (oben im Tabmenü)',
            steps: [
              'Im Tabmenü auf "🦅 Artenvielfalt" klicken.',
              'Die Liste der Zielarten (Bachforelle, Biber, Feuerfalter, Eisvogel, Lachs) anzeigen.',
              'Fortschrittsbalken und Bedingungen für jede Art ablesen.',
              'Prüfen: Welche Bedingungen fehlen noch für die Bachforelle?',
              '→ Ziel: Alle 5 Arten bis zum Spielende ansiedeln.',
            ],
          },
          {
            n: '10', icon: '⏭️', color: 'border-rose-400/50 bg-rose-50', tc: 'text-rose-900', bc: 'bg-rose-600',
            title: 'Mehrere Runden spielen',
            area: 'Aktionskarten-Leiste',
            steps: [
              '2–3 weitere Runden durchspielen: je Runde eine Aktionskarte ausspielen und Runde beenden.',
              'Beobachte wie Karten-Stärken durch Nichtnutzung steigen (Stärke 1 → 5).',
              'Eine Karte auf Stärke 4 oder 5 ausspielen und den verstärkten Effekt beobachten.',
              'Im Simulationsprotokoll (unten) den Rundenüberblick lesen.',
              '→ Optional: "Rückgängig"-Funktion testen (im ⚙-Menü oben rechts).',
            ],
          },
        ].map(step => (
          <div key={step.n} className={`rounded-2xl border ${step.color} overflow-hidden`}>
            <div className={`${step.bc} px-4 py-2 flex items-center gap-3`}>
              <span className="text-white font-black text-sm font-mono w-8 shrink-0">#{step.n}</span>
              <span className="text-lg">{step.icon}</span>
              <div>
                <div className="text-white font-black text-[11px] uppercase tracking-wide">{step.title}</div>
                <div className="text-white/75 text-[9.5px] font-mono">📍 {step.area}</div>
              </div>
            </div>
            <ul className="px-4 py-3 space-y-1.5">
              {step.steps.map((s, i) => (
                <li key={i} className={`text-[10.5px] ${step.tc} leading-snug flex items-start gap-2`}>
                  <span className="shrink-0 font-bold text-[9px] mt-0.5 opacity-60">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Closing note */}
        <div className="bg-[#5A7247]/10 border border-[#5A7247]/30 rounded-2xl p-4 text-[11px] text-[#2C3311] leading-relaxed">
          <b>🌿 Glückwunsch!</b> Du hast alle wesentlichen Bereiche des Prototypen kennengelernt. Spiele jetzt frei weiter und versuche, den Atlantischen Lachs zurück in die Rur zu bringen — das ultimative Renaturierungsziel!
        </div>

      </div>

      {/* Footer */}
      <div className="bg-white border-t border-[#2A6F7E]/20 p-4 shrink-0 flex items-center justify-between">
        <span className="text-[10px] text-[#8B8273] font-mono">RurNova Prototyp-Testversion · Kreis Düren</span>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-[#2A6F7E] hover:bg-[#1E5A68] text-white text-xs font-extrabold uppercase rounded-xl shadow-md transition-all duration-150 cursor-pointer active:scale-95"
        >
          Schließen
        </button>
      </div>
    </div>
  </div>
);

/**
 * Ausführliches Spielregeln-/Handbuch-Modal mit allen Systemmechaniken.
 * Reines Präsentations-Modal — wird vom Parent konditional gerendert.
 */
export const SpielregelnModal: React.FC<InfoModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] p-4 text-[#2C3311]">
    <div className="bg-[#F2EDE4] border-4 border-[#BC6C25] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">

      {/* Modal Header */}
      <div className="bg-white border-b border-[#BC6C25]/20 p-5 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📖</span>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#BC6C25] uppercase font-black block">REGIONALE CHRONIK &amp; HANDBUCH</span>
            <h3 className="text-lg font-black text-[#2C3311] font-display">RurNova: Offizielle Spielregeln &amp; Systemmechaniken</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#8B8273] hover:text-[#2C3311] p-2 rounded-full hover:bg-[#E8E2D6]/70 transition-colors cursor-pointer border border-[#D4CCBA]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Rules Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-brand-lightsky/20">

        {/* Introduction */}
        <div className="bg-emerald-500/10 border border-[#A7C080]/30 rounded-2xl p-4">
          <p className="text-xs leading-relaxed text-[#2C3311]">
            Du leitest die ökologische Transformation des Rurtals im Kreis Düren. Jede Entscheidung beeinflusst Gewässerqualität, Artenvielfalt, Budget und Bürgerakzeptanz. Dieses Handbuch erklärt alle Regeln und Mechaniken — von der Aktionskarte bis zur Lachs-Rückkehr.
          </p>
        </div>

        {/* 1. AKTIONSKARTEN & ARCHE-NOVA-PRINZIP */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
            <span>🃏</span> 1. AKTIONSKARTEN &amp; DAS ARCHE-NOVA-PRINZIP
          </h4>
          <div className="bg-amber-50 border border-amber-300/50 rounded-xl p-3 text-[10.5px] text-amber-900 leading-relaxed">
            <b>Kernregel:</b> Pro Runde darfst du genau <b>eine</b> Aktionskarte ausspielen. Die gespielte Karte kehrt auf Stärke 1 zurück — die anderen vier Karten rücken nach rechts und gewinnen jeweils +1 Stärke. Je länger du eine Karte schonst, desto mächtiger wird ihre Wirkung (Stärke 1–5).
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 mt-1">
            {[
              { icon: '🏗️', name: 'Bauen', color: 'border-amber-400/60 bg-amber-50', tc: 'text-amber-900', desc: 'Aktiviert den Baumodus. Die Platzierung eines Gebäudes verbraucht die Aktion. Höhere Stärke = größere Budgetfreigabe und Materialrabatte.' },
              { icon: '🌱', name: 'Pflanzen', color: 'border-green-400/60 bg-green-50', tc: 'text-green-900', desc: 'Wandelt Acker- oder Wiesenflächen in Auwälder um. Stärke bestimmt die Anzahl konvertierbarer Felder (+Naturpunkte, -Klimarisiko).' },
              { icon: '💧', name: 'Wasser leiten', color: 'border-sky-400/60 bg-sky-50', tc: 'text-sky-900', desc: 'Verbessert WRRL-Qualität aller Wasserfelder und steigert FFH-Werte. Stärke × 0,15 WRRL-Verbesserung pro Wasserfeld.' },
              { icon: '💶', name: 'Förderung', color: 'border-yellow-400/60 bg-yellow-50', tc: 'text-yellow-900', desc: 'Sichert EU/NRW-Fördermittel. Stärke 1→3 €, 2→6 €, 3→9 €, 4→12 €+1🧪, 5→16 €+2🧪.' },
              { icon: '🧪', name: 'Forschung', color: 'border-purple-400/60 bg-purple-50', tc: 'text-purple-900', desc: 'Generiert Forschungspunkte zum Freischalten von Tech-Baum-Knoten. Stärke 1–2→ direkt, 3→3🧪+1🌿, 4→5🧪+2🌿, 5→7🧪+4🌿.' },
            ].map(c => (
              <div key={c.name} className={`rounded-xl border p-3 space-y-1.5 ${c.color}`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{c.icon}</span>
                  <span className={`font-extrabold text-[10.5px] uppercase ${c.tc}`}>{c.name}</span>
                </div>
                <p className="text-[10px] text-[#4A4F3F] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. RUNDENSTRUKTUR & BUDGET */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
            <span>📅</span> 2. RUNDENSTRUKTUR &amp; BUDGET
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 p-3.5 rounded-xl border border-[#D4CCBA] space-y-2">
              <h5 className="font-bold text-[#2C3311] text-[11px] uppercase">Jahresverlauf</h5>
              <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed">
                Jedes Jahr besteht aus <b>4 Runden</b>: Frühling → Sommer → Herbst → Winter. Am Rundenwechsel werden Einnahmen und Ausgaben automatisch verrechnet und passive Boni gutgeschrieben.
              </p>
            </div>
            <div className="bg-white/80 p-3.5 rounded-xl border border-[#D4CCBA] space-y-2">
              <h5 className="font-bold text-[#2C3311] text-[11px] uppercase">Budget pro Runde</h5>
              <div className="text-[10.5px] text-[#4A4F3F] leading-relaxed space-y-0.5">
                <div>💵 Basis-Steuereinnahmen: <b>+5 €</b></div>
                <div>🏭 Schoellershammer (Vollbetrieb): <b>+15 €</b>, Umrüstung: <b>+5 €</b></div>
                <div>🏘️ Tourismus-Gebäude: +2–4 € / Gebäude</div>
                <div>⚡ Wasserkraft: <b>+5 €</b> passiv</div>
                <div className="text-red-700">🔧 Instandhaltungskosten: −X € je Gebäude</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BAUEN-KARTE: STÄRKE & FREIGABEN */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
            <span>🏗️</span> 3. BAUEN-KARTE: STÄRKE, FREIGABEN &amp; RABATTE
          </h4>
          <p className="text-[11px] text-[#4A4F3F]">Die Stärke der Bauen-Karte beim Ausspielen bestimmt, welche Projekte du errichten darfst und welche Materialrabatte du erhältst:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[10.5px] border-collapse">
              <thead>
                <tr className="bg-[#E8E2D6] text-[#2C3311]">
                  <th className="text-left p-2 font-black rounded-tl-lg">Stärke</th>
                  <th className="text-left p-2 font-black">Max. Baukosten</th>
                  <th className="text-left p-2 font-black">Materialrabatt</th>
                  <th className="text-left p-2 font-black rounded-tr-lg">Hinweis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4CCBA]">
                <tr className="bg-white/60"><td className="p-2 font-bold text-slate-600">⬤ Stärke 1</td><td className="p-2">max. 4 €</td><td className="p-2 text-[#8B8273]">kein Rabatt</td><td className="p-2 text-[#8B8273]">Nur Basismaßnahmen</td></tr>
                <tr className="bg-white/60"><td className="p-2 font-bold text-cyan-700">⬤ Stärke 2</td><td className="p-2">max. 6 €</td><td className="p-2 text-[#8B8273]">kein Rabatt</td><td className="p-2 text-[#8B8273]">Kleine Renaturierungen</td></tr>
                <tr className="bg-white/60"><td className="p-2 font-bold text-amber-700">⬤ Stärke 3</td><td className="p-2">max. 8 €</td><td className="p-2 text-green-700 font-bold">−1 € Rabatt</td><td className="p-2">Mittlere Projekte</td></tr>
                <tr className="bg-white/60"><td className="p-2 font-bold text-purple-700">⬤ Stärke 4</td><td className="p-2">max. 10 €</td><td className="p-2 text-green-700 font-bold">−1 € Rabatt</td><td className="p-2">Große Infrastruktur</td></tr>
                <tr className="bg-[#D4E0C1]/40"><td className="p-2 font-black text-[#5A7247]">⬤ Stärke 5</td><td className="p-2 font-bold">unbegrenzt</td><td className="p-2 text-green-700 font-black">−2 € Rabatt</td><td className="p-2 font-bold text-[#5A7247]">Alle Großprojekte freigegeben</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-[#8B8273]">💡 Rurtalbahn-Haltepunkte in der Nähe gewähren zusätzlich −1 € Logistikrabatt. Bei Bürgerakzeptanz unter 40 % wird +2 € Protestzuschlag erhoben (ab 2027).</p>
        </div>

        {/* 4. KARTENEBENEN */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
            <span>🗺️</span> 4. KARTENEBENEN: WRRL, FFH &amp; HOCHWASSER
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-sky-50 border border-sky-300/50 rounded-xl p-3.5 space-y-1.5">
              <h5 className="font-bold text-sky-900 text-[11px] uppercase">💧 WRRL-Gewässergüte</h5>
              <p className="text-[10.5px] text-sky-800 leading-relaxed">Skala 1 (sehr gut) bis 5 (sehr schlecht). Ziel: globalen Durchschnitt unter 3,0 senken. Verbessert durch: Wasser-leiten-Karte, Kläranlagen-Upgrade, Sohlgleiten, weniger Fabrikbetrieb.</p>
            </div>
            <div className="bg-green-50 border border-green-300/50 rounded-xl p-3.5 space-y-1.5">
              <h5 className="font-bold text-green-900 text-[11px] uppercase">🌿 FFH-Biotopwert</h5>
              <p className="text-[10.5px] text-green-800 leading-relaxed">0–100 %. Zeigt das Artenschutzpotenzial jeder Fläche. Wird erhöht durch: Auwald-Pflanzung, Altarme, Biber-Stationen, Insektenhotels. Bestimmt die Artenansiedlung.</p>
            </div>
            <div className="bg-rose-50 border border-rose-300/50 rounded-xl p-3.5 space-y-1.5">
              <h5 className="font-bold text-rose-900 text-[11px] uppercase">🌊 HWRM-Hochwasser</h5>
              <p className="text-[10.5px] text-rose-800 leading-relaxed">Risikoanzeige 0–100 %. Hohe Werte führen ab 2028 zu Schadenereignissen. Senken durch: Auwälder, Altarme, Ufer-Entfesselung und gute Fluss-Durchgängigkeit.</p>
            </div>
          </div>
        </div>

        {/* 5. ARTENSCHUTZ */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
            <span>🐟</span> 5. ARTENSCHUTZ: ANSIEDLUNGSBEDINGUNGEN
          </h4>
          <p className="text-[11px] text-[#4A4F3F]">Jede Art benötigt spezifische Voraussetzungen. Sind alle erfüllt (100 % Fortschritt), siedelt sie sich an und bringt <b>+15 Naturpunkte</b>:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: '🐟', name: 'Bachforelle & Groppe', conds: ['WRRL-Güte ≤ 3,5', 'Kiesbett gebaut'] },
              { icon: '🦫', name: 'Eurasischer Biber', conds: ['Mind. 2 Auwald-Felder', 'Forschung „Biber-Management" abgeschlossen'] },
              { icon: '🦋', name: 'Blauschillernder Feuerfalter', conds: ['Mind. 2 Insektenhotels', 'Globaler FFH-Wert ≥ 45 %'] },
              { icon: '🐦', name: 'Eisvogel', conds: ['Ufer-Entfesselung gebaut', 'WRRL-Güte ≤ 2,8', 'Bachforelle bereits angesiedelt'] },
              { icon: '🐡', name: 'Atlantischer Lachs', conds: ['Durchgängigkeit ≥ 60 %', 'Fabrik nicht im Vollbetrieb', 'Lachszucht-Station gebaut', 'Forschung „Lachs NRW" abgeschlossen'] },
            ].map(sp => (
              <div key={sp.name} className="bg-white/80 border border-[#D4CCBA] rounded-xl p-3 flex gap-3 items-start">
                <span className="text-xl shrink-0">{sp.icon}</span>
                <div>
                  <div className="font-bold text-[11px] text-[#2C3311]">{sp.name}</div>
                  <ul className="mt-1 space-y-0.5">
                    {sp.conds.map(c => <li key={c} className="text-[10px] text-[#4A4F3F] flex items-start gap-1"><span className="text-[#5A7247] shrink-0">✓</span>{c}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. SCHOELLERSHAMMER */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
            <span>🏭</span> 6. DIE SCHOELLERSHAMMER-GLEICHUNG
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              { label: '⚙️ Vollbetrieb', bg: 'bg-white/70 border-[#D4CCBA]', tc: 'text-zinc-800', rows: ['+15 € / Runde', '+15 % Akzeptanz', '⚠️ Massive WRRL-Schäden', 'Rurtalbahn gesperrt'] },
              { label: '🔧 Umrüstung', bg: 'bg-white/70 border-[#D4CCBA]', tc: 'text-blue-800', rows: ['+5 € / Runde', '+1 🧪 Passivforschung', 'Emissionen sinken', '−5 % Akzeptanz (ab 2027)'] },
              { label: '⚠️ Stilllegung', bg: 'bg-white/70 border-[#D4CCBA]', tc: 'text-amber-800', rows: ['−2 € Notwartung', '−30 % Akzeptanz', 'WRRL erholt sich', 'Gelände bleibt bebaut'] },
              { label: '🌿 Renaturierung', bg: 'bg-emerald-50 border-emerald-600/20', tc: 'text-emerald-950', rows: ['−3 € Pachtschutz', '+10 % Akzeptanz (mit eG)', 'Max. WRRL-Verbesserung', 'Erfordert Forschung!'] },
            ].map(m => (
              <div key={m.label} className={`p-3 rounded-xl border ${m.bg}`}>
                <span className={`font-black text-[10.5px] uppercase block mb-1.5 ${m.tc}`}>{m.label}</span>
                <ul className="space-y-0.5 text-[10px] text-[#4A4F3F]">
                  {m.rows.map(r => <li key={r}>{r}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 7. PROGRESSIVER SCHWIERIGKEITSGRAD */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
            <span>📅</span> 7. PROGRESSIVER SCHWIERIGKEITSGRAD
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              { year: '2026', level: 'Level 1', badge: 'bg-sky-100 text-sky-800', border: 'border-[#D4CCBA]', icon: '🌱', title: 'Schonzeit', desc: 'Keine Naturkatastrophen, Akzeptanz stabil, Biosicherheit 100 %. Lerne die Grundlagen ohne Druck.' },
              { year: '2027', level: 'Level 2', badge: 'bg-amber-100 text-amber-800', border: 'border-amber-400/40', icon: '👥', title: 'NIMBY-Effekt', desc: 'Bürgerakzeptanz wird aktiviert. Wind nahe Siedlungen kostet −20 %, Fabrikstilllegung −30 %.' },
              { year: '2028', level: 'Level 3', badge: 'bg-rose-100 text-rose-800', border: 'border-rose-400/40', icon: '🌊', title: 'Naturkatastrophen', desc: 'Fluten & Dürren bei Klimarisiko > 35 %. Biosicherheit sinkt kontinuierlich ab.' },
              { year: '2029+', level: 'Final', badge: 'bg-purple-100 text-purple-800', border: 'border-purple-400/40', icon: '🔥', title: 'Globale Krise', desc: 'Klimarisiko steigt 25 % schneller. Nur konsequentes Gleichgewicht aller Werte ermöglicht Bestnoten.' },
            ].map(y => (
              <div key={y.year} className={`bg-white/85 p-3.5 rounded-2xl border ${y.border} flex flex-col gap-1.5`}>
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded font-black ${y.badge}`}>{y.level}</span>
                  <span>{y.icon}</span>
                </div>
                <div className="font-extrabold text-[11px] text-[#2C3311] uppercase">{y.year} — {y.title}</div>
                <p className="text-[10px] text-[#4A4F3F] leading-relaxed">{y.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 8. SOZIALE AKZEPTANZ */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
            <span>👥</span> 8. SOZIALE AKZEPTANZ &amp; BÜRGERGENOSSENSCHAFT
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-white/80 p-3.5 rounded-xl border border-[#D4CCBA] space-y-1.5">
              <h5 className="font-bold text-amber-900 text-[11px] uppercase">🚨 NIMBY-Effekt (ab 2027)</h5>
              <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed">Windkraft direkt an Siedlung: <b>−20 %</b>. Solarpark ohne Genossenschaft: <b>−3 %</b>. Fabrik-Stilllegung: <b>−30 %</b>. Fabrik-Renaturierung ohne Genossenschaft: <b>−15 %</b>.</p>
            </div>
            <div className="bg-white/80 p-3.5 rounded-xl border border-rose-400/30 space-y-1.5">
              <h5 className="font-bold text-red-700 text-[11px] uppercase">💸 Unter 40 % Akzeptanz</h5>
              <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed">Verwaltungsklagen blockieren Bauprojekte: jedes neue Gebäude kostet <b>+2 € Protestzuschlag</b> zusätzlich zu den normalen Baukosten.</p>
            </div>
            <div className="bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-600/20 space-y-1.5">
              <h5 className="font-bold text-emerald-950 text-[11px] uppercase">🪙 Bürgergenossenschaft</h5>
              <p className="text-[10.5px] text-emerald-900 leading-relaxed">Einmalig freischaltbar in der Öko-Zentrale (12 €, 4 🧪). Sofortbonus: <b>+40 % Akzeptanz</b>. Schaltet alle künftigen NIMBY-Abzüge dauerhaft aus.</p>
            </div>
          </div>
        </div>

        {/* 9. KLIMARISIKO & BIOSICHERHEIT */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
            <span>🌲</span> 9. KLIMARISIKO &amp; BIOSICHERHEIT
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 p-3.5 rounded-xl border border-[#D4CCBA] space-y-1.5">
              <h5 className="font-bold text-[#2C3311] text-[11px] uppercase">🌲 Klimarisiko senken</h5>
              <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed">Jede Auwald-Fläche, jede Renaturierungsaktion und jeder Rückbau von Industrieanlagen senkt das Klimarisiko dauerhaft. Ab 2028 lösen Werte über 35 % Schadenereignisse aus (Hochwasser, Dürre).</p>
            </div>
            <div className="bg-white/80 p-3.5 rounded-xl border border-[#D4CCBA] space-y-1.5">
              <h5 className="font-bold text-[#2C3311] text-[11px] uppercase">🦠 Biosicherheit (ab 2028)</h5>
              <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed">Invasive Arten dezimieren die Rur-Fauna kontinuierlich (−25 % / Runde ohne Gegenmaßnahmen). Schutzmöglichkeiten: Abwehrprojekte in der Öko-Zentrale oder Forschungsinvestitionen in Bioschutz.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Footer */}
      <div className="bg-white border-t border-[#BC6C25]/20 p-5 shrink-0 flex items-center justify-between">
        <span className="text-[10px] text-brand-dark/60 font-mono">
          RurNova Simulationshandbuch für den Landkreis Düren
        </span>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-[#5A7247] hover:bg-[#4E613C] text-white text-xs font-extrabold uppercase rounded-xl shadow-md transition-all duration-150 cursor-pointer active:scale-95 text-center"
        >
          Alles verstanden, bereit zur Simulation! 🚀
        </button>
      </div>

    </div>
  </div>
);
