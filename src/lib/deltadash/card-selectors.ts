import { getCardDefinitionById, playableCardCatalog } from './playable-card-catalog';
import type { DeltaDashCardDefinition, DeltaDashCardInstance } from './card-types';
import type { DeltaDashCar, DeltaDashMatchState } from './types';

export type DeltaDashPlayableCard = {
  instance: DeltaDashCardInstance | null;
  definition: DeltaDashCardDefinition;
  playable: boolean;
  disabledReason: string | null;
};

export function getCardsForCar(state: DeltaDashMatchState, carId: string): DeltaDashPlayableCard[] {
  const handInstances = state.cards.filter((card) => card.ownerCarId === carId && card.zone === 'hand');
  const instanceByDefinition = new Map(handInstances.map((card) => [card.definitionId, card]));

  return playableCardCatalog.map((definition) => {
    const instance = instanceByDefinition.get(definition.id) ?? null;
    return {
      instance,
      definition,
      playable: Boolean(instance) && definition.implementationStatus === 'implemented',
      disabledReason: getDisabledReason(instance, definition),
    };
  });
}

export function getCardInstanceDefinition(instance: DeltaDashCardInstance): DeltaDashCardDefinition | null {
  return getCardDefinitionById(instance.definitionId);
}

export function getActionBridgeCardId(action: DeltaDashCar['lastAction']): string | null {
  if (!action) return null;
  return playableCardCatalog.find((card) => card.actionBridge === action)?.id ?? null;
}

function getDisabledReason(instance: DeltaDashCardInstance | null, definition: DeltaDashCardDefinition): string | null {
  if (!instance) return 'not in hand';
  if (definition.implementationStatus === 'documented-only') return 'documented only';
  if (definition.implementationStatus === 'provisional') return 'provisional';
  return null;
}
