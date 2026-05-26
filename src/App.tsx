import React, { useState, useEffect, useCallback, useMemo } from 'react';
import emailjs from '@emailjs/browser';
import { 
  TileData, BuildingType, ActionCard, ActionCardType, 
  ResearchNode, Species, PaperFactoryMode, GameLog, GameStats, ClimateEvent, TerrainType, StakeholderQuest 
} from './types';
import { 
  BUILDIONS_CATALOG, INITIAL_ACTION_CARDS, RESEARCH_TECH_TREE, 
  BIOTOP_SPECIES, CLIMATE_EVENTS_DATA, STAKEHOLDER_QUESTS_DATA
} from './gameData';
import { ActionSlotSystem } from './components/ActionSlotSystem';
import { BuildingCatalog } from './components/BuildingCatalog';
import { SchoellershammerConsole } from './components/SchoellershammerConsole';
import { ResearchTree } from './components/ResearchTree';
import { SpeciesTracker } from './components/SpeciesTracker';
import { DashboardReports } from './components/DashboardReports';
import { IsometricMap } from './components/IsometricMap';
import { OekoZentraleHUD } from './components/OekoZentraleHUD';
import {
  Sun, CloudRain, Award, Info, Calendar, Zap, RotateCcw,
  TrendingUp, Coins, ShieldAlert, Wrench, BookOpen, HeartHandshake, HelpCircle,
  X, Save, FolderOpen, MessageSquare,
  Hammer, Factory, Microscope, Leaf, FileText, ChevronDown, ChevronUp
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

interface GameStateSnapshot {
  grid: TileData[][];
  stats: GameStats;
  researchTree: ResearchNode[];
  cards: ActionCard[];
  quests: StakeholderQuest[];
  logs: GameLog[];
  roundInvested: boolean;
  actionName: string;
}

export default function App() {
  // --- Game State Systems ---
  const [grid, setGrid] = useState<TileData[][]>([]);
  const [history, setHistory] = useState<GameStateSnapshot[]>([]);
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
    rurtalbahnSlotsUsed: 0,
    biosecurity: 100,
    renewableEnergy: 25,
    citizenAcceptance: 80,
    cooperativesActive: false,
    oekoZentraleLevel: 1,
    oekoZentraleMode: 'STANDARD',
    earlyWarningSystemActive: false,
    co2Footprint: 190.0
  });

  const [cards, setCards] = useState<ActionCard[]>([]);
  const [researchTree, setResearchTree] = useState<ResearchNode[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [quests, setQuests] = useState<StakeholderQuest[]>(STAKEHOLDER_QUESTS_DATA);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [activeEvent, setActiveEvent] = useState<ClimateEvent | null>(null);
  const [roundInvested, setRoundInvested] = useState<boolean>(false);
  const [activeYearChallengeModal, setActiveYearChallengeModal] = useState<number | null>(null);
  const [invasiveThreatEnabled, setInvasiveThreatEnabled] = useState<boolean>(false);
  const [showInvasiveRules, setShowInvasiveRules] = useState<boolean>(false);
  const [isHoveringToggle, setIsHoveringToggle] = useState<boolean>(false);
  const [energyChallengeEnabled, setEnergyChallengeEnabled] = useState<boolean>(false);
  const [showEnergyRules, setShowEnergyRules] = useState<boolean>(false);
  const [isHoveringEnergyToggle, setIsHoveringEnergyToggle] = useState<boolean>(false);
  const [challengesCollapsed, setChallengesCollapsed] = useState<boolean>(true);
  
  // UI Panels / Tabs
  const [activeTab, setActiveTab] = useState<'map' | 'schoeller' | 'research' | 'species' | 'reports'>('map');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<'normal' | 'wrrl' | 'ffh' | 'flood'>('normal');
  const [isDemolishMode, setIsDemolishMode] = useState<boolean>(false);
  const [selectedTileInfo, setSelectedTileInfo] = useState<{ x: number, y: number, building: BuildingType, tile: TileData } | null>(null);
  const [placementConfirmation, setPlacementConfirmation] = useState<{
    x: number;
    y: number;
    building: BuildingType;
    finalCost: number;
    finalRebate: number;
    acceptanceSurcharge: number;
  } | null>(null);
  const [pdfSimulated, setPdfSimulated] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [showSpielregeln, setShowSpielregeln] = useState<boolean>(false);
  const [logsCollapsed, setLogsCollapsed] = useState<boolean>(false);

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
      // Stausee Obermaubach (reservoir lake in South / Oberlauf area) at y = 0 and y = 1 and 2
      if (y === 0 && (x === 3 || x === 4)) return true;
      if (y === 1 && (x === 3 || x === 4 || x === 5)) return true;
      if (y === 2 && (x === 4 || x === 5)) return true;
      
      // Beautiful winding meanders
      if (y === 3 && (x === 4 || x === 5)) return true;
      if (y === 4 && x === 5) return true;
      if (y === 5 && (x === 5 || x === 6)) return true;
      if (y === 6 && x === 5) return true; // Passing right next to Schoellershammer factory at (6,6)
      if (y === 7 && (x === 5 || x === 6)) return true; // Passing by Schoellershammer and Düren Süd
      if (y === 8 && (x === 6 || x === 7)) return true;
      if (y === 9 && x === 7) return true;
      if (y === 10 && (x === 7 || x === 8)) return true;
      if (y === 11 && (x === 7 || x === 8)) return true;
      if (y === 12 && (x === 6 || x === 7)) return true; // Wending past Jülich
      if (y === 13 && x === 6) return true;
      if (y === 14 && (x === 5 || x === 6)) return true;
      if (y === 15 && x === 5) return true;
      
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

        let cityName: string | undefined = undefined;

        // Geografische Positionierung der historischen Rur-Gemeinden entlang des Flusslaufs
        if (y === 0 && x === 2) {
          terrain = 'Siedlung';
          cityName = 'Heimbach';
          moisture = 25;
          flood = 15;
          ffh = 45;
          wrrl = 2.0;
        } else if (y === 1 && x === 2) {
          terrain = 'Siedlung';
          cityName = 'Obermaubach';
          moisture = 35;
          flood = 25;
          ffh = 35;
          wrrl = 2.2;
        } else if (y === 2 && x === 3) {
          terrain = 'Siedlung';
          cityName = 'Untermaubach';
          moisture = 30;
          flood = 28;
          ffh = 30;
          wrrl = 2.5;
        } else if (y === 4 && x === 4) {
          terrain = 'Siedlung';
          cityName = 'Kreuzau';
          moisture = 25;
          flood = 32;
          ffh = 25;
          wrrl = 3.0;
        } else if (y === 5 && x === 7) {
          terrain = 'Siedlung';
          cityName = 'Düren (Nord)';
          moisture = 20;
          flood = 45;
          ffh = 15;
          wrrl = 4.2;
        } else if (y === 6 && x === 7) {
          terrain = 'Siedlung';
          cityName = 'Düren (Zentrum)';
          moisture = 22;
          flood = 48;
          ffh = 10;
          wrrl = 4.5;
        } else if (y === 7 && x === 7) {
          terrain = 'Siedlung';
          cityName = 'Düren (Süd)';
          moisture = 25;
          flood = 42;
          ffh = 15;
          wrrl = 4.0;
        } else if (y === 12 && x === 8) {
          terrain = 'Siedlung';
          cityName = 'Jülich';
          moisture = 30;
          flood = 35;
          ffh = 24;
          wrrl = 3.8;
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
          hasRiverConnection: river,
          cityName: cityName
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

  const pushHistoryState = (actionName: string) => {
    const snapshot: GameStateSnapshot = {
      grid: JSON.parse(JSON.stringify(grid)),
      stats: JSON.parse(JSON.stringify(stats)),
      researchTree: JSON.parse(JSON.stringify(researchTree)),
      cards: JSON.parse(JSON.stringify(cards)),
      quests: JSON.parse(JSON.stringify(quests)),
      logs: JSON.parse(JSON.stringify(logs)),
      roundInvested,
      actionName
    };
    setHistory(prev => [snapshot, ...prev].slice(0, 10)); // Keep last 10 actions
  };

  const handleUndo = () => {
    if (history.length === 0) {
      addLog('Keine Aktionen im aktuellen Quartal zum Rückgängig machen.', 'warning');
      return;
    }
    const [prev, ...rest] = history;
    setGrid(prev.grid);
    setStats(prev.stats);
    setResearchTree(prev.researchTree);
    setCards(prev.cards);
    setQuests(prev.quests);
    setLogs(prev.logs);
    setRoundInvested(prev.roundInvested);
    setHistory(rest);
    addLog(`🔄 RÜCKGÄNGIG: '${prev.actionName}' wurde erfolgreich rückgängig gemacht!`, 'success');
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
        seenTips,
        invasiveThreatEnabled,
        energyChallengeEnabled,
        activeYearChallengeModal,
        quests
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
      if (loadedState.stats) {
        setStats({
          ...loadedState.stats,
          biosecurity: loadedState.stats.biosecurity !== undefined ? loadedState.stats.biosecurity : 100,
          renewableEnergy: loadedState.stats.renewableEnergy !== undefined ? loadedState.stats.renewableEnergy : 25,
          co2Footprint: loadedState.stats.co2Footprint !== undefined ? loadedState.stats.co2Footprint : 190.0
        });
      }
      if (loadedState.cards) setCards(loadedState.cards);
      if (loadedState.researchTree) setResearchTree(loadedState.researchTree);
      if (loadedState.speciesList) setSpeciesList(loadedState.speciesList);
      if (loadedState.quests) setQuests(loadedState.quests);
      if (loadedState.logs) setLogs(loadedState.logs);
      if (loadedState.hasOwnProperty('rurtalbahnLeased')) setRurtalbahnLeased(loadedState.rurtalbahnLeased);
      if (loadedState.hasOwnProperty('rurtalbahnTimeRemaining')) setRurtalbahnTimeRemaining(loadedState.rurtalbahnTimeRemaining);
      if (loadedState.preLeaseCard !== undefined) setPreLeaseCard(loadedState.preLeaseCard);
      if (loadedState.seenTips) setSeenTips(loadedState.seenTips);
      if (loadedState.hasOwnProperty('invasiveThreatEnabled')) setInvasiveThreatEnabled(loadedState.invasiveThreatEnabled);
      if (loadedState.hasOwnProperty('energyChallengeEnabled')) setEnergyChallengeEnabled(loadedState.energyChallengeEnabled);
      if (loadedState.hasOwnProperty('activeYearChallengeModal')) setActiveYearChallengeModal(loadedState.activeYearChallengeModal);
      
      setHistory([]);
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

    // --- Dynamic CO2 Footprint calculation ---
    let forestAuwaldCount = 0;
    let solarparkCount = 0;
    let windkraftCount = 0;
    let wasserkraftCount = 0;
    let klaerwerkCount = 0;
    let rurtalbahnCount = 0;
    let intensivFarmCount = 0;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const t = currentGrid[y][x];
        if (t.terrain === 'Auwald') forestAuwaldCount++;
        if (t.buildingId === 'solarpark') solarparkCount++;
        if (t.buildingId === 'windkraft') windkraftCount++;
        if (t.buildingId === 'wasserkraft') wasserkraftCount++;
        if (t.buildingId === 'klaerwerk_upgrade') klaerwerkCount++;
        if (t.buildingId === 'rurtalbahn_halt') rurtalbahnCount++;
        if (t.buildingId === 'intensiv_farm') intensivFarmCount++;
      }
    }

    // Base CO2 score starting at 150.0 t CO₂ eq/t
    let co2 = 150.0;

    if (activeMode === 'PRODUCTION') {
      co2 += 40.0; // Vollbetrieb increases footprint
    } else if (activeMode === 'RETROFITTING') {
      co2 += 12.0; // Retrofitting is moderate
    } else if (activeMode === 'SHUTDOWN') {
      co2 += 0.0;  // Shutdown removes direct factory operational CO2
    } else if (activeMode === 'RENATURIZATION') {
      co2 -= 10.0; // Renaturierung binds additional carbon
    }

    co2 += intensivFarmCount * 15.0;
    co2 -= windkraftCount * 18.0;
    co2 -= solarparkCount * 12.0;
    co2 -= wasserkraftCount * 6.0;
    co2 -= klaerwerkCount * 22.0;
    co2 -= rurtalbahnCount * 8.0;
    co2 -= forestAuwaldCount * 4.0;

    // Apply stakeholder quest bonus reductions!
    const isBahnQuestDone = quests.some(q => q.id === 'quest_rurtalbahn' && q.status === 'completed');
    if (isBahnQuestDone) co2 -= 10.0;
    const isSchoellerQuestDone = quests.some(q => q.id === 'quest_schoellershammer' && q.status === 'completed');
    if (isSchoellerQuestDone) co2 -= 15.0;

    // Apply Zerkall Fiber Innovation Center research effect
    const isZerkallUnlocked = activeResearch.some(r => r.id === 'zerkall_faserzentrum' && r.unlocked);
    if (isZerkallUnlocked) {
      co2 -= 15.0;
    }

    const finalCo2 = Math.max(5.0, co2);

    setStats(prev => ({
      ...prev,
      globalWrrl: avgWrrl,
      globalFfh: avgFfh,
      continuity: finalContinuity,
      rurtalbahnSlotsUsed: countsStops,
      co2Footprint: finalCo2
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

    pushHistoryState(`Forschung freigeschaltet: ${node.name}`);

    setResearchTree(prev => 
      prev.map(r => r.id === nodeId ? { ...r, unlocked: true } : r)
    );
    setStats(prev => {
      const isZerkall = nodeId === 'zerkall_faserzentrum';
      const extraAcceptance = isZerkall ? 10 : 0;
      return {
        ...prev,
        researchPoints: prev.researchPoints - node.cost,
        naturePoints: prev.naturePoints + 5,
        citizenAcceptance: Math.min(100, (prev.citizenAcceptance ?? 80) + extraAcceptance),
        investedThisYear: true
      };
    });
    setRoundInvested(true);
    addLog(`🔬 FORSCHUNG ERFOLG: '${node.name}' erforscht! Bonuseffekte jetzt permanent aktiv. (+5 Naturpunkte)`, 'success');
    
    if (nodeId === 'zerkall_faserzentrum') {
      addLog(`🌾 ZERKALL-EFFEKT: Das neue Faserinnovationszentrum Zerkall reaktiviert das historische Erbe und erforscht zukunftssichere alternative Pflanzenfasern! Die Bürgerakzeptanz steigt sofort um +10%!`, 'success');
    }

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

    let acceptanceDelta = 0;
    let logMsgSuffix = "";
    if (stats.year > 2026) {
      if (mode === 'PRODUCTION') {
        acceptanceDelta = 15;
        logMsgSuffix = " Vollbeschäftigung bei Schoellershammer sichert lokale Jobs (+15% Bürgerakzeptanz).";
      } else if (mode === 'RETROFITTING') {
        acceptanceDelta = -5;
        logMsgSuffix = " Umbaumaßnahmen drosseln kurzfristig den Ertrag. Geringer Dämpfer (-5% Bürgerakzeptanz).";
      } else if (mode === 'SHUTDOWN') {
        acceptanceDelta = -30;
        logMsgSuffix = " Drohende Werks-Stilllegung führt zu Protesten der Arbeitnehmer-Gewerkschaft (-30% Bürgerakzeptanz!)";
      } else if (mode === 'RENATURIZATION') {
        const isCoop = stats.cooperativesActive;
        if (isCoop) {
          acceptanceDelta = 10;
          logMsgSuffix = " Dank Bürger-Energiegenossenschaften begleiten die Bürger den Strukturwandel begeistert (+10% Bürgerakzeptanz!)";
        } else {
          acceptanceDelta = -15;
          logMsgSuffix = " Skeptischer Kulturwandel. Die Bevölkerung bedauert das Ende der industriellen Ära (-15% Bürgerakzeptanz.)";
        }
      }
    } else {
      logMsgSuffix = " (Im Einführungsjahr 2026 hat die Modus-Wahl noch keine Auswirkungen auf die Bürgerzufriedenheit).";
    }

    setStats(prev => {
      const nextAcceptance = Math.max(0, Math.min(100, prev.citizenAcceptance + acceptanceDelta));
      return {
        ...prev,
        paperFactoryMode: mode,
        citizenAcceptance: nextAcceptance
      };
    });

    addLog(`🏭 SCHOELLERSHAMMER: Modus geändert auf '${mode === 'PRODUCTION' ? 'Vollbetrieb' : mode === 'RETROFITTING' ? 'Umrüstung' : mode === 'SHUTDOWN' ? 'Stilllegung' : 'Forschungspark'}'.${logMsgSuffix}`, 'info');
    
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

      const prevBuilding = BUILDIONS_CATALOG.find(b => b.id === targetTile.buildingId);
      pushHistoryState(`Rückbau: ${prevBuilding ? prevBuilding.name : 'Unbekanntes Gebäude'} (${x}, ${y})`);

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
    
    // Protest-Aufschlag if citizen acceptance is critically low (<40%)
    let acceptanceSurcharge = 0;
    if (stats.year > 2026 && stats.citizenAcceptance !== undefined && stats.citizenAcceptance < 40) {
      acceptanceSurcharge = 2;
    }
    const finalCost = Math.max(1, building.cost - finalRebate + acceptanceSurcharge);

    if (stats.budget < finalCost) {
      addLog(`❌ BAUFEHLER: Unzureichendes Guthaben. Erfordert ${finalCost} € (Rabatt und evtl. Protest-Aufschlag eingerechnet).`, 'error');
      return;
    }

    if (acceptanceSurcharge > 0) {
      addLog(`⚠️ PROTEST-AUFSCHLAG: Wegen geringer Bürgerakzeptanz (<40%) verzögern Verwaltungs-Eilklagen den Bau! +2 € zusätzliche Erschließungskosten geladen.`, 'warning');
    }

    // Set confirmation context instead of immediate placement
    setPlacementConfirmation({
      x,
      y,
      building,
      finalCost,
      finalRebate,
      acceptanceSurcharge
    });
  };

  const executePendingPlacement = () => {
    if (!placementConfirmation) return;
    const { x, y, building, finalCost, finalRebate, acceptanceSurcharge } = placementConfirmation;
    const targetTile = grid[y]?.[x];
    if (!targetTile) return;

    pushHistoryState(`Bau von ${building.name}`);

    const activeBuildCardIdx = cards.findIndex(c => c.type === 'BUILD');

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

    // Compute citizen acceptance changes based on placed buildings
    let acceptanceDelta = 0;
    let specialLog = "";

    // ONLY active if Year is 2027 or later (progressive level challenge)
    if (stats.year > 2026) {
      if (building.id === 'windkraft') {
        let adjSiedlung = false;
        const dirs = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];
        for (const [dx, dy] of dirs) {
          const tx = x + dx;
          const ty = y + dy;
          if (tx >= 0 && tx < grid[0].length && ty >= 0 && ty < grid.length) {
            if (grid[ty][tx]?.terrain === 'Siedlung') {
              adjSiedlung = true;
              break;
            }
          }
        }

        if (adjSiedlung) {
          if (stats.cooperativesActive) {
            acceptanceDelta = -5;
            specialLog = "🪙 GENOSSENSCHAFTS-EFFEKT: Da Bürger am Ertrag der Anlage beteiligt sind, bleiben die Proteste gering (-5% Akzeptanz).";
          } else {
            acceptanceDelta = -20;
            specialLog = "🚨 ANWOHNER-WIDERSTAND: Protestaktionen wegen Rotoren nahe der Wohnsiedlung (-20% Bürgerakzeptanz!)";
          }
        } else {
          if (stats.cooperativesActive) {
            acceptanceDelta = 5;
            specialLog = "🪙 AKZEPTANZ-BONUS: Windpark fernab von Wohngebieten bringt Genossenschaftsmitglieder-Dividenden (+5% Akzeptanz).";
          }
        }
      } else if (building.id === 'solarpark') {
        if (stats.cooperativesActive) {
          acceptanceDelta = 10;
          specialLog = "🪙 ÖKO-RENDITE: Der neue Solarpark schüttet Gewinne an die Bürgergenossenschaft aus (+10% Akzeptanz).";
        } else {
          acceptanceDelta = -3;
          specialLog = "📢 FLÄCHENSKESPIS: Die Bevölkerung bedauert unbeteiligte Freiflächen-Solarkonstrukte (-3% Akzeptanz).";
        }
      }
    } else if (building.id === 'windkraft' || building.id === 'solarpark') {
      specialLog = "ℹ️ LERNEMODUS: Im ersten Jahr (2026) sind Bürgerproteste noch inaktiv. Baue frei und entdecke die Spielmechanik!";
    }

    setStats(prev => ({
      ...prev,
      budget: prev.budget - finalCost,
      naturePoints: prev.naturePoints + 3,
      climateRisk: Math.max(0, prev.climateRisk - (building.category === 'ecology' || building.category === 'water' ? 3 : 0)),
      citizenAcceptance: Math.max(0, Math.min(100, (prev.citizenAcceptance !== undefined ? prev.citizenAcceptance : 80) + acceptanceDelta))
    }));

    if (building.category === 'ecology' || building.category === 'fauna') {
      setRoundInvested(true);
    }

    addLog(`🏗️ ERFOLG: '${building.name}' auf Feld (${x}, ${y}) errichtet. Kosten: ${finalCost} € (Rabatt: -${finalRebate} €)`, 'success');
    if (specialLog) {
      addLog(specialLog, acceptanceDelta > 0 ? 'success' : 'warning');
    }
    setSelectedBuilding(null); // Clear selected placement shadow
    setPlacementConfirmation(null); // Clear pending placement state

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

    pushHistoryState(`Upgrade von ${building.name} (Stufe ${nextLevel})`);

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
      naturePoints: prev.naturePoints + 15,
      investedThisYear: true
    }));

    setRoundInvested(true);

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
    // Clear history on new round to avoid cross-round rollbacks
    setHistory([]);

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
    const obsolescencePenalty = stats.factoryObsolescencePenalty ?? 0;
    if (stats.paperFactoryMode === 'PRODUCTION') {
      factoryTaxRevenue = Math.max(5, 15 - obsolescencePenalty);
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

    // ÖKO-ZENTRALE LEVEL 3: AUTONOME KLIMAWARTE BONUS
    if (stats.oekoZentraleLevel === 3) {
      passiveResearch += 1;
      passiveNature += 2;
    }

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

    // ACTIVE FOCUS MODE INFLUENCE ON SCIENCE AND FAUNA PROGRESS
    if (stats.oekoZentraleMode === 'FAUNA') {
      // deduct 1 research as we coordinate rangers
      passiveResearch = Math.max(0, passiveResearch - 1);
      // Advance species progress for all uncompleted species
      setSpeciesList(prev => prev.map(s => {
        if (!s.unlocked) {
          const nextProg = Math.min(100, s.currentProgress + 8);
          const unlocked = nextProg >= 100;
          if (unlocked) {
            addLog(`🐾 ARTENSCHUTZ-ERFOLG: ${s.name} hat sich erfolgreich im Rurtal angesiedelt!`, 'success');
          }
          return { ...s, currentProgress: nextProg, unlocked };
        }
        return s;
      }));
      addLog('🐾 ÖKO-STATUS FAUNA: Intensivierte Ranger-Streifen beschleunigen die Ansiedlung aller freien Arten (+8% Populationsfortschritt, -1 🧪)', 'success');
    }

    // Calculate new biosecurity level (invasive species mechanism)
    let nextBiosecurity = 100;

    if (invasiveThreatEnabled) {
      let biosecurityDelta = -25; // Base decay of 25% if neglected
      let hasInvested = roundInvested;
      
      if (hasInvested) {
        biosecurityDelta = 15; // Recovery if active investments made
      }

      // HQ Level 2 bonus (Netzwerk-Abdeckung) decreases biotop vulnerability
      if (stats.oekoZentraleLevel && stats.oekoZentraleLevel >= 2) {
        biosecurityDelta += 10;
      }

      // Fauna mode gives active protective barrier
      if (stats.oekoZentraleMode === 'FAUNA') {
        biosecurityDelta += 15;
      }
      
      const prevBiosecurity = stats.biosecurity !== undefined ? stats.biosecurity : 100;
      nextBiosecurity = Math.max(0, Math.min(100, prevBiosecurity + biosecurityDelta));

      let triggerInvasive = false;
      if (nextBiosecurity === 0 && prevBiosecurity > 0) {
        triggerInvasive = true;
      }

      if (triggerInvasive) {
        const invasiveEvent: ClimateEvent = {
          id: 'invasive_plage',
          name: 'Invasion des Signalkrebses & Riesen-Bärenklaus',
          description: 'Mangelnde Investitionen in Forschung und biologischen Artenschutz haben zum Zusammenbruch der Biologischen Sicherheit geführt! Biologisch invasive Signalkrebse überwuchern die Gewässerlebensräume und jagen heimische Bachforellen, während der Riesen-Bärenklau die Flussufer instabil macht.',
          effectDescription: 'Die Gewässerökologie erleidet starken Verfall (WRRL +0.6, FFH -15%). Entscheide schnell: Finanzierung einer Erradikations-Kampagne (6 €) [Option A], Entwicklung biologischer Abwehrmaßnahmen (3 🧪) [Option B], oder die Krise ignorieren (-10 Naturpunkte, massiver Artenverlust) [Option C].',
          triggerCondition: 'Biologische Sicherheit auf 0% gesunken.',
          active: true,
          duration: 1
        };
        setActiveEvent(invasiveEvent);
        addLog(`🚨 VOLLSTÄNDIGER BIOM-KOLLAPS (0% Bio-Sicherheit): Eine extrem invasive Fremdartenwelle bricht an der Rur aus!`, 'error');
      } else {
        if (nextBiosecurity <= 50 && biosecurityDelta < 0) {
          addLog(`⚠️ BIOLOGIE-WARNUNG: Der biologische Schutzgürtel schwindet! Bio-Sicherheit sinkt auf ${nextBiosecurity}%. Errichte Fauna-Projekte, führe Upgrades durch oder schalte Forschung frei, um die Natur zu stabilisieren.`, 'warning');
        } else if (biosecurityDelta < 0) {
          addLog(`⚠️ BIOLOGISCHE VERNACHLÄSSIGUNG: Keine Investitionen in Artenschutz, Upgrades oder Forschung in dieser Runde. Bio-Sicherheit sinkt auf ${nextBiosecurity}%.`, 'warning');
        } else {
          addLog(`🛡️ BIOM-SCHUTZ: Deine Bemühungen stabilisieren die Biosphäre. Bio-Sicherheitslevel steigt auf ${nextBiosecurity}%.`, 'success');
        }
      }

      // Apply continuous silent damage while biosecurity is critical (< 30%)
      if (nextBiosecurity <= 30 && !triggerInvasive) {
        // Slowly worsen WRRL and decrease FFH across the region
        setGrid(prev => prev.map(row => row.map(t => {
          if (t.terrain === 'Water') {
            return {
              ...t,
              wrrl_quality: Math.min(5.0, t.wrrl_quality + 0.05),
              ffh_value: Math.max(0, t.ffh_value - 1)
            };
          } else if (t.terrain === 'Wiese' || t.terrain === 'Auwald') {
            return {
              ...t,
              ffh_value: Math.max(0, t.ffh_value - 1)
            };
          }
          return t;
        })));
        addLog(`🦠 SCHÄDLINGS-MELDUNG: Wegen kritischer Bio-Sicherheit (<30%) belasten Kleinstplagen (z.B. Springkraut) schleichend die Gewässerqualität und Biotop-Potenziale (FFH).`, 'warning');
      }
    } else {
      nextBiosecurity = 100;
    }

    // Calculate new renewable energy level (energy transition mechanism)
    let nextRenewableEnergy = stats.renewableEnergy !== undefined ? stats.renewableEnergy : 25;
    let actualYield = netYield;
    let extraClimateRisk = 0;

    // ACTIVE MODE: WATER FOCUS
    if (stats.oekoZentraleMode === 'WATER') {
      actualYield -= 1; // Operational cost
      // Slowly improve WRRL of all river/water tiles
      setGrid(prev => prev.map(row => row.map(t => {
        if (t.terrain === 'Water') {
          return { ...t, wrrl_quality: Math.max(1.0, t.wrrl_quality - 0.1) };
        }
        return t;
      })));
      addLog('💧 ÖKO-STATUS WASSER: Fortlaufende Bachbett-Entschlammung & Algenkontrolle optimiert Rurgüte (WRRL -0.1) (-1 €).', 'success');
    }

    // ACTIVE MODE: RESILIENCE SHIELD
    if (stats.oekoZentraleMode === 'RESILIENCE') {
      actualYield -= 1; // Operational cost
      extraClimateRisk -= 2; // mitigates global temperature/risk spikes
      addLog('🛡️ ÖKO-STATUS RESILIENZ: Aktiver Krisenstab & Sandsack-Disponierung schützt das Sektor-Umland (-2% Klimarisiko, -1 €).', 'success');
    }

    // HQ LEVEL 3 PASSIVE PROTECTION
    if (stats.oekoZentraleLevel === 3) {
      extraClimateRisk -= 1; // additional passive eco-tracking
    }

    if (energyChallengeEnabled) {
      // Base decay: -10% per round due to energy-intensive industry in Düren
      let decay = -10;
      
      const isGreenEnergyTechUnlocked = researchTree.find(r => r.id === 'green_energy_tech')?.unlocked || false;
      if (isGreenEnergyTechUnlocked) {
        decay = -5; // Green energy research cuts decay speed by half!
      }

      const hydroCount = grid.flat().filter(t => t.buildingId === 'wasserkraft').length;
      const solarCount = grid.flat().filter(t => t.buildingId === 'solarpark').length;
      const windCount = grid.flat().filter(t => t.buildingId === 'windkraft').length;

      let investmentBonus = 0;
      if (roundInvested) {
        investmentBonus = 10; // active investment modernizes processes
      }

      const generationOffset = (hydroCount * 12) + (solarCount * 10) + (windCount * 15);
      const netDelta = decay + generationOffset + investmentBonus;
      const prevEnergy = stats.renewableEnergy !== undefined ? stats.renewableEnergy : 25;
      nextRenewableEnergy = Math.max(0, Math.min(100, prevEnergy + netDelta));

      // Financial and environmental penalties/bonuses based on renewable status
      if (nextRenewableEnergy < 35) {
        // Penalty: -2 budget and +2 climate risk
        actualYield -= 2;
        extraClimateRisk = 2;
        addLog(`⚠️ ENERGIE-KRISE: Grüne Energiequote ist bedenklich niedrig (${nextRenewableEnergy}%)! Dürens energieintensive Fabriken zahlen CO2-Fossil-Gebühren (-2 €/Runde) und belasten das Stadtklima (+2% Klimarisiko).`, 'warning');
      } else if (nextRenewableEnergy >= 75) {
        // Bonus: +2 budget and -1 climate risk
        actualYield += 2;
        extraClimateRisk = -1;
        addLog(`⚡ ENERGIE-REFORM: Vorbildliche Ökostrom-Abdeckung (${nextRenewableEnergy}%)! Die lokale Industrie gilt als CO2-neutraler Pionier (+2 €/Runde Förderprämie, -1% Klimarisiko).`, 'success');
      } else {
        addLog(`⚡ GRÜNE ENERGIE: Die erneuerbare Versorgungsquote der Dürener Betriebe liegt stabil bei ${nextRenewableEnergy}%.`, 'info');
      }

      // If renewable energy drops to 0%, trigger a severe energy crisis blackout event!
      if (nextRenewableEnergy === 0 && prevEnergy > 0) {
        const energyEvent: ClimateEvent = {
          id: 'energy_crisis',
          name: 'Dürener Industrie-Stromausfall (Netzkollaps)',
          description: 'Die totale Abhängigkeit von fossiler Kohle/Gas und der vernachlässigte Netzausbau haben zu einer massiven Überlastung geführt. Das Dürener Stromnetz kollabiert unter der industriellen Peak-Last!',
          effectDescription: 'Das wirtschaftliche Leben steht still. CO2-Probleme verschlimmern sich und Blackouts kosten dich sofort Finanzmittel. Wähle Notstrom-Hilfspakete kaufen (5 €) [Option A] oder Ausgleichsflächen liquidieren (-10 Naturpunkte) [Option B].',
          triggerCondition: 'Erneuerbare Energien bei 0%.',
          active: true,
          duration: 1
        };
        setActiveEvent(energyEvent);
        addLog(`🚨 VOLLSTÄNDIGER NETZCOLLAPS (0% Erneuerbare Energien): Dürens Industrie bricht mangels Stromversorgung zusammen!`, 'error');
      }
    } else {
      nextRenewableEnergy = 100;
    }

    // Reset round-level investment tracker for next round
    setRoundInvested(false);

    // Global native Climate risk escalation (mitigated by Auwalds, accelerated in final stage)
    const auwaldPlanted = grid.flat().filter(t => t.terrain === 'Auwald').length;
    const baseEscalation = nextYear >= 2029 ? 2.5 : 2.0;
    const climateDamper = Math.max(0.5, baseEscalation - (auwaldPlanted * 0.25));

    // Calculate citizen acceptance dynamic shift per round
    const coopsActive = stats.cooperativesActive;
    let acceptanceDeltaRound = 0;
    let localAcceptanceLog = "";

    // ONLY active if Year is 2027 or later (progressive level challenge)
    if (nextYear > 2026) {
      if (coopsActive) {
        acceptanceDeltaRound = 5;
        localAcceptanceLog = "🪙 GENOSSENSCHAFTS-RENDITE: Die Bürger-Energiegenossenschaft schüttet Dividenden aus. Bürgerakzeptanz steigt (+5%).";
      } else {
        const currentEnergy = stats.renewableEnergy !== undefined ? stats.renewableEnergy : 25;
        if (currentEnergy > 45) {
          acceptanceDeltaRound = -4;
          localAcceptanceLog = "📢 NIMBY-EFFEKT: Anwohner kritisieren Wind/Solar-Infrastruktur ohne finanzielle Beteiligung (-4% Akzeptanz). Überlege Bürger-Energiegenossenschaften zu gründen!";
        }
      }
    }

    // Trigger progressive modal on transition into a new year
    if (nextRound === 5) {
      setActiveYearChallengeModal(2027);
      addLog("📅 JAHR 2027 ANGEBRECHEN: Neue Herausforderung freigeschaltet - Bürgerakzeptanz im Sektor!", "warning");
      addLog("👨‍🔬 KOOPERATIONS-ANGEBOT: Dr. Daniel Holstein schlägt vor: 'Allianz für Mikroschadstoff-Monitoring'. Besuche die Öko-Zentrale für Details!", "event");
    } else if (nextRound === 9) {
      setActiveYearChallengeModal(2028);
      setInvasiveThreatEnabled(true);
      setEnergyChallengeEnabled(true);
      addLog("📅 JAHR 2028 ANGEBRECHEN: Neue Herausforderung freigeschaltet - Extreme Katastrophen & Biosicherheit!", "warning");
    } else if (nextRound === 13) {
      setActiveYearChallengeModal(2029);
      addLog("📅 JAHR 2029 ANGEBRECHEN: Finale Herausforderung freigeschaltet - Systemische Gesamtkrise!", "warning");
    }

    if (nextRound === 2) {
      addLog("👩‍💼 KOOPERATIONS-ANGEBOT: Lara Kufferath bietet Kooperation an: 'Projekt GreenPulse Schoellershammer'. Prüfe die Kriterien in deiner Öko-Zentrale!", "event");
    } else if (nextRound === 6) {
      addLog("👨‍💼 KOOPERATIONS-ANGEBOT: Bürgermeister Frank Peter Ulrich schlägt vor: 'Bürger-Nahverkehr Allianz Rurtalbahn'. Werfe einen Blick auf die Anforderungen!", "event");
    }

    // Evaluate Technological Obsolescence Pressure (Technologischer Veraltungsdruck)
    const enteringNewYear = (nextRound - 1) % 4 === 0 && nextRound > 1;
    let nextPenalty = stats.factoryObsolescencePenalty ?? 0;
    let nextInvestedThisYear = stats.investedThisYear ?? false;

    if (enteringNewYear) {
      if (stats.paperFactoryMode === 'PRODUCTION') {
        if (!nextInvestedThisYear) {
          nextPenalty += 1;
          addLog(`📉 TECH-VERALTUNG: Weil im vergangenen Jahr nicht in Forschung oder Upgrades investiert wurde, sinkt die wirtschaftliche Effizienz der Fabrik im Produktionsmodus dauerhaft (Einbuße von -1 €)!`, 'error');
        } else {
          addLog(`✨ INNOVATIVES KLIMA: Dank deiner Investitionen in Forschung oder Upgrades hält die Fabrik dem technologischen Veraltungsdruck vorerst stand!`, 'success');
        }
      }
      nextInvestedThisYear = false; // Reset for the new year
    }

    // Update state stats
    setStats(prev => {
      const currentAcc = prev.citizenAcceptance !== undefined ? prev.citizenAcceptance : 80;
      const nextAcc = Math.max(0, Math.min(100, currentAcc + acceptanceDeltaRound));
      return {
        ...prev,
        round: nextRound,
        year: nextYear,
        budget: Math.max(0, prev.budget + actualYield),
        researchPoints: prev.researchPoints + passiveResearch,
        naturePoints: prev.naturePoints + passiveNature,
        climateRisk: Math.min(100, Math.max(0, prev.climateRisk + Math.round(climateDamper) + extraClimateRisk)),
        biosecurity: nextBiosecurity,
        renewableEnergy: nextRenewableEnergy,
        citizenAcceptance: nextYear > 2026 ? nextAcc : currentAcc,
        factoryObsolescencePenalty: nextPenalty,
        investedThisYear: nextInvestedThisYear
      };
    });

    if (localAcceptanceLog) {
      addLog(localAcceptanceLog, coopsActive ? 'success' : 'warning');
    }

    addLog(`Finanzlage: Steuereinnahmen +${dynamicRevenue + factoryTaxRevenue} € erhalten, Instandhaltung -${netMaintenance} € abgezogen (Netto: ${actualYield} €).`, 'info');
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
    if (roundNum < 9) {
      addLog("🌤️ RUHE VOR DEM STURM: In den ersten beiden Jahren bleibt das Rurtal vor großen Naturkatastrophen verschont. Mache dich vertraut mit der Karte!", "info");
      return;
    }
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
        // Punish player but check Early Warning System of HQ
        const isEwsActive = stats.earlyWarningSystemActive || stats.oekoZentraleLevel === 3;
        const actualDamage = isEwsActive ? 6 : 12;

        setStats(prev => ({ ...prev, budget: Math.max(0, prev.budget - actualDamage) }));
        if (isEwsActive) {
          addLog(`⚠️ FRÜHWARNSTAB AKTIV: Dank des installierten Frühwarnsystems am Hauptquartier wurden Sandsäcke rechtzeitig disponiert! Schaden auf -6 € halbiert (statt 12 €).`, 'success');
        } else {
          addLog('❌ FLUT-KATASTROPHE: Fehlende Deichrückverlegungen oder Polder führen zu Überschwemmungen in städtischen Sektoren. Reparaturen kosten dich -12 €.', 'error');
        }
      }
    } 
    else if (activeEvent.id === 'duerre') {
      // Drought summer
      if (decision === 'pay') {
        setStats(prev => ({ ...prev, budget: Math.max(0, prev.budget - 4) }));
        addLog('💧 DÜRRESHIELD: Du leitest Notflutungen aus den Rurtalsperren ein. Störfaktoren stabilisiert (-4 €).', 'info');
      } else {
        const hqMitigation = stats.earlyWarningSystemActive || stats.oekoZentraleLevel === 3;
        const actualLoss = hqMitigation ? 4 : 8;
        setStats(prev => ({ ...prev, naturePoints: Math.max(0, prev.naturePoints - actualLoss) }));
        if (hqMitigation) {
          addLog(`⚠️ DÜRRE-ABWEHR: Das modernisierte HQ Düren steuert Rurschwellen zur Minimalfeuchte! Artenschutz-Verlust halbiert auf -${actualLoss} 🌿 (statt 8 🌿).`, 'success');
        } else {
          addLog('❌ SCHWERE IMPAKTE: Fischsterben am Unterlauf der Rur zerstört regionale Artenpopulationen (-8 Artenschutz-Punkte).', 'error');
        }
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
    else if (activeEvent.id === 'invasive_plage') {
      if (decision === 'pay') {
        setStats(prev => ({
          ...prev,
          budget: Math.max(0, prev.budget - 6),
          biosecurity: 100
        }));
        addLog('🦠 INVASIVE BESEITIGUNG: Erfahrene Ranger und Freiwillige entfernen Bestände des Riesen-Bärenklaus und fangen Signalkrebse ab. Bio-Sicherheit wieder bei 100% (-6 €).', 'success');
      } else if (decision === 'eco') {
        if (stats.researchPoints < 3) {
          addLog('❌ AKTION UNMÖGLICH: Nicht genügend Forschungspunkte vorhanden (3 🧪 benötigt).', 'error');
          return;
        }
        setStats(prev => ({
          ...prev,
          researchPoints: prev.researchPoints - 3,
          naturePoints: prev.naturePoints + 15,
          biosecurity: 100
        }));
        addLog('🧪 NATIVE BIO-KONTROLLE: Durch Freisetzung modifizierter, steriler Signalkrebse dämmst du die Plage biologisch ein. Bio-Sicherheit wieder bei 100% (-3 🧪, +15 Naturpunkte).', 'success');
      } else {
        const isEwsActive = stats.earlyWarningSystemActive || stats.oekoZentraleLevel === 3;
        const penaltyNature = isEwsActive ? 5 : 10;
        setStats(prev => ({
          ...prev,
          biosecurity: 10,
          naturePoints: Math.max(0, prev.naturePoints - penaltyNature)
        }));
        setGrid(prev => prev.map(row => row.map(t => {
          if (t.terrain === 'Water') {
            return {
              ...t,
              wrrl_quality: Math.min(5.0, t.wrrl_quality + 0.6),
              ffh_value: Math.max(0, t.ffh_value - 15)
            };
          } else if (t.terrain === 'Wiese' || t.terrain === 'Auwald') {
            return {
              ...t,
              ffh_value: Math.max(0, t.ffh_value - 15)
            };
          }
          return t;
        })));
        setSpeciesList(prev => prev.map(s => ({
          ...s,
          currentProgress: Math.max(0, s.currentProgress - 20)
        })));
        if (isEwsActive) {
          addLog(`🦠 INVASIONS-PEILUNG: Durch HQ-Artenschutzdrohnen wurden empfindliche Zuchträume vorübergehend verlagert. Naturschaden halbiert auf -${penaltyNature} 🌿.`, 'success');
        } else {
          addLog('❌ KATASTROPHE AUSGESESSEN: Du hast die invasive Artenplage ignoriert. Beide Uferseiten sind von Riesen-Bärenklau überwuchert und Signalkrebse dominieren das Flussbett. Arten geschädigt (-10 Naturpunkte, WRRL & FFH-Potenziale verschlechtert).', 'error');
        }
      }
    }
    else if (activeEvent.id === 'energy_crisis') {
      if (decision === 'pay') {
        setStats(prev => ({
          ...prev,
          budget: Math.max(0, prev.budget - 5),
          renewableEnergy: 40
        }));
        addLog('⚡ NOTSTROM GEKAUFT: Du finanzierst teure temporäre Ökostrom-Importe und Netzkupplungen. Die Energieversorgung stabilisiert sich auf 40% (-5 €).', 'success');
      } else {
        setStats(prev => ({
          ...prev,
          naturePoints: Math.max(0, prev.naturePoints - 10),
          renewableEnergy: 20
        }));
        setGrid(prev => prev.map(row => row.map(t => {
          if (t.buildingId === 'solarpark' || t.buildingId === 'windkraft' || t.buildingId === 'wasserkraft') {
            return t;
          }
          if (t.terrain === 'Auwald' && Math.random() < 0.3) {
            return {
              ...t,
              terrain: 'Wiese' as TerrainType,
              ffh_value: Math.max(10, t.ffh_value - 30)
            };
          }
          return t;
        })));
        addLog('❌ AUSGLEICHSFLÄCHEN GEOPFERT: Um Übertragungsleitungen zu bauen, werden geschützte Waldflächen gerodet und Kohlenkraftwerke behelfsmäßig reaktiviert (-10 Naturpunkte, teilweiser Artenverlust).', 'error');
      }
    }

    setActiveEvent(null);
  };

  const checkQuestRequirements = useCallback((q: StakeholderQuest): boolean => {
    // 1. check researchPoints
    if (q.requirements.researchPoints !== undefined && stats.researchPoints < q.requirements.researchPoints) {
      return false;
    }
    // 2. check budget
    if (q.requirements.budget !== undefined && stats.budget < q.requirements.budget) {
      return false;
    }
    // 3. check buildingId
    if (q.requirements.buildingId !== undefined) {
      const hasBuilding = grid.flat().some(t => t.buildingId === q.requirements.buildingId);
      if (!hasBuilding) return false;
    }
    // 4. check paperFactoryMode
    if (q.requirements.paperFactoryMode !== undefined && stats.paperFactoryMode !== q.requirements.paperFactoryMode) {
      return false;
    }
    // 5. check researchId
    if (q.requirements.researchId !== undefined) {
      const isResearchUnlocked = researchTree.find(r => r.id === q.requirements.researchId)?.unlocked || false;
      if (!isResearchUnlocked) return false;
    }
    return true;
  }, [stats.researchPoints, stats.budget, stats.paperFactoryMode, grid, researchTree]);

  const completeStakeholderQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    if (!checkQuestRequirements(quest)) {
      addLog(`❌ KOOPERATION UNZULÄSSIG: Du erfüllst noch nicht alle Voraussetzungen für "${quest.title}".`, 'error');
      return;
    }

    setQuests(prev => prev.map(q => q.id === questId ? { ...q, status: 'completed' } : q));

    // Apply rewards
    setStats(prev => {
      let finalBudget = prev.budget;
      if (quest.reward.budget !== undefined) {
        finalBudget = Math.max(0, finalBudget + quest.reward.budget);
      }
      const finalResearch = prev.researchPoints + (quest.reward.researchPoints ?? 0);
      const finalNature = prev.naturePoints + (quest.reward.naturePoints ?? 0);
      const finalAcceptance = Math.min(100, (prev.citizenAcceptance ?? 80) + (quest.reward.citizenAcceptance ?? 0));
      
      let finalBiosecurity = prev.biosecurity;
      // Special logic for quest_mikroschadstoffe
      if (questId === 'quest_mikroschadstoffe') {
        finalBiosecurity = Math.min(100, finalBiosecurity + 20);
      }

      return {
        ...prev,
        budget: finalBudget,
        researchPoints: finalResearch,
        naturePoints: finalNature,
        citizenAcceptance: finalAcceptance,
        biosecurity: finalBiosecurity
      };
    });

    addLog(`🤝 KOOPERATION ERFOLGREICH: "${quest.title}" mit ${quest.stakeholder} abgeschlossen!`, 'success');
    addLog(`🎁 Belohnungen gutgeschrieben: ${quest.rewardText}`, 'success');

    // Trigger update of co2 footprint because of completed quest
    setTimeout(() => {
      updateGlobalMetrics(grid, stats.paperFactoryMode, researchTree);
    }, 50);
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
        rurtalbahnSlotsUsed: 0,
        biosecurity: 100,
        renewableEnergy: 25,
        citizenAcceptance: 80,
        cooperativesActive: false,
        oekoZentraleLevel: 1,
        oekoZentraleMode: 'STANDARD',
        earlyWarningSystemActive: false,
        co2Footprint: 190.0
      });
      setActiveEvent(null);
      setRurtalbahnLeased(false);
      setPdfSimulated(false);
      setSelectedTileInfo(null);
      setInvasiveThreatEnabled(false);
      setShowInvasiveRules(false);
      setEnergyChallengeEnabled(false);
      setShowEnergyRules(false);
      setActiveYearChallengeModal(null);
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

          {/* Core CO2 Footprint Indicator */}
          <div className="flex items-center gap-2 px-2 border-l border-[#D4CCBA]/50">
            <div className="p-1 rounded-full text-xs font-bold leading-none select-none bg-emerald-100">
              🌱
            </div>
            <div className="text-left font-mono whitespace-nowrap">
              <div className="text-[10px] text-[#8B8273] leading-none">CO₂-FUẞABDRUCK</div>
              <div className="text-brand-dark font-bold text-xs tracking-tight flex items-center gap-1.5">
                <span className={
                  (stats.co2Footprint ?? 190.0) <= 60.0 ? 'text-emerald-600 font-extrabold' :
                  (stats.co2Footprint ?? 190.0) <= 120.0 ? 'text-[#5A7247] font-extrabold' :
                  (stats.co2Footprint ?? 190.0) <= 180.0 ? 'text-[#BC6C25]' : 'text-rose-600 font-black animate-pulse'
                }>
                  {(stats.co2Footprint ?? 190.0).toFixed(1)} t/Rnd
                </span>
                <span className={`text-[8.5px] px-1 py-0.2 rounded font-sans uppercase font-extrabold border ${
                  (stats.co2Footprint ?? 190.0) <= 60.0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  (stats.co2Footprint ?? 190.0) <= 120.0 ? 'bg-green-50 text-green-700 border-green-200' :
                  (stats.co2Footprint ?? 190.0) <= 180.0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-300'
                }`}>
                  {(stats.co2Footprint ?? 190.0) <= 60.0 ? 'Klimapfad' :
                   (stats.co2Footprint ?? 190.0) <= 120.0 ? 'Nachhaltig' :
                   (stats.co2Footprint ?? 190.0) <= 180.0 ? 'Erhöht' : 'Kritisch'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Control Action Sub-bar to organize user flow and declutter layout */}
      <div className="bg-[#FAF8F5] border-b border-brand-lightsky/15 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Save & Load Game Session Buttons */}
          <button
            onClick={saveGame}
            className="px-3 py-1.5 rounded-lg bg-[#E2EBD5] hover:bg-[#D3E0C1] text-[#2C3311] border border-[#B8C8A3] font-bold tracking-tight text-[11px] uppercase cursor-pointer duration-150 shadow-sm shrink-0 font-sans transition-all transform active:scale-95 flex items-center gap-1.5"
            title="Aktuellen Fortschritt speichern"
          >
            <Save className="w-3.5 h-3.5 text-[#5A7247]" />
            Speichern
          </button>

          <button
            onClick={loadGame}
            className="px-3 py-1.5 rounded-lg bg-[#E5F2F5] hover:bg-[#D1E6EB] text-[#1D4E5B] border border-[#B0D3DC] font-bold tracking-tight text-[11px] uppercase cursor-pointer duration-150 shadow-sm shrink-0 font-sans transition-all transform active:scale-95 flex items-center gap-1.5"
            title="Zuletzt gespeicherten Spielstand laden"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#2A6F7E]" />
            Laden
          </button>

          {/* Undo Action Button */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`px-3 py-1.5 rounded-lg border font-bold tracking-tight text-[11px] uppercase cursor-pointer duration-150 shadow-sm shrink-0 font-sans transition-all transform active:scale-95 flex items-center gap-1.5 ${
              history.length > 0
                ? 'bg-amber-50 hover:bg-amber-100 text-[#7A3F1F] border-amber-300'
                : 'bg-white/40 text-gray-400 border-gray-200 cursor-not-allowed opacity-55'
            }`}
            title={history.length > 0 ? `Letzte Aktion rückgängig machen: "${history[0].actionName}"` : 'Keine Aktionen vorhanden, die rückgängig gemacht werden können'}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${history.length > 0 ? 'text-[#BC6C25] animate-spin-reverse' : 'text-gray-400'}`} />
            Rückgängig {history.length > 0 ? `(${history.length})` : ''}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Help & Tutorial button */}
          <button
            onClick={() => {
              setTutorialStep(0);
              setShowTutorial(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#E8E2D6] hover:bg-[#DCD4C4] text-[#2C3311] border border-[#D4CCBA] font-bold tracking-tight text-[11px] uppercase cursor-pointer duration-150 shadow-sm shrink-0 font-sans transition-all transform active:scale-95 flex items-center gap-1.5"
            title="Schritt-für-Schritt Einführung anzeigen"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#5A7247]" />
            Einführung
          </button>

          {/* Detailed game rules manual button */}
          <button
            onClick={() => {
              setShowSpielregeln(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#F5EAD4] hover:bg-[#ECDEBF] text-[#7A3F1F] border border-[#DCC5A3] font-bold tracking-tight text-[11px] uppercase cursor-pointer duration-150 shadow-sm shrink-0 font-sans transition-all transform active:scale-95 flex items-center gap-1.5"
            title="Detaillierte Spielregeln und mechanische Zusammenhänge anzeigen"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#BC6C25]" />
            Spielanleitung
          </button>

          {/* Feedback button */}
          <button
            onClick={() => { setShowFeedback(true); setFeedbackSubmitted(false); }}
            className="px-3 py-1.5 rounded-lg bg-[#EDE8F5] hover:bg-[#E0D8F0] text-[#3D2C6E] border border-[#C8BAE8] font-bold tracking-tight text-[11px] uppercase cursor-pointer duration-150 shadow-sm shrink-0 font-sans transition-all transform active:scale-95 flex items-center gap-1.5"
            title="Feedback zur Simulation geben"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#6B52AE]" />
            Feedback
          </button>

          {/* Advance Turn trigger button */}
          <button
            onClick={handleNextRound}
            className="px-4 py-1.5 rounded-lg bg-brand-green hover:bg-brand-green/90 text-white font-black tracking-tight text-[11px] uppercase cursor-pointer duration-150 shadow-md shrink-0 font-sans transition-all transform active:scale-95 animate-pulse"
          >
            Runde beenden ↩
          </button>
        </div>
      </div>

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
              season={currentSeasonString}
              selectedTile={
                placementConfirmation 
                  ? { x: placementConfirmation.x, y: placementConfirmation.y } 
                  : (selectedTileInfo ? { x: selectedTileInfo.x, y: selectedTileInfo.y } : null)
              }
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
          
          {/* Simulation-Szenarien & Extra-Herausforderungen (Invasive & Energiewende) */}
          <div className="bg-[#EADECE]/85 border-2 border-[#BC6C25]/45 rounded-xl shadow-sm flex flex-col gap-1 relative overflow-hidden transition-all duration-300">
            {/* Collapse/Expand Toggle Bar */}
            <div 
              onClick={() => setChallengesCollapsed(prev => !prev)}
              className="p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#EADBCE] duration-150 border-b border-[#D4CCBA]/30 bg-white/[0.12]"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🏆</span>
                <div className="text-left">
                  <h3 className="text-xs font-black text-[#2C3311] uppercase tracking-wider leading-none">
                    Zusatz-Herausforderungen
                  </h3>
                  <span className="text-[9px] text-[#8B8273] font-bold">
                    {challengesCollapsed ? 'Klicken zum Einblenden & Verwalten' : 'Klicken zum Einklappen & Verbergen'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mini status indicators */}
                <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold select-none">
                  {invasiveThreatEnabled ? (
                    <span className={`px-1.5 py-0.5 rounded ${
                      (stats.biosecurity ?? 100) >= 70 ? 'bg-[#5A7247]/20 text-[#2C3311]' :
                      (stats.biosecurity ?? 100) >= 30 ? 'bg-[#BC6C25]/20 text-[#7A3F1F]' : 'bg-red-100 text-red-900 animate-pulse'
                    }`}>
                      🦠 Bio: {stats.biosecurity}%
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-400">
                      🦠 Aus
                    </span>
                  )}

                  {energyChallengeEnabled ? (
                    <span className={`px-1.5 py-0.5 rounded ${
                      (stats.renewableEnergy ?? 25) >= 70 ? 'bg-emerald-100 text-emerald-850' :
                      (stats.renewableEnergy ?? 25) >= 35 ? 'bg-amber-100 text-[#7A3F1F]' : 'bg-red-100 text-red-900 animate-pulse'
                    }`}>
                      ⚡ Öko: {stats.renewableEnergy}%
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-400">
                      ⚡ Aus
                    </span>
                  )}
                </div>

                {challengesCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-[#BC6C25] shrink-0" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-[#BC6C25] shrink-0" />
                )}
              </div>
            </div>

            {/* Collapsible content wrapper */}
            <div className={`p-4 pt-1 flex flex-col gap-4 relative ${challengesCollapsed ? 'hidden' : 'block'}`}>
            
            {/* INVASIVE SPECIES CHALLENGE */}
            <div className="border-b border-[#D4CCBA] pb-3.5">
              {(() => {
                const currentBio = stats.biosecurity !== undefined ? stats.biosecurity : 100;
                const projectedDelta = roundInvested ? 15 : -25;
                const projectedNext = Math.max(0, Math.min(100, currentBio + projectedDelta));
                
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm select-none">🦠</span>
                        <span className="text-xs font-black text-[#2C3311] uppercase tracking-wide">
                          Invasive Bedrohung (Schwer)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowInvasiveRules(true)}
                          className="text-[#BC6C25] hover:text-[#9e5212] underline text-[10px] font-black cursor-pointer transition-colors"
                        >
                          [Regeln]
                        </button>
                      </div>
                      
                      {/* Switch style toggle */}
                      <div 
                        className="flex items-center gap-2 relative"
                        onMouseEnter={() => setIsHoveringToggle(true)}
                        onMouseLeave={() => setIsHoveringToggle(false)}
                      >
                        <span className={`text-[10px] font-mono font-black uppercase transition-colors duration-200 ${invasiveThreatEnabled ? 'text-[#BC6C25]' : 'text-[#8B8273]'}`}>
                          {invasiveThreatEnabled ? 'Aktiv' : 'Aus'}
                        </span>
                        
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            id="invasive-difficulty-toggle"
                            type="checkbox"
                            checked={invasiveThreatEnabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setInvasiveThreatEnabled(enabled);
                              if (enabled) {
                                setShowInvasiveRules(true);
                                addLog('🚨 BIOLOGISCHER STRESSOR-MODUS AKTIVIERT: Biologische Sicherheit sinkt nun und bricht bei Vernachlässigung zusammen!', 'warning');
                              } else {
                                addLog('🛡️ Biologischer Stressor-Modus deaktiviert. Biologische Sicherheit stabilisiert.', 'success');
                              }
                            }}
                            onFocus={() => setIsHoveringToggle(true)}
                            onBlur={() => setIsHoveringToggle(false)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#D4CCBA] rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BC6C25]"></div>
                        </label>

                        {/* PROJECTION PREVIEW TOOLTIP */}
                        {isHoveringToggle && (
                          <div 
                            id="biosecurity-hover-preview" 
                            className="absolute right-0 top-6 mt-1.5 w-64 bg-[#2C3311] text-[#F2EDE4] text-[10px] p-3 rounded-xl border-2 border-[#BC6C25] shadow-xl z-[9999] pointer-events-none space-y-2 animate-fade-in text-left font-sans animate-scale-up"
                          >
                            <div className="flex items-center justify-between border-b border-white/10 pb-1 font-extrabold text-[9px] uppercase tracking-wider text-[#BC6C25]">
                              <span>🔮 Prognose-Vorschau</span>
                              <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-[8px] tracking-normal text-white">Nächste Runde</span>
                            </div>

                            {!invasiveThreatEnabled ? (
                              <div className="space-y-1.5">
                                <p className="text-[10px] text-white/90 leading-normal block">
                                  Vor der Aktivierung beachten:
                                </p>
                                <div className="flex justify-between font-mono bg-white/5 p-1 rounded text-[9.5px]">
                                  <span className="text-white/60">Aktueller Wert:</span>
                                  <span className="text-white font-bold">{currentBio}%</span>
                                </div>
                                <p className="text-[9.5px] text-stone-300 leading-tight">
                                  Nach Aktivierung sinkt die Bio-Sicherheit bei Inaktivität um <strong className="text-rose-400 font-black">-25%</strong>, lässt sich jedoch durch gezielten Bio- &amp; Artenschutz um <strong className="text-emerald-400 font-black">+15%</strong> stabilisieren.
                                </p>
                                <div className="text-[9px] font-mono text-[#BC6C25] bg-amber-950/20 p-1.5 rounded border border-[#BC6C25]/30">
                                  Erwartet bei Aktivierung:<br/>
                                  • Erholung: <strong className="text-emerald-400">{Math.min(100, currentBio + 15)}%</strong><br/>
                                  • Verfall: <strong className="text-rose-400">{Math.max(0, currentBio - 25)}%</strong>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex justify-between font-mono text-[9.5px]">
                                  <span className="text-white/60">Aktueller Status:</span>
                                  <span className="text-white font-bold">{currentBio}%</span>
                                </div>
                                <div className="flex justify-between font-mono text-[9.5px]">
                                  <span className="text-white/60 text-left">Investition getätigt:</span>
                                  <span className={roundInvested ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                    {roundInvested ? "Ja (+15%)" : "Nein (-25%)"}
                                  </span>
                                </div>
                                <hr className="border-white/10 my-1" />
                                <div className="flex justify-between font-mono font-bold leading-tight text-[9.5px]">
                                  <span className="text-[#BC6C25]">Trend nächste Runde:</span>
                                  <span className={projectedDelta >= 0 ? "text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded font-black text-[10px]" : "text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded font-black text-[10px]"}>
                                    ➔ {projectedNext}% ({projectedDelta >= 0 ? '+' : ''}{projectedDelta}%)
                                  </span>
                                </div>

                                {projectedNext <= 30 && (
                                  <div className="text-[9px] text-rose-300 leading-tight bg-rose-950/60 p-1.5 rounded border border-rose-900/30">
                                    {projectedNext === 0 
                                      ? '🚨 KRITISCH: Drohender Plagen-Ausbruch bei 0%!' 
                                      : '⚠️ ACHTUNG: Schleichender Gewässerverfall bei <30%!'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-[#554A3C]/95 leading-normal">
                      Aktiviert biologische Bedrohungszyklen: Runder-Zollschritt verringert die Bio-Sicherheit kontinuierlich um <span className="font-extrabold">-25%</span> bei Inaktivität. Bei biom-kritischem Wert (<span className="font-extrabold">&lt;30%</span>) degradieren Flussqualitäten (WRRL) schleichend, bei <span className="font-extrabold">0%</span> droht ein unkontrollierter Befall (Plagen-Event).
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* RENEWABLE ENERGY CHALLENGE */}
            <div>
              {(() => {
                const currentEnergy = stats.renewableEnergy !== undefined ? stats.renewableEnergy : 25;
                
                // Calculate projected delta
                let decay = -10;
                const isGreenEnergyTechUnlocked = researchTree.find(r => r.id === 'green_energy_tech')?.unlocked || false;
                if (isGreenEnergyTechUnlocked) {
                  decay = -5;
                }
                const hydroCount = grid.flat().filter(t => t.buildingId === 'wasserkraft').length;
                const solarCount = grid.flat().filter(t => t.buildingId === 'solarpark').length;
                const windCount = grid.flat().filter(t => t.buildingId === 'windkraft').length;

                let investmentBonus = 0;
                if (roundInvested) {
                  investmentBonus = 10;
                }

                const generationOffset = (hydroCount * 12) + (solarCount * 10) + (windCount * 15);
                const netDelta = decay + generationOffset + investmentBonus;
                const projectedNext = Math.max(0, Math.min(100, currentEnergy + netDelta));

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm select-none">⚡</span>
                        <span className="text-xs font-black text-[#2C3311] uppercase tracking-wide">
                          Energiewende-Zwang (Mittel)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowEnergyRules(true)}
                          className="text-[#BC6C25] hover:text-[#9e5212] underline text-[10px] font-black cursor-pointer transition-colors"
                        >
                          [Regeln]
                        </button>
                      </div>

                      {/* Switch style toggle */}
                      <div 
                        className="flex items-center gap-2 relative"
                        onMouseEnter={() => setIsHoveringEnergyToggle(true)}
                        onMouseLeave={() => setIsHoveringEnergyToggle(false)}
                      >
                        <span className={`text-[10px] font-mono font-black uppercase transition-colors duration-200 ${energyChallengeEnabled ? 'text-[#BC6C25]' : 'text-[#8B8273]'}`}>
                          {energyChallengeEnabled ? 'Aktiv' : 'Aus'}
                        </span>
                        
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            id="energy-difficulty-toggle"
                            type="checkbox"
                            checked={energyChallengeEnabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setEnergyChallengeEnabled(enabled);
                              if (enabled) {
                                setShowEnergyRules(true);
                                addLog('⚡ ENERGIEWENDE GELADEN: Dürens Industrie gerät unter Dekarbonisierungsdruck! Baue grüne Kraftwerke zur Versorgung.', 'warning');
                              } else {
                                addLog('🛡️ Energiewende-Szenario deaktiviert. Ökostromversorgung stabilisiert.', 'success');
                              }
                            }}
                            onFocus={() => setIsHoveringEnergyToggle(true)}
                            onBlur={() => setIsHoveringEnergyToggle(false)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#D4CCBA] rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BC6C25]"></div>
                        </label>

                        {/* PROJECTION PREVIEW TOOLTIP */}
                        {isHoveringEnergyToggle && (
                          <div 
                            id="energy-hover-preview" 
                            className="absolute right-0 top-6 mt-1.5 w-64 bg-[#2C3311] text-[#F2EDE4] text-[10px] p-3 rounded-xl border-2 border-[#BC6C25] shadow-xl z-[9999] pointer-events-none space-y-2 animate-fade-in text-left font-sans animate-scale-up"
                          >
                            <div className="flex items-center justify-between border-b border-white/10 pb-1 font-extrabold text-[9px] uppercase tracking-wider text-[#BC6C25]">
                              <span>🔮 Energiewende-Prognose</span>
                              <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-[8px] tracking-normal text-white">Nächste Runde</span>
                            </div>

                            {!energyChallengeEnabled ? (
                              <div className="space-y-1.5">
                                <p className="text-[10px] text-white/90 leading-normal block">
                                  Vor der Aktivierung beachten:
                                </p>
                                <div className="flex justify-between font-mono bg-white/5 p-1 rounded text-[9.5px]">
                                  <span className="text-white/60">Aktuelle Versorgung:</span>
                                  <span className="text-white font-bold">{currentEnergy}%</span>
                                </div>
                                <p className="text-[9.5px] text-stone-300 leading-tight">
                                  Dürens Industrie verlangt Dekarbonisierung. Ohne Erzeuger droht ein Runden-Abfall von <strong className="text-rose-400 font-black">{decay}%</strong>.
                                </p>
                                <div className="text-[9px] font-mono text-[#BC6C25] bg-amber-950/20 p-1.5 rounded border border-[#BC6C25]/30">
                                  Wirkung auf der Karte:<br/>
                                  • Klein-Wasserkraft: <strong className="text-emerald-400">+{hydroCount * 12}%</strong><br/>
                                  • Solarwiesen: <strong className="text-emerald-400">+{solarCount * 10}%</strong><br/>
                                  • Bürger-Windturbinen: <strong className="text-emerald-400">+{windCount * 15}%</strong>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5 font-sans">
                                <div className="flex justify-between font-mono text-[9.5px]">
                                  <span className="text-white/60 text-left">Grüne Quote:</span>
                                  <span className="text-white font-bold">{currentEnergy}%</span>
                                </div>
                                <div className="flex justify-between font-mono text-[9.5px]">
                                  <span className="text-white/60 text-left">Basis-Industriewert:</span>
                                  <span className="text-rose-400 font-bold">{decay}% / Runde</span>
                                </div>
                                <div className="flex justify-between font-mono text-[9.5px]">
                                  <span className="text-white/60 text-left">Grüne Generierung:</span>
                                  <span className="text-emerald-400 font-bold">+{generationOffset}% / Runde</span>
                                </div>
                                <div className="flex justify-between font-mono text-[9.5px]">
                                  <span className="text-white/60 text-left">Bautätigkeit-Boost:</span>
                                  <span className="text-emerald-400 font-bold">+{investmentBonus}%</span>
                                </div>
                                <hr className="border-white/10 my-1" />
                                <div className="flex justify-between font-mono font-bold leading-tight text-[9.5px]">
                                  <span className="text-[#BC6C25]">Ziel-Wert nächste Runde:</span>
                                  <span className={netDelta >= 0 ? "text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded font-black text-[10px]" : "text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded font-black text-[10px]"}>
                                    ➔ {projectedNext}% ({netDelta >= 0 ? '+' : ''}{netDelta}%)
                                  </span>
                                </div>

                                {projectedNext < 35 && (
                                  <div className="text-[9px] text-rose-300 leading-tight bg-rose-950/60 p-1.5 rounded border border-rose-900/30">
                                    {projectedNext === 0 
                                      ? '🚨 NETZCOLLAPS: Drohender Netzausfall bei 0%!' 
                                      : '⚠️ GEBÜHR: CO2-Fossil-Steuer droht bei <35%!'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-[#554A3C]/95 leading-normal">
                      Simuliert den industriellen Ökostrom-Zwang: Verfall von <span className="font-extrabold">-10%</span> pro Runde (reduzierbar auf <span className="font-extrabold">-5%</span> per Forschung). Halte die Quote über <span className="font-extrabold">35%</span>, um Strafsteuern abzuwenden, oder erreiche <span className="font-extrabold">75%</span> für lukrative Boni.
                    </p>
                  </div>
                );
              })()}
            </div>

            </div>
          </div>

          {/* COCKPIT NAVIGATION DECK */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#D4CCBA] pb-1.5 px-0.5">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#8B8273] flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                🎛️ AKTIVES SIMULATIONS-PANEL
              </span>
              <span className="text-[9px] font-mono font-bold text-[#8B8273] hidden sm:inline">
                Klicke auf einen Bereich zur Steuerung
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 bg-[#E8E2D6]/85 border border-[#D4CCBA] p-2 rounded-xl shadow-sm">
              {[
                {
                  id: 'map' as const,
                  title: 'Baukatalog',
                  subtitle: 'Flussrenaturierung',
                  icon: Hammer,
                  iconColor: 'text-[#5A7247]',
                  bgColor: 'bg-[#5A7247]/10',
                  getBadge: () => {
                    const bcount = grid.flat().filter(t => t.buildingId && t.buildingId !== 'schoellershammer').length;
                    return `${bcount} Bauten`;
                  },
                  badgeColor: 'bg-[#5A7247]/20 text-[#2C3311]'
                },
                {
                  id: 'schoeller' as const,
                  title: 'Papierfabrik',
                  subtitle: 'Schoellershammer',
                  icon: Factory,
                  iconColor: 'text-[#BC6C25]',
                  bgColor: 'bg-[#BC6C25]/10',
                  getBadge: () => {
                    if (stats.paperFactoryMode === 'PRODUCTION') return 'Vollbetrieb';
                    if (stats.paperFactoryMode === 'RETROFITTING') return 'Filter-Tech';
                    if (stats.paperFactoryMode === 'SHUTDOWN') return 'Stillgelegt';
                    return 'Rückbau';
                  },
                  badgeColor: stats.paperFactoryMode === 'PRODUCTION' ? 'bg-rose-100 text-rose-800' :
                              stats.paperFactoryMode === 'RETROFITTING' ? 'bg-amber-100 text-amber-800' :
                              stats.paperFactoryMode === 'SHUTDOWN' ? 'bg-stone-200 text-stone-800' : 'bg-emerald-100 text-emerald-800'
                },
                {
                  id: 'research' as const,
                  title: 'Forschung',
                  subtitle: 'Innovationsbaum',
                  icon: Microscope,
                  iconColor: 'text-sky-600',
                  bgColor: 'bg-sky-500/10',
                  getBadge: () => {
                    const unlocked = researchTree.filter(r => r.unlocked).length;
                    return `${unlocked} / ${researchTree.length}`;
                  },
                  badgeColor: 'bg-sky-100 text-sky-850'
                },
                {
                  id: 'species' as const,
                  title: 'Artenschutz',
                  subtitle: 'Fauna & Biotop',
                  icon: Leaf,
                  iconColor: 'text-emerald-600',
                  bgColor: 'bg-emerald-500/10',
                  getBadge: () => {
                    const restored = speciesList.filter(s => s.restored).length;
                    return `${restored} / ${speciesList.length}`;
                  },
                  badgeColor: 'bg-emerald-100 text-emerald-850'
                },
                {
                  id: 'reports' as const,
                  title: 'Berichte',
                  subtitle: 'Nachhaltigkeit',
                  icon: FileText,
                  iconColor: 'text-[#457b9d]',
                  bgColor: 'bg-[#457b9d]/10',
                  getBadge: () => {
                    return `Gütesiegel: ${stats.globalWrrl <= 2.8 ? 'A' : stats.globalWrrl <= 3.5 ? 'B' : 'C'}`;
                  },
                  badgeColor: 'bg-[#457b9d]/25 text-[#1D4E5B]'
                }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== 'map') setSelectedBuilding(null);
                    }}
                    className={`flex flex-col text-left p-2 rounded-lg border transition-all cursor-pointer relative overflow-hidden group hover:shadow-sm select-none ${
                      isActive
                        ? 'bg-[#5A7247] border-[#415531] text-white shadow font-extrabold transform -translate-y-[1px]'
                        : 'bg-white/85 hover:bg-white border-[#D4CCBA] text-[#2C3322] hover:border-[#5A7247]/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 justify-between w-full">
                      <div className={`p-1 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : `${tab.bgColor} ${tab.iconColor}`
                      } transition-colors`}>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                      </div>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? 'bg-white' : 'bg-transparent'
                      }`} />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className={`text-[10px] font-black tracking-tight leading-none truncate ${
                        isActive ? 'text-white' : 'text-stone-850'
                      }`}>
                        {tab.title}
                      </div>
                      <div className={`text-[8.5px] truncate leading-tight mt-0.5 ${
                        isActive ? 'text-white/80 font-normal' : 'text-[#8B8273]'
                      }`}>
                        {tab.subtitle}
                      </div>
                    </div>

                    <div className="mt-1 w-full shrink-0">
                      <span className={`inline-block text-[8px] font-mono font-bold px-1 py-0.2 rounded leading-none w-full text-center truncate ${
                        isActive ? 'bg-white/15 text-white border border-white/10' : tab.badgeColor
                      }`}>
                        {tab.getBadge()}
                      </span>
                    </div>

                    {!isActive && (
                      <div className={`absolute left-0 top-0 bottom-0 w-[2.5px] opacity-65 transition-all group-hover:opacity-100 ${
                        tab.id === 'map' ? 'bg-[#5A7247]' :
                        tab.id === 'schoeller' ? 'bg-[#BC6C25]' :
                        tab.id === 'research' ? 'bg-sky-500' :
                        tab.id === 'species' ? 'bg-emerald-500' : 'bg-[#457b9d]'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
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
                grid={grid}
              />
            )}
          </div>

          {/* Bottom logs HUD */}
          <div className={`bg-[#E8E2D6]/80 border border-[#D4CCBA] rounded-xl p-3 flex flex-col transition-all duration-300 shadow-inner shrink-0 ${
            logsCollapsed ? 'h-[44px]' : 'h-[200px]'
          }`}>
            <div 
              className="text-[10px] font-mono uppercase tracking-widest text-[#8B8273] flex items-center justify-between border-b border-[#D4CCBA] pb-1.5 cursor-pointer select-none"
              onClick={() => setLogsCollapsed(prev => !prev)}
            >
              <span className="flex items-center gap-1.5">
                <span>📜 Amts- & Simulationsprotokoll</span>
                <span className="text-[8.5px] font-normal tracking-tight normal-case text-[#8B8273]/70">
                  ({logsCollapsed ? 'klicken zum Aufklappen' : 'klicken zum Minimieren'})
                </span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestartGame();
                  }}
                  className="text-red-700 hover:text-red-600 transition-colors uppercase cursor-pointer text-[9px] font-bold"
                >
                  Simulation Neustarten
                </button>
                {logsCollapsed ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#8B8273]" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-[#8B8273]" />
                )}
              </div>
            </div>

            {!logsCollapsed && (
              <div className="flex-grow overflow-y-auto space-y-1.5 custom-scrollbar pr-1 mt-2">
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
            )}
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
          invasiveThreatEnabled={invasiveThreatEnabled}
          energyChallengeEnabled={energyChallengeEnabled}
          onUpdateStats={(updater) => setStats(prev => updater(prev))}
          addLog={addLog}
          quests={quests}
          checkQuestRequirements={checkQuestRequirements}
          completeStakeholderQuest={completeStakeholderQuest}
          researchTree={researchTree}
        />
      </div>

      {/* SEPARATE RULE POPUP FOR INVASIVE THREAT MECHANISM */}
      {showInvasiveRules && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#F2EDE4] border-w-2 border-[#BC6C25] border-2 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-scale-up text-[#2C3311]">
            
            <div className="flex items-start justify-between border-b border-[#D4CCBA] pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl filter drop-shadow-sm select-none">🦠</span>
                <div>
                  <span className="text-[9px] font-mono tracking-[0.2em] text-[#BC6C25] uppercase font-black block">
                    Zusatz-Regelwerk
                  </span>
                  <h3 className="text-base font-black text-[#2C3311] leading-tight">
                    Invasive Arten &amp; Biologische Sicherheit
                  </h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowInvasiveRules(false)}
                className="text-[#8B8273] hover:text-[#2C3311] font-bold text-sm p-1.5 rounded-full hover:bg-[#E8E2D6]/70 transition-colors leading-none cursor-pointer border border-[#D4CCBA]/50"
                title="Schließen"
              >
                ✕
              </button>
            </div>

            <p className="text-xs leading-relaxed bg-white/65 p-3 rounded-xl border border-[#D4CCBA]/50">
              Du hast den <strong>invasiven Schwierigkeitsmodus</strong> aktiviert! Diese Mechanik simuliert das Vordringen unkontrollierter Fremdarten (z.B. Signalkrebs, Riesen-Bärenklau, Drüsiges Springkraut) an der Rur.
            </p>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {/* Regel 1 */}
              <div className="bg-amber-50/55 border border-[#BC6C25]/25 rounded-xl p-3 flex gap-3 text-left">
                <span className="text-lg shrink-0">📉</span>
                <div>
                  <h4 className="font-extrabold text-[#BC6C25] text-xs">Aktivitäts-Zwang (Verfall)</h4>
                  <p className="text-[10px] text-[#554A3C] mt-0.5 leading-relaxed">
                    Tätigst du in einer Runde <strong>keine</strong> aktive Naturschutzinvestition (z.B. Fauna-Projekte, Aufwertungen oder neue Forschungen), sinkt die Bio-Sicherheit automatisch um <strong>-25%</strong>.
                  </p>
                </div>
              </div>

              {/* Regel 2 */}
              <div className="bg-emerald-50/45 border border-emerald-600/20 rounded-xl p-3 flex gap-3 text-left">
                <span className="text-lg shrink-0">🛡️</span>
                <div>
                  <h4 className="font-extrabold text-emerald-800 text-xs">Stabilisierung &amp; Rettung</h4>
                  <p className="text-[10px] text-emerald-900 mt-0.5 leading-relaxed">
                    Jede aktive Investition in Artenschutz, bauliche Maßnahmen, Upgrades oder Forschung stabilisiert die Abwehrmechanismen des Bioms und erhöht die Bio-Sicherheit um <strong>+15%</strong> (bis max. 100%).
                  </p>
                </div>
              </div>

              {/* Regel 3 */}
              <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 flex gap-3 text-left">
                <span className="text-lg shrink-0">⚠️</span>
                <div>
                  <h4 className="font-extrabold text-rose-800 text-xs">Laufender Schaden bei Kritischer Stufe</h4>
                  <p className="text-[10px] text-rose-900 mt-0.5 leading-relaxed">
                    Fällt dein Sicherheitslevel <strong>unter 30%</strong>, leidet der Fluss schleichend unter Kleinstplagen. Gewässerpotenzial (WRRL) und Artenvielfalt (FFH-Werte) degradieren jede Runde unaufhaltsam!
                  </p>
                </div>
              </div>

              {/* Regel 4 */}
              <div className="bg-red-50/60 border border-red-350/30 rounded-xl p-3 flex gap-3 text-left">
                <span className="text-lg shrink-0">🚨</span>
                <div>
                  <h4 className="font-extrabold text-red-800 text-xs">Plagen-Kollaps bei 0%</h4>
                  <p className="text-[10px] text-[#2C3311] mt-0.5 leading-relaxed">
                    Sollte deine biologische Sicherheit auf <strong>0%</strong> abstürzen, bricht eine invasive Fremdarten-Welle aus. Du wirst gezwungen, sofort massive Geldmittel (6 €) oder Forschungsressourcen (3 🧪) einzusetzen, um verheerende Habitatschäden abzuwenden.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#D4CCBA] flex justify-end">
              <button
                type="button"
                onClick={() => setShowInvasiveRules(false)}
                className="px-5 py-2 rounded-xl bg-[#5A7247] hover:bg-[#4A5D3A] text-white font-extrabold tracking-tight text-xs uppercase cursor-pointer duration-150 transition-all shadow-md"
              >
                Verstanden &amp; Weiter
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SEPARATE RULE POPUP FOR RENEWABLE ENERGY CHALLENGE */}
      {showEnergyRules && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#F2EDE4] border-w-2 border-[#BC6C25] border-2 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-scale-up text-[#2C3311]">
            
            <div className="flex items-start justify-between border-b border-[#D4CCBA] pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl filter drop-shadow-sm select-none">⚡</span>
                <div>
                  <span className="text-[9px] font-mono tracking-[0.2em] text-[#BC6C25] uppercase font-black block">
                    Zusatz-Regelwerk
                  </span>
                  <h3 className="text-base font-black text-[#2C3311] leading-tight">
                    Energiewende &amp; Industrieller CO2-Druck
                  </h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowEnergyRules(false)}
                className="text-[#8B8273] hover:text-[#2C3311] font-bold text-sm p-1.5 rounded-full hover:bg-[#E8E2D6]/70 transition-colors leading-none cursor-pointer border border-[#D4CCBA]/50"
                title="Schließen"
              >
                ✕
              </button>
            </div>

            <p className="text-xs leading-relaxed bg-white/65 p-3 rounded-xl border border-[#D4CCBA]/50">
              Du hast die <strong>Energiewende-Herausforderung</strong> aktiviert! Düren besitzt eine hochentwickelte, aber extrem energieintensive Industrie (Papierwerke, Metallverarbeitung). Ohne grüne Stromerzeugung drohen CO2-Strafen und Klimarisiken.
            </p>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 font-sans">
              {/* Regel 1 */}
              <div className="bg-amber-50/55 border border-[#BC6C25]/25 rounded-xl p-3 flex gap-3 text-left">
                <span className="text-lg shrink-0">📈</span>
                <div>
                  <h4 className="font-extrabold text-[#BC6C25] text-xs">Fossiler Verfall der Stromdeckung</h4>
                  <p className="text-[10px] text-[#554A3C] mt-0.5 leading-relaxed">
                    Durch steigendes Wirtschaftswachstum sinkt die Grüne Energiequote der Stadt jede Runde automatisch um <strong>-10%</strong>, außer du steuerst mit Kraftwerken der erneuerbaren Energie gegen.
                  </p>
                </div>
              </div>

              {/* Regel 2 */}
              <div className="bg-[#EAE0D5] border border-[#BC6C25]/20 rounded-xl p-3 flex gap-3 text-left">
                <span className="text-lg shrink-0">🔬</span>
                <div>
                  <h4 className="font-extrabold text-[#2C3322] text-xs font-sans">Energiewende-Konzept (Forschung)</h4>
                  <p className="text-[10px] text-[#554A3C] mt-0.5 leading-relaxed">
                    Erforsche das <strong>Dürener Energiewende-Konzept</strong> (Forschungsstufe, 8 🧪), um die Infrastruktur zu modernisieren und den fossilen Runden-Verfall permanent um <strong>-50%</strong> (auf nur -5% pro Runde) zu bremsen.
                  </p>
                </div>
              </div>

              {/* Regel 3 */}
              <div className="bg-emerald-50/45 border border-emerald-600/20 rounded-xl p-3 flex gap-3 text-left">
                <span className="text-lg shrink-0">🏗️</span>
                <div>
                  <h4 className="font-extrabold text-emerald-800 text-xs">Grüne Energie-Pioniere (Gebäude)</h4>
                  <p className="text-[10px] text-emerald-900 mt-0.5 leading-relaxed">
                    Baue Generatoren auf der Karte für permanenten Runden-Ausgleich:
                    <br />• <strong>Klein-Wasserkraftwerk</strong> liefert <strong>+12%</strong>/Runde.
                    <br />• <strong>Solarpark Rurwiese</strong> liefert <strong>+10%</strong>/Runde.
                    <br />• <strong>Bürger-Windturbine</strong> liefert <strong>+15%</strong>/Runde.
                    <br />• <i>Außerdem gibt jede beliebige Bauaktivität/Upgrade einen einmaligen Modernisierungs-Boost von +10% Erneuerbare.</i>
                  </p>
                </div>
              </div>

              {/* Regel 4 */}
              <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 flex gap-3 text-left">
                <span className="text-lg shrink-0">💶</span>
                <div>
                  <h4 className="font-extrabold text-rose-800 text-xs text-left">Strafzahlungen &amp; Klimabelastung (&lt;35%)</h4>
                  <p className="text-[10px] text-rose-900 mt-0.5 leading-relaxed text-left">
                    Sinkt die Grüne Energiequote <strong>unter 35%</strong>, zahlen Betriebe CO2-Abgaben (<strong>-2 €</strong> pro Runde) und die fossilen Abgase erhöhen das städtische Klimarisiko um <strong>+2%</strong> pro Runde!
                  </p>
                </div>
              </div>

              {/* Regel 5 */}
              <div className="bg-[#D4E0C1] border border-[#5A7247]/25 rounded-xl p-3 flex gap-3 text-left">
                <span className="text-lg shrink-0">🏆</span>
                <div>
                  <h4 className="font-extrabold text-[#2C3322] text-xs text-left">Wirtschaftlicher Bonus (&gt;=75%)</h4>
                  <p className="text-[10px] text-[#2C3322] mt-0.5 leading-relaxed text-left">
                    Erreicht deine grüne Quote vorbildliche <strong>&gt;= 75%</strong>, gilt Düren als grüne Modellstadt und zieht lukrative Ökoförderung an (<strong>+2 €</strong> Netto-Ertrag/Runde und <strong>-1%</strong> Klimarisiko).
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#D4CCBA] flex justify-end">
              <button
                type="button"
                onClick={() => setShowEnergyRules(false)}
                className="px-5 py-2 rounded-xl bg-[#5A7247] hover:bg-[#4A5D3A] text-white font-extrabold tracking-tight text-xs uppercase cursor-pointer duration-150 transition-all shadow-md"
              >
                Verstanden &amp; Weiter
              </button>
            </div>

          </div>
        </div>
      )}

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
              ) : activeEvent.id === 'invasive_plage' ? (
                <>
                  <button
                    onClick={() => handleResolveEvent('pay')}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] uppercase rounded-lg cursor-pointer flex flex-col items-center justify-center min-h-[46px]"
                  >
                    <span>Erradikation finanzieren</span>
                    <span className="text-[9px] text-indigo-100 font-normal normal-case">-6 € Steuermittel</span>
                  </button>
                  <button
                    onClick={() => handleResolveEvent('eco')}
                    disabled={stats.researchPoints < 3}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-[11px] uppercase rounded-lg cursor-pointer flex flex-col items-center justify-center min-h-[46px]"
                  >
                    <span>Biom-Modellierung</span>
                    <span className="text-[9px] text-sky-100 font-normal normal-case">-3 🧪 Forschung (+15 🌿)</span>
                  </button>
                  <button
                    onClick={() => handleResolveEvent('ignore')}
                    className="flex-1 py-2 bg-rose-800 hover:bg-rose-900 text-white font-extrabold text-[11px] uppercase rounded-lg cursor-pointer flex flex-col items-center justify-center min-h-[46px] border border-rose-950"
                  >
                    <span>Aussitzen</span>
                    <span className="text-[9px] text-rose-100 font-normal normal-case">Schwerer Verfall</span>
                  </button>
                </>
              ) : activeEvent.id === 'energy_crisis' ? (
                <>
                  <button
                    onClick={() => handleResolveEvent('pay')}
                    disabled={stats.budget < 5}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-[11px] uppercase rounded-lg cursor-pointer flex flex-col items-center justify-center min-h-[46px]"
                  >
                    <span>Notstrom finanzieren</span>
                    <span className="text-[9px] text-indigo-100 font-normal normal-case">-5 € (Benötigt 5 €)</span>
                  </button>
                  <button
                    onClick={() => handleResolveEvent('ignore')}
                    className="flex-1 py-2 bg-[#8B4513] hover:bg-[#70350B] text-white font-extrabold text-[11px] uppercase rounded-lg cursor-pointer flex flex-col items-center justify-center min-h-[46px]"
                  >
                    <span>Ausgleichsflächen opfern</span>
                    <span className="text-[9px] text-orange-200 font-normal normal-case">-10 🌿 (Roden & Kohle)</span>
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

      {/* PROGRESSION CHALLENGE MODAL: ANNOUNCING DYNAMIC NEW DIFFICULTY LEVEL AFTER EACH YEAR */}
      {activeYearChallengeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 text-[#2C3311]">
          <div className="bg-[#F2EDE4] border-4 border-[#BC6C25] rounded-3xl w-full max-w-xl p-6.5 shadow-2xl relative flex flex-col gap-5 animate-scale-up">
            
            {/* Dynamic Header based on year */}
            {activeYearChallengeModal === 2027 && (
              <>
                <div className="flex items-center gap-4 border-b border-[#BC6C25]/20 pb-3">
                  <span className="text-4xl">👥</span>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#BC6C25] uppercase font-black block">JAHR 2027 • STUFE 2</span>
                    <h3 className="text-[#2C3311] text-base font-black">Regionale Stimme: Bürgerakzeptanz aktiv!</h3>
                  </div>
                </div>
                
                <div className="space-y-3 leading-relaxed text-xs text-[#2C3311]">
                  <p className="font-semibold text-amber-900 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/15">
                    💡 <b>Die Schonzeit ist vorbei!</b> Deine ersten Baumaßnahmen haben Staub aufgewirbelt. Ab sofort ist die lokale Bevölkerung aufmerksam und reagiert sensibel auf deine Entscheidungen.
                  </p>
                  
                  <div className="bg-white/90 p-3.5 rounded-2xl border border-[#D4CCBA] space-y-2">
                    <h4 className="font-bold text-[#BC6C25] uppercase tracking-wider text-[11px]">⚠️ Neue Risiken &amp; Regeln:</h4>
                    <ul className="list-disc list-inside space-y-1 text-[#4A4F3F] text-[11px] leading-relaxed">
                      <li><b>Widerstand bei Windkraft:</b> Der Bau von Windenergieanlagen direkt neben Wohngebiet-Flurstücken senkt die Bürgerakzeptanz um <b>-20%</b>!</li>
                      <li><b>Modustransformation:</b> Das Herunterfahren der Papierfabrik Schoellershammer führt zu Gewerkschaftsprotesten und schadet der Akzeptanz (<b>-30%</b>).</li>
                      <li><b>Protest-Eileinlassung (<span className="text-red-700 font-bold">&lt;40% Akzeptanz</span>):</b> Sinkt die Akzeptanz unter 40%, verteuern Verwaltungs-Klagen und Blockaden jeden Neubau dauerhaft um <b>+2 € Sektoraufschlag</b>!</li>
                    </ul>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-600/10 p-3 rounded-xl flex items-start gap-2.5">
                    <span className="text-lg">👥</span>
                    <div className="text-[11px] text-emerald-950 leading-relaxed">
                      <b>Deine Gegenmaßnahme:</b> Gründe unter der Öko-Zentrale eine <b>Bürger-Energiegenossenschaft</b> (12 €, 4 🧪). Dadurch profitiert die Gemeinde am Gewinn, die Akzeptanz springt um <b>+40%</b> nach oben und NIMBY-Abzüge erlöschen komplett!
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeYearChallengeModal === 2028 && (
              <>
                <div className="flex items-center gap-4 border-b border-[#BC6C25]/20 pb-3">
                  <span className="text-4xl">🌊</span>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#BC6C25] uppercase font-black block">JAHR 2028 • STUFE 3</span>
                    <h3 className="text-[#2C3311] text-base font-black">Gewalt der Natur: Klimakampf &amp; Biosicherheit</h3>
                  </div>
                </div>

                <div className="space-y-3 leading-relaxed text-xs text-[#2C3311]">
                  <p className="font-semibold text-rose-950 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/15">
                    ⚠️ <b>Klimakollaps naht!</b> Extreme saisonale Wetterwechsel lassen die Pegel der Rur unberechenbar schwanken. Zudem droht biologische Erosion.
                  </p>

                  <div className="bg-white/90 p-3.5 rounded-2xl border border-[#D4CCBA] space-y-2">
                    <h4 className="font-bold text-red-700 uppercase tracking-wider text-[11px]">⚠️ Neue Gefahren:</h4>
                    <ul className="list-disc list-inside space-y-1 text-[#4A4F3F] text-[11px] leading-relaxed">
                      <li><b>Spontane Wetterkapriolen:</b> Ist dein Klimarisiko zu hoch (&gt;35%), können verheerende Sommer-Dürren oder jahrhundert-Fluten über dich hereinbrechen.</li>
                      <li><b>Biologische Invasionen:</b> Der <i>Stressor-Modus: Invasive Krebse</i> ist ab jetzt automatisch aktiviert! Die biologische Sicherheit sinkt über die Zeit hinweg.</li>
                      <li><b>Artenrückgang:</b> Sinkt deine Biosicherheit, bricht das Ökosystem zusammen und löscht seltene Rurtal-Tiere aus.</li>
                    </ul>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-600/10 p-3 rounded-xl flex items-start gap-2.5">
                    <span className="text-lg">⚡</span>
                    <div className="text-[11px] text-indigo-950 leading-relaxed">
                      <b>Deine Antwort:</b> Nutze den <b>Auwald-Pflanzschutz</b> zur Klimadämpfung, schalte das <b>Frühwarnsystem (FWS)</b> der Öko-Zentrale frei oder nutze die <b>spezifischen Fokus-Modi</b> zur Stabilisierung!
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeYearChallengeModal === 2029 && (
              <>
                <div className="flex items-center gap-4 border-b border-red-900/20 pb-3">
                  <span className="text-4xl">🔥</span>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-red-700 uppercase font-black block">JAHR 2029+ • FINALES LEVEL</span>
                    <h3 className="text-[#2C3311] text-base font-black">Die Systemische Gesamtkrise</h3>
                  </div>
                </div>

                <div className="space-y-3 leading-relaxed text-xs text-[#2C3311]">
                  <p className="font-semibold text-slate-900 bg-slate-200/50 p-2.5 rounded-xl border border-slate-300">
                    🚨 <b>Das Endspiel hat begonnen!</b> Ab sofort greifen alle komplexen Herausforderungen lückenlos ineinander. Der globale Klimawandel beschleunigt sich.
                  </p>

                  <div className="bg-white/90 p-3.5 rounded-2xl border border-[#D4CCBA] space-y-2">
                    <h4 className="font-bold text-red-800 uppercase tracking-wider text-[11px]">🔥 Erhöhter Schwierigkeitsgrad:</h4>
                    <ul className="list-disc list-inside space-y-1 text-[#4A4F3F] text-[11px] leading-relaxed">
                      <li>Die globale Erwärmung lässt das Basis-Klimarisiko jetzt um <b>+25% schneller</b> ansteigen.</li>
                      <li>Energieversorgung, Naturschutz, industrielle Transformation der Papierfabrik Schoellershammer und die Akzeptanz der Dürener Bevölkerung prallen komplex aufeinander.</li>
                      <li>Halte das Rurtal stabil, um die Bestnote im Nachhaltigkeitsgutachten der Universität Düren zu erringen!</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Button to confirm new phase and close */}
            <button
              onClick={() => setActiveYearChallengeModal(null)}
              className="mt-2 w-full py-3 bg-[#5A7247] hover:bg-[#4E613C] text-white font-extrabold text-xs uppercase rounded-xl shadow-md transition-all duration-150 cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2"
            >
              <span>Ich nehme die Herausforderung an!</span>
              <span>👉</span>
            </button>

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

      {/* DETAILED GAME RULES MANUAL (SPIELANLEITUNG IN CD) */}
      {showSpielregeln && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[9999] p-4 text-[#2C3311]">
          <div className="bg-[#F2EDE4] border-4 border-[#BC6C25] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-white border-b border-[#BC6C25]/20 p-5 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📖</span>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#BC6C25] uppercase font-black block">REGIONALE CHRONIK &amp; HANDBUCH</span>
                  <h3 className="text-lg font-black text-[#2C3311] font-display">RurNova: Offizielle Spielregeln &amp; Systemmechaniken</h3>
                </div>
              </div>
              <button
                onClick={() => setShowSpielregeln(false)}
                className="text-[#8B8273] hover:text-[#2C3311] p-2 rounded-full hover:bg-[#E8E2D6]/70 transition-colors cursor-pointer border border-[#D4CCBA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Rules Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-brand-lightsky/20">
              
              {/* Introduction Card */}
              <div className="bg-emerald-500/10 border border-[#A7C080]/30 rounded-2xl p-4.5">
                <p className="text-xs leading-relaxed text-[#2C3311]">
                  Herzlichen Glückwunsch! Du leitest die **ökologische und strukturpolitische Transformation des Rurtals**. Deine Entscheidungen steuern das Schicksal der Region Düren. Dieses Handbuch erklärt dir die mathematischen und mechanischen Zusammenhänge, damit du deinen Nachhaltigkeitsbericht zur Bestnote führen kannst.
                </p>
              </div>

              {/* 1. PROGRESSIVE DIFFICULTY TIMELINE */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
                  <span>📅</span> 1. DER PROGRESSIVE SCHWIERIGKEITSGRAD (LERNEFFEKT)
                </h4>
                <p className="text-[11px] text-[#4A4F3F] leading-normal">
                  Das Spiel startet einfach, damit du die Grundlagen verinnerlichen kannst. Mit jedem neuen Jahr zieht das Niveau spürbar an:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mt-2">
                  
                  {/* Year 2026 */}
                  <div className="bg-white/85 p-3.5 rounded-2xl border border-[#D4CCBA] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-1.5 py-0.5 bg-sky-100 text-[#2A6F7E] text-[9px] font-mono rounded font-black">Level 1</span>
                        <span className="text-sm">🌱</span>
                      </div>
                      <h5 className="font-extrabold text-[11px] text-[#2C3311] uppercase tracking-wide">Jahr 2026</h5>
                      <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed mt-1.5">
                        <b>Schonzeit</b>. Bürgerakzeptanz ist stabilisiert, keine Naturkatastrophen, Biosicherheit bei 100%. Baue in Ruhe dein Fundament!
                      </p>
                    </div>
                    <div className="text-[10px] mt-3 pt-2 border-t border-[#D4CCBA]/40 font-bold text-sky-700">
                      👍 Zu 100% einsteigerfreundlich
                    </div>
                  </div>

                  {/* Year 2027 */}
                  <div className="bg-white/85 p-3.5 rounded-2xl border border-amber-600/35 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-mono rounded font-black">Level 2</span>
                        <span className="text-sm">👥</span>
                      </div>
                      <h5 className="font-extrabold text-[11px] text-amber-900 uppercase tracking-wide">Jahr 2027</h5>
                      <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed mt-1.5">
                        <b>Bürgerakzeptanz</b>. Anwohner wehren sich gegen Windenergie direkt an Wohngebieten und Fabrikstilllegungen.
                      </p>
                    </div>
                    <div className="text-[10px] mt-3 pt-2 border-t border-[#D4CCBA]/40 font-bold text-amber-700">
                      💡 Schalte Genossenschaften frei!
                    </div>
                  </div>

                  {/* Year 2028 */}
                  <div className="bg-white/85 p-3.5 rounded-2xl border border-rose-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-mono rounded font-black">Level 3</span>
                        <span className="text-sm">🌊</span>
                      </div>
                      <h5 className="font-extrabold text-[11px] text-rose-950 uppercase tracking-wide">Jahr 2028</h5>
                      <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed mt-1.5">
                        <b>Naturkatastrophen</b>. Jährliche Fluten und Dürren drohen, falls das Klimarisiko &gt;35% ist. Die Biosicherheit schrumpft kontinuierlich.
                      </p>
                    </div>
                    <div className="text-[10px] mt-3 pt-2 border-t border-[#D4CCBA]/40 font-bold text-rose-700">
                      🦫 Schütze die Biosicherheit!
                    </div>
                  </div>

                  {/* Year 2029+ */}
                  <div className="bg-white/85 p-3.5 rounded-2xl border border-purple-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-850 text-[9px] font-mono rounded font-black">Final</span>
                        <span className="text-sm">🔥</span>
                      </div>
                      <h5 className="font-extrabold text-[11px] text-purple-950 uppercase tracking-wide">Jahr 2029+</h5>
                      <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed mt-1.5">
                        <b>Globale Krise</b>. Der Klimawandel beschleunigt sich. Das Rurtal leidet unter 25% schnellerer Risiko-Erhöhung.
                      </p>
                    </div>
                    <div className="text-[10px] mt-3 pt-2 border-t border-[#D4CCBA]/40 font-bold text-purple-700">
                      🌿 Bestnote ist nur im Gleichgewicht möglich!
                    </div>
                  </div>

                </div>
              </div>

              {/* 2. BÜRGERAKZEPTANZ */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
                  <span>👥</span> 2. SOZIALE AKZEPTANZ &amp; DER NIMBY-EFFEKT (AB 2027)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="bg-white/80 p-3.5 rounded-xl border border-[#D4CCBA] space-y-2">
                    <h5 className="font-bold text-amber-900 text-[11px] uppercase">🚨 Der NIMBY-Effekt</h5>
                    <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed">
                      Der Bau von Windenergieanlagen direkt angrenzend an Siedlung-Kacheln schadet der Akzeptanz sofort um <b>-20%</b>! Solarparks ohne Bürgerbeteiligung führen zu <b>-3%</b> Akzeptanz.
                    </p>
                  </div>

                  <div className="bg-white/80 p-3.5 rounded-xl border border-[#D4CCBA] space-y-2">
                    <h5 className="font-bold text-red-700 text-[11px] uppercase">💸 Teure Klagen (&lt;40% Akzeptanz)</h5>
                    <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed">
                      Fällt deine Bürgerakzeptanz unter <b>40%</b>, rebelliert die Region. Verwaltungsanträge werden blockiert, was jeden Neubau auf der Karte um **+2 € Protest-Zuschlag** verteuert.
                    </p>
                  </div>

                  <div className="bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-600/20 space-y-2">
                    <h5 className="font-bold text-emerald-950 text-[11px] uppercase flex items-center gap-1">🪙 Die Bürgergenossenschaft</h5>
                    <p className="text-[10.5px] text-emerald-900 leading-relaxed">
                      Gründe in der Öko-Zentrale Stufe I eine <b>Genossenschaft</b> (12 €, 4 🧪). Sie erhöht die Zufriedenheit augenblicklich um <b>+40%</b> und schaltet künftige NIMBY-Abzüge vollständig aus!
                    </p>
                  </div>

                </div>
              </div>

              {/* 3. SCHOELLERSHAMMER-GLEICHUNG */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
                  <span>🏭</span> 3. DIE SCHOELLERSHAMMER-GLEICHUNG
                </h4>
                <p className="text-[11px] text-[#4A4F3F] leading-normal">
                  Die Papierfabrik ist dein wichtigster Steuerzahler, belastet jedoch Schiene, Klima und Gewässer. Wähle die Transformation weise:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                  <div className="bg-white/70 p-3 rounded-xl border border-[#D4CCBA]">
                    <span className="font-black text-[10.5px] text-zinc-800 uppercase block">⚙️ Vollbetrieb</span>
                    <div className="mt-1.5 text-[10px] text-[#4A4F3F] leading-normal space-y-1">
                      <div>💵 <b>+15 €</b> Steuern / Runde</div>
                      <div>👥 <b>+15%</b> Akzeptanz-Vorteil</div>
                      <div className="text-red-700">💧 Massive Gewässerschäden</div>
                    </div>
                  </div>

                  <div className="bg-white/70 p-3 rounded-xl border border-[#D4CCBA]">
                    <span className="font-black text-[10.5px] text-blue-800 uppercase block">🔧 Umrüstung</span>
                    <div className="mt-1.5 text-[10px] text-[#4A4F3F] leading-normal space-y-1">
                      <div>💵 <b>+5 €</b> Nettoeinnahme</div>
                      <div>🧪 <b>+1 🧪</b> Passiv-Forschung</div>
                      <div className="text-blue-700">⚙️ Verringert Emissionen</div>
                    </div>
                  </div>

                  <div className="bg-white/70 p-3 rounded-xl border border-[#D4CCBA]">
                    <span className="font-black text-[10.5px] text-amber-800 uppercase block">⚠️ Stilllegung</span>
                    <div className="mt-1.5 text-[10px] text-[#4A4F3F] leading-normal space-y-1">
                      <div className="text-red-600">💵 Cost: <b>2 €</b> Notwartung</div>
                      <div className="text-red-700">👥 <b>-30%</b> Akzeptanzschaden</div>
                      <div>💧 Rur erholt sich prächtig</div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-600/15">
                    <span className="font-black text-[10.5px] text-emerald-950 uppercase block">🌿 Renaturierung</span>
                    <div className="mt-1.5 text-[10px] text-emerald-900 leading-normal space-y-1">
                      <div>💵 Cost: <b>3 €</b> Pachtschutz</div>
                      <div>👥 <b>+10% Akzeptanz</b> (nur mit aktiver eG; sonst -15%)</div>
                      <div className="text-emerald-800 font-bold">🌿 Maximale Naturpunkte</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ECO-SYSTEM SYSTEM */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-black tracking-widest text-[#BC6C25] uppercase border-b border-[#BC6C25]/20 pb-1.5 flex items-center gap-2">
                  <span>🌲</span> 4. KLIMARISIKO &amp; NATURZAHNRÄDER
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-white/80 p-4 rounded-xl border border-[#D4CCBA] space-y-2">
                    <h5 className="font-bold text-[#2C3311] text-[11px] uppercase flex items-center gap-1.5">
                      <span>🌲</span> Auwald-Dämpfung
                    </h5>
                    <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed">
                      Jedes Runde erhöht sich die Klimalast der Erde. Jede gepflanzte **Auwald-Fläche** bremst diesen Effekt dauerhaft ab! Viele Auwälder verringern die Wahrscheinlichkeit extremer Hochwasser.
                    </p>
                  </div>

                  <div className="bg-white/80 p-4 rounded-xl border border-[#D4CCBA] space-y-2">
                    <h5 className="font-bold text-[#2C3311] text-[11px] uppercase flex items-center gap-1.5">
                      <span>🦠</span> Biologische Biosicherheit (ab 2028)
                    </h5>
                    <p className="text-[10.5px] text-[#4A4F3F] leading-relaxed">
                      Ab 2028 dezimieren invasive Krebse ungeschützte Teiche kontinuierlich. Nutze gezielte Abwehrprojekte in der Öko-Zentrale oder investiere Forschung, um wertvolle Tierarten vor dem Aussterben zu bewahren!
                    </p>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-[#BC6C25]/20 p-5 shrink-0 flex items-center justify-between">
              <span className="text-[10px] text-brand-dark/60 font-mono">
                RurNova Simulationshandbuch für den Landkreis Düren
              </span>
              <button
                onClick={() => setShowSpielregeln(false)}
                className="px-6 py-2.5 bg-[#5A7247] hover:bg-[#4E613C] text-white text-xs font-extrabold uppercase rounded-xl shadow-md transition-all duration-150 cursor-pointer active:scale-95 text-center"
              >
                Alles verstanden, bereit zur Simulation! 🚀
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PLACEMENT CONFIRMATION MODAL */}
      {placementConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-fade-in">
          <div className="bg-[#F2EDE4] border-2 border-[#5A7247] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-up text-[#2C3311]">
            <div className="flex items-center gap-3 border-b border-[#D4CCBA] pb-3">
              <div className="bg-[#5A7247]/10 p-2 rounded-xl text-2xl">
                🏗️
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-widest text-[#5A7247] uppercase font-black block">Bau-Bestätigung</span>
                <h3 className="text-base font-black text-[#2C3322] font-display">Hier platzieren?</h3>
              </div>
            </div>

            <div className="space-y-3 py-1 text-xs">
              <div className="bg-white/60 rounded-xl p-3 border border-[#D4CCBA]/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#5C5549] font-semibold">Anlage:</span>
                  <span className="font-extrabold text-[#2C3311]">{placementConfirmation.building.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C5549] font-semibold">Koordinaten:</span>
                  <span className="font-mono text-[11px] font-bold bg-[#D4E0C1]/40 px-1.5 py-0.5 rounded text-[#3A442A]">
                    Sektor ({placementConfirmation.x}, {placementConfirmation.y})
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-[#D4CCBA]/30 pt-2">
                  <span className="text-[#5C5549] font-semibold">Baukosten:</span>
                  <span className="font-black text-[#5A7247] text-sm">
                    {placementConfirmation.finalCost} €
                  </span>
                </div>
                {placementConfirmation.finalRebate > 0 && (
                  <div className="flex justify-between items-center text-[10px] text-[#5A7247] font-semibold">
                    <span>Erhaltene Ersparnis:</span>
                    <span>-{placementConfirmation.finalRebate} €</span>
                  </div>
                )}
                {placementConfirmation.acceptanceSurcharge > 0 && (
                  <div className="flex justify-between items-center text-[10px] text-amber-700 font-semibold">
                    <span>Protest-Aufschlag:</span>
                    <span>+{placementConfirmation.acceptanceSurcharge} €</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPlacementConfirmation(null)}
                className="flex-1 px-4 py-2.5 border border-[#BC6C25]/45 hover:bg-[#E8E2D6]/70 text-[#BC6C25] hover:text-[#9e5212] text-xs font-black uppercase rounded-xl cursor-pointer transition-colors text-center"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={executePendingPlacement}
                className="flex-1 px-4 py-2.5 bg-[#5A7247] hover:bg-[#4E613C] text-white text-xs font-black uppercase rounded-xl cursor-pointer shadow-md transition-all duration-150 active:scale-95 text-center"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
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