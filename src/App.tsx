import React, { useState, useEffect, useCallback, useMemo } from 'react';
import emailjs from '@emailjs/browser';
import { 
  TileData, BuildingType, ActionCard, ActionCardType, 
  ResearchNode, Species, PaperFactoryMode, GameLog, GameStats, ClimateEvent, TerrainType 
} from './types';
import { 
  BUILDIONS_CATALOG, INITIAL_ACTION_CARDS, RESEARCH_TECH_TREE, 
  BIOTOP_SPECIES, CLIMATE_EVENTS_DATA 
} from './gameData';
import { ActionSlotSystem } from './components/ActionSlotSystem';
import { BuildingCatalog } from './components/BuildingCatalog';
import { SchoellershammerConsole } from './components/SchoellershammerConsole';
import { ResearchTree } from './components/ResearchTree';
import { SpeciesTracker } from './components/SpeciesTracker';
import { DashboardReports } from './components/DashboardReports';
import { IsometricMap } from './components/IsometricMap';
import { OekoZentraleHUD } from './components/OekoZentraleHUD';
import { Spielanleitung } from './components/Spielanleitung';
import {
  Sun, CloudRain, Award, Info, Calendar, Zap, RotateCcw,
  TrendingUp, Coins, ShieldAlert, Wrench, BookOpen, HeartHandshake, HelpCircle,
  X, Save, FolderOpen, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GRID_SIZE = 16;

const TUTORIAL_STEPS = [
  {
    title: "Willkommen an der Rur! 🌿",
    tagline: "RENATURIERUNGS-SIMULATOR KREIS DÜREN",
    icon: "🗺️",
    description: "Als leitender Umweltbeauftragter bist du für die ökologische Qualität der Rur verantwortlich. Deine Karte zeigt den Flusslauf von der Eifel bis zur Jülicher Tiefebene.",
    bullets: [
      "📌 Der Fluss entspringt am landschaftlich idyllischen Stausee Obermaubach (Süden) und meandert hinunter gen Norden.",
      "⚠️ Belastungs-Hotspots: Im Mittelteil (Düren) belasten Industrieanlagen wie die Papierfabrik den Fluss immens.",
      "🎯 Deine Mission: Verbessere die Gewässergüte (WRRL), maximiere den Artenschutz-Fokus (FFH) und schaffe Durchgängigkeit für bedrohte Tierarten!"
    ]
  },
  {
    title: "Das Aktionskarten-Prinzip 🎴",
    tagline: "BRETTCON KENNERSPIEL-LAYOUT",
    icon: "🎰",
    description: "Das Spiel nutzt eine innovative Aktionsreihen-Mechanik:",
    bullets: [
      "⚡ Fünf Slots mit ansteigender Stärke (1 bis 5) steuern deine Macht beim Ausspielen der jeweiligen Fähigkeit.",
      "↩️ Aktivierst du eine Karte, rutscht sie zurück auf Slot 1. Die anderen Karten rechts rücken nach und werden kräftiger!",
      "🧠 Taktischer Tipp: Lass Karten an Stärke gewinnen, bevor du sie zündest, um die volle Effizienz zu entfesseln."
    ]
  },
  {
    title: "Effizientes Bauen & Materialrabatte 🏗️",
    tagline: "KOSTENFREIGABEN & DESIGN",
    icon: "👷",
    description: "Deine Bauen-Aktionskarte steuert direkt das Baukontingent auf der Isometric-Karte:",
    bullets: [
      "💶 Bauen auf Stärke 1-2 limitiert das Projektguthaben (€) massiv: Du darfst nur einfachste Renaturierungen platzieren.",
      "🔨 Auf Stärke 3-4 erhältst du einen Materialrabatt von 1 € und eine Freigabe für mittlere bis fortgeschrittene Bauten.",
      "👑 Elite-Bauen (Stärke 5): Ermöglicht den Bau beliebiger Großbauprojekte mit einem fetten Materialrabatt von 2 €!"
    ]
  },
  {
    title: "Gewässergüte-Layer & Biotopwerte 🌊",
    tagline: "KARTIERE DIE LEBENSRÄUME",
    icon: "📊",
    description: "Nutze die umschaltbaren Layer-Anzeigen direkt oben rechts auf der Karte, um Analysen zu fahren:",
    bullets: [
      "💧 WRRL-Qualität: Zeigt Farbskalen der ökologischen Güteklasse. Dunkelgrün ist top; braun/orange Zonen verlangen dringende Renaturierungen.",
      "🦅 FFH-Biotopschutz: Zeigt das unberührte Artenschutzpotenzial. Schütze diese Zonen oder werte sie massiv auf.",
      "🏠 Hochwasserrisiko: Durch Klimaphänomene steigen die Fluten. Baue Auwälder und Altarme als Puffer!"
    ]
  },
  {
    title: "Papierfabrik & Wissenschaft 🔬",
    tagline: "EINHEIT VON NATUR & WIRTSCHAFT",
    icon: "🏭",
    description: "Nur durch technologische Meisterleistung gelingt die Rettung der Ökosysteme:",
    bullets: [
      "🏭 Die Dürener Papierfabrik Schoellershammer spült viel Steuergeld in die Kasse, verpestet aber die Gewässergüte lokal dramatisch.",
      "🧪 Erforsche im Tech-Baum wegweisende Entwürfe wie Fischtreppen, Biberreviere und Hochwasserschutz.",
      "🐟 Mit Abschluss des finalen Patents kannst du Schoellershammer auf Öko-Innovation umrüsten, um Lachse wieder heimisch zu machen!"
    ]
  },
  {
    title: "Baum- & Forschungskaskade 🪜",
    tagline: "ABHÄNGIGKEITS- UND FREISCHALTDIAGRAMM",
    icon: "🪜",
    description: "Hier siehst du die Kaskade der Bau- und Forschungsmöglichkeiten. Projekte hängen voneinander ab und schalten neue Optionen frei:",
    bullets: [
      "🟢 Stufe I (Grundlagen): Beginne mit Biber-Management, Sohlgleiten oder dem NRW-Lachsprogramm im Labor.",
      "🔵 Stufe II (Aufbau): Erforsche Auen-Vitalisierung (erfordert Biber-Plan) oder verbesserte Klärwerk-Filter.",
      "🟣 Stufe III (Transformation): Das Fabrik-Transformationskonzept erfordert Abwasserreinigung + Lachsprogramm und ermöglicht die vollständige Papierfabrik-Renaturierung!"
    ],
    showCascadeDiagram: true
  }
];

export default function App() {
  // --- Game State Systems ---
  const [grid, setGrid] = useState<TileData[][]>([]);
  const [stats, setStats] = useState<GameStats>({
    round: 1,
    year: 2026,
    budget: 25,
    researchPoints: 3,
    naturePoints: 0,
    globalWrrl: 3.6,
    globalFfh: 25,
    continuity: 30,
    climateRisk: 15,
    paperFactoryMode: 'PRODUCTION',
    rurtalbahnSlotsUsed: 0
  });

  const [cards, setCards] = useState<ActionCard[]>([]);
  const [researchTree, setResearchTree] = useState<ResearchNode[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [activeEvent, setActiveEvent] = useState<ClimateEvent | null>(null);
  
  // UI Panels / Tabs
  const [activeTab, setActiveTab] = useState<'map' | 'schoeller' | 'research' | 'species' | 'reports'>('map');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<'normal' | 'wrrl' | 'ffh' | 'flood'>('normal');
  const [isDemolishMode, setIsDemolishMode] = useState<boolean>(false);
  const [selectedTileInfo, setSelectedTileInfo] = useState<{ x: number, y: number, building: BuildingType, tile: TileData } | null>(null);
  const [pdfSimulated, setPdfSimulated] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [tutorialStep, setTutorialStep] = useState<number>(0);

  const [showSpielanleitung, setShowSpielanleitung] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackName, setFeedbackName] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackSending, setFeedbackSending] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string>('');

  // Kontext-abhängige Tipps & Hilfestellungen für neue Features
  const [seenTips, setSeenTips] = useState<string[]>([]);
  const [activeTip, setActiveTip] = useState<{
    id: string;
    title: string;
    icon: string;
    text: string;
  } | null>(null);

  // Trigger für erste Nutzung von Bauen
  useEffect(() => {
    if (selectedBuilding && !seenTips.includes('build') && !showTutorial) {
      setActiveTip({
        id: 'build',
        title: 'Bau-Modus aktiviert!',
        icon: '🦫',
        text: `Du hast '${selectedBuilding.name}' ausgewählt! Klicke jetzt auf ein zulässiges helleres Feld auf der Karte (z.B. Wiese, Weide oder Auenwald), um das Gebäude zu platzieren. Jedes Projekt hat permanenten Einfluss auf WRRL (Flussqualität), FFH (Artenschutz-Siegpunkte) und die Kasse.`
      });
      setSeenTips(prev => [...prev, 'build']);
    }
  }, [selectedBuilding, showTutorial, seenTips]);

  // Trigger für erste Nutzung von Rückbau
  useEffect(() => {
    if (isDemolishMode && !seenTips.includes('demolish') && !showTutorial) {
      setActiveTip({
        id: 'demolish',
        title: 'Rückbau & Renaturierung!',
        icon: '👷',
        text: 'Manche alten Industriebauten oder barrieregelaufene Wehre versperren den Fischen das Fortkommen. Klicke im Rückbau-Modus auf ein beliebiges bebautes Feld, um dieses abzureißen und Platz für die ursprüngliche Flussdynamik zu machen.'
      });
      setSeenTips(prev => [...prev, 'demolish']);
    }
  }, [isDemolishMode, showTutorial, seenTips]);

  // Trigger für erste Nutzung von Filter-Ebenen
  useEffect(() => {
    if (selectedLayer !== 'normal' && !seenTips.includes('layers') && !showTutorial) {
      const layerNames = { wrrl: 'Gewässerrand (WRRL)', ffh: 'Biotopflächen (FFH)', flood: 'Hochwasserrisiko' };
      const layerName = layerNames[selectedLayer as keyof typeof layerNames] || selectedLayer;
      setActiveTip({
        id: 'layers',
        title: 'Messwert-Filter aktiviert!',
        icon: '🗺️',
        text: `Du hast die Kartenebene auf '${layerName}' umgeschaltet. Diese nützlichen Farb-Filter helfen dir, überflutungsgefährdete Sektoren, Abwassereinflüsse und biologische Schwachstellen der Rur sofort geografisch zu lokalisieren.`
      });
      setSeenTips(prev => [...prev, 'layers']);
    }
  }, [selectedLayer, showTutorial, seenTips]);

  // Trigger für erste Nutzung von Forschung
  useEffect(() => {
    if (activeTab === 'research' && !seenTips.includes('research') && !showTutorial) {
      setActiveTip({
        id: 'research',
        title: 'Das Forschungslabor!',
        icon: '🔬',
        text: 'Generiere über den "Forschen"-Aktionsslot gezielt Forschungspunkte, um ökologische Fortschritte zu erforschen. Jede abgeschlossene Technologie bringt permanent wirkende Vorteile oder schaltet neue Prototypen im Baubeirat frei!'
      });
      setSeenTips(prev => [...prev, 'research']);
    }
  }, [activeTab, showTutorial, seenTips]);

  // Trigger für erste Nutzung von Fabrikkonsole (Schoellershammer)
  useEffect(() => {
    if (activeTab === 'schoeller' && !seenTips.includes('schoeller') && !showTutorial) {
      setActiveTip({
        id: 'schoeller',
        title: 'Schoellershammer Konsole!',
        icon: '🏭',
        text: 'Die historische Papierfabrik Schoellershammer ist Dürens größter Arbeitgeber, beeinträchtigt aber den Flusslauf. Nutze diese Konsole, um den Betriebsmodus einzustellen (von profitabler Produktion bis hin zur vollständigen Renaturierung)!'
      });
      setSeenTips(prev => [...prev, 'schoeller']);
    }
  }, [activeTab, showTutorial, seenTips]);

  // Trigger für Artenschutz-Artentabelle
  useEffect(() => {
    if (activeTab === 'species' && !seenTips.includes('species') && !showTutorial) {
      setActiveTip({
        id: 'species',
        title: 'Artenschutz & Rote Liste!',
        icon: '🐟',
        text: 'Hier findest du gefährdete Rur-Zielarten wie Bachforelle, Biber oder Lachs. Indem du die ökologische Flussqualität (WRRL) und Biotop-Potenziale (FFH) verbesserst, siedeln sich diese sensiblen Flussbewohner selbstständig an!'
      });
      setSeenTips(prev => [...prev, 'species']);
    }
  }, [activeTab, showTutorial, seenTips]);

  // Trigger für erste Nutzung von Gebäudeinspektion
  useEffect(() => {
    if (selectedTileInfo && !seenTips.includes('inspect') && !showTutorial) {
      setActiveTip({
        id: 'inspect',
        title: 'Gebäude-Inspektor!',
        icon: '🔍',
        text: `Du hast das Gebäude '${selectedTileInfo.building.name}' ausgewählt. Klicke auf bereits platzierte Anlagen, um deren genaue Baukosten, laufende Instandhaltung sowie alle wirksamen Spezialeffekte übersichtlich im HUD anzuzeigen.`
      });
      setSeenTips(prev => [...prev, 'inspect']);
    }
  }, [selectedTileInfo, showTutorial, seenTips]);

  // Automatically deselect inspect when going to build or demolish mode
  useEffect(() => {
    if (selectedBuilding || isDemolishMode) {
      setSelectedTileInfo(null);
    }
  }, [selectedBuilding, isDemolishMode]);

  // Rurtalbahn Special action state
  const [rurtalbahnLeased, setRurtalbahnLeased] = useState<boolean>(false);
  const [rurtalbahnTimeRemaining, setRurtalbahnTimeRemaining] = useState<number>(0);
  const [preLeaseCard, setPreLeaseCard] = useState<ActionCard | null>(null);

  // --- Grid Initializer ---
  const initGrid = useCallback((): TileData[][] => {
    const tempGrid: TileData[][] = [];
    
    // Realistic geographical path representing the Rur river course from south (Heimbach/Obermaubach) to north (Jülich)
    const isRiverTile = (x: number, y: number): boolean => {
      // Stausee Obermaubach (reservoir lake in South / Oberlauf area) at y = 0 and y = 1
      if (y === 0 && (x === 3 || x === 4 || x === 5 || x === 6 || x === 7)) return true;
      if (y === 1 && (x === 4 || x === 5 || x === 6)) return true;
      
      // River downstream meander line (continuous channel flowing towards North, aligned to share a long edge / orthogonal-only step)
      if (y === 2 && x === 4) return true;
      if (y === 3 && (x === 4 || x === 5)) return true;
      if (y === 4 && x === 5) return true;
      if (y === 5 && x === 5) return true;
      if (y === 6 && x === 5) return true; // Next to Schoellershammer factory at (6,6)
      if (y === 7 && (x === 5 || x === 6)) return true; // Passing by Schoellershammer
      if (y === 8 && (x === 6 || x === 7)) return true;
      if (y === 9 && x === 7) return true;
      if (y === 10 && (x === 7 || x === 8)) return true;
      if (y === 11 && x === 8) return true;
      if (y === 12 && (x === 8 || x === 9)) return true;
      if (y === 13 && x === 9) return true;
      if (y === 14 && (x === 9 || x === 10)) return true;
      if (y === 15 && x === 10) return true;
      
      return false;
    };

    for (let y = 0; y < GRID_SIZE; y++) {
      const row: TileData[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const river = isRiverTile(x, y);
        let terrain: TerrainType = 'Wiese';
        let wrrl = 3.0;
        let ffh = 25;
        let isProtected = false;
        let moisture = 30;
        let flood = 20;

        if (river) {
          terrain = 'Water';
          moisture = 100;
          
          // Realistic environmental progression of the Rur:
          // Excellent water quality & high biodiversity in the upstream reservoir/Eifel,
          // degrading drastically as it drains past Düren's industrial and municipal outlets,
          // slightly stabilizing with high nitrogen agricultural loading downstream in the Jülich plains.
          if (y < 5) {
            wrrl = 1.8; // Class II (Good / Excellent) upstream near Obermaubach
            ffh = 35;   // Diverse fish & invertebrate flora
            flood = 40; // Controlled retention basin
          } else if (y >= 5 && y < 11) {
            wrrl = 4.5; // Class IV (Highly Polluted) past industrial Düren city limits
            ffh = 10;   // Restricted urban biodiversity
            flood = 85; // High flood damage risk to adjacent settlements
          } else {
            wrrl = 3.9; // Class III-IV (Significantly Polluted) agricultural drainage
            ffh = 18;   // Transition habitat species
            flood = 70; // High agricultural flood plain
          }
        } else {
          // Sectors constraints
          if (y < 5) {
            // Eifel area (Oberlauf)
            terrain = Math.random() < 0.45 ? 'Auwald' : 'Wiese';
            wrrl = 2.0;
            ffh = 50;
            isProtected = Math.random() < 0.3; // Natura 2000
            moisture = 45;
            flood = 10;
          } else if (y >= 5 && y < 11) {
            // Düren center (Mittelteil)
            const roll = Math.random();
            terrain = roll < 0.3 ? 'Siedlung' : roll < 0.5 ? 'Gewerbe' : roll < 0.75 ? 'Wiese' : 'Acker';
            wrrl = 4.6;
            ffh = 15;
            moisture = 20;
            flood = 45;
          } else {
            // Jülich (Unterlauf)
            terrain = Math.random() < 0.6 ? 'Acker' : 'Wiese';
            wrrl = 3.8;
            ffh = 22;
            moisture = 35;
            flood = 35;
          }
        }

        row.push({
          x,
          y,
          terrain,
          baseTerrain: terrain,
          wrrl_quality: wrrl,
          ffh_value: ffh,
          flood_risk: flood,
          moisture,
          biodiversity: ffh,
          protected: isProtected,
          buildingId: null,
          hasRiverConnection: river
        });
      }
      tempGrid.push(row);
    }

    // Pre-place fixed Schoellershammer industrial unit
    tempGrid[6][6].terrain = 'Gewerbe';
    tempGrid[6][6].buildingId = 'schoellershammer';
    tempGrid[6][6].wrrl_quality = 4.9;
    tempGrid[6][6].ffh_value = 5;

    return tempGrid;
  }, []);

  // --- Initial Game Loading Boot ---
  useEffect(() => {
    setGrid(initGrid());
    setCards([...INITIAL_ACTION_CARDS]);
    setResearchTree([...RESEARCH_TECH_TREE]);
    setSpeciesList([...BIOTOP_SPECIES]);
    addLog('Rur-Renaturierungs-Simulation initialisiert. Willkommen im Kreis Düren!', 'info');
    addLog('Papierfabrik Schoellershammer läuft im Vollbetrieb. Riverqualität Düren-City stark belastet.', 'warning');
  }, [initGrid]);

  const addLog = (msg: string, type: GameLog['type'] = 'info') => {
    const newLog: GameLog = {
      id: Math.random().toString(),
      round: stats.round,
      message: msg,
      type
    };
    setLogs(prev => [newLog, ...prev.slice(0, 50)]);
  };

  const saveGame = () => {
    try {
      const stateToSave = {
        grid,
        stats,
        cards,
        researchTree,
        speciesList,
        logs,
        rurtalbahnLeased,
        rurtalbahnTimeRemaining,
        preLeaseCard,
        seenTips
      };
      localStorage.setItem('rurnova_save_state', JSON.stringify(stateToSave));
      addLog('💾 Spielstand erfolgreich im Browser gespeichert!', 'success');
    } catch (e) {
      addLog('❌ Fehler beim Speichern des Spielstands.', 'error');
      console.error(e);
    }
  };

  const loadGame = () => {
    try {
      const saved = localStorage.getItem('rurnova_save_state');
      if (!saved) {
        addLog('⚠️ Kein gespeicherter Spielstand im Browser gefunden.', 'warning');
        return;
      }
      const loadedState = JSON.parse(saved);
      if (loadedState.grid) setGrid(loadedState.grid);
      if (loadedState.stats) setStats(loadedState.stats);
      if (loadedState.cards) setCards(loadedState.cards);
      if (loadedState.researchTree) setResearchTree(loadedState.researchTree);
      if (loadedState.speciesList) setSpeciesList(loadedState.speciesList);
      if (loadedState.logs) setLogs(loadedState.logs);
      if (loadedState.hasOwnProperty('rurtalbahnLeased')) setRurtalbahnLeased(loadedState.rurtalbahnLeased);
      if (loadedState.hasOwnProperty('rurtalbahnTimeRemaining')) setRurtalbahnTimeRemaining(loadedState.rurtalbahnTimeRemaining);
      if (loadedState.preLeaseCard !== undefined) setPreLeaseCard(loadedState.preLeaseCard);
      if (loadedState.seenTips) setSeenTips(loadedState.seenTips);
      
      addLog('📂 Spielstand erfolgreich geladen!', 'success');
    } catch (e) {
      addLog('❌ Fehler beim Laden des Spielstands. Daten korrupt?', 'error');
      console.error(e);
    }
  };

  // --- Dynamic calculations of River & Biodiversity indexes ---
  const updateGlobalMetrics = (currentGrid: TileData[][], activeMode: PaperFactoryMode, activeResearch: ResearchNode[]) => {
    let waterTilesCount = 0;
    let totalWrrl = 0;
    let totalFfh = 0;
    let totalTiles = 0;
    let fishPassesBuilt = 0;
    let sohlgleitenCount = 0;
    let hasWater发电 = false;
    let countsStops = 0;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const t = currentGrid[y][x];
        totalTiles++;
        totalFfh += t.ffh_value;

        if (t.buildingId === 'fischpass') fishPassesBuilt++;
        if (t.buildingId === 'sohlgleite') sohlgleitenCount++;
        if (t.buildingId === 'wasserkraft') hasWater发电 = true;
        if (t.buildingId === 'rurtalbahn_halt') countsStops++;

        if (t.terrain === 'Water') {
          waterTilesCount++;
          totalWrrl += t.wrrl_quality;
        }
      }
    }

    // River Longitudinal continuity connectivity calculations (0 - 100)
    let baseContinuity = 30; // initial blockages
    baseContinuity += fishPassesBuilt * 15;
    baseContinuity += sohlgleitenCount * 12;
    if (hasWater发电) {
      baseContinuity -= 20; // hydro dam penalty
    }
    const finalContinuity = Math.max(5, Math.min(100, baseContinuity));

    // WRRL quality averages (1-5, lower is better)
    let avgWrrl = waterTilesCount > 0 ? totalWrrl / waterTilesCount : 3.0;
    
    // Schoellershammer modes annual shifts applied directly to calculation
    if (activeMode === 'PRODUCTION') {
      avgWrrl = Math.min(5.0, avgWrrl + 0.35);
    } else if (activeMode === 'SHUTDOWN') {
      avgWrrl = Math.max(1.0, avgWrrl - 0.25);
    } else if (activeMode === 'RENATURIZATION') {
      avgWrrl = Math.max(1.0, avgWrrl - 0.6);
    }

    const avgFfh = totalTiles > 0 ? totalFfh / totalTiles : 20;

    setStats(prev => ({
      ...prev,
      globalWrrl: avgWrrl,
      globalFfh: avgFfh,
      continuity: finalContinuity,
      rurtalbahnSlotsUsed: countsStops
    }));

    // Trigger wildlife check evaluations
    evaluateSpecies(avgWrrl, finalContinuity, avgFfh, fishPassesBuilt, currentGrid, activeResearch, activeMode);
  };

  // --- Species Activation rules checks ---
  const evaluateSpecies = (
    wrrl: number, 
    continuity: number, 
    ffh: number, 
    fishPasses: number, 
    currentGrid: TileData[][],
    resTree: ResearchNode[],
    mode: PaperFactoryMode
  ) => {
    let hasKieslaich = false;
    let auwaldCount = 0;
    let hasUferEntfesselung = false;
    let hasBlühstreifen = 0;
    let hasLachsstation = false;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const t = currentGrid[y][x];
        if (t.buildingId === 'kiesbett') hasKieslaich = true;
        if (t.buildingId === 'ufer_entfesselung') hasUferEntfesselung = true;
        if (t.buildingId === 'insektenhotel') hasBlühstreifen++;
        if (t.buildingId === 'lachs_zucht') hasLachsstation = true;
        if (t.terrain === 'Auwald') auwaldCount++;
      }
    }

    const isBiberPlanLearnt = resTree.find(r => r.id === 'biber_management')?.unlocked || false;
    const isLachsProgLearnt = resTree.find(r => r.id === 'lachs_nrw')?.unlocked || false;

    setSpeciesList(prev => {
      return prev.map(sp => {
        let progress = sp.currentProgress;

        if (sp.id === 'bachforelle') {
          // req: WRRL <= 3.5, Kiesbett built
          let metCount = 0;
          if (wrrl <= 3.5) metCount += 50;
          if (hasKieslaich) metCount += 50;
          progress = metCount;
        } 
        else if (sp.id === 'biber') {
          // req: 2 auwald, Biber plan researched
          let metCount = 0;
          if (auwaldCount >= 2) metCount += 50;
          if (isBiberPlanLearnt) metCount += 50;
          progress = metCount;
        }
        else if (sp.id === 'feuerfalter') {
          // req: 2 Blühstreifen, FFH potential >= 45
          let metCount = 0;
          if (hasBlühstreifen >= 2) metCount += 50;
          if (ffh >= 45) metCount += 50;
          progress = metCount;
        }
        else if (sp.id === 'eisvogel') {
          // req: Ufer-entfesselung, WRRL <= 2.8, Trout unlocked
          const troutUnlocked = prev.find(s => s.id === 'bachforelle')?.unlocked || false;
          let metCount = 0;
          if (hasUferEntfesselung) metCount += 40;
          if (wrrl <= 2.8) metCount += 30;
          if (troutUnlocked) metCount += 30;
          progress = metCount;
        }
        else if (sp.id === 'lachs') {
          // req: Continuity >= 60, Schoellershammer not PRODUCTION, Lachs breeding built, Research Lachs done
          let metCount = 0;
          if (continuity >= 60) metCount += 25;
          if (mode !== 'PRODUCTION') metCount += 25;
          if (hasLachsstation) metCount += 25;
          if (isLachsProgLearnt) metCount += 25;
          progress = metCount;
        }

        const isNowUnlocked = progress >= 100;
        const wasUnlocked = sp.unlocked;

        if (isNowUnlocked && !wasUnlocked) {
          // Reward Nature points on new unlock
          setTimeout(() => {
            setStats(st => ({
              ...st,
              naturePoints: st.naturePoints + 15
            }));
            
            let specificMessage = '';
            if (sp.id === 'bachforelle') {
              specificMessage = `🌿 BIO-ERFOLG: Die Errichtung von sauberen Kieslaichbetten und die verbesserte Gewässergüte tragen Früchte! Die Bachforelle & Groppe pflanzen sich wieder erfolgreich fort und beleben den Flusslauf. (+15 Naturpunkte)`;
            } else if (sp.id === 'biber') {
              specificMessage = `🌿 BIO-ERFOLG: Dank der dichten Auenwälder und des präventiven Konfliktmanagements ist der Eurasische Biber dauerhaft im Rurtal heimisch geworden! Er gestaltet ab sofort aktiv neue Nebengewässer. (+15 Naturpunkte)`;
            } else if (sp.id === 'feuerfalter') {
              specificMessage = `🌿 BIO-ERFOLG: Durch die neuen Insektenhotels, naturnahen Blühstreifen und ein hervorragendes regionales FFH-Potenzial glänzt der seltene Blauschillernde Feuerfalter wieder auf unseren extensiven Feuchtwiesen! (+15 Naturpunkte)`;
            } else if (sp.id === 'eisvogel') {
              specificMessage = `🌿 BIO-ERFOLG: Sensationelle Rückkehr! Die Ufer-Entfesselung schafft ungehinderte Prallhänge, auf denen sich der farbenprächtige Eisvogel seine Brutröhren gräbt und im fischreichen, klaren Fluss jagt. (+15 Naturpunkte)`;
            } else if (sp.id === 'lachs') {
              specificMessage = `🌿 ULTIMATIVER RENATURIERUNGS-ERFOLG: Meisterleistung im Artenschutz! Der freie Wanderkorridor, die Aufzuchthilfe und die umweltgerechte Ausrichtung des Gesamtgewässers ermöglichen dem Atlantischen Lachs die historische Rückkehr von der Nordsee direkt in die Eifelrur! (+15 Naturpunkte)`;
            } else {
              specificMessage = `🌿 ARTENSCHUTZ-ERFOLG: Der '${sp.name}' hat sich im Rurtal angesiedelt! (+15 Naturpunkte)`;
            }
            
            addLog(specificMessage, 'success');
          }, 50);
        }

        return {
          ...sp,
          currentProgress: progress,
          unlocked: isNowUnlocked
        };
      });
    });
  };

  // --- Dynamic check for neighboring Rurtalbahn Station discount ---
  const hasRurtalbahnStationNearby = (x: number, y: number): boolean => {
    // Check radius 2 tiles
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
          if (grid[ty][tx]?.buildingId === 'rurtalbahn_halt') {
            return true;
          }
        }
      }
    }
    return false;
  };

  // --- Dynamic highlight calculations during building selection ---
  const checkRurtalbahnDiscountActiveOnMap = useMemo(() => {
    if (!selectedBuilding) return false;
    // Inspect if any station is active on grid
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y] && grid[y][x]?.buildingId === 'rurtalbahn_halt') {
          return true;
        }
      }
    }
    return false;
  }, [selectedBuilding, grid]);

  // --- Action Slots Execution Card click ---
  const handleExecuteCard = (card: ActionCard, strength: number) => {
    addLog(`Führe Aktion '${card.name}' mit Stärke ${strength} aus.`, 'info');

    if (!seenTips.includes('actionCard') && !showTutorial) {
      setActiveTip({
        id: 'actionCard',
        title: 'Aktionskarten & Stärke!',
        icon: '🃏',
        text: `Du hast deine erste Aktionskarte '${card.name}' ausgespielt! Beachte: Je länger eine Karte in einem der drei Aktionsslots liegen bleibt, desto weiter steigt ihre Stärke an (von 1 bis maximal 5). Nutze diese Stärkesynergie für extrem wirkungsvolle Aktionen!`
      });
      setSeenTips(prev => [...prev, 'actionCard']);
    }

    // Pay lease toll duration ticker if active
    if (rurtalbahnLeased) {
      const nextRemaining = rurtalbahnTimeRemaining - 1;
      setRurtalbahnTimeRemaining(nextRemaining);
      if (nextRemaining <= 0) {
        setRurtalbahnLeased(false);
        // Recover previous card back to Slot 1 position
        if (preLeaseCard) {
          setCards(prev => {
            const nextList = prev.filter(c => c.id !== 'rurtalbahn_card');
            return [preLeaseCard, ...nextList];
          });
          addLog('Rurtalbahn Charterverkehr beendet. Standard-Aktionskarte wieder bereit.', 'info');
        }
      }
    }

    if (card.id === 'rurtalbahn_card') {
      // Specialized Rurtalbahn trigger
      executeRurtalbahnAction(strength);
      rotateActionSlots(card.id);
      return;
    }

    switch (card.type) {
      case 'BUILD':
        // Prompts map focus
        addLog('Wähle ein Gebäude aus dem Baustoff-Katalog rechts und klicke auf ein passendes Flurtile der Karte.', 'info');
        setActiveTab('map');
        break;

      case 'PLANT':
        executePlantAction(strength);
        rotateActionSlots(card.id);
        break;

      case 'HYDROLOGY':
        executeHydrologyAction(strength);
        rotateActionSlots(card.id);
        break;

      case 'FUNDING':
        executeFundingAction(strength);
        rotateActionSlots(card.id);
        break;

      case 'RESEARCH':
        executeResearchAction(strength);
        rotateActionSlots(card.id);
        break;
    }
  };

  const rotateActionSlots = (playedCardId: string) => {
    setCards(prev => {
      const playedCard = prev.find(c => c.id === playedCardId);
      if (!playedCard) return prev;
      // remove and prepend to slot 0 (Strength 1 index)
      const remaining = prev.filter(c => c.id !== playedCardId);
      return [playedCard, ...remaining];
    });
  };

  // --- CARD EXECUTIONS IMPLEMENTATION ---

  const executePlantAction = (strength: number) => {
    // Perform bulk auto values of plant conversion
    let converted = 0;
    setGrid(prev => {
      const nextGrid = prev.map(row => 
        row.map(tile => {
          // Convert intensive farming fields into damp meadows
          if (tile.terrain === 'Acker' && !tile.buildingId && converted < strength) {
            converted++;
            return {
              ...tile,
              terrain: 'Wiese' as TerrainType,
              ffh_value: Math.min(100, tile.ffh_value + 20),
              wrrl_quality: Math.max(1.0, tile.wrrl_quality - 0.5)
            };
          }
          // Strength 3+ converts meadows to rich Alluvial Auwald tree buffers
          if (tile.terrain === 'Wiese' && !tile.buildingId && strength >= 3 && converted < 1) {
            converted++;
            return {
              ...tile,
              terrain: 'Auwald' as TerrainType,
              ffh_value: Math.min(100, tile.ffh_value + 35),
              moisture: Math.min(100, tile.moisture + 30),
              flood_risk: Math.max(0, tile.flood_risk - 15)
            };
          }
          return tile;
        })
      );
      updateGlobalMetrics(nextGrid, stats.paperFactoryMode, researchTree);
      return nextGrid;
    });

    if (converted > 0) {
      setStats(prev => ({ 
        ...prev, 
        naturePoints: prev.naturePoints + (converted * 2),
        climateRisk: Math.max(0, prev.climateRisk - (converted * 2))
      }));
      addLog(`🌱 ERFOLG: ${converted} Gewässer-Flurstücke erfolgreich bepflanzt/renaturiert! (+${converted * 2} Naturpunkte, Klimarisiko gesenkt)`, 'success');
    } else {
      addLog('Keine freien Acker- oder Wiesenflächen im Einzugsgebiet gefunden.', 'warning');
    }
  };

  const executeHydrologyAction = (strength: number) => {
    // Hydrology expands water values
    const flowBoost = strength * 4;
    setGrid(prev => {
      const nextGrid = prev.map(row => 
        row.map(tile => {
          if (tile.terrain === 'Water') {
            return {
              ...tile,
              wrrl_quality: Math.max(1.0, tile.wrrl_quality - (strength * 0.15)),
              ffh_value: Math.min(100, tile.ffh_value + (strength * 2.5))
            };
          }
          return tile;
        })
      );
      updateGlobalMetrics(nextGrid, stats.paperFactoryMode, researchTree);
      return nextGrid;
    });

    setStats(prev => ({
      ...prev,
      naturePoints: prev.naturePoints + Math.floor(strength / 2),
      climateRisk: Math.max(0, prev.climateRisk - strength)
    }));
    addLog(`🌊 Hydrologische Gewässerstruktur verbessert. Durchgängigkeit gesteigert um +${flowBoost}%. Klimapuffer ausgedehnt.`, 'success');
  };

  const executeFundingAction = (strength: number) => {
    let budgetReward = 3;
    let researchReward = 0;
    
    if (strength === 2) budgetReward = 6;
    else if (strength === 3) budgetReward = 9;
    else if (strength === 4) { budgetReward = 12; researchReward = 1; }
    else if (strength === 5) { budgetReward = 16; researchReward = 2; }

    setStats(prev => ({
      ...prev,
      budget: prev.budget + budgetReward,
      researchPoints: prev.researchPoints + researchReward
    }));
    addLog(`💶 Förderung bewilligt: +${budgetReward} € finanzielle Zulagen erhalten! ${researchReward > 0 ? `(+${researchReward} 🧪 Forschung)` : ''}`, 'success');
  };

  const executeResearchAction = (strength: number) => {
    let researchPoints = strength;
    let naturePoints = 0;

    if (strength === 3) { researchPoints = 3; naturePoints = 1; }
    else if (strength === 4) { researchPoints = 5; naturePoints = 2; }
    else if (strength === 5) { researchPoints = 7; naturePoints = 4; }

    setStats(prev => ({
      ...prev,
      researchPoints: prev.researchPoints + researchPoints,
      naturePoints: prev.naturePoints + naturePoints
    }));
    addLog(`🧪 Forschung abgeschlossen: +${researchPoints} Forschungspunkte generiert. ${naturePoints > 0 ? `(+${naturePoints} 🌿 Naturpunkte)` : ''}`, 'success');
  };

  // --- RURTALBAHN TICKET ACTIONS SPECIAL CARD ---
  const executeRurtalbahnAction = (strength: number) => {
    if (stats.paperFactoryMode === 'PRODUCTION') {
      addLog('❌ AKTION SCHIENEN-SPERRUNG: Die Papierfabrik blockiert mit schweren Güterzügen das Gleisbett im Produktionsmodus! Aktion fehlgeschlagen.', 'error');
      return;
    }

    if (strength === 1) {
      setStats(prev => ({ ...prev, budget: prev.budget + 2 }));
      addLog('🚇 BAHN-EXPRESS: Materialtransport per Trasse abgewickelt (+2 € Ersparnis).', 'info');
    } 
    else if (strength === 2) {
      setStats(prev => ({ ...prev, budget: prev.budget + 3, naturePoints: prev.naturePoints + 1 }));
      addLog('🚇 BAHN-TOURISMUS: Ausflugskampagne Rur-Radweg erfolgreich durchgeführt (+3 € Ticketverkauf, +1 🌿).', 'success');
    }
    else if (strength === 3) {
      // Free or cheap Rurtalbahn construction triggered
      setStats(prev => ({ ...prev, budget: prev.budget + 3 })); // cash refund
      addLog('🚇 BAHN-SCHIENE: Schienenausbau NRW subventioniert. Du erhältst +3 € Rabatt für deinen nächsten Haltepunkt!', 'success');
    }
    else if (strength === 4) {
      setStats(prev => ({ ...prev, naturePoints: prev.naturePoints + 6 }));
      addLog('🚇 BAHN-KLIMA: Pendlerkampagne senkt CO2 Belastung (+6 Natur-Anerkennungen).', 'success');
    }
    else {
      // Strength 5 research bonus
      setStats(prev => ({ ...prev, researchPoints: prev.researchPoints + 4 }));
      addLog('🚇 BAHN-AKADEMIE: Sonderfahrt der RWTH Aachen Gewässerökologen fördert Analysen (+4 🧪).', 'success');
    }
  };

  const handleLeaseRurtalbahn = () => {
    if (stats.budget < 2) {
      addLog('Nicht genügend Guthaben (€) für Rurtalbahn Ticketleasing.', 'error');
      return;
    }

    const firstCard = cards[0];
    if (firstCard.id === 'rurtalbahn_card') {
      addLog('Die Rurtalbahn-Aktionskarte ist bereits im Slot-Rack aktiv.', 'warning');
      return;
    }

    setPreLeaseCard(firstCard);
    setRurtalbahnLeased(true);
    setRurtalbahnTimeRemaining(3); // available for 3 turns

    const rurCard: ActionCard = {
      id: 'rurtalbahn_card',
      type: 'RESEARCH', // dummy action type fallback
      name: '🚇 Rurtalbahn Sonderfahrt',
      description: 'Zusatz-Aktion zur Stärkung der Bahninfrastruktur und schnellen Logistik.',
      strengthEffects: {
        1: 'Sonderfahrt: Transportiere Kies & Baustoffe gratis (+2 €).',
        2: 'Pendlerkampagne: Steigere Tourismusauslastung (+3 €).',
        3: 'Infrastrukturausbau: Platziere nächsten Halt mit -3 € Rabatt!',
        4: 'Öko-Express: Steigere die regionale Akzeptanz (+6 Naturpunkte).',
        5: 'RWTH-Exkursion: Verbindet die Region akademisch (+4 Forschungspunkte).'
      }
    };

    setCards(prev => [rurCard, ...prev.slice(1)]);
    setStats(prev => ({ ...prev, budget: prev.budget - 2 }));
    addLog('🚇 Rurtalbahn Ticket gemietet (Kosten: 2 €). Ersetzt temporär den ersten Aktionsslot.', 'success');
  };

  // --- RESEARCH UNLOCK HANDLER ---
  const handleUnlockResearch = (nodeId: string) => {
    const node = researchTree.find(r => r.id === nodeId);
    if (!node) return;

    if (stats.researchPoints < node.cost) {
      addLog('Nicht genügend Forschungspunkte vorhanden.', 'error');
      return;
    }

    setResearchTree(prev => 
      prev.map(r => r.id === nodeId ? { ...r, unlocked: true } : r)
    );
    setStats(prev => ({
      ...prev,
      researchPoints: prev.researchPoints - node.cost,
      naturePoints: prev.naturePoints + 5
    }));
    addLog(`🔬 FORSCHUNG ERFOLG: '${node.name}' erforscht! Bonuseffekte jetzt permanent aktiv. (+5 Naturpunkte)`, 'success');
    
    // Recalculate metrics on new research benefits
    setTimeout(() => {
      updateGlobalMetrics(grid, stats.paperFactoryMode, researchTree.map(r => r.id === nodeId ? { ...r, unlocked: true } : r));
    }, 50);
  };

  // --- PAPER FACTORY MODES CHANGED ---
  const handleChangePaperFactoryMode = (mode: PaperFactoryMode) => {
    if (mode === 'RENATURIZATION') {
      const isResUnlocked = researchTree.find(r => r.id === 'schoeller_renat')?.unlocked;
      if (!isResUnlocked) {
        addLog('Umweltkonzept "Fabrik-Transformationskonzept" fehlt.', 'error');
        return;
      }
    }

    setStats(prev => ({
      ...prev,
      paperFactoryMode: mode
    }));
    addLog(`🏭 SCHOELLERSHAMMER: Modus geändert auf '${mode === 'PRODUCTION' ? 'Vollbetrieb' : mode === 'RETROFITTING' ? 'Umrüstung' : mode === 'SHUTDOWN' ? 'Stilllegung' : 'Forschungspark'}'.`, 'info');
    
    // Trigger immediate water change shifts
    setTimeout(() => {
      updateGlobalMetrics(grid, mode, researchTree);
    }, 50);
  };

  // --- MAP TILE INTERACTION & BUILDING CONSTRUCTION ---
  const handleTileClick = (x: number, y: number) => {
    const targetTile = grid[y][x];

    // IF Demolish tool is active
    if (isDemolishMode) {
      if (!targetTile.buildingId) {
        addLog('Dieses Tile besitzt kein Gebäude zum Absaugen / Rückbau.', 'warning');
        return;
      }
      if (targetTile.buildingId === 'schoellershammer') {
        addLog('Die historische Papierfabrik Schoellershammer kann nicht abgerissen, sondern nur umgerüstet werden!', 'error');
        return;
      }

      setGrid(prev => {
        const nextGrid = prev.map((row, ry) => 
          row.map((tile, rx) => {
            if (rx === x && ry === y) {
              return {
                ...tile,
                buildingId: null,
                terrain: tile.baseTerrain // restore previous state
              };
            }
            return tile;
          })
        );
        updateGlobalMetrics(nextGrid, stats.paperFactoryMode, researchTree);
        return nextGrid;
      });

      addLog(`Rückbau-Erfolg auf Feld (${x}, ${y}) abgeschlossen. Terrain regeneriert.`, 'info');
      setIsDemolishMode(false);
      return;
    }

    if (!selectedBuilding) {
      if (targetTile.buildingId) {
        const matchedBuilding = BUILDIONS_CATALOG.find(b => b.id === targetTile.buildingId);
        if (matchedBuilding) {
          setSelectedTileInfo({ x, y, building: matchedBuilding, tile: targetTile });
          addLog(`Gebäudeinspektion: '${matchedBuilding.name}' auf Feld (${x}, ${y}) ausgewählt.`, 'info');
          return;
        }
      }
      setSelectedTileInfo(null);
      addLog(`Feld Details (${x}, ${y}): Boden: ${targetTile.terrain}, WRRL Flussqualität: ${targetTile.wrrl_quality.toFixed(1)}, FFH Potential: ${targetTile.ffh_value}%`, 'info');
      return;
    }

    // Attempt building construction
    const building = selectedBuilding;

    // 1. Terrain compliance checks
    if (!building.allowedTerrains.includes(targetTile.terrain)) {
      addLog(`❌ BAUFEHLER: '${building.name}' kann nicht auf Untergrund '${targetTile.terrain}' errichtet werden.`, 'error');
      return;
    }

    if (building.isRiverOnly && targetTile.terrain !== 'Water') {
      addLog(`❌ BAUFEHLER: '${building.name}' kann nur direkt IM Flussbett platziert werden.`, 'error');
      return;
    }

    if (building.isRiverAdjacentOnly) {
      // check neighboring tile is water
      let isAdjacent = false;
      const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
      for (const [dx, dy] of dirs) {
        const tx = x + dx;
        const ty = y + dy;
        if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
          if (grid[ty][tx]?.terrain === 'Water') {
            isAdjacent = true;
            break;
          }
        }
      }
      if (!isAdjacent) {
        addLog(`❌ BAUFEHLER: '${building.name}' verlangt eine direkte Angrenzung an den Rur-Flusslauf.`, 'error');
        return;
      }
    }

    if (targetTile.buildingId) {
      addLog('❌ BAUFEHLER: Dieses Flurstück ist bereits bebaut.', 'error');
      return;
    }

    // 2. Budget cost calculations (Rurtalbahn station rebate & active cards rebates)
    const activeBuildCardIdx = cards.findIndex(c => c.type === 'BUILD');
    // strength of active card acts as budget discounts
    const buildStrength = activeBuildCardIdx !== -1 ? activeBuildCardIdx + 1 : 1;

    let costLimit = 4;
    if (buildStrength === 2) costLimit = 6;
    else if (buildStrength === 3) costLimit = 8;
    else if (buildStrength === 4) costLimit = 10;
    else if (buildStrength === 5) costLimit = 100; // unlimited cost

    if (building.cost > costLimit) {
      addLog(`❌ BAUFEHLER: Deine 'Bauen'-Karte liegt auf einer zu geringen Stärke (${buildStrength}) für dieses Gebäude (benötigt eine Baukostenfreigabe von mindestens ${building.cost} €).`, 'error');
      return;
    }

    let constructRebate = 0;
    if (buildStrength === 3 || buildStrength === 4) constructRebate = 1;
    else if (buildStrength === 5) constructRebate = 2;

    const railwayDiscount = hasRurtalbahnStationNearby(x, y);
    const finalRebate = constructRebate + (railwayDiscount ? 1 : 0);
    const finalCost = Math.max(1, building.cost - finalRebate);

    if (stats.budget < finalCost) {
      addLog(`❌ BAUFEHLER: Unzureichendes Guthaben. Erfordert ${finalCost} € (Rabatt eingerechnet).`, 'error');
      return;
    }

    // 3. Complete placement
    setGrid(prev => {
      const nextGrid = prev.map((row, ry) => 
        row.map((tile, rx) => {
          if (rx === x && ry === y) {
            // Apply special building side-effects on tile
            let updatedFfh = tile.ffh_value;
            let updatedWrrl = tile.wrrl_quality;

            if (building.id === 'altarm') {
              updatedFfh = Math.min(100, updatedFfh + 25);
              updatedWrrl = Math.max(1.0, updatedWrrl - 0.5);
            }
            if (building.id === 'auenwald') {
              updatedFfh = Math.min(100, updatedFfh + 30);
            }
            if (building.id === 'besucherzentrum') {
              updatedFfh = Math.min(100, updatedFfh + 10);
            }
            if (building.id === 'campingplatz') {
              updatedFfh = Math.max(0, updatedFfh - 5);
            }
            if (building.id === 'kanuverleih') {
              updatedWrrl = Math.min(5.0, updatedWrrl + 0.1);
            }

            return {
              ...tile,
              buildingId: building.id,
              ffh_value: updatedFfh,
              wrrl_quality: updatedWrrl
            };
          }
          return tile;
        })
      );
      updateGlobalMetrics(nextGrid, stats.paperFactoryMode, researchTree);
      return nextGrid;
    });

    setStats(prev => ({
      ...prev,
      budget: prev.budget - finalCost,
      naturePoints: prev.naturePoints + 3,
      climateRisk: Math.max(0, prev.climateRisk - (building.category === 'ecology' || building.category === 'water' ? 3 : 0))
    }));

    addLog(`🏗️ ERFOLG: '${building.name}' auf Feld (${x}, ${y}) errichtet. Kosten: ${finalCost} € (Rabatt: -${finalRebate} €)`, 'success');
    setSelectedBuilding(null); // Clear selected placement shadow

    // Rotate action slots for BUILD card only on successful placement
    if (activeBuildCardIdx !== -1) {
      rotateActionSlots(cards[activeBuildCardIdx].id);
    }
  };

  const handleUpgradeBuilding = (x: number, y: number, researchCost: number) => {
    // 1. Check if we have enough research points
    if (stats.researchPoints < researchCost) {
      addLog(`❌ UPGRADE-FEHLER: Unzureichende Forschungspunkte. Erfordert ${researchCost} 🧪 (erhalten: ${stats.researchPoints} 🧪).`, 'error');
      return;
    }

    // 2. Identify target tile and building
    const targetTile = grid[y]?.[x];
    if (!targetTile || !targetTile.buildingId) {
      addLog('❌ UPGRADE-FEHLER: Kein Gebäude auf diesem Sektor vorhanden.', 'error');
      return;
    }

    const building = BUILDIONS_CATALOG.find(b => b.id === targetTile.buildingId);
    if (!building) return;

    // 3. Increment upgradeLevel
    const currentLevel = targetTile.upgradeLevel || 1;
    if (currentLevel >= 3) {
      addLog(`❌ UPGRADE-FEHLER: '${building.name}' hat bereits die maximale Upgrade-Stufe (Stufe 3) erreicht.`, 'warning');
      return;
    }

    const nextLevel = currentLevel + 1;

    setGrid(prev => {
      const nextGrid = prev.map((row, ry) =>
        row.map((tile, rx) => {
          if (rx === x && ry === y) {
            // Apply upgrade bonus to this tile
            let updatedFfh = Math.min(100, tile.ffh_value + 15);
            let updatedWrrl = Math.max(1.0, tile.wrrl_quality - 0.5);
            
            return {
              ...tile,
              upgradeLevel: nextLevel,
              ffh_value: updatedFfh,
              wrrl_quality: updatedWrrl,
            };
          }
          return tile;
        })
      );
      updateGlobalMetrics(nextGrid, stats.paperFactoryMode, researchTree);
      return nextGrid;
    });

    // 4. Deduct research points and add logs
    setStats(prev => ({
      ...prev,
      researchPoints: prev.researchPoints - researchCost,
      naturePoints: prev.naturePoints + 15
    }));

    addLog(`🚀 UPGRADE ERFOLGREICH: '${building.name}' im Sektor (${x}, ${y}) wurde auf Stufe ${nextLevel} aufgewertet! Kosten: ${researchCost} 🧪 (+15 Naturpunkte, FFH +15%, WRRL verbessert)`, 'success');

    // Update selectedTileInfo if it is currently inspected to reflect immediate changes
    setSelectedTileInfo(prev => {
      if (prev && prev.x === x && prev.y === y) {
        return {
          ...prev,
          tile: {
            ...prev.tile,
            upgradeLevel: nextLevel,
            ffh_value: Math.min(100, prev.tile.ffh_value + 15),
            wrrl_quality: Math.max(1.0, prev.tile.wrrl_quality - 0.5)
          }
        };
      }
      return prev;
    });
  };

  // --- ADVANCE NEXT ROUND/YEAR TURNS ---
  const handleNextRound = () => {
    // 1. Calculate and advance seasons
    const nextRound = stats.round + 1;
    const yearShift = Math.floor((nextRound - 1) / 4);
    const nextYear = 2026 + yearShift;

    // Seasons tracker (Spring, Summer, Autumn, Winter)
    const seasonsList = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
    const seasonIndex = (nextRound - 1) % 4;
    const currentSeason = seasonsList[seasonIndex];

    addLog(`--- Rundenwechsel --- Jahreszeit: ${currentSeason} ${nextYear} gestartet.`, 'info');

    // 2. Resource Accumulation (Budget/Tax revenue & operational expenses)
    let dynamicRevenue = 5; // base citizen municipal tax
    let totalExpense = 0;

    // Loop grid for passive incomes & maintenance fees
    grid.forEach(row => {
      row.forEach(t => {
        if (t.buildingId) {
          const match = BUILDIONS_CATALOG.find(b => b.id === t.buildingId);
          if (match) {
            totalExpense += match.maintenance;
            
            // special income rules
            if (match.id === 'oeko_tourismus') dynamicRevenue += 2;
            if (match.id === 'besucherzentrum') dynamicRevenue += 4;
            if (match.id === 'campingplatz') dynamicRevenue += 3;
            if (match.id === 'kanuverleih') dynamicRevenue += 2;
            if (match.id === 'wasserkraft') dynamicRevenue += 5;
            if (match.id === 'intensiv_farm') dynamicRevenue += 8;
            if (match.id === 'extensive_weide') dynamicRevenue += 2;
          }
        }
      });
    });

    // Paper factory budgets
    let factoryTaxRevenue = 0;
    if (stats.paperFactoryMode === 'PRODUCTION') {
      factoryTaxRevenue = 15;
    } else if (stats.paperFactoryMode === 'RETROFITTING') {
      factoryTaxRevenue = 5;
      totalExpense += 3;
    } else if (stats.paperFactoryMode === 'SHUTDOWN') {
      factoryTaxRevenue = 0;
      totalExpense += 2;
    } else if (stats.paperFactoryMode === 'RENATURIZATION') {
      factoryTaxRevenue = 0;
      totalExpense += 3;
    }

    // Sewage treatment upgrade or modern research free operation
    const isModernSewageFree = researchTree.find(r => r.id === 'mikroschadstoffe')?.unlocked || false;
    let netMaintenance = totalExpense;
    if (isModernSewageFree) {
      // Find all upgrades and deduct maintenance
      const upgradesCount = grid.flat().filter(t => t.buildingId === 'klaerwerk_upgrade').length;
      netMaintenance = Math.max(0, totalExpense - (upgradesCount * 3));
    }

    const netYield = dynamicRevenue + factoryTaxRevenue - netMaintenance;

    // 3. Passive Science & Nature points triggers
    let passiveResearch = 0;
    let passiveNature = 0;

    // Info center triggers
    const centerBuilt = grid.flat().some(t => t.buildingId === 'natura_zentrum');
    if (centerBuilt) {
      passiveResearch += 1;
      passiveNature += 3;
    }
    const biberStations = grid.flat().filter(t => t.buildingId === 'biber_station').length;
    passiveNature += biberStations * 2;

    const lachsStations = grid.flat().filter(t => t.buildingId === 'lachs_zucht').length;
    passiveNature += lachsStations * 3;

    const besucherZentren = grid.flat().filter(t => t.buildingId === 'besucherzentrum').length;
    passiveNature += besucherZentren * 2;

    if (stats.paperFactoryMode === 'RETROFITTING') {
      passiveResearch += 1;
    }

    // Global native Climate risk escalation (2% per round due to global shift counters, mitigated by Auwalds)
    const auwaldPlanted = grid.flat().filter(t => t.terrain === 'Auwald').length;
    const climateDamper = Math.max(0.5, 2.0 - (auwaldPlanted * 0.25));

    // Update state stats
    setStats(prev => ({
      ...prev,
      round: nextRound,
      year: nextYear,
      budget: Math.max(0, prev.budget + netYield),
      researchPoints: prev.researchPoints + passiveResearch,
      naturePoints: prev.naturePoints + passiveNature,
      climateRisk: Math.min(100, Math.max(0, prev.climateRisk + Math.round(climateDamper)))
    }));

    addLog(`Finanzlage: Steuereinnahmen +${dynamicRevenue + factoryTaxRevenue} € erhalten, Instandhaltung -${netMaintenance} € abgezogen (Netto: ${netYield} €).`, 'info');
    if (passiveResearch > 0 || passiveNature > 0) {
      addLog(`Rurtal-Ertrag: +${passiveResearch} 🧪 Forschung, +${passiveNature} 🌿 Artenschutz-Erkenntnisse gesammelt.`, 'success');
    }

    // 4. Annual climate check checks at beginning of summer (each turn index 2)
    if (seasonIndex === 1) {
      resolveAnnualClimateEvents(nextRound, stats.climateRisk);
    }

    // Refresh metrics for safety
    updateGlobalMetrics(grid, stats.paperFactoryMode, researchTree);
  };

  const resolveAnnualClimateEvents = (roundNum: number, currentRisk: number) => {
    // Check constraints to trigger random event cards
    const roll = Math.random() * 100;
    
    if (currentRisk >= 35 && roll < 50) {
      // Century flood trigger
      const floodEvent = CLIMATE_EVENTS_DATA.find(e => e.id === 'hochwasser');
      if (floodEvent) {
        setActiveEvent({ ...floodEvent, active: true });
        addLog(`🚨 KLIMA-ALARM: ${floodEvent.name}! Sektor-Überflutungen drohen.`, 'error');
      }
    } 
    else if (currentRisk >= 40 && roll >= 50 && roll < 85) {
      // Drought trigger
      const droughtEvent = CLIMATE_EVENTS_DATA.find(e => e.id === 'duerre');
      if (droughtEvent) {
        setActiveEvent({ ...droughtEvent, active: true });
        addLog(`🚨 KLIMA-ALARM: ${droughtEvent.name}! Flusspegel sinken auf Rekordtiefststände.`, 'error');
        // Apply temporary WRRL damage
        setGrid(prev => prev.map(row => row.map(t => t.terrain === 'Water' ? { ...t, wrrl_quality: Math.min(5.0, t.wrrl_quality + 1.2) } : t)));
      }
    }
    else if (speciesList.find(s => s.id === 'biber')?.unlocked && roll > 85) {
      const beaverConflict = CLIMATE_EVENTS_DATA.find(e => e.id === 'biber_schaden');
      if (beaverConflict) {
        setActiveEvent({ ...beaverConflict, active: true });
        addLog(`🐿️ KONFLIKT-MELDUNG: Biber sorgt für geflutete Agrarflächen.`, 'warning');
      }
    }
  };

  const handleResolveEvent = (decision: 'pay' | 'ignore' | 'eco') => {
    if (!activeEvent) return;

    if (activeEvent.id === 'hochwasser') {
      // Flood mitigation: check if player has built Polder or relocated dikes
      const hasDeich = grid.flat().some(t => t.buildingId === 'deichrueck');
      const hasPolder = grid.flat().some(t => t.buildingId === 'polder');
      const isAuenEffTech = researchTree.find(r => r.id === 'auen_vitalisierung')?.unlocked || false;

      if (hasDeich || (hasPolder && isAuenEffTech)) {
        addLog('🛡️ HOCHWASSERSCHUTZ ERFOLGREICH: Deine errichteten Retentionsräume und Deichrückverlegungen fangen die Flutwelle sicher ab! Keine Gebäudeschäden im Kreis Düren.', 'success');
        setStats(prev => ({ ...prev, naturePoints: prev.naturePoints + 10 }));
      } else {
        // Punish player
        setStats(prev => ({ ...prev, budget: Math.max(0, prev.budget - 12) }));
        addLog('❌ FLUT-KATASTROPHE: Fehlende Deichrückverlegungen oder Polder führen zu Überschwemmungen in städtischen Sektoren. Reparaturen kosten dich -12 €.', 'error');
      }
    } 
    else if (activeEvent.id === 'duerre') {
      // Drought summer
      if (decision === 'pay') {
        setStats(prev => ({ ...prev, budget: Math.max(0, prev.budget - 4) }));
        addLog('💧 DÜRRESHIELD: Du leitest Notflutungen aus den Rurtalsperren ein. Störfaktoren stabilisiert (-4 €).', 'info');
      } else {
        setStats(prev => ({ ...prev, naturePoints: Math.max(0, prev.naturePoints - 8) }));
        addLog('❌ SCHWERE IMPAKTE: Fischsterben am Unterlauf der Rur zerstört regionale Artenpopulationen (-8 Artenschutz-Punkte).', 'error');
      }
    }
    else if (activeEvent.id === 'biber_schaden') {
      const isManagementActive = researchTree.find(r => r.id === 'biber_management')?.unlocked || false;

      if (decision === 'pay') {
        const fee = isManagementActive ? 3 : 6;
        setStats(prev => ({ ...prev, budget: Math.max(0, prev.budget - fee), naturePoints: prev.naturePoints + 5 }));
        addLog(`🐿️ BIBERSCHUTZ STARK: Schadensersatz gezahlt (${fee} €). Biberbauten bleiben unangetastet (+5 🌿).`, 'success');
      } else {
        // Demolish beaver dams, lower beaver progression
        setSpeciesList(prev => prev.map(s => s.id === 'biber' ? { ...s, currentProgress: Math.max(0, s.currentProgress - 30), unlocked: false } : s));
        addLog('❌ BIBER-DAMMRÜCKBAU: Der Biberdamm wurde entfernt. Das schädigt das Artenschutz-Verhältnis nachhaltig (-30% Biber-Prozess).', 'error');
      }
    }

    setActiveEvent(null);
  };

  const handleTriggerPdfSim = () => {
    setPdfSimulated(true);
    addLog('Sustainability Balance Sheet PDF for district Düren was generated successfully.', 'success');
  };

  const handleRestartGame = () => {
    if (window.confirm('Möchtest du die Simulation wirklich zurücksetzen? Alle Fortschritte gehen verloren.')) {
      setGrid(initGrid());
      setCards([...INITIAL_ACTION_CARDS]);
      setResearchTree([...RESEARCH_TECH_TREE]);
      setSpeciesList([...BIOTOP_SPECIES]);
      setStats({
        round: 1,
        year: 2026,
        budget: 25,
        researchPoints: 3,
        naturePoints: 0,
        globalWrrl: 3.6,
        globalFfh: 25,
        continuity: 30,
        climateRisk: 15,
        paperFactoryMode: 'PRODUCTION',
        rurtalbahnSlotsUsed: 0
      });
      setActiveEvent(null);
      setRurtalbahnLeased(false);
      setPdfSimulated(false);
      setSelectedTileInfo(null);
      addLog('Simulation zurückgesetzt.', 'info');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || feedbackSending) return;
    setFeedbackSending(true);
    setFeedbackError('');
    try {
      const result = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: feedbackName.trim() || 'Anonym',
          message: feedbackText.trim(),
          to_email: 'rurnatur@proton.me',
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      console.log('EmailJS Antwort:', result);
      setFeedbackSubmitted(true);
      setFeedbackText('');
      setFeedbackName('');
    } catch (e: any) {
      console.error('EmailJS Fehler:', e);
      setFeedbackError(`Fehler: ${e?.text || e?.message || JSON.stringify(e)}`);
    } finally {
      setFeedbackSending(false);
    }
  };

  // --- Seasons indicator string helper ---
  const currentSeasonString = useMemo(() => {
    const seasonsList = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
    return seasonsList[(stats.round - 1) % 4];
  }, [stats.round]);

  return (
    <div className="min-h-screen bg-brand-bg text-[#2C3322] flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* Page Header Bar */}
      <header className="bg-white border-b border-brand-lightsky/25 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 shadow-sm">
        
        {/* RUR NATUR Logo & Brand Title */}
        <div className="flex items-center gap-3.5 select-none">
          <svg className="w-11 h-11 shrink-0 drop-shadow-sm" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 50 C10 15, 50 10, 85 20 C90 55, 65 85, 50 90 C35 90, 10 75, 10 50 Z" fill="#4A7A3A" />
            <path d="M85 20 C60 25, 50 45, 30 50 C15 52, 22 65, 35 70 C55 65, 60 40, 85 20 Z" fill="#2A6F7E" />
            <path d="M85 20 C68 23, 58 41, 38 48 C28 49, 31 56, 42 63 C58 56, 62 38, 85 20 Z" fill="#7FA8B5" />
            <path d="M85 20 C73 22, 65 37, 45 44 C38 45, 40 50, 48 56 C62 50, 67 33, 85 20 Z" fill="#ECEDEF" />
          </svg>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5 -mb-1">
              <span className="text-2xl font-black tracking-tight text-[#3A3F45] font-display">RUR</span>
              <span className="text-2xl font-semibold tracking-tight text-brand-green font-display">NATUR</span>
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#2A6F7E] uppercase font-display leading-none">
              RENATURIERUNGS-SIMULATOR
            </span>
          </div>
        </div>

        {/* Global Statistics Indicators */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 bg-[#F2EDE4]/65 border border-brand-lightsky/20 p-2.5 rounded-xl text-xs">
          
          <div className="flex items-center gap-2 px-2 border-r border-[#D4CCBA]/50">
            <Coins className="w-4 h-4 text-brand-green" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-[#8B8273] leading-none">GUTHABEN</div>
              <div className="text-brand-dark font-black text-sm tracking-tight">{stats.budget} €</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2 border-r border-[#D4CCBA]/50">
            <Zap className="w-4 h-4 text-brand-teal animate-pulse" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-[#8B8273] leading-none">FORSCHUNG</div>
              <div className="text-brand-dark font-black text-sm tracking-tight">{stats.researchPoints} 🧪</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2 border-r border-[#D4CCBA]/50">
            <Award className="w-4 h-4 text-[#BC6C25]" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-[#8B8273] leading-none">NATURPUNKTE</div>
              <div className="text-brand-dark font-black text-sm tracking-tight">{stats.naturePoints} 🌿</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2 border-r border-[#D4CCBA]/50">
            <Calendar className="w-4 h-4 text-[#3A3F45]" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-[#8B8273] leading-none">ZEITSCHRITT</div>
              <div className="text-brand-dark font-bold text-xs tracking-tight">
                {currentSeasonString} {stats.year}
              </div>
            </div>
          </div>

          {/* Core WRRL Quality Indicator */}
          <div className="flex items-center gap-2 px-2">
            <div className="p-1 rounded-full text-xs font-bold leading-none select-none bg-brand-lightsky/15">
              💧
            </div>
            <div className="text-left font-mono whitespace-nowrap">
              <div className="text-[10px] text-[#8B8273] leading-none">RUR WRRL QUALITÄT</div>
              <div className="text-brand-dark font-bold text-xs tracking-tight">
                {stats.globalWrrl.toFixed(2)} (
                {stats.globalWrrl <= 2.2 ? 'Spitzenklasse' :
                 stats.globalWrrl <= 2.8 ? 'Gut' :
                 stats.globalWrrl <= 3.5 ? 'Mäßig' : 'Kanalisiert'}
                )
              </div>
            </div>
          </div>

          {/* Save & Load Game Session Buttons */}
          <button
            onClick={saveGame}
            className="px-3.5 py-2.5 rounded-lg bg-[#E2EBD5] hover:bg-[#D3E0C1] text-[#2C3311] border border-[#B8C8A3] font-extrabold tracking-tight text-xs uppercase cursor-pointer duration-200 shadow-sm shrink-0 font-display transition-all transform active:scale-95 flex items-center gap-1.5"
            title="Aktuellen Fortschritt speichern"
          >
            <Save className="w-4 h-4 text-[#5A7247]" />
            Speichern
          </button>

          <button
            onClick={loadGame}
            className="px-3.5 py-2.5 rounded-lg bg-[#E5F2F5] hover:bg-[#D1E6EB] text-[#1D4E5B] border border-[#B0D3DC] font-extrabold tracking-tight text-xs uppercase cursor-pointer duration-200 shadow-sm shrink-0 font-display transition-all transform active:scale-95 flex items-center gap-1.5"
            title="Zuletzt gespeicherten Spielstand laden"
          >
            <FolderOpen className="w-4 h-4 text-[#2A6F7E]" />
            Laden
          </button>

          {/* Help & Tutorial button */}
          <button
            onClick={() => {
              setTutorialStep(0);
              setShowTutorial(true);
            }}
            className="px-3.5 py-2.5 rounded-lg bg-[#E8E2D6] hover:bg-[#DCD4C4] text-[#2C3311] border border-[#D4CCBA] font-extrabold tracking-tight text-xs uppercase cursor-pointer duration-200 shadow-sm shrink-0 font-display transition-all transform active:scale-95 flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-[#5A7247]" />
            Regeln
          </button>

          {/* Full Rulebook / Spielanleitung button */}
          <button
            onClick={() => setShowSpielanleitung(true)}
            className="px-3.5 py-2.5 rounded-lg bg-[#E2EBD5] hover:bg-[#D3E0C1] text-[#2C3311] border border-[#B8C8A3] font-extrabold tracking-tight text-xs uppercase cursor-pointer duration-200 shadow-sm shrink-0 font-display transition-all transform active:scale-95 flex items-center gap-1.5"
            title="Vollständige Spielanleitung öffnen"
          >
            <BookOpen className="w-4 h-4 text-[#5A7247]" />
            Spielanleitung
          </button>

          {/* Feedback button */}
          <button
            onClick={() => { setShowFeedback(true); setFeedbackSubmitted(false); }}
            className="px-3.5 py-2.5 rounded-lg bg-[#EDE8F5] hover:bg-[#E0D8F0] text-[#3D2C6E] border border-[#C8BAE8] font-extrabold tracking-tight text-xs uppercase cursor-pointer duration-200 shadow-sm shrink-0 font-display transition-all transform active:scale-95 flex items-center gap-1.5"
            title="Feedback zur Simulation geben"
          >
            <MessageSquare className="w-4 h-4 text-[#6B52AE]" />
            Feedback
          </button>

          {/* Advance Turn trigger button */}
          <button
            onClick={handleNextRound}
            className="px-4.5 py-2.5 rounded-lg bg-brand-green hover:bg-brand-green/90 text-white font-extrabold tracking-tight text-xs uppercase cursor-pointer duration-200 shadow-sm shrink-0 font-display transition-all transform active:scale-95"
          >
            Runde beenden ↩
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-grow flex flex-col md:flex-row gap-6 p-6 h-full overflow-hidden">
        
        {/* LEFT COLUMN: Isometric map Canvas & action card system */}
        <div className="flex-grow flex flex-col gap-6 w-full md:w-3/5">
          
          {/* Action slots System */}
          <ActionSlotSystem
            cards={cards}
            onExecuteCard={handleExecuteCard}
            rurtalbahnLeased={rurtalbahnLeased}
            leaseRurtalbahn={handleLeaseRurtalbahn}
            rurtalbahnTimeRemaining={rurtalbahnTimeRemaining}
          />

          {/* Interactive map display */}
          <div className="flex-grow rounded-xl relative min-h-[500px] shadow-lg">
            <IsometricMap
              grid={grid}
              onTileClick={handleTileClick}
              selectedBuilding={selectedBuilding}
              selectedLayer={selectedLayer}
              onLayerChange={setSelectedLayer}
              isDemolishMode={isDemolishMode}
            />

            {/* Floating visual notice if constructing elements */}
            {selectedBuilding && (
              <div className="absolute top-16 left-4 z-20 bg-[#D4E0C1] text-[#2C3322] px-3 py-2 rounded-lg text-xs font-semibold border border-[#5A7247]/40 shadow-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#5A7247]" />
                <span>
                  Baumodus aktiv: Platziere &apos;{selectedBuilding.name}&apos; auf zulässigem Terrain.
                </span>
              </div>
            )}
            {isDemolishMode && (
              <div className="absolute top-16 left-4 z-20 bg-red-50 text-red-800 px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 shadow-sm flex items-center gap-2">
                <span>Rückbau-Modus aktiv: Klicke auf bebautes Tile zur Demontage!</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Tab selection & specific control modules */}
        <div className="w-full md:w-2/5 shrink-0 flex flex-col gap-6 h-full max-h-[920px]">
          
          {/* Tabs header panel */}
          <div className="flex bg-[#E8E2D6] border border-[#D4CCBA] p-1.5 rounded-xl justify-between shadow-sm">
            {(['map', 'schoeller', 'research', 'species', 'reports'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  // Turn off states of catalog selection to avoid confusion
                  if (tab !== 'map') setSelectedBuilding(null);
                }}
                className={`flex-grow py-2 text-xs font-bold font-sans rounded-lg transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#5A7247] text-white border-transparent font-extrabold shadow-sm'
                    : 'text-[#6B6356] hover:text-[#2C3322]'
                }`}
              >
                {tab === 'map' ? '🏗️ Bauen' :
                 tab === 'schoeller' ? '🏭 Fabrik' :
                 tab === 'research' ? '🔬 Forschung' :
                 tab === 'species' ? '🦫 Artenschutz' : '📊 Berichte'}
              </button>
            ))}
          </div>

          {/* Tabs containers */}
          <div className="flex-grow overflow-hidden bg-[#F2EDE4] border border-[#D4CCBA] rounded-xl max-h-[580px]">
            {activeTab === 'map' && (
              <BuildingCatalog
                stats={stats}
                selectedBuilding={selectedBuilding}
                onSelectBuilding={setSelectedBuilding}
                researchTree={researchTree}
                hasRurtalbahnStationNear={checkRurtalbahnDiscountActiveOnMap}
                onDemolishModeToggle={() => {
                  setSelectedBuilding(null);
                  setIsDemolishMode(!isDemolishMode);
                }}
                isDemolishMode={isDemolishMode}
                selectedTileInfo={selectedTileInfo}
                onUpgradeBuilding={handleUpgradeBuilding}
              />
            )}

            {activeTab === 'schoeller' && (
              <SchoellershammerConsole
                stats={stats}
                onChangeMode={handleChangePaperFactoryMode}
                researchTree={researchTree}
              />
            )}

            {activeTab === 'research' && (
              <ResearchTree
                researchNodes={researchTree}
                stats={stats}
                onUnlockResearch={handleUnlockResearch}
              />
            )}

            {activeTab === 'species' && (
              <SpeciesTracker
                speciesList={speciesList}
                naturePoints={stats.naturePoints}
              />
            )}

            {activeTab === 'reports' && (
              <DashboardReports
                stats={stats}
                speciesList={speciesList}
                logs={logs}
                onTriggerPdfSim={handleTriggerPdfSim}
                pdfSimulated={pdfSimulated}
              />
            )}
          </div>

          {/* Bottom logs HUD */}
          <div className="bg-[#E8E2D6]/80 border border-[#D4CCBA] rounded-xl p-4 flex flex-col h-[200px] overflow-hidden shadow-inner shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B8273] mb-2 border-b border-[#D4CCBA] pb-1.5 flex justify-between">
              <span>📜 Amts- & Simulationsprotokoll</span>
              <button
                onClick={handleRestartGame}
                className="text-red-700 hover:text-red-600 transition-colors uppercase cursor-pointer"
              >
                Simulation Neustarten
              </button>
            </span>
            <div className="flex-grow overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {logs.map(log => (
                <div key={log.id} className="text-[10.5px] font-mono leading-relaxed flex items-start gap-1.5">
                  <span className="text-[#8B8273] font-bold shrink-0">W:{(log.round)}</span>
                  <span className={
                    log.type === 'success' ? 'text-[#5A7247] font-medium' :
                    log.type === 'warning' ? 'text-amber-800' :
                    log.type === 'error' ? 'text-red-800' :
                    'text-[#2C3322]'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Dynamic bottom central HUD */}
      <div className="px-6 pb-6 shrink-0 relative">
        <AnimatePresence>
          {selectedTileInfo && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-4 bg-white border-2 rounded-xl shadow-xl p-4.5 flex flex-col md:flex-row items-start justify-between gap-5 z-40 relative backdrop-blur-md bg-white/95"
              style={{
                borderColor: 
                  selectedTileInfo.building.category === 'ecology' ? '#5a7247' :
                  selectedTileInfo.building.category === 'water' ? '#457b9d' :
                  selectedTileInfo.building.category === 'fauna' ? '#d97706' :
                  selectedTileInfo.building.category === 'tourism' ? '#14b8a6' :
                  selectedTileInfo.building.category === 'economy' ? '#64748b' :
                  '#a855f7'
              }}
            >
              {/* Left Side: Category Icon / Title & Specs */}
              <div className="flex-grow space-y-2 max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border ${
                    selectedTileInfo.building.category === 'ecology' ? 'bg-[#5a7247]/10 text-[#5a7247] border-[#5a7247]/20' :
                    selectedTileInfo.building.category === 'water' ? 'bg-[#457b9d]/10 text-[#457b9d] border-[#457b9d]/20' :
                    selectedTileInfo.building.category === 'fauna' ? 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20' :
                    selectedTileInfo.building.category === 'tourism' ? 'bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20' :
                    selectedTileInfo.building.category === 'economy' ? 'bg-[#64748b]/10 text-[#64748b] border-[#64748b]/20' :
                    'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20'
                  }`}>
                    {selectedTileInfo.building.category === 'ecology' ? '🌿 Ökologie' :
                     selectedTileInfo.building.category === 'water' ? '🌊 Hydrologie' :
                     selectedTileInfo.building.category === 'fauna' ? '🦫 Artenschutz' :
                     selectedTileInfo.building.category === 'tourism' ? '🏕️ Tourismus' :
                     selectedTileInfo.building.category === 'economy' ? '💶 Wirtschaft' :
                     '🚇 Infrastruktur'}
                  </span>
                  <span className="text-[10px] font-mono text-[#8b8273] bg-[#f2ede4] px-1.5 py-0.5 rounded border border-[#d4ccba]/50">
                    Sektor ({selectedTileInfo.x}, {selectedTileInfo.y})
                  </span>
                  <span className="text-[10px] font-mono text-[#8b8273] bg-[#f2ede4] px-1.5 py-0.5 rounded border border-[#d4ccba]/50">
                    Untergrund: {selectedTileInfo.tile.terrain}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-[#2c3322]">
                    {selectedTileInfo.building.name}
                  </h4>
                  {selectedTileInfo.tile.upgradeLevel && selectedTileInfo.tile.upgradeLevel > 1 && (
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full font-black shadow-sm flex items-center gap-0.5 animate-pulse">
                      ★ Stufe {selectedTileInfo.tile.upgradeLevel}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5c5549] leading-relaxed font-sans">
                  {selectedTileInfo.building.description}
                </p>

                {/* Specific features / detail effects */}
                {selectedTileInfo.building.detailEffect && (
                  <div className="mt-1 bg-[#fbf9f5] border border-[#e8e2d6] rounded-lg p-2.5 text-xs text-[#3a442a] font-mono leading-relaxed">
                    <span className="font-extrabold text-brand-green">Spezialeffekt: </span>
                    {selectedTileInfo.building.detailEffect}
                  </div>
                )}
              </div>

              {/* Middle/Right Side: Economic data grid & metrics */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-4 shrink-0 font-mono w-full md:w-auto">
                {/* Cost Panel */}
                <div className="bg-[#fcfbf9] border border-[#e8e2d6] rounded-xl p-2 px-3 text-center min-w-[100px] flex-grow md:flex-grow-0">
                  <div className="text-[9px] text-[#8b8273] uppercase tracking-wider">Errichtung</div>
                  <div className="text-xs font-black text-[#3a442a]">{selectedTileInfo.building.cost} €</div>
                </div>

                {/* Maintenance Panel */}
                <div className="bg-[#fcfbf9] border border-[#e8e2d6] rounded-xl p-2 px-3 text-center min-w-[100px] flex-grow md:flex-grow-0">
                  <div className="text-[9px] text-[#8b8273] uppercase tracking-wider">Unterhalt</div>
                  <div className="text-xs font-black text-amber-800">
                    {selectedTileInfo.building.maintenance > 0 ? `-${selectedTileInfo.building.maintenance} €/Rd` : 'Gratis'}
                  </div>
                </div>

                {/* Local Metrics (WRRL / FFH) */}
                <div className="bg-[#fcfbf9] border border-[#e8e2d6] rounded-xl p-2 px-3 text-center min-w-[125px] flex-grow md:flex-grow-0">
                  <div className="text-[9px] text-[#8b8273] uppercase tracking-wider">Lokale Messung</div>
                  <div className="text-xs font-black flex justify-center gap-2 mt-0.5">
                    <span title="WRRL-Güte">💧 {selectedTileInfo.tile.wrrl_quality.toFixed(1)}</span>
                    <span title="FFH-Potential">🌿 {selectedTileInfo.tile.ffh_value}%</span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedTileInfo(null)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 duration-150 transition-colors shadow-sm ml-0 md:ml-3 cursor-pointer self-stretch md:self-auto flex items-center justify-center gap-1.5 border border-slate-200"
                  aria-label="Schließen"
                >
                  <X className="w-4 h-4" />
                  <span className="text-xs font-bold md:hidden">Schließen</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <OekoZentraleHUD
          stats={stats}
          grid={grid}
          selectedBuilding={selectedBuilding}
          onSelectBuilding={setSelectedBuilding}
          isDemolishMode={isDemolishMode}
          onDemolishModeToggle={() => {
            setSelectedBuilding(null);
            setIsDemolishMode(!isDemolishMode);
          }}
        />
      </div>

      {/* DYNAMIC MODAL: CLIMATE EVENTS CHALLENGES */}
      {activeEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="bg-[#F2EDE4] border-2 border-[#BC6C25] rounded-2xl max-w-lg w-full p-6 shadow-md space-y-5 animate-scale-up">
            <div className="flex items-center gap-3 border-b border-[#D4CCBA] pb-3">
              <ShieldAlert className="w-8 h-8 text-[#BC6C25]" />
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#BC6C25] uppercase font-black">KLIMAWAND-HEDGING KREIS DÜREN</span>
                <h3 className="text-base font-black text-[#2C3322]">{activeEvent.name}</h3>
              </div>
            </div>

            <p className="text-xs text-[#2C3322] leading-relaxed font-sans bg-white p-3 rounded-lg border border-[#D4CCBA]">
              {activeEvent.description}
            </p>

            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs leading-normal">
              <span className="font-bold text-red-800 block mb-1">Mögliche Auswirkungen:</span>
              <p className="text-red-950">{activeEvent.effectDescription}</p>
            </div>

            {/* Decision handlers */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 font-mono">
              {activeEvent.id === 'hochwasser' ? (
                <button
                  onClick={() => handleResolveEvent('eco')}
                  className="flex-1 py-2.5 bg-[#5A7247] hover:bg-[#606C38] text-white font-black text-xs uppercase rounded-lg shadow-sm cursor-pointer shadow-emerald-500/10 transition-transform active:scale-95"
                >
                  Hochwasser-Schutz Prüfen
                </button>
              ) : activeEvent.id === 'duerre' ? (
                <>
                  <button
                    onClick={() => handleResolveEvent('pay')}
                    className="flex-1 py-2.5 bg-[#457B9D] hover:bg-[#396885] text-white font-extrabold text-xs uppercase rounded-lg cursor-pointer"
                  >
                    Talsperre-Notflutung einleiten (-4 €)
                  </button>
                  <button
                    onClick={() => handleResolveEvent('ignore')}
                    className="flex-1 py-2.5 bg-[#E8E2D6] hover:bg-[#DCD4C4] text-[#2C3322] font-extrabold text-xs uppercase rounded-lg cursor-pointer border border-[#D4CCBA]"
                  >
                    Naturereignis aussitzen
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleResolveEvent('pay')}
                    className="flex-1 py-2.5 bg-[#5A7247] hover:bg-[#606C38] text-white font-extrabold text-xs uppercase rounded-lg cursor-pointer"
                  >
                    Ausgleichszahlung leisten
                  </button>
                  <button
                    onClick={() => handleResolveEvent('ignore')}
                    className="flex-1 py-2.5 bg-[#8B4513] hover:bg-[#70350B] text-white font-extrabold text-xs uppercase rounded-lg cursor-pointer"
                  >
                    Dämme abtragen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC MODAL: INTERACTIVE TUTORIAL / RULES WINDOW */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`bg-[#F2EDE4] border-2 border-[#5A7247] rounded-3xl w-full p-6.5 shadow-2xl relative flex flex-col gap-4 overflow-hidden animate-scale-up duration-350 transition-all ${
            TUTORIAL_STEPS[tutorialStep].showCascadeDiagram ? 'max-w-4xl' : 'max-w-xl'
          }`}>
            
            {/* Header section */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <span className="text-3xl select-none filter drop-shadow-sm">
                  {TUTORIAL_STEPS[tutorialStep].icon}
                </span>
                <div>
                  <span className="text-[9px] font-mono tracking-[0.2em] text-[#5A7247] uppercase font-black block">
                    {TUTORIAL_STEPS[tutorialStep].tagline}
                  </span>
                  <h3 className="text-base font-black text-[#2C3311] leading-tight">
                    {TUTORIAL_STEPS[tutorialStep].title}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setShowTutorial(false)}
                className="text-[#8B8273] hover:text-[#2C3311] font-bold text-sm p-1.5 rounded-full hover:bg-[#E8E2D6]/70 transition-colors leading-none cursor-pointer border border-[#D4CCBA]/50"
                title="Tutorial schließen und direkt spielen"
              >
                ✕
              </button>
            </div>

            {/* Main Content Choice */}
            {TUTORIAL_STEPS[tutorialStep].showCascadeDiagram ? (
              <div className="space-y-4">
                <p className="text-xs text-[#2C3311] leading-relaxed bg-[#fbfaf7] p-3 rounded-xl border border-[#D4CCBA]/60 shadow-sm">
                  {TUTORIAL_STEPS[tutorialStep].description}
                </p>

                {/* Cascade Flow Chart */}
                <div className="bg-white/95 rounded-2xl border border-[#D4CCBA]/70 p-4.5 space-y-4 max-h-[440px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
                    
                    {/* Column 1: Stufe I - Grundlagen */}
                    <div className="space-y-3.5 relative">
                      <div className="text-[10px] font-mono font-black tracking-widest text-[#8B8273] uppercase pb-1.5 border-b border-brand-lightsky/10 flex items-center justify-between">
                        <span>💡 STUFE I: GRUNDLAGEN</span>
                        <span className="bg-[#5A7247]/15 text-[#5A7247] px-1.5 py-0.5 rounded text-[8px] font-black font-sans">FORSCHEN</span>
                      </div>

                      {/* Biber-Plan */}
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 shadow-sm hover:border-amber-400 transition-all">
                        <div className="flex items-center gap-1.5 justify-between font-mono">
                          <span className="font-extrabold text-[11px] text-amber-900 flex items-center gap-1">🦫 Biber-Management-Plan</span>
                          <span className="bg-amber-100/90 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded">5 🧪</span>
                        </div>
                        <p className="text-[10px] text-amber-850/90 mt-1.5 leading-normal">
                          Löst landwirtschaftliche Biberkonflikte präventiv.
                        </p>
                        <div className="text-[9px] mt-2 font-mono text-emerald-800 font-extrabold flex items-center gap-1">
                          <span>➔ Schaltet frei:</span> <span className="underline decoration-dotted">Auen-Vitalisierung</span>
                        </div>
                      </div>

                      {/* Sohlgleiten */}
                      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 shadow-sm hover:border-blue-400 transition-all">
                        <div className="flex items-center gap-1.5 justify-between font-mono">
                          <span className="font-extrabold text-[11px] text-blue-900 flex items-center gap-1">🧱 Sohlgleiten-Technologie</span>
                          <span className="bg-blue-100/95 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded">6 🧪</span>
                        </div>
                        <p className="text-[10px] text-blue-850/95 mt-1.5 leading-normal">
                          Ermöglicht kostengünstige Sohlgleit-Gesteinsmuster.
                        </p>
                        <div className="text-[9px] mt-2 font-mono text-emerald-800 font-extrabold flex items-center gap-1">
                          <span>➔ Schaltet frei:</span> <span className="underline decoration-dotted">Fortschr. Abwasserreinigung</span>
                        </div>
                      </div>

                      {/* Lachsprogramm */}
                      <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 shadow-sm hover:border-rose-400 transition-all">
                        <div className="flex items-center gap-1.5 justify-between font-mono">
                          <span className="font-extrabold text-[11px] text-rose-900 flex items-center gap-1">🐟 Lachsprogramm NRW</span>
                          <span className="bg-rose-100/90 text-rose-850 text-[9px] font-black px-1.5 py-0.5 rounded">8 🧪</span>
                        </div>
                        <p className="text-[10px] text-rose-855/90 mt-1.5 leading-normal">
                          Grundlage für Lachszucht und Wander-Freigabe.
                        </p>
                        <div className="text-[9px] mt-2 font-mono space-y-1">
                          <div className="text-emerald-800 font-extrabold">➔ Schaltet frei: <span className="text-rose-700">🔓 Lachs-Zuchtstation (8 €)</span></div>
                          <div className="text-purple-800 font-extrabold">➔ Pfad zu: <span className="underline decoration-dotted">Fabrik-Transformation</span></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Column 2: Stufe II - Aufbautechs */}
                    <div className="space-y-3.5 relative">
                      <div className="text-[10px] font-mono font-black tracking-widest text-[#8B8273] uppercase pb-1.5 border-b border-brand-lightsky/10 flex items-center justify-between">
                        <span>🧪 STUFE II: SYNBRÜCKEN</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-black font-sans">KRAFTWERKE</span>
                      </div>

                      {/* Auen-Vitalisierung */}
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 shadow-sm hover:border-emerald-400 transition-all relative">
                        <div className="absolute -left-3.5 top-6.5 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black border border-white shadow-sm" title="Voraussetzung: Biber-Management-Plan">🦫</div>
                        <div className="flex items-center gap-1.5 justify-between font-mono pl-1">
                          <span className="font-extrabold text-[11px] text-emerald-900 flex items-center gap-1">🌳 Auen-Vitalisierung</span>
                          <span className="bg-emerald-100/95 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded">10 🧪</span>
                        </div>
                        <p className="text-[10px] text-emerald-850/95 mt-1.5 leading-normal pl-1">
                          Deichrückbauten und Überflutungs-Polder im Kreis Düren.
                        </p>
                        <div className="text-[9px] mt-2 font-mono text-emerald-800 font-extrabold pl-1">
                          ✨ 100% Hochwasserschutz & beschleunigter Auwald
                        </div>
                      </div>

                      {/* Fortgeschrittene Abwasserreinigung */}
                      <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-3 shadow-sm hover:border-cyan-400 transition-all relative">
                        <div className="absolute -left-3.5 top-6.5 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black border border-white shadow-sm" title="Voraussetzung: Sohlgleiten-Technologie">🧱</div>
                        <div className="flex items-center gap-1.5 justify-between font-mono pl-1">
                          <span className="font-extrabold text-[11px] text-cyan-900 flex items-center gap-1">💧 Fortschr. Abwasserreinigung</span>
                          <span className="bg-cyan-100/95 text-cyan-800 text-[9px] font-black px-1.5 py-0.5 rounded">12 🧪</span>
                        </div>
                        <p className="text-[10px] text-cyan-850/95 mt-1.5 leading-normal pl-1">
                          Aktivkohlefilter & Ozonstufe für Klärwerke.
                        </p>
                        <div className="text-[9px] mt-2 font-mono space-y-1 pl-1">
                          <div className="text-cyan-800 font-extrabold">➔ Schaltet frei: <span className="text-indigo-700">🔓 Klärwerk-Upgrade (kostenfreier Betrieb)</span></div>
                          <div className="text-purple-800 font-extrabold">➔ Pfad zu: <span className="underline decoration-dotted">Fabrik-Transformation</span></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Column 3: Stufe III - Transformation */}
                    <div className="space-y-3.5 relative">
                      <div className="text-[10px] font-mono font-black tracking-widest text-[#8B8273] uppercase pb-1.5 border-b border-brand-lightsky/10 flex items-center justify-between">
                        <span>🏆 STUFE III: ZIEL</span>
                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-black font-sans">BIO-INNOVATION</span>
                      </div>

                      {/* Fabrik-Transformationskonzept */}
                      <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4.5 shadow-md hover:border-purple-400 transition-all relative">
                        {/* Requirement badges */}
                        <div className="absolute -left-3.5 top-7 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black border border-white shadow-sm" title="Vortech: Lachsprogramm">🐟</div>
                        <div className="absolute -left-3.5 top-12 bg-cyan-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black border border-white shadow-sm" title="Vortech: Abwasserreinigung">💧</div>
                        
                        <div className="flex items-center gap-1.5 justify-between font-mono pl-2">
                          <span className="font-extrabold text-[11px] text-purple-900 flex items-center gap-1">🏭 Fabrik-Transformationskonzept</span>
                          <span className="bg-purple-100/95 text-purple-855 text-[9px] font-black px-1.5 py-0.5 rounded">18 🧪</span>
                        </div>
                        <p className="text-[10px] text-purple-850/95 mt-2 leading-normal pl-2">
                          Wissenschaftliche Studie zur emissionsfreien Konvertierung der Papierfabrik Schoellershammer.
                        </p>
                        <div className="mt-3.5 p-2.5 bg-white border-2 border-purple-300 rounded-lg text-[9px] font-mono text-purple-950 font-black text-center shadow-inner leading-relaxed">
                          👑 ULTIMATIVER EFFEKT:<br/>
                          Schaltet den 4. Modus der Papierfabrik frei:<br/>
                          <span className="text-emerald-700 font-extrabold">"Vollständige Renaturierung"</span> (Lachsheimkehr!)
                        </div>
                      </div>

                      {/* Info Tips Panel */}
                      <div className="bg-[#f0ece3] border border-[#d4ccba] rounded-xl p-3 text-[10px] text-slate-700 leading-relaxed space-y-1">
                        <div className="font-black text-brand-dark flex items-center gap-1">💡 Strategietipp:</div>
                        <p>Platziere zuerst eine 🧪 <span className="font-bold">Natura-Zentrum</span>-Station auf der Karte. Sie liefert dir selbsttätig jede Runde passive Forschungspunkte, um die Stufen rascher hinunterzukaskadieren!</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Main description section */}
                <p className="text-xs text-[#2C3311] leading-relaxed bg-white/95 p-3.5 rounded-xl border border-[#D4CCBA]/60 shadow-inner">
                  {TUTORIAL_STEPS[tutorialStep].description}
                </p>

                {/* Bullet points rules list */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-[#8B8273]">
                    Spieldetails & Regelkunde:
                  </span>
                  <ul className="space-y-2.5">
                    {TUTORIAL_STEPS[tutorialStep].bullets.map((bulletText, i) => (
                      <li key={i} className="text-xs text-[#3C4331] leading-relaxed flex gap-2.5">
                        <span className="text-[#5A7247] font-extrabold select-none shrink-0">•</span>
                        <span>{bulletText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Footer containing step progress indicators & buttons */}
            <div className="flex items-center justify-between pt-4.5 border-t border-[#D4CCBA]/60 mt-2">
              {/* Step indicator slider beads */}
              <div className="flex gap-1.5">
                {TUTORIAL_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTutorialStep(i)}
                    className={`w-2 h-2 rounded-full duration-200 transition-all ${
                      tutorialStep === i ? 'bg-[#5A7247] w-6' : 'bg-[#D4CCBA] hover:bg-[#8B8273]'
                    }`}
                    title={`Gehe zu Schritt ${i + 1}`}
                  />
                ))}
              </div>

              {/* Back / Next actions triggers */}
              <div className="flex gap-2 font-mono">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep(prev => prev - 1)}
                    className="px-4 py-2 bg-[#E8E2D6] hover:bg-[#DCD4C4] text-[#2C3311] text-xs font-bold uppercase rounded-lg border border-[#D4CCBA] cursor-pointer transition-transform transform active:scale-95"
                  >
                    Zurück
                  </button>
                )}
                
                <button
                  onClick={() => {
                    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
                      setTutorialStep(prev => prev + 1);
                    } else {
                      setShowTutorial(false);
                    }
                  }}
                  className="px-5 py-2.5 bg-[#5A7247] hover:bg-[#4E613C] text-white text-xs font-black uppercase rounded-lg cursor-pointer shadow-md transition-transform transform active:scale-95"
                >
                  {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Simulation starten 🎮' : 'Weiter'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VOLLSTÄNDIGE SPIELANLEITUNG MODAL */}
      {showSpielanleitung && (
        <Spielanleitung onClose={() => setShowSpielanleitung(false)} />
      )}

      {/* FEEDBACK MODAL */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#F2EDE4] border-2 border-[#6B52AE] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4CCBA] pb-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-[#6B52AE]" />
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-[#6B52AE] uppercase font-black block">RUR NATUR SIMULATOR</span>
                  <h3 className="text-base font-black text-[#2C3322]">Feedback geben</h3>
                </div>
              </div>
              <button
                onClick={() => setShowFeedback(false)}
                className="text-[#8B8273] hover:text-[#2C3311] p-1.5 rounded-full hover:bg-[#E8E2D6]/70 transition-colors cursor-pointer border border-[#D4CCBA]/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="text-center space-y-3 py-4">
                <div className="text-4xl">🌿</div>
                <p className="text-sm font-black text-[#5A7247]">Vielen Dank für dein Feedback!</p>
                <p className="text-xs text-[#5C5549]">Deine Nachricht wurde an das RUR NATUR-Team gesendet. Vielen Dank!</p>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="mt-2 px-5 py-2.5 bg-[#5A7247] hover:bg-[#4E613C] text-white text-xs font-black uppercase rounded-lg cursor-pointer shadow-md transition-transform active:scale-95"
                >
                  Schließen
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B8273] block mb-1">
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      value={feedbackName}
                      onChange={e => setFeedbackName(e.target.value)}
                      placeholder="Dein Name..."
                      className="w-full bg-white border border-[#D4CCBA] rounded-lg px-3 py-2 text-xs text-[#2C3322] placeholder-[#C4BBAA] focus:outline-none focus:border-[#6B52AE] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B8273] block mb-1">
                      Dein Feedback <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="Was gefällt dir? Was könnte besser sein? Hast du Ideen oder Fehler entdeckt?"
                      rows={5}
                      className="w-full bg-white border border-[#D4CCBA] rounded-lg px-3 py-2 text-xs text-[#2C3322] placeholder-[#C4BBAA] focus:outline-none focus:border-[#6B52AE] transition-colors resize-none"
                    />
                  </div>
                </div>

                {feedbackError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800 font-mono">
                    {feedbackError}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="flex-1 py-2.5 bg-[#E8E2D6] hover:bg-[#DCD4C4] text-[#2C3311] text-xs font-bold uppercase rounded-lg border border-[#D4CCBA] cursor-pointer transition-transform active:scale-95"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackText.trim() || feedbackSending}
                    className="flex-1 py-2.5 bg-[#6B52AE] hover:bg-[#5A3F9A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase rounded-lg cursor-pointer shadow-md transition-transform active:scale-95"
                  >
                    {feedbackSending ? 'Wird gesendet...' : 'Absenden ✓'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FLOAT TIP PANEL: CONTEXTUAL TIPS POPUP */}
      <AnimatePresence>
        {activeTip && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            className="fixed bottom-6 right-6 z-50 bg-[#FCFBF9] border-2 border-[#5A7247] rounded-2xl shadow-2xl p-4.5 max-w-sm flex flex-col gap-3 backdrop-blur-md bg-white/95"
          >
            {/* Header / Avatar */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl filter drop-shadow-sm shrink-0 select-none">
                  {activeTip.icon}
                </span>
                <div>
                  <div className="text-[10px] font-mono font-black tracking-widest text-[#5A7247] uppercase leading-none">BIBER-RATGEBER 🦫</div>
                  <h4 className="text-sm font-black text-[#2C3322] mt-0.5">
                    {activeTip.title}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setActiveTip(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tipp ausblenden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Text */}
            <p className="text-xs text-[#5C5549] leading-relaxed font-sans mt-0.5">
              {activeTip.text}
            </p>

            {/* Footer buttons */}
            <div className="flex items-center justify-between border-t border-[#D4CCBA]/50 pt-2.5 mt-1">
              <span className="text-[9px] font-mono text-slate-400">
                Lerneffekt ({seenTips.length}/8)
              </span>
              <button
                onClick={() => setActiveTip(null)}
                className="px-3.5 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white font-black text-[10px] uppercase tracking-wider rounded-lg cursor-pointer duration-150 shadow-sm"
              >
                Verstanden!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
