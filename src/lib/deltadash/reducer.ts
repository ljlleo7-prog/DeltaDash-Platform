import { createInitialCardInstances, DELTADASH_RACE_INIT } from './card-setup';
import { getPrototypeDriver } from './driver-catalog';
import { createDeltaDashTrack, getSurfaceGrip } from './track-catalog';
import type {
  DeltaDashActionType,
  DeltaDashCar,
  DeltaDashEvent,
  DeltaDashMatchState,
  DeltaDashResolvedAction,
  DeltaDashStewardNote,
  DeltaDashTrack,
  DeltaDashTyreCompound,
  DeltaDashTyreCurveProfile,
  DeltaDashWeatherState,
} from './types';

const PIT_LANE_NORMAL_MIN_TIME_LOSS_SECONDS = 6;
const PIT_LANE_NORMAL_MAX_TIME_LOSS_SECONDS = 9;
const PIT_LANE_YELLOW_TIME_LOSS_SECONDS = 4;
const PIT_TYRE_CHANGE_TIME_LOSS_SECONDS = 2.4;
const PIT_REPAIR_TIME_LOSS_SECONDS = 1.4;
const PIT_REPAIR_TYRE_GAIN = 18;
const PIT_REPAIR_FOCUS_GAIN = 2;

export function projectDeltaDashEvents(events: DeltaDashEvent[]): DeltaDashMatchState | null {
  return events.reduce<DeltaDashMatchState | null>((state, event) => applyDeltaDashEvent(state, event), null);
}

export function applyDeltaDashEvent(state: DeltaDashMatchState | null, event: DeltaDashEvent): DeltaDashMatchState | null {
  switch (event.type) {
    case 'MATCH_CREATED':
      return ensureMatchState(cloneState(event.match));
    case 'RACE_STARTED':
      return state && state.racePhase !== 'finished' ? { ...state, racePhase: 'live' } : state;
    case 'PIT_ENTRY_REQUESTED':
      return state ? enterPitLane(state, event.carId) : state;
    case 'PIT_SERVICE_SELECTED':
      return state ? selectPitService(state, event.carId, event.compound, event.repairSelected) : state;
    case 'PIT_EXITED':
      return state ? exitPitLane(state, event.carId) : state;
    case 'ROUND_STARTED':
      return state ? { ...state, round: event.round, phase: 'planning', commitments: [], cars: state.cars.map((car) => ({ ...car, roundModifiers: getPersistentRoundModifiers(state, car.id), pitState: car.pitState.status === 'exited' ? { ...car.pitState, status: 'none', pendingCompound: undefined, repairSelected: false } : car.pitState })), dataUpdate: { lastRound: event.round, preparationApplied: true, rankingUpdated: false, incidentsChecked: false, pitChecked: false } } : state;
    case 'TYRE_SELECTED':
      return state && state.racePhase === 'preparation' ? { ...state, cars: state.cars.map((car) => car.id === event.carId ? { ...car, tyreState: { ...car.tyreState, compound: event.compound, age: 0 } } : car) } : state;
    case 'PIT_STATUS_CHANGED':
      return state;
    case 'DATA_UPDATE_APPLIED':
      return state ? { ...state, dataUpdate: event.updates } : state;
    case 'WEATHER_UPDATED':
      return state ? { ...state, track: { ...state.track, weather: event.weather, surfaceGrip: event.surfaceGrip, rainMm: event.rainMm } } : state;
    case 'ACTION_COMMITTED':
      return state ? commitAction(state, event.carId, event.action, undefined, undefined, event.targetCarIds) : state;
    case 'CARD_PLAY_COMMITTED':
      return state ? commitAction(state, event.carId, event.action, event.cardDefinitionId, event.cardInstanceId, event.targetCarIds) : state;
    case 'CARD_MOVED':
      return state ? moveCard(state, event.cardInstanceId, event.zone, event.revealed, event.clearRoundModifiers) : state;
    case 'CARD_RESOLVED':
      return state;
    case 'CARDS_DRAWN':
      return state ? drawCards(state, event.carId, event.cardInstanceIds) : state;
    case 'COMMITMENTS_LOCKED':
      return state ? { ...state, phase: 'resolving' } : state;
    case 'ACTIONS_RESOLVED':
      return state ? resolveActions(state, event.results) : state;
    case 'STEWARD_REVIEWED':
      return state
        ? {
            ...state,
            phase: 'steward',
            flag: event.flag,
            stewardNotes: [...state.stewardNotes, ...event.notes],
            cars: applyStewardNotes(state.cars, event.notes),
          }
        : state;
    case 'ROUND_ENDED':
      return state ? { ...state, phase: 'roundEnd', commitments: [] } : state;
    case 'MATCH_FINISHED':
      return state ? { ...state, phase: 'finished', racePhase: 'finished', finishedAtRound: event.round } : state;
    default:
      return state;
  }
}

export function resolveAction(car: DeltaDashCar, action: DeltaDashActionType, track: DeltaDashTrack, yellowFlag: boolean): DeltaDashResolvedAction {
  const hasSpeedCap = car.penalties.includes('speed-cap') || yellowFlag;

  if (car.retired) {
    return { carId: car.id, sourceCarId: car.id, targetCarId: car.id, action, timeDeltaChange: 0, energyDelta: 0, tireDelta: 0, focusDelta: 0, roundModifiers: [] };
  }

  const resolvedAction = action === 'push' && (car.energy < 2 || hasSpeedCap) ? 'steady' : action;
  const speedCapped = hasSpeedCap && resolvedAction === 'steady';
  const pace = getBasePace(resolvedAction, speedCapped) + car.driverStats.raceModifier + computeWeatherPaceAdjustment(track, resolvedAction) + computeTyrePerformanceAdjustment(track, car, resolvedAction);
  const tireDelta = getTyreDelta(track, car, resolvedAction);

  switch (resolvedAction) {
    case 'push':
      return { carId: car.id, sourceCarId: car.id, targetCarId: car.id, action: resolvedAction, timeDeltaChange: pace, energyDelta: -2, tireDelta, focusDelta: 0, roundModifiers: [] };
    case 'defend':
      return { carId: car.id, sourceCarId: car.id, targetCarId: car.id, action: resolvedAction, timeDeltaChange: pace, energyDelta: 0, tireDelta, focusDelta: 0, roundModifiers: [] };
    case 'recover':
      return { carId: car.id, sourceCarId: car.id, targetCarId: car.id, action: resolvedAction, timeDeltaChange: pace, energyDelta: 2, tireDelta, tireMax: 100, focusDelta: 0, roundModifiers: [] };
    case 'steady':
    default:
      return { carId: car.id, sourceCarId: car.id, targetCarId: car.id, action: 'steady', timeDeltaChange: pace, energyDelta: 1, tireDelta, focusDelta: 0, roundModifiers: [] };
  }
}

export function advanceWeather(track: DeltaDashTrack, round: number, seed: number): DeltaDashWeatherState {
  if (!track.canRain || track.weather.sky === 'clear') {
    return { ...track.weather, sky: 'clear', rainIntensity: 0, trackWetness: 0, trend: 0 };
  }

  const roll = deterministicNoise(`${track.id}:${seed}:${round}:weather`);
  const nextSky = getNextSky(track.weather.sky, track.weather.trend, roll);
  const rainIntensity = nextSky === 'steady-rain' ? 0.58 : nextSky === 'light-rain' ? 0.30 : 0;
  const wetnessDelta = rainIntensity > 0 ? 0.10 + (rainIntensity * 0.12) : -(0.12 + (roll * 0.08));
  const trackWetness = clamp(track.weather.trackWetness + wetnessDelta, 0, 0.86);
  const trend = nextSky === 'steady-rain' ? 1 : nextSky === 'cloudy' && track.weather.trackWetness > trackWetness ? -1 : 0;

  return { ...track.weather, sky: nextSky, rainIntensity, trackWetness, trend };
}

export function getWeatherSurfaceGrip(track: DeltaDashTrack, weather: DeltaDashWeatherState): number {
  return getSurfaceGrip(track.drySurfaceGrip, weather.trackWetness);
}

function getBasePace(action: DeltaDashActionType, speedCapped: boolean): number {
  if (action === 'push') return 2.5;
  if (action === 'defend') return 1;
  if (action === 'recover') return 0.5;
  return speedCapped ? 1 : 1.5;
}

function getTyreDelta(track: DeltaDashTrack, car: DeltaDashCar, action: DeltaDashActionType): number {
  if (action === 'recover') return track.weather.trackWetness > 0.55 ? 0 : 0.6;
  return -computeTyreWear(track, car, action);
}

function computeTyreWear(track: DeltaDashTrack, car: DeltaDashCar, action: DeltaDashActionType): number {
  const tyreCurve = track.tyreCurve;
  const wetness = track.weather.trackWetness;
  const baseWear = tyreCurve.baseWear[car.tyreState.compound];
  const actionFactor = {
    push: 1.35,
    steady: 1,
    defend: 0.72,
    recover: 0.25,
  }[action];
  const trackFactor = clamp(0.82 + (0.36 * track.tyreStress), 0.82, 1.18);
  const tempFactor = track.weather.temperatureBand === 'hot' ? 1.08 : track.weather.temperatureBand === 'cool' ? 0.96 : 1;
  const compoundWetFactor = getCompoundWetFactor(car.tyreState.compound, wetness, tyreCurve.wetCrossover);
  const ageFactor = 1 + Math.min(0.18, car.tyreState.age * 0.012);
  return roundToTenth(clamp(baseWear * actionFactor * trackFactor * tempFactor * compoundWetFactor * ageFactor / 6, 0.4, 18));
}

function computeTyrePerformanceAdjustment(track: DeltaDashTrack, car: DeltaDashCar, action: DeltaDashActionType): number {
  const tyreCurve = track.tyreCurve;
  const tirePercent = car.tire;
  const degradationStart = tyreCurve.degradationStartPercent;
  if (tirePercent >= degradationStart) return 0;

  const lossFraction = clamp((degradationStart - tirePercent) / degradationStart, 0, 1);
  const actionLoad = {
    push: 1,
    steady: 0.72,
    defend: 0.45,
    recover: 0.28,
  }[action];
  return -roundToTenth(clamp((lossFraction ** tyreCurve.degradationExponent) * tyreCurve.maxPaceLoss * actionLoad, 0, tyreCurve.maxPaceLoss));
}

function getCompoundWetFactor(compound: DeltaDashTyreCompound, wetness: number, crossover: DeltaDashTyreCurveProfile['wetCrossover']): number {
  if (compound === 'wet') return wetness >= crossover.slickMaxWetness ? 0.78 : 0.95;
  if (compound === 'intermediate') {
    if (wetness < crossover.intermediateMinWetness) return 1.12;
    if (wetness > crossover.intermediateMaxWetness) return 0.88;
    return 1;
  }
  if (compound === 'soft') return wetness > crossover.slickMaxWetness ? 1.18 : 1;
  if (compound === 'hard') return wetness > crossover.wetMinWetness ? 1.08 : 0.96;
  return wetness > crossover.wetMinWetness ? 1.12 : 0.98;
}

function computeWeatherPaceAdjustment(track: DeltaDashTrack, action: DeltaDashActionType): number {
  const effectiveGrip = track.surfaceGrip ?? getSurfaceGrip(track.drySurfaceGrip, track.weather.trackWetness);
  const riskCoefficient = {
    push: 1.25,
    steady: 0.72,
    defend: 0.42,
    recover: 0.28,
  }[action];
  return -roundToTenth(clamp((1 - effectiveGrip) * riskCoefficient, 0, 0.6));
}

function getNextSky(currentSky: DeltaDashWeatherState['sky'], trend: DeltaDashWeatherState['trend'], roll: number): DeltaDashWeatherState['sky'] {
  if (currentSky === 'steady-rain') return roll < 0.24 ? 'light-rain' : 'steady-rain';
  if (currentSky === 'light-rain') {
    if (roll < 0.18) return 'cloudy';
    if (roll > 0.88 && trend >= 0) return 'steady-rain';
    return 'light-rain';
  }
  return roll > 0.92 ? 'light-rain' : 'cloudy';
}

function deterministicNoise(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function commitAction(state: DeltaDashMatchState, carId: string, action: DeltaDashActionType, cardDefinitionId?: string, cardInstanceId?: string, targetCarIds: string[] = []): DeltaDashMatchState {
  return { ...state, commitments: [...state.commitments, { carId, action, cardDefinitionId, cardInstanceId, targetCarIds }] };
}

function moveCard(state: DeltaDashMatchState, cardInstanceId: string, zone: DeltaDashMatchState['cards'][number]['zone'], revealed: boolean, clearRoundModifiers: string[] = []): DeltaDashMatchState {
  const movedCard = state.cards.find((card) => card.instanceId === cardInstanceId);

  return {
    ...state,
    cards: state.cards.map((card) => (card.instanceId === cardInstanceId ? { ...card, zone, revealed } : card)),
    cars: movedCard && clearRoundModifiers.length
      ? state.cars.map((car) => car.id === movedCard.ownerCarId ? { ...car, roundModifiers: car.roundModifiers.filter((modifier) => !clearRoundModifiers.includes(modifier)) } : car)
      : state.cars,
  };
}

function enterPitLane(state: DeltaDashMatchState, carId: string): DeltaDashMatchState {
  if (state.racePhase !== 'live' || state.phase !== 'planning') return state;

  return {
    ...state,
    cars: state.cars.map((car) => {
      if (car.id !== carId || car.retired || car.pitState.status !== 'none' || car.pitState.cooldown > 0) return car;
      return {
        ...car,
        timeDelta: Math.max(0, car.timeDelta - getPitLaneTimeLoss(state)),
        pitState: {
          ...car.pitState,
          status: 'servicing',
          pendingCompound: car.tyreState.compound,
          repairSelected: false,
        },
      };
    }),
  };
}

function getPitLaneTimeLoss(state: DeltaDashMatchState): number {
  if (state.flag === 'yellow') return PIT_LANE_YELLOW_TIME_LOSS_SECONDS;
  const stress = state.track.tyreStress ?? 0.5;
  const range = PIT_LANE_NORMAL_MAX_TIME_LOSS_SECONDS - PIT_LANE_NORMAL_MIN_TIME_LOSS_SECONDS;
  return roundToTenth(PIT_LANE_NORMAL_MIN_TIME_LOSS_SECONDS + (stress * range));
}

function selectPitService(state: DeltaDashMatchState, carId: string, compound: DeltaDashTyreCompound, repairSelected: boolean): DeltaDashMatchState {
  if (state.racePhase !== 'live') return state;

  return {
    ...state,
    cars: state.cars.map((car) => car.id === carId && car.pitState.status === 'servicing'
      ? { ...car, pitState: { ...car.pitState, pendingCompound: compound, repairSelected } }
      : car),
  };
}

function exitPitLane(state: DeltaDashMatchState, carId: string): DeltaDashMatchState {
  if (state.racePhase !== 'live') return state;

  return {
    ...state,
    cars: state.cars.map((car) => {
      if (car.id !== carId || car.pitState.status !== 'servicing') return car;

      const compound = car.pitState.pendingCompound ?? car.tyreState.compound;
      const changedCompound = compound !== car.tyreState.compound;
      const repairSelected = Boolean(car.pitState.repairSelected);
      const serviceLoss = (changedCompound ? PIT_TYRE_CHANGE_TIME_LOSS_SECONDS : 0) + (repairSelected ? PIT_REPAIR_TIME_LOSS_SECONDS : 0);

      return {
        ...car,
        timeDelta: Math.max(0, car.timeDelta - serviceLoss),
        tire: repairSelected ? clamp(car.tire + PIT_REPAIR_TYRE_GAIN, 0, 100) : car.tire,
        focus: repairSelected ? clamp(car.focus + PIT_REPAIR_FOCUS_GAIN, 0, car.focusCap) : car.focus,
        tyreState: changedCompound ? { compound, age: 0 } : car.tyreState,
        pitState: {
          status: 'exited',
          stops: car.pitState.stops + 1,
          cooldown: 1,
          pendingCompound: undefined,
          repairSelected: false,
        },
      };
    }),
  };
}

function drawCards(state: DeltaDashMatchState, carId: string, cardInstanceIds: string[]): DeltaDashMatchState {
  const player = state.players.find((candidate) => candidate.carId === carId);
  const revealed = player?.kind === 'bot';
  const drawnIds = new Set(cardInstanceIds);

  return {
    ...state,
    cards: state.cards.map((card) => (drawnIds.has(card.instanceId) && card.ownerCarId === carId ? { ...card, zone: 'hand' as const, revealed } : card)),
  };
}

function resolveActions(state: DeltaDashMatchState, results: DeltaDashResolvedAction[]): DeltaDashMatchState {
  const resultsByCarId = new Map<string, DeltaDashResolvedAction[]>();
  for (const result of results) {
    resultsByCarId.set(result.carId, [...(resultsByCarId.get(result.carId) ?? []), result]);
  }

  return {
    ...state,
    phase: 'resolving',
    cars: state.cars.map((car) => {
      const carResults = resultsByCarId.get(car.id);
      if (!carResults?.length) return car;
      const result = mergeResults(carResults);

      return {
        ...car,
        timeDelta: Math.max(0, car.timeDelta + result.timeDeltaChange),
        energy: clamp(car.energy + result.energyDelta, result.energyMin ?? 0, result.energyMax ?? 4),
        tire: result.roundModifiers?.includes('no-tire-wear') ? car.tire : clamp(car.tire + result.tireDelta, result.tireMin ?? 0, result.tireMax ?? 100),
        focus: clamp((car.focus ?? 0) + (result.focusDelta ?? 0), result.focusMin ?? 0, Math.min(car.focusCap ?? 8, result.focusMax ?? Number.POSITIVE_INFINITY)),
        roundModifiers: [...new Set([...(car.roundModifiers ?? []), ...(result.roundModifiers ?? [])])],
        lastAction: result.sourceCarId === car.id ? result.action : car.lastAction,
        tyreState: { ...car.tyreState, age: car.tyreState.age + 1 },
        pitState: { ...car.pitState, cooldown: Math.max(0, car.pitState.cooldown - 1) },
        penalties: car.penalties.filter((penalty) => penalty !== 'speed-cap'),
      };
    }),
  };
}

function mergeResults(results: DeltaDashResolvedAction[]): DeltaDashResolvedAction {
  return results.reduce<DeltaDashResolvedAction>((merged, result) => ({
    ...merged,
    timeDeltaChange: merged.timeDeltaChange + result.timeDeltaChange,
    energyDelta: merged.energyDelta + result.energyDelta,
    tireDelta: merged.tireDelta + result.tireDelta,
    focusDelta: (merged.focusDelta ?? 0) + (result.focusDelta ?? 0),
    energyMin: result.energyMin ?? merged.energyMin,
    energyMax: result.energyMax ?? merged.energyMax,
    tireMin: result.tireMin ?? merged.tireMin,
    tireMax: result.tireMax ?? merged.tireMax,
    focusMin: result.focusMin ?? merged.focusMin,
    focusMax: result.focusMax ?? merged.focusMax,
    roundModifiers: [...new Set([...(merged.roundModifiers ?? []), ...(result.roundModifiers ?? [])])],
  }), { ...results[0], timeDeltaChange: 0, energyDelta: 0, tireDelta: 0, focusDelta: 0, roundModifiers: [] });
}

function getPersistentRoundModifiers(state: DeltaDashMatchState, carId: string): string[] {
  const car = state.cars.find((candidate) => candidate.id === carId);
  const hasSteadfastDefense = state.cards.some((card) => card.ownerCarId === carId && card.definitionId === 'tactic.steadfast-lion' && card.zone === 'deployed');
  return [
    ...(hasSteadfastDefense ? ['steadfast-defense', 'position-lock'] : []),
    ...(car?.roundModifiers.includes('no-normal-release-next-round') ? ['no-normal-release'] : []),
  ];
}

function applyStewardNotes(cars: DeltaDashCar[], notes: DeltaDashStewardNote[]): DeltaDashCar[] {
  return cars.map((car) => {
    const carNotes = notes.filter((note) => note.carIds.includes(car.id));
    if (!carNotes.length) return car;

    const warnings = car.warnings + carNotes.filter((note) => note.severity === 'warning').length;
    const hasPenalty = carNotes.some((note) => note.severity === 'penalty');
    const retired = car.retired || carNotes.some((note) => note.severity === 'retirement');
    const penalties = new Set(car.penalties);

    if (hasPenalty) penalties.add('speed-cap');
    if (warnings > 0) penalties.add('warning');
    if (retired) penalties.add('retired');

    return { ...car, warnings, penalties: Array.from(penalties), retired };
  });
}

function ensureMatchState(state: DeltaDashMatchState): DeltaDashMatchState {
  const baseTrack = createDeltaDashTrack(state.track.realTrackKey ?? state.track.id, state.seed);
  const weather = state.track.weather ?? baseTrack.weather;
  const drySurfaceGrip = state.track.drySurfaceGrip ?? baseTrack.drySurfaceGrip;
  const upgradedTrack = {
    ...baseTrack,
    ...state.track,
    finishTimeDelta: state.track.finishTimeDelta ?? 15,
    collisionTimeThreshold: state.track.collisionTimeThreshold ?? 0.5,
    maxRounds: state.track.maxRounds ?? 12,
    drySurfaceGrip,
    weather,
    rainMm: Number.isFinite(state.track.rainMm) ? state.track.rainMm : weather.rainIntensity * 8,
    surfaceGrip: Number.isFinite(state.track.surfaceGrip) ? state.track.surfaceGrip : getSurfaceGrip(drySurfaceGrip, weather.trackWetness),
    tyreStress: state.track.tyreStress ?? baseTrack.tyreStress,
    climate: state.track.climate ?? baseTrack.climate,
    canRain: state.track.canRain ?? baseTrack.canRain,
    tyreCurve: state.track.tyreCurve ?? baseTrack.tyreCurve,
  };

  return ensureCardState({
    ...state,
    racePhase: state.racePhase ?? (state.phase === 'finished' ? 'finished' : 'live'),
    track: upgradedTrack,
    dataUpdate: state.dataUpdate ?? {
      lastRound: state.round,
      preparationApplied: state.phase === 'planning',
      rankingUpdated: true,
      incidentsChecked: false,
      pitChecked: false,
    },
  });
}

function ensureCardState(state: DeltaDashMatchState): DeltaDashMatchState {
  const upgradedCars = state.cars.map((car) => {
    const driverStats = car.driverStats ?? getPrototypeDriver(car.driverId)?.stats ?? { raceModifier: 0, qualifyingModifier: 0, focusCap: DELTADASH_RACE_INIT.focusCap, ability: 'Prototype' };

    return {
      ...car,
      timeDelta: Number.isFinite(car.timeDelta) ? car.timeDelta : Number.isFinite((car as DeltaDashCar & { progress?: number }).progress) ? (car as DeltaDashCar & { progress?: number }).progress ?? 0 : 0,
      energy: Number.isFinite(car.energy) ? car.energy : DELTADASH_RACE_INIT.startingEnergy,
      tire: normalizeTyrePercent(car.tire),
      focus: Number.isFinite(car.focus) ? car.focus : driverStats.focusCap,
      focusCap: Number.isFinite(car.focusCap) ? car.focusCap : driverStats.focusCap,
      roundModifiers: car.roundModifiers ?? [],
      lastAction: car.lastAction ?? 'steady',
      driverStats,
      tyreState: car.tyreState ?? { compound: 'medium', age: 0 },
      pitState: car.pitState ?? { status: 'none', stops: 0, cooldown: 0 },
    };
  });
  const cards = state.cards?.length ? state.cards : createInitialCardInstances(upgradedCars, state.seed);
  const starterCards = createInitialCardInstances(upgradedCars, state.seed);
  const existingCardKeys = new Set(cards.map((card) => `${card.ownerCarId}:${card.definitionId}`));
  const missingStarterCards = starterCards.filter((card) => !existingCardKeys.has(`${card.ownerCarId}:${card.definitionId}`));

  return { ...state, cars: upgradedCars, cards: [...cards, ...missingStarterCards] };
}

function normalizeTyrePercent(value: number): number {
  if (!Number.isFinite(value)) return DELTADASH_RACE_INIT.startingTire;
  if (value <= 6) return roundToTenth((value / 6) * 100);
  return clamp(value, 0, 100);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cloneState(state: DeltaDashMatchState): DeltaDashMatchState {
  return JSON.parse(JSON.stringify(state)) as DeltaDashMatchState;
}
