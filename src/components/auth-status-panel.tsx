'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getOfficialLoginUrl,
  getSharedSessionProfile,
  getSupabaseClient,
  isReleaseAdminProfile,
  resolveSharedTokenBalance,
  resolveSharedUserDisplayName,
} from '@/lib/supabase';
import type { Language } from '@/lib/i18n';

type AuthProfile = {
  display_name?: string | null;
  token_balance?: number | null;
  tester_programs?: string[] | null;
  developer_status?: string | null;
};

type AuthState = {
  user: Awaited<ReturnType<typeof getSharedSessionProfile>>['user'];
  profile: AuthProfile | null;
  isApprovedDeveloper: boolean;
  loading: boolean;
};

function getDisplayName(state: AuthState, language: Language) {
  return resolveSharedUserDisplayName(state.user, state.profile) ?? (language === 'en' ? 'Member' : '成员');
}

export function AuthStatusPanel({ language }: { language: Language }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isApprovedDeveloper: false,
    loading: true,
  });

  const loginUrl = typeof window === 'undefined'
    ? getOfficialLoginUrl('/')
    : getOfficialLoginUrl(`${window.location.pathname}${window.location.search}${window.location.hash}` || '/');

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function loadProfile() {
      const { user, profile } = await getSharedSessionProfile();
      setState({
        user,
        profile: profile as AuthProfile | null,
        isApprovedDeveloper: isReleaseAdminProfile(profile),
        loading: false,
      });
    }

    void loadProfile();

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
    developerBadge: language === 'en' ? 'Approved developer' : '已批准开发者',
    publishRelease: language === 'en' ? 'Publish release' : '发布版本',
    signOut: language === 'en' ? 'Sign out' : '退出登录',
    tokenBalance: language === 'en' ? 'Tokens remaining' : '剩余代币',
  };

  const balance = resolveSharedTokenBalance(state.profile);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setState({ user: null, profile: null, isApprovedDeveloper: false, loading: false });
  }

  if (state.loading) {
    return <div className="dd-panel text-sm text-[var(--text-dim)]">{copy.loading}</div>;
  }

  if (!state.user) {
    return (
      <div className="dd-panel text-sm text-[var(--text-dim)]">
        <p className="dd-label">{copy.guestMode}</p>
        <p className="dd-copy mt-3">{copy.guestDescription}</p>
        <a href={loginUrl} className="dd-inline-action mt-4">
          {copy.signIn}
        </a>
      </div>
    );
  }

  return (
    <div className="dd-panel text-sm text-[var(--text-dim)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--text-main)]">{getDisplayName(state, language)}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{state.user.email ?? copy.ssoFallback}</p>
          {balance !== null ? (
            <p className="mt-2 text-xs text-[var(--accent-cold)]">{copy.tokenBalance}: {balance}</p>
          ) : null}
        </div>
        {state.isApprovedDeveloper ? <span className="dd-badge">{copy.developerBadge}</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {state.isApprovedDeveloper ? (
          <Link to="/versions/publish" className="dd-inline-action">
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
