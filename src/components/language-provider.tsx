'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LANGUAGE_COOKIE, type Language } from '@/lib/i18n';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function persistLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_COOKIE, language);
  document.documentElement.setAttribute('lang', language);
  document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function resolveInitialLanguage(defaultLanguage: Language) {
  if (typeof window === 'undefined') {
    return defaultLanguage;
  }

  const saved = window.localStorage.getItem(LANGUAGE_COOKIE);
  return saved === 'en' || saved === 'zh' ? saved : defaultLanguage;
}

export function LanguageProvider({ children, defaultLanguage = 'zh' }: { children: ReactNode; defaultLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(() => resolveInitialLanguage(defaultLanguage));

  useEffect(() => {
    persistLanguage(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}
