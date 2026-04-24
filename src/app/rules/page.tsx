import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { getPreferredLanguage } from '@/lib/i18n-server';
import { getRuleSections } from '@/lib/platform-data';
import { localize } from '@/lib/i18n';

export default async function RulesPage() {
  const language = await getPreferredLanguage();
  const rules = await getRuleSections();
  const ruleMap = new Map(rules.map((rule) => [rule.id, rule]));

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '规则',
            title: '结构化规则浏览',
            description: '按章节整理规则内容，便于快速检索、交叉查阅与后续扩展。',
          },
          en: {
            eyebrow: 'Rules',
            title: 'Structured rule viewer',
            description: 'Split rules into linked sections that are easier to scan, cross-reference, and extend.',
          },
        }}
      />

      {rules.length ? (
        <section className="space-y-4">
          {rules.map((rule) => (
            <details key={rule.id} id={rule.slug} className="group rounded-3xl border border-white/10 bg-white/5 p-5" open>
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{language === 'en' ? 'Section' : '章节'}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{localize(rule.title, language)}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-300 group-open:text-[var(--accent-hot)]">
                    /{rule.slug}
                  </span>
                </div>
              </summary>
              <p className="mt-4 text-sm leading-7 text-slate-300">{localize(rule.content, language)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {rule.relatedSectionIds.map((relatedId) => {
                  const related = ruleMap.get(relatedId);
                  if (!related) return null;

                  return (
                    <Link
                      key={relatedId}
                      href={`#${related.slug}`}
                      className="rounded-full border border-[var(--accent-cold)]/25 bg-[rgba(85,199,255,0.1)] px-3 py-2 text-xs text-[var(--accent-highlight)]"
                    >
                      {language === 'en' ? `Related: ${localize(related.title, language)}` : `相关章节：${localize(related.title, language)}`}
                    </Link>
                  );
                })}
              </div>
            </details>
          ))}
        </section>
      ) : (
        <EmptyState
          title={language === 'en' ? 'No rule sections available yet' : '暂无规则章节'}
          description={language === 'en' ? 'Structured rule content will appear here after sections are added to the platform.' : '当结构化规则内容上线后，会显示在这里。'}
        />
      )}
    </div>
  );
}
