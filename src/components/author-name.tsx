import type { AuthorProfile } from '@/lib/types';

export function AuthorName({ author }: { author: AuthorProfile }) {
  return <span className={author.isDeveloper ? 'font-bold text-cyan-300' : undefined}>{author.name}</span>;
}
