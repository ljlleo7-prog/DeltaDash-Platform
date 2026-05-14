import { Link } from 'react-router-dom';
import type { Mod } from '@/lib/types';
import { localize, type Language } from '@/lib/i18n';
import { EmptyState } from '@/components/empty-state';
import { RatingWidget } from '@/components/rating-widget';

export function UploadCard({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta: { href: string; label: string };
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        <Link to={cta.href} className="dd-action">
          {cta.label}
        </Link>
      }
    />
  );
}

export function ModGrid({ mods, language }: { mods: Mod[]; language: Language }) {
  return (
    <div className="dd-grid xl:grid-cols-2">
      {mods.map((mod) => (
        <article key={mod.id} className="dd-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-[var(--font-heading)] text-lg uppercase tracking-[0.08em] text-[var(--text-main)]">{localize(mod.name, language)}</h3>
              <p className="dd-copy mt-2 text-sm">{localize(mod.description, language)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="dd-badge">{mod.baseVersionId}</span>
              {mod.isOfficialPick && <span className="dd-badge">{language === 'en' ? 'Official Pick' : '官方精选'}</span>}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {mod.tags.map((tag, index) => (
              <span key={`${mod.id}-tag-${index}`} className="dd-badge">
                {localize(tag, language)}
              </span>
            ))}
          </div>
          <div className="dd-subpanel mt-5 grid gap-3 text-sm text-[var(--text-dim)] sm:grid-cols-2">
            <div>
              <p className="dd-label">{language === 'en' ? 'Compatibility' : '兼容性'}</p>
              <p className="mt-2">{localize(mod.compatibility, language)}</p>
            </div>
            <div>
              <p className="dd-label">{language === 'en' ? 'Author' : '作者'}</p>
              <p className="mt-2">{mod.author}</p>
            </div>
            <div>
              <p className="dd-label">{language === 'en' ? 'Price' : '价格'}</p>
              <p className="mt-2">{mod.tokenPrice === 0 ? (language === 'en' ? 'Free' : '免费') : `${mod.tokenPrice} ${language === 'en' ? 'tokens' : '代币'}`}</p>
            </div>
            <div>
              <p className="dd-label">{language === 'en' ? 'Sales' : '销量'}</p>
              <p className="mt-2 text-xs text-slate-500">{mod.soldCount} {language === 'en' ? 'sold' : '已售'}</p>
            </div>
          </div>
          <RatingWidget targetType="mod" targetId={mod.id} summary={mod.rating} language={language} interactive />
        </article>
      ))}
    </div>
  );
}
