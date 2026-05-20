import type { Language } from '@/lib/i18n';
import { getCarPresentation, getCommitment } from '@/lib/deltadash/selectors';
import type { DeltaDashMatchState, DeltaDashRankedCar } from '@/lib/deltadash/types';

export function ClassificationList({
  state,
  rankedCars,
  language,
  onReset,
}: {
  state: DeltaDashMatchState;
  rankedCars: DeltaDashRankedCar[];
  language: Language;
  onReset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Classification' : '比赛排名'}</h2>
        <button type="button" onClick={onReset} className="rounded-full border border-red-300/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/20">
          {language === 'en' ? 'Reset prototype' : '重置原型'}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {rankedCars.map((car) => {
          const owner = state.players.find((player) => player.carId === car.id);
          const commitment = getCommitment(state, car.id);
          const timeDeltaPercent = Math.min(100, (car.timeDelta / state.track.finishTimeDelta) * 100);
          const presentation = getCarPresentation(car);

          return (
            <article key={car.id} className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[96px_1fr]">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {presentation.imageUrl ? <img src={presentation.imageUrl} alt={presentation.name} className="h-28 w-full object-cover" /> : null}
              </div>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">#{car.rank} {presentation.name}</p>
                    <p className="text-xs text-slate-500">{owner?.kind === 'human' ? (language === 'en' ? 'Human' : '玩家') : (language === 'en' ? 'Bot' : '机器人')}</p>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <p>{language === 'en' ? 'Energy' : '电量'} {car.energy}/6 · {language === 'en' ? 'Tire' : '轮胎'} {car.tire}/6</p>
                    <p>{language === 'en' ? 'Focus' : '专注'} {car.focus ?? 0}/{car.focusCap ?? 8}</p>
                    <p>{language === 'en' ? 'Last' : '上回合'}: {car.lastAction ?? '-'}</p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-cold),var(--accent-hot))]" style={{ width: `${timeDeltaPercent}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>{language === 'en' ? 'Time delta' : '时间差'} {car.timeDelta}/{state.track.finishTimeDelta}</span>
                  <span>{language === 'en' ? 'Committed' : '已提交'}: {commitment?.action ?? '-'}</span>
                  {car.penalties.map((penalty) => <span key={penalty} className="rounded-full border border-yellow-300/20 bg-yellow-500/10 px-2 py-1 text-yellow-100">{penalty}</span>)}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
