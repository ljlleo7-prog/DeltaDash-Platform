function trimValue(value: string | null | undefined) {
  return value?.trim() || '';
}

export function parseMediaFireQuickKey(value: string) {
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

export function isMediaFireUrl(value: string) {
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

function getMediaFireShareUrl(fileUrl: string, quickKey?: string | null) {
  const trimmedUrl = trimValue(fileUrl);
  const normalizedQuickKey = parseMediaFireQuickKey(quickKey ?? '');

  if (trimmedUrl && isMediaFireUrl(trimmedUrl)) {
    return trimmedUrl;
  }

  if (normalizedQuickKey) {
    return `https://www.mediafire.com/file/${encodeURIComponent(normalizedQuickKey)}/file`;
  }

  throw new Error('MediaFire share link or quickkey is missing.');
}

function extractDirectDownloadUrlFromHtml(html: string) {
  const directDownloadMatch = html.match(/https?:\/\/download[^"'\s<>]+mediafire\.com[^"'\s<>]*/i);
  if (directDownloadMatch?.[0]) {
    return directDownloadMatch[0];
  }

  const buttonHrefMatch = html.match(/id=["']downloadButton["'][^>]*href=["']([^"']+)["']/i);
  if (buttonHrefMatch?.[1]) {
    return buttonHrefMatch[1];
  }

  const windowLocationMatch = html.match(/window\.location\.href\s*=\s*["']([^"']+)["']/i);
  if (windowLocationMatch?.[1]) {
    return windowLocationMatch[1];
  }

  return '';
}

export async function getMediaFireDirectDownloadUrl(input: { fileUrl?: string | null; quickKey?: string | null }) {
  const shareUrl = getMediaFireShareUrl(input.fileUrl ?? '', input.quickKey ?? '');
  const response = await fetch(shareUrl, {
    method: 'GET',
    cache: 'no-store',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`MediaFire share page request failed with status ${response.status}.`);
  }

  const resolvedUrl = response.url?.trim() || '';
  if (resolvedUrl && resolvedUrl !== shareUrl && !isMediaFireUrl(resolvedUrl)) {
    return resolvedUrl;
  }

  const html = await response.text();
  const directUrl = extractDirectDownloadUrlFromHtml(html).trim();
  if (!directUrl) {
    throw new Error('MediaFire direct download URL is unavailable from the share page response.');
  }

  return directUrl;
}
