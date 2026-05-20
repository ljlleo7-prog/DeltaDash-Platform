import type { DeltaDashCardInstance } from './card-types';

export type DeltaDashPhase = 'planning' | 'resolving' | 'steward' | 'roundEnd' | 'finished';

export type DeltaDashActionType = 'steady' | 'push' | 'defend' | 'recover';

export type DeltaDashPlayerKind = 'human' | 'bot';

export type DeltaDashFlag = 'green' | 'yellow';

export type DeltaDashPenalty = 'warning' | 'speed-cap' | 'retired';

export interface DeltaDashTrack {
  id: string;
  name: string;
  finishTimeDelta: number;
  collisionTimeThreshold: number;
  maxRounds: number;
  rainMm: number;
  surfaceGrip: number;
  tyreStress: number;
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
  track: DeltaDashTrack;
  flag: DeltaDashFlag;
  players: DeltaDashPlayer[];
  cars: DeltaDashCar[];
  cards: DeltaDashCardInstance[];
  commitments: DeltaDashActionCommitment[];
  stewardNotes: DeltaDashStewardNote[];
  finishedAtRound: number | null;
}

export type DeltaDashEvent =
  | {
      type: 'MATCH_CREATED';
      match: DeltaDashMatchState;
    }
  | {
      type: 'ROUND_STARTED';
      round: number;
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
