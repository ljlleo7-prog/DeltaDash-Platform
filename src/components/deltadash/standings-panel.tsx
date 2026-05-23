import type { Language } from '@/lib/i18n';
import { formatTimeGap, getCarPresentation, getDriverStatusVisuals, getLeaderTimeGap, type DeltaDashStatusTone } from '@/lib/deltadash/selectors';
import { REAL_TRACK_OPTIONS } from '@/lib/deltadash/track-catalog';
import type { DeltaDashMatchState, DeltaDashRankedCar } from '@/lib/deltadash/types';

type StewardBannerTone = 'clear' | 'yellow' | 'white' | 'orange' | 'red' | 'blue';

function getDriverCode(state: DeltaDashMatchState, carId: string): string {
  const car = state.cars.find((candidate) => candidate.id === carId);
  if (!car) return carId.slice(-3).toUpperCase();
  const presentation = getCarPresentation(car);
  const words = presentation.name.split(/\s+/).filter(Boolean);
  return (words.map((word: string) => word[0]).join('') || presentation.name.slice(0, 3)).slice(0, 3).toUpperCase();
}

function getStewardBanner(state: DeltaDashMatchState): { label: string; tone: StewardBannerTone; wide: boolean } {
  const currentPenaltyCarIds = [...new Set(state.stewardNotes
    .filter((note) => note.round === state.round && note.severity === 'penalty')
    .flatMap((note) => note.carIds))];

  if (currentPenaltyCarIds.length) {
    const driverCodes = currentPenaltyCarIds.map((carId) => getDriverCode(state, carId)).join(' ');
    return { label: `${driverCodes} +3s`, tone: 'white', wide: currentPenaltyCarIds.length > 1 };
  }

  const latestActionableNote = [...state.stewardNotes].reverse().find((note) => note.severity !== 'info' && note.severity !== 'penalty');

  if (latestActionableNote?.severity === 'retirement') {
    const driverCode = getDriverCode(state, latestActionableNote.carIds[0] ?? '');
    return { label: latestActionableNote.carIds.length > 1 ? 'RED' : `${driverCode} HAZARD`, tone: latestActionableNote.carIds.length > 1 ? 'red' : 'orange', wide: latestActionableNote.carIds.length > 1 };
  }

  if (state.flag === 'yellow') {
    const sectorLabel = state.round % 3 === 1 ? 'S1' : state.round % 3 === 2 ? 'S2&3' : '';
    return { label: sectorLabel ? `YELLOW ${sectorLabel}` : 'YELLOW', tone: 'yellow', wide: false };
  }

  return { label: 'CLEAR', tone: 'clear', wide: false };
}

export function StandingsPanel({
  state,
  rankedCars,
  language,
  onReset,
  onTrackChange,
}: {
  state: DeltaDashMatchState;
  rankedCars: DeltaDashRankedCar[];
  language: Language;
  onReset: () => void;
  onTrackChange: (trackKey: string) => void;
}) {
  const stewardBanner = getStewardBanner(state);
  const stewardBannerClass = {
    clear: 'bg-emerald-400 text-slate-950',
    yellow: 'bg-yellow-300 text-slate-950',
    white: 'bg-white text-slate-950',
    orange: 'bg-orange-500 text-white',
    red: 'bg-red-600 text-white',
    blue: 'bg-blue-500 text-white',
  }[stewardBanner.tone];

  return (
    <section className="overflow-hidden rounded-3xl border border-lime-300/25 bg-slate-950/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className={`p-3 ${stewardBannerClass}`}>
        <div className={`grid min-h-14 place-items-center rounded-2xl bg-black/10 px-3 py-2 text-center font-black uppercase tracking-[0.16em] ring-1 ring-black/10 ${stewardBanner.wide ? 'text-2xl' : 'text-xl'}`}>
          {stewardBanner.label}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <select
            id="active-track-select"
            value={state.track.realTrackKey ?? state.track.id}
            onChange={(event) => onTrackChange(event.target.value)}
            aria-label={language === 'en' ? 'Circuit' : '赛道'}
            className="min-w-0 flex-1 rounded-xl border border-slate-950/20 bg-slate-950 px-3 py-2 text-xs font-black text-white outline-none"
          >
            {REAL_TRACK_OPTIONS.map((track) => (
              <option key={track.key} value={track.key}>
                {track.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={onReset} className="shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.18em] text-white transition hover:bg-red-600">
            {language === 'en' ? 'Reset' : '重置'}
          </button>
        </div>
      </div>

      <div className="divide-y divide-white/10">
        {rankedCars.map((car) => {
          const presentation = getCarPresentation(car);
          const owner = state.players.find((player) => player.carId === car.id);
          const isHumanCar = owner?.kind === 'human';
          const gap = formatTimeGap(getLeaderTimeGap(state, car));
          const status = getDriverStatusVisuals(state, car);

          return (
            <article key={car.id} className="grid gap-3 px-3 py-3 text-xs text-slate-100">
              <div className="grid grid-cols-[36px_1fr_auto] items-center gap-3">
                <div className={`grid h-8 w-8 place-items-center rounded-xl font-black ${isHumanCar ? 'bg-yellow-300 text-slate-950' : 'bg-cyan-400 text-slate-950'}`}>{car.rank}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{presentation.name}</p>
                  <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-400">{owner?.kind === 'human' ? (language === 'en' ? 'Human' : '玩家') : (language === 'en' ? 'Bot' : '机器人')}</p>
                </div>
                <p className={`font-mono text-sm ${gap === 'LEAD' ? 'font-black text-lime-200' : 'text-cyan-100'}`}>{gap}</p>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <StatusBar icon="⚡" label="E" percent={status.energy.percent} tone={status.energy.tone} value={`${status.energy.value}/${status.energy.max}`} />
                <StatusBar icon="◉" label="T" percent={status.tire.percent} tone={status.tire.tone} value={`${Math.round(status.tire.value)}%`} />
                <StatusBar icon="◆" label="F" percent={status.focus.percent} tone={status.focus.tone} value={`${status.focus.value}/${status.focus.max}`} />
              </div>
              <div className="flex flex-wrap gap-1.5 text-[0.6rem] font-black uppercase tracking-[0.12em]">
                <StatusChip label={car.tyreState.compound} tone={status.compoundTone} />
                <StatusChip label={car.pitState.status} tone={status.pitTone} />
                {status.penaltyTones.map((penalty) => <StatusChip key={penalty.label} label={penalty.label} tone={penalty.tone} />)}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StatusBar({ icon, label, percent, tone, value }: { icon: string; label: string; percent: number; tone: DeltaDashStatusTone; value: string }) {
  const toneClass = {
    lime: 'from-lime-300 to-emerald-400',
    cyan: 'from-cyan-300 to-sky-400',
    yellow: 'from-yellow-300 to-amber-400',
    orange: 'from-orange-300 to-red-400',
    red: 'from-red-400 to-rose-500',
    slate: 'from-slate-400 to-slate-500',
  }[tone];

  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-1.5 py-1 text-[0.55rem] text-slate-400">
      <div className="flex items-center justify-between gap-1">
        <span className="font-black">{icon}{label}</span>
        <span className="font-mono text-slate-200">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${toneClass}`} style={{ width: `${Math.max(4, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}

function StatusChip({ label, tone }: { label: string; tone: DeltaDashStatusTone }) {
  const toneClass = {
    lime: 'border-lime-300/30 bg-lime-300/10 text-lime-100',
    cyan: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
    yellow: 'border-yellow-300/35 bg-yellow-300/10 text-yellow-100',
    orange: 'border-orange-300/35 bg-orange-300/10 text-orange-100',
    red: 'border-red-300/35 bg-red-400/10 text-red-100',
    slate: 'border-white/10 bg-white/5 text-slate-300',
  }[tone];
  return <span className={`rounded-full border px-2 py-1 ${toneClass}`}>{label}</span>;
}
