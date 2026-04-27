'use client';

import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthStatusPanel } from '@/components/auth-status-panel';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/components/language-provider';
import type { Language } from '@/lib/i18n';

const navItems: Array<{ href: string; label: Record<Language, string> }> = [
  { href: '/play', label: { zh: '开始', en: 'Play' } },
  { href: '/download', label: { zh: '下载', en: 'Download' } },
  { href: '/versions', label: { zh: '版本', en: 'Versions' } },
  { href: '/mods', label: { zh: '模组', en: 'Mods' } },
  { href: '/forks', label: { zh: '分支', en: 'Forks' } },
  { href: '/community', label: { zh: '社区', en: 'Community' } },
  { href: '/rules', label: { zh: '规则', en: 'Rules' } },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const copy = {
    kicker: 'deltadash.geeksproductionstudio.com',
    title: language === 'en' ? 'Delta Dash Platform' : 'Delta Dash 平台',
    subtitle:
      language === 'en'
        ? 'Official releases, workshop content, forks, discussions, and structured rules in the original Delta Dash visual style.'
        : '以原版 Delta Dash 视觉风格整合官方发布、创意工坊内容、规则分支、社区讨论与结构化规则浏览。',
    navLabel: language === 'en' ? 'Primary navigation' : '主导航',
  };

  return (
    <div className="dd-shell">
      <header className="dd-topbar">
        <div className="dd-title-wrap">
          <p className="dd-kicker">{copy.kicker}</p>
          <h1 className="dd-site-title">{copy.title}</h1>
          <p className="dd-site-subtitle">{copy.subtitle}</p>
        </div>
        <div className="dd-auth-wrap space-y-4">
          <LanguageToggle />
          <AuthStatusPanel language={language} />
        </div>
      </header>

      <nav className="dd-nav" aria-label={copy.navLabel}>
        {navItems.map((item) => (
          <NavLink key={item.href} to={item.href} className="dd-nav-link">
            {item.label[language]}
          </NavLink>
        ))}
      </nav>

      <main className="dd-main-panel">{children}</main>
    </div>
  );
}
