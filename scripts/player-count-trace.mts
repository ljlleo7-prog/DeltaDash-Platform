import { createInitialMatchEvent, DELTADASH_PLAYER_COUNT_OPTIONS } from '../src/lib/deltadash/setup';
import { projectDeltaDashEvents } from '../src/lib/deltadash/reducer';

for (const count of [2, 4, DELTADASH_PLAYER_COUNT_OPTIONS.at(-1) ?? 4]) {
  const state = projectDeltaDashEvents([createInitialMatchEvent(undefined, count)]);
  if (!state) throw new Error(`failed to create ${count}-player state`);
  console.log(JSON.stringify({
    requestedCount: count,
    playerCount: state.players.length,
    carCount: state.cars.length,
    playerKinds: state.players.map((player) => player.kind),
    cars: state.cars.map((car) => ({
      id: car.id,
      driverId: car.driverId,
      name: car.name,
      timeDelta: car.timeDelta,
      energy: car.energy,
      tire: car.tire,
      focus: car.focus,
      qualifying: car.driverStats.qualifyingModifier,
      race: car.driverStats.raceModifier,
    })),
  }, null, 2));
}
