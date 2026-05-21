import { createInitialMatchEvent } from '../src/lib/deltadash/setup';
import { advanceLocalMatch } from '../src/lib/deltadash/match-flow';

const events = [createInitialMatchEvent(undefined, 4)];
const nextEvents = advanceLocalMatch(events, []);
const resolved = nextEvents.find((event) => event.type === 'ACTIONS_RESOLVED');

console.log(JSON.stringify(resolved, null, 2));
