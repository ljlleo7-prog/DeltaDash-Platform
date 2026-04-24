import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

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
    document.cookie = `${key}=${encodeURIComponent(value)}; domain=.geeksproductionstudio.com; path=/; SameSite=Lax; Secure; max-age=${60 * 60 * 24 * 365}`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; domain=.geeksproductionstudio.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
  },
};

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

export function isReleaseAdminProfile(profile: { tester_programs?: string[] | null } | null | undefined) {
  if (!profile?.tester_programs?.length) return false;

  return profile.tester_programs.some((program) => {
    const normalized = program.trim().toLowerCase();
    return normalized === 'deltadash' || normalized === 'developer';
  });
}

export async function getSharedSessionProfile() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { session: null, user: null, profile: null, isReleaseAdmin: false };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  if (!user) {
    return { session: null, user: null, profile: null, isReleaseAdmin: false };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { session, user, profile, isReleaseAdmin: isReleaseAdminProfile(profile) };
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
  return `https://geeksproductionstudio.com/login?redirect_to=${target}`;
}
