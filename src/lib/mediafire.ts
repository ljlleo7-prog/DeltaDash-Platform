const MEDIAFIRE_API_BASE = 'https://www.mediafire.com/api/1.5';
const MEDIAFIRE_APP_ID = import.meta.env.VITE_MEDIAFIRE_APP_ID?.trim() || '';
const MEDIAFIRE_SESSION_TOKEN = import.meta.env.VITE_MEDIAFIRE_SESSION_TOKEN?.trim() || '';
const MEDIAFIRE_API_KEY = import.meta.env.VITE_MEDIAFIRE_API_KEY?.trim() || '';
const MEDIAFIRE_EMAIL = import.meta.env.VITE_MEDIAFIRE_EMAIL?.trim() || '';
const MEDIAFIRE_PASSWORD = import.meta.env.VITE_MEDIAFIRE_PASSWORD?.trim() || '';

let cachedSessionToken = MEDIAFIRE_SESSION_TOKEN;

function ensureMediaFireConfigured() {
  if (MEDIAFIRE_APP_ID && (cachedSessionToken || MEDIAFIRE_API_KEY)) {
    return;
  }

  if (MEDIAFIRE_APP_ID && MEDIAFIRE_EMAIL && MEDIAFIRE_PASSWORD) {
    return;
  }

  throw new Error('MediaFire credentials are not configured.');
}

async function callMediaFire(path: string, params: URLSearchParams) {
  const response = await fetch(`${MEDIAFIRE_API_BASE}${path}?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`MediaFire request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const result = payload?.response;

  if (!result || result.result !== 'Success') {
    throw new Error(result?.message ?? 'MediaFire request failed.');
  }

  return result;
}

async function loginMediaFire() {
  if (cachedSessionToken) {
    return cachedSessionToken;
  }

  ensureMediaFireConfigured();

  if (!MEDIAFIRE_APP_ID || !MEDIAFIRE_EMAIL || !MEDIAFIRE_PASSWORD) {
    throw new Error('MediaFire login credentials are not configured.');
  }

  const params = new URLSearchParams({
    response_format: 'json',
    application_id: MEDIAFIRE_APP_ID,
    email: MEDIAFIRE_EMAIL,
    password: MEDIAFIRE_PASSWORD,
    signature_version: '1',
  });

  const result = await callMediaFire('/user/get_session_token.php', params);
  const token = result.session_token as string | undefined;

  if (!token) {
    throw new Error('MediaFire did not return a session token.');
  }

  cachedSessionToken = token;
  return token;
}

async function getMediaFireSessionToken() {
  ensureMediaFireConfigured();

  if (cachedSessionToken) {
    return cachedSessionToken;
  }

  if (MEDIAFIRE_API_KEY) {
    return MEDIAFIRE_API_KEY;
  }

  return loginMediaFire();
}

export async function getMediaFireDirectDownloadUrl(quickKey: string) {
  const trimmedQuickKey = quickKey.trim();
  if (!trimmedQuickKey) {
    throw new Error('MediaFire quickkey is missing.');
  }

  const sessionToken = await getMediaFireSessionToken();
  const params = new URLSearchParams({
    response_format: 'json',
    quick_key: trimmedQuickKey,
  });

  if (cachedSessionToken) {
    params.set('session_token', sessionToken);
  } else {
    params.set('api_key', sessionToken);
  }

  const result = await callMediaFire('/file/get_links.php', params);
  const directUrl = result?.links?.[0]?.direct_download as string | undefined;

  if (!directUrl) {
    throw new Error('MediaFire direct download URL is unavailable.');
  }

  return directUrl;
}
