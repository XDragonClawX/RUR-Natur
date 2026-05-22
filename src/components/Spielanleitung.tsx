import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-black text-[#2C3322] font-display tracking-tight">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-xs font-mono text-[#8B8273] tracking-wider uppercase ml-10">{subtitle}</p>
      )}
      <div className="h-px bg-gradient-to-r from-[#5A7247]/30 via-[#D4CCBA] to-transparent mt-3 ml-10" />
    </div>
  );
}

function RuleBox({ children, accent = 'green' }: { children: React.ReactNode; accent?: 'green' | 'teal' | 'amber' | 'purple' | 'blue' | 'red' }) {
  const colors = {
    green:  'border-l-[#5A7247] bg-[#F4F8F1]',
    teal:   'border-l-[#2A6F7E] bg-[#F0F7FA]',
    amber:  'border-l-[#D97706] bg-[#FDF6EC]',
    purple: 'border-l-[#6B52AE] bg-[#F5F2FC]',
    blue:   'border-l-[#457B9D] bg-[#F0F5FA]',
    red:    'border-l-[#B91C1C] bg-[#FEF2F2]',
  };
  return (
    <div className={`border-l-4 ${colors[accent]} rounded-r-xl p-3.5 mb-3`}>
      <div className="text-xs text-[#3C4331] leading-relaxed">{children}</div>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${color}`}>
      {label}
    </span>
  );
}

function BuildingCard({
  icon, name, cost, maintenance, category, terrain, effect, special, riverOnly
}: {
  icon: string; name: string; cost: number; maintenance: number;
  category: string; terrain: string; effect: string; special?: string; riverOnly?: string;
}) {
  const catColor: Record<string, string> = {
    'Ökologie':      'bg-[#5a7247]/10 text-[#5a7247] border-[#5a7247]/20',
    'Hydrologie':    'bg-[#457b9d]/10 text-[#457b9d] border-[#457b9d]/20',
    'Artenschutz':   'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20',
    'Wirtschaft':    'bg-[#64748b]/10 text-[#64748b] border-[#64748b]/20',
    'Tourismus':     'bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20',
    'Infrastruktur': 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20',
  };
  return (
    <div className="bg-white border border-[#D4CCBA] rounded-xl p-4 hover:border-[#A8B89A] hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h4 className="text-sm font-black text-[#2C3322] font-display leading-tight">{name}</h4>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-black text-[#2C3322] font-mono">{cost} €</span>
          {maintenance > 0 && (
            <span className="text-[10px] font-mono text-amber-700">-{maintenance} €/Rd</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${catColor[category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
          {category}
        </span>
        <span className="text-[10px] font-mono bg-[#F2EDE4] text-[#8B8273] border border-[#D4CCBA] px-1.5 py-0.5 rounded">
          {terrain}
        </span>
        {riverOnly && (
          <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
            {riverOnly}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[#5C5549] leading-relaxed">{effect}</p>
      {special && (
        <div className="mt-2.5 bg-[#F2EDE4] rounded-lg px-2.5 py-2 text-[10px] font-mono text-[#3A3F45] border border-[#D4CCBA]/60">
          <span className="font-extrabold text-[#5A7247]">Spezialeffekt: </span>{special}
        </div>
      )}
    </div>
  );
}

function StrengthTable({ rows }: { rows: [number, string][] }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#D4CCBA] mb-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#E8E2D6] border-b border-[#D4CCBA]">
            <th className="text-left px-3 py-2 font-black text-[#8B8273] font-mono tracking-widest uppercase text-[10px]">Slot</th>
            <th className="text-left px-3 py-2 font-black text-[#8B8273] font-mono tracking-widest uppercase text-[10px]">Stärke-Effekt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([slot, effect]) => (
            <tr key={slot} className="border-b border-[#E8E2D6] last:border-0 hover:bg-[#F8F5EF]">
              <td className="px-3 py-2.5 font-black font-mono text-[#5A7247]">⚡{slot}</td>
              <td className="px-3 py-2.5 text-[#3C4331] leading-relaxed">{effect}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section Components ───────────────────────────────────────────────────────

function SectionUebersicht() {
  return (
    <div>
      <SectionTitle icon="🎮" title="Spielübersicht" subtitle="Ziel · Ressourcen · Rundensystem" />

      <RuleBox accent="green">
        <strong>Deine Mission:</strong> Als leitender Umweltbeauftragter im Kreis Düren rettest du die Rur.
        Verbessere die Gewässergüte nach EU-Wasserrahmenrichtlinie (WRRL), maximiere den FFH-Artenschutz und
        ermögliche die Rückkehr bedrohter Tierarten – allen voran des Atlantischen Lachses!
      </RuleBox>

      <h3 className="text-sm font-black text-[#2C3322] font-display mt-5 mb-3">Ressourcen</h3>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: '💶', name: 'Budget (€)', start: '25 €', gen: '+5 €/Runde (Grundsteuer) + Gebäudeerträge', use: 'Gebäude errichten, Forschung, Krisen bewältigen', color: 'border-[#5A7247]' },
          { icon: '🧪', name: 'Forschungspunkte', start: '3', gen: 'FORSCHEN-Aktionskarte, Natura-Zentrum (+1/Runde), Fabrik UMBAU-Modus', use: 'Technologien im Forschungsbaum erforschen', color: 'border-[#2A6F7E]' },
          { icon: '🌿', name: 'Naturpunkte', start: '0', gen: 'Gebäudeplatzierung (+3), Artfreischaltung (+15), passive Gebäudequellen', use: 'Siegpunkte – kein direkter Verbrauch', color: 'border-[#BC6C25]' },
          { icon: '⚠️', name: 'Klimarisiko (%)', start: '15 %', gen: '+2 % pro Runde (gedämpft durch Auwälder)', use: 'Löst Katastrophenereignisse aus', color: 'border-[#B91C1C]' },
        ].map(r => (
          <div key={r.name} className={`bg-white border-2 ${r.color} rounded-xl p-3.5`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{r.icon}</span>
              <span className="text-sm font-black text-[#2C3322] font-display">{r.name}</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div><span className="font-bold text-[#8B8273] font-mono uppercase text-[9px] tracking-wider">Start:</span> <span className="text-[#3C4331]">{r.start}</span></div>
              <div><span className="font-bold text-[#8B8273] font-mono uppercase text-[9px] tracking-wider">Einnahmen:</span> <span className="text-[#3C4331]">{r.gen}</span></div>
              <div><span className="font-bold text-[#8B8273] font-mono uppercase text-[9px] tracking-wider">Verwendung:</span> <span className="text-[#3C4331]">{r.use}</span></div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-black text-[#2C3322] font-display mt-5 mb-3">Rundensystem</h3>
      <RuleBox accent="teal">
        <strong>4 Runden = 1 Jahr</strong> · Start: 2026<br /><br />
        <strong>Jahreszeitenfolge:</strong> Frühling → Sommer → Herbst → Winter (dann wieder von vorn)<br /><br />
        <strong>Pro Runde passiert automatisch:</strong><br />
        • Budget-Einnahmen (Grundsteuer + Gebäudeerträge)<br />
        • Unterhaltskosten aller Gebäude werden abgezogen<br />
        • Passive Forschungs- und Naturpunkte werden gutgeschrieben<br />
        • Klimarisiko steigt um +2 % (je Auwald −0,25 %)<br />
        • In Sommerrunden: Klimaereignisprüfung
      </RuleBox>

      <h3 className="text-sm font-black text-[#2C3322] font-display mt-5 mb-3">Globale Metriken</h3>
      <div className="overflow-hidden rounded-xl border border-[#D4CCBA]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#E8E2D6] border-b border-[#D4CCBA]">
              <th className="text-left px-3 py-2 font-black text-[#8B8273] font-mono tracking-widest uppercase text-[10px]">Metrik</th>
              <th className="text-left px-3 py-2 font-black text-[#8B8273] font-mono tracking-widest uppercase text-[10px]">Schwellenwerte</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D6]">
            {[
              ['💧 WRRL-Güte (1,0–5,0)', '≤ 2,2 = Spitzenklasse (Lachstauglich) · ≤ 2,8 = Gut (Eisvogel) · ≤ 3,5 = Mäßig (Bachforelle) · > 3,5 = Kanalisiert'],
              ['🦅 FFH-Biotopschutz (0–100 %)', '≥ 65 % = Natura-2000-Großschutzgebiet (Achievement) · Jedes Gebäude erhöht lokalen Wert'],
              ['🐟 Durchgängigkeit (0–100 %)', 'Startet bei 30 % · +15 % je Fischpass · +12 % je Sohlgleite · −20 % bei aktivem Kleinkraftwerk · ≥ 60 % = Lachsmigration möglich'],
              ['⚠️ Klimarisiko (0–100 %)', '< 20 % = Klimaresistenz-Achievement · ≥ 30 % = Hochwasserrisiko · ≥ 40 % = Dürrerisiko'],
            ].map(([m, d]) => (
              <tr key={m} className="hover:bg-[#F8F5EF]">
                <td className="px-3 py-2.5 font-bold text-[#2C3322] font-mono whitespace-nowrap">{m}</td>
                <td className="px-3 py-2.5 text-[#5C5549] leading-relaxed">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionAktionskarten() {
  return (
    <div>
      <SectionTitle icon="🎴" title="Aktionskarten-System" subtitle="Fünf Slots · Stärke-Mechanik · Rurtalbahn-Sonderkarte" />

      <RuleBox accent="green">
        <strong>Das Kern-Prinzip:</strong> Es gibt 5 permanente Aktionsslots (1–5). Jeder Slot hat eine Stärke
        (= Slot-Nummer). Je weiter rechts eine Karte steht, desto mächtiger ist sie.<br /><br />
        <strong>Aktivierst du eine Karte</strong>, kehrt sie zurück auf Slot 1 (Stärke 1).
        Alle Karten rechts davon rücken einen Slot nach links und verlieren Stärke.
        Alle Karten links der ausgespielte Karte rücken nach rechts und <em>gewinnen</em> Stärke.<br /><br />
        <strong>Taktik:</strong> Lass wichtige Karten rechts liegen und anwachsen, bevor du sie zündest!
      </RuleBox>

      {/* BUILD */}
      <div className="bg-[#F4F8F1] border-2 border-[#5A7247]/30 rounded-2xl p-4.5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#5A7247] uppercase font-black">AKTIONSKARTE 1</div>
            <h3 className="text-base font-black text-[#2C3322] font-display">BAUEN</h3>
          </div>
        </div>
        <p className="text-xs text-[#5C5549] mb-3 leading-relaxed">
          Ermöglicht die Platzierung eines Gebäudes aus dem Gebäudekatalog auf einem erlaubten Geländefeld.
          Wähle zuerst ein Gebäude im Katalog, dann klicke auf ein gültiges Kartenfeld.
        </p>
        <StrengthTable rows={[
          [1, 'Max. Gebäudekosten: 4 € – nur einfachste Renaturierungen möglich'],
          [2, 'Max. Gebäudekosten: 6 €'],
          [3, 'Max. Gebäudekosten: 8 € · Materialrabatt: −1 € Baukosten'],
          [4, 'Max. Gebäudekosten: 10 € · Materialrabatt: −1 €'],
          [5, 'Max. Gebäudekosten: unbegrenzt · Materialrabatt: −2 € (Elite-Bauprogramm)'],
        ]} />
      </div>

      {/* PLANT */}
      <div className="bg-[#F4F8F1] border-2 border-[#4A7A3A]/30 rounded-2xl p-4.5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🌱</span>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#4A7A3A] uppercase font-black">AKTIONSKARTE 2</div>
            <h3 className="text-base font-black text-[#2C3322] font-display">BEPFLANZUNG</h3>
          </div>
        </div>
        <p className="text-xs text-[#5C5549] mb-3 leading-relaxed">
          Verwandelt Ackerflächen in Wiesen oder Wiesen in Auenwälder. Jede Umwandlung
          verbessert lokale FFH-Werte, reduziert Klimarisiko und schafft Lebensräume.
        </p>
        <StrengthTable rows={[
          [1, '1 Acker → Wiese (Kosten: 2 €)'],
          [2, '2 Äcker → Wiesen (je 1,5 €)'],
          [3, '1 Auenwald auf Wiese anlegen (kostenlos)'],
          [4, '1 Auenwald anlegen + 1 Acker umpflügen (kostenlos)'],
          [5, '2 Äcker/Gewerbe direkt zu Auenwald (kostenlos) · Klimarisiko −2 %'],
        ]} />
      </div>

      {/* HYDROLOGY */}
      <div className="bg-[#F0F7FA] border-2 border-[#2A6F7E]/30 rounded-2xl p-4.5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🌊</span>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#2A6F7E] uppercase font-black">AKTIONSKARTE 3</div>
            <h3 className="text-base font-black text-[#2C3322] font-display">HYDROLOGIE</h3>
          </div>
        </div>
        <p className="text-xs text-[#5C5549] mb-3 leading-relaxed">
          Verbessert Flussdynamik und Durchgängigkeit. Öffnet natürliche Strömungsmuster,
          fördert Selbstreinigung und reduziert Hochwasserrisiken im gesamten Tal.
        </p>
        <StrengthTable rows={[
          [1, '+5 FFH-Potenzial lokal'],
          [2, '+8 % Durchgängigkeit'],
          [3, '+8 % Durchgängigkeit + Feuchtigkeitsaktivierung in Aueabschnitten'],
          [4, '+12 % Durchgängigkeit (global)'],
          [5, '+15 % Durchgängigkeit + −10 % Hochwasserrisiko für alle Siedlungsfelder'],
        ]} />
      </div>

      {/* FUNDING */}
      <div className="bg-[#FDF6EC] border-2 border-[#D97706]/30 rounded-2xl p-4.5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💶</span>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#D97706] uppercase font-black">AKTIONSKARTE 4</div>
            <h3 className="text-base font-black text-[#2C3322] font-display">FÖRDERUNG</h3>
          </div>
        </div>
        <p className="text-xs text-[#5C5549] mb-3 leading-relaxed">
          Direkteinspeisung von Fördermitteln aus kommunalen, Landes- und EU-Töpfen.
          Stärke entscheidet über Herkunft und Höhe des Zuschusses.
        </p>
        <StrengthTable rows={[
          [1, '+3 € (Kreisförderung)'],
          [2, '+6 € (Naturstiftung NRW)'],
          [3, '+9 € (Landesmittel NRW)'],
          [4, '+12 € + 1 Forschungspunkt (Bundesumweltministerium)'],
          [5, '+16 € + 2 Forschungspunkte (EU LIFE+ Förderprogramm)'],
        ]} />
      </div>

      {/* RESEARCH */}
      <div className="bg-[#F5F2FC] border-2 border-[#6B52AE]/30 rounded-2xl p-4.5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🧪</span>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#6B52AE] uppercase font-black">AKTIONSKARTE 5</div>
            <h3 className="text-base font-black text-[#2C3322] font-display">FORSCHEN</h3>
          </div>
        </div>
        <p className="text-xs text-[#5C5549] mb-3 leading-relaxed">
          Generiert Forschungspunkte für den Technologiebaum. Je stärker der Slot,
          desto größer der wissenschaftliche Durchbruch und die Erkenntnisse für den Naturschutz.
        </p>
        <StrengthTable rows={[
          [1, '+1 Forschungspunkt'],
          [2, '+2 Forschungspunkte'],
          [3, '+3 Forschungspunkte + 1 Naturpunkt'],
          [4, '+5 Forschungspunkte + 2 Naturpunkte'],
          [5, '+7 Forschungspunkte + 4 Naturpunkte (Exzellenzcluster)'],
        ]} />
      </div>

      {/* RURTALBAHN */}
      <div className="bg-[#F2F0FA] border-2 border-[#4C3B9A]/25 rounded-2xl p-4.5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🚇</span>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#4C3B9A] uppercase font-black">SONDERKARTE</div>
            <h3 className="text-base font-black text-[#2C3322] font-display">RURTALBAHN-TICKET</h3>
          </div>
        </div>
        <RuleBox accent="purple">
          Kann für <strong>2 €</strong> geleast werden, um Slot 1 für <strong>3 Runden</strong> temporär zu ersetzen.
          Liefert Einnahmen-, Forschungs- und Naturpunkte-Boni pro Runde.<br /><br />
          <strong>Sperrung:</strong> Das Ticket ist nicht verfügbar, wenn die Fabrik im PRODUKTION-Modus läuft
          (Güterzugvorrang blockiert Personenverkehr). Gebäude <em>Rurtalbahn-Haltepunkt</em> muss auf der Karte stehen.
        </RuleBox>
      </div>
    </div>
  );
}

function SectionGebaeude() {
  return (
    <div>
      <SectionTitle icon="🏗️" title="Gebäudekatalog" subtitle="25 Projekte in 6 Kategorien" />

      <RuleBox accent="green">
        <strong>Bauregeln:</strong><br />
        • Jedes Gebäude hat erlaubte Geländetypen – platziere es nur dort.<br />
        • <strong>Nur auf Fluss:</strong> Kieslaichbett, Totholz-Eintrag, Rauhe Sohlgleite (müssen auf Wasser-Feldern stehen).<br />
        • <strong>Flussangrenzend:</strong> Altarm-Anschluss, Auenwald-Anpflanzung, Fischpass, Ufer-Entfesselung (müssen an ein Wasserfeld angrenzen).<br />
        • <strong>Abriss:</strong> Ein bestehendes Gebäude kann im Rückbau-Modus entfernt werden. Das Feld kehrt zum ursprünglichen Gelände zurück.<br />
        • <strong>Upgrades:</strong> Jedes Gebäude hat 3 Stufen (kostet 3–5 Forschungspunkte). Jedes Upgrade: +15 % FFH, −0,5 WRRL lokal.
      </RuleBox>

      {/* ÖKOLOGIE */}
      <h3 className="text-sm font-black text-[#5A7247] font-display mt-6 mb-3 flex items-center gap-2">
        <span>🌿</span> Ökologie & Renaturierung
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        <BuildingCard icon="🔀" name="Altarm-Anschluss" cost={8} maintenance={1} category="Ökologie" terrain="Auenwiese, Acker" riverOnly="Flussangrenzend" effect="Wiederanbindung von Altarmen. Senkt lokales Hochwasserrisiko um 15 %, +15 FFH, verbessert WRRL benachbarter Wasserfelder." special="Verbessert WRRL aller direkt angrenzenden Wasserfelder um −0,5." />
        <BuildingCard icon="🌳" name="Auenwald-Anpflanzung" cost={5} maintenance={0} category="Ökologie" terrain="Wiese, Auenwiese" riverOnly="Flussangrenzend" effect="Anlage eines Auengehölzes. +20 Feuchtigkeit, senkt Wassertemperatur, ermöglicht Biberreviere." special="Schaltet Biber-Schutzstation frei. Jeder Auenwald dämpft das globale Klimarisiko." />
        <BuildingCard icon="🪵" name="Totholz-Eintrag" cost={3} maintenance={0} category="Ökologie" terrain="Fluss (Wasser)" riverOnly="Nur Fluss" effect="+10 FFH durch Strukturvielfalt. Totholz im Gewässer schafft Unterschlupf und Laichhabitate für Fische." />
        <BuildingCard icon="⛏️" name="Ufer-Entfesselung" cost={6} maintenance={1} category="Ökologie" terrain="Wiese, Acker, Ufer" riverOnly="Flussangrenzend" effect="Entfernt Uferbefestigungen. Ermöglicht natürliche Flussdynamik und Eigenmäandrierung. +1 WRRL-Verbesserung." special="Voraussetzung für Eisvogel-Freischaltung (mit WRRL ≤ 2,8)." />
        <BuildingCard icon="🪨" name="Kieslaichbett" cost={4} maintenance={0} category="Ökologie" terrain="Fluss (Wasser)" riverOnly="Nur Fluss" effect="+20 Fischbiodiversität durch saubere Kiessubstrate. Ermöglicht Bachforellen- und Neunaugen-Laich." special="Voraussetzung für Bachforellen/Groppe-Freischaltung." />
      </div>

      {/* HYDROLOGIE */}
      <h3 className="text-sm font-black text-[#457B9D] font-display mt-6 mb-3 flex items-center gap-2">
        <span>🌊</span> Wasserwirtschaft & Hochwasserschutz
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        <BuildingCard icon="🐟" name="Fischpass / Fischtreppe" cost={7} maintenance={1} category="Hydrologie" terrain="Fluss, Wehr" riverOnly="Flussangrenzend" effect="+15 % Durchgängigkeit. Grundvoraussetzung für Lachsmigration flussaufwärts." special="Voraussetzung für Lachs-Freischaltung. Warnung: Kleinkraftwerk in der Nähe −20 % Wirkung." />
        <BuildingCard icon="🏞️" name="Deichrückverlegung" cost={10} maintenance={1} category="Hydrologie" terrain="Wiese, Acker" effect="Verlegt Deiche landeinwärts. −25 % Hochwasserrisiko im Sektor, +Feuchtigkeit. Schafft Überflutungsraum." />
        <BuildingCard icon="💧" name="Retentionsraum / Polder" cost={9} maintenance={1} category="Hydrologie" terrain="Wiese, Acker, Auenwiese" effect="Flutungspolder puffert Hochwasserwellen. Schützt benachbarte Siedlungsfelder vor Überflutung." special="Mit Technologie 'Auen-Vitalisierung' 100 % Wirksamkeit gegen Hochwasser-Ereignisse." />
        <BuildingCard icon="🏔️" name="Rauhe Sohlgleite" cost={5} maintenance={0} category="Hydrologie" terrain="Fluss (Wasser)" riverOnly="Nur Fluss" effect="Naturnahe Rampe im Flussbett. +10 % Durchgängigkeit, +Sauerstoffeintrag, verbessert WRRL." special="Mit Technologie 'Sohlgleiten-Technologie': −1 € Baukosten, +10 extra FFH." />
        <BuildingCard icon="🌧️" name="Regenrückhaltebecken" cost={6} maintenance={2} category="Hydrologie" terrain="Siedlung, Gewerbe" effect="Urbanes Versickerungsbecken. Verhindert Starkregen-Überflutung in Siedlungen. Verbessert WRRL aller angrenzenden Flussfelder um −1." />
      </div>

      {/* ARTENSCHUTZ */}
      <h3 className="text-sm font-black text-[#D97706] font-display mt-6 mb-3 flex items-center gap-2">
        <span>🦫</span> Fauna & Artenschutz
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        <BuildingCard icon="🦫" name="Biber-Schutzstation" cost={5} maintenance={1} category="Artenschutz" terrain="Auenwiese, Wiese" effect="+2 Naturpunkte/Runde. Schadensersatz bei Biberkonflikten halbiert." special="Voraussetzung: Min. 2 Auwälder auf Karte + Biber-Management-Plan erforscht." />
        <BuildingCard icon="🐟" name="Lachs-Zuchtstation" cost={8} maintenance={2} category="Artenschutz" terrain="Fluss, Siedlung" effect="+3 Naturpunkte/Runde. Zucht und Wiederansiedlung junger Lachse." special="Freigabe: Durchgängigkeit ≥ 50 % + Lachsprogramm NRW erforscht. Voraussetzung für Atlantischen Lachs." />
        <BuildingCard icon="🐦" name="Eisvogel-Nisthilfe" cost={3} maintenance={0} category="Artenschutz" terrain="Steilufer, Wiese" riverOnly="Flussangrenzend" effect="+10 FFH lokal. +1 Naturpunkt/Runde durch Brutpaar-Monitoring." />
        <BuildingCard icon="🦋" name="Insektenhotel & Blühstreifen" cost={2} maintenance={0} category="Artenschutz" terrain="Wiese, Acker, Siedlung" effect="+12 FFH lokal durch Blütenvielfalt. Fördert Bestäuber-Netzwerke." special="Voraussetzung für Blauschillernden Feuerfalter (mit FFH ≥ 45 %)." />
        <BuildingCard icon="🏛️" name="Natura 2000 Infozentrum" cost={12} maintenance={3} category="Artenschutz" terrain="Siedlung, Wiese" effect="+1 Forschungspunkt/Runde + 3 Naturpunkte/Runde. Steigert öffentliche Akzeptanz für Renaturierung." />
      </div>

      {/* WIRTSCHAFT */}
      <h3 className="text-sm font-black text-[#64748B] font-display mt-6 mb-3 flex items-center gap-2">
        <span>💶</span> Wirtschaft & Landwirtschaft
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        <BuildingCard icon="🛶" name="Öko-Tourismus-Station" cost={6} maintenance={0} category="Wirtschaft" terrain="Siedlung, Wiese" effect="+2 €/Runde. Kanuverleih und geführte Naturführungen." special="Geringer Wildtier-Stress: −5 FFH lokal. Abwägen mit Artenschutz-Zielen!" />
        <BuildingCard icon="⚡" name="Klein-Wasserkraftwerk" cost={15} maintenance={1} category="Wirtschaft" terrain="Fluss (Wasser)" riverOnly="Flussangrenzend" effect="+5 €/Runde. Grüne Energiegewinnung – jedoch mit ökologischen Kosten." special="Achtung: Wenn kein Fischpass direkt angrenzend, −20 % Durchgängigkeit. Blockiert Rurtalbahn-Ticket." />
        <BuildingCard icon="🚜" name="Intensive Landwirtschaft" cost={8} maintenance={0} category="Wirtschaft" terrain="Acker" effect="+8 €/Runde. Hochertragsanbau bringt viel Steuereinnahmen." special="Risiko: −1 WRRL durch Nitrat- und Pestizideintrag ins Grundwasser. Im Dürresommer: −1,5 WRRL zusätzlich." />
        <BuildingCard icon="🐄" name="Extensive Viehweide" cost={4} maintenance={0} category="Wirtschaft" terrain="Wiese, Acker" effect="+2 €/Runde. Extensivlandwirtschaft bewahrt Artenvielfalt. Keine Wasserverschmutzung." />
        <BuildingCard icon="🏭" name="Kläranlagen-Upgrade" cost={14} maintenance={3} category="Wirtschaft" terrain="Siedlung, Gewerbe" effect="+1,5 WRRL für alle Flussfelder flussabwärts. 4. Reinigungsstufe mit Aktivkohle und Ozon." special="Mit 'Fortschrittliche Abwasserreinigung' erforscht: Unterhalt entfällt (−3 €/Runde)." />
      </div>

      {/* INFRASTRUKTUR & TOURISMUS */}
      <h3 className="text-sm font-black text-[#A855F7] font-display mt-6 mb-3 flex items-center gap-2">
        <span>🚇</span> Infrastruktur & Tourismus
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BuildingCard icon="🚂" name="Rurtalbahn-Haltepunkt" cost={8} maintenance={1} category="Infrastruktur" terrain="Siedlung, Gewerbe" effect="Schaltet die Rurtalbahn-Sonderkarte frei. −1 € Baurabatt für alle Gebäude im Umkreis von 2 Feldern." />
        <BuildingCard icon="🏕️" name="Natur-Campingplatz" cost={6} maintenance={0} category="Tourismus" terrain="Wiese, Auenwiese" effect="+3 €/Runde. Naturnahes Camping im Rurtal." special="Leichte Störung der Tierwelt: −5 FFH lokal." />
        <BuildingCard icon="🏛️" name="Besucherzentrum Rurtal" cost={10} maintenance={1} category="Tourismus" terrain="Siedlung" effect="+4 €/Runde + 2 Naturpunkte/Runde. Modernes Informationszentrum mit Ausstellung zur Renaturierung." />
        <BuildingCard icon="🛶" name="Kanuverleih & Anlegestelle" cost={4} maintenance={0} category="Tourismus" terrain="Fluss, Siedlung" riverOnly="Flussangrenzend" effect="+2 €/Runde. Ergänzt Öko-Tourismus." special="Leichte Wasserqualitätsbeeinträchtigung durch Bootsverkehr." />
      </div>
    </div>
  );
}

function SectionTerrain() {
  return (
    <div>
      <SectionTitle icon="🌱" title="Terrain & Bepflanzung" subtitle="6 Geländetypen · BEPFLANZUNG-Karte · Umwandlungslogik" />

      <h3 className="text-sm font-black text-[#2C3322] font-display mb-3">Geländetypen</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        {[
          { icon: '💧', name: 'Wasser (Fluss)', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-800', desc: 'Hauptkorridor der Rur. Hier liegen alle Flussgütewerte (WRRL). Nur Fluss-exklusive Gebäude können hier gebaut werden (Kieslaichbett, Totholz, Sohlgleite). Grundlage aller Fischwanderungen.' },
          { icon: '🌾', name: 'Wiese (Grünland)', color: 'bg-green-50 border-green-200', textColor: 'text-green-800', desc: 'Standardnaturgelände. Auf Wiesen sind die meisten ökologischen Gebäude erlaubt. Kann per BEPFLANZUNG-Karte zu Auenwald umgewandelt werden.' },
          { icon: '🌳', name: 'Auenwald', color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-800', desc: 'Hochwertiger Lebensraum. Entsteht durch BEPFLANZUNG-Karte oder Auenwald-Anpflanzung. Jeder Auenwald: −0,25 % Klimarisiko/Runde, hohe FFH-Werte, Biber-Voraussetzung.' },
          { icon: '🚜', name: 'Acker (Landwirtschaft)', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-800', desc: 'Intensive Landwirtschaftsfläche. Kann Intensive Landwirtschaft und Extensive Viehweide tragen. Per BEPFLANZUNG-Karte zu Wiese oder Auenwald umwandelbar.' },
          { icon: '🏘️', name: 'Siedlung', color: 'bg-slate-50 border-slate-200', textColor: 'text-slate-800', desc: 'Urbaner Bereich. Trägt Infrastruktur- und Tourismusgebäude. Besonders hochwassergefährdet in ungschützten Bereichen. Klärwerk hier möglich.' },
          { icon: '🏭', name: 'Gewerbe/Industrie', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-800', desc: 'Industriegelände mit der Schoellershammer-Fabrik. Im PRODUKTION-Modus senkt die Fabrik die WRRL massiv. Klärwerk und Rurtalbahn-Haltepunkt hier baubar.' },
        ].map(t => (
          <div key={t.name} className={`${t.color} border rounded-xl p-3.5`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{t.icon}</span>
              <span className={`text-sm font-black font-display ${t.textColor}`}>{t.name}</span>
            </div>
            <p className="text-[11px] text-[#5C5549] leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-black text-[#2C3322] font-display mt-5 mb-3">BEPFLANZUNG-Aktionskarte – Umwandlungslogik</h3>
      <RuleBox accent="green">
        <strong>Acker → Wiese:</strong> Kostet 1,5–2 € (je nach Stärke). Entfernt Dünger-/Pestizidrückstände, verbessert lokale FFH, kann direkt bebaut werden.<br /><br />
        <strong>Wiese → Auenwald:</strong> Kostenlos ab Stärke 3. Der neue Auenwald wächst ab der nächsten Runde und dämpft das Klimarisiko dauerhaft.<br /><br />
        <strong>Acker/Gewerbe → Auenwald (Stärke 5):</strong> Direkte Transformation, Klimarisiko sofort −2 %. Nur an geeigneten Standorten möglich.
      </RuleBox>

      <h3 className="text-sm font-black text-[#2C3322] font-display mt-5 mb-3">Flusszonen</h3>
      <div className="overflow-hidden rounded-xl border border-[#D4CCBA]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#E8E2D6] border-b border-[#D4CCBA]">
              <th className="text-left px-3 py-2 font-black text-[#8B8273] font-mono tracking-widest uppercase text-[10px]">Zone</th>
              <th className="text-left px-3 py-2 font-black text-[#8B8273] font-mono tracking-widest uppercase text-[10px]">Charakteristik</th>
              <th className="text-left px-3 py-2 font-black text-[#8B8273] font-mono tracking-widest uppercase text-[10px]">WRRL Start</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D6]">
            <tr className="hover:bg-[#F8F5EF]">
              <td className="px-3 py-2.5 font-bold text-[#2C3322] font-mono">Oberlauf (Süd)</td>
              <td className="px-3 py-2.5 text-[#5C5549]">Stausee Obermaubach, naturnahe Eifelstrecke. Hohe FFH-Werte (35), Schutzgebiet.</td>
              <td className="px-3 py-2.5 font-mono text-green-700 font-bold">1,8 – Gut</td>
            </tr>
            <tr className="hover:bg-[#F8F5EF]">
              <td className="px-3 py-2.5 font-bold text-[#2C3322] font-mono">Mittellauf (Düren)</td>
              <td className="px-3 py-2.5 text-[#5C5549]">Industriegebiet, Schoellershammer-Fabrik. Kritisch belastet, geringes FFH (10), hohes Hochwasserrisiko.</td>
              <td className="px-3 py-2.5 font-mono text-red-700 font-bold">4,5 – Schlecht</td>
            </tr>
            <tr className="hover:bg-[#F8F5EF]">
              <td className="px-3 py-2.5 font-bold text-[#2C3322] font-mono">Unterlauf (Jülich)</td>
              <td className="px-3 py-2.5 text-[#5C5549]">Agrarlandschaft Jülicher Börde. Moderate Belastung durch Landwirtschaft, FFH 18.</td>
              <td className="px-3 py-2.5 font-mono text-amber-700 font-bold">3,9 – Mäßig</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionForschung() {
  return (
    <div>
      <SectionTitle icon="🔬" title="Forschungsbaum" subtitle="6 Technologien · Abhängigkeiten · 3 Stufen" />

      <RuleBox accent="teal">
        <strong>So funktioniert der Forschungsbaum:</strong><br />
        Erforsche Technologien durch die FORSCHEN-Aktionskarte oder passive Quellen.
        Viele Technologien haben <strong>Voraussetzungen</strong> – du musst erst das Vorgänger-Projekt erforschen.
        Jede Technologie bringt permanente Effekte und schaltet ggf. neue Gebäude oder Zielarten frei.
      </RuleBox>

      <div className="space-y-4">
        {/* Stufe I */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full font-mono tracking-wider">STUFE I – GRUNDLAGEN</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {[
              {
                icon: '🦫', name: 'Biber-Management-Plan', cost: 5, color: 'border-emerald-300 bg-emerald-50',
                badge: 'bg-emerald-100 text-emerald-800',
                effect: 'Biberkonflikte kosten 50 % weniger. Biber-Schutzstationen generieren 2× Naturpunkte.',
                unlocks: 'Biber-Schutzstation (Gebäude) · Eurasischer Biber (Art)',
                path: '→ Auen-Vitalisierung',
              },
              {
                icon: '🐟', name: 'Lachsprogramm NRW', cost: 8, color: 'border-rose-300 bg-rose-50',
                badge: 'bg-rose-100 text-rose-800',
                effect: '+30 % Lachs-Wiederansiedlungschance. Lachs-Zuchtstation wird baubar.',
                unlocks: 'Lachs-Zuchtstation (Gebäude) · Atlantischer Lachs (Zielpfad)',
                path: '→ Fabrik-Transformationskonzept',
              },
              {
                icon: '🧱', name: 'Sohlgleiten-Technologie', cost: 6, color: 'border-blue-300 bg-blue-50',
                badge: 'bg-blue-100 text-blue-800',
                effect: 'Rauhe Sohlgleite: −1 € Baukosten, +10 extra FFH-Potenzial.',
                unlocks: 'Verbesserte Sohlgleite-Wirkung',
                path: '→ Fortschr. Abwasserreinigung',
              },
            ].map(t => (
              <div key={t.name} className={`border-2 ${t.color} rounded-xl p-3.5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{t.icon}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${t.badge}`}>{t.cost} 🧪</span>
                </div>
                <h4 className="text-xs font-black text-[#2C3322] font-display mb-2">{t.name}</h4>
                <p className="text-[11px] text-[#5C5549] leading-relaxed mb-2">{t.effect}</p>
                <div className="text-[10px] font-mono text-emerald-700 font-bold">🔓 {t.unlocks}</div>
                <div className="text-[10px] font-mono text-purple-700 mt-1">{t.path}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stufe II */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-full font-mono tracking-wider">STUFE II – AUFBAU (SYNERGIEN)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[
              {
                icon: '🌳', name: 'Auen-Vitalisierung & Poldereffizienz', cost: 10, req: 'Biber-Management-Plan',
                color: 'border-emerald-300 bg-emerald-50/60', badge: 'bg-emerald-100 text-emerald-800',
                effect: 'Retentionsräume werden 100 % effektiv gegen Hochwasser-Ereignisse. Auwälder wachsen 2× schneller. Deichrückbauten erhalten Bonuseffekte.',
              },
              {
                icon: '💧', name: 'Fortschrittliche Abwasserreinigung', cost: 12, req: 'Sohlgleiten-Technologie',
                color: 'border-cyan-300 bg-cyan-50/60', badge: 'bg-cyan-100 text-cyan-800',
                effect: 'Kläranlagen-Upgrade-Gebäude: Unterhalt entfällt (−3 €/Runde). Aktivkohle-Ozonstufe für alle Klärwerke im Kreis Düren.',
                path: '→ Fabrik-Transformationskonzept',
              },
            ].map(t => (
              <div key={t.name} className={`border-2 ${t.color} rounded-xl p-3.5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{t.icon}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${t.badge}`}>{t.cost} 🧪</span>
                </div>
                <h4 className="text-xs font-black text-[#2C3322] font-display mb-1">{t.name}</h4>
                <div className="text-[10px] font-mono text-amber-700 mb-2">Voraussetzung: {t.req}</div>
                <p className="text-[11px] text-[#5C5549] leading-relaxed">{t.effect}</p>
                {t.path && <div className="text-[10px] font-mono text-purple-700 mt-2">{t.path}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Stufe III */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-1 rounded-full font-mono tracking-wider">STUFE III – TRANSFORMATION (ZIEL)</span>
          </div>
          <div className="bg-purple-50/70 border-2 border-purple-300 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏭</span>
                <h4 className="text-base font-black text-purple-900 font-display">Fabrik-Transformationskonzept</h4>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-black px-3 py-1 rounded-full font-mono">18 🧪</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[10px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">Voraussetzung: Lachsprogramm NRW</span>
              <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">Voraussetzung: Fortschr. Abwasserreinigung</span>
            </div>
            <p className="text-xs text-[#5C5549] mb-4 leading-relaxed">
              Wissenschaftliche Machbarkeitsstudie zur emissionsfreien Umrüstung der Papierfabrik Schoellershammer.
            </p>
            <div className="bg-white border-2 border-purple-300 rounded-xl p-3 text-sm font-black text-purple-900 text-center">
              👑 Schaltet Fabrik-Modus "VOLLSTÄNDIGE RENATURIERUNG" frei — Heimkehr des Atlantischen Lachses!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionFabrik() {
  return (
    <div>
      <SectionTitle icon="🏭" title="Papierfabrik Schoellershammer" subtitle="4 Betriebsmodi · Wirtschaft vs. Ökologie" />

      <RuleBox accent="amber">
        Die Papierfabrik Schoellershammer ist fix auf dem Karte bei Feld (6,6) platziert und kann nicht abgerissen werden.
        Sie bietet 4 umschaltbare Betriebsmodi. Nur ein Modus kann gleichzeitig aktiv sein.
        Der Modus bestimmt maßgeblich die WRRL im Mittellauf und dein Einkommen!
      </RuleBox>

      <div className="space-y-3 mt-4">
        {[
          {
            icon: '⚙️', name: 'PRODUKTION', badge: 'Immer verfügbar',
            badgeColor: 'bg-slate-100 text-slate-700',
            color: 'border-slate-300 bg-slate-50',
            income: '+15 €/Runde',
            wrrl: '−1,0 WRRL/Jahr (starke Verschmutzung)',
            rurtalbahn: '❌ Gesperrt (Güterzug-Vorrang)',
            research: 'Keine',
            effect: 'Maximale Steuereinnahmen. Hohe industrielle Wasserbelastung. Rurtalbahn-Ticket nicht verfügbar (kein Personenverkehr). Kein Beitrag zu Forschung.',
          },
          {
            icon: '🔧', name: 'UMBAU / MODERNISIERUNG', badge: 'Immer verfügbar',
            badgeColor: 'bg-amber-100 text-amber-800',
            color: 'border-amber-300 bg-amber-50',
            income: '+5 €/Runde (−3 € Umbaukosten = Netto: +2 €)',
            wrrl: 'Neutral – keine Verschlechterung',
            rurtalbahn: '⚠️ Teilweise verfügbar',
            research: '+1 Forschungspunkt/Runde',
            effect: 'Übergangsphase. Weniger Einnahmen, aber passive Forschungsproduktion. Gut wenn Forschungspunkte knapp sind.',
          },
          {
            icon: '🔒', name: 'STILLLEGUNG', badge: 'Immer verfügbar',
            badgeColor: 'bg-gray-100 text-gray-700',
            color: 'border-gray-300 bg-gray-50',
            income: '−2 €/Runde (Versiegelungskosten)',
            wrrl: '+0,5 WRRL/Jahr (langsame Regeneration)',
            rurtalbahn: '✅ Voll verfügbar',
            research: 'Keine',
            effect: 'Keine Einnahmen, aber der Fluss erholt sich langsam. Rurtalbahn-Ticket frei. Nur sinnvoll wenn Budget ausreichend und WRRL-Ziele priorisiert.',
          },
          {
            icon: '🌿', name: 'VOLLSTÄNDIGE RENATURIERUNG', badge: 'Benötigt: Fabrik-Transformationskonzept',
            badgeColor: 'bg-purple-100 text-purple-800',
            color: 'border-purple-300 bg-purple-50',
            income: '−3 €/Runde (subventioniert)',
            wrrl: '+2,0 WRRL/Jahr (dramatische Verbesserung)',
            rurtalbahn: '✅ Öko-Express-Netz (Bonus)',
            research: 'Lachs-Migration möglich',
            effect: 'Der Endzustand. Stärkste WRRL-Verbesserung im Spiel, +35 FFH im Dürener Stadtsektor. Lachsmigration wird ermöglicht (mit Lachs-Zuchtstation + 60 % Durchgängigkeit).',
          },
        ].map(m => (
          <div key={m.name} className={`border-2 ${m.color} rounded-2xl p-4.5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <h4 className="text-sm font-black text-[#2C3322] font-display">{m.name}</h4>
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded mt-0.5 inline-block ${m.badgeColor}`}>{m.badge}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-[11px]">
              <div><span className="font-bold text-[#8B8273] font-mono uppercase text-[9px] tracking-wider block">Einnahmen</span><span className="text-[#3C4331] font-mono font-bold">{m.income}</span></div>
              <div><span className="font-bold text-[#8B8273] font-mono uppercase text-[9px] tracking-wider block">WRRL-Effekt</span><span className="text-[#3C4331] font-mono font-bold">{m.wrrl}</span></div>
              <div><span className="font-bold text-[#8B8273] font-mono uppercase text-[9px] tracking-wider block">Rurtalbahn</span><span className="text-[#3C4331] font-mono">{m.rurtalbahn}</span></div>
              <div><span className="font-bold text-[#8B8273] font-mono uppercase text-[9px] tracking-wider block">Forschung</span><span className="text-[#3C4331] font-mono">{m.research}</span></div>
            </div>
            <p className="text-[11px] text-[#5C5549] leading-relaxed">{m.effect}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionArtenschutz() {
  return (
    <div>
      <SectionTitle icon="🦫" title="Artenschutz & Zielarten" subtitle="5 Leitarten der Rur · Freischaltbedingungen · Effekte" />

      <RuleBox accent="amber">
        Fünf gefährdete Rur-Leitarten können im Verlauf des Spiels wiederangesiedelt werden.
        Jede Art verfolgt einen Fortschrittsbalken (0–100 %). Bei Erreichen von 100 % wird die Art
        als etabliert gewertet: <strong>+15 Naturpunkte</strong> sofort + permanente Ökosystem-Vorteile.
        Die Freischaltung erfordert das Erfüllen mehrerer ökologischer Bedingungen.
      </RuleBox>

      <div className="space-y-4 mt-4">
        {[
          {
            icon: '🐟', name: 'Bachforelle & Groppe', latin: 'Salmo trutta fario / Cottus gobio',
            color: 'border-cyan-300 bg-cyan-50',
            difficulty: 'Einsteiger',
            diffColor: 'bg-cyan-100 text-cyan-800',
            conditions: [
              'Globale WRRL ≤ 3,5 (Mäßig oder besser)',
              'Mindestens 1 Kieslaichbett auf der Karte',
            ],
            effect: 'Bioindikatoren für gesunden Oberlauf. Voraussetzung für Eisvogel-Freischaltung.',
          },
          {
            icon: '🦫', name: 'Eurasischer Biber', latin: 'Castor fiber',
            color: 'border-amber-300 bg-amber-50',
            difficulty: 'Mittel',
            diffColor: 'bg-amber-100 text-amber-800',
            conditions: [
              'Mindestens 2 Auenwälder auf der Karte',
              'Biber-Management-Plan erforscht',
              'Biber-Schutzstation gebaut',
            ],
            effect: 'Öko-Ingenieur schafft sekundäre Feuchtbiotope. Erzeugt regelmäßige Biber-Konflikte (bewältigbar). +2 Naturpunkte/Runde passiv.',
          },
          {
            icon: '🦋', name: 'Blauschillernder Feuerfalter', latin: 'Lycaena helle',
            color: 'border-purple-300 bg-purple-50',
            difficulty: 'Mittel',
            diffColor: 'bg-purple-100 text-purple-800',
            conditions: [
              'Mindestens 2 Insektenhotels & Blühstreifen auf der Karte',
              'Globale FFH ≥ 45 %',
            ],
            effect: 'Wiesenpezialist, fragil. Indikator für intakte Feuchtwiesen. Dauerhaft +8 FFH durch Bestäuber-Netzwerk.',
          },
          {
            icon: '🐦', name: 'Eisvogel', latin: 'Alcedo atthis',
            color: 'border-blue-300 bg-blue-50',
            difficulty: 'Schwer',
            diffColor: 'bg-blue-100 text-blue-800',
            conditions: [
              'Ufer-Entfesselung gebaut (natürliche Steilufer)',
              'Globale WRRL ≤ 2,8 (Gut)',
              'Bachforelle & Groppe bereits freigeschaltet',
            ],
            effect: 'Benötigt kristallklares Wasser und natürliche Ufer. Indikator für Spitzenqualität. +3 Naturpunkte/Runde.',
          },
          {
            icon: '👑', name: 'Atlantischer Lachs', latin: 'Salmo salar',
            color: 'border-amber-400 bg-amber-50/80 shadow-amber-100',
            difficulty: 'Endziel',
            diffColor: 'bg-amber-400 text-white',
            conditions: [
              'Durchgängigkeit ≥ 60 %',
              'Fabrik NICHT im PRODUKTION-Modus',
              'Lachs-Zuchtstation gebaut',
              'Lachsprogramm NRW erforscht',
              'Fabrik-Transformationskonzept erforscht (für optimales Ergebnis)',
            ],
            effect: 'Der ultimative Siegeszug! +15 Naturpunkte beim Freischalten + Achievement "Rückkehr des Königs". Der Lachs als Leitart zeigt: Die Rur lebt wieder!',
          },
        ].map(s => (
          <div key={s.name} className={`border-2 ${s.color} rounded-2xl p-4.5`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <h4 className="text-base font-black text-[#2C3322] font-display">{s.name}</h4>
                  <div className="text-[10px] font-mono text-[#8B8273] italic">{s.latin}</div>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full font-mono shrink-0 ${s.diffColor}`}>{s.difficulty}</span>
            </div>
            <div className="mb-3">
              <div className="text-[10px] font-mono font-black text-[#8B8273] uppercase tracking-wider mb-2">Freischaltbedingungen:</div>
              <ul className="space-y-1">
                {s.conditions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-[#3C4331]">
                    <span className="text-[#5A7247] font-black shrink-0 mt-0.5">✓</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/60 rounded-lg px-3 py-2 text-[11px] text-[#5C5549] leading-relaxed">
              <span className="font-bold text-[#3C4331]">Effekt: </span>{s.effect}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionKlima() {
  return (
    <div>
      <SectionTitle icon="⚡" title="Klimaereignisse" subtitle="4 Krisenereignisse · Auslöser · Entscheidungen" />

      <RuleBox accent="red">
        <strong>Klimarisiko-System:</strong> Das Klimarisiko steigt jede Runde um +2 %. Ab bestimmten Schwellenwerten
        werden in Sommerrunden Klimaereignisse ausgewürfelt. Jedes Ereignis erzwingt eine Entscheidung
        mit wirtschaftlichen oder ökologischen Konsequenzen.<br /><br />
        <strong>Dämpfung:</strong> Jeder Auenwald senkt den Risikoanstieg um −0,25 % pro Runde dauerhaft.
        Ökologische Schutzbauten können Schäden erheblich reduzieren.
      </RuleBox>

      <div className="space-y-4 mt-4">
        {[
          {
            icon: '🌊', name: 'Extrem-Hochwasser', trigger: 'Klimarisiko ≥ 30 %',
            triggerColor: 'bg-blue-100 text-blue-800',
            color: 'border-blue-300 bg-blue-50',
            desc: 'Außergewöhnliche Pegelstände bedrohen Siedlungen und Infrastruktur im Rurtal.',
            options: [
              { label: 'Hochwasserschutz prüfen', effect: 'Schaden wird durch Deichrückverlegung ODER (Polder + Auen-Vitalisierung) vollständig abgefangen. Ohne Schutz: −12 € Katastrophenschaden.' },
            ],
          },
          {
            icon: '☀️', name: 'Jahrhundert-Dürresommer', trigger: 'Klimarisiko ≥ 40 %',
            triggerColor: 'bg-orange-100 text-orange-800',
            color: 'border-orange-300 bg-orange-50',
            desc: 'Extremhitze und Wassermangel. Niedrigwasser gefährdet alle Wasserlebewesen und die Wasserversorgung.',
            options: [
              { label: 'Talsperre-Notflutung (−4 €)', effect: 'Erzwungene Wasserabgabe aus dem Stausee Obermaubach mindert Niedrigwasserschäden.' },
              { label: 'Naturereignis aussitzen', effect: '−1 WRRL global. Intensive Landwirtschaft: zusätzlich −1,5 WRRL durch Düngereintrag. Hält 2 Runden an.' },
            ],
          },
          {
            icon: '🦫', name: 'Biber-Konflikt', trigger: 'Nach Biber-Freischaltung',
            triggerColor: 'bg-amber-100 text-amber-800',
            color: 'border-amber-300 bg-amber-50',
            desc: 'Biber-Dämme überfluten Ackerflächen. Landwirte fordern Entschädigung oder Entfernung der Dämme.',
            options: [
              { label: 'Ausgleichszahlung leisten (−6 € / −3 € mit Management)', effect: '+5 Naturpunkte. Biberbauten bleiben. Mit Biber-Management-Plan: Kosten halbiert auf 3 €.' },
              { label: 'Dämme abtragen', effect: '−30 % Biber-Fortschritt. Art verliert Etablierungsstatus temporär. Günstigere Lösung, schadet aber langfristig.' },
            ],
          },
          {
            icon: '📢', name: 'Bürgerdialog & Gegenwind', trigger: 'Nach Ufer-Entfesselung',
            triggerColor: 'bg-rose-100 text-rose-800',
            color: 'border-rose-300 bg-rose-50',
            desc: 'Anwohner protestieren gegen Renaturierungsmaßnahmen. Fehlende Kommunikation führt zu Widerstand.',
            options: [
              { label: 'Aufklärungskampagne (−4 €)', effect: 'Öffentliche Akzeptanz steigt. Natura-2000-Infozentrum reduziert dieses Risiko dauerhaft.' },
              { label: 'Abwarten', effect: 'Nächste Aktionskartenausführung kostet eine zusätzliche Runde Verzögerung.' },
            ],
          },
        ].map(ev => (
          <div key={ev.name} className={`border-2 ${ev.color} rounded-2xl p-4.5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{ev.icon}</span>
                <div>
                  <h4 className="text-sm font-black text-[#2C3322] font-display">{ev.name}</h4>
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded mt-0.5 inline-block ${ev.triggerColor}`}>Auslöser: {ev.trigger}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#5C5549] mb-3 leading-relaxed">{ev.desc}</p>
            <div className="space-y-2">
              {ev.options.map((opt, i) => (
                <div key={i} className="bg-white/70 rounded-lg p-2.5 text-[11px]">
                  <div className="font-bold text-[#2C3322] mb-1">Option: „{opt.label}"</div>
                  <div className="text-[#5C5549] leading-relaxed">{opt.effect}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionLayer() {
  return (
    <div>
      <SectionTitle icon="🗺️" title="Kartenebenen & Visualisierung" subtitle="4 Anzeigemodi · Isometrische Karte · Gebäude-Inspektor" />

      <h3 className="text-sm font-black text-[#2C3322] font-display mb-3">Kartenebenen umschalten</h3>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: '🏞️', name: 'NORMAL', color: 'border-[#5A7247] bg-[#F4F8F1]', desc: 'Standardansicht mit Geländedarstellung, Gebäuden und Bauplatz-Highlights. Gültige Bauplätze leuchten auf, wenn ein Gebäude ausgewählt ist.' },
          { icon: '💧', name: 'WRRL-GÜTE', color: 'border-[#2A6F7E] bg-[#F0F7FA]', desc: 'Farbskala der ökologischen Gewässergüte. Dunkelgrün = Spitze (1,0), Rot/Braun = Schlecht (5,0). Zeigt direkt wo Renaturierungsbedarf besteht.' },
          { icon: '🦅', name: 'FFH-BIOTOP', color: 'border-[#D97706] bg-[#FDF6EC]', desc: 'Artenvielfalt-Heatmap. Zeigt unberührte Schutzgebiete und Potenzialflächen. Je grüner, desto artenreicher. Braune Flächen brauchen Aufwertung.' },
          { icon: '🏠', name: 'HOCHWASSER', color: 'border-[#B91C1C] bg-[#FEF2F2]', desc: 'Überflutungsrisiko. Rote Felder sind akut hochwassergefährdet. Blaue Felder sind geschützt. Deiche, Polder und Auwälder reduzieren das Risiko.' },
        ].map(l => (
          <div key={l.name} className={`border-2 ${l.color} rounded-xl p-3.5`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{l.icon}</span>
              <span className="text-sm font-black font-mono text-[#2C3322]">{l.name}</span>
            </div>
            <p className="text-[11px] text-[#5C5549] leading-relaxed">{l.desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-black text-[#2C3322] font-display mt-5 mb-3">Gebäude-Inspektor</h3>
      <RuleBox accent="teal">
        Klicke auf ein bereits gebautes Gebäude auf der Karte, um den <strong>Gebäude-Inspektor</strong> unten anzuzeigen.
        Er zeigt: Name, Kategorie, Koordinaten, Geländetyp, Baukosten, Unterhalt, detaillierte Spezialeffekte
        und aktuelles Upgrade-Level. Verwende den Inspektor, um den Wert jeder Investition zu bewerten.
      </RuleBox>

      <h3 className="text-sm font-black text-[#2C3322] font-display mt-5 mb-3">Bau- & Rückbau-Modus</h3>
      <RuleBox accent="green">
        <strong>Bau-Modus:</strong> Wähle zuerst ein Gebäude im Katalog, dann klicke auf ein gültig
        hervorgehobenes Feld (heller Schimmer = erlaubt). Das Gebäude kostet Budget und bezieht BAUEN-Aktionskarten-Rabatte ein.<br /><br />
        <strong>Rückbau-Modus:</strong> Aktiviere ihn über den Werkzeug-Button im HUD. Klicke dann auf
        ein bebautes Feld, um das Gebäude zu entfernen. Das Feld kehrt zum ursprünglichen Gelände zurück.
        Strategisch sinnvoll, um z.B. Intensive Landwirtschaft durch ökologischere Alternativen zu ersetzen.
      </RuleBox>
    </div>
  );
}

function SectionSieg() {
  return (
    <div>
      <SectionTitle icon="🏆" title="Siegbedingungen & Achievements" subtitle="4 Hauptziele · Wirtschaftsloop · Strategietipps" />

      <RuleBox accent="amber">
        RUR NATUR hat <strong>keine fixe Rundengrenze</strong>. Du spielst so lange, bis du alle Ziele erreicht
        oder die Simulation neu startest. Achievements bleiben dauerhaft in der Spielsitzung erhalten und
        können im Reports-Tab eingesehen werden. Jedes Achievement markiert einen echten ökologischen Meilenstein.
      </RuleBox>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {[
          {
            icon: '👑', name: 'Rückkehr des Königs', sub: 'Lachs-Sieg',
            color: 'border-amber-400 bg-amber-50',
            badge: 'bg-amber-400 text-white',
            condition: 'Atlantischen Lachs (Salmo salar) erfolgreich wiederansiedeln.',
            path: 'Durchgängigkeit ≥ 60 % · Fabrik nicht in Produktion · Lachs-Zuchtstation · Lachsprogramm NRW · Fabrik-Transformationskonzept',
          },
          {
            icon: '💧', name: 'Flüssiges Gold', sub: 'WRRL Exzellent',
            color: 'border-teal-400 bg-teal-50',
            badge: 'bg-teal-500 text-white',
            condition: 'Globale WRRL ≤ 2,2 (Spitzenklasse) erreichen.',
            path: 'Fabrik auf RENATURIERUNG · Kläranlagen-Upgrade + Fortschr. Abwasserreinigung · Altarm-Anschlüsse · Mehrere Sohlgleiten',
          },
          {
            icon: '🦅', name: 'Natura-2000 Großschutzgebiet', sub: 'FFH ≥ 65 %',
            color: 'border-green-400 bg-green-50',
            badge: 'bg-green-600 text-white',
            condition: 'Globalen FFH-Biotopschutz auf ≥ 65 % anheben.',
            path: 'Viele Insektenhotels · Mehrere Auwälder · Auenwald-Anpflanzungen · Eisvogel-Nisthilfen · Kieslaichbetten',
          },
          {
            icon: '🛡️', name: 'Klimaresistenz-Festung Düren', sub: 'Klimarisiko < 20 %',
            color: 'border-blue-400 bg-blue-50',
            badge: 'bg-blue-600 text-white',
            condition: 'Klimarisiko dauerhaft unter 20 % halten.',
            path: 'Viele Auwälder (−0,25 % / Stück) · Deichrückverlegungen · Polder · Auen-Vitalisierung erforschen',
          },
        ].map(a => (
          <div key={a.name} className={`border-2 ${a.color} rounded-2xl p-4.5`}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{a.icon}</span>
              <div>
                <h4 className="text-base font-black text-[#2C3322] font-display">{a.name}</h4>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${a.badge}`}>{a.sub}</span>
              </div>
            </div>
            <p className="text-xs text-[#3C4331] font-bold mb-2">{a.condition}</p>
            <div className="bg-white/60 rounded-lg px-3 py-2 text-[11px] text-[#5C5549] leading-relaxed">
              <span className="font-bold text-[#2C3322]">Schlüsselstrategie: </span>{a.path}
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-black text-[#2C3322] font-display mt-7 mb-3">Wirtschaftsloop pro Runde</h3>
      <div className="overflow-hidden rounded-xl border border-[#D4CCBA]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#E8E2D6] border-b border-[#D4CCBA]">
              <th className="text-left px-3 py-2 font-black text-[#8B8273] font-mono tracking-widest uppercase text-[10px]">Einnahmequelle</th>
              <th className="text-left px-3 py-2 font-black text-[#8B8273] font-mono tracking-widest uppercase text-[10px]">Betrag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D6]">
            {[
              ['Grundsteuer (Kreishaushalt)', '+5 €/Runde immer'],
              ['Fabrik: PRODUKTION', '+15 €/Runde'],
              ['Fabrik: UMBAU', '+5 €/Runde (−3 € Kosten = +2 € netto)'],
              ['Fabrik: RENATURIERUNG', '−3 €/Runde (subventioniert)'],
              ['Besucherzentrum Rurtal', '+4 €/Runde'],
              ['Natur-Campingplatz', '+3 €/Runde'],
              ['Klein-Wasserkraftwerk', '+5 €/Runde'],
              ['Öko-Tourismus/Kanuverleih', '+2 €/Runde je Station'],
              ['Extensive Viehweide', '+2 €/Runde'],
              ['Intensive Landwirtschaft', '+8 €/Runde (−WRRL!)'],
            ].map(([src, amt]) => (
              <tr key={src} className="hover:bg-[#F8F5EF]">
                <td className="px-3 py-2 text-[#2C3322]">{src}</td>
                <td className="px-3 py-2 font-mono font-bold text-[#5A7247]">{amt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-black text-[#2C3322] font-display mt-6 mb-3">Strategietipps</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[
          { icon: '💡', tip: 'Baue früh ein Natura-2000-Infozentrum – es liefert +1 Forschungspunkt/Runde passiv und beschleunigt den gesamten Forschungsbaum erheblich.' },
          { icon: '⚡', tip: 'Lass die FORSCHEN-Karte auf Stärke 4–5 anwachsen, bevor du sie zündest. So sammelst du bis zu 7 Forschungspunkte in einer Aktion.' },
          { icon: '🌳', tip: 'Pflanze Auwälder strategisch: Sie dämpfen dauerhaft das Klimarisiko und sind Voraussetzung für den Biber. Je mehr, desto besser.' },
          { icon: '🏭', tip: 'Schalte frühzeitig auf Fabrik-UMBAU um: Forschungspunkt-Passivproduktion spart Aktionskarten-Züge und hält das Budget noch tragbar.' },
          { icon: '🐟', tip: 'Für den Lachs-Sieg gilt: Durchgängigkeit zuerst! Baue Fischtreppen und Sohlgleiten, bevor du in andere Gebäude investierst.' },
          { icon: '💶', tip: 'Die FÖRDERUNG-Karte bei Stärke 5 bringt 16 € + 2 Forschungspunkte – ein enormer Schub. Spare sie für kritische Investitionsmomente.' },
        ].map((t, i) => (
          <div key={i} className="bg-[#F4F8F1] border border-[#B8C8A3] rounded-xl p-3.5 flex gap-2.5">
            <span className="text-xl shrink-0">{t.icon}</span>
            <p className="text-[11px] text-[#3C4331] leading-relaxed">{t.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Nav Sections Config ──────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: 'uebersicht',   icon: '🎮', label: 'Spielübersicht',    component: SectionUebersicht },
  { id: 'karten',       icon: '🎴', label: 'Aktionskarten',     component: SectionAktionskarten },
  { id: 'gebaeude',     icon: '🏗️', label: 'Gebäudekatalog',    component: SectionGebaeude },
  { id: 'terrain',      icon: '🌱', label: 'Terrain & Bepflanzung', component: SectionTerrain },
  { id: 'forschung',    icon: '🔬', label: 'Forschungsbaum',    component: SectionForschung },
  { id: 'fabrik',       icon: '🏭', label: 'Schoellershammer',  component: SectionFabrik },
  { id: 'artenschutz',  icon: '🦫', label: 'Artenschutz',       component: SectionArtenschutz },
  { id: 'klima',        icon: '⚡', label: 'Klimaereignisse',   component: SectionKlima },
  { id: 'karte',        icon: '🗺️', label: 'Kartenebenen',      component: SectionLayer },
  { id: 'sieg',         icon: '🏆', label: 'Sieg & Strategie',  component: SectionSieg },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function Spielanleitung({ onClose }: Props) {
  const [activeSection, setActiveSection] = useState('uebersicht');

  const ActiveComponent = NAV_SECTIONS.find(s => s.id === activeSection)?.component ?? SectionUebersicht;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8">
      <div
        className="bg-[#F2EDE4] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ border: '2px solid #D4CCBA' }}
      >

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4CCBA] bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#5A7247]" />
            <div>
              <div className="text-[9px] font-mono tracking-[0.2em] text-[#2A6F7E] uppercase font-black">
                RUR NATUR SIMULATOR
              </div>
              <h2 className="text-base font-black text-[#2C3322] font-display leading-tight">
                Vollständige Spielanleitung & Regelwerk
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8B8273] hover:text-[#2C3311] p-2 rounded-xl hover:bg-[#E8E2D6] transition-colors cursor-pointer border border-[#D4CCBA]/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* Sidebar Nav */}
          <nav className="md:w-52 shrink-0 bg-[#EAE4D8] border-b md:border-b-0 md:border-r border-[#D4CCBA] flex md:flex-col gap-0 overflow-x-auto md:overflow-x-visible md:overflow-y-auto custom-scrollbar">
            <div className="hidden md:block px-4 pt-4 pb-2 text-[9px] font-mono tracking-[0.18em] text-[#8B8273] uppercase font-black">
              Regelkapitel
            </div>
            {NAV_SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-left shrink-0 md:w-full transition-all duration-150 cursor-pointer text-xs font-bold border-b border-[#D4CCBA]/40 last:border-0
                  ${activeSection === s.id
                    ? 'bg-white text-[#2C3322] border-l-4 border-l-[#5A7247] shadow-sm'
                    : 'text-[#5C5549] hover:bg-[#DDD8CC] hover:text-[#2C3322]'
                  }`}
              >
                <span className="text-base leading-none">{s.icon}</span>
                <span className="font-display font-bold leading-tight">{s.label}</span>
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FCFBF9]">
            <div className="p-6 max-w-3xl">
              <ActiveComponent />
            </div>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#D4CCBA] bg-[#EAE4D8] shrink-0">
          <span className="text-[9px] font-mono text-[#8B8273] tracking-wider uppercase">
            RUR NATUR · Renaturierungs-Simulator Kreis Düren · Vollständiges Regelwerk
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#5A7247] hover:bg-[#4E613C] text-white text-xs font-black uppercase rounded-lg cursor-pointer shadow-sm transition-transform active:scale-95 font-display"
          >
            Spielen!
          </button>
        </div>

      </div>
    </div>
  );
}
