'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthorName } from '@/components/author-name';
import { EmptyState } from '@/components/empty-state';
import { useLanguage } from '@/components/language-provider';
import { localize } from '@/lib/i18n';
import { createThread, createThreadReply, getThreadDetail, getThreads } from '@/lib/platform-data';
import { getOfficialLoginUrl, getSharedSessionProfile, getSupabaseClient } from '@/lib/supabase';
import type { Thread, ThreadDetail } from '@/lib/types';

type AsyncState<T> = {
  loading: boolean;
  data: T;
  error: boolean;
};

type SessionState = {
  loading: boolean;
  isSignedIn: boolean;
};

function LoadingBlock({ message }: { message: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">{message}</div>;
}

function ErrorBlock({ message }: { message: string }) {
  return <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-100">{message}</div>;
}

function useClientData<T>(loader: () => Promise<T>, initialData: T): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ loading: true, data: initialData, error: false });

  useEffect(() => {
    let active = true;

    void loader()
      .then((data) => {
        if (!active) return;
        setState({ loading: false, data, error: false });
      })
      .catch(() => {
        if (!active) return;
        setState({ loading: false, data: initialData, error: true });
      });

    return () => {
      active = false;
    };
  }, [initialData, loader]);

  return state;
}

function useSessionState() {
  const [state, setState] = useState<SessionState>({ loading: true, isSignedIn: false });

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function loadSession() {
      const { user } = await getSharedSessionProfile();
      setState({ loading: false, isSignedIn: Boolean(user) });
    }

    void loadSession();

    if (!supabase) {
      return;
    }

    const { data } = supabase.auth.onAuthStateChange(() => {
      void loadSession();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

function formatDate(value: string, language: 'zh' | 'en') {
  const date = new Date(value);
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function LoginPrompt({ currentPath, title, description, actionLabel }: { currentPath: string; title: string; description: string; actionLabel: string }) {
  return (
    <div className="rounded-3xl border border-[var(--accent-cold)]/20 bg-[rgba(85,199,255,0.08)] p-5 text-sm text-slate-200">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 leading-6 text-slate-300">{description}</p>
      <a href={getOfficialLoginUrl(currentPath)} className="mt-4 inline-flex rounded-full border border-[var(--accent-cold)]/30 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-highlight)] transition hover:border-[var(--accent-cold)]/60">
        {actionLabel}
      </a>
    </div>
  );
}

function ThreadComposer({ onCreated }: { onCreated: (thread: Thread) => void }) {
  const { language } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const thread = await createThread({ title, content });
      setTitle('');
      setContent('');
      onCreated(thread);
      setMessage(language === 'en' ? 'Thread posted.' : '讨论串已发布。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : language === 'en' ? 'Failed to create thread.' : '创建讨论串失败。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{language === 'en' ? 'Start a thread' : '发起讨论'}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{language === 'en' ? 'Open a new community discussion' : '开启新的社区讨论'}</h2>
        </div>
      </div>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="thread-title">
            {language === 'en' ? 'Title' : '标题'}
          </label>
          <input
            id="thread-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent-cold)]/45"
            placeholder={language === 'en' ? 'Summarize the topic' : '概括这次讨论主题'}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="thread-content">
            {language === 'en' ? 'Post' : '正文'}
          </label>
          <textarea
            id="thread-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={6}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-[var(--accent-cold)]/45"
            placeholder={language === 'en' ? 'Describe the issue, feedback, strategy, or mod discussion here.' : '在这里写下问题、反馈、策略或模组讨论内容。'}
            required
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">{language === 'en' ? 'MVP stores one authored text into both zh/en fields.' : 'MVP 会将单次输入同步保存到 zh/en 字段。'}</p>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full border border-[var(--accent-hot)]/30 bg-[rgba(255,77,90,0.16)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-main)] transition hover:border-[var(--accent-hot)]/55 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (language === 'en' ? 'Posting…' : '发布中…') : language === 'en' ? 'Post thread' : '发布讨论串'}
          </button>
        </div>
        {message ? <p className="text-sm text-slate-300">{message}</p> : null}
      </form>
    </section>
  );
}

function ThreadReplyComposer({ threadId, onCreated }: { threadId: string; onCreated: () => void }) {
  const { language } = useLanguage();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage(null);

    try {
      await createThreadReply({ threadId, content });
      setContent('');
      onCreated();
      setMessage(language === 'en' ? 'Reply posted.' : '回复已发布。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : language === 'en' ? 'Failed to post reply.' : '回复发布失败。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="rounded-3xl border border-white/10 bg-black/30 p-5" onSubmit={handleSubmit}>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="reply-content">
        {language === 'en' ? 'Reply' : '回复'}
      </label>
      <textarea
        id="reply-content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={5}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-[var(--accent-cold)]/45"
        placeholder={language === 'en' ? 'Add your reply to this thread.' : '为这个讨论串添加回复。'}
        required
      />
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500">{language === 'en' ? 'Replies are public after publishing.' : '回复发布后将公开显示。'}</p>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full border border-[var(--accent-cold)]/30 bg-[rgba(85,199,255,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-highlight)] transition hover:border-[var(--accent-cold)]/55 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (language === 'en' ? 'Replying…' : '回复中…') : language === 'en' ? 'Post reply' : '发布回复'}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-300">{message}</p> : null}
    </form>
  );
}

export function CommunityClientPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { loading, data: initialThreads, error } = useClientData(useMemo(() => getThreads, []), [] as Thread[]);
  const { loading: sessionLoading, isSignedIn } = useSessionState();
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(85,199,255,0.12),rgba(255,77,90,0.08))] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-cold)]">{language === 'en' ? 'Community' : '社区'}</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{language === 'en' ? 'Discussion linked to releases and mods' : '围绕版本与模组的社区讨论'}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">
              {language === 'en'
                ? 'Use the forum to collect feedback, bug reports, strategy discussion, and mod talk in one public place.'
                : '使用论坛集中整理反馈、问题汇报、策略讨论与模组交流。'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
            {threads.length} {language === 'en' ? 'threads' : '个讨论串'}
          </div>
        </div>
      </section>

      {!sessionLoading && isSignedIn ? (
        <ThreadComposer
          onCreated={(thread) => {
            setThreads((current) => [thread, ...current]);
            navigate(`/community/${thread.id}`);
          }}
        />
      ) : null}

      {!sessionLoading && !isSignedIn ? (
        <LoginPrompt
          currentPath="/community"
          title={language === 'en' ? 'Sign in to start posting' : '登录后即可发帖'}
          description={language === 'en' ? 'Reading stays public, but creating threads and replies uses the shared official SSO session.' : '浏览讨论保持公开，但发帖和回复需要使用共享的官网单点登录会话。'}
          actionLabel={language === 'en' ? 'Sign in with official account' : '使用官方账号登录'}
        />
      ) : null}

      {loading ? <LoadingBlock message={language === 'en' ? 'Loading discussion threads…' : '正在加载讨论串…'} /> : null}
      {error ? <ErrorBlock message={language === 'en' ? 'Failed to load discussion threads.' : '加载讨论串失败。'} /> : null}

      {!loading && !error && threads.length ? (
        <section className="space-y-4">
          {threads.map((thread) => (
            <article key={thread.id} className="rounded-3xl border border-white/10 bg-black/30 p-5 transition hover:border-[var(--accent-cold)]/30">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <Link to={`/community/${thread.id}`} className="text-lg font-semibold text-white transition hover:text-[var(--accent-highlight)]">
                    {localize(thread.title, language)}
                  </Link>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-400">{localize(thread.content, language)}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                    {thread.linkedVersionId ? <span className="rounded-full border border-[var(--accent-hot)]/25 bg-[rgba(255,77,90,0.14)] px-3 py-1 text-[var(--text-main)]">{language === 'en' ? `Version: ${thread.linkedVersionId}` : `版本：${thread.linkedVersionId}`}</span> : null}
                    {thread.linkedModId ? <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1">{language === 'en' ? `Mod: ${thread.linkedModId}` : `模组：${thread.linkedModId}`}</span> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 md:min-w-44">
                  <p><AuthorName author={thread.author} /></p>
                  <p className="mt-1 text-slate-500">{formatDate(thread.createdAt, language)}</p>
                  <p className="mt-3 text-slate-400">{thread.replyCount} {language === 'en' ? 'replies' : '条回复'}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!loading && !error && !threads.length ? (
        <EmptyState
          title={language === 'en' ? 'No discussion threads yet' : '暂无讨论串'}
          description={language === 'en' ? 'Be the first one to open a community thread for the current build, release feedback, or mod discussion.' : '成为第一个为当前版本、发布反馈或模组交流开启社区讨论的人。'}
        />
      ) : null}
    </div>
  );
}

export function CommunityThreadPage({ threadId }: { threadId: string }) {
  const { language } = useLanguage();
  const { loading, data: detail, error } = useClientData(useMemo(() => () => getThreadDetail(threadId), [threadId]), null as ThreadDetail | null);
  const { loading: sessionLoading, isSignedIn } = useSessionState();
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);

  useEffect(() => {
    setThreadDetail(detail);
  }, [detail]);

  async function refreshDetail() {
    const nextDetail = await getThreadDetail(threadId);
    setThreadDetail(nextDetail);
  }

  if (loading) {
    return <LoadingBlock message={language === 'en' ? 'Loading thread…' : '正在加载讨论串…'} />;
  }

  if (error) {
    return <ErrorBlock message={language === 'en' ? 'Failed to load this thread.' : '加载该讨论串失败。'} />;
  }

  if (!threadDetail) {
    return (
      <EmptyState
        title={language === 'en' ? 'Thread not found' : '未找到讨论串'}
        description={language === 'en' ? 'The requested thread may have been removed or is not available in this build.' : '请求的讨论串可能已被移除，或当前构建中不可用。'}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/community" className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-cold)] transition hover:text-[var(--accent-highlight)]">
          {language === 'en' ? '← Back to community' : '← 返回社区'}
        </Link>
      </div>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-white">{localize(threadDetail.title, language)}</h1>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{localize(threadDetail.content, language)}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
              {threadDetail.linkedVersionId ? <span className="rounded-full border border-[var(--accent-hot)]/25 bg-[rgba(255,77,90,0.14)] px-3 py-1 text-[var(--text-main)]">{language === 'en' ? `Version: ${threadDetail.linkedVersionId}` : `版本：${threadDetail.linkedVersionId}`}</span> : null}
              {threadDetail.linkedModId ? <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1">{language === 'en' ? `Mod: ${threadDetail.linkedModId}` : `模组：${threadDetail.linkedModId}`}</span> : null}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 md:min-w-44">
            <p><AuthorName author={threadDetail.author} /></p>
            <p className="mt-1 text-slate-500">{formatDate(threadDetail.createdAt, language)}</p>
            <p className="mt-3 text-slate-400">{threadDetail.replies.length} {language === 'en' ? 'replies' : '条回复'}</p>
          </div>
        </div>
      </section>

      {!sessionLoading && isSignedIn ? (
        <ThreadReplyComposer threadId={threadId} onCreated={() => { void refreshDetail(); }} />
      ) : null}

      {!sessionLoading && !isSignedIn ? (
        <LoginPrompt
          currentPath={`/community/${threadId}`}
          title={language === 'en' ? 'Sign in to join the thread' : '登录后加入讨论'}
          description={language === 'en' ? 'You can read this thread publicly, but replying uses the shared official SSO session.' : '你可以公开阅读此讨论串，但回复需要使用共享的官网单点登录会话。'}
          actionLabel={language === 'en' ? 'Sign in to reply' : '登录后回复'}
        />
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">{language === 'en' ? 'Replies' : '回复'}</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{threadDetail.replies.length}</span>
        </div>

        {threadDetail.replies.length ? threadDetail.replies.map((reply) => (
          <article key={reply.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white"><AuthorName author={reply.author} /></p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(reply.createdAt, language)}</p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{localize(reply.content, language)}</p>
          </article>
        )) : (
          <EmptyState
            title={language === 'en' ? 'No replies yet' : '暂无回复'}
            description={language === 'en' ? 'Once someone replies, the discussion will continue here.' : '一旦有人回复，讨论将会在这里继续。'}
          />
        )}
      </section>
    </div>
  );
}
