import React, { useRef, useEffect, useState } from 'react';
import { Application, Container, Graphics, Assets, Texture, TilingSprite, Sprite, Text, ColorMatrixFilter } from 'pixi.js';
import { TileData, BuildingType, TerrainType } from '../types';
import { BUILDIONS_CATALOG } from '../gameData';
import waterRiverUrl from '../assets/images/tile_river_middle_1779350583496.png';
import waterDeepUrl from '../assets/images/tile_deep_water_1779350607495.png';
import waterShallowUrl from '../assets/images/tile_shallow_water_1779350629775.png';
import valleyBgUrl from '../assets/images/rur_valley_background_1779897494900.png';

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

// Building category → roof colour + icon glyph
const CATEGORY_STYLE: Record<string, { roof: number; body: number; icon: string }> = {
  ecology:        { roof: 0x5a7247, body: 0x6f8a54, icon: '🌿' },
  water:          { roof: 0x2f7da0, body: 0x4596b8, icon: '🌊' },
  fauna:          { roof: 0xb9742a, body: 0xd08a3e, icon: '🦫' },
  economy:        { roof: 0x6b6359, body: 0x877e72, icon: '🏭' },
  infrastructure: { roof: 0x7c5aa0, body: 0x9474b8, icon: '🚇' },
  tourism:        { roof: 0x12a594, body: 0x2bc0ad, icon: '🏕️' },
};
const BUILDING_BY_ID = new Map(BUILDIONS_CATALOG.map((b) => [b.id, b]));

// Data-layer overlay colour + value label for a tile
const overlayFor = (
  tile: TileData,
  layer: 'wrrl' | 'ffh' | 'flood'
): { color: number; alpha: number; label: string } => {
  if (layer === 'wrrl') {
    const q = tile.wrrl_quality;
    const color = q <= 2 ? 0x457b9d : q <= 2.8 ? 0x5a7247 : q <= 3.8 ? 0xbc6c25 : 0xc94a4a;
    return { color, alpha: 0.7, label: q.toFixed(1) };
  }
  if (layer === 'ffh') {
    return { color: 0x5a7247, alpha: 0.15 + Math.min(0.75, tile.ffh_value / 130), label: `${tile.ffh_value}` };
  }
  // flood
  return { color: 0x3282b4, alpha: 0.12 + Math.min(0.78, tile.flood_risk / 130), label: `${tile.flood_risk}` };
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
  const texturesRef = useRef<{ river?: Texture; deep?: Texture; shallow?: Texture }>({});
  const waterSpritesRef = useRef<TilingSprite[]>([]);
  const tickRef = useRef<number>(0);
  const fxLayerRef = useRef<Container | null>(null);
  const ambientLayerRef = useRef<Container | null>(null);
  type Fx =
    | { type: 'wind'; blades: Graphics; speed: number }
    | { type: 'smoke'; cx: number; top: number; puffs: { g: Graphics; life: number; max: number; vy: number; sway: number }[] };
  const fxNodesRef = useRef<Fx[]>([]);
  const ambientRef = useRef<{ g: Graphics; baseX: number; baseY: number; phase: number; speed: number; amp: number }[]>([]);
  const seasonRef = useRef<string>(season);
  seasonRef.current = season;

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
        preserveDrawingBuffer: true,
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

        // Valley photo backdrop (subtle, behind the board)
        const valleyBg = new Sprite();
        valleyBg.alpha = 0.22;
        valleyBg.anchor.set(0.5);
        const placeValleyBg = () => {
          if (!valleyBg.texture || valleyBg.texture === Texture.EMPTY) return;
          const { width, height } = app.screen;
          valleyBg.position.set(width / 2, height / 2);
          const scale = Math.max(width / valleyBg.texture.width, height / valleyBg.texture.height) * 1.05;
          valleyBg.scale.set(scale);
        };
        app.stage.addChild(valleyBg);
        app.renderer.on('resize', placeValleyBg);

        // World container holds pan/zoom transform
        const world = new Container();
        app.stage.addChild(world);
        worldRef.current = world;

        // ── Load textures, then (re)build with water sprites ──────────────────
        Assets.load([waterRiverUrl, waterDeepUrl, waterShallowUrl, valleyBgUrl])
          .then((loaded) => {
            if (disposed) return;
            texturesRef.current = {
              river: loaded[waterRiverUrl],
              deep: loaded[waterDeepUrl],
              shallow: loaded[waterShallowUrl],
            };
            valleyBg.texture = loaded[valleyBgUrl];
            placeValleyBg();
            rebuildTiles();
          })
          .catch(() => {/* fall back to procedural water */});

        // Single ticker drives all animation (no React re-renders)
        app.ticker.add(() => {
          tickRef.current += 1;
          const t = tickRef.current;

          // Flowing water
          for (const s of waterSpritesRef.current) {
            s.tilePosition.y = (t * 0.35) % s.texture.height;
            s.tilePosition.x = Math.sin(t * 0.01) * 6;
          }

          // Building effects: rotating turbines + rising smoke
          const fxLayerNow = fxLayerRef.current;
          for (const fx of fxNodesRef.current) {
            if (fx.type === 'wind') {
              fx.blades.rotation += fx.speed;
            } else if (fx.type === 'smoke' && fxLayerNow) {
              for (const p of fx.puffs) {
                p.life += 1;
                if (p.life >= p.max) {
                  p.life = 0;
                  p.g.position.set(fx.cx, fx.top - 14);
                  p.g.scale.set(0.5);
                  p.g.alpha = 0.55;
                }
                p.g.y -= p.vy;
                p.g.x = fx.cx + Math.sin((p.life + p.sway) * 0.08) * 5;
                p.g.scale.set(0.5 + (p.life / p.max) * 1.1);
                p.g.alpha = 0.5 * (1 - p.life / p.max);
              }
            }
          }

          // Ambient drifting particles
          for (const a of ambientRef.current) {
            a.phase += a.speed;
            a.g.x = a.baseX + Math.sin(a.phase) * a.amp;
            a.g.y = a.baseY + Math.cos(a.phase * 0.7) * a.amp * 0.5 + (a.phase * 2 % 60);
            a.g.alpha = 0.35 + Math.sin(a.phase * 1.3) * 0.2;
          }
        });

        const tileLayer = new Container();
        world.addChild(tileLayer);
        tileLayerRef.current = tileLayer;

        // Hover / selection highlight (drawn above tiles)
        const highlight = new Graphics();
        world.addChild(highlight);
        highlightRef.current = highlight;

        // Effect layer (smoke, turbines) above tiles
        const fxLayer = new Container();
        world.addChild(fxLayer);
        fxLayerRef.current = fxLayer;

        // Ambient drifting particles (pollen / leaves)
        const ambientLayer = new Container();
        world.addChild(ambientLayer);
        ambientLayerRef.current = ambientLayer;

        // Atmosphere colour grade (built-in, cheap) tinted by season
        const grade = new ColorMatrixFilter();
        applySeasonGrade(grade, seasonRef.current);
        world.filters = [grade];
        (world as any).__grade = grade;

        centerMap();
        rebuildTiles();
        buildAmbient();

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

  // Rebuild the full tile layer only when the board data / layer changes
  useEffect(() => {
    rebuildTiles();
    drawHighlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, selectedLayer, selectedBuilding, isDemolishMode]);

  // Hover & selection only redraw the lightweight highlight overlay
  useEffect(() => {
    drawHighlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredTile, selectedTile]);

  // Re-grade the scene when the season changes
  useEffect(() => {
    const world = worldRef.current as any;
    if (world?.__grade) applySeasonGrade(world.__grade, season);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season]);

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

  // Deterministic procedural decorations drawn on the top face of land tiles
  const drawLandDetails = (gfx: Graphics, tile: TileData, cx: number, top: number) => {
    if (tile.buildingId) return; // building will cover the surface
    const rnd = (n: number) => {
      const s = Math.sin((tile.x * 12.9898 + tile.y * 78.233 + n * 3.17)) * 43758.5453;
      return s - Math.floor(s);
    };
    switch (tile.terrain) {
      case 'Auwald': {
        // 3 layered tree canopies with trunks
        const spots = [ [-12, 2], [10, -2], [0, 8] ];
        for (let i = 0; i < spots.length; i++) {
          const [ox, oy] = spots[i];
          const tx = cx + ox + (rnd(i) - 0.5) * 4;
          const ty = top + oy;
          gfx.rect(tx - 1.4, ty - 1, 2.8, 7).fill(0x4a3520);
          gfx.circle(tx, ty - 5, 7).fill(0x3c5a2e);
          gfx.circle(tx - 3, ty - 7, 5).fill(0x4a6b38);
          gfx.circle(tx + 3, ty - 6, 4.5).fill(0x33502a);
        }
        break;
      }
      case 'Wiese': {
        // grass tufts + occasional flower
        for (let i = 0; i < 6; i++) {
          const gx = cx + (rnd(i) - 0.5) * 2 * W * 0.6;
          const gy = top + (rnd(i + 9) - 0.5) * 2 * H * 0.55;
          gfx.moveTo(gx, gy).lineTo(gx - 1.5, gy - 4).moveTo(gx, gy).lineTo(gx + 1.5, gy - 4)
            .stroke({ width: 1, color: 0x6f9a4a, alpha: 0.8 });
          if (rnd(i + 20) > 0.75) gfx.circle(gx, gy - 4, 1.3).fill(i % 2 ? 0xf0d04a : 0xe87da0);
        }
        break;
      }
      case 'Acker': {
        // plough furrows
        for (let i = -2; i <= 2; i++) {
          const oy = i * 6;
          gfx.moveTo(cx - W * 0.7, top + oy).lineTo(cx + W * 0.7, top + oy)
            .stroke({ width: 1.4, color: 0x7a4513, alpha: 0.5 });
        }
        break;
      }
      case 'Siedlung': {
        // small house: body + roof
        const hx = cx, hy = top + 2;
        gfx.rect(hx - 8, hy - 4, 16, 10).fill(0xe8d8c0).stroke({ width: 1, color: 0x9c7a5a });
        gfx.poly([hx - 10, hy - 4, hx, hy - 13, hx + 10, hy - 4]).fill(0xb1573e);
        gfx.rect(hx - 2.5, hy - 1, 5, 7).fill(0x6a4a32);
        break;
      }
      case 'Gewerbe': {
        // industrial block + chimney
        gfx.rect(cx - 11, top - 6, 22, 14).fill(0x8a857c).stroke({ width: 1, color: 0x5f5a52 });
        gfx.rect(cx + 4, top - 14, 4, 10).fill(0x6f6a62);
        for (let i = 0; i < 3; i++) gfx.rect(cx - 8 + i * 6, top - 2, 3, 4).fill(0x4a4640);
        break;
      }
    }
  };

  // Subtle seasonal colour grade
  const applySeasonGrade = (grade: ColorMatrixFilter, s: string) => {
    grade.reset();
    if (s.includes('Winter')) {
      grade.desaturate();
      grade.brightness(1.08, true);
    } else if (s.includes('Herbst')) {
      grade.saturate(0.18, true);
      grade.brightness(1.02, true);
    } else if (s.includes('Sommer')) {
      grade.brightness(1.06, true);
    } else {
      // Frühling
      grade.saturate(0.1, true);
      grade.brightness(1.04, true);
    }
  };

  // Build ambient drifting particles across the board
  const buildAmbient = () => {
    const layer = ambientLayerRef.current;
    const g = gridRef.current;
    if (!layer || !g.length) return;
    layer.removeChildren().forEach((c) => c.destroy());
    ambientRef.current = [];
    const worldW = g[0].length * SPACING_X;
    const worldH = g.length * SPACING_Y;
    for (let i = 0; i < 26; i++) {
      const baseX = Math.random() * worldW;
      const baseY = Math.random() * worldH;
      const dot = new Graphics();
      const warm = Math.random() > 0.5;
      dot.circle(0, 0, 1.5 + Math.random()).fill(warm ? 0xf3e6a8 : 0xbfe39a);
      dot.position.set(baseX, baseY);
      layer.addChild(dot);
      ambientRef.current.push({ g: dot, baseX, baseY, phase: Math.random() * 6.28, speed: 0.004 + Math.random() * 0.006, amp: 14 + Math.random() * 18 });
    }
  };

  // Isometric building body + category icon, returned as its own container
  const buildBuildingNode = (tile: TileData, cx: number, top: number): Container => {
    const node = new Container();
    const def = BUILDING_BY_ID.get(tile.buildingId!);
    const style = (def && CATEGORY_STYLE[def.category]) || CATEGORY_STYLE.economy;
    const bw = 14, bd = 8, bh = 16;

    // Ground shadow
    node.addChild(new Graphics().ellipse(cx, top + 4, 17, 7).fill({ color: 0x000000, alpha: 0.22 }));

    const box = new Graphics();
    // Left face
    box.poly([cx - bw, top - bh, cx, top - bh + bd, cx, top + bd, cx - bw, top]).fill(style.body);
    // Right face (darker)
    box.poly([cx, top - bh + bd, cx + bw, top - bh, cx + bw, top, cx, top + bd])
      .fill({ color: style.body, alpha: 1 });
    box.poly([cx, top - bh + bd, cx + bw, top - bh, cx + bw, top, cx, top + bd])
      .fill({ color: 0x000000, alpha: 0.22 });
    // Roof (top diamond)
    box.poly([cx, top - bh - bd, cx + bw, top - bh, cx, top - bh + bd, cx - bw, top - bh]).fill(style.roof);
    box.poly([cx, top - bh - bd, cx + bw, top - bh, cx, top - bh + bd, cx - bw, top - bh])
      .stroke({ width: 1, color: 0x000000, alpha: 0.18 });
    node.addChild(box);

    // Category icon
    const icon = new Text({
      text: style.icon,
      style: { fontSize: 15, fontFamily: 'sans-serif' },
    });
    icon.anchor.set(0.5);
    icon.position.set(cx, top - bh + 1);
    node.addChild(icon);

    // Upgrade badge (level 2/3) — small gold pips
    const lvl = tile.upgradeLevel ?? 1;
    if (lvl >= 2) {
      const pips = new Graphics();
      for (let i = 0; i < lvl - 1; i++) {
        pips.star(cx - 6 + i * 6, top - bh - bd - 5, 4, 3, 1.4).fill(0xf5c542);
      }
      node.addChild(pips);
    }
    return node;
  };

  const rebuildTiles = () => {
    const layer = tileLayerRef.current;
    const g = gridRef.current;
    if (!layer || !g.length) return;
    layer.removeChildren().forEach((c) => c.destroy());
    waterSpritesRef.current = [];
    const fxLayer = fxLayerRef.current;
    if (fxLayer) fxLayer.removeChildren().forEach((c) => c.destroy());
    fxNodesRef.current = [];

    const lay = layerRef.current;
    const tex = texturesRef.current;
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
        layer.addChild(gfx);

        // ── Water tiles: animated texture sprite clipped to the hex ──────────
        if (tile.terrain === 'Water' && lay === 'normal' && tex.river) {
          const chosen =
            tile.wrrl_quality <= 2.2 ? tex.deep : tile.wrrl_quality >= 3.6 ? tex.shallow : tex.river;
          const sprite = new TilingSprite({
            texture: chosen ?? tex.river,
            width: 2 * W,
            height: 2 * H,
          });
          sprite.position.set(cx - W, top - H);
          // Squash vertically to sit flat on the iso hex
          sprite.tileScale.set((2 * W) / (chosen ?? tex.river!).width, (2.4 * H) / (chosen ?? tex.river!).height);
          sprite.alpha = 0.9;
          const mask = new Graphics().poly(hexPoints(cx, top)).fill(0xffffff);
          sprite.mask = mask;
          layer.addChild(sprite);
          layer.addChild(mask);
          waterSpritesRef.current.push(sprite);
        }

        // Lit top-left facet
        gfx
          .poly([cx, top, cx, top - H, cx - W, top - H / 2, cx - W, top + H / 2])
          .fill({ color: 0xffffff, alpha: tile.terrain === 'Water' ? 0.06 : 0.13 });
        // Glancing top-right facet
        gfx
          .poly([cx, top, cx, top - H, cx + W, top - H / 2, cx + W, top + H / 2])
          .fill({ color: 0xffffff, alpha: 0.04 });

        // ── Procedural land details (hybrid look) ────────────────────────────
        if (lay === 'normal') drawLandDetails(gfx, tile, cx, top);

        // ── Data-layer overlay (WRRL / FFH / Flood) ──────────────────────────
        if (lay !== 'normal') {
          const ov = overlayFor(tile, lay as 'wrrl' | 'ffh' | 'flood');
          gfx.poly(hexPoints(cx, top)).fill({ color: ov.color, alpha: ov.alpha });
          const valText = new Text({
            text: ov.label,
            style: { fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', fill: 0x2c3322 },
          });
          valText.anchor.set(0.5);
          valText.position.set(cx, top);
          layer.addChild(valText);
        }

        // ── Build-eligibility highlight (when a building is selected) ─────────
        const selB = selectedBuilding;
        if (lay === 'normal' && selB && !tile.buildingId && selB.allowedTerrains.includes(tile.terrain)) {
          gfx.poly(hexPoints(cx, top)).fill({ color: 0x7dd957, alpha: 0.28 });
          gfx.poly(hexPoints(cx, top)).stroke({ width: 2, color: 0x9be86a, alpha: 0.9 });
        }

        // Building (isometric body + category icon)
        if (tile.buildingId) {
          layer.addChild(buildBuildingNode(tile, cx, top));

          // ── Animated building effects ──────────────────────────────────────
          if (fxLayer && lay === 'normal') {
            if (tile.buildingId === 'windkraft') {
              // Slim tower + rotating rotor
              const tower = new Graphics();
              tower.poly([cx - 1.5, top - 18, cx + 1.5, top - 18, cx + 1, top - 40, cx - 1, top - 40]).fill(0xeae6dd);
              fxLayer.addChild(tower);
              // Three blades at fixed angles in one graphics; rotate the whole node
              const blades = new Graphics();
              for (let b = 0; b < 3; b++) {
                const ang = (b * 2 * Math.PI) / 3;
                const bx = Math.cos(ang), by = Math.sin(ang);
                blades.poly([0, 0, bx * 16 - by * 3, by * 16 + bx * 3, bx * 16 + by * 3, by * 16 - bx * 3]).fill(0xf6f3ec);
              }
              blades.circle(0, 0, 2).fill(0x8b8273);
              blades.position.set(cx, top - 40);
              fxLayer.addChild(blades);
              fxNodesRef.current.push({ type: 'wind', blades, speed: 0.08 });
            } else if (tile.buildingId === 'schoellershammer' || tile.buildingId === 'intensiv_farm') {
              // Rising smoke puffs
              const puffs = [];
              for (let p = 0; p < 5; p++) {
                const g0 = new Graphics();
                g0.circle(0, 0, 6).fill({ color: 0xb8b2a6, alpha: 0.5 });
                g0.position.set(cx, top - 14);
                g0.alpha = 0;
                fxLayer.addChild(g0);
                puffs.push({ g: g0, life: p * 14, max: 70, vy: 0.6, sway: p * 7 });
              }
              fxNodesRef.current.push({ type: 'smoke', cx, top: top - 14, puffs });
            }
          }
        }

        // ── City / village name label ────────────────────────────────────────
        if (lay === 'normal' && tile.cityName) {
          const lbl = new Text({
            text: tile.cityName,
            style: { fontSize: 9, fontFamily: 'sans-serif', fontWeight: 'bold', fill: 0xfaf6ee,
              stroke: { color: 0x3e2a12, width: 3 } },
          });
          lbl.anchor.set(0.5);
          lbl.position.set(cx, top - 26);
          layer.addChild(lbl);
        }
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
