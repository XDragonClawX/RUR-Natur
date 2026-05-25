import React, { useState, useEffect, useRef } from 'react';
import { GameStats, Species, GameLog, TileData } from '../types';
import { FileText, Medal, Info, Download, Printer, Database, HeartHandshake, Sparkles, AlertTriangle } from 'lucide-react';
import * as d3 from 'd3';

interface DashboardReportsProps {
  stats: GameStats;
  speciesList: Species[];
  logs: GameLog[];
  onTriggerPdfSim: () => void;
  pdfSimulated: boolean;
  grid: TileData[][];
}

export const DashboardReports: React.FC<DashboardReportsProps> = ({
  stats,
  speciesList,
  logs,
  onTriggerPdfSim,
  pdfSimulated,
  grid
}) => {
  const [reportType, setReportType] = useState<'real_data' | 'pdf' | 'achievements'>('real_data');
  const [hoveredSector, setHoveredSector] = useState<any | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Generate 16 longitudinal sectors of the Rur river by searching each row of the isometric grid
  const riverData = Array.from({ length: 16 }, (_, y) => {
    const row = grid[y] || [];
    // Priority: find actual water tile, then any candidate with baseTerrain of Water, or default to the first tile
    const riverTile = row.find(t => t.terrain === 'Water') || row.find(t => t.baseTerrain === 'Water') || row[0];
    
    // Exact environmental and geographic labeling of the Rur longitudinal chain (South to North)
    const labels: { [key: number]: string } = {
      0: 'Heimbach',
      1: 'Obermaubach',
      2: 'Nideggen',
      3: 'Untermaubach',
      4: 'Kreuzau Wehr',
      5: 'Krauthausen',
      6: 'Schoellersh.',
      7: 'Düren Cent.',
      8: 'Birkesdorf',
      9: 'Merken',
      10: 'Huch.-Melnik',
      11: 'Altenburg',
      12: 'Jülich S.',
      13: 'Jülich Cent.',
      14: 'Broich',
      15: 'Kirchberg'
    };

    return {
      y,
      x: riverTile ? riverTile.x : 0,
      label: labels[y] || `Sektor y=${y}`,
      wrrl: riverTile ? riverTile.wrrl_quality : 3.0,
      buildingId: riverTile ? riverTile.buildingId : null,
      tile: riverTile
    };
  });

  useEffect(() => {
    if (reportType !== 'real_data' || !svgRef.current) return;

    const svgElement = svgRef.current;
    
    // Clear previous elements
    d3.select(svgElement).selectAll('*').remove();

    const margin = { top: 25, right: 15, bottom: 40, left: 35 };
    const width = 530;
    const height = 180;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgElement)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .style('display', 'block');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X Scale (16 sectors)
    const xScale = d3.scaleBand()
      .domain(riverData.map(d => d.label))
      .range([0, chartWidth])
      .padding(0.25);

    // Y Scale (WRRL water quality class goes from 1.0 Excellent to 5.0 Bad)
    const yScale = d3.scaleLinear()
      .domain([5.0, 1.0])
      .range([chartHeight, 0]);

    // Draw grid horizontal threshold helper lines for Classes 1 to 5
    const wrrlClasses = [1, 2, 3, 4, 5];
    wrrlClasses.forEach(c => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', yScale(c))
        .attr('y2', yScale(c))
        .attr('stroke', 'rgba(44, 51, 17, 0.08)')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', c === 2 ? '4,4' : 'none');
    });

    // EU target threshold label/line (represented by 2.0 = "Guter ökologischer Zustand")
    g.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', yScale(2.0))
      .attr('y2', yScale(2.0))
      .attr('stroke', '#5A7247')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3,3');

    // Axes
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.5em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-30)')
      .style('font-family', 'JetBrains Mono, SFMono-Regular, monospace')
      .style('font-size', '7px')
      .style('fill', '#6B6356');

    const yAxis = d3.axisLeft(yScale)
      .tickValues([1, 2, 3, 4, 5])
      .tickFormat(d => `${d}.0`);
    
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-family', 'JetBrains Mono, SFMono-Regular, monospace')
      .style('font-size', '7px')
      .style('fill', '#6B6356');

    // Labels & Titling for axes
    svg.append('text')
      .attr('x', 12)
      .attr('y', 14)
      .attr('text-anchor', 'start')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-weight', 'bold')
      .style('font-size', '7px')
      .style('fill', '#8B8273')
      .text('▲ Gewässergüte (Klasse 1-5; höherer Balken = sauberes Wasser!)');

    // Draw Bars
    const bars = g.selectAll('.rur-bar')
      .data(riverData)
      .enter()
      .append('rect')
      .attr('class', 'rur-bar')
      .attr('x', d => xScale(d.label) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.wrrl))
      .attr('height', d => Math.max(2, chartHeight - yScale(d.wrrl)))
      .attr('rx', 2.5)
      .attr('fill', d => {
        // Color scale: Blue -> Green -> Orange -> Red
        if (d.wrrl <= 2.0) return '#457B9D'; // Class I-II (Excellent - Blue)
        if (d.wrrl <= 2.8) return '#5A7247'; // Class II (Good - Sage Green)
        if (d.wrrl <= 3.8) return '#BC6C25'; // Class III (Moderate - Ochre/Orange)
        return '#C94A4A'; // Class IV-V (Highly impacted - Crimson)
      })
      .attr('opacity', 0.85)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.15s ease-out');

    // Micro Interaction
    bars.on('mouseover', function(event, d) {
      d3.select(this)
        .attr('opacity', 1.0)
        .attr('stroke', '#2C3311')
        .attr('stroke-width', 1.5)
        .attr('y', yScale(d.wrrl) - 2)
        .attr('height', Math.max(2, chartHeight - yScale(d.wrrl)) + 2);
      
      setHoveredSector(d);
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .attr('opacity', 0.85)
        .attr('stroke', 'none')
        .attr('y', yScale(d.wrrl))
        .attr('height', Math.max(2, chartHeight - yScale(d.wrrl)));
    });

  }, [grid, reportType, stats.round]);

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
          <div className="space-y-4 font-sans text-xs">
            {/* Interactive D3 Chart Section */}
            <div className="bg-white p-3.5 rounded-lg border border-[#D4CCBA] flex flex-col gap-2">
              <h3 className="text-xs font-bold text-[#5A7247] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#5A7247]" />
                  <span>D3.js Gewässergüteschnitt (Obermaubach ➔ Jülich)</span>
                </span>
                <span className="text-[9px] font-mono bg-[#E8E2D6] px-1.5 py-0.5 rounded text-[#2C3311]">
                  Interaktiver GIS-Graph
                </span>
              </h3>
              
              <p className="text-[#6B6356] leading-relaxed font-sans text-[10px]">
                Echtzeit-Längsschnitt der 16 Haupt-Sektoren des Rurtals. Höhere Balken markieren reichere Fischhabitate und optimalere WRRL-Werte (Klasse II oder besser).
              </p>

              {/* D3 SVG TARGET NODE */}
              <div className="w-full bg-[#F7F3ED]/40 rounded-lg p-1 border border-[#D4CCBA]/30">
                <svg ref={svgRef} className="w-full h-auto" />
              </div>

              {/* DYNAMIC DETAILS PANEL / HOVER HUD */}
              <div className="bg-[#F7F3ED] border border-[#D4CCBA]/60 rounded-xl p-3 min-h-[75px] flex flex-col justify-center transition-all duration-150">
                {hoveredSector ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">💧</span>
                        <span className="font-extrabold text-[#2C3311] text-[11px] uppercase tracking-wide">
                          {hoveredSector.label}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] bg-[#D4E0C1] px-1.5 py-0.5 rounded text-[#2C3311] font-bold">
                        Y-Koordinate: {hoveredSector.y}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10.5px] font-sans pt-1 border-t border-[#D4CCBA]/30">
                      <div>
                        <span className="text-[#6B6356] block text-[8px] uppercase tracking-wider">Flussqualität WRRL</span>
                        <span className="font-black text-sm flex items-center gap-1">
                          Klasse {hoveredSector.wrrl.toFixed(2)}
                          <span className="text-[9px] font-bold">
                            {hoveredSector.wrrl <= 2.0 ? ' (Exzellent)' :
                             hoveredSector.wrrl <= 2.8 ? ' (Gut)' :
                             hoveredSector.wrrl <= 3.8 ? ' (Mäßig)' : ' (Kanalisiert/Kritisch)'}
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B6356] block text-[8px] uppercase tracking-wider">Bebautes Fluss-Element</span>
                        <span className="font-bold text-[#2C3311]">
                          {hoveredSector.buildingId ? (
                            <span className="text-[#5A7247] flex items-center gap-1 font-extrabold">
                              <Sparkles className="w-3.5 h-3.5 text-[#5A7247]" /> {hoveredSector.buildingId}
                            </span>
                          ) : 'Naturbett (Unbebaut)'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[#6B6356]/80 text-[10.5px] italic font-sans flex items-center justify-center gap-2">
                    <Info className="w-3.5 h-3.5 text-[#8B8273]" />
                    <span>Fahre mit der Maus über die Sektor-Balken, um detaillierte GIS-Qualitätsdaten zu laden.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-white border border-[#D4CCBA] rounded-lg">
              <span className="font-bold text-[#2C3322] block mb-1">Dürener Rur-Sektoren Einteilung:</span>
              <ul className="space-y-1.5 text-[#6B6356]">
                <li>• <strong className="text-[#2C3322]">Heimbach / Maubach (Sektoren 0-4):</strong> Hohes Gefälle, reines Wasser (WRRL II), Heimat erster Biberschutzgebiete.</li>
                <li>• <strong className="text-[#2C3322]">Kreuzau / Düren-City (Sektoren 5-10):</strong> Hohe Versiegelung, Stopps der Rurtalbahn, historische Kanalisierung durch Wehre und Industrie.</li>
                <li>• <strong className="text-[#2C3322]">Jülich (Sektoren 11-15):</strong> Ackerebenen, hoher Nährstoffeintrag aus Landwirtschaft, Hochwassergefahrengebiet.</li>
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
