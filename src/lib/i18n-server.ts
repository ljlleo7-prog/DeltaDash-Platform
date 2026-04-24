import { cookies } from 'next/headers';
import { LANGUAGE_COOKIE, type Language } from '@/lib/i18n';

export async function getPreferredLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LANGUAGE_COOKIE)?.value;
  return saved === 'en' ? 'en' : 'zh';
}
