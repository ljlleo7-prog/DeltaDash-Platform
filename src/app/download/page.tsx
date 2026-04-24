import { EmptyState } from '@/components/empty-state';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { getPreferredLanguage } from '@/lib/i18n-server';
import { getVersions } from '@/lib/platform-data';
import { localize, statusLabel } from '@/lib/i18n';

export default async function DownloadPage() {
  const language = await getPreferredLanguage();
  const versions = await getVersions();
  const latest = versions.find((version) => version.status === 'stable') ?? versions[0];

  if (!latest) {
    return (
      <div className="space-y-8">
        <LocalizedSectionHeader
          copy={{
            zh: { eyebrow: '下载', title: '官方下载', description: '集中查看当前可用的官方版本与文件下载。' },
            en: { eyebrow: 'Download', title: 'Official downloads', description: 'Review currently available official versions and downloadable files.' },
          }}
        />
        <EmptyState
          title={language === 'en' ? 'No official downloads yet' : '暂无官方下载内容'}
          description={language === 'en' ? 'Official release files will appear here after a release is published.' : '当官方版本发布后，相关下载文件会显示在这里。'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: { eyebrow: '下载', title: '官方下载', description: '突出当前推荐版本，并集中展示所有官方版本文件。' },
          en: { eyebrow: 'Download', title: 'Official downloads', description: 'Highlight the recommended build and keep every official version bundle on one page.' },
        }}
      />

      <section className="rounded-3xl border border-[var(--accent-cold)]/25 bg-[linear-gradient(135deg,rgba(85,199,255,0.12),rgba(255,77,90,0.08))] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-cold)]">{language === 'en' ? 'Latest recommended version' : '当前推荐版本'}</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">{latest.name} — {localize(latest.title, language)}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">{localize(latest.summary, language)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--accent-hot)]/25 bg-black/20 px-4 py-3 text-sm text-[var(--accent-highlight)]">
            {statusLabel(latest.status, language)}
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {latest.files.map((file) => (
            <a key={file.id} href={file.href} className="rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-[var(--accent-cold)]/35">
              <p className="text-sm font-semibold text-white">{localize(file.label, language)}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">{file.fileType}</p>
              <p className="mt-4 text-sm text-slate-300">{file.size}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {versions.map((version) => (
          <article key={version.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{version.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{localize(version.title, language)}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs capitalize text-slate-300">
                {statusLabel(version.status, language)}
              </span>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              {version.files.map((file) => (
                <li key={file.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{localize(file.label, language)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">{file.fileType}</p>
                  </div>
                  <span className="text-xs text-slate-400">{file.size}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
