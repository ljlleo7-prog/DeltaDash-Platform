import type { Language } from '@/lib/i18n';
import { getFinishSummary } from '@/lib/deltadash/selectors';
import type { DeltaDashActionType, DeltaDashCar, DeltaDashMatchState } from '@/lib/deltadash/types';

const actionCopy: Record<DeltaDashActionType, { zh: string; en: string; description: { zh: string; en: string } }> = {
  steady: {
    zh: '稳定推进',
    en: 'Steady',
    description: { zh: '+1.5s，+1 电量，-1 轮胎。黄旗/限速下 +1.0s。', en: '+1.5s, +1 energy, -1 tire. +1.0s under yellow/speed cap.' },
  },
  push: {
    zh: '强推',
    en: 'Push',
    description: { zh: '+2.5s，-2 电量，-2 轮胎，增加事故风险。', en: '+2.5s, -2 energy, -2 tire, higher incident risk.' },
  },
  defend: {
    zh: '防守',
    en: 'Defend',
    description: { zh: '+1.0s，保守通过本回合。', en: '+1.0s with safer race posture.' },
  },
  recover: {
    zh: '回收',
    en: 'Recover',
    description: { zh: '+0.5s，+2 电量，+1 轮胎。', en: '+0.5s, +2 energy, +1 tire.' },
  },
};

export function ActionPanel({
  state,
  humanCar,
  language,
  onAction,
}: {
  state: DeltaDashMatchState;
  humanCar: DeltaDashCar | null;
  language: Language;
  onAction: (action: DeltaDashActionType) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Your action' : '你的行动'}</h2>
      {state.phase === 'finished' ? (
        <p className="mt-3 text-sm leading-6 text-slate-300">{getFinishSummary(state)}</p>
      ) : humanCar?.retired ? (
        <p className="mt-3 text-sm leading-6 text-red-100">{language === 'en' ? 'Your car has retired.' : '你的赛车已经退赛。'}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {(Object.keys(actionCopy) as DeltaDashActionType[]).map((action) => (
            <button key={action} type="button" onClick={() => onAction(action)} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-[var(--accent-cold)]/45 hover:bg-black/35">
              <p className="text-sm font-semibold text-white">{actionCopy[action][language]}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{actionCopy[action].description[language]}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
