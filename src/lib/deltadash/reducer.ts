import { createInitialCardInstances, DELTADASH_RACE_INIT } from './card-setup';
import { createDeltaDashTrack } from './track-catalog';
import type {
  DeltaDashActionType,
  DeltaDashCar,
  DeltaDashEvent,
  DeltaDashMatchState,
  DeltaDashResolvedAction,
  DeltaDashStewardNote,
} from './types';

export function projectDeltaDashEvents(events: DeltaDashEvent[]): DeltaDashMatchState | null {
  return events.reduce<DeltaDashMatchState | null>((state, event) => applyDeltaDashEvent(state, event), null);
}

export function applyDeltaDashEvent(state: DeltaDashMatchState | null, event: DeltaDashEvent): DeltaDashMatchState | null {
  switch (event.type) {
    case 'MATCH_CREATED':
      return ensureMatchState(cloneState(event.match));
    case 'ROUND_STARTED':
      return state ? { ...state, round: event.round, phase: 'planning', commitments: [], cars: state.cars.map((car) => ({ ...car, roundModifiers: getPersistentRoundModifiers(state, car.id) })) } : state;
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
      return state ? { ...state, phase: 'finished', finishedAtRound: event.round } : state;
    default:
      return state;
  }
}

export function resolveAction(car: DeltaDashCar, action: DeltaDashActionType, yellowFlag: boolean): DeltaDashResolvedAction {
  const hasSpeedCap = car.penalties.includes('speed-cap') || yellowFlag;

  if (car.retired) {
    return { carId: car.id, action, timeDeltaChange: 0, energyDelta: 0, tireDelta: 0, focusDelta: 0, roundModifiers: [] };
  }

  switch (action) {
    case 'push': {
      const canPush = car.energy >= 2 && !hasSpeedCap;
      return canPush
        ? { carId: car.id, action, timeDeltaChange: 2.5, energyDelta: -2, tireDelta: -2, focusDelta: 0, roundModifiers: [] }
        : { carId: car.id, action: 'steady', timeDeltaChange: hasSpeedCap ? 1 : 1.5, energyDelta: 1, tireDelta: -1, focusDelta: 0, roundModifiers: [] };
    }
    case 'defend':
      return { carId: car.id, action, timeDeltaChange: 1, energyDelta: 0, tireDelta: 0, focusDelta: 0, roundModifiers: [] };
    case 'recover':
      return { carId: car.id, action, timeDeltaChange: 0.5, energyDelta: 2, tireDelta: 1, focusDelta: 0, roundModifiers: [] };
    case 'steady':
    default:
      return { carId: car.id, action: 'steady', timeDeltaChange: hasSpeedCap ? 1 : 1.5, energyDelta: 1, tireDelta: -1, focusDelta: 0, roundModifiers: [] };
  }
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
        energy: clamp(car.energy + result.energyDelta, result.energyMin ?? 0, result.energyMax ?? 6),
        tire: result.roundModifiers?.includes('no-tire-wear') ? car.tire : clamp(car.tire + result.tireDelta, result.tireMin ?? 0, result.tireMax ?? 6),
        focus: clamp((car.focus ?? 0) + (result.focusDelta ?? 0), result.focusMin ?? 0, Math.min(car.focusCap ?? 8, result.focusMax ?? Number.POSITIVE_INFINITY)),
        roundModifiers: [...new Set([...(car.roundModifiers ?? []), ...(result.roundModifiers ?? [])])],
        lastAction: result.sourceCarId === car.id ? result.action : car.lastAction,
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
    ...(hasSteadfastDefense ? ['steadfast-defense'] : []),
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
  const upgradedTrack = {
    ...createDeltaDashTrack(state.track.realTrackKey ?? state.track.id),
    ...state.track,
    finishTimeDelta: state.track.finishTimeDelta ?? 15,
    collisionTimeThreshold: state.track.collisionTimeThreshold ?? 0.5,
    maxRounds: state.track.maxRounds ?? 12,
    rainMm: state.track.rainMm ?? 0,
    surfaceGrip: state.track.surfaceGrip ?? 1,
    tyreStress: state.track.tyreStress ?? 0.5,
  };

  return ensureCardState({ ...state, track: upgradedTrack });
}

function ensureCardState(state: DeltaDashMatchState): DeltaDashMatchState {
  const upgradedCars = state.cars.map((car) => ({
    ...car,
    timeDelta: Number.isFinite(car.timeDelta) ? car.timeDelta : Number.isFinite((car as DeltaDashCar & { progress?: number }).progress) ? (car as DeltaDashCar & { progress?: number }).progress ?? 0 : 0,
    energy: Number.isFinite(car.energy) ? car.energy : DELTADASH_RACE_INIT.startingEnergy,
    tire: Number.isFinite(car.tire) ? car.tire : DELTADASH_RACE_INIT.startingTire,
    focus: Number.isFinite(car.focus) ? car.focus : DELTADASH_RACE_INIT.startingFocus,
    focusCap: Number.isFinite(car.focusCap) ? car.focusCap : DELTADASH_RACE_INIT.focusCap,
    roundModifiers: car.roundModifiers ?? [],
  }));
  const cards = state.cards?.length ? state.cards : createInitialCardInstances(upgradedCars, state.seed);
  const starterCards = createInitialCardInstances(upgradedCars, state.seed);
  const existingCardKeys = new Set(cards.map((card) => `${card.ownerCarId}:${card.definitionId}`));
  const missingStarterCards = starterCards.filter((card) => !existingCardKeys.has(`${card.ownerCarId}:${card.definitionId}`));

  return { ...state, cars: upgradedCars, cards: [...cards, ...missingStarterCards] };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cloneState(state: DeltaDashMatchState): DeltaDashMatchState {
  return JSON.parse(JSON.stringify(state)) as DeltaDashMatchState;
}
