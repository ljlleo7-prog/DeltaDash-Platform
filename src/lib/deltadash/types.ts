import type { DeltaDashCardInstance } from './card-types';

export type DeltaDashPhase = 'planning' | 'resolving' | 'steward' | 'roundEnd' | 'finished';

export type DeltaDashRacePhase = 'preparation' | 'starting' | 'live' | 'finished';

export type DeltaDashActionType = 'steady' | 'push' | 'defend' | 'recover';

export type DeltaDashPlayerKind = 'human' | 'bot';

export type DeltaDashFlag = 'green' | 'yellow';

export type DeltaDashPenalty = 'warning' | 'speed-cap' | 'retired';

export type DeltaDashTyreCompound = 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';

export type DeltaDashPitStatus = 'none' | 'entry' | 'servicing' | 'exited';

export interface DeltaDashDriverStats {
  raceModifier: number;
  qualifyingModifier: number;
  focusCap: number;
  ability: string;
}

export interface DeltaDashTyreState {
  compound: DeltaDashTyreCompound;
  age: number;
}

export interface DeltaDashPitState {
  status: DeltaDashPitStatus;
  stops: number;
  cooldown: number;
  pendingCompound?: DeltaDashTyreCompound;
  repairSelected?: boolean;
}

export const DELTADASH_RESPONSE_WINDOW_SECONDS = 3;

export interface DeltaDashDataUpdateState {
  lastRound: number;
  preparationApplied: boolean;
  rankingUpdated: boolean;
  incidentsChecked: boolean;
  pitChecked: boolean;
}

export type DeltaDashSky = 'clear' | 'cloudy' | 'light-rain' | 'steady-rain';

export type DeltaDashClimate = 'arid' | 'temperate' | 'tropical' | 'street';

export type DeltaDashTemperatureBand = 'cool' | 'mild' | 'hot';

export interface DeltaDashWeatherState {
  sky: DeltaDashSky;
  rainIntensity: number;
  trackWetness: number;
  temperatureBand: DeltaDashTemperatureBand;
  trend: -1 | 0 | 1;
}

export interface DeltaDashTyreCurveProfile {
  baseWear: Record<DeltaDashTyreCompound, number>;
  degradationStartPercent: number;
  degradationExponent: number;
  maxPaceLoss: number;
  wetCrossover: {
    slickMaxWetness: number;
    intermediateMinWetness: number;
    intermediateMaxWetness: number;
    wetMinWetness: number;
  };
}

export interface DeltaDashTrack {
  id: string;
  name: string;
  finishTimeDelta: number;
  collisionTimeThreshold: number;
  maxRounds: number;
  weather: DeltaDashWeatherState;
  surfaceGrip: number;
  drySurfaceGrip: number;
  rainMm: number;
  tyreStress: number;
  climate: DeltaDashClimate;
  canRain: boolean;
  tyreCurve: DeltaDashTyreCurveProfile;
  realTrackKey?: string;
}

export interface DeltaDashPlayer {
  id: string;
  name: string;
  kind: DeltaDashPlayerKind;
  carId: string;
}

export interface DeltaDashCar {
  id: string;
  playerId: string;
  driverId: string;
  name: string;
  timeDelta: number;
  energy: number;
  tire: number;
  focus: number;
  focusCap: number;
  warnings: number;
  penalties: DeltaDashPenalty[];
  roundModifiers: string[];
  lastAction: DeltaDashActionType | null;
  retired: boolean;
  driverStats: DeltaDashDriverStats;
  tyreState: DeltaDashTyreState;
  pitState: DeltaDashPitState;
}

export interface DeltaDashActionCommitment {
  carId: string;
  action: DeltaDashActionType;
  cardDefinitionId?: string;
  cardInstanceId?: string;
  targetCarIds?: string[];
}

export interface DeltaDashStewardNote {
  id: string;
  round: number;
  carIds: string[];
  severity: 'info' | 'warning' | 'penalty' | 'retirement';
  message: string;
}

export interface DeltaDashMatchState {
  id: string;
  seed: number;
  round: number;
  phase: DeltaDashPhase;
  racePhase: DeltaDashRacePhase;
  track: DeltaDashTrack;
  flag: DeltaDashFlag;
  players: DeltaDashPlayer[];
  cars: DeltaDashCar[];
  cards: DeltaDashCardInstance[];
  commitments: DeltaDashActionCommitment[];
  stewardNotes: DeltaDashStewardNote[];
  dataUpdate: DeltaDashDataUpdateState;
  finishedAtRound: number | null;
}

export type DeltaDashEvent =
  | {
      type: 'MATCH_CREATED';
      match: DeltaDashMatchState;
    }
  | {
      type: 'RACE_STARTED';
      round: number;
    }
  | {
      type: 'PIT_ENTRY_REQUESTED';
      round: number;
      carId: string;
    }
  | {
      type: 'PIT_SERVICE_SELECTED';
      round: number;
      carId: string;
      compound: DeltaDashTyreCompound;
      repairSelected: boolean;
    }
  | {
      type: 'PIT_EXITED';
      round: number;
      carId: string;
    }
  | {
      type: 'WEATHER_UPDATED';
      round: number;
      weather: DeltaDashWeatherState;
      surfaceGrip: number;
      rainMm: number;
    }
  | {
      type: 'ROUND_STARTED';
      round: number;
    }
  | {
      type: 'TYRE_SELECTED';
      round: number;
      carId: string;
      compound: DeltaDashTyreCompound;
    }
  | {
      type: 'PIT_STATUS_CHANGED';
      round: number;
      carId: string;
      status: DeltaDashPitStatus;
    }
  | {
      type: 'DATA_UPDATE_APPLIED';
      round: number;
      updates: DeltaDashDataUpdateState;
    }
  | {
      type: 'ACTION_COMMITTED';
      round: number;
      carId: string;
      action: DeltaDashActionType;
      targetCarIds?: string[];
    }
  | {
      type: 'CARD_PLAY_COMMITTED';
      round: number;
      carId: string;
      cardInstanceId: string;
      cardDefinitionId: string;
      action: DeltaDashActionType;
      targetCarIds?: string[];
    }
  | {
      type: 'CARD_MOVED';
      round: number;
      cardInstanceId: string;
      zone: DeltaDashCardInstance['zone'];
      revealed: boolean;
      clearRoundModifiers?: string[];
    }
  | {
      type: 'CARD_RESOLVED';
      round: number;
      carId: string;
      cardDefinitionId: string;
    }
  | {
      type: 'CARDS_DRAWN';
      round: number;
      carId: string;
      cardInstanceIds: string[];
    }
  | {
      type: 'COMMITMENTS_LOCKED';
      round: number;
      responseWindowSeconds: number;
    }
  | {
      type: 'ACTIONS_RESOLVED';
      round: number;
      results: DeltaDashResolvedAction[];
    }
  | {
      type: 'STEWARD_REVIEWED';
      round: number;
      notes: DeltaDashStewardNote[];
      flag: DeltaDashFlag;
    }
  | {
      type: 'ROUND_ENDED';
      round: number;
    }
  | {
      type: 'MATCH_FINISHED';
      round: number;
    };

export interface DeltaDashResolvedAction {
  carId: string;
  action: DeltaDashActionType;
  cardDefinitionId?: string;
  sourceCarId?: string;
  targetCarId?: string;
  timeDeltaChange: number;
  energyDelta: number;
  tireDelta: number;
  focusDelta?: number;
  energyMin?: number;
  energyMax?: number;
  tireMin?: number;
  tireMax?: number;
  focusMin?: number;
  focusMax?: number;
  roundModifiers?: string[];
}

export interface DeltaDashRankedCar extends DeltaDashCar {
  rank: number;
}

export interface StoredDeltaDashMatchLog {
  version: 1;
  savedAt: string;
  events: DeltaDashEvent[];
}
