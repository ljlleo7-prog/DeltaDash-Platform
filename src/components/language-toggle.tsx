'use client';

import { useEffect, useState } from 'react';
import { LANGUAGE_COOKIE, type Language } from '@/lib/i18n';

function persistLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_COOKIE, language);
  document.documentElement.setAttribute('lang', language);
  document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function LanguageToggle({ initialLanguage }: { initialLanguage: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_COOKIE);
    const nextLanguage = saved === 'en' || saved === 'zh' ? saved : initialLanguage;

    setLanguage(nextLanguage);
    persistLanguage(nextLanguage);
  }, [initialLanguage]);

  function applyLanguage(nextLanguage: Language) {
    persistLanguage(nextLanguage);
    setLanguage(nextLanguage);
    window.location.reload();
  }

  return (
    <div className="dd-panel text-sm text-[var(--text-dim)]">
      <p className="dd-label">语言 / Language</p>
      <div className="mt-3 flex gap-2">
        {([
          ['zh', '中文'],
          ['en', 'EN'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => applyLanguage(value)}
            className={`dd-inline-action ${language === value ? 'bg-[linear-gradient(90deg,var(--accent-cold),var(--accent-cold-2))] text-[#061019]' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
