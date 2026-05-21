import { useEffect } from 'react';
import type { Language } from '@/lib/i18n';
import { getCardInstanceDefinition, getCardsForCar, getCardInstancesForCar } from '@/lib/deltadash/card-selectors';
import type { DeltaDashCardPlayInput, DeltaDashPitServiceInput } from '@/lib/deltadash/match-flow';
import { getDefaultTargetCarIds, getValidTargetCars, normalizeTargetCarIds } from '@/lib/deltadash/targeting';
import type { DeltaDashCar, DeltaDashMatchState, DeltaDashTyreCompound } from '@/lib/deltadash/types';
import { CardDeployPanel } from './card-deploy-panel';

const TYRE_COMPOUNDS: DeltaDashTyreCompound[] = ['soft', 'medium', 'hard', 'intermediate', 'wet'];

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
  const controlsLocked = state.racePhase !== 'live' || humanCar?.pitState.status === 'servicing';
  const pitCompound = humanCar?.pitState.pendingCompound ?? humanCar?.tyreState.compound ?? 'medium';

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
            <TyrePalette selectedCompound={humanCar?.tyreState.compound ?? 'medium'} language={language} onSelect={onSelectTyre} disabled={!humanCar || startingLightsOn > 0} />
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
            <TyrePalette selectedCompound={pitCompound} language={language} onSelect={(compound) => onUpdatePitService({ compound, repairSelected: Boolean(humanCar?.pitState.repairSelected) })} disabled={!humanCar} />
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
      {controlsLocked ? (
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-4 text-xs leading-5 text-slate-400">
          {state.racePhase === 'preparation'
            ? (language === 'en' ? 'Card deployment unlocks after the start lights go out.' : '发车灯熄灭后才能部署卡牌。')
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

function TyrePalette({
  selectedCompound,
  language,
  onSelect,
  disabled,
}: {
  selectedCompound: DeltaDashTyreCompound;
  language: Language;
  onSelect: (compound: DeltaDashTyreCompound) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TYRE_COMPOUNDS.map((compound) => (
        <button
          key={compound}
          type="button"
          onClick={() => onSelect(compound)}
          disabled={disabled || selectedCompound === compound}
          className={`rounded-full border px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-55 ${getTyreClass(compound, selectedCompound === compound)}`}
        >
          {language === 'en' ? compound : getTyreLabel(compound)}
        </button>
      ))}
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
