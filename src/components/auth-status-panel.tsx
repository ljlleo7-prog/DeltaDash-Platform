'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOfficialLoginUrl, getSharedSessionProfile, getSupabaseClient, isReleaseAdminProfile } from '@/lib/supabase';
import type { Language } from '@/lib/i18n';

type AuthState = {
  user: { id: string; email?: string | null } | null;
  profile: { display_name?: string | null; tester_programs?: string[] | null } | null;
  isAdmin: boolean;
  loading: boolean;
};

function getDisplayName(state: AuthState, language: Language) {
  if (state.profile?.display_name) return state.profile.display_name;
  if (state.user?.email) return state.user.email.split('@')[0];
  return language === 'en' ? 'Member' : '成员';
}

export function AuthStatusPanel({ language }: { language: Language }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    loading: true,
  });
  const [loginUrl, setLoginUrl] = useState(() => getOfficialLoginUrl('/'));

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function loadProfile() {
      const { user, profile } = await getSharedSessionProfile();
      setState({
        user: user ? { id: user.id, email: user.email ?? null } : null,
        profile: profile as AuthState['profile'],
        isAdmin: isReleaseAdminProfile(profile),
        loading: false,
      });
    }

    void loadProfile();

    if (typeof window !== 'undefined') {
      const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/';
      setLoginUrl(getOfficialLoginUrl(nextPath));
    }

    if (!supabase) {
      return;
    }

    const { data } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const copy = {
    loading: language === 'en' ? 'Checking SSO status…' : '正在检查单点登录状态…',
    guestMode: language === 'en' ? 'Guest mode' : '访客模式',
    guestDescription:
      language === 'en'
        ? 'Browse public releases and workshop content, or sign in with the official site SSO.'
        : '可浏览公开版本与创意工坊内容，或使用官网单点登录后继续操作。',
    signIn: language === 'en' ? 'Sign in' : '登录',
    ssoFallback: language === 'en' ? 'Signed in with shared SSO' : '已通过共享单点登录',
    adminBadge: language === 'en' ? 'Release admin' : '发布管理员',
    publishRelease: language === 'en' ? 'Publish release' : '发布版本',
    signOut: language === 'en' ? 'Sign out' : '退出登录',
  };

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setState({ user: null, profile: null, isAdmin: false, loading: false });
  }

  if (state.loading) {
    return <div className="dd-panel text-sm text-[var(--text-dim)]">{copy.loading}</div>;
  }

  if (!state.user) {
    return (
      <div className="dd-panel text-sm text-[var(--text-dim)]">
        <p className="dd-label">{copy.guestMode}</p>
        <p className="dd-copy mt-3">{copy.guestDescription}</p>
        <Link href={loginUrl} className="dd-inline-action mt-4">
          {copy.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="dd-panel text-sm text-[var(--text-dim)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--text-main)]">{getDisplayName(state, language)}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{state.user.email ?? copy.ssoFallback}</p>
        </div>
        {state.isAdmin ? <span className="dd-badge">{copy.adminBadge}</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {state.isAdmin ? (
          <Link href="/versions/publish" className="dd-inline-action">
            {copy.publishRelease}
          </Link>
        ) : null}
        <button onClick={handleSignOut} className="dd-inline-action">
          {copy.signOut}
        </button>
      </div>
    </div>
  );
}
