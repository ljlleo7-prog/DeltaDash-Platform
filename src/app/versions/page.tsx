import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { VersionTree } from '@/components/version-tree';
import { getPreferredLanguage } from '@/lib/i18n-server';
import { getVersions } from '@/lib/platform-data';
import { localize } from '@/lib/i18n';

export default async function VersionsPage() {
  const language = await getPreferredLanguage();
  const versions = await getVersions();

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '版本',
            title: '浏览 Delta Dash 版本树',
            description: '查看官方版本之间的演进关系、更新记录与关联文件。',
            action: { href: '/versions/publish', label: '发布管理' },
          },
          en: {
            eyebrow: 'Versions',
            title: 'Browse the Delta Dash release tree',
            description: 'Track how official releases evolve from earlier branches and inspect their bundled files.',
            action: { href: '/versions/publish', label: 'Release admin tools' },
          },
        }}
      />

      {versions.length ? (
        <VersionTree versions={versions} language={language} />
      ) : (
        <EmptyState
          title={language === 'en' ? 'No versions published yet' : '暂无已发布版本'}
          description={language === 'en' ? 'Official version history will appear here after the first release is published.' : '在首个官方版本发布后，这里会显示完整的版本历史。'}
        />
      )}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{language === 'en' ? 'Official release publishing' : '官方版本发布'}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {language === 'en'
                ? 'Release admins can publish official versions, attach branch relationships, and upload files from the dedicated admin route.'
                : '发布管理员可通过专用后台发布官方版本、维护分支关系并上传关联文件。'}
            </p>
          </div>
          <Link
            href="/versions/publish"
            className="inline-flex items-center rounded-full border border-[var(--accent-hot)]/35 bg-[rgba(85,199,255,0.08)] px-5 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]"
          >
            {language === 'en' ? 'Open publish route' : '打开发布页'}
          </Link>
        </div>
      </section>

      {versions.length ? (
        <section className="grid gap-4 xl:grid-cols-3">
          {versions.map((version) => (
            <article key={version.id} className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{version.name}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{language === 'en' ? 'Release notes' : '更新说明'}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                {version.changelog.map((item, index) => (
                  <li key={`${version.id}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    {localize(item, language)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
