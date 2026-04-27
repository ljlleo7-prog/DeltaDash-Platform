import { toLocalizedList, toLocalizedText } from '@/lib/i18n';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import type { Fork, Mod, RuleSection, Thread, Version } from '@/lib/types';

type VersionRow = {
  id: string;
  name: string;
  title: unknown;
  status: Version['status'];
  summary: unknown;
  changelog: unknown[] | null;
  first_purchase_token_price: number | null;
  dd_version_files?: Array<{
    id: string;
    label: unknown;
    file_type: string;
    file_url: string;
    size_label: string;
  }>;
  dd_branch_map_parent?: Array<{
    parent_version_id: string | null;
  }>;
  dd_version_transition_prices?: Array<{
    id: string;
    from_version_id: string;
    to_version_id: string;
    transition_type: 'upgrade' | 'fallback';
    token_price: number;
    from_version?: Array<{
      name: string;
    }> | null;
  }>;
};

type ThreadRow = {
  id: string;
  title: unknown;
  content: unknown;
  linked_version_id: string | null;
  linked_mod_id: string | null;
  author_id: string | null;
  author_name: string;
  created_at: string;
  profiles:
    | {
        id?: string;
        display_name?: string | null;
        developer_status?: string | null;
      }
    | null;
};

export async function getVersions(): Promise<Version[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('dd_version_list')
    .select(`
      id,
      name,
      title,
      status,
      summary,
      changelog,
      first_purchase_token_price,
      dd_version_files(id, label, file_type, file_url, size_label),
      dd_branch_map_parent:dd_branch_map!child_version_id(parent_version_id),
      dd_version_transition_prices!to_version_id(
        id,
        from_version_id,
        to_version_id,
        transition_type,
        token_price,
        from_version:dd_version_list!from_version_id(name)
      )
    `)
    .order('name');

  if (error || !data?.length) return [];

  return (data as VersionRow[]).map((item) => ({
    id: String(item.id),
    name: item.name,
    title: toLocalizedText(item.title),
    status: item.status,
    parentVersionId: item.dd_branch_map_parent?.[0]?.parent_version_id ?? null,
    summary: toLocalizedText(item.summary),
    changelog: toLocalizedList(item.changelog),
    firstPurchaseTokenPrice: item.first_purchase_token_price ?? 0,
    transitionPrices: (item.dd_version_transition_prices ?? []).map((transition) => ({
      id: String(transition.id),
      fromVersionId: transition.from_version_id,
      fromVersionName: transition.from_version?.[0]?.name ?? transition.from_version_id,
      toVersionId: transition.to_version_id,
      transitionType: transition.transition_type,
      tokenPrice: transition.token_price,
    })),
    files: (item.dd_version_files ?? []).map((file) => ({
      id: String(file.id),
      label: toLocalizedText(file.label),
      fileType: file.file_type as Version['files'][number]['fileType'],
      href: file.file_url,
      size: file.size_label,
    })),
  }));
}

export async function getMods(): Promise<Mod[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('dd_mods')
    .select('id, name, description, base_version_id, tags, compatibility, author_name, file_url')
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  return data.map((item) => ({
    id: String(item.id),
    name: toLocalizedText(item.name),
    description: toLocalizedText(item.description),
    baseVersionId: item.base_version_id,
    tags: toLocalizedList(item.tags),
    compatibility: toLocalizedText(item.compatibility),
    author: item.author_name,
    downloadUrl: item.file_url,
  }));
}

export async function getForks(): Promise<Fork[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('dd_forks')
    .select('id, name, base_version_id, changes, author_name, dd_fork_files(id, label, file_type, file_url, size_label)')
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  return data.map((item) => ({
    id: String(item.id),
    name: toLocalizedText(item.name),
    baseVersionId: item.base_version_id,
    changes: toLocalizedList(item.changes),
    author: item.author_name,
    files: (item.dd_fork_files ?? []).map((file: { id: string; label: unknown; file_type: string; file_url: string; size_label: string }) => ({
      id: String(file.id),
      label: toLocalizedText(file.label),
      fileType: file.file_type as Fork['files'][number]['fileType'],
      href: file.file_url,
      size: file.size_label,
    })),
  }));
}

export async function getThreads(): Promise<Thread[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('dd_threads')
    .select('id, title, content, linked_version_id, linked_mod_id, author_id, author_name, created_at, profiles:author_id(id, display_name, developer_status)')
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  return (data as ThreadRow[]).map((item) => ({
    id: String(item.id),
    title: toLocalizedText(item.title),
    content: toLocalizedText(item.content),
    linkedVersionId: item.linked_version_id ?? undefined,
    linkedModId: item.linked_mod_id ?? undefined,
    author: {
      id: item.author_id ?? item.profiles?.id,
      name: item.profiles?.display_name?.trim() || item.author_name,
      isDeveloper: item.profiles?.developer_status?.trim().toUpperCase() === 'APPROVED',
    },
    createdAt: item.created_at,
  }));
}

export async function getRuleSections(): Promise<RuleSection[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('dd_rule_sections')
    .select('id, title, slug, content, related_section_ids')
    .order('sort_order');

  if (error || !data?.length) return [];

  return data.map((item) => ({
    id: String(item.id),
    title: toLocalizedText(item.title),
    slug: item.slug,
    content: toLocalizedText(item.content),
    relatedSectionIds: item.related_section_ids ?? [],
  }));
}
