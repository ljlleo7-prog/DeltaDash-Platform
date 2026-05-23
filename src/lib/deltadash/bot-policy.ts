import { getCardsForCar, type DeltaDashPlayableCard } from './card-selectors';
import type { DeltaDashCardPlayInput } from './match-flow';
import { getDefaultTargetCarIds, getTimeGap, getValidTargetCars, normalizeTargetCarIds } from './targeting';
import type { DeltaDashActionType, DeltaDashCar, DeltaDashMatchState, DeltaDashTyreCompound } from './types';

export type DeltaDashBotCardDecision = {
  cardDefinitionId: string;
  cardInstanceId: string;
  targetCarIds: string[];
  score: number;
};

export type DeltaDashBotDecisionTrace = {
  carId: string;
  action: DeltaDashActionType;
  state: {
    round: number;
    rank: number;
    gapToLeader: number;
    energy: number;
    tire: number;
    focus: number;
    tyreCompound: string;
    pitStatus: string;
    weatherRisk: boolean;
    closeOpponents: number;
    underThreat: boolean;
  };
  candidates: DeltaDashBotCardDecision[];
  chosen: DeltaDashBotCardDecision[];
};

export type DeltaDashBotPitService = {
  compound: DeltaDashTyreCompound;
  repairSelected: boolean;
};

export function chooseBotStartingTyre(state: DeltaDashMatchState): DeltaDashTyreCompound {
  const wetness = state.track.weather.trackWetness;
  if (wetness >= state.track.tyreCurve.wetCrossover.wetMinWetness || state.track.weather.sky === 'steady-rain') return 'wet';
  if (wetness >= state.track.tyreCurve.wetCrossover.intermediateMinWetness || state.track.weather.sky === 'light-rain') return 'intermediate';
  if (state.track.tyreStress >= 0.72 || state.track.weather.temperatureBand === 'hot') return 'hard';
  if (state.track.tyreStress <= 0.42 && state.track.weather.temperatureBand === 'cool') return 'soft';
  return 'medium';
}

export function chooseBotPitService(state: DeltaDashMatchState, car: DeltaDashCar): DeltaDashBotPitService | null {
  if (state.racePhase !== 'live' || car.retired || car.pitState.status !== 'none' || car.pitState.cooldown > 0) return null;

  const targetCompound = chooseBotStartingTyre(state);
  const lowTyre = car.tire <= 32;
  const wrongCompound = car.tyreState.compound !== targetCompound && (state.track.weather.trackWetness >= 0.28 || car.tyreState.compound === 'wet' || car.tyreState.compound === 'intermediate');
  const needsRepair = car.tire <= 42 || car.focus <= Math.max(2, Math.floor(car.focusCap / 3));

  if (!lowTyre && !wrongCompound && !needsRepair) return null;

  return {
    compound: lowTyre || wrongCompound ? targetCompound : car.tyreState.compound,
    repairSelected: needsRepair,
  };
}

export function chooseBotAction(state: DeltaDashMatchState, car: DeltaDashCar): DeltaDashActionType {
  if (car.retired) return 'steady';
  if (car.tire <= 34 || car.energy <= 1) return 'recover';
  if (state.flag === 'yellow') return 'defend';

  const leaderTimeDelta = Math.max(...state.cars.filter((candidate) => !candidate.retired).map((candidate) => candidate.timeDelta));
  const timeDeltaToFinish = state.track.finishTimeDelta - car.timeDelta;
  const highWearRisk = state.track.tyreStress >= 0.72 || state.track.weather.trackWetness >= 0.35 || state.track.weather.temperatureBand === 'hot';
  const safePushTire = highWearRisk ? 67 : 50;

  if (timeDeltaToFinish <= 2.5 && car.energy >= 2 && car.tire >= 34) return 'push';
  if (leaderTimeDelta - car.timeDelta >= 2 && car.energy >= 2 && car.tire >= safePushTire) return 'push';
  if (car.timeDelta >= leaderTimeDelta) return 'steady';

  return 'steady';
}

export function chooseBotCardPlays(state: DeltaDashMatchState, car: DeltaDashCar, maxCards: number): DeltaDashCardPlayInput[] {
  return getBotDecisionTrace(state, car, maxCards).chosen.map((decision) => ({
    cardDefinitionId: decision.cardDefinitionId,
    cardInstanceId: decision.cardInstanceId,
    targetCarIds: decision.targetCarIds,
  }));
}

export function getBotDecisionTrace(state: DeltaDashMatchState, car: DeltaDashCar, maxCards: number): DeltaDashBotDecisionTrace {
  const candidates = getBotCardCandidates(state, car);
  return {
    carId: car.id,
    action: chooseBotAction(state, car),
    state: getBotDecisionState(state, car),
    candidates,
    chosen: candidates.slice(0, maxCards),
  };
}

function getBotCardCandidates(state: DeltaDashMatchState, car: DeltaDashCar): DeltaDashBotCardDecision[] {
  return getCardsForCar(state, car.id)
    .filter((card): card is DeltaDashPlayableCard & { instance: NonNullable<DeltaDashPlayableCard['instance']> } => Boolean(card.instance) && card.playable)
    .flatMap((card) => {
      const targetCarIds = chooseBotTargetCarIds(state, car, card);
      return targetCarIds ? [{ card, targetCarIds, score: scoreBotCard(state, car, card) }] : [];
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.card.instance.instanceId.localeCompare(right.card.instance.instanceId))
    .map(({ card, targetCarIds, score }) => ({
      cardDefinitionId: card.definition.id,
      cardInstanceId: card.instance.instanceId,
      targetCarIds,
      score,
    }));
}

function getBotDecisionState(state: DeltaDashMatchState, car: DeltaDashCar): DeltaDashBotDecisionTrace['state'] {
  const liveCars = state.cars.filter((candidate) => !candidate.retired);
  const rankedCars = [...liveCars].sort((left, right) => right.timeDelta - left.timeDelta || right.tire - left.tire || left.id.localeCompare(right.id));
  const leaderTimeDelta = rankedCars[0]?.timeDelta ?? car.timeDelta;
  const highWearRisk = state.track.tyreStress >= 0.72 || state.track.weather.trackWetness >= 0.35 || state.track.weather.temperatureBand === 'hot';

  return {
    round: state.round,
    rank: rankedCars.findIndex((candidate) => candidate.id === car.id) + 1,
    gapToLeader: leaderTimeDelta - car.timeDelta,
    energy: car.energy,
    tire: car.tire,
    focus: car.focus,
    tyreCompound: car.tyreState.compound,
    pitStatus: car.pitState.status,
    weatherRisk: highWearRisk,
    closeOpponents: liveCars.filter((target) => target.id !== car.id && getTimeGap(car, target) <= 1.5).length,
    underThreat: state.commitments.some((commitment) => commitment.targetCarIds?.includes(car.id)),
  };
}

function chooseBotTargetCarIds(state: DeltaDashMatchState, car: DeltaDashCar, card: DeltaDashPlayableCard): string[] | null {
  const validTargets = getValidTargetCars(state, car, card.definition);
  const defaultTargets = getDefaultTargetCarIds(state, car, card.definition);
  const targetCarIds = card.definition.targeting.kind === 'opponent' ? chooseBestOpponentTarget(state, car, validTargets, card) : defaultTargets;
  return normalizeTargetCarIds(state, car, card.definition, targetCarIds);
}

function chooseBestOpponentTarget(state: DeltaDashMatchState, car: DeltaDashCar, targets: DeltaDashCar[], card: DeltaDashPlayableCard): string[] {
  const target = [...targets].sort((left, right) => scoreBotTarget(state, car, right, card) - scoreBotTarget(state, car, left, card) || left.id.localeCompare(right.id))[0];
  return target ? [target.id] : [];
}

function scoreBotTarget(state: DeltaDashMatchState, car: DeltaDashCar, target: DeltaDashCar, card: DeltaDashPlayableCard): number {
  const gap = getTimeGap(car, target);
  const aheadBonus = target.timeDelta > car.timeDelta ? 8 : -2;
  const leaderBonus = target.timeDelta === Math.max(...state.cars.filter((candidate) => !candidate.retired).map((candidate) => candidate.timeDelta)) ? 4 : 0;
  const vulnerableBonus = target.tire <= 34 || target.energy <= 1 || target.focus <= 2 ? 2 : 0;
  const closeBonus = Math.max(0, 4 - gap);
  const tacticCounterBonus = card.definition.id === 'tactic.cant-hear' ? 10 : 0;
  return aheadBonus + leaderBonus + vulnerableBonus + closeBonus + tacticCounterBonus;
}

function scoreBotCard(state: DeltaDashMatchState, car: DeltaDashCar, card: DeltaDashPlayableCard): number {
  const action = chooseBotAction(state, car);
  const leaderTimeDelta = Math.max(...state.cars.filter((candidate) => !candidate.retired).map((candidate) => candidate.timeDelta));
  const gapToLeader = leaderTimeDelta - car.timeDelta;
  const closeOpponents = state.cars.filter((target) => target.id !== car.id && !target.retired && getTimeGap(car, target) <= 1.5).length;
  const lowResource = car.energy <= 1 || car.tire <= 34 || car.focus <= 2;
  const highResource = car.energy >= 3 && car.tire >= 50;
  const underThreat = state.commitments.some((commitment) => commitment.targetCarIds?.includes(car.id));

  switch (card.definition.id) {
    case 'action.attack':
      return highResource && gapToLeader > 0 ? 18 + gapToLeader : 0;
    case 'action.release':
      return car.energy >= 2 && gapToLeader > 0 ? 16 + car.energy : 0;
    case 'action.burn-tires':
      return highResource && closeOpponents ? 14 + closeOpponents : 0;
    case 'action.protect-tires':
      return car.tire <= 50 || (state.track.tyreStress >= 0.72 && car.tire <= 75) ? 20 : 0;
    case 'action.recycle':
      return car.energy <= 2 ? 12 + (4 - car.energy) : 0;
    case 'action.defend':
      return underThreat || state.flag === 'yellow' ? 18 : 3;
    case 'tactic.mgu-h-recovery':
      return car.energy <= 1 || (car.energy <= 2 && gapToLeader >= 1.5) ? 17 : 0;
    case 'tactic.little-tune-power':
      return car.focus < Math.min(4, car.focusCap) ? 13 + (car.focusCap - car.focus) : 0;
    case 'tactic.slaughter-all':
      return car.energy >= 3 && closeOpponents >= 2 ? 22 : 0;
    case 'tactic.rampaging-invasion':
      return highResource && state.cars.filter((target) => target.id !== car.id && !target.retired).length >= 2 ? 15 : 0;
    case 'tactic.first-move-seize':
      return gapToLeader >= 2 ? 14 + gapToLeader : 0;
    case 'tactic.fishermans-profit':
      return closeOpponents >= 2 && car.energy > 0 ? 16 : 0;
    case 'tactic.cant-hear':
      return state.commitments.some((commitment) => commitment.carId !== car.id && commitment.cardDefinitionId?.startsWith('tactic.')) ? 19 : 0;
    case 'tactic.roundabout-rescue':
      return underThreat ? 14 : 0;
    case 'tactic.steadfast-lion':
      return car.tire <= 50 || gapToLeader <= 1 ? 11 : 0;
    case 'tactic.plan-changed':
      return lowResource ? 7 : 0;
    default:
      return card.definition.actionBridge === action ? 10 : 0;
  }
}
