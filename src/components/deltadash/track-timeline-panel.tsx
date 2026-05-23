import type { Language } from '@/lib/i18n';
import { formatTimeGap, getCarPresentation, getDriverStatusVisuals, getResolutionLanes, getTimelineCars, getTrackStats, type DeltaDashResolutionLane } from '@/lib/deltadash/selectors';
import type { DeltaDashMatchState } from '@/lib/deltadash/types';
import { getRealTrackData } from '@/lib/deltadash/track-catalog';
import { CardFace } from './card-play-card';

const TRACK_RADIUS = 140;
const CENTER = 200;

export function TrackTimelinePanel({ state, language }: { state: DeltaDashMatchState; language: Language }) {
  const timelineCars = getTimelineCars(state);
  const trackStats = getTrackStats(state);
  const tyreCurveCopy = {
    gentle: language === 'en' ? 'Gentle curve' : '温和曲线',
    balanced: language === 'en' ? 'Balanced curve' : '均衡曲线',
    aggressive: language === 'en' ? 'Aggressive curve' : '激进曲线',
  }[trackStats.tyreCurveLabel];

  const realTrack = getRealTrackData(state.track.realTrackKey ?? state.track.id);
  const resolutionLanes = getResolutionLanes(state);
  const activeResolutionCarId = resolutionLanes.find((lane) => lane.active)?.car.id ?? null;
  const humanCarId = state.players.find((player) => player.kind === 'human')?.carId ?? null;

  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-cyan-200/25 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.72),rgba(30,41,59,0.5))] p-4 lg:p-5">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200">{language === 'en' ? 'Circuit time map' : '赛道时间图'}</p>
          <h3 className="mt-1 text-3xl font-black italic text-white">{state.track.name}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TrackStat label={language === 'en' ? 'Sky' : '天空'} value={formatSky(trackStats.skyLabel, language)} tone="blue" />
          <TrackStat label={language === 'en' ? 'Wetness' : '湿度'} value={`${trackStats.trackWetnessPercent}%`} tone="cyan" />
          <TrackStat label={language === 'en' ? 'Grip' : '抓地'} value={`${trackStats.surfaceGripPercent}%`} tone="lime" />
          <TrackStat label={language === 'en' ? 'Finish' : '终点'} value={`${trackStats.finishSeconds.toFixed(1)}s`} tone="yellow" />
        </div>
      </div>

      <div className="relative z-10 mt-6 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative flex items-center justify-center rounded-[2rem] border border-white/10 bg-slate-950/20 p-4 lg:p-5">
          <svg width="400" height="400" viewBox="0 0 400 400" className="max-w-full" role="img" aria-label="Delta Dash circular track">
            {/* Base track circle */}
            <circle cx={CENTER} cy={CENTER} r={TRACK_RADIUS} fill="none" stroke="rgba(30,41,59,0.6)" strokeWidth="16" />

            {/* Colored sector segments */}
            {realTrack.sectors.map((sector, idx) => {
              const circumference = 2 * Math.PI * TRACK_RADIUS;
              const sectorLength = (sector.endPercent - sector.startPercent) * circumference;
              const gapLength = circumference - sectorLength;
              const dashOffset = circumference * 0.25 - sector.startPercent * circumference;

              const color =
                sector.type === 'corner_low_speed' ? '#ef4444' :
                sector.type === 'corner_medium_speed' ? '#f97316' :
                sector.type === 'corner_high_speed' ? '#fbbf24' :
                '#22c55e';

              return (
                <circle
                  key={`sector-${idx}`}
                  cx={CENTER}
                  cy={CENTER}
                  r={TRACK_RADIUS}
                  fill="none"
                  stroke={color}
                  strokeWidth="10"
                  strokeDasharray={`${sectorLength} ${gapLength}`}
                  strokeDashoffset={dashOffset}
                  opacity="0.85"
                />
              );
            })}

            {/* Start/finish line */}
            <line x1={CENTER} y1={CENTER - TRACK_RADIUS - 12} x2={CENTER} y2={CENTER - TRACK_RADIUS + 12} stroke="#fff" strokeWidth="3" />

            {/* Time-delta indicator */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={TRACK_RADIUS + 8}
              fill="none"
              stroke="rgba(250,204,21,0.4)"
              strokeWidth="2"
              strokeDasharray={`${(timelineCars[0]?.timelinePercent ?? 0) / 100 * 2 * Math.PI * (TRACK_RADIUS + 8)} ${2 * Math.PI * (TRACK_RADIUS + 8)}`}
              strokeDashoffset={2 * Math.PI * (TRACK_RADIUS + 8) * 0.25}
            />

            {/* Driver tokens */}
            {timelineCars.map((car) => {
              const timeDelta = car.timelinePercent / 100;
              const angle = timeDelta * 2 * Math.PI - Math.PI / 2;
              const x = CENTER + TRACK_RADIUS * Math.cos(angle);
              const y = CENTER + TRACK_RADIUS * Math.sin(angle);

              return (
                <g key={car.id}>
                  <circle cx={x} cy={y} r={car.id === activeResolutionCarId ? 12 : 8} fill={car.id === humanCarId ? '#fbbf24' : '#22d3ee'} stroke={car.id === activeResolutionCarId ? '#fef08a' : '#000'} strokeWidth={car.id === activeResolutionCarId ? 4 : 2} className={car.id === activeResolutionCarId ? 'animate-pulse' : ''} />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill="#000" fontSize="10" fontWeight="bold">
                    {car.rank}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            <g transform="translate(10, 360)">
              <rect x="0" y="0" width="10" height="10" fill="#ef4444" rx="2" />
              <text x="14" y="8" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                {language === 'en' ? 'Slow' : '慢弯'}
              </text>
              <rect x="60" y="0" width="10" height="10" fill="#f97316" rx="2" />
              <text x="74" y="8" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                {language === 'en' ? 'Med' : '中弯'}
              </text>
              <rect x="115" y="0" width="10" height="10" fill="#fbbf24" rx="2" />
              <text x="129" y="8" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                {language === 'en' ? 'Fast' : '快弯'}
              </text>
              <rect x="170" y="0" width="10" height="10" fill="#22c55e" rx="2" />
              <text x="184" y="8" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                {language === 'en' ? 'Straight mode' : '直道模式'}
              </text>
            </g>
          </svg>

          {/* Car info overlay */}
          <div className="absolute bottom-4 left-4 right-4 grid max-h-28 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
            {timelineCars.map((car) => {
              const presentation = getCarPresentation(car);
              const isHumanCar = car.id === humanCarId;
              return (
                <div key={car.id} className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/80 px-2 py-1.5 text-xs">
                  <span className={`grid h-5 w-5 place-items-center rounded-lg text-[0.65rem] font-black ${isHumanCar ? 'bg-yellow-300 text-slate-950' : 'bg-cyan-400 text-slate-950'}`}>
                    {car.rank}
                  </span>
                  <span className="font-black text-white">{presentation.name}</span>
                  <span className="font-mono text-cyan-100">{formatTimeGap(car.gapToLeader)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">{language === 'en' ? 'Track telemetry' : '赛道遥测'}</p>
          <div className="mt-4 space-y-3">
            <TelemetryBar label={language === 'en' ? 'Tyre stress' : '轮胎压力'} value={`${trackStats.tyreStressPercent}%`} percent={trackStats.tyreStressPercent} />
            <TelemetryBar label={language === 'en' ? 'Wet track' : '赛道湿度'} value={`${trackStats.trackWetnessPercent}%`} percent={trackStats.trackWetnessPercent} />
            <TelemetryBar label={language === 'en' ? 'Rain intensity' : '雨强'} value={`${trackStats.rainMm.toFixed(1)}mm`} percent={Math.min(100, trackStats.rainMm * 20)} />
          </div>
          <div className="mt-4 rounded-2xl border border-orange-300/20 bg-orange-400/10 p-3">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-orange-100">{language === 'en' ? 'Tyre model' : '轮胎模型'}</p>
            <p className="mt-1 text-sm font-black text-white">{tyreCurveCopy}</p>
            <p className="mt-2 text-xs leading-5 text-orange-50/75">
              {language === 'en'
                ? `Base wear/lap ${trackStats.tyreWearLabel}. Degradation starts near ${trackStats.degradationCurveLabel}.`
                : `单圈基础磨损 ${trackStats.tyreWearLabel}。性能衰退约从 ${trackStats.degradationCurveLabel} 开始。`}
            </p>
            <p className="mt-2 text-xs leading-5 text-orange-50/75">
              {language === 'en'
                ? `${formatTemperature(trackStats.temperatureLabel, language)} session · dry grip ${trackStats.drySurfaceGripPercent}% · ${trackStats.skyLabel === 'clear' ? 'rain locked out for this race.' : 'weather changes gradually between rounds.'}`
                : `${formatTemperature(trackStats.temperatureLabel, language)}赛段 · 干地抓地 ${trackStats.drySurfaceGripPercent}% · ${trackStats.skyLabel === 'clear' ? '本场锁定无雨。' : '天气会在回合间缓慢变化。'}`}
            </p>
          </div>
        </div>
      </div>

      <ResolutionStage lanes={resolutionLanes} state={state} language={language} />
    </section>
  );
}

function ResolutionStage({ lanes, state, language }: { lanes: DeltaDashResolutionLane[]; state: DeltaDashMatchState; language: Language }) {
  if (!state.resolutionQueue.length && state.turnStep === 'planning') return null;

  return (
    <div className="relative z-10 mt-5 rounded-[2rem] border border-cyan-200/20 bg-slate-950/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">{language === 'en' ? 'Resolution stage' : '结算舞台'}</p>
          <h3 className="mt-1 text-xl font-black italic text-white">{language === 'en' ? 'Cards on track' : '赛道卡牌'}</h3>
        </div>
        <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
          {language === 'en' ? `Step ${Math.min(state.resolutionIndex + 1, state.resolutionQueue.length)}/${state.resolutionQueue.length || 1}` : `步骤 ${Math.min(state.resolutionIndex + 1, state.resolutionQueue.length)}/${state.resolutionQueue.length || 1}`}
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {lanes.map((lane) => (
          <ResolutionLane key={lane.car.id} lane={lane} state={state} language={language} humanCarId={state.players.find((player) => player.kind === 'human')?.carId ?? null} />
        ))}
      </div>
    </div>
  );
}

function ResolutionLane({ lane, state, language, humanCarId }: { lane: DeltaDashResolutionLane; state: DeltaDashMatchState; language: Language; humanCarId: string | null }) {
  const status = getDriverStatusVisuals(state, lane.car);
  const current = lane.currentItem ?? lane.latestResolvedItem ?? lane.items[0] ?? null;
  const latestDiscard = lane.discardedCards[0];

  return (
    <article className={`grid gap-3 rounded-3xl border p-3 transition md:grid-cols-[190px_minmax(220px,1fr)_150px] ${lane.active ? 'border-cyan-200/70 bg-cyan-300/10 shadow-[0_0_34px_rgba(34,211,238,0.2)]' : 'border-white/10 bg-black/20'}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-black ${lane.car.id === humanCarId ? 'bg-yellow-300 text-slate-950' : 'bg-cyan-400 text-slate-950'}`}>{lane.car.rank}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{lane.presentation.name}</p>
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100">{lane.active ? (language === 'en' ? 'Resolving' : '结算中') : lane.awaitingChoice ? (language === 'en' ? 'Awaiting input' : '等待选择') : formatTimeGap(lane.car.rank === 1 ? 0 : lane.car.timeDelta)}</p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <MiniBar icon="⚡" value={status.energy.percent} tone={status.energy.tone} label={`${status.energy.value}/${status.energy.max}`} />
          <MiniBar icon="◉" value={status.tire.percent} tone={status.tire.tone} label={`${Math.round(status.tire.value)}%`} />
          <MiniBar icon="◆" value={status.focus.percent} tone={status.focus.tone} label={`${status.focus.value}/${status.focus.max}`} />
        </div>
      </div>

      <div className="min-w-0">
        {current?.definition ? (
          <div className={`mx-auto max-w-md transition duration-500 ${lane.active ? 'scale-100 opacity-100' : current.item.status === 'resolved' ? 'scale-95 opacity-70' : 'scale-95 opacity-60'}`}>
            <CardFace definition={current.definition} language={language} compact={false} selected={lane.active} />
          </div>
        ) : (
          <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-950/50 text-center text-xs text-slate-500">
            {lane.items.length ? current?.label : language === 'en' ? 'No card queued' : '无待结算卡牌'}
          </div>
        )}
        {lane.items.length ? (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {lane.items.map((view) => (
              <span key={view.item.id} className={`h-2 w-8 rounded-full ${view.item.status === 'resolved' ? 'bg-lime-300' : view.item.status === 'revealed' ? 'bg-cyan-300' : 'bg-slate-600'}`} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid content-between gap-2">
        <div className="rounded-2xl border border-orange-300/25 bg-orange-400/10 p-3">
          <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-orange-100">{language === 'en' ? 'Discard' : '弃牌区'}</p>
          {latestDiscard ? (
            <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/70 p-2">
              <p className="truncate text-xs font-black text-white">{latestDiscard.definition.name[language]}</p>
              <p className="mt-1 text-[0.6rem] uppercase tracking-[0.12em] text-orange-100">×{lane.discardedCards.length}</p>
            </div>
          ) : (
            <div className="mt-2 rounded-xl border border-dashed border-white/10 py-4 text-center text-[0.65rem] text-slate-500">0</div>
          )}
        </div>
        {lane.deployedCards.length ? (
          <div className="rounded-2xl border border-lime-300/25 bg-lime-400/10 p-3">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-lime-100">{language === 'en' ? 'Persistent' : '持续'}</p>
            <p className="mt-2 text-xs font-black text-white">×{lane.deployedCards.length}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MiniBar({ icon, value, tone, label }: { icon: string; value: number; tone: 'lime' | 'cyan' | 'yellow' | 'orange' | 'red' | 'slate'; label: string }) {
  const toneClass = {
    lime: 'from-lime-300 to-emerald-400',
    cyan: 'from-cyan-300 to-sky-400',
    yellow: 'from-yellow-300 to-amber-400',
    orange: 'from-orange-300 to-red-400',
    red: 'from-red-400 to-rose-500',
    slate: 'from-slate-400 to-slate-500',
  }[tone];

  return (
    <div className="grid grid-cols-[18px_1fr_42px] items-center gap-2 text-[0.65rem] text-slate-300">
      <span>{icon}</span>
      <div className="h-2 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${toneClass}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
      <span className="text-right font-mono text-slate-200">{label}</span>
    </div>
  );
}

function formatSky(sky: string, language: Language): string {
  const labels = {
    clear: { en: 'Clear', zh: '晴朗' },
    cloudy: { en: 'Cloudy', zh: '多云' },
    'light-rain': { en: 'Light rain', zh: '小雨' },
    'steady-rain': { en: 'Steady rain', zh: '稳定降雨' },
  } as const;
  return labels[sky as keyof typeof labels]?.[language] ?? sky;
}

function formatTemperature(temperature: string, language: Language): string {
  const labels = {
    cool: { en: 'Cool', zh: '低温' },
    mild: { en: 'Mild', zh: '温和' },
    hot: { en: 'Hot', zh: '高温' },
  } as const;
  return labels[temperature as keyof typeof labels]?.[language] ?? temperature;
}

function TrackStat({ label, value, tone }: { label: string; value: string; tone: 'yellow' | 'cyan' | 'blue' | 'lime' }) {
  const toneClass = {
    yellow: 'border-yellow-300/35 bg-yellow-300/15 text-yellow-100',
    cyan: 'border-cyan-300/35 bg-cyan-300/15 text-cyan-100',
    blue: 'border-blue-300/35 bg-blue-300/15 text-blue-100',
    lime: 'border-lime-300/35 bg-lime-300/15 text-lime-100',
  }[tone];

  return (
    <div className={`rounded-2xl border px-3 py-2 text-right ${toneClass}`}>
      <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}

function TelemetryBar({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-black uppercase tracking-[0.18em] text-slate-300">{label}</span>
        <span className="font-mono text-cyan-100">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-900/80 ring-1 ring-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-lime-300 via-cyan-300 to-orange-400" style={{ width: `${Math.max(4, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}
