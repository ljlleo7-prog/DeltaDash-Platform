import { toLocalizedList, toLocalizedText } from '@/lib/i18n';
import { getSupabaseClient, getSharedSessionProfile, isSupabaseConfigured, resolveSharedUserDisplayName } from '@/lib/supabase';
import type { Fork, Mod, ReleaseFileDeliveryMode, RuleSection, Thread, ThreadDetail, ThreadReply, Version } from '@/lib/types';

type VersionRow = {
  id: string;
  name: string;
  title: unknown;
  status: Version['status'];
  summary: unknown;
  changelog: unknown[] | null;
  first_purchase_token_price: number | null;
  official_release_at?: string | null;
  withdrawn_at?: string | null;
  dd_version_files?: Array<{
    id: string;
    label: unknown;
    file_type: string;
    file_url: string;
    size_label: string;
    mediafire_quickkey?: string | null;
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
  updated_at: string;
  status: Thread['status'];
  dd_thread_replies?: Array<{ count: number }>;
  profiles:
    | {
        id?: string;
        display_name?: string | null;
        developer_status?: string | null;
      }
    | null;
};

type ThreadReplyRow = {
  id: string;
  thread_id: string;
  content: unknown;
  author_id: string | null;
  author_name: string;
  created_at: string;
  updated_at: string;
  status: ThreadReply['status'];
  profiles:
    | {
        id?: string;
        display_name?: string | null;
        developer_status?: string | null;
      }
    | null;
};

function mapAuthorProfile(authorId: string | null, authorName: string, profile: ThreadRow['profiles'] | ThreadReplyRow['profiles']) {
  return {
    id: authorId ?? profile?.id,
    name: profile?.display_name?.trim() || authorName,
    isDeveloper: profile?.developer_status?.trim().toUpperCase() === 'APPROVED',
  };
}

function mapThreadRow(item: ThreadRow): Thread {
  return {
    id: String(item.id),
    title: toLocalizedText(item.title),
    content: toLocalizedText(item.content),
    linkedVersionId: item.linked_version_id ?? undefined,
    linkedModId: item.linked_mod_id ?? undefined,
    author: mapAuthorProfile(item.author_id, item.author_name, item.profiles),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    status: item.status,
    replyCount: item.dd_thread_replies?.[0]?.count ?? 0,
  };
}

function mapThreadReplyRow(item: ThreadReplyRow): ThreadReply {
  return {
    id: String(item.id),
    threadId: item.thread_id,
    content: toLocalizedText(item.content),
    author: mapAuthorProfile(item.author_id, item.author_name, item.profiles),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    status: item.status,
  };
}

function toMirroredLocalizedText(value: string) {
  return {
    zh: value.trim(),
    en: value.trim(),
  };
}

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
      official_release_at,
      withdrawn_at,
      dd_version_files(id, label, file_type, file_url, size_label, mediafire_quickkey),
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

  const versions = (data as VersionRow[]).map((item) => ({
    id: String(item.id),
    name: item.name,
    title: toLocalizedText(item.title),
    status: item.status,
    parentVersionId: item.dd_branch_map_parent?.[0]?.parent_version_id ?? null,
    summary: toLocalizedText(item.summary),
    changelog: toLocalizedList(item.changelog),
    firstPurchaseTokenPrice: item.first_purchase_token_price ?? 0,
    officialReleaseAt: item.official_release_at ?? null,
    withdrawnAt: item.withdrawn_at ?? null,
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
      href: file.mediafire_quickkey ? `redeem:${item.id}:${file.id}` : file.file_url,
      size: file.size_label,
      deliveryMode: (file.mediafire_quickkey ? 'redeem' : 'public') as ReleaseFileDeliveryMode,
      mediafireQuickKey: file.mediafire_quickkey ?? null,
    })),
  }));

  const { user } = await getSharedSessionProfile();
  if (!user) {
    return versions.map((version) => ({
      ...version,
      isLicensed: false,
      effectivePricePreview: version.firstPurchaseTokenPrice,
      purchaseModePreview: 'first_purchase',
    }));
  }

  const { data: licenses } = await supabase
    .from('dd_user_version_licenses')
    .select('version_id')
    .eq('user_id', user.id);

  const ownedVersionIds = new Set((licenses ?? []).map((row) => String(row.version_id)));

  return versions.map((version) => {
    const matchingTransitionPrices = version.transitionPrices.filter((transition) => ownedVersionIds.has(transition.fromVersionId));
    const bestTransitionPrice = matchingTransitionPrices.length
      ? Math.min(...matchingTransitionPrices.map((transition) => transition.tokenPrice))
      : null;
    const isLicensed = ownedVersionIds.has(version.id);

    return {
      ...version,
      isLicensed,
      effectivePricePreview: isLicensed
        ? 0
        : bestTransitionPrice ?? version.firstPurchaseTokenPrice,
      purchaseModePreview: isLicensed
        ? 'owned'
        : bestTransitionPrice !== null
          ? 'transition'
          : 'first_purchase',
    };
  });
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
    .select(`
      id,
      title,
      content,
      linked_version_id,
      linked_mod_id,
      author_id,
      author_name,
      created_at,
      updated_at,
      status,
      dd_thread_replies(count),
      profiles:author_id(id, display_name, developer_status)
    `)
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  return (data as ThreadRow[]).map(mapThreadRow);
}

export async function getThreadById(threadId: string): Promise<Thread | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('dd_threads')
    .select(`
      id,
      title,
      content,
      linked_version_id,
      linked_mod_id,
      author_id,
      author_name,
      created_at,
      updated_at,
      status,
      dd_thread_replies(count),
      profiles:author_id(id, display_name, developer_status)
    `)
    .eq('id', threadId)
    .maybeSingle();

  if (error || !data) return null;

  return mapThreadRow(data as ThreadRow);
}

export async function getThreadReplies(threadId: string): Promise<ThreadReply[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('dd_thread_replies')
    .select('id, thread_id, content, author_id, author_name, created_at, updated_at, status, profiles:author_id(id, display_name, developer_status)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error || !data?.length) return [];

  return (data as ThreadReplyRow[]).map(mapThreadReplyRow);
}

export async function getThreadDetail(threadId: string): Promise<ThreadDetail | null> {
  const [thread, replies] = await Promise.all([getThreadById(threadId), getThreadReplies(threadId)]);
  if (!thread) return null;

  return {
    ...thread,
    replies,
  };
}

export async function createThread(input: { title: string; content: string; linkedVersionId?: string | null; linkedModId?: string | null }) {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { user, profile } = await getSharedSessionProfile();
  if (!user) {
    throw new Error('Please sign in before creating a thread.');
  }

  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) {
    throw new Error('Thread title and content are required.');
  }

  const authorName = resolveSharedUserDisplayName(user, profile as Parameters<typeof resolveSharedUserDisplayName>[1]) ?? 'Member';

  const { data, error } = await supabase
    .from('dd_threads')
    .insert({
      title: toMirroredLocalizedText(title),
      content: toMirroredLocalizedText(content),
      linked_version_id: input.linkedVersionId ?? null,
      linked_mod_id: input.linkedModId ?? null,
      author_id: user.id,
      author_name: authorName,
      status: 'published',
    })
    .select(`
      id,
      title,
      content,
      linked_version_id,
      linked_mod_id,
      author_id,
      author_name,
      created_at,
      updated_at,
      status,
      dd_thread_replies(count),
      profiles:author_id(id, display_name, developer_status)
    `)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create thread.');
  }

  return mapThreadRow(data as ThreadRow);
}

export async function createThreadReply(input: { threadId: string; content: string }) {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { user, profile } = await getSharedSessionProfile();
  if (!user) {
    throw new Error('Please sign in before replying.');
  }

  const content = input.content.trim();
  if (!content) {
    throw new Error('Reply content is required.');
  }

  const authorName = resolveSharedUserDisplayName(user, profile as Parameters<typeof resolveSharedUserDisplayName>[1]) ?? 'Member';

  const { data, error } = await supabase
    .from('dd_thread_replies')
    .insert({
      thread_id: input.threadId,
      content: toMirroredLocalizedText(content),
      author_id: user.id,
      author_name: authorName,
      status: 'published',
    })
    .select('id, thread_id, content, author_id, author_name, created_at, updated_at, status, profiles:author_id(id, display_name, developer_status)')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create reply.');
  }

  return mapThreadReplyRow(data as ThreadReplyRow);
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
