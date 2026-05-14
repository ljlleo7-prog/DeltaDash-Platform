import type { DeltaDashMatchState, DeltaDashStewardNote } from './types';

export function runStewardReview(state: DeltaDashMatchState): { notes: DeltaDashStewardNote[]; flag: 'green' | 'yellow' } {
  const notes: DeltaDashStewardNote[] = [];
  const activeCars = state.cars.filter((car) => !car.retired);
  const pushedCars = activeCars.filter((car) => car.lastAction === 'push');

  pushedCars.forEach((car) => {
    if (car.tire <= 0) {
      notes.push({
        id: `${state.round}-${car.id}-retirement`,
        round: state.round,
        carIds: [car.id],
        severity: 'retirement',
        message: `${car.name} retired after exhausting tire durability.`,
      });
    }
  });

  for (let index = 0; index < activeCars.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < activeCars.length; nextIndex += 1) {
      const left = activeCars[index];
      const right = activeCars[nextIndex];
      const close = Math.abs(left.progress - right.progress) <= state.track.collisionThreshold;
      const aggressive = left.lastAction === 'push' || right.lastAction === 'push';

      if (!close || !aggressive) continue;

      const severity = left.warnings > 0 || right.warnings > 0 ? 'penalty' : 'warning';
      notes.push({
        id: `${state.round}-${left.id}-${right.id}-incident`,
        round: state.round,
        carIds: [left.id, right.id],
        severity,
        message:
          severity === 'penalty'
            ? `${left.name} and ${right.name} triggered a repeated close-racing incident. Next round speed cap applied.`
            : `${left.name} and ${right.name} triggered a close-racing warning.`,
      });
    }
  }

  const flag = notes.some((note) => note.carIds.length > 1) ? 'yellow' : 'green';

  if (!notes.length) {
    notes.push({
      id: `${state.round}-clean`,
      round: state.round,
      carIds: [],
      severity: 'info',
      message: 'Steward reviewed the round: no action required.',
    });
  }

  return { notes, flag };
}
