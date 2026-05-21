'use client';

import { useEffect, useMemo, useState } from 'react';
import { AssetGallery } from '@/components/deltadash/asset-gallery';
import { CardRailPanel } from '@/components/deltadash/card-rail-panel';
import { DriverConsolePanel } from '@/components/deltadash/driver-console-panel';
import { PlayCockpitLayout } from '@/components/deltadash/play-cockpit-layout';
import { RaceControlPanel } from '@/components/deltadash/race-control-panel';
import { StandingsPanel } from '@/components/deltadash/standings-panel';
import { TrackTimelinePanel } from '@/components/deltadash/track-timeline-panel';
import { useLanguage } from '@/components/language-provider';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { advanceLocalMatch, createRaceStartEvents, enterPitLane, exitPitLaneAndAdvance, removeDeployedCard, updatePitService, type DeltaDashCardPlayInput, type DeltaDashPitServiceInput } from '@/lib/deltadash/match-flow';
import { projectDeltaDashEvents } from '@/lib/deltadash/reducer';
import { createInitialMatchEvent, DELTADASH_PLAYER_COUNT_OPTIONS } from '@/lib/deltadash/setup';
import { DEFAULT_REAL_TRACK_ID, REAL_TRACK_OPTIONS } from '@/lib/deltadash/track-catalog';
import { getHumanCar, getRankedCars } from '@/lib/deltadash/selectors';
import { loadStoredDeltaDashEvents, resetStoredDeltaDashEvents, saveStoredDeltaDashEvents } from '@/lib/deltadash/storage';
import type { DeltaDashEvent, DeltaDashTyreCompound } from '@/lib/deltadash/types';

export function DeltadashPrototypePage() {
  const { language } = useLanguage();
  const [events, setEvents] = useState<DeltaDashEvent[]>([]);
  const [deploySlots, setDeploySlots] = useState<(DeltaDashCardPlayInput | null)[]>([null, null, null]);
  const [selectedTrackKey, setSelectedTrackKey] = useState(DEFAULT_REAL_TRACK_ID);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(4);
  const [startingLightsOn, setStartingLightsOn] = useState(0);
  const state = useMemo(() => projectDeltaDashEvents(events), [events]);
  const rankedCars = state ? getRankedCars(state) : [];
  const humanCar = state ? getHumanCar(state) : null;
  const recentEvents = events.slice(-10).reverse();
  const latestStewardNote = state?.stewardNotes.at(-1) ?? null;

  useEffect(() => {
    setEvents(loadStoredDeltaDashEvents());
  }, []);

  useEffect(() => {
    if (events.length) saveStoredDeltaDashEvents(events);
  }, [events]);

  useEffect(() => {
    if (!state || !humanCar) return;
    setDeploySlots((current) => current.map((slot) => {
      if (!slot) return null;
      const cardStillInHand = (state.cards ?? []).some((card) => card.ownerCarId === humanCar.id && card.definitionId === slot.cardDefinitionId && card.zone === 'hand' && (!slot.cardInstanceId || card.instanceId === slot.cardInstanceId));
      return cardStillInHand ? slot : null;
    }));
  }, [state, humanCar]);

  function startNewMatch() {
    const nextEvents = [createInitialMatchEvent(selectedTrackKey, selectedPlayerCount)];
    setDeploySlots([null, null, null]);
    setStartingLightsOn(0);
    setEvents(nextEvents);
    saveStoredDeltaDashEvents(nextEvents);
  }

  function resetMatch() {
    resetStoredDeltaDashEvents();
    setDeploySlots([null, null, null]);
    setStartingLightsOn(0);
    setEvents([]);
  }

  function handleTrackChange(trackKey: string) {
    const nextEvents = [createInitialMatchEvent(trackKey)];
    setDeploySlots([null, null, null]);
    setStartingLightsOn(0);
    setEvents(nextEvents);
    saveStoredDeltaDashEvents(nextEvents);
  }

  function queueCard(cardDefinitionId: string, cardInstanceId?: string) {
    if (state?.racePhase !== 'live' || humanCar?.pitState.status === 'servicing') return;
    setDeploySlots((current) => {
      const next = [...current];
      const emptyIndex = next.findIndex((slot) => !slot);
      if (emptyIndex === -1) return current;
      next[emptyIndex] = { cardDefinitionId, cardInstanceId, targetCarIds: [] };
      return next;
    });
  }

  function updateDeploySlot(slotIndex: number, slot: DeltaDashCardPlayInput | null) {
    setDeploySlots((current) => current.map((currentSlot, index) => index === slotIndex ? slot : currentSlot));
  }

  function commitHumanCards() {
    if (state?.racePhase !== 'live' || humanCar?.pitState.status === 'servicing') return;
    const nextEvents = advanceLocalMatch(events, deploySlots.filter((slot): slot is DeltaDashCardPlayInput => Boolean(slot)));
    if (!nextEvents.length) return;
    setEvents((currentEvents) => [...currentEvents, ...nextEvents]);
    setDeploySlots([null, null, null]);
  }

  function removeHumanDeployedCard(cardInstanceId: string) {
    const nextEvents = removeDeployedCard(events, cardInstanceId);
    if (!nextEvents.length) return;
    setEvents((currentEvents) => [...currentEvents, ...nextEvents]);
  }

  function selectHumanTyre(compound: DeltaDashTyreCompound) {
    if (!state || !humanCar || state.racePhase !== 'preparation' || humanCar.tyreState.compound === compound) return;
    setEvents((currentEvents) => [...currentEvents, { type: 'TYRE_SELECTED', round: state.round, carId: humanCar.id, compound }]);
  }

  function startRace() {
    if (!state || state.racePhase !== 'preparation' || startingLightsOn > 0) return;

    [1, 2, 3, 4, 5].forEach((light) => {
      window.setTimeout(() => setStartingLightsOn(light), (light - 1) * 260);
    });
    window.setTimeout(() => {
      setStartingLightsOn(0);
      const startEvents = createRaceStartEvents(events);
      if (!startEvents.length) return;
      setEvents((currentEvents) => {
        const nextEvents = [...currentEvents, ...createRaceStartEvents(currentEvents)];
        saveStoredDeltaDashEvents(nextEvents);
        return nextEvents;
      });
    }, 1560);
  }

  function enterHumanPit() {
    if (!humanCar) return;
    const pitEvents = enterPitLane(events, humanCar.id);
    if (!pitEvents.length) return;
    setDeploySlots([null, null, null]);
    setEvents((currentEvents) => [...currentEvents, ...pitEvents]);
  }

  function updateHumanPitService(service: DeltaDashPitServiceInput) {
    if (!humanCar) return;
    const pitEvents = updatePitService(events, humanCar.id, service);
    if (!pitEvents.length) return;
    setEvents((currentEvents) => [...currentEvents, ...pitEvents]);
  }

  function exitHumanPit() {
    if (!humanCar) return;
    const nextEvents = exitPitLaneAndAdvance(events, humanCar.id);
    if (!nextEvents.length) return;
    setEvents((currentEvents) => [...currentEvents, ...nextEvents]);
    setDeploySlots([null, null, null]);
  }

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '本地试玩',
            title: 'Delta Dash 本地优先原型',
            description: '单浏览器事件日志原型：人类玩家对阵机器人，所有状态由本地事件回放生成。',
          },
          en: {
            eyebrow: 'Local Prototype',
            title: 'Delta Dash local-first prototype',
            description: 'A single-browser event-log prototype: human vs bots, with all state projected from local events.',
          },
        }}
      />

      <section className="rounded-3xl border border-cyan-300/20 bg-cyan-500/10 p-5 text-sm leading-6 text-cyan-50">
        {language === 'en'
          ? 'This prototype is saved only in this browser through localStorage. It is intentionally offline-first and can later become the replayable core for online sync.'
          : '此原型只通过 localStorage 保存在当前浏览器中。它刻意采用离线优先结构，之后可扩展为在线同步的可回放核心。'}
      </section>

      {!state ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Start a local race' : '开始本地比赛'}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {language === 'en'
              ? `Create a deterministic short race with one human car and ${selectedPlayerCount - 1} bot cars.`
              : `创建一场确定性的短赛：一辆玩家赛车对阵 ${selectedPlayerCount - 1} 辆机器人赛车。`}
          </p>
          <label className="mt-5 block text-xs font-black uppercase tracking-[0.18em] text-cyan-200" htmlFor="deltadash-player-count-select">
            {language === 'en' ? 'Players' : '玩家数量'}
          </label>
          <select
            id="deltadash-player-count-select"
            value={selectedPlayerCount}
            onChange={(event) => setSelectedPlayerCount(Number(event.target.value))}
            className="mt-2 w-full rounded-2xl border border-cyan-300/25 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-200"
          >
            {DELTADASH_PLAYER_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {language === 'en' ? `${count} players` : `${count} 名玩家`}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {language === 'en'
              ? `${DELTADASH_PLAYER_COUNT_OPTIONS.at(-1)} prototype drivers available; extra drivers reuse current visual cards until new art is added.`
              : `目前可选 ${DELTADASH_PLAYER_COUNT_OPTIONS.at(-1)} 名原型车手；新增车手会复用现有视觉卡，直到加入新美术。`}
          </p>
          <label className="mt-5 block text-xs font-black uppercase tracking-[0.18em] text-cyan-200" htmlFor="deltadash-track-select">
            {language === 'en' ? 'Circuit' : '赛道'}
          </label>
          <select
            id="deltadash-track-select"
            value={selectedTrackKey}
            onChange={(event) => setSelectedTrackKey(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-cyan-300/25 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-200"
          >
            {REAL_TRACK_OPTIONS.map((track) => (
              <option key={track.key} value={track.key}>
                {track.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {language === 'en'
              ? `${REAL_TRACK_OPTIONS.length} real circuit profiles loaded from Box This Lap telemetry.`
              : `已载入 ${REAL_TRACK_OPTIONS.length} 条来自 Box This Lap 遥测的真实赛道轮廓。`}
          </p>
          <button type="button" onClick={startNewMatch} className="mt-5 rounded-full border border-[var(--accent-hot)]/35 bg-[rgba(85,199,255,0.08)] px-5 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]">
            {language === 'en' ? 'New local match' : '新建本地比赛'}
          </button>
        </section>
      ) : (
        <>
          <PlayCockpitLayout
            language={language}
            cardRail={<CardRailPanel state={state} humanCar={humanCar} language={language} queuedCardInstanceIds={deploySlots.flatMap((slot) => slot?.cardInstanceId ? [slot.cardInstanceId] : [])} onQueueCard={queueCard} />}
            standings={<StandingsPanel state={state} rankedCars={rankedCars} language={language} onReset={resetMatch} onTrackChange={handleTrackChange} />}
            timeline={<TrackTimelinePanel state={state} language={language} />}
            raceControl={<RaceControlPanel latestNote={latestStewardNote} events={recentEvents} language={language} />}
            driverConsole={<DriverConsolePanel state={state} humanCar={humanCar} language={language} deploySlots={deploySlots} onUpdateDeploySlot={updateDeploySlot} onConfirmDeploy={commitHumanCards} onRemoveDeployedCard={removeHumanDeployedCard} onSelectTyre={selectHumanTyre} onStartRace={startRace} startingLightsOn={startingLightsOn} onEnterPit={enterHumanPit} onUpdatePitService={updateHumanPitService} onExitPit={exitHumanPit} />}
          />
          <AssetGallery language={language} />
        </>
      )}
    </div>
  );
}
