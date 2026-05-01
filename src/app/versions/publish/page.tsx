import { PublishVersionClientPage } from '@/components/client-pages';

type PublishVersionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PublishVersionPage({ searchParams }: PublishVersionPageProps) {
  const resolvedSearchParams = await searchParams;
  const editParam = resolvedSearchParams?.edit;
  const editVersionId = typeof editParam === 'string' ? editParam : Array.isArray(editParam) ? editParam[0] : undefined;

  return <PublishVersionClientPage editVersionId={editVersionId} />;
}
