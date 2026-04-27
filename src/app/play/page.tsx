'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import type { Language } from '@/lib/i18n';

const playCards: Record<Language, Array<{ title: string; description: string; href: string; cta: string }>> = {
  zh: [
    { title: '下载官方内容', description: '快速进入当前可用的官方版本与下载包。', href: '/download', cta: '打开下载页' },
    { title: '查看版本树', description: '对照各个版本、分支关系与更新记录。', href: '/versions', cta: '浏览版本' },
    { title: '进入社区内容', description: '查看社区模组、分支规则与相关讨论。', href: '/community', cta: '进入社区' },
  ],
  en: [
    { title: 'Get official content', description: 'Jump straight to the latest official version bundles.', href: '/download', cta: 'Open downloads' },
    { title: 'Inspect the version tree', description: 'Compare releases, branch links, and changelog history.', href: '/versions', cta: 'Browse versions' },
    { title: 'Open community content', description: 'Review mods, forks, and linked discussions.', href: '/community', cta: 'Open community' },
  ],
};

export default function PlayPage() {
  const { language } = useLanguage();

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '开始',
            title: '进入 Delta Dash 平台',
            description: '这里提供进入官方版本、规则、社区内容与相关下载的主要入口。',
          },
          en: {
            eyebrow: 'Play',
            title: 'Enter the Delta Dash platform',
            description: 'Use this page as a concrete hub for official releases, rules, community content, and downloads.',
          },
        }}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {playCards[language].map((card) => (
          <article key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
            <Link href={card.href} className="mt-5 inline-flex rounded-full border border-[var(--accent-hot)]/35 bg-[rgba(85,199,255,0.08)] px-5 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]">
              {card.cta}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
