'use client';

import { useLanguage } from '@/components/language-provider';
import { SectionHeader } from '@/components/section-header';
import type { Language } from '@/lib/i18n';

type SectionHeaderCopy = {
  eyebrow: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
};

export function LocalizedSectionHeader({
  copy,
}: {
  copy: Record<Language, SectionHeaderCopy>;
}) {
  const { language } = useLanguage();
  const active = copy[language];

  return (
    <SectionHeader
      eyebrow={active.eyebrow}
      title={active.title}
      description={active.description}
      action={active.action}
    />
  );
}
