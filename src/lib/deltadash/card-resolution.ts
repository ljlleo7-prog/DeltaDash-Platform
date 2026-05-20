import type { DeltaDashCardDefinition, DeltaDashEffectPrimitive } from './card-types';
import type { DeltaDashCar, DeltaDashMatchState, DeltaDashResolvedAction } from './types';

export function canPlayCard(state: DeltaDashMatchState, car: DeltaDashCar, card: DeltaDashCardDefinition): boolean {
  if (card.implementationStatus === 'documented-only') return false;

  return card.conditions.every((condition) => {
    switch (condition.type) {
      case 'not_retired':
        return !car.retired;
      case 'min_energy':
        return car.energy >= condition.value;
      case 'min_tire':
        return car.tire >= condition.value;
      case 'has_hand_cards':
        return state.cards.some((cardInstance) => cardInstance.ownerCarId === car.id && cardInstance.zone === 'hand');
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

export function resolveCardEffects(state: DeltaDashMatchState, car: DeltaDashCar, card: DeltaDashCardDefinition, targetCar?: DeltaDashCar): DeltaDashResolvedAction {
  const effectiveEffects = canPlayCard(state, car, card) ? card.effects : [];
  const target = targetCar ?? car;
  const yellowFlag = state.flag === 'yellow' || target.penalties.includes('speed-cap');

  return effectiveEffects.reduce<DeltaDashResolvedAction>((result, effect) => applyEffect(result, effect, yellowFlag), {
    carId: target.id,
    sourceCarId: car.id,
    action: card.actionBridge ?? 'steady',
    cardDefinitionId: card.id,
    targetCarId: target.id,
    timeDeltaChange: 0,
    energyDelta: 0,
    tireDelta: 0,
    focusDelta: 0,
    energyMin: undefined,
    energyMax: undefined,
    tireMin: undefined,
    tireMax: undefined,
    focusMin: undefined,
    focusMax: undefined,
    roundModifiers: [],
  });
}

function applyEffect(result: DeltaDashResolvedAction, effect: DeltaDashEffectPrimitive, yellowFlag: boolean): DeltaDashResolvedAction {
  switch (effect.type) {
    case 'modify_time_delta':
      return { ...result, timeDeltaChange: result.timeDeltaChange + (yellowFlag && effect.yellowAmount !== undefined ? effect.yellowAmount : effect.amount) };
    case 'modify_energy':
      return { ...result, energyDelta: result.energyDelta + effect.amount, energyMin: effect.min ?? result.energyMin, energyMax: effect.max ?? result.energyMax };
    case 'modify_tire':
      return { ...result, tireDelta: result.tireDelta + effect.amount, tireMin: effect.min ?? result.tireMin, tireMax: effect.max ?? result.tireMax };
    case 'modify_focus':
      return { ...result, focusDelta: (result.focusDelta ?? 0) + effect.amount, focusMin: effect.min ?? result.focusMin, focusMax: effect.max ?? result.focusMax };
    case 'set_round_modifier':
      return { ...result, roundModifiers: [...(result.roundModifiers ?? []), effect.modifier] };
    case 'apply_penalty':
    case 'clear_penalty':
    case 'draw_cards':
    case 'no_effect':
      return result;
    default: {
      const exhaustive: never = effect;
      return exhaustive;
    }
  }
}
