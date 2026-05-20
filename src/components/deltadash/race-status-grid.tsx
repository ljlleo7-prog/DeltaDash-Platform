import type { Language } from '@/lib/i18n';
import type { DeltaDashMatchState } from '@/lib/deltadash/types';

export function RaceStatusGrid({ state, language }: { state: DeltaDashMatchState; language: Language }) {
  return (
    <section className="grid gap-4 lg:grid-cols-4">
      <StatusCard label={language === 'en' ? 'Round' : '回合'} value={String(state.round)} />
      <StatusCard label={language === 'en' ? 'Phase' : '阶段'} value={state.phase} />
      <StatusCard label={language === 'en' ? 'Flag' : '旗况'} value={state.flag.toUpperCase()} />
      <StatusCard label={language === 'en' ? 'Finish' : '终点'} value={`${state.track.finishTimeDelta}`} />
    </section>
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
