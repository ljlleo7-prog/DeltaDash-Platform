'use client';

import { useEffect, useState } from 'react';
import { getOfficialLoginUrl, getSharedSessionProfile, getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { getVersions } from '@/lib/platform-data';
import { toLocalizedText as normalizeLocalizedText, type Language, type LocalizedText } from '@/lib/i18n';
import type { Version } from '@/lib/types';

type DlcFileInput = {
  id: string;
  labelZh: string;
  labelEn: string;
  fileUrl: string;
  sizeLabel: string;
};

type DlcFormState = {
  name: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  price: string;
  status: 'active' | 'withdrawn';
  supportedVersionIds: string[];
};

const emptyForm: DlcFormState = {
  name: '', titleZh: '', titleEn: '', descZh: '', descEn: '',
  price: '0', status: 'active', supportedVersionIds: [],
};

function makeFileRow(): DlcFileInput {
  return { id: crypto.randomUUID(), labelZh: '', labelEn: '', fileUrl: '', sizeLabel: '' };
}

function toLocalizedText(zh: string, en: string): LocalizedText {
  return { zh: zh.trim(), en: en.trim() };
}

export function DlcPublishForm({ language }: { language: Language }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [form, setForm] = useState<DlcFormState>(emptyForm);
  const [files, setFiles] = useState<DlcFileInput[]>([makeFileRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const copy = {
    checking: language === 'en' ? 'Checking access…' : '正在检查权限…',
    guestTitle: language === 'en' ? 'DLC publishing' : 'DLC 发布',
    guestDesc: language === 'en' ? 'Sign in through Geeks Production Studio SSO to publish DLC.' : '请通过 Geeks Production Studio 单点登录后发布 DLC。',
    signIn: language === 'en' ? 'Sign in' : '登录',
    deniedTitle: language === 'en' ? 'Access denied' : '无权访问',
    deniedDesc: language === 'en' ? 'Only approved developers can publish DLC.' : '只有已批准的开发者可发布 DLC。',
    formTitle: language === 'en' ? 'Publish DLC' : '发布 DLC',
    name: language === 'en' ? 'DLC identifier (unique)' : 'DLC 标识符（唯一）',
    titleZh: language === 'en' ? 'Title (Chinese)' : '标题（中文）',
    titleEn: language === 'en' ? 'Title (English)' : '标题（英文）',
    descZh: language === 'en' ? 'Description (Chinese)' : '描述（中文）',
    descEn: language === 'en' ? 'Description (English)' : '描述（英文）',
    price: language === 'en' ? 'Price (tokens)' : '价格（代币）',
    status: language === 'en' ? 'Status' : '状态',
    active: language === 'en' ? 'Active' : '上线',
    withdrawn: language === 'en' ? 'Withdrawn' : '下架',
    supportedVersions: language === 'en' ? 'Supported versions' : '支持的版本',
    filesTitle: language === 'en' ? 'DLC files' : 'DLC 文件',
    addFile: language === 'en' ? 'Add file' : '添加文件',
    labelZh: language === 'en' ? 'Label (Chinese)' : '标签（中文）',
    labelEn: language === 'en' ? 'Label (English)' : '标签（英文）',
    fileUrl: language === 'en' ? 'File URL' : '文件链接',
    sizeLabel: language === 'en' ? 'Size label' : '大小标签',
    remove: language === 'en' ? 'Remove' : '移除',
    publish: language === 'en' ? 'Publish DLC' : '发布 DLC',
    publishing: language === 'en' ? 'Publishing…' : '发布中…',
    success: language === 'en' ? 'DLC published successfully.' : 'DLC 发布成功。',
    failed: language === 'en' ? 'Failed to publish DLC.' : 'DLC 发布失败。',
    invalidPrice: language === 'en' ? 'Price must be 0 or greater.' : '价格须大于或等于 0。',
  };

  useEffect(() => {
    void (async () => {
      const [{ user, authority }, versionList] = await Promise.all([getSharedSessionProfile(), getVersions()]);
      setSignedIn(Boolean(user));
      setIsAdmin(authority.isReleasePublisher);
      setVersions(versionList);
      setLoading(false);
    })();
  }, []);

  const loginUrl = getOfficialLoginUrl('/dlc/publish');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured) { setMessage('Supabase not configured.'); return; }
    const supabase = getSupabaseClient();
    if (!supabase) { setMessage('Client unavailable.'); return; }

    const price = Number.parseInt(form.price, 10);
    if (Number.isNaN(price) || price < 0) { setMessage(copy.invalidPrice); return; }

    setSubmitting(true);
    try {
      const { data: dlcRow, error: dlcError } = await supabase
        .from('dd_dlc_list')
        .insert({
          name: form.name,
          title: toLocalizedText(form.titleZh, form.titleEn),
          description: toLocalizedText(form.descZh, form.descEn),
          supported_version_ids: form.supportedVersionIds,
          first_purchase_token_price: price,
          status: form.status,
        })
        .select('id')
        .single();

      if (dlcError || !dlcRow) throw dlcError ?? new Error(copy.failed);

      const activeFiles = files.filter((f) => f.fileUrl.trim());
      if (activeFiles.length) {
        const { error: fileError } = await supabase.from('dd_dlc_files').insert(
          activeFiles.map((f) => ({
            dlc_id: dlcRow.id,
            label: toLocalizedText(f.labelZh, f.labelEn),
            file_url: f.fileUrl.trim(),
            size_label: f.sizeLabel.trim(),
          })),
        );
        if (fileError) throw fileError;
      }

      setMessage(copy.success);
      setForm(emptyForm);
      setFiles([makeFileRow()]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : copy.failed);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">{copy.checking}</div>;

  if (!signedIn) return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
      <h2 className="text-xl font-semibold text-white">{copy.guestTitle}</h2>
      <p className="mt-3 text-slate-400">{copy.guestDesc}</p>
      <a href={loginUrl} className="mt-5 inline-flex rounded-full border border-[var(--accent-hot)]/40 bg-[rgba(85,199,255,0.08)] px-5 py-3 font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]">{copy.signIn}</a>
    </div>
  );

  if (!isAdmin) return (
    <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-100">
      <h2 className="text-xl font-semibold text-white">{copy.deniedTitle}</h2>
      <p className="mt-3 text-red-100/80">{copy.deniedDesc}</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold text-white">{copy.formTitle}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={copy.name}>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.status}>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DlcFormState['status'] })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
            <option value="active">{copy.active}</option>
            <option value="withdrawn">{copy.withdrawn}</option>
          </select>
        </Field>
        <Field label={copy.titleZh}>
          <input required value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.titleEn}>
          <input required value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.descZh}>
          <textarea required rows={3} value={form.descZh} onChange={(e) => setForm({ ...form, descZh: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.descEn}>
          <textarea required rows={3} value={form.descEn} onChange={(e) => setForm({ ...form, descEn: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.price}>
          <input type="number" min="0" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
      </div>

      <Field label={copy.supportedVersions}>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
          {versions.map((v) => (
            <label key={v.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={form.supportedVersionIds.includes(v.id)}
                onChange={(e) => setForm({ ...form, supportedVersionIds: e.target.checked ? [...form.supportedVersionIds, v.id] : form.supportedVersionIds.filter((id) => id !== v.id) })}
                className="accent-[var(--accent-cold)]"
              />
              {v.name}
            </label>
          ))}
        </div>
      </Field>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{copy.filesTitle}</h3>
          <button type="button" onClick={() => setFiles((c) => [...c, makeFileRow()])} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white">{copy.addFile}</button>
        </div>
        {files.map((file) => (
          <div key={file.id} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
            <Field label={copy.labelZh}>
              <input value={file.labelZh} onChange={(e) => setFiles((c) => c.map((f) => f.id === file.id ? { ...f, labelZh: e.target.value } : f))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
            </Field>
            <Field label={copy.labelEn}>
              <input value={file.labelEn} onChange={(e) => setFiles((c) => c.map((f) => f.id === file.id ? { ...f, labelEn: e.target.value } : f))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
            </Field>
            <Field label={copy.fileUrl}>
              <input value={file.fileUrl} onChange={(e) => setFiles((c) => c.map((f) => f.id === file.id ? { ...f, fileUrl: e.target.value } : f))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
            </Field>
            <Field label={copy.sizeLabel}>
              <input value={file.sizeLabel} onChange={(e) => setFiles((c) => c.map((f) => f.id === file.id ? { ...f, sizeLabel: e.target.value } : f))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
            </Field>
            <button type="button" onClick={() => setFiles((c) => c.length === 1 ? c : c.filter((f) => f.id !== file.id))} className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-medium text-slate-200 md:col-span-2 md:w-fit">{copy.remove}</button>
          </div>
        ))}
      </div>

      {message && <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">{message}</div>}

      <button type="submit" disabled={submitting} className="rounded-full border border-[var(--accent-hot)]/40 bg-[rgba(85,199,255,0.08)] px-6 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)] disabled:opacity-60">
        {submitting ? copy.publishing : copy.publish}
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
