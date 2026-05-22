import { BuildingType, ActionCard, ResearchNode, Species, TerrainType, ClimateEvent } from './types';

export const BUILDIONS_CATALOG: BuildingType[] = [
  // CATEGORY: Ökologie & Renaturierung (ecology)
  {
    id: 'altarm',
    name: 'Altarm-Anschluss',
    category: 'ecology',
    cost: 8,
    maintenance: 1,
    description: 'Verbindet einen abgetrennten Seitenarm wieder mit dem Hauptlauf der Rur.',
    detailEffect: 'Sektor-Hochwasserrisiko -15%. FFH-Potenzial +15 in Sektor. Verbessert WRRL im Nachbartile um 1 Stufe.',
    allowedTerrains: ['Wiese', 'Acker'],
    isRiverAdjacentOnly: true,
  },
  {
    id: 'auenwald',
    name: 'Auenwald-Anpflanzung',
    category: 'ecology',
    cost: 5,
    maintenance: 0,
    description: 'Pflanzung auentypischer Gehölze (z.B. Erlen-Eschenwald) zur Uferbeschattung.',
    detailEffect: 'Erreicht +20 Feuchtigkeit. Verringert Wassertemperatur (Klimaschutz). Schaltet Biber-Habitate frei.',
    allowedTerrains: ['Wiese', 'Acker'],
    isRiverAdjacentOnly: true,
  },
  {
    id: 'totholz',
    name: 'Totholz-Eintrag',
    category: 'ecology',
    cost: 3,
    maintenance: 0,
    description: 'Einbringen von Holzelementen in die Strömung zur Strukturenverbesserung.',
    detailEffect: 'FFH-Potenzial des Flussabschnitts +10. Schafft Unterschlupf für Jungfische und Gewässer-Wirbellose.',
    allowedTerrains: ['Water'],
    isRiverOnly: true,
  },
  {
    id: 'ufer_entfesselung',
    name: 'Ufer-Entfesselung',
    category: 'ecology',
    cost: 6,
    maintenance: 1,
    description: 'Rückbau von Steinschüttungen (Uferbefestigung/Wasserbausteine).',
    detailEffect: 'Freie Flussdynamik. WRRL +1 Wasserqualität (Natürlichkeit). Schaltet Eisvogel-Brutwände frei.',
    allowedTerrains: ['Wiese'],
    isRiverAdjacentOnly: true,
  },
  {
    id: 'kiesbett',
    name: 'Kieslaichbett',
    category: 'ecology',
    cost: 4,
    maintenance: 0,
    description: 'Aufschütten von sauberem Eifel-Kies als optimale Laichbedingungen.',
    detailEffect: 'Fischbiodiversität +20. Schaltet Bachneunauge und Bachforellen-Fortpflanzung frei.',
    allowedTerrains: ['Water'],
    isRiverOnly: true,
  },

  // CATEGORY: Wasserwirtschaft & Hochwasserschutz (water)
  {
    id: 'fischpass',
    name: 'Fischpass / Fischtreppe',
    category: 'water',
    cost: 7,
    maintenance: 1,
    description: 'Ermöglicht Fischen die Wanderung vorbei an Wehren und Wasserkraftanlagen.',
    detailEffect: 'Erhöht Fluss-Durchgängigkeit im Sektor um +15%. Voraussetzung für Lachs-Wanderung.',
    allowedTerrains: ['Wiese', 'Water'],
    isRiverAdjacentOnly: true,
  },
  {
    id: 'deichrueck',
    name: 'Deichrückverlegung',
    category: 'water',
    cost: 10,
    maintenance: 1,
    description: 'Verschiebt Deiche vom Rurufer zurück ins Hinterland, um der Rur Platz zu geben.',
    detailEffect: 'Schafft Überflutungsfläche. Sektor-Hochwasserrisiko -25%. Feuchtigkeit im Sektor erhöht.',
    allowedTerrains: ['Wiese', 'Acker'],
    isRiverAdjacentOnly: true,
  },
  {
    id: 'polder',
    name: 'Retentionsraum / Polder',
    category: 'water',
    cost: 9,
    maintenance: 1,
    description: 'Gezielt steuerbarer Überflutungspolder für extreme Hochwasserereignisse.',
    detailEffect: 'Fängt Starkregen ab. Schützt angrenzende Siedlungen komplett vor Hochwasserschäden.',
    allowedTerrains: ['Wiese', 'Acker'],
  },
  {
    id: 'sohlgleite',
    name: 'Rauhe Sohlgleite',
    category: 'water',
    cost: 5,
    maintenance: 0,
    description: 'Rückbau von harten Betonsohlen zu naturnahen blocküberbauten Rampen.',
    detailEffect: 'Durchgängigkeit +10%. Sauerstoffeintrag erhöht. WRRL-Zustand des Flussabschnitts steigt.',
    allowedTerrains: ['Water'],
    isRiverOnly: true,
  },
  {
    id: 'regenbecken',
    name: 'Regenrückhaltebecken',
    category: 'water',
    cost: 6,
    maintenance: 2,
    description: 'Puffert städtische Abflüsse und reinigt das erste Schmutzwasser bei Starkregen.',
    detailEffect: 'Vermeidet urbane Sturzfluten. WRRL Wasserqualität der nahen Fluss-Tiles verbessert (+1 WRRL).',
    allowedTerrains: ['Siedlung', 'Gewerbe'],
  },

  // CATEGORY: Fauna & Artenschutz-Infrastruktur (fauna)
  {
    id: 'biber_station',
    name: 'Biber-Schutzstation',
    category: 'fauna',
    cost: 5,
    maintenance: 1,
    description: 'Betreuung des Eifel-Biber-Progression im Kreis Düren und Aufklärungs-Zentrum.',
    detailEffect: 'Naturpunkte +2/Runde. Erhöht Biber-Akzeptanz, löst Farmkonflikte günstiger.',
    allowedTerrains: ['Wiese', 'Auwald'],
  },
  {
    id: 'lachs_zucht',
    name: 'Lachs-Zuchtstation',
    category: 'fauna',
    cost: 8,
    maintenance: 2,
    description: 'Künstliche Bebrütung von Lachseiern zur Wiederbesiedlung der Gewässersysteme.',
    detailEffect: 'Schaltet Lachs-Zustand frei. Benötigt Fluss-Durchgängigkeit ≥ 50%. Naturpunkte +3/Runde.',
    allowedTerrains: ['Wiese', 'Gewerbe'],
    isRiverAdjacentOnly: true,
  },
  {
    id: 'eisvogel_nist',
    name: 'Eisvogel-Nisthilfe',
    category: 'fauna',
    cost: 3,
    maintenance: 0,
    description: 'Künstliche Brutröhren in Abbruchkanten oder Uferwänden.',
    detailEffect: 'Zieht Eisvögel an. FFH-Wert lokal +10. Naturpunkte +1/Runde.',
    allowedTerrains: ['Water', 'Wiese'],
    isRiverAdjacentOnly: true,
  },
  {
    id: 'insektenhotel',
    name: 'Insektenhotel & Blühstreifen',
    category: 'fauna',
    cost: 2,
    maintenance: 0,
    description: 'Etablierung ökologischer Ackerrandstreifen mit heimischen Blumen und Brutnestern.',
    detailEffect: 'FFH-Potenzial +12. Schaltet Blauschillernden Feuerfalter frei. Reduziert Abfluss auf Äckern.',
    allowedTerrains: ['Acker', 'Wiese'],
  },
  {
    id: 'natura_zentrum',
    name: 'Natura 2000 Infozentrum',
    category: 'fauna',
    cost: 12,
    maintenance: 3,
    description: 'Großes Bildungszentrum im Rurtal für Naturschutz und Flusssystem-Renaturierung.',
    detailEffect: 'Forschungspunkte +1/Runde. Naturpunkte +3/Runde. Akzeptanz für Maßnahmen steigt.',
    allowedTerrains: ['Wiese', 'Siedlung'],
  },

  // CATEGORY: Ressourcen & Wirtschaft (economy)
  {
    id: 'oeko_tourismus',
    name: 'Öko-Tourismus-Station',
    category: 'tourism',
    cost: 6,
    maintenance: 0,
    description: 'Kanu-Anleger und Rurradweg-Erfahrungsstation.',
    detailEffect: 'Generiert Einkommen +2 €/Runde. Geringe Störwirkung auf Tierwelt (-5 FFH lokal).',
    allowedTerrains: ['Wiese', 'Siedlung'],
    isRiverAdjacentOnly: true,
  },
  {
    id: 'wasserkraft',
    name: 'Klein-Wasserkraftwerk',
    category: 'economy',
    cost: 15,
    maintenance: 1,
    description: 'Nutzt den Abfluss der Rur zur klimaschonenden Stromerzeugung.',
    detailEffect: 'Einkommen +5 €/Runde. Erhöht Erneuerbare Energien um +25%. Verringert Durchgängigkeit um -20%, außer Fischtreppe ist direkt benachbart.',
    allowedTerrains: ['Water'],
    isRiverOnly: true,
  },
  {
    id: 'solarpark',
    name: 'Solarpark Düren-Rurwiese',
    category: 'economy',
    cost: 7,
    maintenance: 0,
    description: 'Photovoltaikanlage auf unversiegelten Wiesen oder Ackerrandstreifen.',
    detailEffect: 'Steigert Erneuerbare Energien um +20%. Generiert +2 €/Runde Ökostrom-Dividende.',
    allowedTerrains: ['Wiese', 'Acker'],
  },
  {
    id: 'windkraft',
    name: 'Bürger-Windkraftanlage',
    category: 'economy',
    cost: 12,
    maintenance: 1,
    description: 'Klimaneutrale Windstromanlage zur Entlastung der energieintensiven Dürener Betriebe.',
    detailEffect: 'Steigert Erneuerbare Energien um +35%. Generiert +4 €/Runde Einspeisevergütung.',
    allowedTerrains: ['Wiese', 'Acker'],
  },
  {
    id: 'intensiv_farm',
    name: 'Intensive Landwirtschaft',
    category: 'economy',
    cost: 8,
    maintenance: 0,
    description: 'Konventioneller Ackerbau mit Düngemitteleinsatz und künstlicher Bewässerung.',
    detailEffect: 'Produziert hohes Einkommen (+8 €/Runde) aber schädigt Waterqualität benachbarter Flüsse (-1 WRRL).',
    allowedTerrains: ['Acker'],
  },
  {
    id: 'extensive_weide',
    name: 'Extensive Viehweide',
    category: 'economy',
    cost: 4,
    maintenance: 0,
    description: 'Naturnahe Beweidung mit Rindern oder Heidschnucken zur Landschaftspflege.',
    detailEffect: 'Generiert moderate Einnahmen (+2 €/Runde). FFH-Wert bleibt hoch, keine Dünger-Einträge.',
    allowedTerrains: ['Wiese'],
  },
  {
    id: 'klaerwerk_upgrade',
    name: 'Kläranlagen-Upgrade',
    category: 'economy',
    cost: 14,
    maintenance: 3,
    description: 'Erweiterung der Dürener Hauptkläranlage um die 4. Reinigungsstufe (Mikroschadstoffe).',
    detailEffect: 'Enormer Boost für Trinkwasserhygiene. WRRL Wasserqualität aller Flussabschnitte flussabwärts +1,5.',
    allowedTerrains: ['Siedlung', 'Gewerbe'],
  },

  // CATEGORY: Infrastruktur & Rurtalbahn (infrastructure)
  {
    id: 'rurtalbahn_halt',
    name: 'Rurtalbahn-Haltepunkt',
    category: 'infrastructure',
    cost: 8,
    maintenance: 1,
    description: 'Moderner Haltepunkt der traditionsreichen Rurtalbahn zur Entlastung des Autoverkehrs.',
    detailEffect: 'Bausynergie: Alle neu gebauten Gebäude im 2-Tile-Radius erhalten -1 Materialkosten (Baustoffzufluss per Gleis). Schaltet flexible Express-Aktionen frei.',
    allowedTerrains: ['Wiese', 'Siedlung', 'Gewerbe', 'Acker'],
  },
  {
    id: 'schoellershammer',
    name: 'Papierfabrik Schoellershammer',
    category: 'infrastructure',
    cost: 0, // Unbuilt/Fixed
    maintenance: 0,
    description: 'Jahrhundertealte Papierfabrik, pulsierendes industrielles Herz und größter Arbeitgeber in Düren.',
    detailEffect: 'Startet im "Produktionsmodus". Verursacht Trade-offs zwischen Wirtschaftskraft und Wassereinfluss.',
    allowedTerrains: ['Gewerbe'],
  },
  // CATEGORY: Tourismus & Erholung (tourism)
  {
    id: 'besucherzentrum',
    name: 'Besucherzentrum Rurtal',
    category: 'tourism',
    cost: 10,
    maintenance: 1,
    description: 'Modernes Informations- und Umweltbildungszentrum zur Besucherlenkung im Rurtal.',
    detailEffect: 'Generiert hohes Einkommen (+4 €/Runde) durch Führungen und erhöht stetig die Naturpunkte (+2/Runde).',
    allowedTerrains: ['Wiese', 'Siedlung'],
  },
  {
    id: 'campingplatz',
    name: 'Natur-Campingplatz',
    category: 'tourism',
    cost: 6,
    maintenance: 0,
    description: 'Ökologisch verträgliches Zelten und Rasten ohne feste Bodenversiegelung am Flussufer.',
    detailEffect: 'Sichert ein konstantes Grundeinkommen (+3 €/Runde) bei einer kleinen Störung der nahen Tierwelt (-5 FFH lokal).',
    allowedTerrains: ['Wiese', 'Auwald'],
    isRiverAdjacentOnly: true,
  },
  {
    id: 'kanuverleih',
    name: 'Kanuverleih & Anlegestelle',
    category: 'tourism',
    cost: 4,
    maintenance: 0,
    description: 'Saisonale Kanu- und Kajakausleihe mit geregeltem Ein- und Ausstieg zur Uferentlastung.',
    detailEffect: 'Bringt verlässliche Nebeneinnahmen (+2 €/Runde). Kann durch Trittschäden die lokale Wasserqualität leicht beeinträchtigen (-5% lokale Wasserqualität/WRRL).',
    allowedTerrains: ['Wiese', 'Water'],
    isRiverAdjacentOnly: true,
  }
];

export const INITIAL_ACTION_CARDS: ActionCard[] = [
  {
    id: 'act_build',
    type: 'BUILD',
    name: 'Bauen & Errichten',
    description: 'Errichte Gebäude aus dem Renaturierungs-Katalog auf der Karte.',
    strengthEffects: {
      1: 'Max. Baukosten: 4 € | Materialrabatt: 0 € (Erlaube einfache Bauwerke)',
      2: 'Max. Baukosten: 6 € | Materialrabatt: 0 € (Erlaube mittlere Bauwerke)',
      3: 'Max. Baukosten: 8 € | Materialrabatt: 1 € (Erlaube fortgeschrittene Bauwerke)',
      4: 'Max. Baukosten: 10 € | Materialrabatt: 1 € (Erlaube alle Standard-Bauwerke)',
      5: 'Max. Baukosten: Unbegrenzt | Materialrabatt: 2 € (Elite-Bauen für Großprojekte)',
    }
  },
  {
    id: 'act_plant',
    type: 'PLANT',
    name: 'Pflanzen & Aufwerten',
    description: 'Wandle naturferne Acker- oder Gewerbetiles in Wiesen oder dichte Auenwälder um.',
    strengthEffects: {
      1: 'Konvertiere 1 Acker-Tile in Wiese (Kosten: 2 €).',
      2: 'Konvertiere bis zu 2 Tiles in Wiesen (Kosten: 1,5 € pro Tile).',
      3: 'Pflanze 1 Auenwald auf einem Wiesentile (Gratis!).',
      4: 'Pflanze 1 Auenwald und konvertiere 1 Acker-Tile in Wiese (Gratis!).',
      5: 'Renaturierungs-Wunder: Verwandle bis zu 2 Acker/Gewerbetiles kostenfrei direkt in dichte Auenwälder.',
    }
  },
  {
    id: 'act_hydrology',
    type: 'HYDROLOGY',
    name: 'Wasser leiten',
    description: 'Fördere die Dynamik der Rur, vernetze Altarme oder dämme Flüsse naturnah ein.',
    strengthEffects: {
      1: 'Flussdynamik leicht stärken. Lokale FFH potential um +5 erhöhen.',
      2: 'Sohle entfesseln: Erhöhe Durchgängigkeit im Zielsektor um +8%.',
      3: 'Wasser fluten: Aktiviere Bodenfeuchte auf 1 extra Tile. Flussqualität +8%.',
      4: 'Hydrologischer Durchbruch: Erhöhe Durchgängigkeit im ganzen Flusslauf um +12%.',
      5: 'Flussbett-Befreiung: +15% Durchgängigkeit des Flusses & senke das Gesamthochwasserrisiko aller Siedlungen um -10%.',
    }
  },
  {
    id: 'act_funding',
    type: 'FUNDING',
    name: 'Förderung beantragen',
    description: 'Sichere finanzielle Mittel von der EU (LIFE+), dem Land NRW oder regionalen Sponsoren.',
    strengthEffects: {
      1: 'Erhalte sofort +3 € aus dem Kreishaushalt Düren.',
      2: 'Erhalte sofort +6 € von der Stiftung Natur.',
      3: 'Erhalte sofort +9 € aus Landesmitteln NRW.',
      4: 'Erhalte sofort +12 € +1 Forschungspunkt (Klima-Fonds).',
      5: 'EU-Großförderung LIFE+ erhalten: +16 € und +2 Forschungspunkte.',
    }
  },
  {
    id: 'act_research',
    type: 'RESEARCH',
    name: 'Gewässer-Forschung',
    description: 'Verstehe ökologische Zusammenhänge und generiere wertvolles Renaturierungs-Know-How.',
    strengthEffects: {
      1: 'Generiere +1 Forschungspunkt.',
      2: 'Generiere +2 Forschungspunkte.',
      3: 'Generiere +3 Forschungspunkte & +1 Naturpunkt.',
      4: 'Generiere +5 Forschungspunkte & +2 Naturpunkte.',
      5: 'Exzellenzcluster-Forschung: Generiere +7 Forschungspunkte & +4 Naturpunkte.',
    }
  }
];

export const RESEARCH_TECH_TREE: ResearchNode[] = [
  {
    id: 'biber_management',
    name: 'Biber-Management-Plan',
    cost: 5,
    unlocked: false,
    description: 'Schlichtungskonzept für Konflikte zwischen Biberschutz und Landwirtschaft.',
    effect: 'Sichert Biberakzeptanz. Biber-Konflikte kosten nur noch die Hälfte an € (Kosten halbiert) und generieren doppelte Naturpunkte.',
    dependencies: []
  },
  {
    id: 'lachs_nrw',
    name: 'Lachsprogramm NRW',
    cost: 8,
    unlocked: false,
    description: 'Kooperatives Pilotforschungsprogramm zur Ansiedlung des Atlantischen Lachses.',
    effect: 'Ermöglicht den Bau der Lachs-Zuchtstation. Erhöht die Lachsreinführungswahrscheinlichkeit um +30%.',
    dependencies: []
  },
  {
    id: 'auen_vitalisierung',
    name: 'Auen-Vitalisierung & Poldereffizienz',
    cost: 10,
    unlocked: false,
    description: 'Verbesserte Strömungsmodelle zur hydro-ökologischen Optimierung von Deichrückverlegungen.',
    effect: 'Retentionsräume / Polder arbeiten effektiver. Schadensvermeidung bei Hochwasser steigt auf 100%. Alluvialwälder entwickeln sich doppelt so schnell.',
    dependencies: ['biber_management']
  },
  {
    id: 'sohlgleiten_tech',
    name: 'Sohlgleiten-Technologie',
    cost: 6,
    unlocked: false,
    description: 'Spezielle geomorphologische Steinschüttmuster zur Schonung kleiner Flussbewohner (Makrozoobenthos).',
    effect: 'Rauhe Sohlgleiten kosten -1 € und erhöhen ländliches FFH-Potenzial um zusätzliche +10 Punkte.',
    dependencies: []
  },
  {
    id: 'mikroschadstoffe',
    name: 'Fortschrittliche Abwasserreinigung',
    cost: 12,
    unlocked: false,
    description: 'Forschung zu Aktivkohlefiltern und Ozonierung in Kläranlagen.',
    effect: 'Schaltet die Option frei, Klärwerk-Upgrades im 4. Reinigungsschritt gratis zu betreiben (keine Instandhaltungskosten von 3 €/Runde).',
    dependencies: ['sohlgleiten_tech']
  },
  {
    id: 'schoeller_renat',
    name: 'Fabrik-Transformationskonzept',
    cost: 18,
    unlocked: false,
    description: 'Konzeptstudie zur vollständigen, CO2-neutralen Konvertierung der Papierproduktion in ein Bio-Forschungspark.',
    effect: 'Schaltet den 4. Modus der Papierfabrik Schoellershammer frei: "Vollständige Renaturierung".',
    dependencies: ['lachs_nrw', 'mikroschadstoffe']
  },
  {
    id: 'green_energy_tech',
    name: 'Dürener Energiewende-Konzept',
    cost: 8,
    unlocked: false,
    description: 'Moderne Netzinfrastrukturen, intelligente Laststeuerung und industrielle Wärmepumpen für Dürens Großbetriebe.',
    effect: 'Ausgleich der energieintensiven Industrie: Liefert permanent +15% Erneuerbare Energien und verringert den Rundenverfall im schweren Modus um 50%.',
    dependencies: []
  }
];

export const BIOTOP_SPECIES: Species[] = [
  {
    id: 'bachforelle',
    name: 'Bachforelle & Groppe',
    latinName: 'Salmo trutta fario / Cottus gobio',
    description: 'Zeigerarten für einen sauerstoffreichen, naturnahen kiesreichen Flusslauf mit hoher Fließdynamik.',
    requirements: ['Globale Flussqualität WRRL ≤ 3.5', 'Mindestens 1 Kieslaichbett vorhanden.'],
    currentProgress: 0,
    unlocked: false,
    icon: '🐟'
  },
  {
    id: 'biber',
    name: 'Eurasischer Biber',
    latinName: 'Castor fiber',
    description: 'Der tierische Meisterwasserbauer. Gestaltet Landschaften, staut Gewässer auf und schafft Lebensraum für Amphibien.',
    requirements: ['Mindestens 2 Auenwald-Plättchen gepflanzt.', 'Forschungsstufe "Biber-Management-Plan" erforscht.'],
    currentProgress: 0,
    unlocked: false,
    icon: '🦫'
  },
  {
    id: 'feuerfalter',
    name: 'Blauschillernder Feuerfalter',
    latinName: 'Lycaena helle',
    description: 'Streng geschützter, seltener FFH-Wiesenbewohner, der extensiv feuchte Wiesen mit Schlangenknöterich als Nahrung bevorzugt.',
    requirements: ['Mindestens 2 Insektenhotels/Blühstreifen errichtet.', 'Durchchnittliches FFH-Potenzial ≥ 45%.'],
    currentProgress: 0,
    unlocked: false,
    icon: '🦋'
  },
  {
    id: 'eisvogel',
    name: 'Eisvogel',
    latinName: 'Alcedo atthis',
    description: 'Der fliegende Edelstein des Rurtals. Benötigt klares Wasser für die Jagd und Abbruchkanten für Brutröhren.',
    requirements: ['Mindestens 1 Ufer-Entfesselung gebaut.', 'Globale Flussqualität WRRL ≤ 2.8', 'Bachforelle erfolgreich angesiedelt.'],
    currentProgress: 0,
    unlocked: false,
    icon: '🐦'
  },
  {
    id: 'lachs',
    name: 'Atlantischer Lachs',
    latinName: 'Salmo salar',
    description: 'Die Königsart der Renaturierung. Ein Wanderfisch, der freie Wanderkorridore von der Nordsee bis ins Eifelgebirge verlangt.',
    requirements: ['Globale Flussdurchgängigkeit ≥ 60%', 'Papierfabrik Schoellershammer nicht im Produktionsmodus.', 'Lachs-Zuchtstation errichtet.', 'Forschung "Lachsprogramm NRW" freigeschaltet.'],
    currentProgress: 0,
    unlocked: false,
    icon: '👑'
  }
];

export const CLIMATE_EVENTS_DATA: ClimateEvent[] = [
  {
    id: 'hochwasser',
    name: 'Extrem-Hochwasser (Sturmtief Christian)',
    description: 'Tagelanger Dauerregen in der Nordeifel füllt die Rur-Talsperren. Eine massive Flutwelle bahnt sich den Weg durch Kreuzau und Düren Richtung Jülich!',
    effectDescription: 'Siedlungen erleiden Hochwasserschäden. Es kostet dich Guthaben (-12 €), es sei denn, Deichrückverlegungen oder Polder fangen das Wasser auf.',
    triggerCondition: 'Klimarisiko ≥ 30% und Jahreswechsel-Zufall.',
    active: false,
    duration: 1
  },
  {
    id: 'duerre',
    name: 'Jahrhundert-Dürresommer',
    description: 'Extreme Sonnenstrahlung und ausbleibender Niederschlag lassen den Pegel der Rur auf historische Tiefststände sinken. Die Wassertemperatur erreicht kritische 25°C.',
    effectDescription: 'Fischsterben droht! WRRL-Wert sinkt überall um -1. Intensive Äcker verursachen doppelt so viel Nitratbelastung (-1.5 WRRL).',
    triggerCondition: 'Klimarisiko ≥ 40% und Jahreswechsel-Zufall.',
    active: false,
    duration: 2
  },
  {
    id: 'biber_schaden',
    name: 'Biber-Konflikt auf Weidenfeld',
    description: 'Ein neu gebildetes Biberrevier hat durch einen stattlichen Damm ein angrenzendes konventionelles Weizenfeld unter Wasser gesetzt. Der wütende Landwirt verlangt Schadensersatz.',
    effectDescription: 'Kostet Geld (-6 €) für Ausgleichszahlungen, oder du entfernst den Biberdamm (-20 Biber-Fortschritt). Günstiger mit Biber-Management.',
    triggerCondition: 'Biber erfolgreich angesiedelt.',
    active: false,
    duration: 1
  },
  {
    id: 'buergerprotest',
    name: 'Bürgerdialog & Renaturierungs-Gegenwind',
    description: 'Eine Bürgerinitiative beklagt den Verlust von Parkplätzen und Freizeitwegen zugunsten der Ufer-Entfesselung nahe Düren.',
    effectDescription: 'Verringert deine Naturakzeptanz. Du musst Aufklärungsarbeit finanzieren (-4 €) oder riskierst Verzögerungen (Aktionskosten steigen um 1 Runde).',
    triggerCondition: 'Ufer-Entfesselung gebaut.',
    active: false,
    duration: 1
  }
];
