'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/components/language-provider';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { chooseBotAction } from '@/lib/deltadash/bot-policy';
import { resolveAction, projectDeltaDashEvents } from '@/lib/deltadash/reducer';
import { createInitialMatchEvent } from '@/lib/deltadash/setup';
import { getCommitment, getFinishSummary, getHumanCar, getMissingCommitmentCarIds, getRankedCars, isMatchFinished } from '@/lib/deltadash/selectors';
import { loadStoredDeltaDashEvents, resetStoredDeltaDashEvents, saveStoredDeltaDashEvents } from '@/lib/deltadash/storage';
import { runStewardReview } from '@/lib/deltadash/steward-policy';
import type { DeltaDashActionType, DeltaDashEvent } from '@/lib/deltadash/types';

const actionCopy: Record<DeltaDashActionType, { zh: string; en: string; description: { zh: string; en: string } }> = {
  steady: {
    zh: '稳定推进',
    en: 'Steady',
    description: { zh: '+3 进度，+1 电量，-1 轮胎。黄旗/限速下 +2。', en: '+3 progress, +1 energy, -1 tire. +2 under yellow/speed cap.' },
  },
  push: {
    zh: '强推',
    en: 'Push',
    description: { zh: '+5 进度，-2 电量，-2 轮胎，增加事故风险。', en: '+5 progress, -2 energy, -2 tire, higher incident risk.' },
  },
  defend: {
    zh: '防守',
    en: 'Defend',
    description: { zh: '+2 进度，保守通过本回合。', en: '+2 progress with safer race posture.' },
  },
  recover: {
    zh: '回收',
    en: 'Recover',
    description: { zh: '+1 进度，+2 电量，+1 轮胎。', en: '+1 progress, +2 energy, +1 tire.' },
  },
};

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

  function appendEvents(nextEvents: DeltaDashEvent[]) {
    setEvents((currentEvents) => [...currentEvents, ...nextEvents]);
  }

  function startNewMatch() {
    const nextEvents = [createInitialMatchEvent()];
    setEvents(nextEvents);
    saveStoredDeltaDashEvents(nextEvents);
  }

  function resetMatch() {
    resetStoredDeltaDashEvents();
    setEvents([]);
  }

  function commitHumanAction(action: DeltaDashActionType) {
    if (!state || state.phase === 'finished') return;

    const humanCar = getHumanCar(state);
    if (!humanCar || humanCar.retired) return;

    const humanEvent: DeltaDashEvent = {
      type: 'ACTION_COMMITTED',
      round: state.round,
      carId: humanCar.id,
      action,
    };

    const stateAfterHuman = projectDeltaDashEvents([...events, humanEvent]);
    if (!stateAfterHuman) return;

    const botEvents: DeltaDashEvent[] = stateAfterHuman.players
      .filter((player) => player.kind === 'bot')
      .flatMap((player) => {
        const car = stateAfterHuman.cars.find((candidate) => candidate.id === player.carId);
        if (!car || car.retired) return [];

        return [{
          type: 'ACTION_COMMITTED' as const,
          round: stateAfterHuman.round,
          carId: car.id,
          action: chooseBotAction(stateAfterHuman, car),
        }];
      });

    const committedState = projectDeltaDashEvents([...events, humanEvent, ...botEvents]);
    if (!committedState || getMissingCommitmentCarIds(committedState).length) {
      appendEvents([humanEvent, ...botEvents]);
      return;
    }

    const yellowFlag = committedState.flag === 'yellow';
    const results = committedState.commitments.map((commitment) => {
      const car = committedState.cars.find((candidate) => candidate.id === commitment.carId);
      return car ? resolveAction(car, commitment.action, yellowFlag) : null;
    }).filter((result): result is NonNullable<typeof result> => Boolean(result));

    const lockedEvent: DeltaDashEvent = { type: 'COMMITMENTS_LOCKED', round: committedState.round };
    const resolvedEvent: DeltaDashEvent = { type: 'ACTIONS_RESOLVED', round: committedState.round, results };
    const resolvedState = projectDeltaDashEvents([...events, humanEvent, ...botEvents, lockedEvent, resolvedEvent]);
    if (!resolvedState) return;

    const review = runStewardReview(resolvedState);
    const reviewedEvent: DeltaDashEvent = {
      type: 'STEWARD_REVIEWED',
      round: resolvedState.round,
      notes: review.notes,
      flag: review.flag,
    };
    const reviewedState = projectDeltaDashEvents([...events, humanEvent, ...botEvents, lockedEvent, resolvedEvent, reviewedEvent]);
    if (!reviewedState) return;

    const roundEndEvent: DeltaDashEvent = { type: 'ROUND_ENDED', round: reviewedState.round };
    const nextState = projectDeltaDashEvents([...events, humanEvent, ...botEvents, lockedEvent, resolvedEvent, reviewedEvent, roundEndEvent]);
    if (!nextState) return;

    const finishingEvents: DeltaDashEvent[] = isMatchFinished(nextState)
      ? [{ type: 'MATCH_FINISHED', round: nextState.round }]
      : [{ type: 'ROUND_STARTED', round: nextState.round + 1 }];

    appendEvents([humanEvent, ...botEvents, lockedEvent, resolvedEvent, reviewedEvent, roundEndEvent, ...finishingEvents]);
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
          <section className="grid gap-4 lg:grid-cols-4">
            <StatusCard label={language === 'en' ? 'Round' : '回合'} value={String(state.round)} />
            <StatusCard label={language === 'en' ? 'Phase' : '阶段'} value={state.phase} />
            <StatusCard label={language === 'en' ? 'Flag' : '旗况'} value={state.flag.toUpperCase()} />
            <StatusCard label={language === 'en' ? 'Finish' : '终点'} value={`${state.track.finishProgress}`} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Classification' : '比赛排名'}</h2>
                <button type="button" onClick={resetMatch} className="rounded-full border border-red-300/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/20">
                  {language === 'en' ? 'Reset prototype' : '重置原型'}
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {rankedCars.map((car) => {
                  const owner = state.players.find((player) => player.carId === car.id);
                  const commitment = getCommitment(state, car.id);
                  const progressPercent = Math.min(100, (car.progress / state.track.finishProgress) * 100);

                  return (
                    <article key={car.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">#{car.rank} {car.name}</p>
                          <p className="text-xs text-slate-500">{owner?.kind === 'human' ? (language === 'en' ? 'Human' : '玩家') : (language === 'en' ? 'Bot' : '机器人')}</p>
                        </div>
                        <div className="text-right text-xs text-slate-300">
                          <p>{language === 'en' ? 'Energy' : '电量'} {car.energy}/6 · {language === 'en' ? 'Tire' : '轮胎'} {car.tire}/6</p>
                          <p>{language === 'en' ? 'Last' : '上回合'}: {car.lastAction ?? '-'}</p>
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-cold),var(--accent-hot))]" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span>{language === 'en' ? 'Progress' : '进度'} {car.progress}/{state.track.finishProgress}</span>
                        <span>{language === 'en' ? 'Committed' : '已提交'}: {commitment?.action ?? '-'}</span>
                        {car.penalties.map((penalty) => <span key={penalty} className="rounded-full border border-yellow-300/20 bg-yellow-500/10 px-2 py-1 text-yellow-100">{penalty}</span>)}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Your action' : '你的行动'}</h2>
                {state.phase === 'finished' ? (
                  <p className="mt-3 text-sm leading-6 text-slate-300">{getFinishSummary(state)}</p>
                ) : humanCar?.retired ? (
                  <p className="mt-3 text-sm leading-6 text-red-100">{language === 'en' ? 'Your car has retired.' : '你的赛车已经退赛。'}</p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {(Object.keys(actionCopy) as DeltaDashActionType[]).map((action) => (
                      <button key={action} type="button" onClick={() => commitHumanAction(action)} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-[var(--accent-cold)]/45 hover:bg-black/35">
                        <p className="text-sm font-semibold text-white">{actionCopy[action][language]}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-400">{actionCopy[action].description[language]}</p>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Steward' : '赛会干事'}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{latestStewardNote?.message ?? (language === 'en' ? 'No steward review yet.' : '暂无赛会判定。')}</p>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Recent event log' : '近期事件日志'}</h2>
                <div className="mt-4 space-y-2 text-xs text-slate-400">
                  {recentEvents.map((event, index) => (
                    <p key={`${event.type}-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      {describeEvent(event)}
                    </p>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}

function describeEvent(event: DeltaDashEvent) {
  switch (event.type) {
    case 'MATCH_CREATED':
      return 'MATCH_CREATED · local event log initialized';
    case 'ACTION_COMMITTED':
      return `ACTION_COMMITTED · ${event.carId} chose ${event.action}`;
    case 'ACTIONS_RESOLVED':
      return `ACTIONS_RESOLVED · ${event.results.length} cars updated`;
    case 'STEWARD_REVIEWED':
      return `STEWARD_REVIEWED · ${event.notes.length} note(s), flag ${event.flag}`;
    case 'ROUND_STARTED':
      return `ROUND_STARTED · round ${event.round}`;
    case 'ROUND_ENDED':
      return `ROUND_ENDED · round ${event.round}`;
    case 'MATCH_FINISHED':
      return `MATCH_FINISHED · round ${event.round}`;
    case 'COMMITMENTS_LOCKED':
      return `COMMITMENTS_LOCKED · round ${event.round}`;
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}
