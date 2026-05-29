import React, { useMemo, useState, useRef } from 'react';
import { GameStats } from '../types';

interface HistoricalChartProps {
  series: GameStats[]; // chronological order (oldest -> newest)
}

const metrics: { key: keyof GameStats; label: string; color: string; min: number; max: number; format?: (v: any) => string }[] = [
  { key: 'globalWrrl', label: 'WRRL', color: '#457B9D', min: 1, max: 5, format: (v: number) => v.toFixed(2) },
  { key: 'globalFfh',  label: 'FFH %', color: '#5A7247', min: 0, max: 100, format: (v: number) => `${Math.round(v)}%` },
  { key: 'renewableEnergy', label: 'Ökostrom %', color: '#BC6C25', min: 0, max: 100, format: (v: number) => `${Math.round(v)}%` },
  { key: 'citizenAcceptance', label: 'Akzeptanz %', color: '#6B6356', min: 0, max: 100, format: (v: number) => `${Math.round(v)}%` },
];

export const HistoricalChart: React.FC<HistoricalChartProps> = ({ series }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const data = useMemo(() => series || [], [series]);
  if (data.length === 0) return null;

  const width = 640, height = 220; // viewBox
  const pad = { top: 18, right: 16, bottom: 30, left: 36 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const n = data.length;

  // normalized values per metric
  const seriesValues = metrics.map(m => {
    const vals = data.map(d => {
      const raw = (d[m.key] as unknown as number) ?? 0;
      const norm = (raw - m.min) / (m.max - m.min);
      return { raw, norm: Math.max(0, Math.min(1, norm)) };
    });
    return { meta: m, vals };
  });

  const xForIndex = (i: number) => pad.left + (n === 1 ? chartW / 2 : (i * chartW) / (n - 1));
  const yForNorm = (norm: number) => pad.top + (1 - norm) * chartH;

  const buildPath = (vals: { norm: number }[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xForIndex(i).toFixed(2)} ${yForNorm(v.norm).toFixed(2)}`).join(' ');

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - pad.left;
    const idx = Math.round((x / chartW) * (n - 1));
    if (idx >= 0 && idx < n) setHoverIdx(idx);
  };

  const onLeave = () => setHoverIdx(null);

  return (
    <div className="mt-3 bg-white rounded-xl border border-[#D4CCBA]/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] font-black text-[#2C3322]">Historische Entwicklung (kombiniertes Liniendiagramm)</div>
        <div className="text-[8px] text-[#6B6356] font-mono">Letzte {n} Runden</div>
      </div>

      <div className="w-full overflow-auto">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} width="100%" height="180" onMouseMove={onMove} onMouseLeave={onLeave}>
          {/* grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
            <line key={i} x1={pad.left} x2={pad.left + chartW} y1={yForNorm(g)} y2={yForNorm(g)} stroke="rgba(44,51,17,0.06)" strokeWidth={0.8} />
          ))}

          {/* metric paths */}
          {seriesValues.map(sv => (
            <path key={String(sv.meta.key)} d={buildPath(sv.vals)} fill="none" stroke={sv.meta.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
          ))}

          {/* hover vertical line and markers */}
          {hoverIdx !== null && (
            <g>
              <line x1={xForIndex(hoverIdx)} x2={xForIndex(hoverIdx)} y1={pad.top} y2={pad.top + chartH} stroke="#666" strokeWidth={0.8} strokeDasharray="3,3" />
              {seriesValues.map((sv, mi) => (
                <circle key={mi} cx={xForIndex(hoverIdx)} cy={yForNorm(sv.vals[hoverIdx].norm)} r={4} fill={sv.meta.color} stroke="#fff" strokeWidth={1.25} />
              ))}
            </g>
          )}

          {/* x axis labels (round numbers) */}
          {data.map((d, i) => (
            <text key={i} x={xForIndex(i)} y={pad.top + chartH + 15} fontFamily="JetBrains Mono, monospace" fontSize={9} fill="#6B6356" textAnchor="middle">
              R{d.round}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend + latest values + tooltip */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {seriesValues.map(sv => {
            const latest = sv.vals[sv.vals.length - 1].raw;
            return (
              <div key={String(sv.meta.key)} className="flex items-center gap-2 text-[10px]">
                <span style={{ width: 12, height: 12, background: sv.meta.color }} className="rounded-sm inline-block" />
                <span className="font-bold text-[#2C3322] mr-1">{sv.meta.label}:</span>
                <span className="text-[#6B6356]">{sv.meta.format ? sv.meta.format(latest) : String(latest)}</span>
              </div>
            );
          })}
        </div>

        <div className="text-right text-[10px] text-[#6B6356] font-mono">
          {hoverIdx !== null ? (
            <div>
              <div className="font-black">R{data[hoverIdx].round} — Jahr {data[hoverIdx].year}</div>
              <div className="mt-1 space-y-0.5">
                {seriesValues.map(sv => (
                  <div key={String(sv.meta.key)} className="flex justify-end gap-2">
                    <span className="text-[#6B6356]">{sv.meta.label}</span>
                    <span className="font-black" style={{ color: sv.meta.color }}>{sv.meta.format ? sv.meta.format(sv.vals[hoverIdx].raw) : sv.vals[hoverIdx].raw}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>Fahre mit der Maus über das Diagramm, um Werte pro Runde anzuzeigen.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalChart;
