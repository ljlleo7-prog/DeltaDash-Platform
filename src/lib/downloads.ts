import { createClient } from '@supabase/supabase-js';
import { getOfficialLoginUrl, getSupabaseClient, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

export type DownloadOption = {
  primaryUrl: string;
  baiduNetdiskUrl?: string | null;
  baiduExtractionCode?: string | null;
};

export type RedeemDownloadResult =
  | { ok: true; primaryUrl: string; chargedTokens: number; alreadyOwned: boolean; baiduNetdiskUrl?: string | null; baiduExtractionCode?: string | null }
  | { ok: false; code: 'NOT_CONFIGURED' | 'NOT_SIGNED_IN' | 'FILE_NOT_FOUND' | 'INSUFFICIENT_TOKENS' | 'REDEEM_FAILED'; message: string; loginUrl?: string };

type RedeemPayload = {
  versionId: string;
  fileId: string;
  mode: 'purchase' | 'download';
};

type RpcResult = {
  success?: boolean;
  message?: string;
  charged_tokens?: number;
  already_owned?: boolean;
  attempt_id?: string;
};

type ReleaseFileDownloadRow = {
  file_url?: string | null;
  baidu_netdisk_url?: string | null;
  baidu_extraction_code?: string | null;
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

async function getDownloadOptions(ddClient: ReturnType<typeof createGpsClient>, versionId: string, fileId: string): Promise<DownloadOption> {
  const { data, error } = await ddClient
    .from('dd_version_files')
    .select('file_url, baidu_netdisk_url, baidu_extraction_code')
    .eq('id', fileId)
    .eq('version_id', versionId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Release file not found.');
  }

  const file = data as ReleaseFileDownloadRow;
  const primaryUrl = file.file_url?.trim() || '';
  if (!primaryUrl) {
    throw new Error('Download URL is missing for this release file.');
  }

  return {
    primaryUrl,
    baiduNetdiskUrl: file.baidu_netdisk_url?.trim() || null,
    baiduExtractionCode: file.baidu_extraction_code?.trim() || null,
  };
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
    .select('id, version_id')
    .eq('id', fileId)
    .eq('version_id', versionId)
    .maybeSingle();

  if (fileError || !file) {
    return { ok: false, code: 'FILE_NOT_FOUND', message: 'Release file not found.' };
  }

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

  const attemptId = typeof rpcResult?.attempt_id === 'string' ? rpcResult.attempt_id.trim() : '';
  if (!attemptId) {
    return { ok: false, code: 'REDEEM_FAILED', message: 'Download attempt could not be created.' };
  }

  try {
    const downloadOptions = await getDownloadOptions(ddClient, versionId, fileId);

    return {
      ok: true,
      primaryUrl: downloadOptions.primaryUrl,
      baiduNetdiskUrl: downloadOptions.baiduNetdiskUrl,
      baiduExtractionCode: downloadOptions.baiduExtractionCode,
      chargedTokens: Math.max(0, Number(rpcResult?.charged_tokens ?? 0)),
      alreadyOwned: Boolean(rpcResult?.already_owned),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download redemption failed.';
    return { ok: false, code: 'REDEEM_FAILED', message };
  }
}
