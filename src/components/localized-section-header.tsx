import { SectionHeader } from '@/components/section-header';
import { getPreferredLanguage } from '@/lib/i18n-server';
import type { Language } from '@/lib/i18n';

type SectionHeaderCopy = {
  eyebrow: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
};

export async function LocalizedSectionHeader({
  copy,
}: {
  copy: Record<Language, SectionHeaderCopy>;
}) {
  const language = await getPreferredLanguage();
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
