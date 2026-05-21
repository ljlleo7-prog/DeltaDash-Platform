import { createInitialMatchEvent } from '../src/lib/deltadash/setup';
import { projectDeltaDashEvents } from '../src/lib/deltadash/reducer';
import { getBotDecisionTrace } from '../src/lib/deltadash/bot-policy';
import { chooseBotCardPlays } from '../src/lib/deltadash/bot-policy';
import { getCardDefinitionById } from '../src/lib/deltadash/playable-card-catalog';

const baseState = projectDeltaDashEvents([createInitialMatchEvent()]);
if (!baseState) throw new Error('failed to create base state');

const scenarios = [
  {
    name: 'baseline',
    mutate(state: typeof baseState) {
      return state;
    },
  },
  {
    name: 'low-energy leader pressure',
    mutate(state: typeof baseState) {
      const next = structuredClone(state);
      next.round = 4;
      next.flag = 'green';
      next.track.tyreStress = 0.8;
      next.track.weather.trackWetness = 0.45;
      next.cars[1].timeDelta = 3.5;
      next.cars[1].energy = 1;
      next.cars[1].tire = 2;
      next.cars[1].focus = 1;
      next.cars[1].tyreState.compound = 'soft';
      next.cars[1].pitState.status = 'entry';
      return next;
    },
  },
  {
    name: 'attack window',
    mutate(state: typeof baseState) {
      const next = structuredClone(state);
      next.round = 6;
      next.cars[1].timeDelta = 4;
      next.cars[1].energy = 4;
      next.cars[1].tire = 5;
      next.cars[1].focus = 4;
      next.cars[2].timeDelta = 2.8;
      next.cars[3].timeDelta = 2.9;
      return next;
    },
  },
] as const;

for (const scenario of scenarios) {
  console.log(`SCENARIO ${scenario.name}`);
  const state = scenario.mutate(baseState);
  for (const car of state.cars.filter((candidate) => !candidate.retired && candidate.playerId !== 'player-human')) {
    const trace = getBotDecisionTrace(state, car, 3);
    const plays = chooseBotCardPlays(state, car, 3);
    console.log(JSON.stringify({
      carId: car.id,
      name: car.name,
      state: trace.state,
      action: trace.action,
      candidates: trace.candidates,
      chosen: trace.chosen,
      plays,
    }, null, 2));
  }
}

const card = getCardDefinitionById('action.attack');
console.log(`CARD lookup: ${card?.id ?? 'missing'}`);
