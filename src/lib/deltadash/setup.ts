import { createInitialCardInstances, DELTADASH_RACE_INIT } from './card-setup';
import { prototypeDrivers } from './driver-catalog';
import { createDeltaDashTrack, DEFAULT_REAL_TRACK_ID } from './track-catalog';
import type { DeltaDashEvent, DeltaDashMatchState } from './types';

export function createInitialMatchEvent(trackKey = DEFAULT_REAL_TRACK_ID): DeltaDashEvent {
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
    seed: DELTADASH_RACE_INIT.seed,
    round: 1,
    phase: 'planning',
    track: createDeltaDashTrack(trackKey),
    flag: 'green',
    players,
    cars,
    cards: createInitialCardInstances(cars, DELTADASH_RACE_INIT.seed),
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
    timeDelta: DELTADASH_RACE_INIT.startingTimeDelta,
    energy: DELTADASH_RACE_INIT.startingEnergy,
    tire: DELTADASH_RACE_INIT.startingTire,
    focus: DELTADASH_RACE_INIT.startingFocus,
    focusCap: DELTADASH_RACE_INIT.focusCap,
    warnings: 0,
    penalties: [],
    roundModifiers: [],
    lastAction: null,
    retired: false,
  };
}
