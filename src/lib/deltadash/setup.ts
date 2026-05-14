import type { DeltaDashEvent, DeltaDashMatchState, DeltaDashTrack } from './types';

const DEMO_TRACK: DeltaDashTrack = {
  id: 'neon-stadium-short',
  name: 'Neon Stadium Short',
  finishProgress: 30,
  collisionThreshold: 1,
  maxRounds: 12,
};

export function createInitialMatchEvent(): DeltaDashEvent {
  const match: DeltaDashMatchState = {
    id: `local-${Date.now()}`,
    seed: 2026,
    round: 1,
    phase: 'planning',
    track: DEMO_TRACK,
    flag: 'green',
    players: [
      { id: 'player-human', name: 'You', kind: 'human', carId: 'car-human' },
      { id: 'player-bot-1', name: 'Bot Senna', kind: 'bot', carId: 'car-bot-1' },
      { id: 'player-bot-2', name: 'Bot Vega', kind: 'bot', carId: 'car-bot-2' },
      { id: 'player-bot-3', name: 'Bot Nova', kind: 'bot', carId: 'car-bot-3' },
    ],
    cars: [
      createCar('car-human', 'player-human', 'Delta One'),
      createCar('car-bot-1', 'player-bot-1', 'Redline Ghost'),
      createCar('car-bot-2', 'player-bot-2', 'Azure Spark'),
      createCar('car-bot-3', 'player-bot-3', 'Night Runner'),
    ],
    commitments: [],
    stewardNotes: [],
    finishedAtRound: null,
  };

  return { type: 'MATCH_CREATED', match };
}

function createCar(id: string, playerId: string, name: string) {
  return {
    id,
    playerId,
    name,
    progress: 0,
    energy: 3,
    tire: 6,
    warnings: 0,
    penalties: [],
    lastAction: null,
    retired: false,
  };
}
