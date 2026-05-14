import { createPrototypeCardInstances } from './card-setup';
import { prototypeDrivers } from './driver-catalog';
import type { DeltaDashEvent, DeltaDashMatchState, DeltaDashTrack } from './types';

const DEMO_TRACK: DeltaDashTrack = {
  id: 'neon-stadium-short',
  name: 'Neon Stadium Short',
  finishProgress: 30,
  collisionThreshold: 1,
  maxRounds: 12,
};

export function createInitialMatchEvent(): DeltaDashEvent {
  const players = prototypeDrivers.map((driver, index) => {
    const isHuman = index === 0;
    return {
      id: isHuman ? 'player-human' : `player-bot-${index}`,
      name: isHuman ? 'You' : `Bot ${driver.name}`,
      kind: isHuman ? 'human' as const : 'bot' as const,
      carId: isHuman ? 'car-human' : `car-bot-${index}`,
    };
  });
  const cars = prototypeDrivers.map((driver, index) => {
    const isHuman = index === 0;
    return createCar(isHuman ? 'car-human' : `car-bot-${index}`, isHuman ? 'player-human' : `player-bot-${index}`, driver.id, driver.carName);
  });

  const match: DeltaDashMatchState = {
    id: `local-${Date.now()}`,
    seed: 2026,
    round: 1,
    phase: 'planning',
    track: DEMO_TRACK,
    flag: 'green',
    players,
    cars,
    cards: createPrototypeCardInstances(cars),
    commitments: [],
    stewardNotes: [],
    finishedAtRound: null,
  };

  return { type: 'MATCH_CREATED', match };
}

function createCar(id: string, playerId: string, driverId: string, name: string) {
  return {
    id,
    playerId,
    driverId,
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
