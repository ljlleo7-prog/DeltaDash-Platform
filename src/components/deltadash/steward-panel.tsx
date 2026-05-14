import type { Language } from '@/lib/i18n';
import type { DeltaDashStewardNote } from '@/lib/deltadash/types';

export function StewardPanel({ latestNote, language }: { latestNote: DeltaDashStewardNote | null; language: Language }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Steward' : '赛会干事'}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {latestNote?.message ?? (language === 'en' ? 'No steward review yet.' : '暂无赛会判定。')}
      </p>
    </section>
  );
}
