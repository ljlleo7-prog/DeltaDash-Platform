import type { DeltaDashCar, DeltaDashMatchState, DeltaDashStewardNote } from './types';
import { DELTADASH_WHEEL_TO_WHEEL_SECONDS } from './types';

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
      const gap = Math.abs(left.timeDelta - right.timeDelta);
      const wheelToWheel = gap <= DELTADASH_WHEEL_TO_WHEEL_SECONDS;
      const close = gap <= state.track.collisionTimeThreshold + (state.track.weather.trackWetness * 0.18);
      const aggressive = left.lastAction === 'push' || right.lastAction === 'push';

      if (wheelToWheel) {
        notes.push({
          id: `${state.round}-${left.id}-${right.id}-wheel-to-wheel`,
          round: state.round,
          carIds: [left.id, right.id],
          severity: 'info',
          message: `${left.name} and ${right.name} are wheel-to-wheel; relationship lock stays until the gap opens beyond ${DELTADASH_WHEEL_TO_WHEEL_SECONDS.toFixed(1)}s.`,
        });
      }

      if (!close || !aggressive) continue;

      const severity = getIncidentSeverity(state, left, right, gap);
      notes.push({
        id: `${state.round}-${left.id}-${right.id}-incident`,
        round: state.round,
        carIds: [left.id, right.id],
        severity,
        message:
          severity === 'retirement'
            ? `${left.name} and ${right.name} suffered a heavy collision; damaged cars are retired.`
            : severity === 'penalty'
              ? `${left.name} and ${right.name} triggered repeated severe dangerous driving. 3s penalty applied.`
              : `${left.name} and ${right.name} triggered a close-racing warning.`,
      });
    }
  }

  const flag = notes.some((note) => note.carIds.length > 1 && note.severity !== 'info') ? 'yellow' : 'green';

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

function getIncidentSeverity(state: DeltaDashMatchState, left: DeltaDashCar, right: DeltaDashCar, gap: number): 'warning' | 'penalty' | 'retirement' {
  const bothPushing = left.lastAction === 'push' && right.lastAction === 'push';
  const wheelToWheel = gap <= DELTADASH_WHEEL_TO_WHEEL_SECONDS;
  const lowFocusOvertake = didLowFocusOvertake(left, right);
  const severeDangerousDriving = (bothPushing && wheelToWheel) || lowFocusOvertake;
  const highSpeed = state.track.weather.trackWetness < 0.2 && state.track.tyreStress >= 0.7;
  const priorWarnings = left.warnings + right.warnings;

  if (bothPushing && wheelToWheel && highSpeed && priorWarnings >= 3) return 'retirement';
  if (severeDangerousDriving && priorWarnings >= 2) return 'penalty';
  return 'warning';
}

function didLowFocusOvertake(left: DeltaDashCar, right: DeltaDashCar): boolean {
  const leftOvertookRight = left.timeDelta > right.timeDelta && left.lastAction === 'push' && left.focus < 3;
  const rightOvertookLeft = right.timeDelta > left.timeDelta && right.lastAction === 'push' && right.focus < 3;
  return leftOvertookRight || rightOvertookLeft;
}
