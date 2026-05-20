import type { Language } from '@/lib/i18n';
import { formatTimeGap, getCarPresentation, getLeaderTimeGap } from '@/lib/deltadash/selectors';
import { REAL_TRACK_OPTIONS } from '@/lib/deltadash/track-catalog';
import type { DeltaDashMatchState, DeltaDashRankedCar } from '@/lib/deltadash/types';

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
  return (
    <section className="overflow-hidden rounded-3xl border border-lime-300/25 bg-slate-950/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="bg-lime-300 px-4 py-3 text-slate-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.25em]">{language === 'en' ? 'Standings' : '排名'}</p>
            <h3 className="text-lg font-black italic">DELTA</h3>
          </div>
          <button type="button" onClick={onReset} className="rounded-full bg-slate-950 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.18em] text-lime-100 transition hover:bg-red-600">
            {language === 'en' ? 'Reset' : '重置'}
          </button>
        </div>
        <label className="mt-3 block text-[0.6rem] font-black uppercase tracking-[0.18em] text-slate-800" htmlFor="active-track-select">
          {language === 'en' ? 'Circuit' : '赛道'}
        </label>
        <select
          id="active-track-select"
          value={state.track.realTrackKey ?? state.track.id}
          onChange={(event) => onTrackChange(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-950/20 bg-slate-950 px-3 py-2 text-xs font-black text-lime-100 outline-none"
        >
          {REAL_TRACK_OPTIONS.map((track) => (
            <option key={track.key} value={track.key}>
              {track.name}
            </option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-white/10">
        {rankedCars.map((car) => {
          const presentation = getCarPresentation(car);
          const owner = state.players.find((player) => player.carId === car.id);
          const gap = formatTimeGap(getLeaderTimeGap(state, car));

          return (
            <article key={car.id} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-3 py-3 text-xs text-slate-100">
              <div className={`grid h-8 w-8 place-items-center rounded-xl font-black ${car.rank === 1 ? 'bg-yellow-300 text-slate-950' : 'bg-white/10 text-white'}`}>{car.rank}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{presentation.name}</p>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-400">{owner?.kind === 'human' ? (language === 'en' ? 'Human' : '玩家') : (language === 'en' ? 'Bot' : '机器人')}</p>
              </div>
              <div className="text-right font-mono">
                <p className={gap === 'LEAD' ? 'font-black text-lime-200' : 'text-cyan-100'}>{gap}</p>
                <p className="text-[0.65rem] text-slate-400">E{car.energy} T{car.tire} F{car.focus ?? 0}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
