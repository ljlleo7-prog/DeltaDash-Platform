import { createInitialMatchEvent } from '../src/lib/deltadash/setup';
import { projectDeltaDashEvents } from '../src/lib/deltadash/reducer';
import { runStewardReview } from '../src/lib/deltadash/steward-policy';

const baseState = projectDeltaDashEvents([createInitialMatchEvent()]);
if (!baseState) throw new Error('failed to create base state');

const scenarios = [
  {
    name: 'wheel-to-wheel without incident',
    mutate() {
      const state = structuredClone(baseState);
      state.round = 3;
      state.cars[1].timeDelta = 4;
      state.cars[2].timeDelta = 4.2;
      state.cars[1].lastAction = 'steady';
      state.cars[2].lastAction = 'defend';
      return state;
    },
  },
  {
    name: 'close push warning',
    mutate() {
      const state = structuredClone(baseState);
      state.round = 5;
      state.cars[1].timeDelta = 5;
      state.cars[2].timeDelta = 5.3;
      state.cars[1].lastAction = 'push';
      state.cars[2].lastAction = 'steady';
      return state;
    },
  },
  {
    name: 'heavy repeated crash',
    mutate() {
      const state = structuredClone(baseState);
      state.round = 8;
      state.track.tyreStress = 0.85;
      state.track.weather.trackWetness = 0;
      state.cars[1].timeDelta = 7;
      state.cars[2].timeDelta = 7.05;
      state.cars[1].lastAction = 'push';
      state.cars[2].lastAction = 'push';
      state.cars[1].warnings = 1;
      state.cars[2].warnings = 1;
      return state;
    },
  },
] as const;

for (const scenario of scenarios) {
  const state = scenario.mutate();
  const review = runStewardReview(state);
  console.log(`SCENARIO ${scenario.name}`);
  console.log(JSON.stringify(review, null, 2));
}
