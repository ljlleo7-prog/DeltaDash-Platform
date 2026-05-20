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
import { advanceLocalMatch, removeDeployedCard, type DeltaDashCardPlayInput } from '@/lib/deltadash/match-flow';
import { projectDeltaDashEvents } from '@/lib/deltadash/reducer';
import { createInitialMatchEvent } from '@/lib/deltadash/setup';
import { DEFAULT_REAL_TRACK_ID, REAL_TRACK_OPTIONS } from '@/lib/deltadash/track-catalog';
import { getHumanCar, getRankedCars } from '@/lib/deltadash/selectors';
import { loadStoredDeltaDashEvents, resetStoredDeltaDashEvents, saveStoredDeltaDashEvents } from '@/lib/deltadash/storage';
import type { DeltaDashEvent } from '@/lib/deltadash/types';

export function DeltadashPrototypePage() {
  const { language } = useLanguage();
  const [events, setEvents] = useState<DeltaDashEvent[]>([]);
  const [deploySlots, setDeploySlots] = useState<(DeltaDashCardPlayInput | null)[]>([null, null, null]);
  const [selectedTrackKey, setSelectedTrackKey] = useState(DEFAULT_REAL_TRACK_ID);
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
    const nextEvents = [createInitialMatchEvent(selectedTrackKey)];
    setDeploySlots([null, null, null]);
    setEvents(nextEvents);
    saveStoredDeltaDashEvents(nextEvents);
  }

  function resetMatch() {
    resetStoredDeltaDashEvents();
    setDeploySlots([null, null, null]);
    setEvents([]);
  }

  function handleTrackChange(trackKey: string) {
    const nextEvents = [createInitialMatchEvent(trackKey)];
    setDeploySlots([null, null, null]);
    setEvents(nextEvents);
    saveStoredDeltaDashEvents(nextEvents);
  }

  function queueCard(cardDefinitionId: string, cardInstanceId?: string) {
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
              ? 'Create a deterministic short race with one human car and three simple bots.'
              : '创建一场确定性的短赛：一辆玩家赛车对阵三辆简单机器人。'}
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
            driverConsole={<DriverConsolePanel state={state} humanCar={humanCar} language={language} deploySlots={deploySlots} onUpdateDeploySlot={updateDeploySlot} onConfirmDeploy={commitHumanCards} onRemoveDeployedCard={removeHumanDeployedCard} />}
          />
          <AssetGallery language={language} />
        </>
      )}
    </div>
  );
}
