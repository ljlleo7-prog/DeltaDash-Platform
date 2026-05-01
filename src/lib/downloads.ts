import { createClient } from '@supabase/supabase-js';
import { getMediaFireDirectDownloadUrl } from '@/lib/mediafire';
import { getOfficialLoginUrl, getSupabaseClient, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

export type RedeemDownloadResult =
  | { ok: true; directUrl: string; chargedTokens: number; alreadyOwned: boolean }
  | { ok: false; code: 'NOT_CONFIGURED' | 'NOT_SIGNED_IN' | 'FILE_NOT_FOUND' | 'INSUFFICIENT_TOKENS' | 'REDEEM_FAILED'; message: string; loginUrl?: string };

type RedeemPayload = {
  versionId: string;
  fileId: string;
  mode: 'purchase' | 'download';
};

type ReleaseFileRecord = {
  id: string;
  version_id: string;
  mediafire_quickkey: string | null;
  file_url: string;
};

type RpcResult = {
  success?: boolean;
  message?: string;
  charged_tokens?: number;
  already_owned?: boolean;
};

function createGpsClient(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function getFallbackLoginUrl() {
  if (typeof window === 'undefined') {
    return getOfficialLoginUrl('/download');
  }

  return getOfficialLoginUrl(`${window.location.pathname}${window.location.search}${window.location.hash}` || '/download');
}

function resolveConfiguredMediaFireEnv(name: string) {
  const env = import.meta.env as Record<string, string | undefined>;
  return env[name]?.trim() || '';
}

function canResolveMediaFireQuickKey() {
  return Boolean(
    resolveConfiguredMediaFireEnv('VITE_MEDIAFIRE_SESSION_TOKEN')
    || resolveConfiguredMediaFireEnv('VITE_MEDIAFIRE_API_KEY')
    || (
      resolveConfiguredMediaFireEnv('VITE_MEDIAFIRE_APP_ID')
      && resolveConfiguredMediaFireEnv('VITE_MEDIAFIRE_EMAIL')
      && resolveConfiguredMediaFireEnv('VITE_MEDIAFIRE_PASSWORD')
    ),
  );
}

export async function redeemReleaseDownload({ versionId, fileId, mode }: RedeemPayload): Promise<RedeemDownloadResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'Supabase env is not configured.' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'Supabase client unavailable.' };
  }

  const { data: authData } = await supabase.auth.getSession();
  const session = authData.session;
  const user = session?.user;

  if (!user || !session?.access_token) {
    return {
      ok: false,
      code: 'NOT_SIGNED_IN',
      message: 'You must sign in before downloading.',
      loginUrl: getFallbackLoginUrl(),
    };
  }

  const ddClient = createGpsClient(session.access_token);

  const { data: file, error: fileError } = await ddClient
    .from('dd_version_files')
    .select('id, version_id, mediafire_quickkey, file_url')
    .eq('id', fileId)
    .eq('version_id', versionId)
    .maybeSingle();

  if (fileError || !file) {
    return { ok: false, code: 'FILE_NOT_FOUND', message: 'Release file not found.' };
  }

  const releaseFile = file as ReleaseFileRecord;
  const rpcName = mode === 'purchase' ? 'purchase_release_license' : 'redeem_release_download';
  const { data: rpcData, error: rpcError } = await ddClient.rpc(rpcName, {
    p_version_id: versionId,
    p_file_id: fileId,
  });

  if (rpcError) {
    return { ok: false, code: 'REDEEM_FAILED', message: rpcError.message };
  }

  const rpcResult = Array.isArray(rpcData) ? rpcData[0] : rpcData as RpcResult | null;

  if (rpcResult && rpcResult.success === false) {
    if (rpcResult.message === 'Insufficient tokens') {
      return { ok: false, code: 'INSUFFICIENT_TOKENS', message: rpcResult.message };
    }

    return { ok: false, code: 'REDEEM_FAILED', message: rpcResult.message ?? 'Download redemption failed.' };
  }

  try {
    const canUseMediaFireApi = Boolean(releaseFile.mediafire_quickkey) && canResolveMediaFireQuickKey();
    const directUrl = canUseMediaFireApi
      ? await getMediaFireDirectDownloadUrl(releaseFile.mediafire_quickkey!)
      : releaseFile.file_url;

    await ddClient.from('dd_download_attempts').update({
      status: 'succeeded',
      metadata: {
        delivery_mode: canUseMediaFireApi ? 'mediafire' : 'public',
        access_mode: mode,
      },
    }).eq('user_id', user.id).eq('version_id', versionId).eq('file_id', fileId).eq('status', 'started');

    return {
      ok: true,
      directUrl,
      chargedTokens: Math.max(0, Number(rpcResult?.charged_tokens ?? 0)),
      alreadyOwned: Boolean(rpcResult?.already_owned),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download redemption failed.';

    await ddClient.from('dd_download_attempts').update({
      status: 'failed',
      failure_reason: message,
      metadata: {
        delivery_mode: releaseFile.mediafire_quickkey && canResolveMediaFireQuickKey() ? 'mediafire' : 'public',
        access_mode: mode,
      },
    }).eq('user_id', user.id).eq('version_id', versionId).eq('file_id', fileId).eq('status', 'started');

    return { ok: false, code: 'REDEEM_FAILED', message };
  }
}
