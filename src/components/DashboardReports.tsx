import React, { useState } from 'react';
import { GameStats, Species, GameLog } from '../types';
import { FileText, Medal, Info, Download, Printer, Database, HeartHandshake } from 'lucide-react';

interface DashboardReportsProps {
  stats: GameStats;
  speciesList: Species[];
  logs: GameLog[];
  onTriggerPdfSim: () => void;
  pdfSimulated: boolean;
}

export const DashboardReports: React.FC<DashboardReportsProps> = ({
  stats,
  speciesList,
  logs,
  onTriggerPdfSim,
  pdfSimulated
}) => {
  const [reportType, setReportType] = useState<'real_data' | 'pdf' | 'achievements'>('real_data');

  // Calculate achievements completion status
  const achievements = [
    {
      id: 'lachs_return',
      name: 'Rückkehr des Königs (Lachs-Sieg)',
      desc: 'Siedele erfolgreich den Atlantischen Lachs (👑) im Rurtal an.',
      met: speciesList.find(s => s.id === 'lachs')?.unlocked || false,
      icon: '👑'
    },
    {
      id: 'best_water',
      name: 'Flüssiges Gold (WRRL Exzellent)',
      desc: 'Erreiche eine durchschnittliche globale Wasserqualität von ≤ 2.2.',
      met: stats.globalWrrl <= 2.2,
      icon: '💧'
    },
    {
      id: 'eco_paradise',
      name: 'Natura-2000 Großschutzgebiet',
      desc: 'Bringe das durchschnittliche FFH-Potenzial im Tal auf ≥ 65 %.',
      met: stats.globalFfh >= 65,
      icon: '🌿'
    },
    {
      id: 'climate_fort',
      name: 'Klimaresistenz-Festung Düren',
      desc: 'Senke das globale Klimarisiko sturmsicher auf unter 20 %.',
      met: stats.climateRisk < 20,
      icon: '🏘️'
    }
  ];

  return (
    <div className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl p-5 shadow-sm flex flex-col h-full max-h-[750px] overflow-hidden">
      <div className="flex items-center gap-2 mb-4 border-b border-[#D4CCBA] pb-3 justify-between">
        <div>
          <h2 className="text-lg font-bold font-sans text-[#2C3322] flex items-center gap-2">
            <span>📊 Bilanz- & Berichtsportal</span>
          </h2>
          <p className="text-xs text-[#6B6356] font-sans mt-0.5">
            Ökologische Datenberichte, GIS-Kalibrierungen und Auszeichnungen des Kreis Düren.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 mb-4 p-1 bg-[#E8E2D6] rounded-lg">
        <button
          onClick={() => setReportType('real_data')}
          className={`py-1.5 text-[11px] font-sans font-medium rounded-md transition-all cursor-pointer ${
            reportType === 'real_data' ? 'bg-[#5A7247] text-white font-bold' : 'text-[#6B6356] hover:text-[#2C3322]'
          }`}
        >
          GIS-Datenbank
        </button>
        <button
          onClick={() => setReportType('pdf')}
          className={`py-1.5 text-[11px] font-sans font-medium rounded-md transition-all cursor-pointer  ${
            reportType === 'pdf' ? 'bg-[#5A7247] text-white font-bold' : 'text-[#6B6356] hover:text-[#2C3322]'
          }`}
        >
          Umweltbilanz (PDF)
        </button>
        <button
          onClick={() => setReportType('achievements')}
          className={`py-1.5 text-[11px] font-sans font-medium rounded-md transition-all cursor-pointer  ${
            reportType === 'achievements' ? 'bg-[#5A7247] text-white font-bold' : 'text-[#6B6356] hover:text-[#2C3322]'
          }`}
        >
          Erfolge
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-grow overflow-y-auto pr-1 text-xs">
        {reportType === 'real_data' && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg border border-[#D4CCBA]">
              <h3 className="text-xs font-bold text-[#5A7247] flex items-center gap-1.5 mb-2">
                <Database className="w-4 h-4 text-[#5A7247]" />
                <span>Integriertes GIS-Datenmodell</span>
              </h3>
              <p className="text-[#6B6356] leading-relaxed font-sans text-[11px] mb-3">
                Die Rur-Simulation nutzt reale Referenzen der NRW-Umweltportale zur Festlegung der Startparameter für das Rurtal. Jede Maßnahme simuliert den realen Einordnungsprozess:
              </p>

              <div className="space-y-3 font-sans text-[11px]">
                <div className="border border-[#D4CCBA]/50 p-2.5 rounded bg-[#F7F3ED]">
                  <span className="font-bold text-[#2C3322] block">🌧️ DWD (Deutscher Wetterdienst) Klimadaten</span>
                  Saisonale Niederschlagskurven und steigendes Risiko für Starkregen und anhaltende Trockenepisoden beeinflussen deinen Klimakoeffizienten.
                </div>
                <div className="border border-[#D4CCBA]/50 p-2.5 rounded bg-[#F7F3ED]">
                  <span className="font-bold text-[#2C3322] block">💧 ELWAS-WEB NRW</span>
                  Wasseranalysestartwerte des Landes NRW für die Rur-Wasserkörper legen die Ausgangsqualität (Kategorie II bis V) in Düren und Jülich fest.
                </div>
                <div className="border border-[#D4CCBA]/50 p-2.5 rounded bg-[#F7F3ED]">
                  <span className="font-bold text-[#2C3322] block">🌿 LINFOS Landschaftsinformationssystem</span>
                  FFH-Schutzgebiete und die Natura 2000 Hotspots legen schützenswerte Sektoren fest, in denen Renaturierungen den doppelten Hebel auf die Artendichte entfalten.
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#D4CCBA] rounded-lg">
              <span className="font-bold text-[#2C3322] block mb-1">Dürener Rur-Sektoren Einteilung:</span>
              <ul className="space-y-1.5 text-[#6B6356]">
                <li>• <strong className="text-[#2C3322]">Heimbach / Maubach (Oberlauf):</strong> Hohes Gefälle, reines Wasser (WRRL II), Heimat erster Biberschutzgebiete.</li>
                <li>• <strong className="text-[#2C3322]">Kreuzau / Düren-City:</strong> Hohe Versiegelung, Stopps der Rurtalbahn, historische Kanalisierung durch Wehre und Industrie.</li>
                <li>• <strong className="text-[#2C3322]">Jülich (Flachland):</strong> Ackerebenen, hoher Nährstoffeintrag aus Landwirtschaft, Hochwassergefahrengebiet.</li>
              </ul>
            </div>
          </div>
        )}

        {reportType === 'pdf' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#D4CCBA] rounded-xl p-4 font-sans flex flex-col items-center text-center">
              <FileText className="w-12 h-12 text-[#5A7247] mb-2" />
              <h3 className="text-sm font-bold text-[#2C3322]">Amtlicher Umwelt-Nachhaltigkeitsbericht</h3>
              <p className="text-[11px] text-[#6B6356] mt-1 max-w-sm">
                Generiere eine offizielle Renaturierungs-Bilanz zur Vorlage bei der Kreisverwaltung Düren, dem Wasserverband Eifel-Rur und der EU LIFE+ Vergabekammer.
              </p>

              <button
                onClick={onTriggerPdfSim}
                className="mt-4 px-4 py-2 bg-[#5A7247] hover:bg-[#606C38] text-white font-bold rounded-lg text-xs transition-transform transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{pdfSimulated ? 'Nachhaltigkeitsbericht neu generieren' : 'Berichts-PDF erstellen'}</span>
              </button>
            </div>

            {pdfSimulated && (
              <div className="bg-white text-slate-900 rounded-xl p-5 shadow-sm border-2 border-dashed border-[#5A7247] space-y-3 mt-3">
                <div className="flex justify-between items-start border-b border-[#D4CCBA]/50 pb-2">
                  <div>
                    <div className="text-[10px] font-bold font-mono text-[#5A7247] tracking-wider">KREIS DÜREN • SUSTAINABILITY ASSESSMENT</div>
                    <h4 className="text-sm font-black tracking-tight text-[#2C3322]">RENATURIERUNGS-BILANZ RUR</h4>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[9px] bg-[#D4E0C1] border border-[#5A7247]/20 px-1.5 py-0.5 rounded text-[#2C3322]">Spielejahr: {stats.year}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-[#F7F3ED] p-2 rounded">
                    <span className="text-[#6B6356] block uppercase text-[8px] font-bold tracking-wider">Ökologische Note WRRL</span>
                    <span className="text-base font-extrabold text-[#457B9D]">
                      {stats.globalWrrl.toFixed(2)} (
                      {stats.globalWrrl <= 2.2 ? 'Exzellent' :
                       stats.globalWrrl <= 2.8 ? 'Gut' :
                       stats.globalWrrl <= 3.5 ? 'Mittelmäßig' :
                       stats.globalWrrl <= 4.2 ? 'Kanalisiert' : 'Unzureichend'}
                      )
                    </span>
                  </div>
                  <div className="bg-[#F7F3ED] p-2 rounded">
                    <span className="text-[#6B6356] block uppercase text-[8px] font-bold tracking-wider">FFH-Potenzialwert</span>
                    <span className="text-base font-extrabold text-[#5A7247]">{stats.globalFfh.toFixed(0)} %</span>
                  </div>
                  <div className="bg-[#F7F3ED] p-2 rounded">
                    <span className="text-[#6B6356] block uppercase text-[8px] font-bold tracking-wider">Rurbahn-Haltestellen</span>
                    <span className="text-base font-extrabold text-purple-900">{stats.rurtalbahnSlotsUsed} angeschlossen</span>
                  </div>
                  <div className="bg-[#F7F3ED] p-2 rounded">
                    <span className="text-[#6B6356] block uppercase text-[8px] font-bold tracking-wider">Schoellershammer Modus</span>
                    <span className="text-xs font-black uppercase text-[#BC6C25]">{stats.paperFactoryMode}</span>
                  </div>
                </div>

                <div className="border-t border-[#D4CCBA]/50 pt-3 text-[10.5px]">
                  <span className="font-bold text-[#2C3322] block mb-1">Evaluierung Wasserverband Eifel-Rur:</span>
                  <p className="text-[#6B6356] italic font-medium leading-relaxed">
                    {stats.globalWrrl <= 2.6 
                      ? '&quot;Die eingeleiteten Entfesselungen und Fischwanderwege zeigen herausragende Ergebnisse. Das Ökosystem der Rur atmet auf.&quot;' 
                      : '&quot;Es besteht erheblicher Handlungsbedarf im Bereich Düren-Stadt. Vor allem Wehre und intensive Landwirtschaft schränken die Ziele der Wasserrahmenrichtlinie (WRRL) noch stark ein.&quot;'}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[9px] text-[#8B8273] border-t border-[#D4CCBA]/40 pt-2 font-mono">
                  <span>Genehmigt von: Landrat Spelthahn</span>
                  <span className="font-bold text-[#5A7247] flex items-center gap-0.5"><Download className="w-3 h-3" /> PDF_REPRO_READY.pdf</span>
                </div>
              </div>
            )}
          </div>
        )}

        {reportType === 'achievements' && (
          <div className="space-y-3">
            {achievements.map(ach => (
              <div
                key={ach.id}
                className={`flex gap-3 items-center border p-2.5 rounded-lg transition-all ${
                  ach.met 
                    ? 'border-[#5A7247]/45 bg-[#D4E0C1]/40 text-[#2C3322]' 
                    : 'border-[#D4CCBA] bg-white opacity-65 text-[#8B8273]'
                }`}
              >
                <span className="text-2xl shrink-0">{ach.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-[#2C3322] flex items-center gap-2">
                    <span>{ach.name}</span>
                    {ach.met && <span className="text-[9px] bg-[#5A7247]/20 text-[#5A7247] px-1.5 py-0.5 rounded border border-[#5A7247]/30 font-bold uppercase">ERREICHT</span>}
                  </h4>
                  <p className="text-[10px] text-[#6B6356] mt-0.5 leading-tight font-sans">
                    {ach.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
