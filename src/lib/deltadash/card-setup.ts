import { getImplementedCards } from './playable-card-catalog';
import type { DeltaDashCardInstance } from './card-types';
import type { DeltaDashCar } from './types';

export function createPrototypeCardInstances(cars: DeltaDashCar[]): DeltaDashCardInstance[] {
  const implementedCards = getImplementedCards();

  return cars.flatMap((car) => implementedCards.map((card, index) => ({
    instanceId: `${car.id}-${card.slug}-${index}`,
    definitionId: card.id,
    ownerCarId: car.id,
    zone: 'hand' as const,
    revealed: car.playerId !== 'player-human',
  })));
}
