import type { Language } from '@/lib/i18n';
import { deltaDashExplanationSlides } from '@/lib/deltadash/explanation-catalog';
import type { DeltaDashEvent, DeltaDashStewardNote } from '@/lib/deltadash/types';
import { EventLogPanel } from './event-log-panel';
import { StewardPanel } from './steward-panel';

export function RaceControlPanel({
  latestNote,
  events,
  language,
}: {
  latestNote: DeltaDashStewardNote | null;
  events: DeltaDashEvent[];
  language: Language;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-orange-300/25 bg-orange-500/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-200">{language === 'en' ? 'Race engineer' : '比赛工程师'}</p>
        <h3 className="mt-2 text-xl font-black text-white">{language === 'en' ? 'Hints & rules' : '提示与规则'}</h3>
        <p className="mt-2 text-xs leading-5 text-orange-50/80">
          {language === 'en'
            ? 'Target ranges now use direct time gaps. A 1.5s card range means cars within 1.5 seconds of each other.'
            : '目标范围现在直接使用时间差。1.5 秒卡牌范围表示彼此相差不超过 1.5 秒。'}
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {deltaDashExplanationSlides.map((slide) => (
            <a key={slide.id} href={slide.imageUrl} target="_blank" rel="noreferrer" className="block min-w-20 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 transition hover:border-lime-300/50">
              <img src={slide.imageUrl} alt={slide.title} className="h-14 w-20 object-cover" />
            </a>
          ))}
        </div>
      </div>

      <StewardPanel latestNote={latestNote} language={language} />
      <EventLogPanel events={events} language={language} />
    </section>
  );
}
