import { useEffect } from 'react';
import type { Language } from '@/lib/i18n';
import { getCardInstanceDefinition, getCardsForCar, getCardInstancesForCar } from '@/lib/deltadash/card-selectors';
import type { DeltaDashCardInstance } from '@/lib/deltadash/card-types';
import type { DeltaDashCardPlayInput, DeltaDashPitServiceInput } from '@/lib/deltadash/match-flow';
import { getDefaultTargetCarIds, getValidTargetCars, normalizeTargetCarIds } from '@/lib/deltadash/targeting';
import type { DeltaDashCar, DeltaDashMatchState, DeltaDashPendingChoice, DeltaDashTyreCompound } from '@/lib/deltadash/types';
import { CardDeployPanel } from './card-deploy-panel';

const TYRE_COMPOUNDS: DeltaDashTyreCompound[] = ['soft', 'medium', 'hard', 'intermediate', 'wet'];
const COMPOUND_BASE_PACE: Record<DeltaDashTyreCompound, number> = {
  soft: 0.28,
  medium: 0,
  hard: -0.18,
  intermediate: -0.35,
  wet: -0.48,
};

function getTyrePacePreview(state: DeltaDashMatchState, compound: DeltaDashTyreCompound): number {
  const wetness = state.track.weather.trackWetness;
  const crossover = state.track.tyreCurve.wetCrossover;
  if (compound === 'wet') return wetness >= crossover.wetMinWetness ? 0.22 : -0.6;
  if (compound === 'intermediate') return wetness >= crossover.intermediateMinWetness && wetness <= crossover.intermediateMaxWetness ? 0.15 : -0.32;
  if (wetness > crossover.slickMaxWetness) return compound === 'hard' ? -0.42 : -0.55;
  return COMPOUND_BASE_PACE[compound];
}

function getTyreWearPreview(state: DeltaDashMatchState, compound: DeltaDashTyreCompound): number {
  const wetness = state.track.weather.trackWetness;
  const baseWear = state.track.tyreCurve.baseWear[compound];
  const trackFactor = Math.min(1.18, Math.max(0.82, 0.82 + (0.36 * state.track.tyreStress)));
  const tempFactor = state.track.weather.temperatureBand === 'hot' ? 1.08 : state.track.weather.temperatureBand === 'cool' ? 0.96 : 1;
  const wetFactor = getCompoundWetFactor(compound, wetness, state.track.tyreCurve.wetCrossover);
  return Math.round(baseWear * trackFactor * tempFactor * wetFactor * 10) / 10;
}

function getCompoundWetFactor(compound: DeltaDashTyreCompound, wetness: number, crossover: DeltaDashMatchState['track']['tyreCurve']['wetCrossover']): number {
  if (compound === 'wet') return wetness >= crossover.slickMaxWetness ? 0.78 : 0.95;
  if (compound === 'intermediate') {
    if (wetness < crossover.intermediateMinWetness) return 1.12;
    if (wetness > crossover.intermediateMaxWetness) return 0.88;
    return 1;
  }
  if (compound === 'soft') return wetness > crossover.slickMaxWetness ? 1.18 : 1;
  if (compound === 'hard') return wetness > crossover.wetMinWetness ? 1.08 : 0.96;
  return wetness > crossover.wetMinWetness ? 1.12 : 0.98;
}

function getTyreClass(compound: DeltaDashTyreCompound, selected: boolean): string {
  const classes = {
    soft: 'border-rose-300/50 bg-rose-500/15 text-rose-100 hover:bg-rose-400 hover:text-slate-950',
    medium: 'border-yellow-300/55 bg-yellow-400/15 text-yellow-100 hover:bg-yellow-300 hover:text-slate-950',
    hard: 'border-slate-100/45 bg-white/10 text-slate-100 hover:bg-white hover:text-slate-950',
    intermediate: 'border-emerald-300/50 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-300 hover:text-slate-950',
    wet: 'border-sky-300/55 bg-sky-500/15 text-sky-100 hover:bg-sky-300 hover:text-slate-950',
  }[compound];
  return `${classes} ${selected ? 'ring-2 ring-white/60 shadow-[0_0_24px_rgba(255,255,255,0.18)]' : ''}`;
}

function getPitLaneLossPreview(state: DeltaDashMatchState): string {
  if (state.flag === 'yellow') return '-4.0s';
  const loss = 6 + ((state.track.tyreStress ?? 0.5) * 3);
  return `-${loss.toFixed(1)}s`;
}

function getPitLossPreview(humanCar: DeltaDashCar | null): string {
  if (!humanCar || humanCar.pitState.status !== 'servicing') return '-';
  const changedCompound = (humanCar.pitState.pendingCompound ?? humanCar.tyreState.compound) !== humanCar.tyreState.compound;
  const loss = (changedCompound ? 2.4 : 0) + (humanCar.pitState.repairSelected ? 1.4 : 0);
  return `-${loss.toFixed(1)}s`;
}

export function DriverConsolePanel({
  state,
  humanCar,
  language,
  deploySlots,
  onUpdateDeploySlot,
  onConfirmDeploy,
  onRemoveDeployedCard,
  onSelectTyre,
  onStartRace,
  startingLightsOn,
  onEnterPit,
  onUpdatePitService,
  onExitPit,
  onRevealNext,
  onResolveCurrent,
  onContinueCleanup,
  onSubmitChoice,
  selectedChoiceCardIds,
  onToggleChoiceCard,
}: {
  state: DeltaDashMatchState;
  humanCar: DeltaDashCar | null;
  language: Language;
  deploySlots: (DeltaDashCardPlayInput | null)[];
  onUpdateDeploySlot: (slotIndex: number, slot: DeltaDashCardPlayInput | null) => void;
  onConfirmDeploy: () => void;
  onRemoveDeployedCard: (cardInstanceId: string) => void;
  onSelectTyre: (compound: DeltaDashTyreCompound) => void;
  onStartRace: () => void;
  startingLightsOn: number;
  onEnterPit: () => void;
  onUpdatePitService: (service: DeltaDashPitServiceInput) => void;
  onExitPit: () => void;
  onRevealNext: () => void;
  onResolveCurrent: () => void;
  onContinueCleanup: () => void;
  onSubmitChoice: (choice: DeltaDashPendingChoice) => void;
  selectedChoiceCardIds: string[];
  onToggleChoiceCard: (cardInstanceId: string) => void;
}) {
  const cards = humanCar ? getCardsForCar(state, humanCar.id) : [];
  const deployedCards = humanCar
    ? getCardInstancesForCar(state, humanCar.id, 'deployed').flatMap((instance) => {
      const definition = getCardInstanceDefinition(instance);
      return definition ? [{ instance, definition }] : [];
    })
    : [];
  const slotCards = deploySlots.map((slot) => {
    if (!slot) return null;
    return cards.find((card) => card.definition.id === slot.cardDefinitionId && card.playable && (!slot.cardInstanceId || card.instance?.instanceId === slot.cardInstanceId)) ?? null;
  });

  useEffect(() => {
    if (!humanCar) return;

    deploySlots.forEach((slot, index) => {
      const card = slotCards[index];
      if (!slot || !card) return;
      const normalizedTargets = normalizeTargetCarIds(state, humanCar, card.definition, slot.targetCarIds ?? []);
      const targetCarIds = normalizedTargets ?? getDefaultTargetCarIds(state, humanCar, card.definition);
      if ((slot.targetCarIds ?? []).join('|') !== targetCarIds.join('|')) {
        onUpdateDeploySlot(index, { ...slot, targetCarIds });
      }
    });
  }, [deploySlots, humanCar, onUpdateDeploySlot, slotCards, state]);

  function toggleTarget(slotIndex: number, targetCarId: string) {
    const slot = deploySlots[slotIndex];
    const card = slotCards[slotIndex];
    if (!slot || !card) return;

    if (card.definition.targeting.kind === 'opponent') {
      onUpdateDeploySlot(slotIndex, { ...slot, targetCarIds: [targetCarId] });
      return;
    }

    const currentTargetIds = slot.targetCarIds ?? [];
    onUpdateDeploySlot(slotIndex, {
      ...slot,
      targetCarIds: currentTargetIds.includes(targetCarId) ? currentTargetIds.filter((id) => id !== targetCarId) : [...currentTargetIds, targetCarId],
    });
  }

  const deploySlotViews = deploySlots.map((slot, index) => {
    const card = slotCards[index];
    return {
      slot,
      card,
      validTargets: card && humanCar ? getValidTargetCars(state, humanCar, card.definition) : [],
      selectedTargetCarIds: slot?.targetCarIds ?? [],
    };
  });
  const controlsLocked = state.racePhase !== 'live' || humanCar?.pitState.status === 'servicing' || state.turnStep !== 'planning';
  const pitCompound = humanCar?.pitState.pendingCompound ?? humanCar?.tyreState.compound ?? 'medium';
  const currentResolutionItem = state.resolutionQueue[state.resolutionIndex] ?? null;
  const choiceCards = state.pendingChoice && (state.pendingChoice.kind === 'selectCards' || state.pendingChoice.kind === 'handLimitDiscard')
    ? state.pendingChoice.validCardInstanceIds.flatMap((cardInstanceId) => {
      const instance = state.cards.find((card) => card.instanceId === cardInstanceId);
      const definition = instance ? getCardInstanceDefinition(instance) : null;
      return instance && definition ? [{ instance, definition }] : [];
    })
    : [];

  return (
    <div className="space-y-3">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-3">
        {state.racePhase === 'preparation' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-lime-200">{language === 'en' ? 'Race preparation' : '赛前准备'}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{language === 'en' ? 'Choose your starting tyre, then start the race.' : '选择起步轮胎，然后开始比赛。'}</p>
              </div>
              <button type="button" onClick={onStartRace} disabled={!humanCar || startingLightsOn > 0} className="rounded-full border border-orange-300/40 bg-orange-400/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-100 transition hover:bg-orange-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                {language === 'en' ? 'Start Race' : '开始比赛'}
              </button>
            </div>
            <TyrePalette selectedCompound={humanCar?.tyreState.compound ?? 'medium'} state={state} language={language} onSelect={onSelectTyre} disabled={!humanCar || startingLightsOn > 0} />
            <StartLights lightsOn={startingLightsOn} />
          </div>
        ) : humanCar?.pitState.status === 'servicing' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-orange-200">{language === 'en' ? 'Pit service' : '维修区服务'}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{language === 'en' ? 'Choose tyres and optional repair, then exit the pit.' : '选择轮胎和可选维修，然后驶离维修区。'}</p>
              </div>
              <div className="rounded-2xl border border-orange-300/25 bg-orange-400/10 px-3 py-2 text-right text-xs text-orange-100">
                <p className="font-black uppercase tracking-[0.18em]">{language === 'en' ? 'Service loss' : '维修损失'}</p>
                <p className="mt-1 text-lg font-black text-white">{getPitLossPreview(humanCar)}</p>
              </div>
            </div>
            <TyrePalette selectedCompound={pitCompound} state={state} language={language} onSelect={(compound) => onUpdatePitService({ compound, repairSelected: Boolean(humanCar?.pitState.repairSelected) })} disabled={!humanCar} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onUpdatePitService({ compound: pitCompound, repairSelected: !humanCar?.pitState.repairSelected })} className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${humanCar?.pitState.repairSelected ? 'border-cyan-200 bg-cyan-300 text-slate-950' : 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300 hover:text-slate-950'}`}>
                {language === 'en' ? 'Repair tyres + focus' : '维修轮胎 + 专注'}
              </button>
              <button type="button" onClick={onExitPit} className="rounded-full border border-lime-300/35 bg-lime-300/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-lime-100 transition hover:bg-lime-300 hover:text-slate-950">
                {language === 'en' ? 'Pit Exit' : '驶出维修区'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-lime-200">{language === 'en' ? 'Tyre status' : '轮胎状态'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.14em] ${getTyreClass(humanCar?.tyreState.compound ?? 'medium', true)}`}>{humanCar?.tyreState.compound ?? '-'}</span>
                <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.14em] text-orange-100">{language === 'en' ? 'Pit lane' : '维修区损失'} {getPitLaneLossPreview(state)}</span>
              </div>
            </div>
            <button type="button" onClick={onEnterPit} disabled={!humanCar || state.racePhase !== 'live' || state.phase !== 'planning' || humanCar.pitState.status !== 'none' || humanCar.pitState.cooldown > 0} className="rounded-full border border-orange-300/35 bg-orange-400/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-100 transition hover:bg-orange-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
              {language === 'en' ? 'Enter Pit' : '进入维修区'}
            </button>
          </div>
        )}
      </section>
      {state.turnStep !== 'planning' && state.racePhase === 'live' ? (
        <ResolutionControlPanel
          state={state}
          language={language}
          currentItem={currentResolutionItem}
          choiceCards={choiceCards}
          selectedChoiceCardIds={selectedChoiceCardIds}
          onToggleChoiceCard={onToggleChoiceCard}
          onRevealNext={onRevealNext}
          onResolveCurrent={onResolveCurrent}
          onContinueCleanup={onContinueCleanup}
          onSubmitChoice={onSubmitChoice}
        />
      ) : null}
      {controlsLocked ? (
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-4 text-xs leading-5 text-slate-400">
          {state.racePhase === 'preparation'
            ? (language === 'en' ? 'Card deployment unlocks after the start lights go out.' : '发车灯熄灭后才能部署卡牌。')
            : state.turnStep !== 'planning'
              ? (language === 'en' ? 'Resolve the current phase before deploying more cards.' : '完成当前阶段后才能继续部署卡牌。')
              : (language === 'en' ? 'Finish pit service before deploying cards.' : '完成维修区服务后才能部署卡牌。')}
        </section>
      ) : (
        <CardDeployPanel
          slots={deploySlotViews}
          language={language}
          sourceCar={humanCar}
          onToggleTarget={toggleTarget}
          onClearSlot={(slotIndex) => onUpdateDeploySlot(slotIndex, null)}
          onConfirmDeploy={onConfirmDeploy}
          deployedCards={deployedCards}
          onRemoveDeployedCard={onRemoveDeployedCard}
        />
      )}
    </div>
  );
}

function ResolutionControlPanel({
  state,
  language,
  currentItem,
  choiceCards,
  selectedChoiceCardIds,
  onToggleChoiceCard,
  onRevealNext,
  onResolveCurrent,
  onContinueCleanup,
  onSubmitChoice,
}: {
  state: DeltaDashMatchState;
  language: Language;
  currentItem: DeltaDashMatchState['resolutionQueue'][number] | null;
  choiceCards: { instance: DeltaDashCardInstance; definition: NonNullable<ReturnType<typeof getCardInstanceDefinition>> }[];
  selectedChoiceCardIds: string[];
  onToggleChoiceCard: (cardInstanceId: string) => void;
  onRevealNext: () => void;
  onResolveCurrent: () => void;
  onContinueCleanup: () => void;
  onSubmitChoice: (choice: DeltaDashPendingChoice) => void;
}) {
  const choice = state.pendingChoice;

  return (
    <section className="rounded-[2rem] border border-cyan-300/25 bg-cyan-500/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-cyan-200">{language === 'en' ? 'Phase flow' : '阶段流程'}</p>
          <p className="mt-1 text-sm font-black text-white">{formatTurnStep(state.turnStep, language)}</p>
        </div>
        {currentItem ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2 text-right text-xs text-cyan-100">
            <p className="font-black uppercase tracking-[0.16em]">{language === 'en' ? 'Current' : '当前'}</p>
            <p className="mt-1 text-white">{currentItem.cardDefinitionId ?? currentItem.action} · P{currentItem.priority}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[0.62rem] font-black uppercase tracking-[0.12em] sm:grid-cols-7">
        {(['planning', 'locked', 'reveal', 'choice', 'steward', 'cleanup', 'roundEnd'] as const).map((step) => (
          <span key={step} className={`rounded-full border px-2 py-1 ${state.turnStep === step ? 'border-cyan-200 bg-cyan-300 text-slate-950' : 'border-white/10 bg-white/5 text-slate-400'}`}>{formatTurnStep(step, language)}</span>
        ))}
      </div>
      {choice ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/45 p-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-100">{language === 'en' ? 'Input required' : '需要选择'}</p>
          {choice.kind === 'selectNumber' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: choice.max - choice.min + 1 }, (_, index) => choice.min + index).map((value) => (
                <button key={value} type="button" onClick={() => onSubmitChoice({ ...choice, selected: value })} className="rounded-full border border-yellow-300/35 bg-yellow-300/15 px-4 py-2 text-xs font-black text-yellow-100 transition hover:bg-yellow-300 hover:text-slate-950">
                  {value} MJ
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="mt-2 text-xs leading-5 text-slate-400">{choice.kind === 'handLimitDiscard' ? (language === 'en' ? `Discard ${choice.requiredCount} card(s).` : `弃置 ${choice.requiredCount} 张牌。`) : (language === 'en' ? `Select ${choice.min}-${choice.max} card(s).` : `选择 ${choice.min}-${choice.max} 张牌。`)}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {choiceCards.map(({ instance, definition }) => {
                  const selected = selectedChoiceCardIds.includes(instance.instanceId);
                  return (
                    <button key={instance.instanceId} type="button" onClick={() => onToggleChoiceCard(instance.instanceId)} className={`rounded-2xl border p-3 text-left text-xs transition ${selected ? 'border-yellow-200 bg-yellow-300/20 text-yellow-50' : 'border-white/10 bg-black/20 text-slate-300 hover:border-cyan-300/40'}`}>
                      <p className="font-black text-white">{definition.name[language]}</p>
                      <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">{definition.category} · P{definition.priority}</p>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => onSubmitChoice({ ...choice, selectedCardInstanceIds: selectedChoiceCardIds })} className="mt-3 rounded-full border border-lime-300/35 bg-lime-300/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-lime-100 transition hover:bg-lime-300 hover:text-slate-950">
                {language === 'en' ? 'Submit choice' : '提交选择'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onRevealNext} disabled={!currentItem || currentItem.status !== 'pending'} className="rounded-full border border-cyan-300/35 bg-cyan-300/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
            {language === 'en' ? 'Reveal next' : '揭示下一张'}
          </button>
          <button type="button" onClick={onResolveCurrent} disabled={Boolean(!currentItem || currentItem.status === 'pending')} className="rounded-full border border-lime-300/35 bg-lime-300/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-lime-100 transition hover:bg-lime-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
            {currentItem ? (language === 'en' ? 'Resolve current' : '结算当前') : (language === 'en' ? 'Finish resolution' : '完成结算')}
          </button>
          <button type="button" onClick={onContinueCleanup} disabled={state.turnStep !== 'cleanup'} className="rounded-full border border-orange-300/35 bg-orange-300/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-100 transition hover:bg-orange-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
            {language === 'en' ? 'Continue cleanup' : '继续清理'}</button>
        </div>
      )}
    </section>
  );
}

function formatTurnStep(step: DeltaDashMatchState['turnStep'], language: Language): string {
  const labels = {
    planning: { en: 'Planning', zh: '计划' },
    locked: { en: 'Locked', zh: '锁定' },
    reveal: { en: 'Reveal', zh: '揭示' },
    choice: { en: 'Choice', zh: '选择' },
    steward: { en: 'Steward', zh: '裁判' },
    cleanup: { en: 'Cleanup', zh: '清理' },
    roundEnd: { en: 'Round end', zh: '回合结束' },
  } satisfies Record<DeltaDashMatchState['turnStep'], Record<Language, string>>;
  return labels[step][language];
}

function TyrePalette({
  state,
  selectedCompound,
  language,
  onSelect,
  disabled,
}: {
  state: DeltaDashMatchState;
  selectedCompound: DeltaDashTyreCompound;
  language: Language;
  onSelect: (compound: DeltaDashTyreCompound) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TYRE_COMPOUNDS.map((compound) => {
        const pace = getTyrePacePreview(state, compound);
        const wear = getTyreWearPreview(state, compound);

        return (
          <button
            key={compound}
            type="button"
            onClick={() => onSelect(compound)}
            disabled={disabled || selectedCompound === compound}
            className={`rounded-2xl border px-3 py-2 text-left text-[0.65rem] font-black uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-55 ${getTyreClass(compound, selectedCompound === compound)}`}
          >
            <span className="block">{language === 'en' ? compound : getTyreLabel(compound)}</span>
            <span className="mt-1 block font-mono text-[0.6rem] normal-case tracking-normal text-white/85">{pace >= 0 ? '+' : ''}{pace.toFixed(2)}s · -{wear.toFixed(1)}%/lap</span>
          </button>
        );
      })}
    </div>
  );
}

function StartLights({ lightsOn }: { lightsOn: number }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((light) => (
        <div key={light} className={`h-8 flex-1 rounded-full border transition-all duration-200 ${lightsOn >= light ? 'border-red-200 bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.7)]' : 'border-white/10 bg-slate-900/80'}`} />
      ))}
    </div>
  );
}

function getTyreLabel(compound: DeltaDashTyreCompound): string {
  return {
    soft: '软胎',
    medium: '中性胎',
    hard: '硬胎',
    intermediate: '半雨胎',
    wet: '全雨胎',
  }[compound];
}
