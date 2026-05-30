import React, { useState, useEffect, useRef } from 'react';
import { GameStats, Species, GameLog, TileData } from '../types';
import {
  BarChart3, Medal, Info, Download, Printer, Database,
  Sparkles, AlertTriangle, CheckCircle2, Circle, Activity
} from 'lucide-react';
import * as d3 from 'd3';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface DashboardReportsProps {
  stats: GameStats;
  speciesList: Species[];
  logs: GameLog[];
  onTriggerPdfSim: () => void;
  pdfSimulated: boolean;
  grid: TileData[][];
  roundHistory: any[];
}

export const DashboardReports: React.FC<DashboardReportsProps> = ({
  stats,
  speciesList,
  logs,
  onTriggerPdfSim,
  pdfSimulated,
  grid,
  roundHistory
}) => {
  const [reportType, setReportType] = useState<'real_data' | 'pdf' | 'achievements'>('real_data');
  const [gisSubView, setGisSubView] = useState<'current_river' | 'historical_timeline'>('current_river');
  const [selectedMetric, setSelectedMetric] = useState<'ffh' | 'co2' | 'acceptance' | 'budget'>('ffh');
  const [timelineHoverIdx, setTimelineHoverIdx] = useState<number | null>(null);
  const [hoveredSector, setHoveredSector] = useState<any | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const riverData = Array.from({ length: 16 }, (_, y) => {
    const row = grid[y] || [];
    const riverTile = row.find(t => t.terrain === 'Water') || row.find(t => t.baseTerrain === 'Water') || row[0];
    const labels: { [key: number]: string } = {
      0: 'Heimbach', 1: 'Obermaubach', 2: 'Nideggen', 3: 'Untermaubach',
      4: 'Kreuzau', 5: 'Krauthausen', 6: 'Schoellersh.', 7: 'Düren',
      8: 'Birkesdorf', 9: 'Merken', 10: 'Huch.-Melnik', 11: 'Altenburg',
      12: 'Jülich S.', 13: 'Jülich', 14: 'Broich', 15: 'Kirchberg'
    };
    return {
      y, x: riverTile ? riverTile.x : 0,
      label: labels[y] || `Sektor ${y}`,
      wrrl: riverTile ? riverTile.wrrl_quality : 3.0,
      buildingId: riverTile ? riverTile.buildingId : null,
      tile: riverTile
    };
  });

  useEffect(() => {
    if (reportType !== 'real_data' || !svgRef.current) return;
    const svgElement = svgRef.current;
    d3.select(svgElement).selectAll('*').remove();

    const margin = { top: 25, right: 15, bottom: 40, left: 35 };
    const width = 530, height = 180;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgElement)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%').attr('height', '100%')
      .style('display', 'block');

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand().domain(riverData.map(d => d.label)).range([0, chartWidth]).padding(0.25);
    const yScale = d3.scaleLinear().domain([5.0, 1.0]).range([chartHeight, 0]);

    [1, 2, 3, 4, 5].forEach(c => {
      g.append('line')
        .attr('x1', 0).attr('x2', chartWidth)
        .attr('y1', yScale(c)).attr('y2', yScale(c))
        .attr('stroke', 'rgba(44, 51, 17, 0.08)')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', c === 2 ? '4,4' : 'none');
    });

    g.append('line')
      .attr('x1', 0).attr('x2', chartWidth)
      .attr('y1', yScale(2.0)).attr('y2', yScale(2.0))
      .attr('stroke', '#5A7247').attr('stroke-width', 1.2).attr('stroke-dasharray', '3,3');

    g.append('g').attr('transform', `translate(0, ${chartHeight})`).call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end').attr('dx', '-.5em').attr('dy', '.15em')
      .attr('transform', 'rotate(-30)')
      .style('font-family', 'JetBrains Mono, SFMono-Regular, monospace')
      .style('font-size', '7px').style('fill', '#6B6356');

    g.append('g').call(d3.axisLeft(yScale).tickValues([1, 2, 3, 4, 5]).tickFormat(d => `${d}.0`))
      .selectAll('text')
      .style('font-family', 'JetBrains Mono, SFMono-Regular, monospace')
      .style('font-size', '7px').style('fill', '#6B6356');

    svg.append('text').attr('x', 12).attr('y', 14).attr('text-anchor', 'start')
      .style('font-family', 'JetBrains Mono, monospace').style('font-weight', 'bold')
      .style('font-size', '7px').style('fill', '#8B8273')
      .text('▲ Gewässergüte (Klasse 1-5; höherer Balken = sauberes Wasser!)');

    const bars = g.selectAll('.rur-bar').data(riverData).enter().append('rect')
      .attr('class', 'rur-bar')
      .attr('x', d => xScale(d.label) || 0).attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.wrrl)).attr('height', d => Math.max(2, chartHeight - yScale(d.wrrl)))
      .attr('rx', 2.5)
      .attr('fill', d => d.wrrl <= 2.0 ? '#457B9D' : d.wrrl <= 2.8 ? '#5A7247' : d.wrrl <= 3.8 ? '#BC6C25' : '#C94A4A')
      .attr('opacity', 0.85).style('cursor', 'pointer');

    bars.on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1.0).attr('stroke', '#2C3311').attr('stroke-width', 1.5)
        .attr('y', yScale(d.wrrl) - 2).attr('height', Math.max(2, chartHeight - yScale(d.wrrl)) + 2);
      setHoveredSector(d);
    }).on('mouseout', function(event, d) {
      d3.select(this).attr('opacity', 0.85).attr('stroke', 'none')
        .attr('y', yScale(d.wrrl)).attr('height', Math.max(2, chartHeight - yScale(d.wrrl)));
    });
  }, [grid, reportType, stats.round]);

  const achievements = [
    {
      id: 'lachs_return',
      name: 'Rückkehr des Königs',
      sublabel: 'Lachs-Sieg',
      desc: 'Siedele erfolgreich den Atlantischen Lachs im Rurtal an.',
      met: speciesList.find(s => s.id === 'lachs')?.unlocked || false,
      accentColor: '#5A7247',
    },
    {
      id: 'best_water',
      name: 'Flüssiges Gold',
      sublabel: 'WRRL Exzellent ≤ 2.2',
      desc: 'Erreiche eine durchschnittliche globale Wasserqualität von ≤ 2.2.',
      met: stats.globalWrrl <= 2.2,
      accentColor: '#457B9D',
    },
    {
      id: 'eco_paradise',
      name: 'Natura-2000 Großschutzgebiet',
      sublabel: 'FFH ≥ 65 %',
      desc: 'Bringe das durchschnittliche FFH-Potenzial im Tal auf ≥ 65 %.',
      met: stats.globalFfh >= 65,
      accentColor: '#5A7247',
    },
    {
      id: 'climate_fort',
      name: 'Klimaresistenz-Festung',
      sublabel: 'Klimarisiko < 20 %',
      desc: 'Senke das globale Klimarisiko sturmsicher auf unter 20 %.',
      met: stats.climateRisk < 20,
      accentColor: '#BC6C25',
    }
  ];

  const TABS = [
    { id: 'real_data' as const, label: 'GIS-Datenbank', icon: <Database className="w-3 h-3" /> },
    { id: 'pdf'       as const, label: 'Umweltbilanz',  icon: <Printer   className="w-3 h-3" /> },
    { id: 'achievements' as const, label: 'Erfolge',    icon: <Medal     className="w-3 h-3" /> },
  ];

  return (
    <div className="bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl shadow-sm flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#D4CCBA]/70 flex items-start gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-[#457B9D]/15 border border-[#457B9D]/30 mt-0.5">
          <BarChart3 className="w-5 h-5 text-[#457B9D]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-black font-sans text-[#2C3322] leading-tight">
              Bilanz- &amp; Berichtsportal
            </h2>
            <span className="text-[9px] font-mono font-black text-[#6B6356] bg-[#E8E2D6] px-1.5 py-0.5 rounded border border-[#D4CCBA]">
              AUDIT
            </span>
          </div>
          <p className="text-[10px] text-[#6B6356] mt-0.5 leading-snug">
            Ökologische Datenberichte, GIS-Kalibrierungen und Auszeichnungen des Kreis Düren.
          </p>
        </div>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-[#D4CCBA]/50 shrink-0">
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">WRRL-Klasse</div>
          <div className={`text-sm font-black font-mono ${stats.globalWrrl <= 2.2 ? 'text-[#457B9D]' : stats.globalWrrl <= 3.0 ? 'text-[#5A7247]' : stats.globalWrrl <= 3.8 ? 'text-amber-600' : 'text-red-600'}`}>
            {stats.globalWrrl.toFixed(1)}
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">FFH-Potenzial</div>
          <div className={`text-sm font-black font-mono ${stats.globalFfh >= 65 ? 'text-[#5A7247]' : 'text-amber-600'}`}>
            {stats.globalFfh}%
          </div>
        </div>
        <div className="bg-white/70 rounded-lg border border-[#D4CCBA]/60 p-2 text-center">
          <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-wider leading-none mb-1">Erfolge</div>
          <div className="text-sm font-black font-mono text-[#BC6C25]">
            {achievements.filter(a => a.met).length}/{achievements.length}
          </div>
        </div>
      </div>

      {/* ── Tab Strip ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 shrink-0">
        <div className="grid grid-cols-3 gap-1 bg-[#E8E2D6] rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={[
                'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide transition-all cursor-pointer',
                reportType === tab.id
                  ? 'bg-white text-[#2C3322] shadow-sm'
                  : 'text-[#6B6356] hover:text-[#2C3322]',
              ].join(' ')}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 pt-3 pb-4">

        {/* GIS Data Tab */}
        {reportType === 'real_data' && (
          <div className="space-y-3">
            {/* GIS Sub-navigation Header tab deck */}
            <div className="grid grid-cols-2 gap-1 bg-[#E8E2D6]/60 rounded-lg p-1.5 border border-[#D4CCBA]/40">
              <button
                type="button"
                onClick={() => setGisSubView('current_river')}
                className={`text-[9px] font-black uppercase py-1 rounded transition-all cursor-pointer ${
                  gisSubView === 'current_river'
                    ? 'bg-[#5A7247] text-white shadow-xs'
                    : 'text-[#6B6356] hover:text-[#2C3322]'
                }`}
              >
                💧 Fluss-Längsschnitt
              </button>
              <button
                type="button"
                onClick={() => setGisSubView('historical_timeline')}
                className={`text-[9px] font-black uppercase py-1 rounded transition-all cursor-pointer ${
                  gisSubView === 'historical_timeline'
                    ? 'bg-[#5A7247] text-white shadow-xs'
                    : 'text-[#6B6356] hover:text-[#2C3322]'
                }`}
              >
                📈 Strategie-Verlauf
              </button>
            </div>

            {gisSubView === 'current_river' && (
              <div className="space-y-3">
                <div className="bg-white rounded-xl border border-[#D4CCBA]/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-2.5 h-2.5" />
                      D3.js Gewässergüteschnitt
                    </div>
                    <span className="text-[8px] font-mono bg-[#E8E2D6] px-1.5 py-0.5 rounded text-[#6B6356] border border-[#D4CCBA]">
                      Obermaubach → Jülich
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6B6356] leading-snug">
                    Echtzeit-Längsschnitt der 16 Hauptsektoren des Rurtals. Höhere Balken = reichere Fischhabitate (WRRL-Klasse II oder besser).
                  </p>
                  <div className="w-full bg-[#F7F3ED]/40 rounded-lg p-1 border border-[#D4CCBA]/30">
                    <svg ref={svgRef} className="w-full h-auto" />
                  </div>
                  {/* Hover detail panel */}
                  <div className="bg-[#F7F3ED] border border-[#D4CCBA]/60 rounded-xl p-3 min-h-[64px] flex flex-col justify-center">
                    {hoveredSector ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-[#2C3311] text-[11px] uppercase tracking-wide">
                            {hoveredSector.label}
                          </span>
                          <span className="font-mono text-[8px] bg-[#D4E0C1] px-1.5 py-0.5 rounded text-[#2C3311] font-bold border border-[#5A7247]/20">
                            Y={hoveredSector.y}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-[10px] pt-1 border-t border-[#D4CCBA]/30">
                          <div>
                            <span className="text-[#6B6356] block text-[8px] uppercase tracking-wider font-mono mb-0.5">WRRL-Klasse</span>
                            <span className="font-black">
                              {hoveredSector.wrrl.toFixed(2)}
                              <span className="text-[9px] font-semibold text-[#6B6356] ml-1">
                                ({hoveredSector.wrrl <= 2.0 ? 'Exzellent' : hoveredSector.wrrl <= 2.8 ? 'Gut' : hoveredSector.wrrl <= 3.8 ? 'Mäßig' : 'Kritisch'})
                              </span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[#6B6356] block text-[8px] uppercase tracking-wider font-mono mb-0.5">Bebauung</span>
                            <span className="font-bold text-[#2C3311]">
                              {hoveredSector.buildingId ? (
                                <span className="text-[#5A7247] flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> {hoveredSector.buildingId}
                                </span>
                              ) : 'Naturbett'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-[#8B8273] text-[10px] flex items-center justify-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Fahre über die Balken für Sektor-Details
                      </div>
                    )}
                  </div>
                </div>

                {/* Sector legend */}
                <div className="bg-white rounded-xl border border-[#D4CCBA]/70 p-3">
                  <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest mb-2">
                    Sektoren Einteilung
                  </div>
                  <div className="space-y-1.5 text-[10px] text-[#6B6356]">
                    <p><strong className="text-[#2C3322]">Heimbach / Maubach (3–0):</strong> Hohes Gefälle, reines Wasser (WRRL II), Biberschutzgebiete.</p>
                    <p><strong className="text-[#2C3322]">Kreuzau / Düren-City (4–10):</strong> Hohe Versiegelung, historische Kanalisierung durch Wehre und Industrie.</p>
                    <p><strong className="text-[#2C3322]">Jülich S. / Kirchberg (11–15):</strong> Ackerebenen, hoher Nährstoffeintrag aus Landwirtschaft, Hochwassergebiet.</p>
                  </div>
                </div>
              </div>
            )}

            {gisSubView === 'historical_timeline' && (
              <div className="bg-white rounded-xl border border-[#D4CCBA]/70 p-3.5 space-y-3.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-2.5 h-2.5" />
                    Strategischer Zeitverlauf
                  </div>
                  <span className="text-[8px] font-mono bg-[#5A7247]/10 px-1.5 py-0.5 rounded text-[#5A7247] border border-[#5A7247]/20 font-bold">
                    Runde 1 - {stats.round}
                  </span>
                </div>

                <p className="text-[10px] text-[#6B6356] leading-snug">
                  Entwicklung deiner Kernmetriken über die Zeit. Wähle eine Metrik aus, um langfristige Effekte deiner Renaturierungsmaßnahmen zu analysieren.
                </p>

                {/* Metric Selector Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-[#F2EDE4] p-1 rounded-lg">
                  {([
                    { id: 'ffh', name: '🌿 FFH' },
                    { id: 'co2', name: '🏭 CO₂' },
                    { id: 'acceptance', name: '👥 Bürger' },
                    { id: 'budget', name: '💶 Geld' }
                  ] as const).map(met => (
                    <button
                      key={met.id}
                      type="button"
                      onClick={() => setSelectedMetric(met.id)}
                      className={`py-1 text-[9px] font-black rounded-md border text-center transition-all cursor-pointer ${
                        selectedMetric === met.id
                          ? 'bg-[#5A7247] text-white shadow-xs border-[#5A7247]'
                          : 'bg-transparent border-transparent text-stone-600 hover:text-stone-900 border-none'
                      }`}
                    >
                      {met.name}
                    </button>
                  ))}
                </div>

                {/* Recharts Area Chart */}
                <div className="relative w-full bg-[#F7F3ED]/40 rounded-lg p-2 border border-[#D4CCBA]/30">
                  {roundHistory.length < 2 ? (
                    <div className="h-[140px] flex flex-col items-center justify-center text-[#8B8273] text-[10px] italic text-center p-4">
                      <span>Rundenverlauf wird ab Runde 2 aufgezeichnet.</span>
                      <strong className="text-[#5A7247] mt-1">Beende deine erste Runde im Hauptcockpit!</strong>
                    </div>
                  ) : (
                    <div>
                      {(() => {
                        const data = roundHistory;
                        const getVal = (d: any) => {
                          if (selectedMetric === 'ffh') return d.ffh;
                          if (selectedMetric === 'co2') return d.co2;
                          if (selectedMetric === 'acceptance') return d.acceptance;
                          return d.budget;
                        };

                        const vals = data.map(getVal);
                        const minVal = Math.max(0, Math.min(...vals) * 0.85);
                        const maxVal = Math.max(...vals, 10) * 1.15;

                        const labelMap = { ffh: 'FFH-Flora (%)', co2: 'CO₂-Ausstoß (t CO2/Runde)', acceptance: 'Bürgerakzeptanz (%)', budget: 'Körperschafts-Budget (€)' };
                        const colorMap = { ffh: '#10B981', co2: '#F59E0B', acceptance: '#EF4444', budget: '#6366F1' };
                        const activeColor = colorMap[selectedMetric];

                        // Create custom tooltip render
                        const CustomTooltipMsg = ({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#FAF8F5] border-2 border-[#D4CCBA] p-2.5 rounded-xl text-[10px] shadow-lg font-sans">
                                <p className="font-extrabold text-[#2C3311] border-b border-[#D4CCBA] pb-0.5 mb-1 font-mono">
                                  Runde {d.round} ({d.year})
                                </p>
                                <p className="font-semibold text-stone-700">
                                  {labelMap[selectedMetric]}: <span className="font-black" style={{ color: activeColor }}>{payload[0].value.toFixed(1)}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        };

                        return (
                          <div className="space-y-1.5 font-sans">
                            <div className="w-full h-[155px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={data}
                                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                                  onMouseMove={(state: any) => {
                                    if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                                      setTimelineHoverIdx(state.activeTooltipIndex);
                                    }
                                  }}
                                  onMouseLeave={() => setTimelineHoverIdx(null)}
                                >
                                  <defs>
                                    <linearGradient id="rechartsGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={activeColor} stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor={activeColor} stopOpacity={0.01}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(44, 51, 17, 0.08)" />
                                  <XAxis 
                                    dataKey="round" 
                                    tickFormatter={(v) => `R${v}`}
                                    stroke="#8B8273"
                                    style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}
                                  />
                                  <YAxis 
                                    stroke="#8B8273"
                                    style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}
                                    domain={[minVal, maxVal]}
                                    tickFormatter={(v) => v.toFixed(0)}
                                  />
                                  <RechartsTooltip content={<CustomTooltipMsg />} />
                                  <Area 
                                    type="monotone" 
                                    dataKey={selectedMetric === 'ffh' ? 'ffh' : selectedMetric === 'co2' ? 'co2' : selectedMetric === 'acceptance' ? 'acceptance' : 'budget'} 
                                    stroke={activeColor} 
                                    strokeWidth={2.2}
                                    fillOpacity={1} 
                                    fill="url(#rechartsGrad)" 
                                    activeDot={{ r: 5, strokeWidth: 1 }}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Active Point Card Details */}
                            <div className="bg-[#FAF8F5] border border-[#D4CCBA]/60 rounded-xl p-2.5 min-h-[58px] flex flex-col justify-center shadow-2xs">
                              {timelineHoverIdx !== null && data[timelineHoverIdx] ? (
                                <div className="flex justify-between items-center text-[10px] font-sans">
                                  <div>
                                    <span className="text-[#8B8273] block text-[8px] uppercase tracking-wider font-mono">Quartal / Jahr</span>
                                    <span className="font-extrabold text-[#2C3311]">
                                      Runde {data[timelineHoverIdx].round} ({data[timelineHoverIdx].year})
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[#8B8273] block text-[8px] uppercase tracking-wider font-mono">{labelMap[selectedMetric]}</span>
                                    <span className="font-black" style={{ color: activeColor }}>
                                      {getVal(data[timelineHoverIdx]).toFixed(1)}
                                      {selectedMetric === 'ffh' || selectedMetric === 'acceptance' ? '%' : selectedMetric === 'budget' ? ' €' : ' t'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-[#8B8273] text-[9.5px] italic flex items-center justify-center gap-1.5 leading-none">
                                  <Info className="w-3.5 h-3.5" />
                                  Bewege den Cursor über das Diagramm, um Runden-Messwerte anzuzeigen
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PDF Report Tab */}
        {reportType === 'pdf' && (
          <div className="space-y-3">
            <div className="bg-white border border-[#D4CCBA]/70 rounded-xl p-4 flex flex-col items-center text-center">
              <div className="p-3 rounded-xl bg-[#5A7247]/10 border border-[#5A7247]/20 mb-3">
                <BarChart3 className="w-8 h-8 text-[#5A7247]" />
              </div>
              <h3 className="text-sm font-black text-[#2C3322]">Amtlicher Umwelt-Nachhaltigkeitsbericht</h3>
              <p className="text-[10px] text-[#6B6356] mt-1 max-w-sm leading-relaxed">
                Generiere eine offizielle Renaturierungs-Bilanz zur Vorlage bei der Kreisverwaltung Düren, dem Wasserverband Eifel-Rur und der EU LIFE+ Vergabekammer.
              </p>
              <button
                onClick={onTriggerPdfSim}
                className="mt-4 px-4 py-2 bg-[#5A7247] hover:bg-[#4A6039] active:scale-95 text-white font-black rounded-xl text-[10px] transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wide"
              >
                <Printer className="w-3.5 h-3.5" />
                {pdfSimulated ? 'Bericht neu generieren' : 'Berichts-PDF erstellen'}
              </button>
            </div>

            {pdfSimulated && (
              <div className="bg-white rounded-xl p-4 border-2 border-dashed border-[#5A7247]/40 space-y-3">
                <div className="flex justify-between items-start border-b border-[#D4CCBA]/50 pb-2">
                  <div>
                    <div className="text-[8px] font-mono font-black text-[#5A7247] uppercase tracking-widest">
                      KREIS DÜREN · SUSTAINABILITY ASSESSMENT
                    </div>
                    <h4 className="text-sm font-black text-[#2C3322]">RENATURIERUNGS-BILANZ RUR</h4>
                  </div>
                  <span className="font-mono text-[8px] bg-[#D4E0C1] border border-[#5A7247]/20 px-1.5 py-0.5 rounded text-[#2C3322]">
                    Jahr {stats.year}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Ökologische Note WRRL', value: `${stats.globalWrrl.toFixed(2)} (${stats.globalWrrl <= 2.2 ? 'Exzellent' : stats.globalWrrl <= 2.8 ? 'Gut' : stats.globalWrrl <= 3.5 ? 'Mittelmäßig' : 'Kanalisiert'})`, color: 'text-[#457B9D]' },
                    { label: 'FFH-Potenzialwert', value: `${stats.globalFfh.toFixed(0)} %`, color: 'text-[#5A7247]' },
                    { label: 'Rurbahn-Haltestellen', value: `${stats.rurtalbahnSlotsUsed} angeschlossen`, color: 'text-purple-700' },
                    { label: 'Fabrik-Modus', value: stats.paperFactoryMode, color: 'text-[#BC6C25]' },
                  ].map(item => (
                    <div key={item.label} className="bg-[#F7F3ED] p-2 rounded-lg border border-[#D4CCBA]/50">
                      <span className="text-[7.5px] uppercase font-mono font-black text-[#8B8273] tracking-wider block mb-1">{item.label}</span>
                      <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#D4CCBA]/50 pt-2 text-[10px]">
                  <span className="font-black text-[#2C3322] block mb-1">Evaluierung Wasserverband Eifel-Rur:</span>
                  <p className="text-[#6B6356] italic leading-relaxed">
                    {stats.globalWrrl <= 2.6
                      ? '„Die eingeleiteten Entfesselungen und Fischwanderwege zeigen herausragende Ergebnisse. Das Ökosystem der Rur atmet auf."'
                      : '„Es besteht erheblicher Handlungsbedarf im Bereich Düren-Stadt. Vor allem Wehre und intensive Landwirtschaft schränken die WRRL-Ziele noch stark ein."'}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[8.5px] text-[#8B8273] border-t border-[#D4CCBA]/40 pt-2 font-mono">
                  <span>Genehmigt von: Landrat Spelthahn</span>
                  <span className="font-bold text-[#5A7247] flex items-center gap-1">
                    <Download className="w-3 h-3" /> PDF_REPRO_READY.pdf
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {reportType === 'achievements' && (
          <div className="space-y-2">
            <div className="text-[8px] font-mono font-black text-[#8B8273] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Medal className="w-2.5 h-2.5" />
              Kreisdürener Ehrungen
            </div>
            {achievements.map(ach => (
              <div
                key={ach.id}
                className={[
                  'border-l-4 border rounded-r-xl rounded-l-none p-3 transition-all',
                  ach.met ? 'bg-[#D4E0C1]/40' : 'bg-white/60 opacity-70',
                ].join(' ')}
                style={{ borderLeftColor: ach.met ? ach.accentColor : '#B0A898' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {ach.met
                        ? <CheckCircle2 className="w-4 h-4 text-[#5A7247] shrink-0" />
                        : <Circle className="w-4 h-4 text-[#B0A898] shrink-0" />
                      }
                      <span className="text-[11px] font-black text-[#2C3322]">{ach.name}</span>
                    </div>
                    <p className="text-[9px] text-[#6B6356] mt-1 ml-6 leading-snug">{ach.desc}</p>
                  </div>
                  {ach.met && (
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-[#5A7247]/15 text-[#5A7247] border-[#5A7247]/30 uppercase shrink-0">
                      Erreicht
                    </span>
                  )}
                </div>
                <div className="mt-1 ml-6 text-[8.5px] text-[#8B8273] font-mono uppercase tracking-wider">
                  {ach.sublabel}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
