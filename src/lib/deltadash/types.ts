import type { DeltaDashCardInstance } from './card-types';

export type DeltaDashPhase = 'planning' | 'resolving' | 'steward' | 'roundEnd' | 'finished';

export type DeltaDashActionType = 'steady' | 'push' | 'defend' | 'recover';

export type DeltaDashPlayerKind = 'human' | 'bot';

export type DeltaDashFlag = 'green' | 'yellow';

export type DeltaDashPenalty = 'warning' | 'speed-cap' | 'retired';

export interface DeltaDashTrack {
  id: string;
  name: string;
  finishProgress: number;
  collisionThreshold: number;
  maxRounds: number;
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
  progress: number;
  energy: number;
  tire: number;
  warnings: number;
  penalties: DeltaDashPenalty[];
  lastAction: DeltaDashActionType | null;
  retired: boolean;
}

export interface DeltaDashActionCommitment {
  carId: string;
  action: DeltaDashActionType;
  cardDefinitionId?: string;
  cardInstanceId?: string;
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
    }
  | {
      type: 'CARD_PLAY_COMMITTED';
      round: number;
      carId: string;
      cardInstanceId: string;
      cardDefinitionId: string;
      action: DeltaDashActionType;
    }
  | {
      type: 'CARD_MOVED';
      round: number;
      cardInstanceId: string;
      zone: DeltaDashCardInstance['zone'];
      revealed: boolean;
    }
  | {
      type: 'CARD_RESOLVED';
      round: number;
      carId: string;
      cardDefinitionId: string;
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
  progressDelta: number;
  energyDelta: number;
  tireDelta: number;
}

export interface DeltaDashRankedCar extends DeltaDashCar {
  rank: number;
}

export interface StoredDeltaDashMatchLog {
  version: 1;
  savedAt: string;
  events: DeltaDashEvent[];
}
