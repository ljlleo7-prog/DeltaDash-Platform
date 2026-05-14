import type { DeltaDashActionCommitment, DeltaDashMatchState, DeltaDashRankedCar } from './types';

export function getRankedCars(state: DeltaDashMatchState): DeltaDashRankedCar[] {
  return [...state.cars]
    .sort((left, right) => {
      if (left.retired !== right.retired) return left.retired ? 1 : -1;
      if (right.progress !== left.progress) return right.progress - left.progress;
      if (right.tire !== left.tire) return right.tire - left.tire;
      return left.id.localeCompare(right.id);
    })
    .map((car, index) => ({ ...car, rank: index + 1 }));
}

export function getLeader(state: DeltaDashMatchState): DeltaDashRankedCar | null {
  return getRankedCars(state)[0] ?? null;
}

export function getHumanCar(state: DeltaDashMatchState) {
  const humanPlayer = state.players.find((player) => player.kind === 'human');
  return humanPlayer ? state.cars.find((car) => car.id === humanPlayer.carId) ?? null : null;
}

export function getCommitment(state: DeltaDashMatchState, carId: string): DeltaDashActionCommitment | null {
  return state.commitments.find((commitment) => commitment.carId === carId) ?? null;
}

export function getMissingCommitmentCarIds(state: DeltaDashMatchState): string[] {
  const committed = new Set(state.commitments.map((commitment) => commitment.carId));
  return state.cars.filter((car) => !car.retired && !committed.has(car.id)).map((car) => car.id);
}

export function isMatchFinished(state: DeltaDashMatchState): boolean {
  return state.phase === 'finished' || state.cars.some((car) => !car.retired && car.progress >= state.track.finishProgress) || state.round >= state.track.maxRounds;
}

export function getFinishSummary(state: DeltaDashMatchState): string {
  const leader = getLeader(state);
  if (!leader) return 'No cars classified.';
  if (leader.progress >= state.track.finishProgress) return `${leader.name} reached the finish target.`;
  if (state.round >= state.track.maxRounds) return `Round limit reached with ${leader.name} leading.`;
  return 'Race still active.';
}
