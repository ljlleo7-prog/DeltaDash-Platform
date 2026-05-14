'use client';

import { useEffect, useMemo, useState } from 'react';
import { AssetGallery } from '@/components/deltadash/asset-gallery';
import { CardHandPanel } from '@/components/deltadash/card-hand-panel';
import { ClassificationList } from '@/components/deltadash/classification-list';
import { EventLogPanel } from '@/components/deltadash/event-log-panel';
import { RaceStatusGrid } from '@/components/deltadash/race-status-grid';
import { StewardPanel } from '@/components/deltadash/steward-panel';
import { useLanguage } from '@/components/language-provider';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { advanceLocalMatch } from '@/lib/deltadash/match-flow';
import { projectDeltaDashEvents } from '@/lib/deltadash/reducer';
import { createInitialMatchEvent } from '@/lib/deltadash/setup';
import { getHumanCar, getRankedCars } from '@/lib/deltadash/selectors';
import { loadStoredDeltaDashEvents, resetStoredDeltaDashEvents, saveStoredDeltaDashEvents } from '@/lib/deltadash/storage';
import type { DeltaDashEvent } from '@/lib/deltadash/types';

export function DeltadashPrototypePage() {
  const { language } = useLanguage();
  const [events, setEvents] = useState<DeltaDashEvent[]>([]);
  const state = useMemo(() => projectDeltaDashEvents(events), [events]);

  useEffect(() => {
    setEvents(loadStoredDeltaDashEvents());
  }, []);

  useEffect(() => {
    if (events.length) saveStoredDeltaDashEvents(events);
  }, [events]);

  function startNewMatch() {
    const nextEvents = [createInitialMatchEvent()];
    setEvents(nextEvents);
    saveStoredDeltaDashEvents(nextEvents);
  }

  function resetMatch() {
    resetStoredDeltaDashEvents();
    setEvents([]);
  }

  function commitHumanCard(cardDefinitionId: string) {
    const nextEvents = advanceLocalMatch(events, cardDefinitionId);
    if (!nextEvents.length) return;
    setEvents((currentEvents) => [...currentEvents, ...nextEvents]);
  }

  const rankedCars = state ? getRankedCars(state) : [];
  const humanCar = state ? getHumanCar(state) : null;
  const recentEvents = events.slice(-10).reverse();
  const latestStewardNote = state?.stewardNotes.at(-1) ?? null;

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
          <button type="button" onClick={startNewMatch} className="mt-5 rounded-full border border-[var(--accent-hot)]/35 bg-[rgba(85,199,255,0.08)] px-5 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]">
            {language === 'en' ? 'New local match' : '新建本地比赛'}
          </button>
        </section>
      ) : (
        <>
          <RaceStatusGrid state={state} language={language} />
          <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <ClassificationList state={state} rankedCars={rankedCars} language={language} onReset={resetMatch} />
            <div className="space-y-6">
              <CardHandPanel state={state} humanCar={humanCar} language={language} onCard={commitHumanCard} />
              <StewardPanel latestNote={latestStewardNote} language={language} />
              <EventLogPanel events={recentEvents} language={language} />
            </div>
          </section>
          <AssetGallery language={language} />
        </>
      )}
    </div>
  );
}
