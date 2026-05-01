'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { useLanguage } from '@/components/language-provider';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { ModGrid, UploadCard } from '@/components/workshop';
import { redeemReleaseDownload } from '@/lib/downloads';
import { getForks, getMods, getRuleSections, getVersions } from '@/lib/platform-data';
import { getSharedSessionProfile } from '@/lib/supabase';
import { localize, statusLabel } from '@/lib/i18n';
import type { Fork, Mod, RuleSection, Version } from '@/lib/types';
import { ReleasePublishForm } from '@/components/release-publish-form';
import { VersionTree } from '@/components/version-tree';

type AsyncState<T> = {
  loading: boolean;
  data: T;
  error: boolean;
};

function useClientData<T>(loader: () => Promise<T>, initialData: T): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    loading: true,
    data: initialData,
    error: false,
  });

  useEffect(() => {
    let active = true;

    void loader()
      .then((data) => {
        if (!active) return;
        setState({ loading: false, data, error: false });
      })
      .catch(() => {
        if (!active) return;
        setState({ loading: false, data: initialData, error: true });
      });

    return () => {
      active = false;
    };
  }, [initialData, loader]);

  return state;
}

function LoadingBlock({ message }: { message: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">{message}</div>;
}

function ErrorBlock({ message }: { message: string }) {
  return <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-100">{message}</div>;
}

function triggerBrowserDownload(url: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.rel = 'noreferrer';
  anchor.target = '_self';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function DownloadClientPage() {
  const { language } = useLanguage();
  const { loading, data: versions, error } = useClientData(useMemo(() => getVersions, []), [] as Version[]);
  const latest = versions.find((version) => version.status === 'stable') ?? versions[0];
  const [redeemingFileId, setRedeemingFileId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const copy = {
    downloading: language === 'en' ? 'Preparing download…' : '正在准备下载…',
    download: language === 'en' ? 'Download now' : '立即下载',
    redownload: language === 'en' ? 'Redownload' : '重新下载',
    buyNow: language === 'en' ? 'Buy & download' : '购买并下载',
    owned: language === 'en' ? 'Owned forever' : '永久拥有',
    transitionPrice: language === 'en' ? 'Upgrade price available' : '可用升级价格',
    firstPurchasePrice: language === 'en' ? 'First purchase price' : '首购价格',
    insufficientTokens: language === 'en' ? 'Insufficient tokens for this download.' : '代币不足，无法下载此版本。',
    signInRequired: language === 'en' ? 'Please sign in before downloading.' : '请先登录再下载。',
    downloadFailed: language === 'en' ? 'Failed to prepare the download.' : '准备下载失败。',
  };

  async function handleReleaseDownload(version: Version, fileId: string, href: string, deliveryMode?: Version['files'][number]['deliveryMode']) {
    setActionMessage(null);

    if (deliveryMode !== 'redeem') {
      triggerBrowserDownload(href);
      return;
    }

    setRedeemingFileId(fileId);

    try {
      const result = await redeemReleaseDownload({
        versionId: version.id,
        fileId,
        mode: version.isLicensed ? 'download' : 'purchase',
      });
      if (!result.ok) {
        if (result.code === 'NOT_SIGNED_IN' && result.loginUrl) {
          window.location.assign(result.loginUrl);
          return;
        }

        setActionMessage(
          result.code === 'INSUFFICIENT_TOKENS'
            ? copy.insufficientTokens
            : result.code === 'NOT_SIGNED_IN'
              ? copy.signInRequired
              : result.message || copy.downloadFailed,
        );
        return;
      }

      triggerBrowserDownload(result.directUrl);
    } catch {
      setActionMessage(copy.downloadFailed);
    } finally {
      setRedeemingFileId(null);
    }
  }

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: { eyebrow: '下载', title: '官方下载', description: '突出当前推荐版本，并集中展示所有官方版本文件与价格路径。' },
          en: { eyebrow: 'Download', title: 'Official downloads', description: 'Highlight the recommended build and keep every official version bundle and pricing path on one page.' },
        }}
      />

      {loading ? <LoadingBlock message={language === 'en' ? 'Loading official versions…' : '正在加载官方版本…'} /> : null}
      {error ? <ErrorBlock message={language === 'en' ? 'Failed to load official downloads.' : '加载官方下载内容失败。'} /> : null}
      {!loading && !error && !latest ? (
        <EmptyState
          title={language === 'en' ? 'No official downloads yet' : '暂无官方下载内容'}
          description={language === 'en' ? 'Official release files will appear here after a release is published.' : '当官方版本发布后，相关下载文件会显示在这里。'}
        />
      ) : null}

      {!loading && !error && latest ? (
        <>
          <section className="rounded-3xl border border-[var(--accent-cold)]/25 bg-[linear-gradient(135deg,rgba(85,199,255,0.12),rgba(255,77,90,0.08))] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-cold)]">{language === 'en' ? 'Latest recommended version' : '当前推荐版本'}</p>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">{latest.name} — {localize(latest.title, language)}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">{localize(latest.summary, language)}</p>
                <p className="mt-3 text-sm font-semibold text-cyan-300">
                  {language === 'en' ? `First purchase: ${latest.firstPurchaseTokenPrice} tokens` : `首购价格：${latest.firstPurchaseTokenPrice} 代币`}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--accent-hot)]/25 bg-black/20 px-4 py-3 text-sm text-[var(--accent-highlight)]">
                {statusLabel(latest.status, language)}
              </div>
            </div>
            {latest.transitionPrices.length ? (
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-200">
                {latest.transitionPrices.map((transition) => (
                  <span key={transition.id} className="rounded-full border border-white/10 bg-black/25 px-3 py-2">
                    {transition.transitionType === 'upgrade'
                      ? language === 'en'
                        ? `Upgrade from ${transition.fromVersionName}: ${transition.tokenPrice}`
                        : `从 ${transition.fromVersionName} 升级：${transition.tokenPrice}`
                      : language === 'en'
                        ? `Fall back from ${transition.fromVersionName}: ${transition.tokenPrice}`
                        : `从 ${transition.fromVersionName} 回退：${transition.tokenPrice}`}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {latest.files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleReleaseDownload(latest, file.id, file.href, file.deliveryMode)}
                  disabled={redeemingFileId === file.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-[var(--accent-cold)]/35 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <p className="text-sm font-semibold text-white">{localize(file.label, language)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">{file.fileType}</p>
                  <p className="mt-4 text-sm text-slate-300">{file.size}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {latest.isLicensed
                      ? copy.owned
                      : latest.purchaseModePreview === 'transition'
                        ? `${copy.transitionPrice}: ${latest.effectivePricePreview ?? latest.firstPurchaseTokenPrice}`
                        : `${copy.firstPurchasePrice}: ${latest.effectivePricePreview ?? latest.firstPurchaseTokenPrice}`}
                  </p>
                  <p className="mt-3 text-xs text-cyan-300">
                    {redeemingFileId === file.id
                      ? copy.downloading
                      : latest.isLicensed
                        ? copy.redownload
                        : copy.buyNow}
                  </p>
                </button>
              ))}
            </div>
            {actionMessage ? <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{actionMessage}</div> : null}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            {versions.map((version) => (
              <article key={version.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{version.name}</h3>
                    <p className="mt-2 text-sm text-slate-300">{localize(version.title, language)}</p>
                    <p className="mt-3 text-sm font-semibold text-cyan-300">
                      {language === 'en' ? `First purchase: ${version.firstPurchaseTokenPrice} tokens` : `首购价格：${version.firstPurchaseTokenPrice} 代币`}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs capitalize text-slate-300">
                    {statusLabel(version.status, language)}
                  </span>
                </div>
                {version.transitionPrices.length ? (
                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    {version.transitionPrices.map((transition) => (
                      <p key={transition.id} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                        {transition.transitionType === 'upgrade'
                          ? language === 'en'
                            ? `Upgrade from ${transition.fromVersionName}: ${transition.tokenPrice} tokens`
                            : `从 ${transition.fromVersionName} 升级：${transition.tokenPrice} 代币`
                          : language === 'en'
                            ? `Fall back from ${transition.fromVersionName}: ${transition.tokenPrice} tokens`
                            : `从 ${transition.fromVersionName} 回退：${transition.tokenPrice} 代币`}
                      </p>
                    ))}
                  </div>
                ) : null}
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
        </>
      ) : null}
    </div>
  );
}

export function VersionsClientPage() {
  const { language } = useLanguage();
  const { loading, data: versions, error } = useClientData(useMemo(() => getVersions, []), [] as Version[]);
  const [canEditVersions, setCanEditVersions] = useState(false);

  useEffect(() => {
    let active = true;

    void getSharedSessionProfile()
      .then(({ authority }) => {
        if (!active) return;
        setCanEditVersions(authority.isReleasePublisher);
      })
      .catch(() => {
        if (!active) return;
        setCanEditVersions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '版本',
            title: '浏览 Delta Dash 版本树',
            description: '查看官方版本之间的演进关系、更新记录、定价与关联文件。',
            action: { href: '/versions/publish', label: '开发者发布工具' },
          },
          en: {
            eyebrow: 'Versions',
            title: 'Browse the Delta Dash release tree',
            description: 'Track how official releases evolve from earlier branches, compare pricing paths, and inspect their bundled files.',
            action: { href: '/versions/publish', label: 'Developer publishing tools' },
          },
        }}
      />

      {loading ? <LoadingBlock message={language === 'en' ? 'Loading release tree…' : '正在加载版本树…'} /> : null}
      {error ? <ErrorBlock message={language === 'en' ? 'Failed to load release history.' : '加载版本历史失败。'} /> : null}

      {!loading && !error && versions.length ? (
        <VersionTree versions={versions} language={language} canEditVersions={canEditVersions} />
      ) : null}

      {!loading && !error && !versions.length ? (
        <EmptyState
          title={language === 'en' ? 'No versions published yet' : '暂无已发布版本'}
          description={language === 'en' ? 'Official version history will appear here after the first release is published.' : '在首个官方版本发布后，这里会显示完整的版本历史。'}
        />
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{language === 'en' ? 'Official release publishing' : '官方版本发布'}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {language === 'en'
                ? 'Approved developers can publish official versions, define first-purchase and transition pricing, and attach branch relationships from the dedicated publishing route.'
                : '已批准开发者可通过专用发布页发布官方版本、设置首购与版本转换价格，并维护分支关系。'}
            </p>
          </div>
          <Link
            to="/versions/publish"
            className="inline-flex items-center rounded-full border border-[var(--accent-hot)]/35 bg-[rgba(85,199,255,0.08)] px-5 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]"
          >
            {language === 'en' ? 'Open publish route' : '打开发布页'}
          </Link>
        </div>
      </section>

      {!loading && !error && versions.length ? (
        <section className="grid gap-4 xl:grid-cols-3">
          {versions.map((version) => (
            <article key={version.id} className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{version.name}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{language === 'en' ? 'Release notes' : '更新说明'}</h3>
              <p className="mt-3 text-sm text-cyan-300">
                {language === 'en' ? `First purchase: ${version.firstPurchaseTokenPrice} tokens` : `首购价格：${version.firstPurchaseTokenPrice} 代币`}
              </p>
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

export function ModsClientPage() {
  const { language } = useLanguage();
  const { loading, data: mods, error } = useClientData(useMemo(() => getMods, []), [] as Mod[]);

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '模组',
            title: '社区创意工坊',
            description: '按兼容性与内容方向浏览社区模组。正式投稿入口会在工坊提交流程开放后提供。',
          },
          en: {
            eyebrow: 'Mods',
            title: 'Community workshop',
            description: 'Browse community mods by compatibility and category. Submission entry will appear once the workshop publishing flow is available.',
          },
        }}
      />

      <UploadCard
        title={language === 'en' ? 'Workshop submission status' : '工坊投稿状态'}
        description={language === 'en' ? 'Direct mod publishing is not open in this build yet. Use the catalog below to review currently available community content.' : '当前版本尚未开放直接投稿模组，请先通过下方目录查看已上线的社区内容。'}
        cta={{ href: '/community', label: language === 'en' ? 'Open community discussions' : '前往社区讨论' }}
      />

      {loading ? <LoadingBlock message={language === 'en' ? 'Loading workshop mods…' : '正在加载模组内容…'} /> : null}
      {error ? <ErrorBlock message={language === 'en' ? 'Failed to load mods.' : '加载模组失败。'} /> : null}
      {!loading && !error && mods.length ? <ModGrid mods={mods} language={language} /> : null}
      {!loading && !error && !mods.length ? (
        <EmptyState
          title={language === 'en' ? 'No mods published yet' : '暂无已发布模组'}
          description={language === 'en' ? 'Community workshop entries will appear here after they are added to the platform.' : '当社区模组上线后，会显示在这里。'}
        />
      ) : null}
    </div>
  );
}

export function ForksClientPage() {
  const { language } = useLanguage();
  const { loading, data: forks, error } = useClientData(useMemo(() => getForks, []), [] as Fork[]);

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

      {loading ? <LoadingBlock message={language === 'en' ? 'Loading fork catalog…' : '正在加载分支目录…'} /> : null}
      {error ? <ErrorBlock message={language === 'en' ? 'Failed to load forks.' : '加载分支失败。'} /> : null}

      {!loading && !error && forks.length ? (
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
      ) : null}

      {!loading && !error && !forks.length ? (
        <EmptyState
          title={language === 'en' ? 'No forks published yet' : '暂无已发布分支'}
          description={language === 'en' ? 'Community forked rulesets will appear here after they are added to the platform.' : '当社区规则分支上线后，会显示在这里。'}
        />
      ) : null}
    </div>
  );
}

export function RulesClientPage() {
  const { language } = useLanguage();
  const { loading, data: rules, error } = useClientData(useMemo(() => getRuleSections, []), [] as RuleSection[]);
  const ruleMap = useMemo(() => new Map(rules.map((rule) => [rule.id, rule])), [rules]);

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

      {loading ? <LoadingBlock message={language === 'en' ? 'Loading rule sections…' : '正在加载规则章节…'} /> : null}
      {error ? <ErrorBlock message={language === 'en' ? 'Failed to load rules.' : '加载规则失败。'} /> : null}

      {!loading && !error && rules.length ? (
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
                    <a
                      key={relatedId}
                      href={`#${related.slug}`}
                      className="rounded-full border border-[var(--accent-cold)]/25 bg-[rgba(85,199,255,0.1)] px-3 py-2 text-xs text-[var(--accent-highlight)]"
                    >
                      {language === 'en' ? `Related: ${localize(related.title, language)}` : `相关章节：${localize(related.title, language)}`}
                    </a>
                  );
                })}
              </div>
            </details>
          ))}
        </section>
      ) : null}

      {!loading && !error && !rules.length ? (
        <EmptyState
          title={language === 'en' ? 'No rule sections available yet' : '暂无规则章节'}
          description={language === 'en' ? 'Structured rule content will appear here after sections are added to the platform.' : '当结构化规则内容上线后，会显示在这里。'}
        />
      ) : null}
    </div>
  );
}

export function PublishVersionClientPage({ editVersionId }: { editVersionId?: string }) {
  const { language } = useLanguage();
  const { loading, data: versions, error } = useClientData(useMemo(() => getVersions, []), [] as Version[]);

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '开发者发布',
            title: '发布官方 Delta Dash 版本',
            description: '此页面仅限已批准开发者使用，用于写入 dd_version_list、dd_branch_map 与 dd_version_transition_prices。',
          },
          en: {
            eyebrow: 'Developer releases',
            title: 'Publish official Delta Dash releases',
            description: 'This route is reserved for approved developers and writes to dd_version_list, dd_branch_map, and dd_version_transition_prices.',
          },
        }}
      />

      {loading ? <LoadingBlock message={language === 'en' ? 'Loading release options…' : '正在加载版本选项…'} /> : null}
      {error ? <ErrorBlock message={language === 'en' ? 'Failed to load publish form data.' : '加载发布表单数据失败。'} /> : null}
      {!error ? <ReleasePublishForm versions={versions} versionsLoading={loading} language={language} editVersionId={editVersionId} /> : null}
    </div>
  );
}
