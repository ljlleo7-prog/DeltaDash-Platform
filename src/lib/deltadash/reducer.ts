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
      return cloneState(event.match);
    case 'ROUND_STARTED':
      return state ? { ...state, round: event.round, phase: 'planning', commitments: [] } : state;
    case 'ACTION_COMMITTED':
      return state ? commitAction(state, event.carId, event.action) : state;
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
    return { carId: car.id, action, progressDelta: 0, energyDelta: 0, tireDelta: 0 };
  }

  switch (action) {
    case 'push': {
      const canPush = car.energy >= 2 && !hasSpeedCap;
      return canPush
        ? { carId: car.id, action, progressDelta: 5, energyDelta: -2, tireDelta: -2 }
        : { carId: car.id, action: 'steady', progressDelta: hasSpeedCap ? 2 : 3, energyDelta: 1, tireDelta: -1 };
    }
    case 'defend':
      return { carId: car.id, action, progressDelta: 2, energyDelta: 0, tireDelta: 0 };
    case 'recover':
      return { carId: car.id, action, progressDelta: 1, energyDelta: 2, tireDelta: 1 };
    case 'steady':
    default:
      return { carId: car.id, action: 'steady', progressDelta: hasSpeedCap ? 2 : 3, energyDelta: 1, tireDelta: -1 };
  }
}

function commitAction(state: DeltaDashMatchState, carId: string, action: DeltaDashActionType): DeltaDashMatchState {
  const commitments = state.commitments.filter((commitment) => commitment.carId !== carId);
  return { ...state, commitments: [...commitments, { carId, action }] };
}

function resolveActions(state: DeltaDashMatchState, results: DeltaDashResolvedAction[]): DeltaDashMatchState {
  return {
    ...state,
    phase: 'resolving',
    cars: state.cars.map((car) => {
      const result = results.find((candidate) => candidate.carId === car.id);
      if (!result) return car;

      return {
        ...car,
        progress: Math.max(0, car.progress + result.progressDelta),
        energy: Math.min(6, Math.max(0, car.energy + result.energyDelta)),
        tire: Math.min(6, Math.max(0, car.tire + result.tireDelta)),
        lastAction: result.action,
        penalties: car.penalties.filter((penalty) => penalty !== 'speed-cap'),
      };
    }),
  };
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

function cloneState(state: DeltaDashMatchState): DeltaDashMatchState {
  return JSON.parse(JSON.stringify(state)) as DeltaDashMatchState;
}
