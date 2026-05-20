import { getPrototypeDriver, type DeltaDashDriverDefinition } from './driver-catalog';
import type { DeltaDashActionCommitment, DeltaDashCar, DeltaDashMatchState, DeltaDashRankedCar } from './types';

export type DeltaDashTimelineCar = DeltaDashRankedCar & {
  timeOffset: number;
  gapToLeader: number;
  timelinePercent: number;
};

export function getRankedCars(state: DeltaDashMatchState): DeltaDashRankedCar[] {
  return [...state.cars]
    .sort((left, right) => {
      if (left.retired !== right.retired) return left.retired ? 1 : -1;
      if (right.timeDelta !== left.timeDelta) return right.timeDelta - left.timeDelta;
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

export function getDriverForCar(car: DeltaDashCar): DeltaDashDriverDefinition | null {
  return getPrototypeDriver(car.driverId);
}

export function getCarPresentation(car: DeltaDashCar): { name: string; imageUrl: string | null; driver: DeltaDashDriverDefinition | null } {
  const driver = getDriverForCar(car);
  return {
    name: driver?.carName ?? car.name,
    imageUrl: driver?.imageUrl ?? null,
    driver,
  };
}

export function getCommitment(state: DeltaDashMatchState, carId: string): DeltaDashActionCommitment | null {
  return state.commitments.find((commitment) => commitment.carId === carId) ?? null;
}

export function getMissingCommitmentCarIds(state: DeltaDashMatchState): string[] {
  const committed = new Set(state.commitments.map((commitment) => commitment.carId));
  return state.cars.filter((car) => !car.retired && !committed.has(car.id)).map((car) => car.id);
}

export function getCarTimeOffset(car: DeltaDashCar): number {
  return Number.isFinite(car.timeDelta) ? car.timeDelta : Number.isFinite((car as DeltaDashCar & { progress?: number }).progress) ? (car as DeltaDashCar & { progress?: number }).progress ?? 0 : 0;
}

export function getTimeGapBetweenCars(left: DeltaDashCar, right: DeltaDashCar): number {
  return Math.abs(getCarTimeOffset(left) - getCarTimeOffset(right));
}

export function getLeaderTimeGap(state: DeltaDashMatchState, car: DeltaDashCar): number {
  const leader = getLeader(state);
  return leader ? Math.max(0, getCarTimeOffset(leader) - getCarTimeOffset(car)) : 0;
}

export function formatTimeGap(seconds: number): string {
  if (seconds <= 0) return 'LEAD';
  return `+${seconds.toFixed(1)}s`;
}

export function getTimelineCars(state: DeltaDashMatchState): DeltaDashTimelineCar[] {
  const rankedCars = getRankedCars(state);
  const leaderOffset = rankedCars[0] ? getCarTimeOffset(rankedCars[0]) : 0;
  const finishOffset = Math.max(1, state.track.finishTimeDelta ?? 15);

  return rankedCars.map((car) => ({
    ...car,
    timeOffset: getCarTimeOffset(car),
    gapToLeader: Math.max(0, leaderOffset - getCarTimeOffset(car)),
    timelinePercent: Math.min(100, (getCarTimeOffset(car) / finishOffset) * 100),
  }));
}

export type DeltaDashTrackStats = {
  finishSeconds: number;
  roundLabel: string;
  rainMm: number;
  surfaceGripPercent: number;
  tyreStressPercent: number;
  tyreCurveLabel: 'gentle' | 'balanced' | 'aggressive';
};

export function getTrackStats(state: DeltaDashMatchState): DeltaDashTrackStats {
  const tyreStress = state.track.tyreStress ?? 0.5;

  return {
    finishSeconds: state.track.finishTimeDelta ?? 15,
    roundLabel: `${state.round}/${state.track.maxRounds ?? 12}`,
    rainMm: state.track.rainMm ?? 0,
    surfaceGripPercent: Math.round((state.track.surfaceGrip ?? 1) * 100),
    tyreStressPercent: Math.round(tyreStress * 100),
    tyreCurveLabel: tyreStress >= 0.72 ? 'aggressive' : tyreStress >= 0.45 ? 'balanced' : 'gentle',
  };
}

export function isMatchFinished(state: DeltaDashMatchState): boolean {
  return state.phase === 'finished' || state.cars.some((car) => !car.retired && car.timeDelta >= (state.track.finishTimeDelta ?? 15)) || state.round >= (state.track.maxRounds ?? 12);
}

export function getFinishSummary(state: DeltaDashMatchState): string {
  const leader = getLeader(state);
  if (!leader) return 'No cars classified.';
  if (leader.timeDelta >= (state.track.finishTimeDelta ?? 15)) return `${leader.name} reached the finish window.`;
  if (state.round >= (state.track.maxRounds ?? 12)) return `Round limit reached with ${leader.name} leading.`;
  return 'Race still active.';
}
