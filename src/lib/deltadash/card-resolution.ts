import type { DeltaDashCardDefinition, DeltaDashEffectPrimitive } from './card-types';
import type { DeltaDashCar, DeltaDashMatchState, DeltaDashResolvedAction } from './types';

export function canPlayCard(state: DeltaDashMatchState, car: DeltaDashCar, card: DeltaDashCardDefinition): boolean {
  if (card.implementationStatus !== 'implemented') return false;

  return card.conditions.every((condition) => {
    switch (condition.type) {
      case 'not_retired':
        return !car.retired;
      case 'min_energy':
        return car.energy >= condition.value;
      case 'min_tire':
        return car.tire >= condition.value;
      case 'flag_is':
        return state.flag === condition.value;
      case 'flag_not':
        return state.flag !== condition.value;
      case 'documented-only':
        return false;
      default: {
        const exhaustive: never = condition;
        return exhaustive;
      }
    }
  });
}

export function resolveCardEffects(state: DeltaDashMatchState, car: DeltaDashCar, card: DeltaDashCardDefinition): DeltaDashResolvedAction {
  const effectiveEffects = canPlayCard(state, car, card) ? card.effects : [];
  const yellowFlag = state.flag === 'yellow' || car.penalties.includes('speed-cap');

  return effectiveEffects.reduce<DeltaDashResolvedAction>((result, effect) => applyEffect(result, effect, yellowFlag), {
    carId: car.id,
    action: card.actionBridge ?? 'steady',
    cardDefinitionId: card.id,
    progressDelta: 0,
    energyDelta: 0,
    tireDelta: 0,
  });
}

function applyEffect(result: DeltaDashResolvedAction, effect: DeltaDashEffectPrimitive, yellowFlag: boolean): DeltaDashResolvedAction {
  switch (effect.type) {
    case 'modify_progress':
      return { ...result, progressDelta: result.progressDelta + (yellowFlag && effect.yellowAmount !== undefined ? effect.yellowAmount : effect.amount) };
    case 'modify_energy':
      return { ...result, energyDelta: result.energyDelta + effect.amount };
    case 'modify_tire':
      return { ...result, tireDelta: result.tireDelta + effect.amount };
    case 'apply_penalty':
    case 'clear_penalty':
    case 'draw_cards':
    case 'set_round_modifier':
    case 'no_effect':
      return result;
    default: {
      const exhaustive: never = effect;
      return exhaustive;
    }
  }
}
