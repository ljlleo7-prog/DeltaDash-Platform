'use client';

import { useEffect, useState } from 'react';
import { getOfficialLoginUrl, getSharedSessionProfile } from '@/lib/supabase';
import { submitMod, getDlcs } from '@/lib/platform-data';
import type { Language } from '@/lib/i18n';
import type { Version } from '@/lib/types';

export function ModSubmitForm({ versions, language }: { versions: Version[]; language: Language }) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    nameZh: '', nameEn: '', descZh: '', descEn: '',
    baseVersionId: '', tags: '', compatibility: '',
    downloadUrl: '', tokenPrice: '0',
  });

  useEffect(() => {
    void getSharedSessionProfile().then(({ user }) => {
      setSignedIn(Boolean(user));
      setLoading(false);
    });
  }, []);

  const loginUrl = getOfficialLoginUrl('/mods');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const price = Number.parseInt(form.tokenPrice, 10);
    if (Number.isNaN(price) || price < 0 || price > 100) {
      setMessage(language === 'en' ? 'Token price must be 0–100.' : '代币价格须在 0–100 之间。');
      return;
    }
    if (!form.downloadUrl.trim().startsWith('http')) {
      setMessage(language === 'en' ? 'Download URL must be a valid link.' : '下载链接须为有效 URL。');
      return;
    }
    setSubmitting(true);
    try {
      await submitMod({ ...form, tokenPrice: price });
      setMessage(language === 'en' ? 'Mod submitted successfully.' : '模组提交成功。');
      setForm({ nameZh: '', nameEn: '', descZh: '', descEn: '', baseVersionId: '', tags: '', compatibility: '', downloadUrl: '', tokenPrice: '0' });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : (language === 'en' ? 'Submission failed.' : '提交失败。'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  if (!signedIn) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Submit a mod' : '投稿模组'}</h2>
        <p className="mt-3 text-slate-400">{language === 'en' ? 'Sign in to submit your mod to the workshop.' : '请登录后投稿模组。'}</p>
        <a href={loginUrl} className="mt-5 inline-flex rounded-full border border-[var(--accent-hot)]/40 bg-[rgba(85,199,255,0.08)] px-5 py-3 font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]">
          {language === 'en' ? 'Sign in' : '登录'}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">{language === 'en' ? 'Submit a mod' : '投稿模组'}</h2>
        <p className="mt-2 text-sm text-slate-400">
          {language === 'en'
            ? 'Free mods are eligible for official contribution awards. Paid mods (1–100 tokens) earn 70% of each sale directly to your wallet.'
            : '免费模组可获得官方贡献奖励。付费模组（1–100 代币）每笔销售的 70% 直接入账。'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={language === 'en' ? 'Name (Chinese)' : '名称（中文）'}>
          <input required value={form.nameZh} onChange={(e) => setForm({ ...form, nameZh: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={language === 'en' ? 'Name (English)' : '名称（英文）'}>
          <input required value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={language === 'en' ? 'Description (Chinese)' : '描述（中文）'}>
          <textarea required rows={3} value={form.descZh} onChange={(e) => setForm({ ...form, descZh: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={language === 'en' ? 'Description (English)' : '描述（英文）'}>
          <textarea required rows={3} value={form.descEn} onChange={(e) => setForm({ ...form, descEn: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={language === 'en' ? 'Base version' : '基础版本'}>
          <select value={form.baseVersionId} onChange={(e) => setForm({ ...form, baseVersionId: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
            <option value="">{language === 'en' ? 'Select version' : '选择版本'}</option>
            {versions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label={language === 'en' ? 'Compatibility' : '兼容性'}>
          <input value={form.compatibility} onChange={(e) => setForm({ ...form, compatibility: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={language === 'en' ? 'Tags (comma-separated)' : '标签（逗号分隔）'}>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={language === 'en' ? 'Token price (0 = free)' : '代币价格（0 = 免费）'}>
          <input type="number" min="0" max="100" step="1" value={form.tokenPrice} onChange={(e) => setForm({ ...form, tokenPrice: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
      </div>

      <Field label={language === 'en' ? 'Download URL' : '下载链接'}>
        <input required type="url" value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} placeholder="https://" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
      </Field>

      {message && <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">{message}</div>}

      <button type="submit" disabled={submitting} className="rounded-full border border-[var(--accent-hot)]/40 bg-[rgba(85,199,255,0.08)] px-6 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)] disabled:opacity-60">
        {submitting ? (language === 'en' ? 'Submitting…' : '提交中…') : (language === 'en' ? 'Submit mod' : '提交模组')}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="mb-2 block font-medium text-slate-200">{label}</span>
      {children}
    </label>
  );
}
