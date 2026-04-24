export const LANGUAGE_COOKIE = 'deltaDashLanguage';

export type Language = 'zh' | 'en';

export type LocalizedText = {
  zh: string;
  en: string;
};

export type MaybeLocalizedText = LocalizedText | string | null | undefined;

export function localize(value: unknown, language: Language): string {
  const normalized = toLocalizedText(value);
  return language === 'en' ? normalized.en : normalized.zh;
}

export function toLocalizedText(value: unknown): LocalizedText {
  if (typeof value === 'object' && value && 'zh' in value && 'en' in value) {
    const localized = value as { zh?: unknown; en?: unknown };
    return {
      zh: typeof localized.zh === 'string' ? localized.zh : '',
      en: typeof localized.en === 'string' ? localized.en : '',
    };
  }

  const text = typeof value === 'string' ? value : '';
  return { zh: text, en: text };
}

export function toLocalizedList(values: unknown[] | null | undefined): LocalizedText[] {
  return (values ?? []).map((value) => toLocalizedText(value));
}

export function statusLabel(status: 'stable' | 'beta' | 'experimental', language: Language): string {
  const labels: Record<'stable' | 'beta' | 'experimental', LocalizedText> = {
    stable: { zh: '稳定版', en: 'Stable' },
    beta: { zh: '测试版', en: 'Beta' },
    experimental: { zh: '实验版', en: 'Experimental' },
  };

  return localize(labels[status], language);
}
