import React, { useRef, useEffect, useState } from 'react';
import { TileData, BuildingType, TerrainType } from '../types';
import { BUILDIONS_CATALOG } from '../gameData';
import { ZoomIn, ZoomOut, Layers, HelpCircle, Eye, Locate, Map, Droplets, Leaf, Waves } from 'lucide-react';

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

  // Viewport states
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

  // Animation ticks
  const [tick, setTick] = useState<number>(0);

  // Hexagonal dimensions
  const r = 52;
  const w = r * Math.sqrt(3) / 2; // ~45
  const h = r * 0.58;             // ~30
  const spacingX = r * Math.sqrt(3); // ~90
  const spacingY = 1.5 * h;        // ~45

  // Helper to map index (x, y) to hexagonal canvas coordinates
  const getHexCenter = (x: number, y: number) => {
    // Offset layout (odd-r): odd rows shifted by half of the horizontal spacing
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

    const sizeY = grid.length;
    const sizeX = grid[0]?.length || 0;

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

  // Track animation trigger for water effects
  useEffect(() => {
    let animId: number;
    const runTick = () => {
      setTick(prev => prev + 1);
      animId = requestAnimationFrame(runTick);
    };
    runTick();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Set initial responsive zoom & pan when canvas/grid size is known
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isMobile = rect.width < 768;
      const initialZoom = isMobile ? 0.6 : 0.75;
      setZoom(initialZoom);
      setPanX(rect.width / 2 - 675 * initialZoom);
      setPanY(rect.height / 2 - 337 * initialZoom);
    }
  }, [grid]);

  // Center Map utility
  const handleCenterMap = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isMobile = rect.width < 768;
      const initialZoom = isMobile ? 0.6 : 0.75;
      setZoom(initialZoom);
      setPanX(rect.width / 2 - 675 * initialZoom);
      setPanY(rect.height / 2 - 337 * initialZoom);
    }
  };

  // Prevent map being lost offscreen on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // If current panning is completely out of screen bounds, re-center
        setPanX(prev => {
          if (prev < -rect.width || prev > rect.width * 2) {
            return rect.width / 2;
          }
          return prev;
        });
        setPanY(prev => {
          if (prev < -rect.height || prev > rect.height * 2) {
            return rect.height / 5;
          }
          return prev;
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw hook
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = containerRef.current;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    
    if (parent) {
      const rect = parent.getBoundingClientRect();
      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height || 480);
      
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
      }
    }

    // Clear screen
    ctx.save();
    ctx.scale(dpr, dpr);

    const cw2 = canvas.width / dpr;
    const ch2 = canvas.height / dpr;

    // Warm linen background — Terra Nil parchment feel
    const bgGrad = ctx.createRadialGradient(cw2 / 2, ch2 / 2, 100, cw2 / 2, ch2 / 2, cw2 * 0.95);
    bgGrad.addColorStop(0, '#F5EFE2'); // beautiful premium linen cream center spotlight
    bgGrad.addColorStop(1, '#D8CFB9'); // warm artisan parchment edges
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Subtle dot-grid texture (Dorfromantik board feel)
    ctx.fillStyle = 'rgba(62,42,18,0.06)';
    for (let gx = 0; gx < cw2; gx += 20) {
      for (let gy = 0; gy < ch2; gy += 20) {
        ctx.beginPath(); ctx.arc(gx, gy, 0.75, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Soft vignette
    const vignette = ctx.createRadialGradient(cw2 / 2, ch2 / 2, cw2 * 0.25, cw2 / 2, ch2 / 2, cw2 * 0.85);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(44, 33, 17, 0.22)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cw2, ch2);

    // Apply pan and zoom
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    const sizeY = grid.length;
    const sizeX = grid[0]?.length || 0;

    // Draw tiles under hexagonal projection
    // Loop by row-first (y) then col (x) for perfect back-to-front depth sorting in isometric hex
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const tile = grid[y][x];
        const { cx: screenX, cy: screenY } = getHexCenter(x, y);

        // Is hovering target
        const isHovered = hoveredTile && hoveredTile.x === x && hoveredTile.y === y;
        const isSelected = selectedTile && selectedTile.x === x && selectedTile.y === y;

        // Calculate dynamic height elevation to build rolling hills and river basins
        const elevationHeight = (() => {
          // Standard rolling landscape wave
          let base = Math.sin(x * 0.38 + y * 0.25) * 5.0 + Math.cos(x * 0.25 - y * 0.3) * 4.0;
          if (tile.terrain === 'Water') {
            return -9.5; // Deep sunken river canyon/valley
          } else if (tile.terrain === 'Auwald') {
            return base + 5.5; // Taller forest plateaus
          } else if (tile.terrain === 'Siedlung') {
            return base + 2.0; // Slightly higher town foundation
          } else if (tile.terrain === 'Acker') {
            return base - 1.0; // Slightly lower agricultural plots
          }
          return base; // Default grassy meadows
        })();

        const topY = screenY - elevationHeight;

        // Draw 3D side blocks — thick slab like Dorfromantik
        const blockDepth = 24; // Thick premium physical cardboard depth

        // 1. Cozy physical tabletop slab drop shadow (cast on the background wooden board)
        ctx.save();
        ctx.shadowColor = 'rgba(29, 21, 10, 0.45)'; // deep rich warm earthy shadow
        ctx.shadowBlur = 12 * zoom;
        ctx.shadowOffsetY = 14 * zoom;
        ctx.fillStyle = 'rgba(44, 33, 17, 0.18)';
        ctx.beginPath();
        ctx.moveTo(screenX - w, topY + h/2 + blockDepth);
        ctx.lineTo(screenX, topY + h + blockDepth);
        ctx.lineTo(screenX + w, topY + h/2 + blockDepth);
        ctx.lineTo(screenX + w, topY - h/2 + blockDepth);
        ctx.lineTo(screenX, topY - h + blockDepth);
        ctx.lineTo(screenX - w, topY - h/2 + blockDepth);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const baseBottomLeftY = screenY + h/2 + blockDepth;
        const baseBottomMidY = screenY + h + blockDepth;
        const baseBottomRightY = screenY + h/2 + blockDepth;

        // Bottom-left slanted block side - Painted with gorgeous layered earth strata
        const leftGrad = ctx.createLinearGradient(screenX - w, topY + h/2, screenX, baseBottomMidY);
        const leftBaseColor = getSidesColor(tile.terrain, selectedLayer, tile);
        leftGrad.addColorStop(0, leftBaseColor);
        leftGrad.addColorStop(0.12, leftBaseColor); // Cap matching the top face color
        leftGrad.addColorStop(0.13, '#322214'); // Crisp geological boundary line (rock/soil interface)
        leftGrad.addColorStop(0.35, '#513d28'); // Rich textured clay/loam middle section
        leftGrad.addColorStop(0.70, '#3e2e1e'); // Deeper, denser rock/sandstone strata
        leftGrad.addColorStop(1.00, 'rgba(25, 18, 11, 0.95)'); // Extremely heavy ambient occlusion at block base
        
        ctx.fillStyle = leftGrad;
        ctx.beginPath();
        ctx.moveTo(screenX - w, topY + h/2);
        ctx.lineTo(screenX, topY + h);
        ctx.lineTo(screenX, baseBottomMidY);
        ctx.lineTo(screenX - w, baseBottomLeftY);
        ctx.closePath();
        ctx.fill();

        // Bottom-right slanted block side - Darker shaded side face
        const rightGrad = ctx.createLinearGradient(screenX, topY + h, screenX + w, baseBottomRightY);
        const rightBaseColor = getDarkSidesColor(tile.terrain, selectedLayer, tile);
        rightGrad.addColorStop(0, rightBaseColor);
        rightGrad.addColorStop(0.12, rightBaseColor); // Cap matching top surface
        rightGrad.addColorStop(0.13, '#21160c'); // geological interface
        rightGrad.addColorStop(0.35, '#3c2c1c'); // Mid clay section
        rightGrad.addColorStop(0.70, '#2b1f13'); // Deep stone layer
        rightGrad.addColorStop(1.00, 'rgba(15, 10, 6, 0.98)'); // Extreme shadow boundary
        
        ctx.fillStyle = rightGrad;
        ctx.beginPath();
        ctx.moveTo(screenX, topY + h);
        ctx.lineTo(screenX + w, topY + h/2);
        ctx.lineTo(screenX + w, baseBottomRightY);
        ctx.lineTo(screenX, baseBottomMidY);
        ctx.closePath();
        ctx.fill();

        // 3D sediment geological strata textures (Subtle horizontal layered stripes)
        ctx.save();
        ctx.lineWidth = 1.0;
        
        // Strata line 1: Light sandstone layer cut
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(screenX - w, topY + h/2 + (baseBottomLeftY - (topY + h/2)) * 0.40);
        ctx.lineTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.40);
        ctx.moveTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.40);
        ctx.lineTo(screenX + w, topY + h/2 + (baseBottomRightY - (topY + h/2)) * 0.40);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.moveTo(screenX - w, topY + h/2 + (baseBottomLeftY - (topY + h/2)) * 0.43);
        ctx.lineTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.43);
        ctx.moveTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.43);
        ctx.lineTo(screenX + w, topY + h/2 + (baseBottomRightY - (topY + h/2)) * 0.43);
        ctx.stroke();

        // Strata line 2: Lower dense dark coal/gravel boundary
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.beginPath();
        ctx.moveTo(screenX - w, topY + h/2 + (baseBottomLeftY - (topY + h/2)) * 0.72);
        ctx.lineTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.72);
        ctx.moveTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.72);
        ctx.lineTo(screenX + w, topY + h/2 + (baseBottomRightY - (topY + h/2)) * 0.72);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.moveTo(screenX - w, topY + h/2 + (baseBottomLeftY - (topY + h/2)) * 0.75);
        ctx.lineTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.75);
        ctx.moveTo(screenX, topY + h + (baseBottomMidY - (topY + h)) * 0.75);
        ctx.lineTo(screenX + w, topY + h/2 + (baseBottomRightY - (topY + h/2)) * 0.75);
        ctx.stroke();
        
        ctx.restore();

        // Top face drawing
        ctx.fillStyle = getTileColor(tile.terrain, selectedLayer, tile, isHovered, tick);
        pathHexagon(ctx, screenX, topY);
        ctx.fill();

        // Inner top-left highlight and low-poly 3D faceted shading facets
        if (selectedLayer === 'normal' || selectedLayer !== 'normal') {
          ctx.save();
          pathHexagon(ctx, screenX, topY);
          ctx.clip();

          // Facet 1 (Lit Top-Left): Center -> Top -> Mid-Left -> Bottom-Left
          ctx.fillStyle = 'rgba(255, 255, 255, 0.13)';
          ctx.beginPath();
          ctx.moveTo(screenX, topY);
          ctx.lineTo(screenX, topY - h);
          ctx.lineTo(screenX - w, topY - h/2);
          ctx.lineTo(screenX - w, topY + h/2);
          ctx.closePath();
          ctx.fill();

          // Facet 2 (Glancing Top-Right): Center -> Top -> Mid-Right -> Bottom-Right
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.beginPath();
          ctx.moveTo(screenX, topY);
          ctx.lineTo(screenX, topY - h);
          ctx.lineTo(screenX + w, topY - h/2);
          ctx.lineTo(screenX + w, topY + h/2);
          ctx.closePath();
          ctx.fill();

          // Facet 3 (Shadowed Bottom): Center -> Bottom-Left -> Bottom -> Bottom-Right
          ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
          ctx.beginPath();
          ctx.moveTo(screenX, topY);
          ctx.lineTo(screenX - w, topY + h/2);
          ctx.lineTo(screenX, topY + h);
          ctx.lineTo(screenX + w, topY + h/2);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }

        // High fidelity procedural detailing overlay
        if (selectedLayer === 'normal') {
          drawProceduralTerrainDetails(ctx, tile, screenX, topY, w, h, tick);
        }

        // Check if within building impact range when in build mode
        const isImpacted = !!(selectedBuilding && hoveredTile && !isHovered && !isSelected && (() => {
          const dist = getHexDistance(x, y, hoveredTile.x, hoveredTile.y);
          return dist > 0 && dist <= getBuildingRange(selectedBuilding.id);
        })());

        // Render impact range soft color tint overlay
        if (isImpacted) {
          ctx.save();
          let rangeColorFill = 'rgba(90, 114, 71, 0.15)'; // default ecology / soft green
          const cat = selectedBuilding!.category;
          if (cat === 'water') rangeColorFill = 'rgba(69, 123, 157, 0.18)';
          else if (cat === 'fauna') rangeColorFill = 'rgba(217, 119, 6, 0.15)';
          else if (cat === 'tourism') rangeColorFill = 'rgba(20, 184, 166, 0.15)';
          else if (cat === 'economy' || cat === 'infrastructure') rangeColorFill = 'rgba(100, 116, 139, 0.12)';

          ctx.fillStyle = rangeColorFill;
          pathHexagon(ctx, screenX, topY);
          ctx.fill();
          ctx.restore();
        }

        // --- SUBTLE BORDER GLOW ---
        if (isSelected) {
          ctx.save();
          const pulse = 1 + Math.sin(tick / 15) * 0.15;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.7)'; // Warm Amber glow
          ctx.shadowBlur = 14 * pulse;
          ctx.strokeStyle = '#F59E0B'; // Amber orange
          ctx.lineWidth = 3.2;
          pathHexagon(ctx, screenX, topY);
          ctx.stroke();

          // Second pass: soft bright cyan-gold halo
          ctx.shadowBlur = 6;
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
          ctx.lineWidth = 1.5;
          pathHexagon(ctx, screenX, topY);
          ctx.stroke();
          ctx.restore();
        } else if (isHovered) {
          ctx.save();
          ctx.shadowColor = 'rgba(90, 114, 71, 0.6)'; // Soft forest green glow
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#5A7247'; // Forest green highlight border
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
          let strokeColor = '#5A7247'; // default ecology
          const cat = selectedBuilding!.category;
          if (cat === 'water') strokeColor = '#457B9D';
          else if (cat === 'fauna') strokeColor = '#D97706';
          else if (cat === 'tourism') strokeColor = '#14B8A6';
          else if (cat === 'economy' || cat === 'infrastructure') strokeColor = '#64748B';

          // A gorgeous dotted/dashed ring that slowly crawls/animates
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = 4;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.8;
          ctx.setLineDash([5, 3]);
          ctx.lineDashOffset = -tick * 0.25;
          pathHexagon(ctx, screenX, topY);
          ctx.stroke();
          ctx.restore();
        } else {
          // Crisp groove border — Dorfromantik tile separation
          ctx.strokeStyle = 'rgba(100, 80, 55, 0.28)';
          ctx.lineWidth = 1.0;
          pathHexagon(ctx, screenX, topY);
          ctx.stroke();
        }

        // Sector borders indicator (drawn along bottom contour of row 4 and 10 to form custom boundary fence)
        if (y === 4) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'; // Red partition sector line (Heimbach / Düren border)
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(screenX - w, topY + h/2);
          ctx.lineTo(screenX, topY + h);
          ctx.lineTo(screenX + w, topY + h/2);
          ctx.stroke();
        }
        if (y === 10) {
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.75)'; // Blue partition sector line (Düren / Jülich)
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(screenX - w, topY + h/2);
          ctx.lineTo(screenX, topY + h);
          ctx.lineTo(screenX + w, topY + h/2);
          ctx.stroke();
        }

        // Draw Layer Specific overlays
        drawOverlayLayer(ctx, tile, screenX, topY, w, h, selectedLayer, tick);

        // Draw Buildings
        if (tile.buildingId) {
          drawIsometricBuilding(ctx, tile.buildingId, screenX, topY, w, h, tick);
        }

        // Draw Town/City Labels if defined
        if (tile.cityName) {
          ctx.save();
          // Position the label floating slightly above the top edge of the pointy hexagon
          const labelY = topY - 14;
          
          ctx.font = 'bold 9.5px "Inter", sans-serif';
          const textWidth = ctx.measureText(tile.cityName).width;
          const padX = 6;
          const padY = 3.5;
          const rectW = textWidth + padX * 2;
          const rectH = 15;
          const rectX = screenX - rectW / 2;
          const rectY = labelY - rectH / 2;

          // Draw a small rounded capsule
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(44, 51, 17, 0.25)';
          ctx.shadowOffsetY = 1.5;

          // Soft cream-colored board in game CD
          ctx.fillStyle = '#FAF6EE';
          ctx.strokeStyle = '#BC6C25';
          ctx.lineWidth = 1.5;
          
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(rectX, rectY, rectW, rectH, 5);
          } else {
            ctx.rect(rectX, rectY, rectW, rectH);
          }
          ctx.fill();
          ctx.stroke();

          // Dark contrasting text
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = '#3E2A12';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tile.cityName, screenX, labelY + 0.5);
          ctx.restore();
        }

        // Animated particles (river bubbles, bird loops)
        if (tile.terrain === 'Water' && tick % 90 < 45 && selectedLayer === 'normal') {
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          const bubbleX = screenX + Math.sin(tick / 15 + x) * 10;
          const bubbleY = topY + Math.cos(tick / 20 + y) * 5;
          ctx.arc(bubbleX, bubbleY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ------------------ WEATHER OVERLAY LAYER ------------------
    if (selectedLayer === 'normal') {
      drawWeatherOverlay(ctx, season, tick);
    }

    ctx.restore();
  }, [grid, zoom, panX, panY, hoveredTile, selectedLayer, tick, season, selectedTile, selectedBuilding]);

  // Colors based on terrain
  const getTileColor = (t: TerrainType, layer: 'normal' | 'wrrl' | 'ffh' | 'flood', tile: TileData, isHovered: boolean | null, tickNum: number): string => {
    if (layer !== 'normal') {
      return '#E8E2D6'; // Light sand base tile color for data layer contrast
    }

    const hash = (tile.x * 7 + tile.y * 11) % 3 - 1; // -1, 0, or 1
    const offsetPercent = hash * 4.2; // organic color variation percents

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
        // Terra Nil crystal-clear river blue
        const wave = Math.abs(Math.sin(tickNum / 35 + (tile.x + tile.y) * 0.2));
        const baseBlue = wave > 0.5 ? '#3A9CC8' : '#2E86B0';
        return adjustColor(baseBlue, offsetPercent);
      }
      case 'Wiese':
        color = '#8FB86A'; // Terra Nil lush meadow green
        break;
      case 'Auwald':
        color = '#5A7247'; // Warm forest green
        break;
      case 'Acker':
        color = '#BC6C25'; // Natural soil brown
        break;
      case 'Gewerbe':
        color = '#8B8273'; // Soft warm gray
        break;
      case 'Siedlung':
        color = '#C48B71'; // Gentle clay/terracotta tile
        break;
    }

    return adjustColor(color, offsetPercent);
  };

  const getSidesColor = (t: TerrainType, layer: 'normal' | 'wrrl' | 'ffh' | 'flood', tile: TileData): string => {
    if (layer !== 'normal') return '#D4CCBA';

    const hash = (tile.x * 7 + tile.y * 11) % 3 - 1; // -1, 0, or 1
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

    const hash = (tile.x * 7 + tile.y * 11) % 3 - 1; // -1, 0, or 1
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
    const th = 2 * hVal;

    if (layer === 'wrrl' && tile.terrain === 'Water') {
      // Shading based on 1 to 5 values
      let wrrlColor = 'rgba(188, 108, 37, 0.7)'; // Bad (5) - warm orange-brown warning
      if (tile.wrrl_quality <= 1.5) wrrlColor = 'rgba(90, 114, 71, 0.8)'; // Excellent (1) - forest green
      else if (tile.wrrl_quality <= 2.5) wrrlColor = 'rgba(69, 123, 157, 0.85)'; // Good (2) - soft ocean blue
      else if (tile.wrrl_quality <= 3.5) wrrlColor = 'rgba(212, 163, 115, 0.75)'; // Moderate (3)
      else if (tile.wrrl_quality <= 4.5) wrrlColor = 'rgba(188, 108, 37, 0.5)'; // Poor (4)

      ctx.fillStyle = wrrlColor;
      pathHexagon(ctx, sx, sy);
      ctx.fill();

      // Show small numeric text rating
      ctx.fillStyle = '#2C3322';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`WRRL:${tile.wrrl_quality.toFixed(1)}`, sx - 18, sy + hth + 3);
    }

    if (layer === 'ffh') {
      // Highlight protected boundaries or potential values
      if (tile.protected || tile.ffh_value > 20) {
        ctx.fillStyle = `rgba(90, 114, 71, ${0.1 + (tile.ffh_value / 250)})`;
        pathHexagon(ctx, sx, sy);
        ctx.fill();

        // Shimmering green/brown active reserve borders
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
        
        // 1. Create hexagon clipping area
        pathHexagon(ctx, sx, sy);
        ctx.clip();

        // 2. Rising water level animation (subtle sinus wave height pulsation)
        const riseAmplitude = 3.0; // max px rise
        const riseSpeed = 0.04;
        const riseOffset = Math.sin(tickNum * riseSpeed + (tile.x + tile.y) * 0.7) * riseAmplitude - 1.5;

        // Base flood overlay hue with dynamic opacity corresponding to risk level
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

        // 3. Shifting Wave Textures / Ripple fronts moving diagonally
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + (tile.flood_risk / 250)})`;
        ctx.lineWidth = 1.3;

        const waveSpeed = 0.5;
        // Draw 2 moving wave fronts
        for (let w = 0; w < 2; w++) {
          const tOffset = ((tickNum * waveSpeed + tile.x * 30 + tile.y * 50 + w * 50) % 100) / 100;
          const percent = -0.5 + tOffset * 2.0; // Map range across top-to-bottom

          const cy = sy + percent * hth + riseOffset;
          const cx = sx;

          ctx.beginPath();
          ctx.moveTo(cx - htw, cy - hth * 0.5);
          // quadratic curve creating wave shape
          ctx.quadraticCurveTo(
            cx + Math.sin(tickNum * 0.07 + w) * 12,
            cy + Math.cos(tickNum * 0.05 + w) * 4,
            cx + htw,
            cy + hth * 0.5
          );
          ctx.stroke();
        }

        ctx.restore();

        // Draw standard borders for tile outline
        ctx.strokeStyle = 'rgba(45, 110, 155, 0.8)';
        ctx.lineWidth = 1.2;
        pathHexagon(ctx, sx, sy);
        ctx.stroke();

        // High contrast risk text tag label
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
      // 1. Light Snowfall: floating white flakes drifting down and slightly to the side
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
      // 2. Falling Leaves: rust/orange/golden leaf vectors drifting and swaying
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
      // 3. Summer Heat Shimmer
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
      // 4. Spring Pollen & Blossoms
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

    // 5. Ambient Floating Low-Poly Diorama Clouds (Always active in normal layer context, adding high-altitude shadows and depth)
    const cloudCount = 4;
    ctx.save();
    for (let i = 0; i < cloudCount; i++) {
      const speed = 0.18 + (i % 2) * 0.08;
      const startX = (i * 450 + tickNum * speed) % 1900 - 350;
      const startY = -140 + (i * 125) % 360;

      // Soft cloud shadow cast onto the diorama table below
      ctx.fillStyle = 'rgba(44, 33, 17, 0.038)';
      ctx.beginPath();
      ctx.ellipse(startX + 30, startY + 180, 65, 20, 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Cloud body - puffy stylized low-poly design with soft light rim highlight
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
    // Determine drawing colors with heavy contrasts
    ctx.save();
    ctx.translate(sx, sy); // Place at the exact center of the hexagon face

    if (bid === 'altarm') {
      // Draw oxbow channel loop
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
      // Draw group of trees
      ctx.fillStyle = '#064e3b';
      // 3 triangles as three small fir trees
      drawTree(ctx, -12, -4, 18);
      drawTree(ctx, 10, -8, 15);
      drawTree(ctx, 0, 12, 19);
    } 
    else if (bid === 'totholz') {
      // Draw schematic brown tree branch
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
      // Step ladders drawn as small segments
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-15, -5, 30, 10);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(-15, -5, 30, 10);
      ctx.fillStyle = '#2563eb';
      // tiny flowing steps
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-12 + i * 7, -3, 5, 6);
      }
    }
    else if (bid === 'biber_station') {
      // Small wooden hut
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-12, -10, 24, 16);
      ctx.fillStyle = '#fed7aa';
      // Triangular roof
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
      // Small circular tanks
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
      // Modern info center building
      ctx.fillStyle = '#14b8a6'; // Teal Modern
      ctx.fillRect(-14, -14, 28, 20);
      ctx.strokeStyle = '#0f766e';
      ctx.strokeRect(-14, -14, 28, 20);
      
      // Large Glass window front
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(-10, -6, 20, 10);
      ctx.strokeStyle = '#0284c7';
      ctx.strokeRect(-10, -6, 20, 10);

      // Info Icon
      ctx.fillStyle = '#0f766e';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ℹ️', -5, 2);
    }
    else if (bid === 'campingplatz') {
      // Draw 2 cute small tents and a little campfire
      // Tent 1 (Orange)
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#c2410c';
      ctx.beginPath();
      ctx.moveTo(-16, 5);
      ctx.lineTo(-8, -10);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tent 2 (Teal)
      ctx.fillStyle = '#0d9488';
      ctx.strokeStyle = '#115e59';
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(8, -5);
      ctx.lineTo(16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Campfire
      ctx.fillStyle = '#b45309'; // logs
      ctx.fillRect(-3, 0, 6, 3);
      ctx.fillStyle = '#ef4444'; // flames
      ctx.beginPath();
      ctx.arc(0, -1, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (bid === 'kanuverleih') {
      // Wooden dock/pier
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-15, -6, 10, 20);
      ctx.strokeStyle = '#78350f';
      ctx.strokeRect(-15, -6, 10, 20);

      // Boat 1 (Yellow)
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(4, -4, 10, 3, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Boat 2 (Blue)
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(8, 6, 10, 3, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    else if (bid === 'rurtalbahn_halt') {
      // Sleek train platform
      ctx.fillStyle = '#7c3aed'; // warm purple
      ctx.fillRect(-18, 0, 36, 10);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-18, 0, 36, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText('BAHN', -11, 7);

      // Cute model railroad track
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-24, -8);
      ctx.lineTo(24, -8);
      ctx.stroke();

      // Slates / sleepers
      ctx.strokeStyle = '#6e583e';
      ctx.lineWidth = 1.5;
      for (let sl = -20; sl <= 20; sl += 6) {
        ctx.beginPath();
        ctx.moveTo(sl, -10);
        ctx.lineTo(sl, -6);
        ctx.stroke();
      }

      // Rails
      ctx.strokeStyle = '#b0b0b0';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-24, -9);
      ctx.lineTo(24, -9);
      ctx.moveTo(-24, -7);
      ctx.lineTo(24, -7);
      ctx.stroke();

      // Tiny cozy red locomotive car (Rurtalbahn) sliding smoothly back and forth
      const trainX = Math.sin(tickNum / 35) * 16;
      ctx.fillStyle = '#d32f2f'; // Rur commuter red
      ctx.fillRect(trainX - 6, -13, 12, 5);
      
      // Windows
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(trainX - 4, -12, 3, 1.8);
      ctx.fillRect(trainX + 1, -12, 3, 1.8);

      // Locomotive steam smoke puff
      if (tickNum % 40 < 20) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(trainX + (Math.sin(tickNum / 35) > 0 ? 3 : -3), -16 - (tickNum % 10) * 0.4, 2 + (tickNum % 6) * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (bid === 'schoellershammer') {
      // Full pre-built giant factory blocks with puffing steam particles
      ctx.fillStyle = '#334155';
      ctx.fillRect(-22, -18, 44, 28);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(-22, -18, 44, 28);
      
      // Chimney
      ctx.fillStyle = '#475569';
      ctx.fillRect(8, -40, 8, 24);
      ctx.strokeRect(8, -40, 8, 24);

      // Steam animations
      if (tickNum % 60 < 30) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(12 + Math.sin(tickNum / 5) * 4, -45 - (tickNum % 30) * 0.5, 3 + (tickNum % 10) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (bid === 'windkraft') {
      // Tall elegant white tapered shaft
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

      // Turbine head / nacelle
      ctx.fillRect(-2.5, -28.5, 5, 4);

      // Rotating blades
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
        ctx.lineTo(0, 18); // blade length
        ctx.stroke();
      }
      ctx.restore();
    }
    else if (bid === 'solarpark') {
      // Angled solar sheets (Deep metallic blue-teal reflection)
      const rowY = [-10, -1, 8];
      rowY.forEach((ry) => {
        ctx.fillStyle = '#0f172a'; // support rack
        ctx.fillRect(-12, ry + 2, 24, 2);

        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 0.7;
        ctx.fillRect(-11, ry - 3, 22, 5);

        // Grid sheen lines
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
      // Water power station building
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#334155';
      ctx.fillRect(-12, -10, 24, 16);
      ctx.strokeRect(-12, -10, 24, 16);

      // Roof
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(-14, -10);
      ctx.lineTo(0, -20);
      ctx.lineTo(14, -10);
      ctx.closePath();
      ctx.fill();

      // Rotating paddle water wheel
      ctx.save();
      ctx.translate(14, -3);
      const wAngle = tickNum * 0.05;
      
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();

      // Paddles
      ctx.lineWidth = 0.8;
      for (let pIdx = 0; pIdx < 6; pIdx++) {
        const curAngle = wAngle + (pIdx * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(curAngle) * 8, Math.sin(curAngle) * 8);
        ctx.stroke();
      }
      ctx.restore();

      // Small foam splash bubbles
      if (tickNum % 20 < 10) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(14 + (tickNum % 6), -1 + Math.sin(tickNum / 3) * 1.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (bid === 'extensive_weide') {
      // Cozy grazing sheep (Dorfromantik pastures)
      const sheeps = [
        { sx: -10, sy: -1, bob: tickNum % 30 },
        { sx: 8, sy: 5, bob: (tickNum + 10) % 30 },
        { sx: -1, sy: -9, bob: (tickNum + 20) % 30 }
      ];

      sheeps.forEach(sh => {
        const bobY = Math.abs(Math.sin(sh.bob * 0.15)) * 1.2;

        // Fluffy body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sh.sx, sh.sy + bobY, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(sh.sx - 1.5, sh.sy + 3 + bobY);
        ctx.lineTo(sh.sx - 1.5, sh.sy + 4.5 + bobY);
        ctx.moveTo(sh.sx + 1.5, sh.sy + 3 + bobY);
        ctx.lineTo(sh.sx + 1.5, sh.sy + 4.5 + bobY);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.arc(sh.sx - 3.5, sh.sy + bobY - 0.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    else if (bid === 'intensive_farm') {
      // Red barn house & metal silo tower
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-14, -5, 18, 12);
      ctx.strokeStyle = '#7f1d1d';
      ctx.strokeRect(-14, -5, 18, 12);

      // Crossed barn doors
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-10, -2); ctx.lineTo(-10, 7);
      ctx.moveTo(-10, -2); ctx.lineTo(-5, 7);
      ctx.moveTo(-5, -2); ctx.lineTo(-5, 7);
      ctx.moveTo(-5, -2); ctx.lineTo(-10, 7);
      ctx.stroke();

      // Roof
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(-16, -5);
      ctx.lineTo(-5, -13);
      ctx.lineTo(6, -5);
      ctx.closePath();
      ctx.fill();

      // Silo tower cylinder
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.8;
      ctx.fillRect(8, -14, 6, 21);
      ctx.strokeRect(8, -14, 6, 21);
      
      // Dome roof
      ctx.beginPath();
      ctx.arc(11, -14, 3, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    else if (bid === 'deichrueck') {
      // Embankment / dike structure
      ctx.fillStyle = '#4d7c0f'; // grass green
      ctx.strokeStyle = '#3f6212';
      ctx.beginPath();
      ctx.moveTo(-17, 8);
      ctx.quadraticCurveTo(-11, -8, 0, -8);
      ctx.quadraticCurveTo(11, -8, 17, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wooden spikes along edge
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
      // Concrete retaining basin (Polder)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-15, -10, 30, 18);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(-15, -10, 30, 18);

      // Water body inside
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(-12, -7, 24, 12);

      // Slow water shimmering ripple line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-9, -3 + Math.sin(tickNum / 20) * 1.5);
      ctx.lineTo(9, -3 + Math.sin(tickNum / 20) * 1.5);
      ctx.stroke();
    }
    else if (bid === 'sohlgleite') {
      // Natural rock piles in riverbed
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

      // Foaming water splashes
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
      // Circular clean concrete pool
      ctx.fillStyle = '#4b5563';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1d4ed8'; // deep pure water
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Steel center structural lines
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    else if (bid === 'insektenhotel') {
      // Triangular mini wood house
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(-9, 7);
      ctx.lineTo(0, -9);
      ctx.lineTo(9, 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffedd5'; // wood chambers
      ctx.beginPath();
      ctx.moveTo(-7.5, 6);
      ctx.lineTo(0, -5);
      ctx.lineTo(7.5, 6);
      ctx.closePath();
      ctx.fill();

      // Hollow chambers
      ctx.fillStyle = '#451a03';
      for (let dh = -3; dh <= 3; dh += 3) {
        ctx.beginPath(); ctx.arc(dh, 3, 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(dh / 2, -1, 0.8, 0, Math.PI * 2); ctx.fill();
      }

      // Bordering flower points (Blühstreifen)
      ctx.fillStyle = '#ec4899'; // pink
      ctx.beginPath(); ctx.arc(-11, 8, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#eab308'; // gold
      ctx.beginPath(); ctx.arc(-8, 10, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a855f7'; // purple
      ctx.beginPath(); ctx.arc(9, 8, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    else if (bid === 'klaerwerk_upgrade') {
      // Double clarifying circular sedimentation basins
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

        ctx.fillStyle = idx === 0 ? '#10b981' : '#0ea5e9'; // safe eco blue
        ctx.beginPath();
        ctx.arc(bs.bx, bs.by, bs.br - 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Slow spinning clarifier arm
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
      // Natural organic wood dome
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 3, 13, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.stroke();

      // Eco wood ribs
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.8;
      for (let rib = -10; rib <= 10; rib += 5) {
        ctx.beginPath();
        ctx.ellipse(0, 3, Math.abs(rib), 13, 0, Math.PI, 0);
        ctx.stroke();
      }

      // Mini green rooftop garden
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.arc(0, 3, 13, Math.PI * 1.25, Math.PI * 1.75);
      ctx.closePath();
      ctx.fill();
    }
    else if (bid === 'eisvogel_nist') {
      // Kingfisher nest pole in water
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.lineTo(0, -9);
      ctx.stroke();

      // Nesting box
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-3, -15, 6, 6);
      ctx.strokeStyle = '#431407';
      ctx.strokeRect(-3, -15, 6, 6);

      ctx.fillStyle = '#1e1b4b'; // nest opening hole
      ctx.beginPath();
      ctx.arc(0, -12, 1, 0, Math.PI * 2);
      ctx.fill();

      // Tiny colorful Kingfisher hovering
      const birdX = 6 + Math.sin(tickNum / 9) * 2.5;
      const birdY = -10 + Math.cos(tickNum / 7) * 1.8;
      ctx.fillStyle = '#06b6d4'; // Kingfisher signature turquoise
      ctx.beginPath();
      ctx.arc(birdX, birdY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ea580c'; // orange breast
      ctx.beginPath();
      ctx.arc(birdX - 0.5, birdY + 0.8, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
    else {
      // Catch-all building display (standard 3D cube with emoji logo)
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
    const th = 2 * hVal;

    if (terrain === 'Water') {
      // Flowing Blue-Teal Water Ripples & Shimmering Lines
      ctx.save();
      pathHexagon(ctx, sx, sy);
      ctx.clip();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.2;

      // Draw 3 dynamic diagonal wave ripple lines flowing south-north based on tick and coordinates
      for (let i = 0; i < 3; i++) {
        const flowOffset = ((tickNum * 0.45 + (tile.x * 25) + (tile.y * 55) + (i * 45)) % 100) / 100;
        const startRatio = -0.4 + flowOffset * 1.0;
        const endRatio = startRatio + 0.35;

        // Map coordinate interpolation along the diamond left-to-right axis
        const startX = sx + (startRatio - 0.5) * htw;
        const startY = sy + (startRatio - 0.5) * hth;
        const endX = sx + (endRatio - 0.5) * htw;
        const endY = sy + (endRatio - 0.5) * hth;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        // Add a curved ripple wave
        ctx.quadraticCurveTo((startX + endX) / 2, (startY + endY) / 2 - 2, endX, endY);
        ctx.stroke();
      }

      // Shore-line subtle gradient foam
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(sx, sy - hth + 3);
      ctx.lineTo(sx + htw - 3, sy);
      ctx.lineTo(sx, sy + hth - 3);
      ctx.lineTo(sx - htw + 3, sy);
      ctx.closePath();
      ctx.fill();

      // Draw 1 tiny cozy sailboat on some river tiles
      if (tile.buildingId === null && (tile.x * 9 + tile.y * 11) % 6 === 0) {
        const boatX = sx + Math.sin(tickNum / 25 + tile.x) * 4;
        const boatY = sy + Math.cos(tickNum / 30 + tile.y) * 2;

        ctx.save();
        ctx.translate(boatX, boatY);

        // Hull (wood brown/white)
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

        // Mast
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(0, -5);
        ctx.stroke();

        // Sail (white triangular)
        ctx.fillStyle = '#fef08a'; // yellow cozy leaf sail or cream sail
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
      // Lush vegetation fields: Tiny vertical grass blade pairs and colored wild blossom points
      ctx.save();
      // Draw 5 organic grass blade pairs scattered around the center area of the tile
      const seedPoints = [
        { rx: -15, ry: 2 },
        { rx: 12, ry: 5 },
        { rx: -8, ry: 12 },
        { rx: 14, ry: -5 },
        { rx: -5, ry: -8 },
      ];
      ctx.strokeStyle = '#4F6F52'; // deep green grass
      ctx.lineWidth = 1.2;
      seedPoints.forEach((p, idx) => {
        const px = sx + p.rx;
        const py = sy + p.ry;

        // Draw blade left
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px - 1.5, py - 4, px - 3, py - 6);
        ctx.stroke();

        // Draw blade right
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + 1.5, py - 4.5, px + 2.5, py - 7);
        ctx.stroke();

        // Scatter wildflowers at some indices
        if (idx % 2 === 0) {
          ctx.fillStyle = idx % 4 === 0 ? '#F39C12' : '#FFFFFF'; // Golden and White Chamomile flowers
          ctx.beginPath();
          ctx.arc(px + 3, py - 1, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw 1 tiny resting sheep on some meadows to liven up the map
      if (tile.buildingId === null && (tile.x * 7 + tile.y * 13) % 4 === 0) {
        const sxSheep = sx + 5;
        const sySheep = sy - 3;
        
        // resting body
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(sxSheep, sySheep, 3, 2.2, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // head
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.arc(sxSheep - 2.5, sySheep + 0.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    else if (terrain === 'Auwald') {
      // Dorfromantik-style round tree canopies
      ctx.save();
      const trees = [
        { rx: -14, ry: 0,  r: 11, dark: false },
        { rx:  12, ry: -5, r: 9,  dark: true  },
        { rx:   2, ry: 11, r: 12, dark: false },
        { rx: -8,  ry: 14, r: 8,  dark: true  },
      ];
      trees.forEach((tree, idx) => {
        const tx = sx + tree.rx;
        const ty = sy + tree.ry;
        const rad = tree.r;

        // Ground shadow ellipse
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath();
        ctx.ellipse(tx + 2, ty + rad * 0.5, rad * 0.85, rad * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Canopy base (dark green)
        ctx.fillStyle = tree.dark ? '#2D5A30' : '#3A6B3A';
        ctx.beginPath();
        ctx.arc(tx, ty, rad, 0, Math.PI * 2);
        ctx.fill();

        // Canopy mid layer (medium green)
        ctx.fillStyle = tree.dark ? '#4A8048' : '#5A9450';
        ctx.beginPath();
        ctx.arc(tx - rad * 0.15, ty - rad * 0.2, rad * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Top highlight dome (light reflection — Dorfromantik signature)
        ctx.fillStyle = tree.dark ? '#6AAE60' : '#82C470';
        ctx.beginPath();
        ctx.arc(tx - rad * 0.22, ty - rad * 0.30, rad * 0.48, 0, Math.PI * 2);
        ctx.fill();

        // Specular glint
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.arc(tx - rad * 0.30, ty - rad * 0.38, rad * 0.22, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
    else if (terrain === 'Acker') {
      // Planted agricultural crop rows going corner to corner (parallel furrow vectors)
      ctx.save();
      pathHexagon(ctx, sx, sy);
      ctx.clip();

      ctx.strokeStyle = '#A0522D'; // light warm clay furrows
      ctx.lineWidth = 1.0;
      
      const angleEast = (tile.x % 2 === 0); // Alternate diagonal rows for an elegant patchwork display looks
      const totalRows = 6;
      for (let i = 0; i < totalRows; i++) {
        const distance = ((i / (totalRows - 1)) - 0.5) * 2; // -1 to 1 scale
        
        ctx.beginPath();
        if (angleEast) {
          // Lines stretching along North-West to South-East
          const startX = sx + distance * htw * 0.8 - htw * 0.4;
          const startY = sy + distance * hth * 0.8 + hth * 0.4;
          const endX = sx + distance * htw * 0.8 + htw * 0.4;
          const endY = sy + distance * hth * 0.8 - hth * 0.4;
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        } else {
          // Lines stretching along South-West to North-East
          const startX = sx + distance * htw * 0.8 - htw * 0.4;
          const startY = sy - distance * hth * 0.8 - hth * 0.4;
          const endX = sx + distance * htw * 0.8 + htw * 0.4;
          const endY = sy - distance * hth * 0.8 + hth * 0.4;
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        }
        ctx.stroke();
      }

      // Add small green crop sprout dots on the furrows
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
      // Mini-Houses: populated with charming little 3D houses with red terracotta roofs
      ctx.save();
      const houseCoords = [
        { rx: -15, ry: 4 },
        { rx: 12, ry: -2 },
        { rx: -2, ry: 16 }
      ];

      houseCoords.forEach((hc, hidx) => {
        const hx = sx + hc.rx;
        const hy = sy + hc.ry;

        // House shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(hx, hy + 3, 7, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw House Walls (Beige / Warm yellow brick)
        ctx.fillStyle = '#E6C594'; // main wall front
        ctx.beginPath();
        ctx.moveTo(hx - 5, hy + 2);
        ctx.lineTo(hx, hy + 5);
        ctx.lineTo(hx, hy - 2);
        ctx.lineTo(hx - 5, hy - 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#CFA165'; // main wall side
        ctx.beginPath();
        ctx.moveTo(hx, hy + 5);
        ctx.lineTo(hx + 5, hy + 2);
        ctx.lineTo(hx + 5, hy - 5);
        ctx.lineTo(hx, hy - 2);
        ctx.closePath();
        ctx.fill();

        // House Roofs (Saturated Red Terracotta Tile)
        ctx.fillStyle = '#C0392B'; // Left dark roof aspect
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy - 5);
        ctx.lineTo(hx, hy - 11);
        ctx.lineTo(hx, hy - 2);
        ctx.lineTo(hx - 6, hy + 1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#E74C3C'; // Right bright roof aspect
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

        // If it's the second house in the settlement, draw a cozy chimney and puffing smoke!
        if (hidx === 1) {
          // Tiny Chimney
          ctx.fillStyle = '#451a03';
          ctx.fillRect(hx + 1.2, hy - 11, 1.2, 3);

          // Animated puffing smoke rings
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
      // Commercial/Infrastructure structures: Concrete squares, container grids, asphalt driveways
      ctx.save();
      // Draw dark grey main service asphalt roads
      ctx.strokeStyle = '#565E63';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(sx - htw * 0.8, sy + hth * 0.4);
      ctx.lineTo(sx + htw * 0.8, sy - hth * 0.4);
      ctx.stroke();

      // Industrial container/warehouse building block
      ctx.fillStyle = '#4B5563'; // metal teal-grey blocks
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

      // Yellow crane lines or yellow stripe parking patterns
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

  const drawTree = (ctx: CanvasRenderingContext2D, dx: number, dy: number, h: number) => {
    ctx.fillStyle = '#065f46';
    ctx.strokeStyle = '#022c22';
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx - 5, dy - h / 3);
    ctx.lineTo(dx - 1, dy - h / 3);
    ctx.lineTo(dx - 4, dy - (2 * h) / 3);
    ctx.lineTo(dx - 1, dy - (2 * h) / 3);
    ctx.lineTo(dx - 3, dy - h);
    ctx.lineTo(dx + 3, dy - h);
    ctx.lineTo(dx + 1, dy - (2 * h) / 3);
    ctx.lineTo(dx + 4, dy - (2 * h) / 3);
    ctx.lineTo(dx + 1, dy - h / 3);
    ctx.lineTo(dx + 5, dy - h / 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // Reverse hex math mapping on Mouse Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If we dragged, break click trigger
    if (mouseHasMoved) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rx = (mouseX - panX) / zoom;
    const ry = (mouseY - panY) / zoom;

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
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rx = (mouseX - panX) / zoom;
    const ry = (mouseY - panY) / zoom;

    const hovered = getTileFromCoords(rx, ry);
    if (hovered) {
      setHoveredTile(hovered);
    } else {
      setHoveredTile(null);
    }

    if (isDragging) {
      const dxDrag = e.clientX - dragStart.current.x;
      const dyDrag = e.clientY - dragStart.current.y;
      
      const dist = Math.sqrt(dxDrag * dxDrag + dyDrag * dyDrag);
      if (dist > 5) {
        setMouseHasMoved(true);
      }

      setPanX(prev => prev + dxDrag);
      setPanY(prev => prev + dyDrag);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Interactions (Tablets/Phones)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      touchLastPos.current = { x: touch.clientX, y: touch.clientY };
      touchHasMoved.current = false;
      setIsDragging(true);
      setTouchPinchDist(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
      setTouchPinchDist(dist);
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) {
      e.preventDefault(); // Stop entire page from moving while panning canvas
    }

    if (e.touches.length === 1 && isDragging) {
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

      setPanX(prev => prev + dx);
      setPanY(prev => prev + dy);
      touchLastPos.current = { x: touch.clientX, y: touch.clientY };

      // Calculate hover for touch movement tracking
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;

        const rx = (mouseX - panX) / zoom;
        const ry = (mouseY - panY) / zoom;

        const hovered = getTileFromCoords(rx, ry);
        if (hovered) {
          setHoveredTile(hovered);
        } else {
          setHoveredTile(null);
        }
      }
    } else if (e.touches.length === 2 && touchPinchDist !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.sqrt(Math.pow(t1.clientX - t2.clientX, 2) + Math.pow(t1.clientY - t2.clientY, 2));
      
      const factor = dist / touchPinchDist;
      const newZoom = Math.max(0.4, Math.min(1.8, touchStartZoomRef.current * factor));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    setTouchPinchDist(null);

    // Precise touch click
    if (!touchHasMoved.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;

      const rx = (mouseX - panX) / zoom;
      const ry = (mouseY - panY) / zoom;

      const hovered = getTileFromCoords(rx, ry);
      if (hovered) {
        onTileClick(hovered.x, hovered.y);
      }
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(1.8, prev + 0.15));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, prev - 0.15));

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
              {/* Responsive Abbreviation to prevent overflow on mobile grids */}
              <span className="inline-flex items-center gap-0.5 sm:hidden">
                {layer === 'normal' ? <><Map      className="w-3 h-3" /> Satellit</>
                : layer === 'wrrl'  ? <><Droplets className="w-3 h-3" /> WRRL</>
                : layer === 'ffh'   ? <><Leaf     className="w-3 h-3" /> FFH</>
                :                     <><Waves    className="w-3 h-3" /> Schutz</>}
              </span>
              <span className="hidden sm:inline-flex items-center gap-0.5">
                {layer === 'normal' ? <><Map      className="w-3 h-3" /> Satellit</>
                : layer === 'wrrl'  ? <><Droplets className="w-3 h-3" /> WRRL Wasser</>
                : layer === 'ffh'   ? <><Leaf     className="w-3 h-3" /> FFH-Flora</>
                :                     <><Waves    className="w-3 h-3" /> HWRM Hochwasser</>}
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
