import { EmptyState } from '@/components/empty-state';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { UploadCard } from '@/components/workshop';
import { getPreferredLanguage } from '@/lib/i18n-server';
import { getForks } from '@/lib/platform-data';
import { localize } from '@/lib/i18n';

export default async function ForksPage() {
  const language = await getPreferredLanguage();
  const forks = await getForks();

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '分支',
            title: '自定义规则分支',
            description: '查看基于官方版本演化的社区规则分支与其附属文件。',
          },
          en: {
            eyebrow: 'Forks',
            title: 'Custom ruleset branches',
            description: 'Review community-maintained ruleset branches built on top of official versions.',
          },
        }}
      />

      <UploadCard
        title={language === 'en' ? 'Fork submission status' : '分支投稿状态'}
        description={language === 'en' ? 'Direct fork publishing is not open in this build yet. Published branches will appear below once they are available.' : '当前版本尚未开放直接投稿规则分支，已上线的分支内容会显示在下方。'}
        cta={{ href: '/versions', label: language === 'en' ? 'Browse official versions' : '查看官方版本' }}
      />

      {forks.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {forks.map((fork) => (
            <article key={fork.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{localize(fork.name, language)}</h3>
                  <p className="mt-2 text-sm text-slate-300">{language === 'en' ? `Based on version ${fork.baseVersionId}` : `基于版本 ${fork.baseVersionId}`}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-300">
                  {fork.author}
                </span>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                {fork.changes.map((change, index) => (
                  <li key={`${fork.id}-${index}`} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    {localize(change, language)}
                  </li>
                ))}
              </ul>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {fork.files.map((file) => (
                  <div key={file.id} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
                    <p className="font-medium text-white">{localize(file.label, language)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">{file.fileType}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title={language === 'en' ? 'No forks published yet' : '暂无已发布分支'}
          description={language === 'en' ? 'Community forked rulesets will appear here after they are added to the platform.' : '当社区规则分支上线后，会显示在这里。'}
        />
      )}
    </div>
  );
}
