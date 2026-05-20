import { chooseBotCardIds } from './bot-policy';
import { DELTADASH_RACE_INIT, getDrawableCardInstanceIds } from './card-setup';
import { resolveCardEffects } from './card-resolution';
import { getCardDefinitionById } from './playable-card-catalog';
import { projectDeltaDashEvents, resolveAction } from './reducer';
import { getHumanCar, getMissingCommitmentCarIds, isMatchFinished } from './selectors';
import { runStewardReview } from './steward-policy';
import { getDefaultTargetCarIds, normalizeTargetCarIds } from './targeting';
import type { DeltaDashActionCommitment, DeltaDashCar, DeltaDashEvent, DeltaDashMatchState, DeltaDashResolvedAction } from './types';

export type DeltaDashCardPlayInput = {
  cardDefinitionId: string;
  cardInstanceId?: string;
  targetCarIds?: string[];
};

export function removeDeployedCard(events: DeltaDashEvent[], cardInstanceId: string): DeltaDashEvent[] {
  const state = projectDeltaDashEvents(events);
  const card = state?.cards.find((candidate) => candidate.instanceId === cardInstanceId && candidate.zone === 'deployed');
  if (!state || !card) return [];

  return [{
    type: 'CARD_MOVED',
    round: state.round,
    cardInstanceId,
    zone: 'discard',
    revealed: true,
    clearRoundModifiers: card.definitionId === 'tactic.steadfast-lion' ? ['steadfast-defense'] : [],
  }];
}

const MAX_CARD_PLAYS_PER_ROUND = 3;

export function advanceLocalMatch(events: DeltaDashEvent[], humanCardPlays: DeltaDashCardPlayInput[]): DeltaDashEvent[] {
  const state = projectDeltaDashEvents(events);
  if (!state || state.phase === 'finished') return [];

  const humanCar = getHumanCar(state);
  if (!humanCar || humanCar.retired) return [];

  const humanEvents = createCardPlayEvents(state, humanCar.id, humanCardPlays.slice(0, MAX_CARD_PLAYS_PER_ROUND));
  if (!humanEvents) return [];

  const stateAfterHuman = projectDeltaDashEvents([...events, ...humanEvents]);
  if (!stateAfterHuman) return [];

  const botEvents: DeltaDashEvent[] = stateAfterHuman.players
    .filter((player) => player.kind === 'bot')
    .flatMap((player) => {
      const car = stateAfterHuman.cars.find((candidate) => candidate.id === player.carId);
      if (!car || car.retired) return [];

      const botPlays = chooseBotCardIds(stateAfterHuman, car, MAX_CARD_PLAYS_PER_ROUND).flatMap((cardDefinitionId) => {
        const card = getCardDefinitionById(cardDefinitionId);
        return card ? [{ cardDefinitionId, targetCarIds: getDefaultTargetCarIds(stateAfterHuman, car, card) }] : [];
      });

      return createCardPlayEvents(stateAfterHuman, car.id, botPlays) ?? [];
    });

  const committedEvents = [...humanEvents, ...botEvents];
  const committedState = projectDeltaDashEvents([...events, ...committedEvents]);
  if (!committedState || getMissingCommitmentCarIds(committedState).length) return committedEvents;

  const cardMechanicEvents = createCardMechanicEvents(committedState);
  const results = applyResultGuards(committedState, committedState.commitments.flatMap((commitment) => resolveCommitment(committedState, commitment)));

  const lockedEvent: DeltaDashEvent = { type: 'COMMITMENTS_LOCKED', round: committedState.round };
  const resolvedEvent: DeltaDashEvent = { type: 'ACTIONS_RESOLVED', round: committedState.round, results };
  const cardResolutionEvents: DeltaDashEvent[] = committedState.commitments.flatMap((commitment) => commitment.cardDefinitionId ? [{
    type: 'CARD_RESOLVED' as const,
    round: committedState.round,
    carId: commitment.carId,
    cardDefinitionId: commitment.cardDefinitionId,
  }] : []);
  const discardEvents: DeltaDashEvent[] = committedState.commitments.flatMap((commitment) => {
    if (!commitment.cardInstanceId) return [];
    const card = commitment.cardDefinitionId ? getCardDefinitionById(commitment.cardDefinitionId) : null;
    const keepDeployed = card?.id === 'tactic.steadfast-lion';
    return [{
      type: 'CARD_MOVED' as const,
      round: committedState.round,
      cardInstanceId: commitment.cardInstanceId,
      zone: keepDeployed ? 'deployed' as const : 'discard' as const,
      revealed: true,
    }];
  });
  const resolvedState = projectDeltaDashEvents([...events, ...committedEvents, lockedEvent, resolvedEvent, ...cardMechanicEvents, ...cardResolutionEvents, ...discardEvents]);
  if (!resolvedState) return committedEvents;

  const review = runStewardReview(resolvedState);
  const reviewedEvent: DeltaDashEvent = {
    type: 'STEWARD_REVIEWED',
    round: resolvedState.round,
    notes: review.notes,
    flag: review.flag,
  };
  const reviewedState = projectDeltaDashEvents([...events, ...committedEvents, lockedEvent, resolvedEvent, ...cardMechanicEvents, ...cardResolutionEvents, ...discardEvents, reviewedEvent]);
  if (!reviewedState) return committedEvents;

  const roundEndEvent: DeltaDashEvent = { type: 'ROUND_ENDED', round: reviewedState.round };
  const nextState = projectDeltaDashEvents([...events, ...committedEvents, lockedEvent, resolvedEvent, ...cardMechanicEvents, ...cardResolutionEvents, ...discardEvents, reviewedEvent, roundEndEvent]);
  if (!nextState) return committedEvents;

  const finishingEvents: DeltaDashEvent[] = isMatchFinished(nextState)
    ? [{ type: 'MATCH_FINISHED', round: nextState.round }]
    : createNextRoundEvents(nextState);

  return [...committedEvents, lockedEvent, resolvedEvent, ...cardMechanicEvents, ...cardResolutionEvents, ...discardEvents, reviewedEvent, roundEndEvent, ...finishingEvents];
}


function createCardMechanicEvents(state: DeltaDashMatchState): DeltaDashEvent[] {
  return state.commitments.flatMap((commitment) => {
    const car = state.cars.find((candidate) => candidate.id === commitment.carId);
    const card = commitment.cardDefinitionId ? getCardDefinitionById(commitment.cardDefinitionId) : null;
    if (!car || !card) return [];

    switch (card.id) {
      case 'tactic.first-move-seize':
        return createDrawEvents(state, car, 1, state.round, 'any');
      case 'tactic.mgu-h-recovery':
        return createExchangeHandEvents(state, car, state.round, false);
      case 'tactic.plan-changed':
        return createExchangeHandEvents(state, car, state.round, true);
      default:
        return [];
    }
  });
}

function createDrawEvents(state: DeltaDashMatchState, car: DeltaDashCar, amount: number, round: number, category: 'action' | 'tactic' | 'any'): DeltaDashEvent[] {
  if (amount <= 0) return [];

  if (category === 'any') {
    const actionEvents = createDrawEvents(state, car, amount, round, 'action');
    if (actionEvents.length) return actionEvents;
    return createDrawEvents(state, car, amount, round, 'tactic');
  }

  const draw = getDrawableCardInstanceIds(state.cards, car.id, category, amount, round);
  const reshuffleEvents: DeltaDashEvent[] = draw.reshuffleInstanceIds.map((cardInstanceId) => ({ type: 'CARD_MOVED' as const, round, cardInstanceId, zone: 'deck' as const, revealed: car.id !== 'car-human' }));
  return [...reshuffleEvents, ...(draw.cardInstanceIds.length ? [{ type: 'CARDS_DRAWN' as const, round, carId: car.id, cardInstanceIds: draw.cardInstanceIds }] : [])];
}

function createExchangeHandEvents(state: DeltaDashMatchState, car: DeltaDashCar, round: number, replenish = true): DeltaDashEvent[] {
  const handCards = state.cards.filter((card) => card.ownerCarId === car.id && card.zone === 'hand');
  const amount = Math.min(4, handCards.length);
  if (!amount) return [];

  const removedEvents: DeltaDashEvent[] = handCards.slice(0, amount).map((card) => ({ type: 'CARD_MOVED' as const, round, cardInstanceId: card.instanceId, zone: 'discard' as const, revealed: true }));
  if (!replenish) return removedEvents;

  const removedCards = handCards.slice(0, amount);
  const actionCount = removedCards.filter((cardInstance) => {
    const definition = getCardDefinitionById(cardInstance.definitionId);
    return definition?.category === 'action' || definition?.category === 'response';
  }).length;
  const tacticCount = removedCards.filter((cardInstance) => getCardDefinitionById(cardInstance.definitionId)?.category === 'tactic').length;
  const actionDraw = createDrawEvents(state, car, actionCount, round, 'action');
  const tacticDraw = createDrawEvents(state, car, tacticCount, round, 'tactic');
  return [...removedEvents, ...actionDraw, ...tacticDraw];
}

function resolveCommitment(state: DeltaDashMatchState, commitment: DeltaDashActionCommitment): DeltaDashResolvedAction[] {
  const car = state.cars.find((candidate) => candidate.id === commitment.carId);
  const card = commitment.cardDefinitionId ? getCardDefinitionById(commitment.cardDefinitionId) : null;
  if (!car || car.retired) return [];
  if (!card) return car.roundModifiers.includes('steadfast-defense') || car.roundModifiers.includes('no-normal-release') ? [] : [resolveAction(car, commitment.action, state.flag === 'yellow')];

  switch (card.id) {
    case 'action.attack':
      return resolveAttack(state, car, card.id, commitment.targetCarIds ?? []);
    case 'action.defend':
      return resolveDefend(car, card.id);
    case 'action.release':
      return resolveRelease(car, card.id);
    case 'action.burn-tires':
      return resolveBurnTires(state, car, card.id, commitment.targetCarIds ?? []);
    case 'action.protect-tires':
      return resolveProtectTires(car, card.id);
    case 'action.recycle':
      return resolveRecycle(car, card.id);
    case 'tactic.first-move-seize':
      return resolveFirstMoveSeize(state, car, card.id, commitment.targetCarIds ?? []);
    case 'tactic.mgu-h-recovery':
      return resolveMguHRecovery(state, car, card.id);
    case 'tactic.roundabout-rescue':
      return resolveRoundaboutRescue(state, car, card.id);
    case 'tactic.slaughter-all':
      return resolveSlaughterAll(state, car, card.id);
    case 'tactic.fishermans-profit':
      return resolveFishermansProfit(state, car, card.id, commitment.targetCarIds ?? []);
    case 'tactic.cant-hear':
      return resolveCantHear(state, car, card.id, commitment.targetCarIds ?? []);
    case 'tactic.little-tune-power':
      return resolveLittleTunePower(car, card.id);
    case 'tactic.rampaging-invasion':
      return resolveRampagingInvasion(state, car, card.id);
    case 'tactic.plan-changed':
      return resolvePlanChanged(car, card.id);
    default:
      return resolveDefaultCardCommitment(state, commitment, car, card);
  }
}

function resolveDefaultCardCommitment(state: DeltaDashMatchState, commitment: DeltaDashActionCommitment, car: DeltaDashCar, card: NonNullable<ReturnType<typeof getCardDefinitionById>>): DeltaDashResolvedAction[] {
  const targetCarIds = normalizeTargetCarIds(state, car, card, commitment.targetCarIds ?? []);
  if (!targetCarIds) return [];

  const resolvedTargetCarIds = card.targeting.kind === 'none' ? [car.id] : targetCarIds;
  return resolvedTargetCarIds.flatMap((targetCarId) => {
    const targetCar = state.cars.find((candidate) => candidate.id === targetCarId);
    return targetCar ? [resolveCardEffects(state, car, card, targetCar)] : [];
  });
}

function resolveAttack(state: DeltaDashMatchState, car: DeltaDashCar, cardDefinitionId: string, requestedTargetCarIds: string[]): DeltaDashResolvedAction[] {
  const target = state.cars.find((candidate) => candidate.id === requestedTargetCarIds[0] && candidate.id !== car.id && !candidate.retired);
  if (!target) return [];
  return [
    createResult(car, car, cardDefinitionId, { action: 'push', timeDeltaChange: 0.5 }),
    createResult(car, target, cardDefinitionId, { action: 'push', timeDeltaChange: -0.5 }),
  ];
}

function resolveDefend(car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  return [createResult(car, car, cardDefinitionId, { roundModifiers: ['defense-shield'] })];
}

function resolveRelease(car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  if (car.energy <= 0) return [];
  return [createResult(car, car, cardDefinitionId, { timeDeltaChange: car.energy, energyDelta: -car.energy, energyMin: 0 })];
}

function resolveBurnTires(state: DeltaDashMatchState, car: DeltaDashCar, cardDefinitionId: string, requestedTargetCarIds: string[]): DeltaDashResolvedAction[] {
  const target = requestedTargetCarIds[0]
    ? state.cars.find((candidate) => candidate.id === requestedTargetCarIds[0] && candidate.id !== car.id && !candidate.retired)
    : car;
  if (!target) return [];
  const targetCommitment = state.commitments.find((commitment) => commitment.carId === target.id);
  const tireWear = targetCommitment?.action === 'push' ? -2 : targetCommitment?.action === 'steady' ? -1 : 0;
  const selfBoost = target.id === car.id ? 1.5 : 0;
  return [createResult(car, target, cardDefinitionId, { timeDeltaChange: selfBoost, tireDelta: tireWear, tireMin: 0, roundModifiers: ['burn-tires'] })];
}

function resolveProtectTires(car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  return [createResult(car, car, cardDefinitionId, { timeDeltaChange: -1.5, roundModifiers: ['no-tire-wear'] })];
}

function resolveRecycle(car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  return [createResult(car, car, cardDefinitionId, { energyDelta: 1, energyMax: 4, roundModifiers: ['no-normal-release-next-round'] })];
}

function resolveFirstMoveSeize(state: DeltaDashMatchState, car: DeltaDashCar, cardDefinitionId: string, requestedTargetCarIds: string[]): DeltaDashResolvedAction[] {
  const target = state.cars.find((candidate) => candidate.id === requestedTargetCarIds[0] && candidate.id !== car.id && !candidate.retired);
  if (!target) return [];
  return [
    createResult(car, target, cardDefinitionId, { timeDeltaChange: car.timeDelta - target.timeDelta }),
    createResult(car, car, cardDefinitionId, { timeDeltaChange: target.timeDelta - car.timeDelta }),
  ];
}

function resolveMguHRecovery(state: DeltaDashMatchState, car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  const handCount = state.cards.filter((card) => card.ownerCarId === car.id && card.zone === 'hand').length;
  if (!handCount) return [];
  const recoverCount = Math.max(1, Math.min(4, handCount));
  return [createResult(car, car, cardDefinitionId, { energyDelta: recoverCount, energyMax: 4 })];
}

function resolveRoundaboutRescue(state: DeltaDashMatchState, car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  const fallbackStart = car.timeDelta;
  const fallbackEnd = Math.max(0, car.timeDelta - 2);
  const selfResult = createResult(car, car, cardDefinitionId, { timeDeltaChange: fallbackEnd - fallbackStart });
  const pushedTargets = state.cars
    .filter((target) => target.id !== car.id && !target.retired && target.timeDelta >= fallbackEnd && target.timeDelta < fallbackStart)
    .map((target) => createResult(car, target, cardDefinitionId, { timeDeltaChange: -0.5 }));
  return [selfResult, ...pushedTargets];
}

function resolveSlaughterAll(state: DeltaDashMatchState, car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  if (car.energy <= 0) return [];

  const selfResult = createResult(car, car, cardDefinitionId, {
    timeDeltaChange: car.energy,
    energyDelta: -99,
    tireDelta: -99,
    focusDelta: -99,
    roundModifiers: ['slaughter-all'],
  });
  const targetResults = state.cars
    .filter((target) => target.id !== car.id && !target.retired && target.timeDelta > car.timeDelta && target.timeDelta <= car.timeDelta + car.energy)
    .map((target, index) => createResult(car, target, cardDefinitionId, { focusDelta: -(((index + state.round) % 3) + 1), focusMin: 0 }));

  return [selfResult, ...targetResults];
}

function resolveFishermansProfit(state: DeltaDashMatchState, car: DeltaDashCar, cardDefinitionId: string, requestedTargetCarIds: string[]): DeltaDashResolvedAction[] {
  const target = state.cars.find((candidate) => candidate.id === requestedTargetCarIds[0] && candidate.id !== car.id && !candidate.retired);
  if (!target || car.energy <= 0) return [];

  const wheelToWheelCars = state.cars.filter((candidate) => !candidate.retired && candidate.id !== car.id && candidate.timeDelta > car.timeDelta && Math.abs(candidate.timeDelta - target.timeDelta) <= state.track.collisionTimeThreshold);
  if (wheelToWheelCars.length < 2) return [];

  return [
    createResult(car, target, cardDefinitionId, { timeDeltaChange: car.timeDelta - target.timeDelta }),
    createResult(car, car, cardDefinitionId, { timeDeltaChange: target.timeDelta - car.timeDelta, energyDelta: -1, energyMin: 0 }),
  ];
}

function resolveCantHear(state: DeltaDashMatchState, car: DeltaDashCar, cardDefinitionId: string, requestedTargetCarIds: string[]): DeltaDashResolvedAction[] {
  const targetId = requestedTargetCarIds[0];
  const targetCommitment = state.commitments.find((commitment) => commitment.carId === targetId);
  const targetCard = targetCommitment?.cardDefinitionId ? getCardDefinitionById(targetCommitment.cardDefinitionId) : null;
  const target = state.cars.find((candidate) => candidate.id === targetId && candidate.id !== car.id && !candidate.retired);
  if (!target || targetCard?.category !== 'tactic') return [];

  return [createResult(car, target, cardDefinitionId, { roundModifiers: [`countered:${targetCard.id}`] })];
}

function resolveLittleTunePower(car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  const tune = Math.min(4, 1 + ((car.focus + car.energy) % 4));
  return [createResult(car, car, cardDefinitionId, { focusDelta: tune, focusMax: 4 })];
}

function resolveRampagingInvasion(state: DeltaDashMatchState, car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  return state.cars
    .filter((target) => target.id !== car.id && !target.retired)
    .flatMap((target) => {
      const commitment = state.commitments.find((candidate) => candidate.carId === target.id);
      const answered = commitment?.action === 'defend' || Boolean(commitment?.cardDefinitionId);
      return answered ? [] : [createResult(car, target, cardDefinitionId, { focusDelta: -2, focusMin: 0 })];
    });
}

function resolvePlanChanged(car: DeltaDashCar, cardDefinitionId: string): DeltaDashResolvedAction[] {
  return [createResult(car, car, cardDefinitionId, {})];
}

function createResult(sourceCar: DeltaDashCar, targetCar: DeltaDashCar, cardDefinitionId: string, patch: Partial<DeltaDashResolvedAction>): DeltaDashResolvedAction {
  return {
    carId: targetCar.id,
    sourceCarId: sourceCar.id,
    targetCarId: targetCar.id,
    action: 'steady',
    cardDefinitionId,
    timeDeltaChange: 0,
    energyDelta: 0,
    tireDelta: 0,
    focusDelta: 0,
    roundModifiers: [],
    ...patch,
  };
}

function applyResultGuards(state: DeltaDashMatchState, results: DeltaDashResolvedAction[]): DeltaDashResolvedAction[] {
  return applyDefendShields(applySteadfastDefense(state, applyCounteredResults(results)));
}

function applyDefendShields(results: DeltaDashResolvedAction[]): DeltaDashResolvedAction[] {
  const shieldedCarIds = new Set(results.filter((result) => result.roundModifiers?.includes('defense-shield')).map((result) => result.carId));
  if (!shieldedCarIds.size) return results;
  return results.filter((result) => !shieldedCarIds.has(result.carId) || result.sourceCarId === result.carId || result.cardDefinitionId === 'tactic.slaughter-all' || (!result.timeDeltaChange && !result.tireDelta && !result.focusDelta));
}

function applySteadfastDefense(state: DeltaDashMatchState, results: DeltaDashResolvedAction[]): DeltaDashResolvedAction[] {
  const steadfastCarIds = new Set(state.cars.filter((car) => car.roundModifiers.includes('steadfast-defense')).map((car) => car.id));
  if (!steadfastCarIds.size) return results;
  return results.filter((result) => !steadfastCarIds.has(result.carId) || result.sourceCarId === result.carId || !result.timeDeltaChange || result.timeDeltaChange > 0);
}

function applyCounteredResults(results: DeltaDashResolvedAction[]): DeltaDashResolvedAction[] {
  const counteredCardIds = new Set(results.flatMap((result) => result.roundModifiers ?? []).flatMap((modifier) => modifier.startsWith('countered:') ? [modifier.slice('countered:'.length)] : []));
  if (!counteredCardIds.size) return results;
  return results.filter((result) => !result.cardDefinitionId || !counteredCardIds.has(result.cardDefinitionId) || result.roundModifiers?.some((modifier) => modifier.startsWith('countered:')));
}

function createNextRoundEvents(state: NonNullable<ReturnType<typeof projectDeltaDashEvents>>): DeltaDashEvent[] {
  const nextRound = state.round + 1;
  return [
    { type: 'ROUND_STARTED', round: nextRound },
    ...state.cars.flatMap((car) => {
      if (car.retired) return [];
      const actionDraw = getDrawableCardInstanceIds(state.cards, car.id, 'action', DELTADASH_RACE_INIT.roundDrawActions, nextRound);
      const tacticDraw = getDrawableCardInstanceIds(state.cards, car.id, 'tactic', DELTADASH_RACE_INIT.roundDrawTactics, nextRound);

      const reshuffleEvents: DeltaDashEvent[] = [
        ...actionDraw.reshuffleInstanceIds.map((cardInstanceId) => ({ type: 'CARD_MOVED' as const, round: nextRound, cardInstanceId, zone: 'deck' as const, revealed: car.id !== 'car-human' })),
        ...tacticDraw.reshuffleInstanceIds.map((cardInstanceId) => ({ type: 'CARD_MOVED' as const, round: nextRound, cardInstanceId, zone: 'deck' as const, revealed: car.id !== 'car-human' })),
      ];

      const cardInstanceIds = [...actionDraw.cardInstanceIds, ...tacticDraw.cardInstanceIds];
      return [...reshuffleEvents, ...(cardInstanceIds.length ? [{ type: 'CARDS_DRAWN' as const, round: nextRound, carId: car.id, cardInstanceIds }] : [])];
    }),
  ];
}

function createCardPlayEvents(state: NonNullable<ReturnType<typeof projectDeltaDashEvents>>, carId: string, plays: DeltaDashCardPlayInput[]): DeltaDashEvent[] | null {
  const usedCardInstanceIds = new Set<string>();
  const events: DeltaDashEvent[] = [];

  for (const play of plays) {
    const car = state.cars.find((candidate) => candidate.id === carId);
    if (!car || car.retired) return null;

    const card = getCardDefinitionById(play.cardDefinitionId);
    const cardInstance = state.cards.find((candidate) => candidate.ownerCarId === car.id && candidate.definitionId === play.cardDefinitionId && candidate.zone === 'hand' && !usedCardInstanceIds.has(candidate.instanceId) && (!play.cardInstanceId || candidate.instanceId === play.cardInstanceId));
    if (!card || !cardInstance) return null;
    const targetCarIds = normalizeTargetCarIds(state, car, card, play.targetCarIds ?? []);
    if (!targetCarIds) return null;

    usedCardInstanceIds.add(cardInstance.instanceId);
    events.push(
      {
        type: 'CARD_PLAY_COMMITTED',
        round: state.round,
        carId: car.id,
        cardInstanceId: cardInstance.instanceId,
        cardDefinitionId: card.id,
        action: card.actionBridge ?? 'steady',
        targetCarIds,
      },
      {
        type: 'CARD_MOVED',
        round: state.round,
        cardInstanceId: cardInstance.instanceId,
        zone: 'deployed',
        revealed: true,
      },
    );
  }

  if (!events.length) {
    events.push({ type: 'ACTION_COMMITTED', round: state.round, carId, action: 'steady', targetCarIds: [] });
  }

  return events;
}
