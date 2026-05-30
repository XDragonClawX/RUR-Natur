import React, { useRef, useEffect, useState } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { TileData, BuildingType, TerrainType } from '../types';

interface IsometricMapPixiProps {
  grid: TileData[][];
  onTileClick: (x: number, y: number) => void;
  selectedBuilding: BuildingType | null;
  selectedLayer: 'normal' | 'wrrl' | 'ffh' | 'flood';
  onLayerChange: (layer: 'normal' | 'wrrl' | 'ffh' | 'flood') => void;
  isDemolishMode: boolean;
  season?: string;
  selectedTile?: { x: number; y: number } | null;
}

// ── Hexagonal geometry (identical to the legacy Canvas map) ──────────────────
const R = 52;
const W = (R * Math.sqrt(3)) / 2; // ~45
const H = R * 0.58;               // ~30
const SPACING_X = R * Math.sqrt(3); // ~90
const SPACING_Y = 1.5 * H;          // ~45
const BLOCK_DEPTH = 24;

const getHexCenter = (x: number, y: number) => {
  const cx = y % 2 === 1 ? (x + 0.5) * SPACING_X : x * SPACING_X;
  const cy = y * SPACING_Y;
  return { cx, cy };
};

const elevationFor = (tile: TileData): number => {
  const base = Math.sin(tile.x * 0.38 + tile.y * 0.25) * 5.0 + Math.cos(tile.x * 0.25 - tile.y * 0.3) * 4.0;
  if (tile.terrain === 'Water') return -9.5;
  if (tile.terrain === 'Auwald') return base + 5.5;
  if (tile.terrain === 'Siedlung') return base + 2.0;
  if (tile.terrain === 'Acker') return base - 1.0;
  return base;
};

// ── Colour helpers (ported 1:1 from the legacy map) ──────────────────────────
const adjustColor = (hex: string, percent: number): number => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0x00ff) + amt;
  let b = (num & 0x0000ff) + amt;
  r = r < 0 ? 0 : r > 255 ? 255 : r;
  g = g < 0 ? 0 : g > 255 ? 255 : g;
  b = b < 0 ? 0 : b > 255 ? 255 : b;
  return (r << 16) + (g << 8) + b;
};

const offsetFor = (tile: TileData) => (((tile.x * 7 + tile.y * 11) % 3) - 1) * 4.2;

const TOP_COLORS: Record<TerrainType, string> = {
  Water: '#2E86B0',
  Wiese: '#8FB86A',
  Auwald: '#5A7247',
  Acker: '#BC6C25',
  Gewerbe: '#8B8273',
  Siedlung: '#C48B71',
};
const SIDE_COLORS: Record<TerrainType, string> = {
  Water: '#2277A0',
  Wiese: '#72994C',
  Auwald: '#465937',
  Acker: '#9c5719',
  Gewerbe: '#71695c',
  Siedlung: '#a0705a',
};
const DARK_SIDE_COLORS: Record<TerrainType, string> = {
  Water: '#185878',
  Wiese: '#547238',
  Auwald: '#303d24',
  Acker: '#754010',
  Gewerbe: '#554e44',
  Siedlung: '#7c5442',
};

const topColor = (tile: TileData, layer: string): number => {
  if (layer !== 'normal') return adjustColor('#E8E2D6', offsetFor(tile));
  return adjustColor(TOP_COLORS[tile.terrain] ?? '#8B8273', offsetFor(tile));
};
const sideColor = (tile: TileData, layer: string): number => {
  if (layer !== 'normal') return adjustColor('#D4CCBA', offsetFor(tile));
  return adjustColor(SIDE_COLORS[tile.terrain] ?? '#C8BFA8', offsetFor(tile));
};
const darkSideColor = (tile: TileData, layer: string): number => {
  if (layer !== 'normal') return adjustColor('#C8BFA8', offsetFor(tile));
  return adjustColor(DARK_SIDE_COLORS[tile.terrain] ?? '#B0A793', offsetFor(tile));
};

// Hexagon points (pointy top & bottom) relative to a centre
const hexPoints = (cx: number, cy: number): number[] => [
  cx, cy - H,
  cx + W, cy - H / 2,
  cx + W, cy + H / 2,
  cx, cy + H,
  cx - W, cy + H / 2,
  cx - W, cy - H / 2,
];

export const IsometricMapPixi: React.FC<IsometricMapPixiProps> = ({
  grid,
  onTileClick,
  selectedBuilding,
  selectedLayer,
  onLayerChange,
  isDemolishMode,
  season = 'Frühling',
  selectedTile = null,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const tileLayerRef = useRef<Container | null>(null);
  const highlightRef = useRef<Graphics | null>(null);

  // Viewport (kept in refs to avoid React re-renders during pan/zoom)
  const zoomRef = useRef<number>(0.9);
  const [zoomDisplay, setZoomDisplay] = useState<number>(0.9);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Latest props mirrored into refs for the redraw routine
  const gridRef = useRef(grid);
  const layerRef = useRef(selectedLayer);
  const selectedRef = useRef(selectedTile);
  const onTileClickRef = useRef(onTileClick);
  gridRef.current = grid;
  layerRef.current = selectedLayer;
  selectedRef.current = selectedTile;
  onTileClickRef.current = onTileClick;

  // ── One-time Pixi bootstrap ────────────────────────────────────────────────
  useEffect(() => {
    let disposed = false;
    const parent = containerRef.current;
    if (!parent) return;

    const app = new Application();

    app
      .init({
        resizeTo: parent,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: 'webgl',
      })
      .then(() => {
        if (disposed) {
          app.destroy(true);
          return;
        }
        appRef.current = app;
        parent.appendChild(app.canvas);
        app.canvas.style.display = 'block';
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';

        // Warm linen backdrop + vignette
        const bg = new Graphics();
        const drawBg = () => {
          const { width, height } = app.screen;
          bg.clear();
          bg.rect(0, 0, width, height).fill(0xf0e8d8);
          bg.rect(0, 0, width, height).fill({ color: 0x1d150a, alpha: 0.12 });
        };
        drawBg();
        app.stage.addChild(bg);

        // World container holds pan/zoom transform
        const world = new Container();
        app.stage.addChild(world);
        worldRef.current = world;

        const tileLayer = new Container();
        world.addChild(tileLayer);
        tileLayerRef.current = tileLayer;

        // Hover / selection highlight (drawn above tiles)
        const highlight = new Graphics();
        world.addChild(highlight);
        highlightRef.current = highlight;

        centerMap();
        rebuildTiles();

        // Resize handling: keep background full-bleed
        app.renderer.on('resize', drawBg);

        // ── Pan & zoom ───────────────────────────────────────────────────────
        const canvas = app.canvas;
        let dragging = false;
        let moved = false;
        let last = { x: 0, y: 0 };

        canvas.addEventListener('pointerdown', (e: PointerEvent) => {
          dragging = true;
          moved = false;
          last = { x: e.clientX, y: e.clientY };
        });
        window.addEventListener('pointerup', () => {
          dragging = false;
        });
        canvas.addEventListener('pointermove', (e: PointerEvent) => {
          if (dragging) {
            const dx = e.clientX - last.x;
            const dy = e.clientY - last.y;
            if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
            world.x += dx;
            world.y += dy;
            last = { x: e.clientX, y: e.clientY };
          } else {
            updateHover(e);
          }
        });
        canvas.addEventListener('pointerleave', () => setHoveredTile(null));

        // Click = tap without drag
        canvas.addEventListener('click', (e: MouseEvent) => {
          if (moved) return;
          const tile = tileAtClient(e.clientX, e.clientY);
          if (tile) onTileClickRef.current(tile.x, tile.y);
        });

        // Wheel zoom around cursor
        canvas.addEventListener(
          'wheel',
          (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
            applyZoomAt(e.clientX, e.clientY, factor);
          },
          { passive: false }
        );
      });

    return () => {
      disposed = true;
      const a = appRef.current;
      if (a) {
        a.destroy(true, { children: true });
        appRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Redraw when data/visual props change ───────────────────────────────────
  useEffect(() => {
    rebuildTiles();
    drawHighlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, selectedLayer, selectedTile, hoveredTile, selectedBuilding, isDemolishMode]);

  // ── Helpers bound to the live Pixi scene ───────────────────────────────────
  const clientToWorld = (clientX: number, clientY: number) => {
    const app = appRef.current;
    const world = worldRef.current;
    if (!app || !world) return null;
    const rect = app.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    return {
      x: (px - world.x) / world.scale.x,
      y: (py - world.y) / world.scale.y,
    };
  };

  const tileAtClient = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const p = clientToWorld(clientX, clientY);
    const g = gridRef.current;
    if (!p || !g.length) return null;
    // Brute-force nearest hex centre within radius (256 tiles — trivial)
    let best: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[y].length; x++) {
        const { cx, cy } = getHexCenter(x, y);
        const top = cy - elevationFor(g[y][x]);
        const dx = p.x - cx;
        const dy = p.y - top;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          best = { x, y };
        }
      }
    }
    // Reject if clearly outside a hex footprint
    if (best && bestDist <= (W * 1.05) ** 2) return best;
    return null;
  };

  const updateHover = (e: PointerEvent) => {
    const tile = tileAtClient(e.clientX, e.clientY);
    setHoveredTile((prev) => {
      if (tile && prev && tile.x === prev.x && tile.y === prev.y) return prev;
      if (!tile && !prev) return prev;
      return tile;
    });
  };

  const applyZoomAt = (clientX: number, clientY: number, factor: number) => {
    const world = worldRef.current;
    const app = appRef.current;
    if (!world || !app) return;
    const next = Math.min(1.8, Math.max(0.4, zoomRef.current * factor));
    const realFactor = next / zoomRef.current;
    const rect = app.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    // Keep the point under the cursor stable
    world.x = px - (px - world.x) * realFactor;
    world.y = py - (py - world.y) * realFactor;
    zoomRef.current = next;
    world.scale.set(next);
    setZoomDisplay(next);
  };

  const centerMap = () => {
    const app = appRef.current;
    const world = worldRef.current;
    const g = gridRef.current;
    if (!app || !world || !g.length) return;
    const cols = g[0].length;
    const rows = g.length;
    const worldW = cols * SPACING_X;
    const worldH = rows * SPACING_Y;
    const z = 0.9;
    zoomRef.current = z;
    world.scale.set(z);
    world.x = (app.screen.width - worldW * z) / 2;
    world.y = (app.screen.height - worldH * z) / 2 + 40 * z;
    setZoomDisplay(z);
  };

  const drawHighlight = () => {
    const hl = highlightRef.current;
    if (!hl) return;
    hl.clear();
    const g = gridRef.current;
    const drawOutline = (x: number, y: number, color: number, alpha: number, width: number) => {
      if (!g[y]?.[x]) return;
      const { cx, cy } = getHexCenter(x, y);
      const top = cy - elevationFor(g[y][x]);
      hl.poly(hexPoints(cx, top)).stroke({ width, color, alpha });
    };
    if (hoveredTile) drawOutline(hoveredTile.x, hoveredTile.y, 0xffffff, 0.85, 2.5);
    const sel = selectedRef.current;
    if (sel) drawOutline(sel.x, sel.y, 0xc8a84a, 1, 3);
  };

  const rebuildTiles = () => {
    const layer = tileLayerRef.current;
    const g = gridRef.current;
    if (!layer || !g.length) return;
    layer.removeChildren().forEach((c) => c.destroy());

    const lay = layerRef.current;
    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[y].length; x++) {
        const tile = g[y][x];
        const { cx, cy } = getHexCenter(x, y);
        const top = cy - elevationFor(tile);

        const gfx = new Graphics();

        // Drop shadow slab
        gfx
          .poly([
            cx - W, top + H / 2 + BLOCK_DEPTH,
            cx, top + H + BLOCK_DEPTH,
            cx + W, top + H / 2 + BLOCK_DEPTH,
            cx + W, top - H / 2 + BLOCK_DEPTH,
            cx, top - H + BLOCK_DEPTH,
            cx - W, top - H / 2 + BLOCK_DEPTH,
          ])
          .fill({ color: 0x2c2111, alpha: 0.18 });

        // Left side face (cap colour + AO base)
        gfx
          .poly([cx - W, top + H / 2, cx, top + H, cx, cy + H + BLOCK_DEPTH, cx - W, cy + H / 2 + BLOCK_DEPTH])
          .fill(sideColor(tile, lay));
        gfx
          .poly([cx - W, top + H / 2 + (cy + H / 2 + BLOCK_DEPTH - (top + H / 2)) * 0.55, cx, top + H + (cy + H + BLOCK_DEPTH - (top + H)) * 0.55, cx, cy + H + BLOCK_DEPTH, cx - W, cy + H / 2 + BLOCK_DEPTH])
          .fill({ color: 0x19120b, alpha: 0.55 });

        // Right side face
        gfx
          .poly([cx, top + H, cx + W, top + H / 2, cx + W, cy + H / 2 + BLOCK_DEPTH, cx, cy + H + BLOCK_DEPTH])
          .fill(darkSideColor(tile, lay));
        gfx
          .poly([cx, top + H + (cy + H + BLOCK_DEPTH - (top + H)) * 0.55, cx + W, top + H / 2 + (cy + H / 2 + BLOCK_DEPTH - (top + H / 2)) * 0.55, cx + W, cy + H / 2 + BLOCK_DEPTH, cx, cy + H + BLOCK_DEPTH])
          .fill({ color: 0x0f0a06, alpha: 0.6 });

        // Top face
        gfx.poly(hexPoints(cx, top)).fill(topColor(tile, lay));

        // Lit top-left facet
        gfx
          .poly([cx, top, cx, top - H, cx - W, top - H / 2, cx - W, top + H / 2])
          .fill({ color: 0xffffff, alpha: 0.13 });
        // Glancing top-right facet
        gfx
          .poly([cx, top, cx, top - H, cx + W, top - H / 2, cx + W, top + H / 2])
          .fill({ color: 0xffffff, alpha: 0.04 });

        // Protected / city marker dot (lightweight placeholder until Phase 3/4)
        if (tile.buildingId) {
          gfx.rect(cx - 13, top - 13, 26, 22).fill(0x1e293b).stroke({ width: 1, color: 0x475569 });
        }

        layer.addChild(gfx);
      }
    }
  };

  // ── React-side control handlers ────────────────────────────────────────────
  const handleZoomIn = () => {
    const app = appRef.current;
    if (!app) return;
    applyZoomAt(app.screen.width / 2 + (app.canvas.getBoundingClientRect().left), app.screen.height / 2 + (app.canvas.getBoundingClientRect().top), 1.15);
  };
  const handleZoomOut = () => {
    const app = appRef.current;
    if (!app) return;
    const rect = app.canvas.getBoundingClientRect();
    applyZoomAt(rect.left + app.screen.width / 2, rect.top + app.screen.height / 2, 1 / 1.15);
  };
  const handleCenter = () => centerMap();

  return (
    <div
      className="rounded-xl overflow-hidden relative flex flex-col h-full min-h-[480px]"
      style={{ background: '#1a1510', border: '1px solid rgba(140,110,60,0.3)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
    >
      {/* Top Map bar */}
      <div className="absolute top-4 left-4 right-4 z-15 flex flex-wrap gap-2 justify-between pointer-events-none">
        <div className="flex gap-2 bg-white/95 border border-[#D4CCBA] p-2 rounded-lg shadow-sm pointer-events-auto items-center shrink-0 max-w-[calc(100vw-32px)]">
          <span className="text-[#5A7247] text-sm">⬡</span>
          <div className="font-mono text-[11px] text-[#2C3322]">
            {hoveredTile ? (
              <span>
                Feld: <strong className="text-[#5A7247]">({hoveredTile.x}, {hoveredTile.y})</strong> -{' '}
                {hoveredTile.y < 5 ? 'Eifel Oberlauf' : hoveredTile.y < 11 ? 'Düren Mitte' : 'Jülicher Tiefland'}
              </span>
            ) : (
              <span className="text-[#8B8273]">Karte berühren / bewegen…</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap bg-white/95 border border-[#D4CCBA] p-1 sm:p-1.5 rounded-lg shadow-sm pointer-events-auto items-center gap-1">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#8B8273] px-1 border-r border-[#D4CCBA] hidden xs:inline">
            Ebene:
          </span>
          {(['normal', 'wrrl', 'ffh', 'flood'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => onLayerChange(layer)}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] rounded font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedLayer === layer ? 'bg-[#5A7247] text-white font-bold' : 'text-[#6B6356] hover:text-[#2C3322] hover:bg-[#E8E2D6]'
              }`}
            >
              {layer === 'normal' ? '🗺️ Satellit' : layer === 'wrrl' ? '💧 WRRL' : layer === 'ffh' ? '🌿 FFH' : '🌊 Schutz'}
            </button>
          ))}
        </div>
      </div>

      {selectedBuilding && (
        <div
          className="absolute top-16 left-4 right-4 sm:right-auto z-20 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2"
          style={{ background: 'rgba(20,15,8,0.88)', color: '#C8D870', border: '1px solid rgba(140,180,80,0.4)', backdropFilter: 'blur(6px)' }}
        >
          <span>Baumodus: &apos;{selectedBuilding.name}&apos; auf passendem Terrain platzieren.</span>
        </div>
      )}

      {/* Zoom / center controls */}
      <div className="absolute bottom-4 right-4 z-15 flex flex-col gap-1.5">
        <button onClick={handleZoomIn} className="p-3 sm:p-2 rounded-lg cursor-pointer active:scale-95 transition-transform" style={{ background: 'rgba(20,15,8,0.85)', border: '1px solid rgba(180,140,80,0.35)', color: '#C8A84A' }} title="Zoom In">＋</button>
        <button onClick={handleZoomOut} className="p-3 sm:p-2 rounded-lg cursor-pointer active:scale-95 transition-transform" style={{ background: 'rgba(20,15,8,0.85)', border: '1px solid rgba(180,140,80,0.35)', color: '#C8A84A' }} title="Zoom Out">－</button>
        <button onClick={handleCenter} className="p-3 sm:p-2 rounded-lg cursor-pointer active:scale-95 transition-transform" style={{ background: 'rgba(20,15,8,0.85)', border: '1px solid rgba(180,140,80,0.35)', color: '#C8A84A' }} title="Karte zentrieren">◎</button>
      </div>

      {/* WebGL viewport */}
      <div ref={containerRef} className="flex-grow w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
