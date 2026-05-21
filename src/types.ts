export type TerrainType = 'Water' | 'Wiese' | 'Auwald' | 'Acker' | 'Gewerbe' | 'Siedlung';

export interface TileData {
  x: number;
  y: number;
  terrain: TerrainType;
  baseTerrain: TerrainType; // used to recover land after removal
  wrrl_quality: number;      // 1 (Excellent) to 5 (Bad)
  ffh_value: number;         // 0 to 100
  flood_risk: number;        // 0 to 100
  moisture: number;          // 0 to 100
  biodiversity: number;      // 0 to 100
  protected: boolean;        // Natura 2000 / NSG designation
  buildingId: string | null; // ID of placed building
  hasRiverConnection: boolean;
  upgradeLevel?: number;     // 1 = Basic, 2 = Upgraded, 3 = Expert!
}

export interface BuildingType {
  id: string;
  name: string;
  category: 'ecology' | 'water' | 'fauna' | 'economy' | 'infrastructure' | 'tourism';
  cost: number;
  maintenance: number;
  description: string;
  detailEffect: string;
  imageUrl?: string;
  allowedTerrains: TerrainType[];
  isRiverOnly?: boolean;
  isRiverAdjacentOnly?: boolean;
}

export type ActionCardType = 'BUILD' | 'PLANT' | 'HYDROLOGY' | 'FUNDING' | 'RESEARCH';

export interface ActionCard {
  id: string;
  type: ActionCardType;
  name: string;
  description: string;
  strengthEffects: { [key: number]: string };
}

export interface ResearchNode {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  description: string;
  effect: string;
  dependencies: string[];
}

export interface Species {
  id: string;
  name: string;
  latinName: string;
  description: string;
  requirements: string[];
  currentProgress: number; // 0 to 100
  unlocked: boolean;
  icon: string;
}

export type PaperFactoryMode = 'PRODUCTION' | 'RETROFITTING' | 'SHUTDOWN' | 'RENATURIZATION';

export interface ClimateEvent {
  id: string;
  name: string;
  description: string;
  effectDescription: string;
  triggerCondition: string;
  active: boolean;
  duration: number; // in rounds
}

export interface GameLog {
  id: string;
  round: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'event';
}

export interface GameStats {
  round: number;
  year: number;
  budget: number;
  researchPoints: number;
  naturePoints: number;
  globalWrrl: number;       // Average (1-5, lower is better)
  globalFfh: number;        // Average (0-100, higher is better)
  continuity: number;       // Longitudinal connectivity (0-100)
  climateRisk: number;      // 0 to 100
  paperFactoryMode: PaperFactoryMode;
  rurtalbahnSlotsUsed: number;
}
