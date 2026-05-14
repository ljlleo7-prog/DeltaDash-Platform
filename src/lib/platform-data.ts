import { toLocalizedList, toLocalizedText } from '@/lib/i18n';
import { getSupabaseClient, getSharedSessionProfile, isSupabaseConfigured, resolveSharedUserDisplayName } from '@/lib/supabase';
import type { Dlc, DlcFile, Fork, Mod, RatingSummary, ReleaseFileDeliveryMode, RuleSection, Thread, ThreadDetail, ThreadReply, Version } from '@/lib/types';

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
    baidu_netdisk_url?: string | null;
    baidu_extraction_code?: string | null;
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
  reply_count?: number | null;
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
};

type ForumProfileRow = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  developer_status?: string | null;
};

function mapAuthorProfile(authorId: string | null, authorName: string, profile?: ForumProfileRow | null) {
  return {
    id: authorId ?? profile?.id,
    name: profile?.username?.trim() || profile?.display_name?.trim() || authorName,
    isDeveloper: profile?.developer_status?.trim().toUpperCase() === 'APPROVED',
  };
}

function mapThreadRow(item: ThreadRow, profile?: ForumProfileRow | null): Thread {
  return {
    id: String(item.id),
    title: toLocalizedText(item.title),
    content: toLocalizedText(item.content),
    linkedVersionId: item.linked_version_id ?? undefined,
    linkedModId: item.linked_mod_id ?? undefined,
    author: mapAuthorProfile(item.author_id, item.author_name, profile),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    status: item.status,
    replyCount: item.reply_count ?? 0,
  };
}

function mapThreadReplyRow(item: ThreadReplyRow, profile?: ForumProfileRow | null): ThreadReply {
  return {
    id: String(item.id),
    threadId: item.thread_id,
    content: toLocalizedText(item.content),
    author: mapAuthorProfile(item.author_id, item.author_name, profile),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    status: item.status,
  };
}

async function getForumProfilesByIds(authorIds: Array<string | null | undefined>) {
  const ids = Array.from(new Set(authorIds.filter((value): value is string => Boolean(value?.trim()))));
  if (!ids.length) {
    return new Map<string, ForumProfileRow>();
  }

  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) {
    return new Map<string, ForumProfileRow>();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, developer_status')
    .in('id', ids);

  if (error || !data?.length) {
    return new Map<string, ForumProfileRow>();
  }

  return new Map((data as ForumProfileRow[]).map((profile) => [profile.id, profile]));
}

async function getReplyCountsByThreadIds(threadIds: string[]) {
  const ids = Array.from(new Set(threadIds.filter(Boolean)));
  if (!ids.length) {
    return new Map<string, number>();
  }

  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from('dd_thread_replies')
    .select('thread_id')
    .in('thread_id', ids)
    .eq('status', 'published');

  if (error || !data?.length) {
    return new Map<string, number>();
  }

  const counts = new Map<string, number>();
  for (const row of data as Array<{ thread_id: string }>) {
    counts.set(row.thread_id, (counts.get(row.thread_id) ?? 0) + 1);
  }

  return counts;
}

function withThreadProfiles(items: ThreadRow[], profileMap: Map<string, ForumProfileRow>) {
  return items.map((item) => mapThreadRow(item, item.author_id ? profileMap.get(item.author_id) ?? null : null));
}

function withReplyProfiles(items: ThreadReplyRow[], profileMap: Map<string, ForumProfileRow>) {
  return items.map((item) => mapThreadReplyRow(item, item.author_id ? profileMap.get(item.author_id) ?? null : null));
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
      dd_version_files(id, label, file_type, file_url, size_label, mediafire_quickkey, baidu_netdisk_url, baidu_extraction_code),
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
      href: `redeem:${item.id}:${file.id}`,
      size: file.size_label,
      deliveryMode: 'redeem' as ReleaseFileDeliveryMode,
      mediafireQuickKey: file.mediafire_quickkey ?? null,
      sourceUrl: null,
      baiduNetdiskUrl: file.baidu_netdisk_url ?? null,
      baiduExtractionCode: file.baidu_extraction_code ?? null,
    })),
  }));

  const { user } = await getSharedSessionProfile();
  const ratings = await getRatingSummaries('version', versions.map((v) => v.id));

  if (!user) {
    return versions.map((version) => ({
      ...version,
      isLicensed: false,
      effectivePricePreview: version.firstPurchaseTokenPrice,
      purchaseModePreview: 'first_purchase' as const,
      rating: ratings.get(version.id),
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
        ? 'owned' as const
        : bestTransitionPrice !== null
          ? 'transition' as const
          : 'first_purchase' as const,
      rating: ratings.get(version.id),
    };
  });
}

export async function getRatingSummaries(targetType: string, targetIds: string[]): Promise<Map<string, RatingSummary>> {
  const ids = targetIds.filter(Boolean);
  if (!ids.length) return new Map();

  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return new Map();

  const { data, error } = await supabase
    .from('dd_reviews')
    .select('target_id, stars')
    .eq('target_type', targetType)
    .in('target_id', ids);

  if (error || !data?.length) return new Map();

  const groups = new Map<string, number[]>();
  for (const row of data as Array<{ target_id: string; stars: number }>) {
    const arr = groups.get(row.target_id) ?? [];
    arr.push(row.stars);
    groups.set(row.target_id, arr);
  }

  const result = new Map<string, RatingSummary>();
  for (const [id, stars] of groups) {
    result.set(id, { average: stars.reduce((a, b) => a + b, 0) / stars.length, count: stars.length });
  }
  return result;
}

export async function upsertReview(input: { targetType: 'version' | 'dlc' | 'mod'; targetId: string; stars: number; comment?: string }) {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) throw new Error('Supabase not configured.');

  const { user } = await getSharedSessionProfile();
  if (!user) throw new Error('Please sign in to leave a review.');

  const { error } = await supabase.from('dd_reviews').upsert(
    { reviewer_id: user.id, target_type: input.targetType, target_id: input.targetId, stars: input.stars, comment: input.comment ?? null, updated_at: new Date().toISOString() },
    { onConflict: 'reviewer_id,target_type,target_id' },
  );
  if (error) throw new Error(error.message);
}

export async function getFundPoolBalance(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return 0;

  const { data } = await supabase.from('dd_fund_pool').select('balance').eq('id', 1).maybeSingle();
  return Number(data?.balance ?? 0);
}

export async function getDlcs(): Promise<Dlc[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('dd_dlc_list')
    .select('id, name, title, description, supported_version_ids, first_purchase_token_price, status, official_release_at, sold_count, dd_dlc_files(id, label, file_url, size_label)')
    .order('created_at');

  if (error || !data?.length) return [];

  const dlcs = (data as Array<{
    id: string; name: string; title: unknown; description: unknown;
    supported_version_ids: string[]; first_purchase_token_price: number;
    status: string; official_release_at: string | null; sold_count: number;
    dd_dlc_files?: Array<{ id: string; label: unknown; file_url: string; size_label: string }>;
  }>).map((item) => ({
    id: String(item.id),
    name: item.name,
    title: toLocalizedText(item.title),
    description: toLocalizedText(item.description),
    supportedVersionIds: item.supported_version_ids ?? [],
    firstPurchaseTokenPrice: item.first_purchase_token_price ?? 0,
    status: item.status as Dlc['status'],
    officialReleaseAt: item.official_release_at ?? null,
    soldCount: item.sold_count ?? 0,
    files: (item.dd_dlc_files ?? []).map((f): DlcFile => ({
      id: String(f.id),
      dlcId: String(item.id),
      label: toLocalizedText(f.label),
      fileUrl: f.file_url,
      size: f.size_label,
    })),
  }));

  const { user } = await getSharedSessionProfile();
  const ratings = await getRatingSummaries('dlc', dlcs.map((d) => d.id));

  if (!user) return dlcs.map((d) => ({ ...d, isLicensed: false, rating: ratings.get(d.id) }));

  const { data: licenses } = await supabase.from('dd_user_dlc_licenses').select('dlc_id').eq('user_id', user.id);
  const ownedIds = new Set((licenses ?? []).map((r) => String(r.dlc_id)));

  return dlcs.map((d) => ({ ...d, isLicensed: ownedIds.has(d.id), rating: ratings.get(d.id) }));
}

export async function submitMod(input: {
  nameZh: string; nameEn: string; descZh: string; descEn: string;
  baseVersionId: string; tags: string; compatibility: string;
  downloadUrl: string; tokenPrice: number;
}) {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) throw new Error('Supabase not configured.');

  const { user, profile } = await getSharedSessionProfile();
  if (!user) throw new Error('Please sign in to submit a mod.');

  const authorName = resolveSharedUserDisplayName(user, profile as Parameters<typeof resolveSharedUserDisplayName>[1]) ?? 'Member';
  const tagList = input.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => ({ zh: t, en: t }));

  const { error } = await supabase.from('dd_mods').insert({
    name: { zh: input.nameZh.trim(), en: input.nameEn.trim() },
    description: { zh: input.descZh.trim(), en: input.descEn.trim() },
    base_version_id: input.baseVersionId || null,
    tags: tagList,
    compatibility: { zh: input.compatibility.trim(), en: input.compatibility.trim() },
    author_id: user.id,
    author_name: authorName,
    download_url: input.downloadUrl.trim(),
    token_price: input.tokenPrice,
  });
  if (error) throw new Error(error.message);
}

export async function getMods(): Promise<Mod[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('dd_mods')
    .select('id, name, description, base_version_id, tags, compatibility, author_name, author_id, download_url, token_price, sold_count, is_official_pick')
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  const mods = data.map((item) => ({
    id: String(item.id),
    name: toLocalizedText(item.name),
    description: toLocalizedText(item.description),
    baseVersionId: item.base_version_id,
    tags: toLocalizedList(item.tags),
    compatibility: toLocalizedText(item.compatibility),
    author: item.author_name,
    authorId: item.author_id ?? null,
    downloadUrl: item.download_url ?? '',
    tokenPrice: item.token_price ?? 0,
    soldCount: item.sold_count ?? 0,
    isOfficialPick: item.is_official_pick ?? false,
  }));

  const { user } = await getSharedSessionProfile();
  const ratings = await getRatingSummaries('mod', mods.map((m) => m.id));

  if (!user) return mods.map((m) => ({ ...m, isLicensed: false, rating: ratings.get(m.id) }));

  const { data: licenses } = await supabase.from('dd_user_mod_licenses').select('mod_id').eq('user_id', user.id);
  const ownedIds = new Set((licenses ?? []).map((r) => String(r.mod_id)));

  return mods.map((m) => ({ ...m, isLicensed: ownedIds.has(m.id), rating: ratings.get(m.id) }));
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
    .select('id, title, content, linked_version_id, linked_mod_id, author_id, author_name, created_at, updated_at, status')
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  const rows = data as ThreadRow[];
  const profileMap = await getForumProfilesByIds(rows.map((row) => row.author_id));
  const replyCounts = await getReplyCountsByThreadIds(rows.map((row) => row.id));

  return withThreadProfiles(
    rows.map((row) => ({
      ...row,
      reply_count: replyCounts.get(row.id) ?? 0,
    })),
    profileMap,
  );
}

export async function getThreadById(threadId: string): Promise<Thread | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('dd_threads')
    .select('id, title, content, linked_version_id, linked_mod_id, author_id, author_name, created_at, updated_at, status')
    .eq('id', threadId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as ThreadRow;
  const [profileMap, replyCounts] = await Promise.all([
    getForumProfilesByIds([row.author_id]),
    getReplyCountsByThreadIds([row.id]),
  ]);

  return mapThreadRow({
    ...row,
    reply_count: replyCounts.get(row.id) ?? 0,
  }, row.author_id ? profileMap.get(row.author_id) ?? null : null);
}

export async function getThreadReplies(threadId: string): Promise<ThreadReply[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('dd_thread_replies')
    .select('id, thread_id, content, author_id, author_name, created_at, updated_at, status')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error || !data?.length) return [];

  const rows = data as ThreadReplyRow[];
  const profileMap = await getForumProfilesByIds(rows.map((row) => row.author_id));
  return withReplyProfiles(rows, profileMap);
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
    .select('id, title, content, linked_version_id, linked_mod_id, author_id, author_name, created_at, updated_at, status')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create thread.');
  }

  const profileMap = await getForumProfilesByIds([user.id]);
  return mapThreadRow({ ...(data as ThreadRow), reply_count: 0 }, profileMap.get(user.id) ?? null);
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
    .select('id, thread_id, content, author_id, author_name, created_at, updated_at, status')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create reply.');
  }

  const profileMap = await getForumProfilesByIds([user.id]);
  return mapThreadReplyRow(data as ThreadReplyRow, profileMap.get(user.id) ?? null);
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
