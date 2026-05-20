import { DELTADASH_CARD_IDS } from './card-ids';
import { playableCardCatalog } from './playable-card-catalog';
import type { DeltaDashActionType, DeltaDashCar, DeltaDashMatchState } from './types';

export function chooseBotAction(state: DeltaDashMatchState, car: DeltaDashCar): DeltaDashActionType {
  if (car.retired) return 'steady';
  if (car.tire <= 2 || car.energy <= 1) return 'recover';
  if (car.penalties.includes('speed-cap') || state.flag === 'yellow') return 'defend';

  const leaderTimeDelta = Math.max(...state.cars.filter((candidate) => !candidate.retired).map((candidate) => candidate.timeDelta));
  const timeDeltaToFinish = state.track.finishTimeDelta - car.timeDelta;

  if (timeDeltaToFinish <= 2.5 && car.energy >= 2 && car.tire >= 2) return 'push';
  if (leaderTimeDelta - car.timeDelta >= 2 && car.energy >= 2 && car.tire >= 3) return 'push';
  if (car.timeDelta >= leaderTimeDelta) return 'steady';

  return 'steady';
}

export function chooseBotCardIds(state: DeltaDashMatchState, car: DeltaDashCar, maxCards: number): string[] {
  const preferredIds = [
    car.tire <= 2 ? DELTADASH_CARD_IDS.protectTires : null,
    car.energy <= 1 ? DELTADASH_CARD_IDS.recycle : null,
    (car.focus ?? 0) < 2 ? DELTADASH_CARD_IDS.littleTunePower : null,
    playableCardCatalog.find((card) => card.category !== 'prototype' && card.actionBridge === chooseBotAction(state, car))?.id ?? null,
  ].filter((id): id is string => Boolean(id));

  const handDefinitionIds = new Set(state.cards
    .filter((card) => card.ownerCarId === car.id && card.zone === 'hand')
    .map((card) => card.definitionId));

  return preferredIds.filter((id, index, ids) => ids.indexOf(id) === index && handDefinitionIds.has(id)).slice(0, maxCards);
}
