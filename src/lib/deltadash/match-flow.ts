import { chooseBotCardId } from './bot-policy';
import { resolveCardEffects } from './card-resolution';
import { getCardDefinitionById } from './playable-card-catalog';
import { projectDeltaDashEvents } from './reducer';
import { getHumanCar, getMissingCommitmentCarIds, isMatchFinished } from './selectors';
import { runStewardReview } from './steward-policy';
import type { DeltaDashEvent } from './types';

export function advanceLocalMatch(events: DeltaDashEvent[], humanCardDefinitionId: string): DeltaDashEvent[] {
  const state = projectDeltaDashEvents(events);
  if (!state || state.phase === 'finished') return [];

  const humanCar = getHumanCar(state);
  if (!humanCar || humanCar.retired) return [];

  const humanCard = getCardDefinitionById(humanCardDefinitionId);
  const humanCardInstance = state.cards.find((card) => card.ownerCarId === humanCar.id && card.definitionId === humanCardDefinitionId && card.zone === 'hand');
  if (!humanCard?.actionBridge || !humanCardInstance) return [];

  const humanEvents: DeltaDashEvent[] = [
    {
      type: 'CARD_PLAY_COMMITTED',
      round: state.round,
      carId: humanCar.id,
      cardInstanceId: humanCardInstance.instanceId,
      cardDefinitionId: humanCard.id,
      action: humanCard.actionBridge,
    },
    {
      type: 'CARD_MOVED',
      round: state.round,
      cardInstanceId: humanCardInstance.instanceId,
      zone: 'deployed',
      revealed: true,
    },
  ];

  const stateAfterHuman = projectDeltaDashEvents([...events, ...humanEvents]);
  if (!stateAfterHuman) return [];

  const botEvents: DeltaDashEvent[] = stateAfterHuman.players
    .filter((player) => player.kind === 'bot')
    .flatMap((player) => {
      const car = stateAfterHuman.cars.find((candidate) => candidate.id === player.carId);
      if (!car || car.retired) return [];

      const cardDefinitionId = chooseBotCardId(stateAfterHuman, car);
      const card = getCardDefinitionById(cardDefinitionId);
      const cardInstance = stateAfterHuman.cards.find((candidate) => candidate.ownerCarId === car.id && candidate.definitionId === cardDefinitionId && candidate.zone === 'hand');
      if (!card?.actionBridge || !cardInstance) return [];

      return [
        {
          type: 'CARD_PLAY_COMMITTED' as const,
          round: stateAfterHuman.round,
          carId: car.id,
          cardInstanceId: cardInstance.instanceId,
          cardDefinitionId: card.id,
          action: card.actionBridge,
        },
        {
          type: 'CARD_MOVED' as const,
          round: stateAfterHuman.round,
          cardInstanceId: cardInstance.instanceId,
          zone: 'deployed' as const,
          revealed: true,
        },
      ];
    });

  const committedEvents = [...humanEvents, ...botEvents];
  const committedState = projectDeltaDashEvents([...events, ...committedEvents]);
  if (!committedState || getMissingCommitmentCarIds(committedState).length) return committedEvents;

  const results = committedState.commitments
    .map((commitment) => {
      const car = committedState.cars.find((candidate) => candidate.id === commitment.carId);
      const card = commitment.cardDefinitionId ? getCardDefinitionById(commitment.cardDefinitionId) : null;
      return car && card ? resolveCardEffects(committedState, car, card) : null;
    })
    .filter((result): result is NonNullable<typeof result> => Boolean(result));

  const lockedEvent: DeltaDashEvent = { type: 'COMMITMENTS_LOCKED', round: committedState.round };
  const resolvedEvent: DeltaDashEvent = { type: 'ACTIONS_RESOLVED', round: committedState.round, results };
  const cardResolutionEvents: DeltaDashEvent[] = committedState.commitments.flatMap((commitment) => commitment.cardDefinitionId ? [{
    type: 'CARD_RESOLVED' as const,
    round: committedState.round,
    carId: commitment.carId,
    cardDefinitionId: commitment.cardDefinitionId,
  }] : []);
  const discardEvents: DeltaDashEvent[] = committedState.commitments.flatMap((commitment) => commitment.cardInstanceId ? [{
    type: 'CARD_MOVED' as const,
    round: committedState.round,
    cardInstanceId: commitment.cardInstanceId,
    zone: 'discard' as const,
    revealed: true,
  }] : []);
  const resolvedState = projectDeltaDashEvents([...events, ...committedEvents, lockedEvent, resolvedEvent, ...cardResolutionEvents, ...discardEvents]);
  if (!resolvedState) return committedEvents;

  const review = runStewardReview(resolvedState);
  const reviewedEvent: DeltaDashEvent = {
    type: 'STEWARD_REVIEWED',
    round: resolvedState.round,
    notes: review.notes,
    flag: review.flag,
  };
  const reviewedState = projectDeltaDashEvents([...events, ...committedEvents, lockedEvent, resolvedEvent, ...cardResolutionEvents, ...discardEvents, reviewedEvent]);
  if (!reviewedState) return committedEvents;

  const roundEndEvent: DeltaDashEvent = { type: 'ROUND_ENDED', round: reviewedState.round };
  const nextState = projectDeltaDashEvents([...events, ...committedEvents, lockedEvent, resolvedEvent, ...cardResolutionEvents, ...discardEvents, reviewedEvent, roundEndEvent]);
  if (!nextState) return committedEvents;

  const finishingEvents: DeltaDashEvent[] = isMatchFinished(nextState)
    ? [{ type: 'MATCH_FINISHED', round: nextState.round }]
    : [{ type: 'ROUND_STARTED', round: nextState.round + 1 }];

  return [...committedEvents, lockedEvent, resolvedEvent, ...cardResolutionEvents, ...discardEvents, reviewedEvent, roundEndEvent, ...finishingEvents];
}
