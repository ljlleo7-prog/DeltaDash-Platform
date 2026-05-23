import { createInitialCardInstances, DELTADASH_RACE_INIT } from './card-setup';
import { prototypeDrivers } from './driver-catalog';
import { createDeltaDashTrack, DEFAULT_REAL_TRACK_ID } from './track-catalog';
import type { DeltaDashCar, DeltaDashEvent, DeltaDashMatchState } from './types';

export const DELTADASH_PLAYER_COUNT_OPTIONS = prototypeDrivers.map((_, index) => index + 1).filter((count) => count >= 2);

export function createInitialMatchEvent(trackKey = DEFAULT_REAL_TRACK_ID, playerCount = 4): DeltaDashEvent {
  const seed = createMatchSeed();
  const selectedDrivers = getSeededDrivers(seed).slice(0, clampPlayerCount(playerCount));
  const humanIndex = getHumanDriverIndex(trackKey, selectedDrivers.length, seed);
  const players = selectedDrivers.map((driver, index) => {
    const isHuman = index === humanIndex;
    return {
      id: isHuman ? 'player-human' : `player-bot-${index}`,
      name: isHuman ? 'You' : `Bot ${driver.name}`,
      kind: isHuman ? 'human' as const : 'bot' as const,
      carId: isHuman ? `car-human-${index}` : `car-bot-${index}`,
    };
  });
  const cars = selectedDrivers
    .map((driver, index) => {
      const isHuman = index === humanIndex;
      return createCar(isHuman ? `car-human-${index}` : `car-bot-${index}`, isHuman ? 'player-human' : `player-bot-${index}`, driver.id, driver.carName);
    })
    .sort((left, right) => right.driverStats.qualifyingModifier - left.driverStats.qualifyingModifier || left.id.localeCompare(right.id))
    .map((car, gridIndex, grid) => ({
      ...car,
      timeDelta: -DELTADASH_RACE_INIT.startingGridGap * (gridIndex + 1),
      energy: getGridStartEnergy(gridIndex, grid.length),
    }));

  const match: DeltaDashMatchState = {
    id: `local-${Date.now()}-${seed.toString(36)}`,
    seed,
    round: 1,
    phase: 'planning',
    racePhase: 'preparation',
    track: createDeltaDashTrack(trackKey, seed),
    flag: 'green',
    players,
    cars,
    cards: createInitialCardInstances(cars, seed),
    commitments: [],
    turnStep: 'planning',
    resolutionQueue: [],
    resolutionIndex: 0,
    pendingChoice: null,
    cleanup: null,
    stewardNotes: [],
    dataUpdate: {
      lastRound: 1,
      preparationApplied: true,
      rankingUpdated: true,
      incidentsChecked: false,
      pitChecked: false,
    },
    finishedAtRound: null,
  };

  return { type: 'MATCH_CREATED', match };
}

function clampPlayerCount(playerCount: number): number {
  return Math.min(prototypeDrivers.length, Math.max(2, Math.floor(playerCount)));
}

function getSeededDrivers(seed: number) {
  return [...prototypeDrivers].sort((left, right) => hashString(`${seed}:${left.id}:driver`) - hashString(`${seed}:${right.id}:driver`));
}

function getHumanDriverIndex(trackKey: string, playerCount: number, seed: number): number {
  return hashString(`${seed}:${trackKey}:${playerCount}:human`) % playerCount;
}

function createMatchSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] || Date.now();
  }

  return Math.floor((Date.now() + Math.random()) * 1000) >>> 0;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getGridStartEnergy(gridIndex: number, gridSize: number): number {
  if (gridSize <= 1) return DELTADASH_RACE_INIT.maxEnergy;
  return Math.round((DELTADASH_RACE_INIT.minGridEnergy + ((gridIndex / (gridSize - 1)) * (DELTADASH_RACE_INIT.maxEnergy - DELTADASH_RACE_INIT.minGridEnergy))) * 10) / 10;
}

function createCar(id: string, playerId: string, driverId: string, name: string): DeltaDashCar {
  const driver = prototypeDrivers.find((candidate) => candidate.id === driverId);
  const driverStats = driver?.stats ?? { raceModifier: 0, qualifyingModifier: 0, focusCap: DELTADASH_RACE_INIT.focusCap, ability: 'Prototype' };

  return {
    id,
    playerId,
    driverId,
    name,
    timeDelta: DELTADASH_RACE_INIT.startingTimeDelta,
    energy: DELTADASH_RACE_INIT.startingEnergy,
    tire: DELTADASH_RACE_INIT.startingTire,
    focus: driverStats.focusCap,
    focusCap: driverStats.focusCap,
    warnings: 0,
    penalties: [],
    roundModifiers: [],
    lastAction: 'steady',
    retired: false,
    driverStats,
    tyreState: { compound: 'medium', age: 0 },
    pitState: { status: 'none', stops: 0, cooldown: 0 },
  };
}
