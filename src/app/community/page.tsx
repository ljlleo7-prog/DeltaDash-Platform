import { EmptyState } from '@/components/empty-state';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { getPreferredLanguage } from '@/lib/i18n-server';
import { getThreads } from '@/lib/platform-data';
import { localize } from '@/lib/i18n';

export default async function CommunityPage() {
  const language = await getPreferredLanguage();
  const threads = await getThreads();

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '社区',
            title: '关联版本与模组的讨论',
            description: '围绕官方版本与社区内容集中整理问题、反馈与平衡讨论。',
          },
          en: {
            eyebrow: 'Community',
            title: 'Discussion linked to releases and mods',
            description: 'Keep discussion anchored to versions and mods so feedback stays attached to the right artifact.',
          },
        }}
      />

      <EmptyState
        title={language === 'en' ? 'Posting is not open in this build yet' : '当前版本暂未开放发帖'}
        description={language === 'en' ? 'This page currently serves as a read-only discussion archive. New thread publishing will appear once the complete submission flow is available.' : '当前页面作为只读讨论归档使用。待完整投稿流程开放后，这里会提供新建讨论串入口。'}
      />

      {threads.length ? (
        <section className="space-y-4">
          {threads.map((thread) => (
            <article key={thread.id} className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{localize(thread.title, language)}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{localize(thread.content, language)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                  <p>{thread.author}</p>
                  <p className="mt-1 text-slate-500">{thread.createdAt}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                {thread.linkedVersionId ? <span className="rounded-full border border-[var(--accent-hot)]/25 bg-[rgba(255,77,90,0.14)] px-3 py-1 text-[var(--text-main)]">{language === 'en' ? `Version: ${thread.linkedVersionId}` : `版本：${thread.linkedVersionId}`}</span> : null}
                {thread.linkedModId ? <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1">{language === 'en' ? `Mod: ${thread.linkedModId}` : `模组：${thread.linkedModId}`}</span> : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title={language === 'en' ? 'No discussion threads yet' : '暂无讨论串'}
          description={language === 'en' ? 'Community discussion threads will appear here after they are created on the platform.' : '当社区讨论上线后，相关讨论串会显示在这里。'}
        />
      )}
    </div>
  );
}
