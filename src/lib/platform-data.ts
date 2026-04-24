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
      dd_version_files(id, label, file_type, file_url, size_label),
      dd_branch_map_parent:dd_branch_map!child_version_id(parent_version_id)
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
    .select('id, title, content, linked_version_id, linked_mod_id, author_name, created_at')
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  return data.map((item) => ({
    id: String(item.id),
    title: toLocalizedText(item.title),
    content: toLocalizedText(item.content),
    linkedVersionId: item.linked_version_id ?? undefined,
    linkedModId: item.linked_mod_id ?? undefined,
    author: item.author_name,
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
