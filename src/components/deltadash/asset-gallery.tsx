import type { Language } from '@/lib/i18n';
import { deltaDashCardSheets } from '@/lib/deltadash/card-catalog';

export function AssetGallery({ language }: { language: Language }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{language === 'en' ? 'Reference assets' : '参考素材'}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{language === 'en' ? 'Delta Dash 4.0 card sheets' : 'Delta Dash 4.0 卡牌图集'}</h2>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-slate-400">
          {language === 'en'
            ? 'These sheets are available for prototype reference. Individual playable card definitions will be split out in a later rules-engine pass.'
            : '这些图集先作为原型参考素材接入。单张可游玩卡牌定义会在后续规则引擎阶段再拆分。'}
        </p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {deltaDashCardSheets.map((sheet) => (
          <article key={sheet.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
            <img src={sheet.imageUrl} alt={sheet.title} className="h-36 w-full object-cover" />
            <div className="p-3">
              <p className="text-sm font-semibold text-white">{sheet.title}</p>
              <p className="mt-1 text-xs text-slate-500">{sheet.kind}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
