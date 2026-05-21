import { createInitialMatchEvent } from '../src/lib/deltadash/setup';
import { projectDeltaDashEvents } from '../src/lib/deltadash/reducer';
import { REAL_TRACK_OPTIONS } from '../src/lib/deltadash/track-catalog';

for (const track of REAL_TRACK_OPTIONS.slice(0, 6)) {
  const state = projectDeltaDashEvents([createInitialMatchEvent(track.key)]);
  if (!state) throw new Error(`failed to create state for ${track.key}`);
  console.log(JSON.stringify({
    track: track.key,
    name: state.track.name,
    finishTimeDelta: state.track.finishTimeDelta,
    cars: state.cars.map((car) => ({ id: car.id, timeDelta: car.timeDelta, energy: car.energy, qualifying: car.driverStats.qualifyingModifier })),
  }, null, 2));
}
