import { getRuntimePlayableCards } from './playable-card-catalog';
import type { DeltaDashCardDefinition, DeltaDashCardInstance } from './card-types';
import type { DeltaDashCar } from './types';

export const DELTADASH_RACE_INIT = {
  seed: 2026,
  startingTimeDelta: 0,
  startingEnergy: 4,
  maxEnergy: 4,
  minGridEnergy: 2,
  startingGridGap: 0.5,
  startingTire: 100,
  startingFocus: 6,
  focusCap: 6,
  startingHandActions: 3,
  startingHandTactics: 1,
  roundDrawActions: 1,
  roundDrawTactics: 1,
} as const;

export function createInitialCardInstances(cars: DeltaDashCar[], seed: number = DELTADASH_RACE_INIT.seed): DeltaDashCardInstance[] {
  return cars.flatMap((car) => {
    const actionDeck = createCategoryDeck(car, seed, 'action');
    const tacticDeck = createCategoryDeck(car, seed, 'tactic');
    const openingActions = actionDeck.slice(0, DELTADASH_RACE_INIT.startingHandActions).map((card) => ({ ...card, zone: 'hand' as const }));
    const openingTactics = tacticDeck.slice(0, DELTADASH_RACE_INIT.startingHandTactics).map((card) => ({ ...card, zone: 'hand' as const }));
    const remainingActions = actionDeck.slice(DELTADASH_RACE_INIT.startingHandActions);
    const remainingTactics = tacticDeck.slice(DELTADASH_RACE_INIT.startingHandTactics);
    return [...openingActions, ...openingTactics, ...remainingActions, ...remainingTactics].map((card) => ({
      ...card,
      revealed: car.playerId !== 'player-human',
    }));
  });
}

export function getDrawableCardInstanceIds(
  cards: DeltaDashCardInstance[],
  carId: string,
  category: 'action' | 'tactic',
  amount: number,
  round: number
): { cardInstanceIds: string[]; reshuffleInstanceIds: string[] } {
  const definitions = getRuntimePlayableCards().filter((def) => def.category === category);
  const definitionIds = new Set(definitions.map((def) => def.id));

  const deckCards = cards
    .filter((card) => card.ownerCarId === carId && card.zone === 'deck' && definitionIds.has(card.definitionId));

  if (deckCards.length >= amount) {
    return { cardInstanceIds: deckCards.slice(0, amount).map((c) => c.instanceId), reshuffleInstanceIds: [] };
  }

  const discardCards = cards
    .filter((card) => card.ownerCarId === carId && card.zone === 'discard' && definitionIds.has(card.definitionId))
    .sort((a, b) => a.instanceId.localeCompare(b.instanceId));

  if (!discardCards.length) {
    return { cardInstanceIds: deckCards.map((c) => c.instanceId), reshuffleInstanceIds: [] };
  }

  const shuffled = shuffleDeterministically(discardCards, `${carId}:${category}:reshuffle:${round}`);
  const combined = [...deckCards, ...shuffled];
  return {
    cardInstanceIds: combined.slice(0, amount).map((c) => c.instanceId),
    reshuffleInstanceIds: shuffled.map((c) => c.instanceId),
  };
}


function createCategoryDeck(car: DeltaDashCar, seed: number, category: 'action' | 'tactic'): DeltaDashCardInstance[] {
  const definitions = getRuntimePlayableCards().filter((def) => def.category === category);
  const deck = definitions.flatMap((definition) => expandCardDefinition(car, definition));
  return shuffleDeterministically(deck, `${seed}:${car.id}:${category}`);
}

function expandCardDefinition(car: DeltaDashCar, definition: DeltaDashCardDefinition): DeltaDashCardInstance[] {
  const count = parseCardCount(definition.count);
  return Array.from({ length: count }, (_, index) => ({
    instanceId: `${car.id}-${definition.slug}-${index + 1}`,
    definitionId: definition.id,
    ownerCarId: car.id,
    zone: 'deck' as const,
    revealed: false,
  }));
}

function parseCardCount(count: string): number {
  const match = count.match(/\d+/);
  if (match) {
    const parsed = Number.parseInt(match[0], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }
  return 1;
}

function shuffleDeterministically<T extends { instanceId: string }>(items: T[], seed: string): T[] {
  const shuffled = [...items];
  let state = hashString(`${seed}:${items.map((item) => item.instanceId).join('|')}`) || 1;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = nextRandomState(state);
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function nextRandomState(state: number): number {
  let next = state >>> 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  return next >>> 0;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

