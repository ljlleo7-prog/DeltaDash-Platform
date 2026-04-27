import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sharedCookieDomain = process.env.NEXT_PUBLIC_SHARED_COOKIE_DOMAIN?.trim() || '';
const loginOrigin = process.env.NEXT_PUBLIC_LOGIN_ORIGIN?.trim() || 'https://geeksproductionstudio.com';

export const isSupabaseConfigured = Boolean(url && anonKey);

type ProfileWithAuthority = {
  tester_programs?: string[] | null;
  developer_status?: string | null;
};

export type ProfileAuthority = {
  isDeveloper: boolean;
  isReleasePublisher: boolean;
  isTaggedDeltaDashTester: boolean;
  isPurchaseExempt: boolean;
};

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

function getSharedCookieDomainAttribute() {
  return sharedCookieDomain ? `; domain=${sharedCookieDomain}` : '';
}

const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const name = `${key}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const parts = decodedCookie.split(';');

    for (const rawPart of parts) {
      const part = rawPart.trim();
      if (part.startsWith(name)) {
        return part.slice(name.length);
      }
    }

    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=${encodeURIComponent(value)}${getSharedCookieDomainAttribute()}; path=/; SameSite=Lax; Secure; max-age=${60 * 60 * 24 * 365}`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=${getSharedCookieDomainAttribute()}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
  },
};

function normalizeProgramList(programs: string[] | null | undefined) {
  return (programs ?? []).map((program) => program.trim().toLowerCase()).filter(Boolean);
}

export function resolveProfileAuthority(profile: ProfileWithAuthority | null | undefined): ProfileAuthority {
  const normalizedPrograms = normalizeProgramList(profile?.tester_programs);
  const isDeveloper = profile?.developer_status?.trim().toUpperCase() === 'APPROVED';
  const isTaggedDeltaDashTester = normalizedPrograms.includes('deltadash');
  const isReleasePublisher = isDeveloper;
  const isPurchaseExempt = isDeveloper || isTaggedDeltaDashTester;

  return {
    isDeveloper,
    isReleasePublisher,
    isTaggedDeltaDashTester,
    isPurchaseExempt,
  };
}

export function isReleaseAdminProfile(profile: ProfileWithAuthority | null | undefined) {
  return resolveProfileAuthority(profile).isReleasePublisher;
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (typeof window === 'undefined') {
    if (!serverClient) {
      serverClient = createClient(url!, anonKey!);
    }
    return serverClient;
  }

  if (!browserClient) {
    browserClient = createClient(url!, anonKey!, {
      auth: {
        storage: cookieStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

export async function getSharedSessionProfile() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      session: null,
      user: null,
      profile: null,
      authority: resolveProfileAuthority(null),
      isReleaseAdmin: false,
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  if (!user) {
    return {
      session: null,
      user: null,
      profile: null,
      authority: resolveProfileAuthority(null),
      isReleaseAdmin: false,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const authority = resolveProfileAuthority(profile);

  return { session, user, profile, authority, isReleaseAdmin: authority.isReleasePublisher };
}

export async function uploadOfficialReleaseFile(file: File, versionId: string, fileType: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `${versionId}/${fileType}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage.from('dd-official-releases').upload(objectPath, file, {
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('dd-official-releases').getPublicUrl(objectPath);
  return { objectPath, publicUrl: data.publicUrl };
}

export function getOfficialLoginUrl(nextPath = '/') {
  const target = encodeURIComponent(nextPath);
  return `${loginOrigin}/login?redirect_to=${target}`;
}
