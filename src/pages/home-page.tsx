import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/language-provider';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { getFundPoolBalance } from '@/lib/platform-data';
import type { Language } from '@/lib/i18n';

const featureCards: Record<Language, Array<{ title: string; description: string }>> = {
  zh: [
    { title: '官方版本', description: '查看稳定版、测试版与实验版的继承关系与版本演进。' },
    { title: '下载包', description: '按版本集中管理规则、卡牌与车手包等官方文件。' },
    { title: '工坊模组', description: '浏览社区创作内容，并为后续正式投稿流程预留入口。' },
    { title: '规则分支', description: '将自定义规则集视为建立在官方版本上的独立分支。' },
    { title: '社区讨论', description: '把讨论直接关联到版本或模组，方便追踪反馈。' },
    { title: '规则浏览', description: '以结构化章节方式整理规则内容，便于交叉查阅。' },
  ],
  en: [
    { title: 'Official versions', description: 'Track stable, beta, and experimental releases with parent-child relationships.' },
    { title: 'Download bundles', description: 'Keep rules, cards, and driver packs organized by version.' },
    { title: 'Workshop mods', description: 'Browse community-created content and leave room for proper submission flows.' },
    { title: 'Forks', description: 'Treat custom rulesets as first-class branches derived from official versions.' },
    { title: 'Community threads', description: 'Attach discussion directly to a release or a mod.' },
    { title: 'Rules viewer', description: 'Structure rules into sections that are easier to cross-reference.' },
  ],
};

const quickLinks: Record<Language, { title: string; links: Array<[string, string]> }> = {
  zh: {
    title: '快速入口',
    links: [
      ['/versions', '浏览版本'],
      ['/mods', '查看模组'],
      ['/forks', '查看分支'],
      ['/community', '进入社区'],
      ['/rules', '阅读规则'],
    ],
  },
  en: {
    title: 'Quick entry points',
    links: [
      ['/versions', 'Browse versions'],
      ['/mods', 'Open workshop'],
      ['/forks', 'Explore forks'],
      ['/community', 'Join discussion'],
      ['/rules', 'Read rules'],
    ],
  },
};

export default function HomePage() {
  const { language } = useLanguage();
  const links = quickLinks[language];
  const [fundPool, setFundPool] = useState<number | null>(null);

  useEffect(() => {
    void getFundPoolBalance().then(setFundPool);
  }, []);

  return (
    <div className="space-y-10">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '平台总览',
            title: 'Delta Dash 发布与工坊中枢',
            description: '集中管理官方发布、版本历史、社区模组、规则分支、讨论串与结构化规则内容。',
            action: { href: '/download', label: '前往最新下载' },
          },
          en: {
            eyebrow: 'Platform overview',
            title: 'Delta Dash release control and workshop hub',
            description: 'Bring together official downloads, version history, community mods, forks, discussion, and structured rules.',
            action: { href: '/download', label: 'Go to latest downloads' },
          },
        }}
      />

      {fundPool !== null && (
        <section className="rounded-3xl border border-[var(--accent-cold)]/30 bg-[linear-gradient(135deg,rgba(85,199,255,0.10),rgba(85,199,255,0.04))] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-cold)]">
            {language === 'en' ? 'Community Fund Pool' : '社区贡献基金池'}
          </p>
          <p className="mt-3 font-[var(--font-heading)] text-4xl font-bold tracking-tight text-white">
            {fundPool.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-[var(--text-dim)]">
            {language === 'en' ? 'tokens available for contribution awards' : '代币可用于贡献奖励'}
          </p>
        </section>
      )}

      <section className="rounded-3xl border border-[var(--accent-cold)]/30 bg-[linear-gradient(135deg,rgba(85,199,255,0.12),rgba(255,77,90,0.08))] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-cold)]">
              {language === 'en' ? 'Community flow' : '社区互动'}
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              {language === 'en' ? 'Share playtest feedback while the race is fresh' : '趁比赛体验还新鲜时分享试玩反馈'}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-dim)]">
              {language === 'en'
                ? 'Use the community page for balance notes, bug reports, strategy questions, and mod discussion tied to current Delta Dash builds.'
                : '在社区页面集中提交平衡反馈、问题汇报、策略问题与围绕当前 Delta Dash 版本的模组讨论。'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/community" className="rounded-full border border-[var(--accent-hot)]/35 bg-[rgba(85,199,255,0.08)] px-5 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]">
              {language === 'en' ? 'Open community' : '进入社区'}
            </Link>
            <a href="https://geeksproductionstudio.com" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-black/20 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-[var(--accent-cold)]/40 hover:text-white">
              {language === 'en' ? 'Official website' : '官方网站'}
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featureCards[language].map((card) => (
          <article key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-6">
        <h3 className="text-xl font-semibold text-white">{links.title}</h3>
        <div className="mt-5 flex flex-wrap gap-3">
          {links.links.map(([href, label]) => (
            <Link
              key={href}
              to={href}
              className="rounded-full border border-[var(--accent-hot)]/35 bg-[rgba(85,199,255,0.08)] px-5 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
