'use client';

import { useLanguage } from '@/components/language-provider';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

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
            onClick={() => setLanguage(value)}
            className={`dd-inline-action ${language === value ? 'bg-[linear-gradient(90deg,var(--accent-cold),var(--accent-cold-2))] text-[#061019]' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
