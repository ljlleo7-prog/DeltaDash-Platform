import { getCardDefinitionById } from './playable-card-catalog';
import type { DeltaDashCardDefinition, DeltaDashCardInstance, DeltaDashCardZone } from './card-types';
import type { DeltaDashCar, DeltaDashMatchState } from './types';

export type DeltaDashPlayableCard = {
  instance: DeltaDashCardInstance | null;
  definition: DeltaDashCardDefinition;
  playable: boolean;
  disabledReason: string | null;
};

export type DeltaDashCardPileCounts = Record<DeltaDashCardZone, number>;

export function getCardsForCar(state: DeltaDashMatchState, carId: string): DeltaDashPlayableCard[] {
  return getHandCardInstances(state, carId).flatMap((instance) => {
    const definition = getCardDefinitionById(instance.definitionId);
    if (!definition) return [];
    return [{
      instance,
      definition,
      playable: definition.implementationStatus !== 'documented-only',
      disabledReason: getDisabledReason(instance, definition),
    }];
  });
}

export function getHandCardInstances(state: DeltaDashMatchState, carId: string): DeltaDashCardInstance[] {
  return getCardInstancesForCar(state, carId, 'hand');
}

export function getCardInstancesForCar(state: DeltaDashMatchState, carId: string, zone: DeltaDashCardZone): DeltaDashCardInstance[] {
  return (state.cards ?? [])
    .filter((card) => card.ownerCarId === carId && card.zone === zone)
    .sort((a, b) => a.instanceId.localeCompare(b.instanceId));
}

export function getCardPileCounts(state: DeltaDashMatchState, carId: string): DeltaDashCardPileCounts {
  return (['deck', 'hand', 'deployed', 'resolving', 'discard', 'removed'] as const).reduce<DeltaDashCardPileCounts>((counts, zone) => ({
    ...counts,
    [zone]: getCardInstancesForCar(state, carId, zone).length,
  }), {
    deck: 0,
    hand: 0,
    deployed: 0,
    resolving: 0,
    discard: 0,
    removed: 0,
  });
}

export function getCardInstanceDefinition(instance: DeltaDashCardInstance): DeltaDashCardDefinition | null {
  return getCardDefinitionById(instance.definitionId);
}

export function getActionBridgeCardId(action: DeltaDashCar['lastAction']): string | null {
  if (!action) return null;
  return null;
}

function getDisabledReason(instance: DeltaDashCardInstance | null, definition: DeltaDashCardDefinition): string | null {
  if (!instance) return 'not in hand';
  if (definition.implementationStatus === 'documented-only') return 'documented only';
  return null;
}
