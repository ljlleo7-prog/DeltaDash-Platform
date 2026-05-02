import { createClient } from 'jsr:@supabase/supabase-js@2';

type ResolveReleaseDownloadRequest = {
  attemptId?: string;
  versionId?: string;
  fileId?: string;
  mode?: 'purchase' | 'download';
};

type DiagnosticContext = {
  requestId: string;
  attemptId?: string;
  versionId?: string;
  fileId?: string;
  userId?: string;
};

type DownloadAttemptRow = {
  id: string;
  user_id: string;
  version_id: string;
  file_id: string;
  status: 'started' | 'succeeded' | 'failed';
  created_at: string;
  metadata: Record<string, unknown> | null;
  dd_version_files:
    | {
        id: string;
        version_id: string;
        file_url: string;
        mediafire_quickkey: string | null;
      }
    | {
        id: string;
        version_id: string;
        file_url: string;
        mediafire_quickkey: string | null;
      }[]
    | null;
};

type ReleaseFileRecord = {
  id: string;
  version_id: string;
  file_url: string;
  mediafire_quickkey: string | null;
};

type ResolverResult = {
  directUrl: string;
  deliveryMode: 'direct_url' | 'mediafire_edge';
};

type ResolverErrorCode =
  | 'MISSING_FILE_URL'
  | 'MEDIAFIRE_DELETED'
  | 'MEDIAFIRE_RATE_LIMITED'
  | 'MEDIAFIRE_BLOCKED'
  | 'MEDIAFIRE_PARSE_FAILED'
  | 'MEDIAFIRE_FETCH_FAILED';

class ResolverError extends Error {
  code: ResolverErrorCode;
  status: number;

  constructor(code: ResolverErrorCode, message: string, status = 502) {
    super(message);
    this.name = 'ResolverError';
    this.code = code;
    this.status = status;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('DD_SUPABASE_URL')?.trim() || Deno.env.get('SUPABASE_URL')?.trim() || '';
const supabaseSecretKey = Deno.env.get('DD_SUPABASE_SECRET_KEY')?.trim() || Deno.env.get('SUPABASE_SECRET_KEYS')?.trim() || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() || '';

function logDiagnostic(level: 'info' | 'warn' | 'error', stage: string, context: DiagnosticContext, details: Record<string, unknown> = {}) {
  const payload = {
    scope: 'resolve-release-download',
    level,
    stage,
    requestId: context.requestId,
    attemptId: context.attemptId,
    versionId: context.versionId,
    fileId: context.fileId,
    userId: context.userId,
    ...details,
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}

function jsonResponse(status: number, body: Record<string, unknown>, context?: DiagnosticContext, stage?: string) {
  if (context && stage && status >= 400) {
    logDiagnostic(status >= 500 ? 'error' : 'warn', stage, context, {
      status,
      code: body.code,
      message: body.message,
    });
  }

  return new Response(JSON.stringify({ requestId: context?.requestId, ...body }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function ensureSupabaseConfigured() {
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Supabase function secrets are incomplete.');
  }
}

function createServiceClient() {
  ensureSupabaseConfigured();
  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function trimValue(value: string | null | undefined) {
  return value?.trim() || '';
}

function getBearerToken(authHeader: string) {
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function parseMediaFireQuickKey(value: string) {
  const trimmedValue = trimValue(value);
  if (!trimmedValue) {
    return '';
  }

  try {
    const url = new URL(trimmedValue);
    const host = url.hostname.toLowerCase();
    const pathSegments = url.pathname.split('/').filter(Boolean);

    if ((host === 'www.mediafire.com' || host === 'mediafire.com') && pathSegments[0] === 'file' && pathSegments[1]) {
      return pathSegments[1].trim();
    }
  } catch {
    // Treat plain quickkeys as already normalized.
  }

  return trimmedValue;
}

function getMediaFireShareUrl(fileRecord: ReleaseFileRecord) {
  const quickKey = parseMediaFireQuickKey(fileRecord.mediafire_quickkey ?? '');
  if (quickKey) {
    return `https://www.mediafire.com/file/${encodeURIComponent(quickKey)}/file`;
  }

  const fileUrl = trimValue(fileRecord.file_url);
  if (!fileUrl) {
    throw new ResolverError('MISSING_FILE_URL', 'Download URL is missing for this release file.', 400);
  }

  return fileUrl;
}

function isMediaFireUrl(value: string) {
  const trimmedValue = trimValue(value);
  if (!trimmedValue) {
    return false;
  }

  try {
    const url = new URL(trimmedValue);
    const host = url.hostname.toLowerCase();
    return host === 'www.mediafire.com' || host === 'mediafire.com';
  } catch {
    return false;
  }
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractMediaFireDirectUrl(html: string) {
  const downloadButtonMatch = html.match(/<a\b[^>]*id=["']downloadButton["'][^>]*href=["']([^"']+)["']/i);
  if (downloadButtonMatch?.[1]) {
    return decodeHtmlEntities(downloadButtonMatch[1]);
  }

  const hrefMatch = html.match(/href=["'](https?:\/\/download[^"'\s<>]+mediafire\.com[^"'\s<>]*)["']/i);
  if (hrefMatch?.[1]) {
    return decodeHtmlEntities(hrefMatch[1]);
  }

  const rawUrlMatch = html.match(/https?:\/\/download[^"'\s<>]+mediafire\.com[^"'\s<>]*/i);
  if (rawUrlMatch?.[0]) {
    return decodeHtmlEntities(rawUrlMatch[0]);
  }

  return '';
}

function classifyMediaFireHtml(html: string) {
  const lowerHtml = html.toLowerCase();

  if (
    lowerHtml.includes('file has been removed') ||
    lowerHtml.includes('file was removed') ||
    lowerHtml.includes('invalid or deleted file') ||
    lowerHtml.includes('file not found')
  ) {
    throw new ResolverError('MEDIAFIRE_DELETED', 'The MediaFire file appears to be deleted or unavailable.', 404);
  }

  if (
    lowerHtml.includes('too many requests') ||
    lowerHtml.includes('temporarily unavailable') ||
    lowerHtml.includes('rate limit') ||
    lowerHtml.includes('try again later')
  ) {
    throw new ResolverError('MEDIAFIRE_RATE_LIMITED', 'MediaFire is temporarily limiting download resolution. Please try again later.', 429);
  }
}

async function resolveMediaFirePublicPage(fileRecord: ReleaseFileRecord) {
  const shareUrl = getMediaFireShareUrl(fileRecord);
  let response: Response;

  try {
    response = await fetch(shareUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.mediafire.com/',
      },
      redirect: 'follow',
    });
  } catch {
    throw new ResolverError('MEDIAFIRE_FETCH_FAILED', 'Unable to reach MediaFire download page. Please try again later.');
  }

  if (response.status === 404 || response.status === 410) {
    throw new ResolverError('MEDIAFIRE_DELETED', 'The MediaFire file appears to be deleted or unavailable.', 404);
  }

  let html = '';
  try {
    html = await response.text();
  } catch {
    throw new ResolverError('MEDIAFIRE_FETCH_FAILED', 'Could not read MediaFire response. Please try again later.');
  }

  classifyMediaFireHtml(html);

  const directUrl = extractMediaFireDirectUrl(html);
  if (directUrl) {
    return directUrl;
  }

  if (response.status === 429) {
    throw new ResolverError('MEDIAFIRE_RATE_LIMITED', 'MediaFire is temporarily limiting download resolution. Please try again later.', 429);
  }

  if (response.status === 403) {
    throw new ResolverError('MEDIAFIRE_BLOCKED', 'MediaFire blocked server-side download resolution for this file. Please try again later or use another file host.', 502);
  }

  if (!response.ok) {
    throw new ResolverError('MEDIAFIRE_FETCH_FAILED', `MediaFire request failed with status ${response.status}.`);
  }

  throw new ResolverError('MEDIAFIRE_PARSE_FAILED', 'Could not find the current MediaFire direct download URL.');
}

async function resolveReleaseFileDownload(fileRecord: ReleaseFileRecord): Promise<ResolverResult> {
  const fileUrl = trimValue(fileRecord.file_url);
  const quickKey = parseMediaFireQuickKey(fileRecord.mediafire_quickkey ?? '');
  const isMediaFireBacked = Boolean(quickKey) || isMediaFireUrl(fileUrl);

  if (isMediaFireBacked) {
    return {
      directUrl: await resolveMediaFirePublicPage(fileRecord),
      deliveryMode: 'mediafire_edge',
    };
  }

  if (!fileUrl) {
    throw new ResolverError('MISSING_FILE_URL', 'Download URL is missing for this release file.', 400);
  }

  return {
    directUrl: fileUrl,
    deliveryMode: 'direct_url',
  };
}

const DOWNLOAD_ATTEMPT_TTL_MS = 10 * 60 * 1000;

function isAttemptFresh(createdAt: string) {
  const createdAtMs = Date.parse(createdAt);
  return Number.isFinite(createdAtMs) && Date.now() - createdAtMs <= DOWNLOAD_ATTEMPT_TTL_MS;
}

async function finalizeAttempt(
  serviceClient: ReturnType<typeof createServiceClient>,
  input: {
    attemptId: string;
    status: 'succeeded' | 'failed';
    failureReason?: string | null;
    deliveryMode: 'direct_url' | 'mediafire_edge';
    accessMode: 'purchase' | 'download';
    errorCode?: string | null;
  },
) {
  const metadata = {
    delivery_mode: input.deliveryMode,
    access_mode: input.accessMode,
    resolved_by: 'supabase_edge_function',
    ...(input.errorCode ? { error_code: input.errorCode } : {}),
  };

  const { error } = await serviceClient
    .from('dd_download_attempts')
    .update({
      status: input.status,
      failure_reason: input.failureReason ?? null,
      metadata,
    })
    .eq('id', input.attemptId);

  if (error) {
    throw new Error(error.message || 'Failed to update download attempt.');
  }
}

Deno.serve(async (request) => {
  const context: DiagnosticContext = {
    requestId: crypto.randomUUID(),
  };

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' }, context, 'method_not_allowed');
  }

  const authHeader = request.headers.get('Authorization')?.trim() || '';
  const bearerToken = getBearerToken(authHeader);
  logDiagnostic('info', 'request_received', context, {
    hasAuthorizationHeader: Boolean(authHeader),
    authHeaderScheme: authHeader ? authHeader.split(/\s+/, 1)[0] : null,
    hasBearerToken: Boolean(bearerToken),
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSecretKey: Boolean(supabaseSecretKey),
  });

  let payload: ResolveReleaseDownloadRequest;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { ok: false, code: 'INVALID_JSON', message: 'Invalid JSON body.' }, context, 'invalid_json');
  }

  const attemptId = trimValue(payload.attemptId);
  const versionId = trimValue(payload.versionId);
  const fileId = trimValue(payload.fileId);
  const accessMode = payload.mode === 'purchase' ? 'purchase' : 'download';
  context.attemptId = attemptId;
  context.versionId = versionId;
  context.fileId = fileId;

  logDiagnostic('info', 'payload_parsed', context, { accessMode });

  if (!attemptId || !versionId || !fileId) {
    return jsonResponse(400, { ok: false, code: 'MISSING_PARAMS', message: 'attemptId, versionId, and fileId are required.' }, context, 'missing_params');
  }

  try {
    const serviceClient = createServiceClient();

    const { data: attemptRow, error: attemptError } = await serviceClient
      .from('dd_download_attempts')
      .select('id, user_id, version_id, file_id, status, created_at, metadata')
      .eq('id', attemptId)
      .maybeSingle();

    if (attemptError) {
      logDiagnostic('error', 'attempt_lookup_failed', context, { databaseError: attemptError.message });
      return jsonResponse(500, { ok: false, code: 'ATTEMPT_LOOKUP_FAILED', message: 'Could not read the download attempt.' }, context, 'attempt_lookup_failed');
    }

    if (!attemptRow) {
      logDiagnostic('warn', 'attempt_missing_by_id', context);
      return jsonResponse(404, { ok: false, code: 'ATTEMPT_ID_NOT_FOUND', message: 'Download attempt ID was not found.' }, context, 'attempt_missing_by_id');
    }

    const attempt = attemptRow as DownloadAttemptRow;
    context.userId = attempt.user_id;

    if (attempt.version_id !== versionId || attempt.file_id !== fileId) {
      logDiagnostic('warn', 'attempt_payload_mismatch', context, {
        storedVersionId: attempt.version_id,
        storedFileId: attempt.file_id,
      });
      return jsonResponse(409, { ok: false, code: 'ATTEMPT_PAYLOAD_MISMATCH', message: 'Download attempt does not match the requested file.' }, context, 'attempt_payload_mismatch');
    }

    if (attempt.status !== 'started' && attempt.status !== 'succeeded') {
      return jsonResponse(400, { ok: false, code: 'ATTEMPT_INACTIVE', message: 'Download attempt is no longer active.' }, context, 'attempt_inactive');
    }

    if (!isAttemptFresh(attempt.created_at)) {
      logDiagnostic('warn', 'attempt_expired', context, { createdAt: attempt.created_at });
      return jsonResponse(410, { ok: false, code: 'ATTEMPT_EXPIRED', message: 'Download attempt expired. Please try the download again.' }, context, 'attempt_expired');
    }

    const { data: fileRecord, error: fileError } = await serviceClient
      .from('dd_version_files')
      .select('id, version_id, file_url, mediafire_quickkey')
      .eq('id', attempt.file_id)
      .eq('version_id', attempt.version_id)
      .maybeSingle();

    if (fileError) {
      logDiagnostic('error', 'file_lookup_failed', context, { databaseError: fileError.message });
      return jsonResponse(500, { ok: false, code: 'FILE_LOOKUP_FAILED', message: 'Could not read the release file.' }, context, 'file_lookup_failed');
    }

    if (!fileRecord) {
      await finalizeAttempt(serviceClient, {
        attemptId,
        status: 'failed',
        failureReason: 'Release file not found for download attempt.',
        deliveryMode: 'direct_url',
        accessMode,
        errorCode: 'FILE_NOT_FOUND',
      });
      return jsonResponse(404, { ok: false, code: 'FILE_NOT_FOUND', message: 'Release file not found.' }, context, 'file_not_found');
    }

    let deliveryMode: 'direct_url' | 'mediafire_edge' = 'direct_url';

    try {
      const resolvedDownload = await resolveReleaseFileDownload(fileRecord);
      deliveryMode = resolvedDownload.deliveryMode;

      await finalizeAttempt(serviceClient, {
        attemptId,
        status: 'succeeded',
        deliveryMode,
        accessMode,
      });

      logDiagnostic('info', 'download_resolved', context, { deliveryMode });
      return jsonResponse(200, {
        ok: true,
        directUrl: resolvedDownload.directUrl,
        deliveryMode,
      }, context);
    } catch (error) {
      const resolverError = error instanceof ResolverError ? error : null;
      const message = error instanceof Error ? error.message : 'Download link resolution failed.';
      await finalizeAttempt(serviceClient, {
        attemptId,
        status: 'failed',
        failureReason: message,
        deliveryMode,
        accessMode,
        errorCode: resolverError?.code ?? 'RESOLUTION_FAILED',
      });
      logDiagnostic('warn', 'resolver_failed', context, {
        code: resolverError?.code ?? 'RESOLUTION_FAILED',
        message,
        deliveryMode,
      });
      return jsonResponse(resolverError?.status ?? 500, {
        ok: false,
        code: resolverError?.code ?? 'RESOLUTION_FAILED',
        message,
      }, context, 'resolver_failed');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download link resolution failed.';
    logDiagnostic('error', 'unexpected_failure', context, { message });
    return jsonResponse(500, { ok: false, code: 'RESOLUTION_FAILED', message }, context, 'unexpected_failure');
  }
});
