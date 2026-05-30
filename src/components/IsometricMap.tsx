import React, { useRef, useEffect, useState } from 'react';
import { TileData, BuildingType, TerrainType } from '../types';
import { BUILDIONS_CATALOG } from '../gameData';
import { ZoomIn, ZoomOut, Layers, HelpCircle, Eye, Locate } from 'lucide-react';

interface IsometricMapProps {
  grid: TileData[][];
  onTileClick: (x: number, y: number) => void;
  selectedBuilding: BuildingType | null;
  selectedLayer: 'normal' | 'wrrl' | 'ffh' | 'flood';
  onLayerChange: (layer: 'normal' | 'wrrl' | 'ffh' | 'flood') => void;
  isDemolishMode: boolean;
  season?: string;
  selectedTile?: { x: number; y: number } | null;
}

export const IsometricMap: React.FC<IsometricMapProps> = ({
  grid,
  onTileClick,
  selectedBuilding,
  selectedLayer,
  onLayerChange,
  isDemolishMode,
  season = 'Frühling',
  selectedTile = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport states (kept for hit-testing and UI)
  const [zoom, setZoom] = useState<number>(0.9);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouseHasMoved, setMouseHasMoved] = useState<boolean>(false);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Touch Gestures support
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchLastPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchHasMoved = useRef<boolean>(false);
  const [touchPinchDist, setTouchPinchDist] = useState<number | null>(null);
  const touchStartZoomRef = useRef<number>(0.9);

  // --- Refs for draw dependencies (no stale closures in RAF) ---
  const zoomRef = useRef<number>(0.9);
  const panXRef = useRef<number>(0);
  const panYRef = useRef<number>(0);
  const gridRef = useRef<TileData[][]>(grid);
  const seasonRef = useRef<string>(season);
  const layerRef = useRef<'normal' | 'wrrl' | 'ffh' | 'flood'>(selectedLayer);
  const hoveredTileRef = useRef<{ x: number; y: number } | null>(null);
  const selectedTileRef = useRef<{ x: number; y: number } | null>(selectedTile);
  const selectedBuildingRef = useRef<BuildingType | null>(selectedBuilding);

  // Sync state → refs
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panXRef.current = panX; }, [panX]);
  useEffect(() => { panYRef.current = panY; }, [panY]);
  useEffect(() => { gridRef.current = grid; staticDirtyRef.current = true; }, [grid]);
  useEffect(() => { seasonRef.current = season; staticDirtyRef.current = true; }, [season]);
  useEffect(() => { layerRef.current = selectedLayer; staticDirtyRef.current = true; }, [selectedLayer]);
  useEffect(() => { hoveredTileRef.current = hoveredTile; }, [hoveredTile]);
  useEffect(() => { selectedTileRef.current = selectedTile; }, [selectedTile]);
  useEffect(() => { selectedBuildingRef.current = selectedBuilding; }, [selectedBuilding]);

  // Animation tick ref (no setState involved in RAF loop)
  const tickRef = useRef<number>(0);

  // Off-screen static canvas
  const staticCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const staticDirtyRef = useRef<boolean>(true);

  // Inertia scrolling refs
  const velXRef = useRef<number>(0);
  const velYRef = useRef<number>(0);
  const isDragActiveRef = useRef<boolean>(false);
  const lastMouseTimeRef = useRef<number>(0);

  // Throttle counter for syncing inertia pan back to React state
  const inertiaSyncFrameRef = useRef<number>(0);

  // ── Gradient cache refs ───────────────────────────────────────────────────
  // Edge vignette: recreated only when canvas dimensions change
  const edgeVigRef    = useRef<CanvasGradient | null>(null);
  const edgeVigKeyRef = useRef<string>('');
  // Water shimmer: one reusable gradient object; translate is cheaper than
  // calling createLinearGradient per tile per frame
  const shimmerGradRef = useRef<CanvasGradient | null>(null);

  // ── Screen-space background cache (Option B) ──────────────────────────────
  // Background gradient + dot-grid texture + vignette are screen-fixed: they
  // depend only on canvas size, never on pan/zoom. Cache them in a dedicated
  // offscreen canvas so the 1600-arc dot loop + 3 gradients are NOT regenerated
  // on every pan/zoom frame (the static canvas rebuilds whenever pan/zoom changes).
  const bgCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const bgKeyRef = useRef<string>('');

  // Hexagonal dimensions
  const r = 52;
  const w = r * Math.sqrt(3) / 2; // ~45
  const h = r * 0.58;             // ~30
  const spacingX = r * Math.sqrt(3); // ~90
  const spacingY = 1.5 * h;        // ~45

  // Helper to map index (x, y) to hexagonal canvas coordinates
  const getHexCenter = (x: number, y: number) => {
    const cx = (y % 2 === 1) ? (x + 0.5) * spacingX : x * spacingX;
    const cy = y * spacingY;
    return { cx, cy };
  };

  // Reusable path builder for regular pointy-topped hexagon
  const pathHexagon = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx + w, cy - h/2);
    ctx.lineTo(cx + w, cy + h/2);
    ctx.lineTo(cx, cy + h);
    ctx.lineTo(cx - w, cy + h/2);
    ctx.lineTo(cx - w, cy - h/2);
    ctx.closePath();
  };

  // Reverse mapping to find closest hex tile from scaled coordinates
  const getTileFromCoords = (rx: number, ry: number): { x: number; y: number } | null => {
    let bestX = -1;
    let bestY = -1;
    let minDist = Infinity;

    const currentGrid = gridRef.current;
    const sizeY = currentGrid.length;
    const sizeX = currentGrid[0]?.length || 0;

    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const { cx, cy } = getHexCenter(x, y);
        const dx = rx - cx;
        const dy = ry - cy;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          bestX = x;
          bestY = y;
        }
      }
    }

    if (minDist < 3000) {
      return { x: bestX, y: bestY };
    }
    return null;
  };

  // Hexagonal distance mapping using spatial screen distance
  const getHexDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    const p1 = getHexCenter(x1, y1);
    const p2 = getHexCenter(x2, y2);
    const dx = p1.cx - p2.cx;
    const dy = p1.cy - p2.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) return 0;
    if (dist < 92) return 1;
    if (dist < 182) return 2;
    if (dist < 272) return 3;
    return Math.ceil(dist / 90);
  };

  const getBuildingRange = (buildingId: string): number => {
    switch (buildingId) {
      case 'rurtalbahn_halt':
      case 'natura_zentrum':
      case 'klaerwerk_upgrade':
      case 'besucherzentrum':
        return 2;
      default:
        return 1;
    }
  };

  // Set initial responsive zoom & pan when canvas/grid size is known
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isMobile = rect.width < 768;
      const initialZoom = isMobile ? 0.6 : 0.75;
      setZoom(initialZoom);
      zoomRef.current = initialZoom;
      const initPanX = rect.width / 2 - 675 * initialZoom;
      const initPanY = rect.height / 2 - 337 * initialZoom;
      setPanX(initPanX);
      setPanY(initPanY);
      panXRef.current = initPanX;
      panYRef.current = initPanY;
      staticDirtyRef.current = true;
    }
  }, [grid]);

  // Center Map utility
  const handleCenterMap = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isMobile = rect.width < 768;
      const initialZoom = isMobile ? 0.6 : 0.75;
      setZoom(initialZoom);
      zoomRef.current = initialZoom;
      const newPanX = rect.width / 2 - 675 * initialZoom;
      const newPanY = rect.height / 2 - 337 * initialZoom;
      setPanX(newPanX);
      setPanY(newPanY);
      panXRef.current = newPanX;
      panYRef.current = newPanY;
      staticDirtyRef.current = true;
    }
  };

  // Prevent map being lost offscreen on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPanX(prev => {
          if (prev < -rect.width || prev > rect.width * 2) {
            panXRef.current = rect.width / 2;
            return rect.width / 2;
          }
          return prev;
        });
        setPanY(prev => {
          if (prev < -rect.height || prev > rect.height * 2) {
            panYRef.current = rect.height / 5;
            return rect.height / 5;
          }
          return prev;
        });
        staticDirtyRef.current = true;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Colors based on terrain
  const getTileColor = (t: TerrainType, layer: 'normal' | 'wrrl' | 'ffh' | 'flood', tile: TileData, isHovered: boolean | null, tickNum: number): string => {
    if (layer !== 'normal') {
      return '#E8E2D6';
    }

    const hash = (tile.x * 7 + tile.y * 11) % 3 - 1;
    const offsetPercent = hash * 4.2;

    const adjustColor = (hex: string, percent: number): string => {
      let num = parseInt(hex.replace("#",""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
      R = R < 0 ? 0 : R > 255 ? 255 : R;
      G = G < 0 ? 0 : G > 255 ? 255 : G;
      B = B < 0 ? 0 : B > 255 ? 255 : B;
      return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    };

    let color = '#8B8273';
    switch (t) {
      case 'Water': {
        const wave = Math.abs(Math.sin(tickNum / 35 + (tile.x + tile.y) * 0.2));
        const baseBlue = wave > 0.5 ? '#3A9CC8' : '#2E86B0';
        return adjustColor(baseBlue, offsetPercent);
      }
      case 'Wiese':
        color = '#8FB86A';
        break;
      case 'Auwald':
        color = '#5A7247';
        break;
      case 'Acker':
        color = '#BC6C25';
        break;
      case 'Gewerbe':
        color = '#8B8273';
        break;
      case 'Siedlung':
        color = '#C48B71';
        break;
    }

    return adjustColor(color, offsetPercent);
  };

  const getSidesColor = (t: TerrainType, layer: 'normal' | 'wrrl' | 'ffh' | 'flood', tile: TileData): string => {
    if (layer !== 'normal') return '#D4CCBA';

    const hash = (tile.x * 7 + tile.y * 11) % 3 - 1;
    const offsetPercent = hash * 4.2;

    const adjustColor = (hex: string, percent: number): string => {
      let num = parseInt(hex.replace("#",""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
      R = R < 0 ? 0 : R > 255 ? 255 : R;
      G = G < 0 ? 0 : G > 255 ? 255 : G;
      B = B < 0 ? 0 : B > 255 ? 255 : B;
      return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    };

    switch (t) {
      case 'Water': return adjustColor('#2277A0', offsetPercent);
      case 'Wiese': return adjustColor('#72994C', offsetPercent);
      case 'Auwald': return adjustColor('#465937', offsetPercent);
      case 'Acker': return adjustColor('#9c5719', offsetPercent);
      case 'Gewerbe': return adjustColor('#71695c', offsetPercent);
      case 'Siedlung': return adjustColor('#a0705a', offsetPercent);
      default: return adjustColor('#C8BFA8', offsetPercent);
    }
  };

  const getDarkSidesColor = (t: TerrainType, layer: 'normal' | 'wrrl' | 'ffh' | 'flood', tile: TileData): string => {
    if (layer !== 'normal') return '#C8BFA8';

    const hash = (tile.x * 7 + tile.y * 11) % 3 - 1;
    const offsetPercent = hash * 4.2;

    const adjustColor = (hex: string, percent: number): string => {
      let num = parseInt(hex.replace("#",""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
      R = R < 0 ? 0 : R > 255 ? 255 : R;
      G = G < 0 ? 0 : G > 255 ? 255 : G;
      B = B < 0 ? 0 : B > 255 ? 255 : B;
      return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    };

    switch (t) {
      case 'Water': return adjustColor('#185878', offsetPercent);
      case 'Wiese': return adjustColor('#547238', offsetPercent);
      case 'Auwald': return adjustColor('#303d24', offsetPercent);
      case 'Acker': return adjustColor('#754010', offsetPercent);
      case 'Gewerbe': return adjustColor('#554e44', offsetPercent);
      case 'Siedlung': return adjustColor('#7c5442', offsetPercent);
      default: return adjustColor('#B0A793', offsetPercent);
    }
  };

  // Draw data-layer specific glow
  const drawOverlayLayer = (
    ctx: CanvasRenderingContext2D,
    tile: TileData,
    sx: number,
    sy: number,
    wVal: number,
    hVal: number,
    layer: 'normal' | 'wrrl' | 'ffh' | 'flood',
    tickNum: number
  ) => {
    const htw = wVal;
    const hth = hVal;

    if (layer === 'wrrl' && tile.terrain === 'Water') {
      let wrrlColor = 'rgba(188, 108, 37, 0.7)';
      if (tile.wrrl_quality <= 1.5) wrrlColor = 'rgba(90, 114, 71, 0.8)';
      else if (tile.wrrl_quality <= 2.5) wrrlColor = 'rgba(69, 123, 157, 0.85)';
      else if (tile.wrrl_quality <= 3.5) wrrlColor = 'rgba(212, 163, 115, 0.75)';
      else if (tile.wrrl_quality <= 4.5) wrrlColor = 'rgba(188, 108, 37, 0.5)';

      ctx.fillStyle = wrrlColor;
      pathHexagon(ctx, sx, sy);
      ctx.fill();

      ctx.fillStyle = '#2C3322';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`WRRL:${tile.wrrl_quality.toFixed(1)}`, sx - 18, sy + hth + 3);
    }

    if (layer === 'ffh') {
      if (tile.protected || tile.ffh_value > 20) {
        ctx.fillStyle = `rgba(90, 114, 71, ${0.1 + (tile.ffh_value / 250)})`;
        pathHexagon(ctx, sx, sy);
        ctx.fill();

        ctx.strokeStyle = tile.protected ? '#BC6C25' : '#5A7247';
        ctx.lineWidth = tile.protected ? 1.5 : 0.8;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (tile.ffh_value > 0) {
          ctx.fillStyle = '#2C3322';
          ctx.font = 'bold 8.5px monospace';
          ctx.fillText(`FFH:${tile.ffh_value}%`, sx - 15, sy + hth + 3);
        }
      }
    }

    if (layer === 'flood') {
      if (tile.flood_risk > 10) {
        ctx.save();

        pathHexagon(ctx, sx, sy);
        ctx.clip();

        const riseAmplitude = 3.0;
        const riseSpeed = 0.04;
        const riseOffset = Math.sin(tickNum * riseSpeed + (tile.x + tile.y) * 0.7) * riseAmplitude - 1.5;

        const opacity = Math.min(0.85, 0.25 + (tile.flood_risk / 160));
        ctx.fillStyle = `rgba(50, 130, 180, ${opacity})`;

        ctx.beginPath();
        ctx.moveTo(sx, sy + riseOffset - hth);
        ctx.lineTo(sx + htw, sy + riseOffset - hth/2);
        ctx.lineTo(sx + htw, sy + riseOffset + hth/2);
        ctx.lineTo(sx, sy + riseOffset + hth);
        ctx.lineTo(sx - htw, sy + riseOffset + hth/2);
        ctx.lineTo(sx - htw, sy + riseOffset - hth/2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + (tile.flood_risk / 250)})`;
        ctx.lineWidth = 1.3;

        const waveSpeed = 0.5;
        for (let wIdx = 0; wIdx < 2; wIdx++) {
          const tOffset = ((tickNum * waveSpeed + tile.x * 30 + tile.y * 50 + wIdx * 50) % 100) / 100;
          const percent = -0.5 + tOffset * 2.0;

          const cy = sy + percent * hth + riseOffset;
          const cx = sx;

          ctx.beginPath();
          ctx.moveTo(cx - htw, cy - hth * 0.5);
          ctx.quadraticCurveTo(
            cx + Math.sin(tickNum * 0.07 + wIdx) * 12,
            cy + Math.cos(tickNum * 0.05 + wIdx) * 4,
            cx + htw,
            cy + hth * 0.5
          );
          ctx.stroke();
        }

        ctx.restore();

        ctx.strokeStyle = 'rgba(45, 110, 155, 0.8)';
        ctx.lineWidth = 1.2;
        pathHexagon(ctx, sx, sy);
        ctx.stroke();

        ctx.fillStyle = '#1A365D';
        ctx.font = 'bold 8.5px monospace';
        ctx.fillText(`RISK:${tile.flood_risk}%`, sx - 16, sy + hth + 3);
      }
    }
  };

  // Weather overlay rendering based on season
  const drawWeatherOverlay = (
    ctx: CanvasRenderingContext2D,
    seasonVal: string,
    tickNum: number
  ) => {
    const activeSeason = seasonVal.toLowerCase();

    if (activeSeason === 'winter') {
      const flakeCount = 80;
      for (let i = 0; i < flakeCount; i++) {
        const baseX = (i * 37) % 1800 - 200;
        const baseY = (i * 59) % 1100 - 100;

        const speed = 0.75 + (i % 3) * 0.4;
        const finalY = (baseY + tickNum * speed) % 1100 - 100;
        const drift = Math.sin(tickNum / 35 + i) * 15;
        const finalX = baseX + drift;

        const radius = 1.2 + (i % 3) * 0.8;
        const alpha = 0.35 + (i % 5) * 0.12;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(finalX, finalY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (activeSeason === 'herbst') {
      const colors = ['#D97706', '#B45309', '#C2410C', '#854D0E', '#AA5B13'];
      const leafCount = 50;
      for (let i = 0; i < leafCount; i++) {
        const baseX = (i * 41) % 1800 - 200;
        const baseY = (i * 67) % 1100 - 100;

        const speedY = 0.5 + (i % 4) * 0.15;
        const speedX = -0.5 - (i % 3) * 0.2;

        const finalY = (baseY + tickNum * speedY) % 1100 - 100;
        const rawX = baseX + tickNum * speedX + Math.sin(tickNum / 20 + i) * 35;
        const finalX = ((rawX + 2000) % 2000) - 200;

        ctx.save();
        ctx.translate(finalX, finalY);
        ctx.rotate(tickNum / 28 + i);
        ctx.fillStyle = colors[i % colors.length];

        ctx.beginPath();
        if (typeof ctx.ellipse === 'function') {
          ctx.ellipse(0, 0, 4.2, 2.0, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-4.2, 0);
        ctx.lineTo(-6.0, -0.8);
        ctx.stroke();

        ctx.restore();
      }
    } else if (activeSeason === 'sommer') {
      const threadCount = 35;
      for (let i = 0; i < threadCount; i++) {
        const baseX = (i * 47) % 1700 - 100;
        const baseY = (i * 73) % 900 - 100;

        const speedY = 1.1;
        const finalY = ((baseY - tickNum * speedY + 1000) % 1000) - 100;
        const finalX = baseX + Math.sin(tickNum / 18 + i) * 6;

        ctx.save();
        ctx.strokeStyle = `rgba(253, 224, 71, ${0.08 + (i % 4) * 0.04})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(finalX, finalY);
        for (let j = 0; j < 3; j++) {
          const segY = finalY + j * 15;
          const segX = finalX + Math.sin(tickNum / 12 + i + j) * 3;
          ctx.lineTo(segX, segY);
        }
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      const shimmerAlpha = 0.015 + Math.sin(tickNum / 45) * 0.012;
      ctx.fillStyle = `rgba(251, 191, 36, ${shimmerAlpha})`;
      ctx.fillRect(-200, -200, 1900, 1200);
      ctx.restore();
    } else if (activeSeason === 'frühling') {
      const pinkAndGreens = ['#FFC0CB', '#FFF5F7', '#FFB7C5', '#A3B18A', '#D8F3DC'];
      const pollenCount = 45;
      for (let i = 0; i < pollenCount; i++) {
        const baseX = (i * 43) % 1800 - 200;
        const baseY = (i * 53) % 1100 - 100;

        const speedY = 0.18 + (i % 3) * 0.12;
        const speedX = 0.35 + (i % 4) * 0.22;

        const finalY = (baseY + tickNum * speedY) % 1100 - 100;
        const finalX = (baseX + tickNum * speedX + Math.sin(tickNum / 30 + i) * 12) % 1800 - 200;

        ctx.save();
        ctx.translate(finalX, finalY);
        ctx.rotate(tickNum / 40 + i);
        ctx.fillStyle = pinkAndGreens[i % pinkAndGreens.length];

        if (i % 2 === 0) {
          ctx.beginPath();
          if (typeof ctx.ellipse === 'function') {
            ctx.ellipse(0, 0, 3.2, 1.8, 0.3, 0, Math.PI * 2);
          } else {
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
          }
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Ambient Floating Low-Poly Diorama Clouds
    const cloudCount = 4;
    ctx.save();
    for (let i = 0; i < cloudCount; i++) {
      const speed = 0.18 + (i % 2) * 0.08;
      const startX = (i * 450 + tickNum * speed) % 1900 - 350;
      const startY = -140 + (i * 125) % 360;

      ctx.fillStyle = 'rgba(44, 33, 17, 0.038)';
      ctx.beginPath();
      ctx.ellipse(startX + 30, startY + 180, 65, 20, 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(startX - 22, startY + 2, 16, 0, Math.PI * 2);
      ctx.arc(startX - 4, startY - 8, 22, 0, Math.PI * 2);
      ctx.arc(startX + 16, startY - 12, 24, 0, Math.PI * 2);
      ctx.arc(startX + 30, startY + 3, 15, 0, Math.PI * 2);
      ctx.arc(startX, startY + 8, 18, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  // 2.5D building drawing method
  const drawIsometricBuilding = (
    ctx: CanvasRenderingContext2D,
    bid: string,
    sx: number,
    sy: number,
    htw: number,
    hth: number,
    tickNum: number
  ) => {
    ctx.save();
    ctx.translate(sx, sy);

    if (bid === 'altarm') {
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px sans-serif';
      ctx.fillText('↪️', -10, 5);
    }
    else if (bid === 'auenwald') {
      ctx.fillStyle = '#064e3b';
      drawTree(ctx, -12, -4, 18);
      drawTree(ctx, 10, -8, 15);
      drawTree(ctx, 0, 12, 19);
    }
    else if (bid === 'totholz') {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(15, -10);
      ctx.moveTo(0, -5);
      ctx.lineTo(8, 10);
      ctx.stroke();
    }
    else if (bid === 'fischpass') {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-15, -5, 30, 10);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(-15, -5, 30, 10);
      ctx.fillStyle = '#2563eb';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-12 + i * 7, -3, 5, 6);
      }
    }
    else if (bid === 'biber_station') {
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-12, -10, 24, 16);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.moveTo(-15, -10);
      ctx.lineTo(0, -22);
      ctx.lineTo(15, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🦫', -7, 4);
    }
    else if (bid === 'lachs_zucht') {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(-8, 0, 7, 0, Math.PI * 2);
      ctx.arc(8, 5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-8, 0, 5, 0, Math.PI * 2);
      ctx.arc(8, 5, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (bid === 'besucherzentrum') {
      ctx.fillStyle = '#14b8a6';
      ctx.fillRect(-14, -14, 28, 20);
      ctx.strokeStyle = '#0f766e';
      ctx.strokeRect(-14, -14, 28, 20);

      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(-10, -6, 20, 10);
      ctx.strokeStyle = '#0284c7';
      ctx.strokeRect(-10, -6, 20, 10);

      ctx.fillStyle = '#0f766e';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ℹ️', -5, 2);
    }
    else if (bid === 'campingplatz') {
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#c2410c';
      ctx.beginPath();
      ctx.moveTo(-16, 5);
      ctx.lineTo(-8, -10);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0d9488';
      ctx.strokeStyle = '#115e59';
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(8, -5);
      ctx.lineTo(16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.fillRect(-3, 0, 6, 3);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -1, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (bid === 'kanuverleih') {
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-15, -6, 10, 20);
      ctx.strokeStyle = '#78350f';
      ctx.strokeRect(-15, -6, 10, 20);

      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(4, -4, 10, 3, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(8, 6, 10, 3, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    else if (bid === 'rurtalbahn_halt') {
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-18, 0, 36, 10);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-18, 0, 36, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText('BAHN', -11, 7);

      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-24, -8);
      ctx.lineTo(24, -8);
      ctx.stroke();

      ctx.strokeStyle = '#6e583e';
      ctx.lineWidth = 1.5;
      for (let sl = -20; sl <= 20; sl += 6) {
        ctx.beginPath();
        ctx.moveTo(sl, -10);
        ctx.lineTo(sl, -6);
        ctx.stroke();
      }

      ctx.strokeStyle = '#b0b0b0';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-24, -9);
      ctx.lineTo(24, -9);
      ctx.moveTo(-24, -7);
      ctx.lineTo(24, -7);
      ctx.stroke();

      const trainX = Math.sin(tickNum / 35) * 16;
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(trainX - 6, -13, 12, 5);

      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(trainX - 4, -12, 3, 1.8);
      ctx.fillRect(trainX + 1, -12, 3, 1.8);

      if (tickNum % 40 < 20) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(trainX + (Math.sin(tickNum / 35) > 0 ? 3 : -3), -16 - (tickNum % 10) * 0.4, 2 + (tickNum % 6) * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (bid === 'schoellershammer') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-22, -18, 44, 28);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(-22, -18, 44, 28);

      ctx.fillStyle = '#475569';
      ctx.fillRect(8, -40, 8, 24);
      ctx.strokeRect(8, -40, 8, 24);

      if (tickNum % 60 < 30) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(12 + Math.sin(tickNum / 5) * 4, -45 - (tickNum % 30) * 0.5, 3 + (tickNum % 10) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (bid === 'windkraft') {
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-2, 10);
      ctx.lineTo(-1, -26);
      ctx.lineTo(1, -26);
      ctx.lineTo(2, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillRect(-2.5, -28.5, 5, 4);

      ctx.save();
      ctx.translate(0, -26.5);
      const angle = tickNum * 0.045;
      ctx.rotate(angle);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) {
        ctx.rotate((2 * Math.PI) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 18);
        ctx.stroke();
      }
      ctx.restore();
    }
    else if (bid === 'solarpark') {
      const rowY = [-10, -1, 8];
      rowY.forEach((ry) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-12, ry + 2, 24, 2);

        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 0.7;
        ctx.fillRect(-11, ry - 3, 22, 5);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-11, ry);
        ctx.lineTo(11, ry);
        ctx.moveTo(-7, ry - 3); ctx.lineTo(-7, ry + 2);
        ctx.moveTo(0, ry - 3); ctx.lineTo(0, ry + 2);
        ctx.moveTo(7, ry - 3); ctx.lineTo(7, ry + 2);
        ctx.stroke();
      });
    }
    else if (bid === 'wasserkraft') {
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#334155';
      ctx.fillRect(-12, -10, 24, 16);
      ctx.strokeRect(-12, -10, 24, 16);

      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(-14, -10);
      ctx.lineTo(0, -20);
      ctx.lineTo(14, -10);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.translate(14, -3);
      const wAngle = tickNum * 0.05;

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 0.8;
      for (let pIdx = 0; pIdx < 6; pIdx++) {
        const curAngle = wAngle + (pIdx * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(curAngle) * 8, Math.sin(curAngle) * 8);
        ctx.stroke();
      }
      ctx.restore();

      if (tickNum % 20 < 10) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(14 + (tickNum % 6), -1 + Math.sin(tickNum / 3) * 1.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (bid === 'extensive_weide') {
      const sheeps = [
        { sx: -10, sy: -1, bob: tickNum % 30 },
        { sx: 8, sy: 5, bob: (tickNum + 10) % 30 },
        { sx: -1, sy: -9, bob: (tickNum + 20) % 30 }
      ];

      sheeps.forEach(sh => {
        const bobY = Math.abs(Math.sin(sh.bob * 0.15)) * 1.2;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sh.sx, sh.sy + bobY, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(sh.sx - 1.5, sh.sy + 3 + bobY);
        ctx.lineTo(sh.sx - 1.5, sh.sy + 4.5 + bobY);
        ctx.moveTo(sh.sx + 1.5, sh.sy + 3 + bobY);
        ctx.lineTo(sh.sx + 1.5, sh.sy + 4.5 + bobY);
        ctx.stroke();

        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.arc(sh.sx - 3.5, sh.sy + bobY - 0.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    else if (bid === 'intensive_farm') {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-14, -5, 18, 12);
      ctx.strokeStyle = '#7f1d1d';
      ctx.strokeRect(-14, -5, 18, 12);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-10, -2); ctx.lineTo(-10, 7);
      ctx.moveTo(-10, -2); ctx.lineTo(-5, 7);
      ctx.moveTo(-5, -2); ctx.lineTo(-5, 7);
      ctx.moveTo(-5, -2); ctx.lineTo(-10, 7);
      ctx.stroke();

      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(-16, -5);
      ctx.lineTo(-5, -13);
      ctx.lineTo(6, -5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.8;
      ctx.fillRect(8, -14, 6, 21);
      ctx.strokeRect(8, -14, 6, 21);

      ctx.beginPath();
      ctx.arc(11, -14, 3, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    else if (bid === 'deichrueck') {
      ctx.fillStyle = '#4d7c0f';
      ctx.strokeStyle = '#3f6212';
      ctx.beginPath();
      ctx.moveTo(-17, 8);
      ctx.quadraticCurveTo(-11, -8, 0, -8);
      ctx.quadraticCurveTo(11, -8, 17, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.3;
      for (let st = -12; st <= 12; st += 6) {
        ctx.beginPath();
        ctx.moveTo(st, 1);
        ctx.lineTo(st, -4);
        ctx.stroke();
      }
    }
    else if (bid === 'polder') {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-15, -10, 30, 18);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(-15, -10, 30, 18);

      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(-12, -7, 24, 12);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-9, -3 + Math.sin(tickNum / 20) * 1.5);
      ctx.lineTo(9, -3 + Math.sin(tickNum / 20) * 1.5);
      ctx.stroke();
    }
    else if (bid === 'sohlgleite') {
      const rocks = [
        { rx: -9, ry: -3, r: 3.5 },
        { rx: -3, ry: 4, r: 5 },
        { rx: 5, ry: -2, r: 4.2 },
        { rx: 10, ry: 5, r: 3.2 }
      ];

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.7;
      rocks.forEach(rk => {
        ctx.fillStyle = '#52525b';
        ctx.beginPath();
        ctx.arc(rk.rx, rk.ry, rk.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#a1a1aa';
        ctx.beginPath();
        ctx.arc(rk.rx - rk.r*0.3, rk.ry - rk.r*0.3, rk.r*0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.3;
      for (let s = 0; s < 3; s++) {
        const sxOffset = -11 + (s * 8) + (tickNum % 8) * 0.4;
        ctx.beginPath();
        ctx.moveTo(sxOffset, -3 + Math.sin(tickNum / 3 + s) * 1.5);
        ctx.lineTo(sxOffset + 3, -1 + Math.sin(tickNum / 3 + s) * 1.5);
        ctx.stroke();
      }
    }
    else if (bid === 'regenbecken') {
      ctx.fillStyle = '#4b5563';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    else if (bid === 'insektenhotel') {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(-9, 7);
      ctx.lineTo(0, -9);
      ctx.lineTo(9, 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffedd5';
      ctx.beginPath();
      ctx.moveTo(-7.5, 6);
      ctx.lineTo(0, -5);
      ctx.lineTo(7.5, 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#451a03';
      for (let dh = -3; dh <= 3; dh += 3) {
        ctx.beginPath(); ctx.arc(dh, 3, 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(dh / 2, -1, 0.8, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = '#ec4899';
      ctx.beginPath(); ctx.arc(-11, 8, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#eab308';
      ctx.beginPath(); ctx.arc(-8, 10, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a855f7';
      ctx.beginPath(); ctx.arc(9, 8, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    else if (bid === 'klaerwerk_upgrade') {
      const basins = [
        { bx: -8, by: -2, br: 7.5 },
        { bx: 8, by: 4, br: 7 }
      ];

      basins.forEach((bs, idx) => {
        ctx.fillStyle = '#4b5563';
        ctx.strokeStyle = '#111827';
        ctx.beginPath();
        ctx.arc(bs.bx, bs.by, bs.br, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = idx === 0 ? '#10b981' : '#0ea5e9';
        ctx.beginPath();
        ctx.arc(bs.bx, bs.by, bs.br - 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 0.9;
        ctx.strokeStyle = '#ffffff';
        const angleSweep = tickNum * (idx === 0 ? 0.02 : -0.012);
        ctx.beginPath();
        ctx.moveTo(bs.bx, bs.by);
        ctx.lineTo(bs.bx + Math.cos(angleSweep) * (bs.br - 2.2), bs.by + Math.sin(angleSweep) * (bs.br - 2.2));
        ctx.stroke();
      });
    }
    else if (bid === 'natura_zentrum') {
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 3, 13, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.8;
      for (let rib = -10; rib <= 10; rib += 5) {
        ctx.beginPath();
        ctx.ellipse(0, 3, Math.abs(rib), 13, 0, Math.PI, 0);
        ctx.stroke();
      }

      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.arc(0, 3, 13, Math.PI * 1.25, Math.PI * 1.75);
      ctx.closePath();
      ctx.fill();
    }
    else if (bid === 'eisvogel_nist') {
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.lineTo(0, -9);
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.fillRect(-3, -15, 6, 6);
      ctx.strokeStyle = '#431407';
      ctx.strokeRect(-3, -15, 6, 6);

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(0, -12, 1, 0, Math.PI * 2);
      ctx.fill();

      const birdX = 6 + Math.sin(tickNum / 9) * 2.5;
      const birdY = -10 + Math.cos(tickNum / 7) * 1.8;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(birdX, birdY, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(birdX - 0.5, birdY + 0.8, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
    else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-14, -14, 28, 24);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(-14, -14, 28, 24);

      const catalogMatch = BUILDIONS_CATALOG.find(b => b.id === bid);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      if (catalogMatch) {
        ctx.fillText(catalogMatch.name.substring(0, 3), -10, 2);
      }
    }

    ctx.restore();
  };

  const drawProceduralTerrainDetails = (
    ctx: CanvasRenderingContext2D,
    tile: TileData,
    sx: number,
    sy: number,
    wVal: number,
    hVal: number,
    tickNum: number
  ) => {
    const terrain = tile.terrain;
    const htw = wVal;
    const hth = hVal;

    if (terrain === 'Water') {
      ctx.save();
      pathHexagon(ctx, sx, sy);
      ctx.clip();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.2;

      for (let i = 0; i < 3; i++) {
        const flowOffset = ((tickNum * 0.45 + (tile.x * 25) + (tile.y * 55) + (i * 45)) % 100) / 100;
        const startRatio = -0.4 + flowOffset * 1.0;
        const endRatio = startRatio + 0.35;

        const startX = sx + (startRatio - 0.5) * htw;
        const startY = sy + (startRatio - 0.5) * hth;
        const endX = sx + (endRatio - 0.5) * htw;
        const endY = sy + (endRatio - 0.5) * hth;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo((startX + endX) / 2, (startY + endY) / 2 - 2, endX, endY);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(sx, sy - hth + 3);
      ctx.lineTo(sx + htw - 3, sy);
      ctx.lineTo(sx, sy + hth - 3);
      ctx.lineTo(sx - htw + 3, sy);
      ctx.closePath();
      ctx.fill();

      if (tile.buildingId === null && (tile.x * 9 + tile.y * 11) % 6 === 0) {
        const boatX = sx + Math.sin(tickNum / 25 + tile.x) * 4;
        const boatY = sy + Math.cos(tickNum / 30 + tile.y) * 2;

        ctx.save();
        ctx.translate(boatX, boatY);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-6, 2);
        ctx.lineTo(6, 2);
        ctx.lineTo(3, 4);
        ctx.lineTo(-3, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(0, -5);
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(3.5, 0);
        ctx.lineTo(0, 1.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }
    else if (terrain === 'Wiese') {
      ctx.save();
      const seedPoints = [
        { rx: -15, ry: 2 },
        { rx: 12, ry: 5 },
        { rx: -8, ry: 12 },
        { rx: 14, ry: -5 },
        { rx: -5, ry: -8 },
      ];
      ctx.strokeStyle = '#4F6F52';
      ctx.lineWidth = 1.2;
      seedPoints.forEach((p, idx) => {
        const px = sx + p.rx;
        const py = sy + p.ry;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px - 1.5, py - 4, px - 3, py - 6);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + 1.5, py - 4.5, px + 2.5, py - 7);
        ctx.stroke();

        if (idx % 2 === 0) {
          ctx.fillStyle = idx % 4 === 0 ? '#F39C12' : '#FFFFFF';
          ctx.beginPath();
          ctx.arc(px + 3, py - 1, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (tile.buildingId === null && (tile.x * 7 + tile.y * 13) % 4 === 0) {
        const sxSheep = sx + 5;
        const sySheep = sy - 3;

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(sxSheep, sySheep, 3, 2.2, 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.arc(sxSheep - 2.5, sySheep + 0.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    else if (terrain === 'Auwald') {
      ctx.save();
      const trees = [
        { rx: -14, ry: 0,  r: 11, dark: false },
        { rx:  12, ry: -5, r: 9,  dark: true  },
        { rx:   2, ry: 11, r: 12, dark: false },
        { rx: -8,  ry: 14, r: 8,  dark: true  },
      ];
      trees.forEach((tree) => {
        const tx = sx + tree.rx;
        const ty = sy + tree.ry;
        const rad = tree.r;

        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath();
        ctx.ellipse(tx + 2, ty + rad * 0.5, rad * 0.85, rad * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = tree.dark ? '#2D5A30' : '#3A6B3A';
        ctx.beginPath();
        ctx.arc(tx, ty, rad, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = tree.dark ? '#4A8048' : '#5A9450';
        ctx.beginPath();
        ctx.arc(tx - rad * 0.15, ty - rad * 0.2, rad * 0.75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = tree.dark ? '#6AAE60' : '#82C470';
        ctx.beginPath();
        ctx.arc(tx - rad * 0.22, ty - rad * 0.30, rad * 0.48, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.arc(tx - rad * 0.30, ty - rad * 0.38, rad * 0.22, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
    else if (terrain === 'Acker') {
      ctx.save();
      pathHexagon(ctx, sx, sy);
      ctx.clip();

      ctx.strokeStyle = '#A0522D';
      ctx.lineWidth = 1.0;

      const angleEast = (tile.x % 2 === 0);
      const totalRows = 6;
      for (let i = 0; i < totalRows; i++) {
        const distance = ((i / (totalRows - 1)) - 0.5) * 2;

        ctx.beginPath();
        if (angleEast) {
          const startX = sx + distance * htw * 0.8 - htw * 0.4;
          const startY = sy + distance * hth * 0.8 + hth * 0.4;
          const endX = sx + distance * htw * 0.8 + htw * 0.4;
          const endY = sy + distance * hth * 0.8 - hth * 0.4;
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        } else {
          const startX = sx + distance * htw * 0.8 - htw * 0.4;
          const startY = sy - distance * hth * 0.8 - hth * 0.4;
          const endX = sx + distance * htw * 0.8 + htw * 0.4;
          const endY = sy - distance * hth * 0.8 + hth * 0.4;
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        }
        ctx.stroke();
      }

      ctx.fillStyle = '#83C5BE';
      for (let i = 1; i < totalRows - 1; i++) {
        const distance = ((i / (totalRows - 1)) - 0.5) * 2;
        const cx = sx + distance * htw * 0.6;
        const cy = sy + distance * hth * 0.6 - 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    else if (terrain === 'Siedlung') {
      ctx.save();
      const houseCoords = [
        { rx: -15, ry: 4 },
        { rx: 12, ry: -2 },
        { rx: -2, ry: 16 }
      ];

      houseCoords.forEach((hc, hidx) => {
        const hx = sx + hc.rx;
        const hy = sy + hc.ry;

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(hx, hy + 3, 7, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#E6C594';
        ctx.beginPath();
        ctx.moveTo(hx - 5, hy + 2);
        ctx.lineTo(hx, hy + 5);
        ctx.lineTo(hx, hy - 2);
        ctx.lineTo(hx - 5, hy - 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#CFA165';
        ctx.beginPath();
        ctx.moveTo(hx, hy + 5);
        ctx.lineTo(hx + 5, hy + 2);
        ctx.lineTo(hx + 5, hy - 5);
        ctx.lineTo(hx, hy - 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy - 5);
        ctx.lineTo(hx, hy - 11);
        ctx.lineTo(hx, hy - 2);
        ctx.lineTo(hx - 6, hy + 1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.moveTo(hx, hy - 11);
        ctx.lineTo(hx + 6, hy - 5);
        ctx.lineTo(hx + 6, hy + 1);
        ctx.lineTo(hx, hy - 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#5E2B25';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(hx, hy - 11);
        ctx.lineTo(hx, hy - 2);
        ctx.stroke();

        if (hidx === 1) {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(hx + 1.2, hy - 11, 1.2, 3);

          const smokeTick = (tickNum + (tile.x * 12) + (tile.y * 7)) % 75;
          const smokeAl = (1 - smokeTick / 75) * 0.45;
          if (smokeAl > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${smokeAl})`;
            ctx.beginPath();
            ctx.arc(
              hx + 1.8 + Math.sin(smokeTick / 6) * 1.5,
              hy - 13 - smokeTick * 0.25,
              1.0 + smokeTick * 0.08,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      });
      ctx.restore();
    }
    else if (terrain === 'Gewerbe') {
      ctx.save();
      ctx.strokeStyle = '#565E63';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(sx - htw * 0.8, sy + hth * 0.4);
      ctx.lineTo(sx + htw * 0.8, sy - hth * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#4B5563';
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy - 10);
      ctx.lineTo(sx + 10, sy - 21);
      ctx.lineTo(sx + 24, sy - 14);
      ctx.lineTo(sx + 2, sy - 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.strokeStyle = '#F39C12';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 10, sy + 10);
      ctx.lineTo(sx - 2, sy + 14);
      ctx.moveTo(sx - 7, sy + 8);
      ctx.lineTo(sx + 1, sy + 12);
      ctx.stroke();
      ctx.restore();
    }
  };

  const drawTree = (ctx: CanvasRenderingContext2D, dx: number, dy: number, treeH: number) => {
    ctx.fillStyle = '#065f46';
    ctx.strokeStyle = '#022c22';
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx - 5, dy - treeH / 3);
    ctx.lineTo(dx - 1, dy - treeH / 3);
    ctx.lineTo(dx - 4, dy - (2 * treeH) / 3);
    ctx.lineTo(dx - 1, dy - (2 * treeH) / 3);
    ctx.lineTo(dx - 3, dy - treeH);
    ctx.lineTo(dx + 3, dy - treeH);
    ctx.lineTo(dx + 1, dy - (2 * treeH) / 3);
    ctx.lineTo(dx + 4, dy - (2 * treeH) / 3);
    ctx.lineTo(dx + 1, dy - treeH / 3);
    ctx.lineTo(dx + 5, dy - treeH / 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // ---- UNIFIED RAF LOOP ----
  useEffect(() => {
    let rafId: number;

    const drawFrame = () => {
      tickRef.current += 1;
      const tick = tickRef.current;

      const canvas = canvasRef.current;
      if (!canvas) { rafId = requestAnimationFrame(drawFrame); return; }

      const ctx = canvas.getContext('2d');
      if (!ctx) { rafId = requestAnimationFrame(drawFrame); return; }

      // Inertia scrolling (applied before draw)
      if (!isDragActiveRef.current) {
        const speed = Math.sqrt(velXRef.current * velXRef.current + velYRef.current * velYRef.current);
        if (speed > 0.2) {
          panXRef.current += velXRef.current;
          panYRef.current += velYRef.current;
          velXRef.current *= 0.88;
          velYRef.current *= 0.88;
          staticDirtyRef.current = true;

          inertiaSyncFrameRef.current += 1;
          if (inertiaSyncFrameRef.current % 4 === 0) {
            setPanX(panXRef.current);
            setPanY(panYRef.current);
          }
        }
      }

      const currentGrid = gridRef.current;
      const currentZoom = zoomRef.current;
      const currentPanX = panXRef.current;
      const currentPanY = panYRef.current;
      const currentLayer = layerRef.current;
      const currentSeason = seasonRef.current;
      const currentHovered = hoveredTileRef.current;
      const currentSelected = selectedTileRef.current;
      const currentBuilding = selectedBuildingRef.current;

      const parent = containerRef.current;
      // Option C: cap DPR at 2. On dpr 3 displays this fills 9× pixels vs 4×;
      // the visual gain above 2 is negligible on this stylised iso map but the
      // fill-rate cost is large, so clamp to protect FPS on high-density screens.
      const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

      if (parent) {
        const rect = parent.getBoundingClientRect();
        const displayWidth = Math.floor(rect.width);
        const displayHeight = Math.floor(rect.height || 480);

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;
          staticDirtyRef.current = true;
        }
      }

      const cw2 = canvas.width / dpr;
      const ch2 = canvas.height / dpr;

      // Invalidate shimmer gradient cache on canvas resize (same key as vignette: CSS px)
      const sizeKey = `${cw2}|${ch2}`;
      if (edgeVigKeyRef.current !== sizeKey) {
        shimmerGradRef.current = null; // force rebuild on next water tile
      }

      const sizeY = currentGrid.length;
      const sizeX = currentGrid[0]?.length || 0;

      // ---- REBUILD STATIC CANVAS if dirty ----
      if (staticDirtyRef.current) {
        staticDirtyRef.current = false;
        const sc = staticCanvasRef.current;
        sc.width = canvas.width;
        sc.height = canvas.height;
        const sctx = sc.getContext('2d');
        if (sctx) {
          sctx.save();
          sctx.scale(dpr, dpr);

          // ── Screen-space background (Option B): build cache once per size, then blit ──
          // The gradient + 1600-arc dot grid + vignette are screen-fixed and were
          // previously regenerated on every pan/zoom frame. Now they are rendered
          // into bgCanvasRef only when the canvas size (or dpr) changes.
          const bgKey = `${cw2}|${ch2}|${dpr}`;
          if (bgKeyRef.current !== bgKey) {
            bgKeyRef.current = bgKey;
            const bg = bgCanvasRef.current;
            bg.width = canvas.width;
            bg.height = canvas.height;
            const bgctx = bg.getContext('2d');
            if (bgctx) {
              bgctx.setTransform(1, 0, 0, 1, 0, 0);
              bgctx.scale(dpr, dpr);

              // Background gradient
              const bgGrad = bgctx.createRadialGradient(cw2 / 2, ch2 / 2, 100, cw2 / 2, ch2 / 2, cw2 * 0.95);
              bgGrad.addColorStop(0, '#F5EFE2');
              bgGrad.addColorStop(1, '#D8CFB9');
              bgctx.fillStyle = bgGrad;
              bgctx.fillRect(0, 0, cw2, ch2);

              // Dot-grid texture
              bgctx.fillStyle = 'rgba(62,42,18,0.06)';
              for (let gx = 0; gx < cw2; gx += 20) {
                for (let gy = 0; gy < ch2; gy += 20) {
                  bgctx.beginPath(); bgctx.arc(gx, gy, 0.75, 0, Math.PI * 2); bgctx.fill();
                }
              }

              // Soft vignette
              const vignette = bgctx.createRadialGradient(cw2 / 2, ch2 / 2, cw2 * 0.25, cw2 / 2, ch2 / 2, cw2 * 0.85);
              vignette.addColorStop(0, 'rgba(0,0,0,0)');
              vignette.addColorStop(1, 'rgba(44, 33, 17, 0.22)');
              bgctx.fillStyle = vignette;
              bgctx.fillRect(0, 0, cw2, ch2);
            }
          }
          // Blit cached background (cheap single drawImage instead of gradients + 1600 arcs)
          sctx.drawImage(bgCanvasRef.current, 0, 0, cw2, ch2);

          // Apply pan and zoom
          sctx.translate(currentPanX, currentPanY);
          sctx.scale(currentZoom, currentZoom);

          // Viewport culling bounds (in world-space, before zoom)
          const visL = (-currentPanX) / currentZoom - spacingX;
          const visR = (cw2 - currentPanX) / currentZoom + spacingX;
          const visT = (-currentPanY) / currentZoom - spacingY * 4;
          const visB = (ch2 - currentPanY) / currentZoom + spacingY * 2;

          // ---- Shadow batch pass (one save/restore for all tiles) ----
          sctx.save();
          sctx.shadowColor = 'rgba(29, 21, 10, 0.45)';
          sctx.shadowBlur = 12 * currentZoom;
          sctx.shadowOffsetY = 14 * currentZoom;
          sctx.fillStyle = 'rgba(44, 33, 17, 0.18)';
          for (let y = 0; y < sizeY; y++) {
            for (let x = 0; x < sizeX; x++) {
              const { cx: screenX, cy: screenY } = getHexCenter(x, y);

              // Elevation for shadow positioning
              const tile = currentGrid[y][x];
              const elevationHeight = (() => {
                let base = Math.sin(x * 0.38 + y * 0.25) * 5.0 + Math.cos(x * 0.25 - y * 0.3) * 4.0;
                if (tile.terrain === 'Water') return -9.5;
                else if (tile.terrain === 'Auwald') return base + 5.5;
                else if (tile.terrain === 'Siedlung') return base + 2.0;
                else if (tile.terrain === 'Acker') return base - 1.0;
                return base;
              })();
              const topY = screenY - elevationHeight;

              if (screenX < visL || screenX > visR || topY < visT || topY > visB) continue;

              const blockDepth = 24;
              sctx.beginPath();
              sctx.moveTo(screenX - w, topY + h/2 + blockDepth);
              sctx.lineTo(screenX, topY + h + blockDepth);
              sctx.lineTo(screenX + w, topY + h/2 + blockDepth);
              sctx.lineTo(screenX + w, topY - h/2 + blockDepth);
              sctx.lineTo(screenX, topY - h + blockDepth);
              sctx.lineTo(screenX - w, topY - h/2 + blockDepth);
              sctx.closePath();
              sctx.fill();
            }
          }
          sctx.restore();

          // ---- Main tile drawing pass (no shadows) ----
          for (let y = 0; y < sizeY; y++) {
            for (let x = 0; x < sizeX; x++) {
              const tile = currentGrid[y][x];
              const { cx: screenX, cy: screenY } = getHexCenter(x, y);

              const elevationHeight = (() => {
                let base = Math.sin(x * 0.38 + y * 0.25) * 5.0 + Math.cos(x * 0.25 - y * 0.3) * 4.0;
                if (tile.terrain === 'Water') return -9.5;
                else if (tile.terrain === 'Auwald') return base + 5.5;
                else if (tile.terrain === 'Siedlung') return base + 2.0;
                else if (tile.terrain === 'Acker') return base - 1.0;
                return base;
              })();
              const topY = screenY - elevationHeight;

              // Viewport culling
              if (screenX < visL || screenX > visR || topY < visT || topY > visB) continue;

              const blockDepth = 24;
              const baseBottomLeftY = screenY + h/2 + blockDepth;
              const baseBottomMidY = screenY + h + blockDepth;
              const baseBottomRightY = screenY + h/2 + blockDepth;

              // Left side face
              const leftGrad = sctx.createLinearGradient(screenX - w, topY + h/2, screenX, baseBottomMidY);
              const leftBaseColor = getSidesColor(tile.terrain, currentLayer, tile);
              leftGrad.addColorStop(0, leftBaseColor);
              leftGrad.addColorStop(0.12, leftBaseColor);
              leftGrad.addColorStop(0.13, '#322214');
              leftGrad.addColorStop(0.35, '#513d28');
              leftGrad.addColorStop(0.70, '#3e2e1e');
              leftGrad.addColorStop(1.00, 'rgba(25, 18, 11, 0.95)');

              sctx.fillStyle = leftGrad;
              sctx.beginPath();
              sctx.moveTo(screenX - w, topY + h/2);
              sctx.lineTo(screenX, topY + h);
              sctx.lineTo(screenX, baseBottomMidY);
              sctx.lineTo(screenX - w, baseBottomLeftY);
              sctx.closePath();
              sctx.fill();

              // Right side face
              const rightGrad = sctx.createLinearGradient(screenX, topY + h, screenX + w, baseBottomRightY);
              const rightBaseColor = getDarkSidesColor(tile.terrain, currentLayer, tile);
              rightGrad.addColorStop(0, rightBaseColor);
              rightGrad.addColorStop(0.12, rightBaseColor);
              rightGrad.addColorStop(0.13, '#21160c');
              rightGrad.addColorStop(0.35, '#3c2c1c');
              rightGrad.addColorStop(0.70, '#2b1f13');
              rightGrad.addColorStop(1.00, 'rgba(15, 10, 6, 0.98)');

              sctx.fillStyle = rightGrad;
              sctx.beginPath();
              sctx.moveTo(screenX, topY + h);
              sctx.lineTo(screenX + w, topY + h/2);
              sctx.lineTo(screenX + w, baseBottomRightY);
              sctx.lineTo(screenX, baseBottomMidY);
              sctx.closePath();
              sctx.fill();

              // Geological strata lines
              sctx.save();
              sctx.lineWidth = 1.0;

              sctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
              sctx.beginPath();
              sctx.moveTo(screenX - w, topY + h/2 + (baseBottomLeftY - (topY + h/2)) * 0.40);
              sctx.lineTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.40);
              sctx.moveTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.40);
              sctx.lineTo(screenX + w, topY + h/2 + (baseBottomRightY - (topY + h/2)) * 0.40);
              sctx.stroke();

              sctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
              sctx.beginPath();
              sctx.moveTo(screenX - w, topY + h/2 + (baseBottomLeftY - (topY + h/2)) * 0.43);
              sctx.lineTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.43);
              sctx.moveTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.43);
              sctx.lineTo(screenX + w, topY + h/2 + (baseBottomRightY - (topY + h/2)) * 0.43);
              sctx.stroke();

              sctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
              sctx.beginPath();
              sctx.moveTo(screenX - w, topY + h/2 + (baseBottomLeftY - (topY + h/2)) * 0.72);
              sctx.lineTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.72);
              sctx.moveTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.72);
              sctx.lineTo(screenX + w, topY + h/2 + (baseBottomRightY - (topY + h/2)) * 0.72);
              sctx.stroke();

              sctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
              sctx.beginPath();
              sctx.moveTo(screenX - w, topY + h/2 + (baseBottomLeftY - (topY + h/2)) * 0.75);
              sctx.lineTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.75);
              sctx.moveTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.75);
              sctx.lineTo(screenX + w, topY + h/2 + (baseBottomRightY - (topY + h/2)) * 0.75);
              sctx.stroke();

              sctx.restore();

              // Top face - use tick=0 for static canvas (water color is stable enough)
              sctx.fillStyle = getTileColor(tile.terrain, currentLayer, tile, false, 0);
              pathHexagon(sctx, screenX, topY);
              sctx.fill();

              // Faceted shading
              sctx.save();
              pathHexagon(sctx, screenX, topY);
              sctx.clip();

              sctx.fillStyle = 'rgba(255, 255, 255, 0.13)';
              sctx.beginPath();
              sctx.moveTo(screenX, topY);
              sctx.lineTo(screenX, topY - h);
              sctx.lineTo(screenX - w, topY - h/2);
              sctx.lineTo(screenX - w, topY + h/2);
              sctx.closePath();
              sctx.fill();

              sctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
              sctx.beginPath();
              sctx.moveTo(screenX, topY);
              sctx.lineTo(screenX, topY - h);
              sctx.lineTo(screenX + w, topY - h/2);
              sctx.lineTo(screenX + w, topY + h/2);
              sctx.closePath();
              sctx.fill();

              sctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
              sctx.beginPath();
              sctx.moveTo(screenX, topY);
              sctx.lineTo(screenX - w, topY + h/2);
              sctx.lineTo(screenX, topY + h);
              sctx.lineTo(screenX + w, topY + h/2);
              sctx.closePath();
              sctx.fill();

              sctx.restore();

              // Procedural terrain details on static layer
              if (currentLayer === 'normal') {
                drawProceduralTerrainDetails(sctx, tile, screenX, topY, w, h, 0);
              }

              // Groove border
              sctx.strokeStyle = 'rgba(100, 80, 55, 0.28)';
              sctx.lineWidth = 1.0;
              pathHexagon(sctx, screenX, topY);
              sctx.stroke();

              // Sector borders
              if (y === 4) {
                sctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
                sctx.lineWidth = 1.8;
                sctx.beginPath();
                sctx.moveTo(screenX - w, topY + h/2);
                sctx.lineTo(screenX, topY + h);
                sctx.lineTo(screenX + w, topY + h/2);
                sctx.stroke();
              }
              if (y === 10) {
                sctx.strokeStyle = 'rgba(59, 130, 246, 0.75)';
                sctx.lineWidth = 1.8;
                sctx.beginPath();
                sctx.moveTo(screenX - w, topY + h/2);
                sctx.lineTo(screenX, topY + h);
                sctx.lineTo(screenX + w, topY + h/2);
                sctx.stroke();
              }

              // Overlay layers (static: wrrl/ffh use tick=0)
              drawOverlayLayer(sctx, tile, screenX, topY, w, h, currentLayer, 0);

              // Buildings
              if (tile.buildingId) {
                drawIsometricBuilding(sctx, tile.buildingId, screenX, topY, w, h, 0);
              }

              // City labels
              if (tile.cityName) {
                sctx.save();
                const labelY = topY - 14;

                sctx.font = 'bold 9.5px "Inter", sans-serif';
                const textWidth = sctx.measureText(tile.cityName).width;
                const padX = 6;
                const rectW = textWidth + padX * 2;
                const rectH = 15;
                const rectX = screenX - rectW / 2;
                const rectY = labelY - rectH / 2;

                sctx.shadowBlur = 4;
                sctx.shadowColor = 'rgba(44, 51, 17, 0.25)';
                sctx.shadowOffsetY = 1.5;

                sctx.fillStyle = '#FAF6EE';
                sctx.strokeStyle = '#BC6C25';
                sctx.lineWidth = 1.5;

                sctx.beginPath();
                if (typeof sctx.roundRect === 'function') {
                  sctx.roundRect(rectX, rectY, rectW, rectH, 5);
                } else {
                  sctx.rect(rectX, rectY, rectW, rectH);
                }
                sctx.fill();
                sctx.stroke();

                sctx.shadowBlur = 0;
                sctx.shadowOffsetY = 0;
                sctx.fillStyle = '#3E2A12';
                sctx.textAlign = 'center';
                sctx.textBaseline = 'middle';
                sctx.fillText(tile.cityName, screenX, labelY + 0.5);
                sctx.restore();
              }
            }
          }

          sctx.restore();
        }
      }

      // ---- MAIN CANVAS FRAME ----
      ctx.save();
      ctx.scale(dpr, dpr);

      // Blit static layer
      ctx.drawImage(staticCanvasRef.current, 0, 0, cw2, ch2);

      // ---- ANIMATED LAYER (on top of static) ----
      ctx.translate(currentPanX, currentPanY);
      ctx.scale(currentZoom, currentZoom);

      // Viewport culling bounds for animated layer
      const visL = (-currentPanX) / currentZoom - spacingX;
      const visR = (cw2 - currentPanX) / currentZoom + spacingX;
      const visT = (-currentPanY) / currentZoom - spacingY * 4;
      const visB = (ch2 - currentPanY) / currentZoom + spacingY * 2;

      for (let y = 0; y < sizeY; y++) {
        for (let x = 0; x < sizeX; x++) {
          const tile = currentGrid[y][x];
          const { cx: screenX, cy: screenY } = getHexCenter(x, y);

          const elevationHeight = (() => {
            let base = Math.sin(x * 0.38 + y * 0.25) * 5.0 + Math.cos(x * 0.25 - y * 0.3) * 4.0;
            if (tile.terrain === 'Water') return -9.5;
            else if (tile.terrain === 'Auwald') return base + 5.5;
            else if (tile.terrain === 'Siedlung') return base + 2.0;
            else if (tile.terrain === 'Acker') return base - 1.0;
            return base;
          })();
          const topY = screenY - elevationHeight;

          // Viewport culling
          if (screenX < visL || screenX > visR || topY < visT || topY > visB) continue;

          const isHovered = currentHovered && currentHovered.x === x && currentHovered.y === y;
          const isSelected = currentSelected && currentSelected.x === x && currentSelected.y === y;

          // Water shimmer (animated layer) — cached gradient + translate
          if (tile.terrain === 'Water') {
            // Build the shimmer gradient once (coords: -15..+15 in local space).
            // A save/translate is cheaper than createLinearGradient per tile/frame.
            if (!shimmerGradRef.current) {
              const sg = ctx.createLinearGradient(-15, 0, 15, 0);
              sg.addColorStop(0,   'rgba(255,255,255,0)');
              sg.addColorStop(0.5, 'rgba(255,255,255,0.18)');
              sg.addColorStop(1,   'rgba(255,255,255,0)');
              shimmerGradRef.current = sg;
            }
            const shimmerX = Math.sin(tick * 0.04 + x * 0.5 + y * 0.3) * (w * 0.7);
            ctx.save();
            // Translate so the gradient's (0,0) sits at (screenX + shimmerX, topY).
            // Draw the hexagon offset by -shimmerX so it stays centred on the tile.
            ctx.translate(screenX + shimmerX, topY);
            ctx.fillStyle = shimmerGradRef.current;
            pathHexagon(ctx, -shimmerX, 0);
            ctx.fill();
            ctx.restore();
          }

          // Animated water bubbles
          if (tile.terrain === 'Water' && tick % 90 < 45 && currentLayer === 'normal') {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            const bubbleX = screenX + Math.sin(tick / 15 + x) * 10;
            const bubbleY = topY + Math.cos(tick / 20 + y) * 5;
            ctx.arc(bubbleX, bubbleY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Flood overlay needs tick for animation
          if (currentLayer === 'flood' && tile.flood_risk > 10) {
            drawOverlayLayer(ctx, tile, screenX, topY, w, h, currentLayer, tick);
          }

          // Building impact range tint overlay
          const isImpacted = !!(currentBuilding && currentHovered && !isHovered && !isSelected && (() => {
            const dist = getHexDistance(x, y, currentHovered.x, currentHovered.y);
            return dist > 0 && dist <= getBuildingRange(currentBuilding.id);
          })());

          if (isImpacted) {
            ctx.save();
            let rangeColorFill = 'rgba(90, 114, 71, 0.15)';
            const cat = currentBuilding!.category;
            if (cat === 'water') rangeColorFill = 'rgba(69, 123, 157, 0.18)';
            else if (cat === 'fauna') rangeColorFill = 'rgba(217, 119, 6, 0.15)';
            else if (cat === 'tourism') rangeColorFill = 'rgba(20, 184, 166, 0.15)';
            else if (cat === 'economy' || cat === 'infrastructure') rangeColorFill = 'rgba(100, 116, 139, 0.12)';

            ctx.fillStyle = rangeColorFill;
            pathHexagon(ctx, screenX, topY);
            ctx.fill();
            ctx.restore();
          }

          // Hover / Selection glow
          if (isSelected) {
            ctx.save();
            const pulse = 1 + Math.sin(tick / 15) * 0.15;
            ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
            ctx.shadowBlur = 14 * pulse;
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 3.2;
            pathHexagon(ctx, screenX, topY);
            ctx.stroke();

            ctx.shadowBlur = 6;
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
            ctx.lineWidth = 1.5;
            pathHexagon(ctx, screenX, topY);
            ctx.stroke();
            ctx.restore();
          } else if (isHovered) {
            ctx.save();
            ctx.shadowColor = 'rgba(90, 114, 71, 0.6)';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#5A7247';
            ctx.lineWidth = 2.5;
            pathHexagon(ctx, screenX, topY);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(142, 172, 120, 0.8)';
            ctx.lineWidth = 1.0;
            pathHexagon(ctx, screenX, topY);
            ctx.stroke();
            ctx.restore();
          } else if (isImpacted) {
            ctx.save();
            let strokeColor = '#5A7247';
            const cat = currentBuilding!.category;
            if (cat === 'water') strokeColor = '#457B9D';
            else if (cat === 'fauna') strokeColor = '#D97706';
            else if (cat === 'tourism') strokeColor = '#14B8A6';
            else if (cat === 'economy' || cat === 'infrastructure') strokeColor = '#64748B';

            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 4;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([5, 3]);
            ctx.lineDashOffset = -tick * 0.25;
            pathHexagon(ctx, screenX, topY);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Weather overlay (animated)
      if (currentLayer === 'normal') {
        drawWeatherOverlay(ctx, currentSeason, tick);
      }

      // ---- Edge vignette (diorama on table feeling) ----
      ctx.restore(); // pop the zoom/pan transform

      ctx.save();
      ctx.scale(dpr, dpr);
      // Cache: only recreate gradient when canvas dimensions change
      const vigKey = `${cw2}|${ch2}`;
      if (edgeVigKeyRef.current !== vigKey || !edgeVigRef.current) {
        edgeVigKeyRef.current = vigKey;
        const g = ctx.createRadialGradient(
          cw2 / 2, ch2 / 2, Math.min(cw2, ch2) * 0.3,
          cw2 / 2, ch2 / 2, Math.max(cw2, ch2) * 0.75
        );
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(26,21,16,0.45)');
        edgeVigRef.current = g;
      }
      ctx.fillStyle = edgeVigRef.current;
      ctx.fillRect(0, 0, cw2, ch2);
      ctx.restore();

      rafId = requestAnimationFrame(drawFrame);
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reverse hex math mapping on Mouse Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mouseHasMoved) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rx = (mouseX - panXRef.current) / zoomRef.current;
    const ry = (mouseY - panYRef.current) / zoomRef.current;

    const hovered = getTileFromCoords(rx, ry);
    if (hovered) {
      onTileClick(hovered.x, hovered.y);
    }
  };

  // Drag and drop / panning controls for Desktop Mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
    setMouseHasMoved(false);
    setIsDragging(true);
    isDragActiveRef.current = true;
    velXRef.current = 0;
    velYRef.current = 0;
    lastMouseTimeRef.current = performance.now();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rx = (mouseX - panXRef.current) / zoomRef.current;
    const ry = (mouseY - panYRef.current) / zoomRef.current;

    const hovered = getTileFromCoords(rx, ry);
    if (hovered) {
      setHoveredTile(hovered);
      hoveredTileRef.current = hovered;
    } else {
      setHoveredTile(null);
      hoveredTileRef.current = null;
    }

    if (isDragActiveRef.current) {
      const dxDrag = e.clientX - dragStart.current.x;
      const dyDrag = e.clientY - dragStart.current.y;

      const dist = Math.sqrt(dxDrag * dxDrag + dyDrag * dyDrag);
      if (dist > 5) {
        setMouseHasMoved(true);
      }

      // EMA velocity tracking
      velXRef.current = velXRef.current * 0.5 + dxDrag * 0.5;
      velYRef.current = velYRef.current * 0.5 + dyDrag * 0.5;

      panXRef.current += dxDrag;
      panYRef.current += dyDrag;
      setPanX(panXRef.current);
      setPanY(panYRef.current);
      staticDirtyRef.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    isDragActiveRef.current = false;
  };

  // Touch Interactions (Tablets/Phones)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      touchLastPos.current = { x: touch.clientX, y: touch.clientY };
      touchHasMoved.current = false;
      setIsDragging(true);
      isDragActiveRef.current = true;
      velXRef.current = 0;
      velYRef.current = 0;
      setTouchPinchDist(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      isDragActiveRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
      setTouchPinchDist(dist);
      touchStartZoomRef.current = zoomRef.current;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    if (e.touches.length === 1 && isDragActiveRef.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchLastPos.current.x;
      const dy = touch.clientY - touchLastPos.current.y;

      const totalDist = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.current.x, 2) +
        Math.pow(touch.clientY - touchStartPos.current.y, 2)
      );

      if (totalDist > 8) {
        touchHasMoved.current = true;
      }

      // EMA velocity tracking
      velXRef.current = velXRef.current * 0.5 + dx * 0.5;
      velYRef.current = velYRef.current * 0.5 + dy * 0.5;

      panXRef.current += dx;
      panYRef.current += dy;
      setPanX(panXRef.current);
      setPanY(panYRef.current);
      staticDirtyRef.current = true;
      touchLastPos.current = { x: touch.clientX, y: touch.clientY };

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;

        const rx = (mouseX - panXRef.current) / zoomRef.current;
        const ry = (mouseY - panYRef.current) / zoomRef.current;

        const hovered = getTileFromCoords(rx, ry);
        if (hovered) {
          setHoveredTile(hovered);
          hoveredTileRef.current = hovered;
        } else {
          setHoveredTile(null);
          hoveredTileRef.current = null;
        }
      }
    } else if (e.touches.length === 2 && touchPinchDist !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));

      const factor = dist / touchPinchDist;
      const newZoom = Math.max(0.4, Math.min(1.8, touchStartZoomRef.current * factor));
      setZoom(newZoom);
      zoomRef.current = newZoom;
      staticDirtyRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    isDragActiveRef.current = false;
    setTouchPinchDist(null);

    if (!touchHasMoved.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;

      const rx = (mouseX - panXRef.current) / zoomRef.current;
      const ry = (mouseY - panYRef.current) / zoomRef.current;

      const hovered = getTileFromCoords(rx, ry);
      if (hovered) {
        onTileClick(hovered.x, hovered.y);
      }
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(1.8, zoomRef.current + 0.15);
    setZoom(newZoom);
    zoomRef.current = newZoom;
    staticDirtyRef.current = true;
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.4, zoomRef.current - 0.15);
    setZoom(newZoom);
    zoomRef.current = newZoom;
    staticDirtyRef.current = true;
  };

  return (
    <div className="rounded-xl overflow-hidden relative flex flex-col h-full min-h-[480px]" style={{ background: '#1a1510', border: '1px solid rgba(140,110,60,0.3)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>

      {/* Top Map bar */}
      <div className="absolute top-4 left-4 right-4 z-15 flex flex-wrap gap-2 justify-between pointer-events-none">

        {/* Active Tooltip / Coordinate Status readout */}
        <div className="flex gap-2 bg-white/95 border border-[#D4CCBA] p-2 rounded-lg shadow-sm pointer-events-auto items-center shrink-0 max-w-[calc(100vw-32px)]">
          <Eye className="w-4 h-4 text-[#5A7247]" />
          <div className="font-mono text-[11px] text-[#2C3322]">
            {hoveredTile ? (
              <span>
                Feld: <strong className="text-[#5A7247]">({hoveredTile.x}, {hoveredTile.y})</strong> -{' '}
                {hoveredTile.y < 5 ? 'Eifel Oberlauf' : hoveredTile.y < 11 ? 'Düren Mitte' : 'Jülicher Tiefland'}
              </span>
            ) : (
              <span className="text-[#8B8273]">Karte berühren / bewegen...</span>
            )}
          </div>
        </div>

        {/* Dynamic Map Layers Selector */}
        <div className="flex flex-wrap bg-white/95 border border-[#D4CCBA] p-1 sm:p-1.5 rounded-lg shadow-sm pointer-events-auto items-center gap-1">
          <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#8B8273] px-1 border-r border-[#D4CCBA] hidden xs:inline">
            Ebene:
          </span>
          {(['normal', 'wrrl', 'ffh', 'flood'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => onLayerChange(layer)}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] rounded font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedLayer === layer
                  ? 'bg-[#5A7247] text-white font-bold'
                  : 'text-[#6B6356] hover:text-[#2C3322] hover:bg-[#E8E2D6]'
              }`}
            >
              <span className="inline sm:hidden">
                {layer === 'normal' ? '🗺️ Satellit' :
                 layer === 'wrrl' ? '💧 WRRL' :
                 layer === 'ffh' ? '🌿 FFH' : '🌊 Schutz'}
              </span>
              <span className="hidden sm:inline">
                {layer === 'normal' ? '🗺️ Satellit' :
                 layer === 'wrrl' ? '💧 WRRL Wasser' :
                 layer === 'ffh' ? '🌿 FFH-Flora' : '🌊 HWRM Hochwasser'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating visual notice if constructing elements */}
      {selectedBuilding && (
        <div className="absolute top-16 left-4 right-4 sm:right-auto z-20 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2" style={{ background: 'rgba(20,15,8,0.88)', color: '#C8D870', border: '1px solid rgba(140,180,80,0.4)', backdropFilter: 'blur(6px)' }}>
          <span>
            Baumodus: &apos;{selectedBuilding.name}&apos; auf passendem Terrain platzieren.
          </span>
        </div>
      )}

      {/* Sidebar Navigation buttons */}
      <div className="absolute bottom-4 right-4 z-15 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="p-3 sm:p-2 rounded-lg cursor-pointer touch-manipulation active:scale-95 transition-transform" style={{ background: 'rgba(20,15,8,0.85)', border: '1px solid rgba(180,140,80,0.35)', color: '#C8A84A', backdropFilter: 'blur(6px)' }}
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-3 sm:p-2 rounded-lg cursor-pointer touch-manipulation active:scale-95 transition-transform" style={{ background: 'rgba(20,15,8,0.85)', border: '1px solid rgba(180,140,80,0.35)', color: '#C8A84A', backdropFilter: 'blur(6px)' }}
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={handleCenterMap}
          className="p-3 sm:p-2 rounded-lg cursor-pointer touch-manipulation active:scale-95 transition-transform" style={{ background: 'rgba(20,15,8,0.85)', border: '1px solid rgba(180,140,80,0.35)', color: '#C8A84A', backdropFilter: 'blur(6px)' }}
          title="Karte zentrieren"
        >
          <Locate className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Guide label */}
      <div className="absolute bottom-4 left-4 z-15 p-2 rounded-lg text-[9.5px] font-mono max-w-[calc(100vw-110px)] hidden xs:block" style={{ background: 'rgba(20,15,8,0.82)', border: '1px solid rgba(180,140,80,0.28)', color: 'rgba(180,150,90,0.7)', backdropFilter: 'blur(6px)' }}>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          <span>â€¢ Pinch / Button: Zoom</span>
          <span>â€¢ Wischen: Bewegen</span>
          <span>â€¢ Tap: Platzieren</span>
        </div>
      </div>

      {/* Canvas Viewport container */}
      <div ref={containerRef} className="flex-grow w-full h-full cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="block w-full h-full"
        />
      </div>
    </div>
  );
};
