import { getCardDefinitionById } from './playable-card-catalog';
import type { DeltaDashCardDefinition } from './card-types';
import type { DeltaDashCar, DeltaDashMatchState } from './types';

export type DeltaDashResolvedTargets = {
  targetCarIds: string[];
  validTargets: DeltaDashCar[];
};

export function getValidTargetCars(state: DeltaDashMatchState, sourceCar: DeltaDashCar, card: DeltaDashCardDefinition): DeltaDashCar[] {
  if (card.id === 'tactic.cant-hear') {
    const tacticCommitments = new Set(state.commitments.filter((commitment) => {
      const committedCard = commitment.cardDefinitionId ? getCardDefinitionById(commitment.cardDefinitionId) : null;
      return committedCard?.category === 'tactic';
    }).map((commitment) => commitment.carId));
    return state.cars.filter((car) => car.id !== sourceCar.id && !car.retired && tacticCommitments.has(car.id));
  }

  if (card.id === 'action.attack') {
    const targetAhead = state.cars
      .filter((car) => car.id !== sourceCar.id && !car.retired && isTargetInRange(sourceCar, car, card))
      .sort((left, right) => left.timeDelta - right.timeDelta)[0];
    return targetAhead ? [targetAhead] : [];
  }

  switch (card.targeting.kind) {
    case 'self':
      return isTargetInRange(sourceCar, sourceCar, card) ? [sourceCar] : [];
    case 'opponent':
    case 'all-opponents':
      return state.cars.filter((car) => car.id !== sourceCar.id && !car.retired && isTargetInRange(sourceCar, car, card));
    case 'none':
      return [];
    default: {
      const exhaustive: never = card.targeting.kind;
      return exhaustive;
    }
  }
}

export function normalizeTargetCarIds(state: DeltaDashMatchState, sourceCar: DeltaDashCar, card: DeltaDashCardDefinition, requestedTargetCarIds: string[] = []): string[] | null {
  if (card.targeting.kind === 'none') return requestedTargetCarIds.length ? null : [];
  if (card.targeting.kind === 'self') return requestedTargetCarIds.length === 0 || requestedTargetCarIds[0] === sourceCar.id ? [sourceCar.id] : null;

  const validTargets = getValidTargetCars(state, sourceCar, card);
  const validTargetIds = new Set(validTargets.map((target) => target.id));

  if (card.targeting.kind === 'opponent') {
    const requestedTargetCarId = requestedTargetCarIds[0];
    if (!requestedTargetCarId || requestedTargetCarIds.length !== 1 || !validTargetIds.has(requestedTargetCarId)) return null;
    return [requestedTargetCarId];
  }

  if (requestedTargetCarIds.length) {
    return requestedTargetCarIds.every((targetCarId) => validTargetIds.has(targetCarId)) ? requestedTargetCarIds : null;
  }

  return validTargets.map((target) => target.id);
}

export function getDefaultTargetCarIds(state: DeltaDashMatchState, sourceCar: DeltaDashCar, card: DeltaDashCardDefinition): string[] {
  const targets = getValidTargetCars(state, sourceCar, card);

  if (card.targeting.kind === 'all-opponents') return targets.map((target) => target.id);
  if (card.targeting.kind === 'self') return [sourceCar.id];
  if (card.targeting.kind !== 'opponent') return [];

  const nearest = [...targets].sort((left, right) => getTimeGap(sourceCar, left) - getTimeGap(sourceCar, right))[0];
  return nearest ? [nearest.id] : [];
}

export function getTimeGap(sourceCar: DeltaDashCar, targetCar: DeltaDashCar) {
  return Math.abs(sourceCar.timeDelta - targetCar.timeDelta);
}

function isTargetInRange(sourceCar: DeltaDashCar, targetCar: DeltaDashCar, card: DeltaDashCardDefinition): boolean {
  const range = card.targeting.range;
  if (!range) return true;

  const timeGap = getTimeGap(sourceCar, targetCar);
  if (range.inFrontOnly && targetCar.timeDelta <= sourceCar.timeDelta) return false;
  if (range.minTimeGap !== undefined && timeGap < range.minTimeGap) return false;
  if (range.maxTimeGap !== undefined && timeGap > range.maxTimeGap) return false;
  return true;
}
