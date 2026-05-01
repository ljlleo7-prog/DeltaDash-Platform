import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const sharedCookieDomain = import.meta.env.VITE_SHARED_COOKIE_DOMAIN?.trim() || '';
const loginOrigin = import.meta.env.VITE_LOGIN_ORIGIN?.trim() || 'https://geeksproductionstudio.com';
const appOrigin = import.meta.env.VITE_APP_ORIGIN?.trim() || 'https://deltadash.geeksproductionstudio.com';

export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabaseUrl = url ?? '';
export const supabaseAnonKey = anonKey ?? '';

type ProfileWithAuthority = {
  display_name?: string | null;
  token_balance?: number | null;
  tester_programs?: string[] | null;
  developer_status?: string | null;
};

export type ProfileAuthority = {
  isDeveloper: boolean;
  isReleasePublisher: boolean;
  isTaggedDeltaDashTester: boolean;
  isPurchaseExempt: boolean;
};

export type SharedSessionProfile = {
  session: Session | null;
  user: User | null;
  profile: Record<string, unknown> | null;
  authority: ProfileAuthority;
  isReleaseAdmin: boolean;
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

export function resolveSharedUserDisplayName(user: User | null, profile: ProfileWithAuthority | null | undefined) {
  const profileDisplayName = profile?.display_name?.trim();
  if (profileDisplayName) {
    return profileDisplayName;
  }

  const userMetadata = user?.user_metadata as Record<string, unknown> | undefined;
  const metadataNameCandidates = [userMetadata?.display_name, userMetadata?.full_name, userMetadata?.name];

  for (const candidate of metadataNameCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  const email = user?.email?.trim();
  if (email) {
    return email.split('@')[0];
  }

  return null;
}

export function resolveSharedTokenBalance(profile: ProfileWithAuthority | null | undefined) {
  return typeof profile?.token_balance === 'number' && Number.isFinite(profile.token_balance)
    ? profile.token_balance
    : null;
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

export async function getSharedSessionProfile(): Promise<SharedSessionProfile> {
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
    data: { session: initialSession },
  } = await supabase.auth.getSession();

  let session = initialSession;
  let user = session?.user ?? null;

  if (!user) {
    const {
      data: { user: fallbackUser },
    } = await supabase.auth.getUser();

    if (fallbackUser) {
      user = fallbackUser;
      const {
        data: { session: refreshedSession },
      } = await supabase.auth.getSession();
      session = refreshedSession;
    }
  }

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

export async function reauthenticateWithPassword(password: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email?.trim();
  if (!email) {
    throw new Error('You must be signed in to confirm this action.');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message || 'Password confirmation failed.');
  }
}

export function getOfficialLoginUrl(nextPath = '/') {
  const target = new URL(nextPath, appOrigin).toString();
  return `${loginOrigin}/login?redirect_to=${encodeURIComponent(target)}`;
}
