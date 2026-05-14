import { playableCardCatalog } from './playable-card-catalog';
import type { DeltaDashActionType, DeltaDashCar, DeltaDashMatchState } from './types';

export function chooseBotAction(state: DeltaDashMatchState, car: DeltaDashCar): DeltaDashActionType {
  if (car.retired) return 'steady';
  if (car.tire <= 2 || car.energy <= 1) return 'recover';
  if (car.penalties.includes('speed-cap') || state.flag === 'yellow') return 'defend';

  const leaderProgress = Math.max(...state.cars.filter((candidate) => !candidate.retired).map((candidate) => candidate.progress));
  const distanceToFinish = state.track.finishProgress - car.progress;

  if (distanceToFinish <= 5 && car.energy >= 2 && car.tire >= 2) return 'push';
  if (leaderProgress - car.progress >= 4 && car.energy >= 2 && car.tire >= 3) return 'push';
  if (car.progress >= leaderProgress) return 'steady';

  return 'steady';
}

export function chooseBotCardId(state: DeltaDashMatchState, car: DeltaDashCar): string {
  const action = chooseBotAction(state, car);
  return playableCardCatalog.find((card) => card.actionBridge === action)?.id ?? 'prototype.steady';
}
