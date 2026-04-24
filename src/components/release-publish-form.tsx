'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOfficialLoginUrl, getSharedSessionProfile, getSupabaseClient, isSupabaseConfigured, uploadOfficialReleaseFile } from '@/lib/supabase';
import type { Language, LocalizedText } from '@/lib/i18n';
import type { Version } from '@/lib/types';

type ReleaseFileInput = {
  id: string;
  labelZh: string;
  labelEn: string;
  fileType: Version['files'][number]['fileType'];
  file: File | null;
};

function makeFileRow(): ReleaseFileInput {
  return {
    id: crypto.randomUUID(),
    labelZh: '',
    labelEn: '',
    fileType: 'bundle',
    file: null,
  };
}

function toLocalizedText(zh: string, en: string): LocalizedText {
  return {
    zh: zh.trim(),
    en: en.trim(),
  };
}

export function ReleasePublishForm({ versions, language }: { versions: Version[]; language: Language }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<ReleaseFileInput[]>([makeFileRow()]);
  const [form, setForm] = useState({
    name: '',
    titleZh: '',
    titleEn: '',
    status: 'beta' as Version['status'],
    summaryZh: '',
    summaryEn: '',
    changelogZh: '',
    changelogEn: '',
    parentVersionId: '',
  });

  const copy = {
    envMissing: language === 'en' ? 'Supabase env is not configured.' : '尚未配置 Supabase 环境变量。',
    clientMissing: language === 'en' ? 'Supabase client unavailable.' : 'Supabase 客户端不可用。',
    createFailed: language === 'en' ? 'Failed to create version.' : '创建版本失败。',
    publishSuccess: language === 'en' ? 'Official release published successfully.' : '官方版本发布成功。',
    publishFailed: language === 'en' ? 'Failed to publish release.' : '发布版本失败。',
    checking: language === 'en' ? 'Checking release admin access…' : '正在检查发布管理员权限…',
    guestTitle: language === 'en' ? 'Official release publishing' : '官方版本发布',
    guestDescription:
      language === 'en'
        ? 'You must sign in through the official Geeks Production Studio SSO before publishing releases.'
        : '发布官方版本前，必须先通过 Geeks Production Studio 官方单点登录。',
    signIn: language === 'en' ? 'Sign in to continue' : '登录后继续',
    deniedTitle: language === 'en' ? 'Access denied' : '无权访问',
    deniedDescription:
      language === 'en'
        ? 'Only profiles in the DeltaDash or Developer tester programs can publish official releases.'
        : '只有加入 DeltaDash 或 Developer 测试计划的账号才可发布官方版本。',
    formTitle: language === 'en' ? 'Publish official release' : '发布官方版本',
    formDescription:
      language === 'en'
        ? 'Create a version entry, attach an optional parent branch, and upload official files to the dd-official-releases bucket.'
        : '创建版本条目、关联可选父分支，并将官方文件上传到 dd-official-releases 存储桶。',
    versionName: language === 'en' ? 'Version name' : '版本编号',
    titleZh: language === 'en' ? 'Title (Chinese)' : '标题（中文）',
    titleEn: language === 'en' ? 'Title (English)' : '标题（英文）',
    status: language === 'en' ? 'Status' : '状态',
    parentVersion: language === 'en' ? 'Parent version' : '父版本',
    noParent: language === 'en' ? 'No parent' : '无父版本',
    summaryZh: language === 'en' ? 'Summary (Chinese)' : '简介（中文）',
    summaryEn: language === 'en' ? 'Summary (English)' : '简介（英文）',
    changelogZh: language === 'en' ? 'Changelog (Chinese, one item per line)' : '更新说明（中文，每行一条）',
    changelogEn: language === 'en' ? 'Changelog (English, one item per line)' : '更新说明（英文，每行一条）',
    filesTitle: language === 'en' ? 'Release files' : '发布文件',
    filesDescription:
      language === 'en'
        ? 'Add downloadable assets for this official release and label them in both languages.'
        : '为该官方版本添加下载文件，并分别填写中英文标签。',
    addFile: language === 'en' ? 'Add file' : '添加文件',
    labelZh: language === 'en' ? 'Label (Chinese)' : '标签（中文）',
    labelEn: language === 'en' ? 'Label (English)' : '标签（英文）',
    remove: language === 'en' ? 'Remove' : '移除',
    publishing: language === 'en' ? 'Publishing…' : '发布中…',
    publish: language === 'en' ? 'Publish release' : '发布版本',
    stable: language === 'en' ? 'Stable' : '稳定版',
    beta: language === 'en' ? 'Beta' : '测试版',
    experimental: language === 'en' ? 'Experimental' : '实验版',
  };

  useEffect(() => {
    void (async () => {
      const { user, isReleaseAdmin } = await getSharedSessionProfile();
      setSignedIn(Boolean(user));
      setIsAdmin(isReleaseAdmin);
      setLoading(false);
    })();
  }, []);

  const loginUrl = getOfficialLoginUrl('/versions/publish');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured) {
      setMessage(copy.envMissing);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage(copy.clientMissing);
      return;
    }

    setSubmitting(true);

    try {
      const changelogZh = form.changelogZh.split('\n').map((item) => item.trim()).filter(Boolean);
      const changelogEn = form.changelogEn.split('\n').map((item) => item.trim()).filter(Boolean);
      const changelog = changelogZh.map((zh, index) => ({
        zh,
        en: changelogEn[index] ?? '',
      }));

      const { data: versionRow, error: versionError } = await supabase
        .from('dd_version_list')
        .insert({
          name: form.name,
          title: toLocalizedText(form.titleZh, form.titleEn),
          status: form.status,
          summary: toLocalizedText(form.summaryZh, form.summaryEn),
          changelog,
        })
        .select('id')
        .single();

      if (versionError || !versionRow) {
        throw versionError ?? new Error(copy.createFailed);
      }

      if (form.parentVersionId) {
        const { error: branchError } = await supabase.from('dd_branch_map').insert({
          parent_version_id: form.parentVersionId,
          child_version_id: versionRow.id,
          relation_type: form.status === 'experimental' ? 'experimental' : 'branch',
        });

        if (branchError) {
          throw branchError;
        }
      }

      const activeFiles = files.filter((entry) => entry.file && entry.labelZh.trim() && entry.labelEn.trim());

      for (const entry of activeFiles) {
        const upload = await uploadOfficialReleaseFile(entry.file!, versionRow.id, entry.fileType);
        const { error: fileError } = await supabase.from('dd_version_files').insert({
          version_id: versionRow.id,
          label: toLocalizedText(entry.labelZh, entry.labelEn),
          file_type: entry.fileType,
          file_url: upload.publicUrl,
          size_label: `${Math.max(1, Math.round(entry.file!.size / 1024 / 1024))} MB`,
        });

        if (fileError) {
          throw fileError;
        }
      }

      setMessage(copy.publishSuccess);
      router.refresh();
      setForm({
        name: '',
        titleZh: '',
        titleEn: '',
        status: 'beta',
        summaryZh: '',
        summaryEn: '',
        changelogZh: '',
        changelogEn: '',
        parentVersionId: '',
      });
      setFiles([makeFileRow()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.publishFailed);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">{copy.checking}</div>;
  }

  if (!signedIn) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        <h2 className="text-xl font-semibold text-white">{copy.guestTitle}</h2>
        <p className="mt-3 leading-6 text-slate-400">{copy.guestDescription}</p>
        <a
          href={loginUrl}
          className="mt-5 inline-flex rounded-full border border-[var(--accent-hot)]/40 bg-[rgba(85,199,255,0.08)] px-5 py-3 font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)]"
        >
          {copy.signIn}
        </a>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-100">
        <h2 className="text-xl font-semibold text-white">{copy.deniedTitle}</h2>
        <p className="mt-3 leading-6 text-red-100/80">{copy.deniedDescription}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">{copy.formTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{copy.formDescription}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={copy.versionName}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.status}>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Version['status'] })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
            <option value="stable">{copy.stable}</option>
            <option value="beta">{copy.beta}</option>
            <option value="experimental">{copy.experimental}</option>
          </select>
        </Field>
        <Field label={copy.titleZh}>
          <input value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} required className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.titleEn}>
          <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} required className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.parentVersion}>
          <select value={form.parentVersionId} onChange={(e) => setForm({ ...form, parentVersionId: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
            <option value="">{copy.noParent}</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>{version.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={copy.summaryZh}>
          <textarea value={form.summaryZh} onChange={(e) => setForm({ ...form, summaryZh: e.target.value })} required rows={4} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.summaryEn}>
          <textarea value={form.summaryEn} onChange={(e) => setForm({ ...form, summaryEn: e.target.value })} required rows={4} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={copy.changelogZh}>
          <textarea value={form.changelogZh} onChange={(e) => setForm({ ...form, changelogZh: e.target.value })} rows={5} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
        <Field label={copy.changelogEn}>
          <textarea value={form.changelogEn} onChange={(e) => setForm({ ...form, changelogEn: e.target.value })} rows={5} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
        </Field>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{copy.filesTitle}</h3>
            <p className="mt-2 text-sm text-slate-400">{copy.filesDescription}</p>
          </div>
          <button type="button" onClick={() => setFiles((current) => [...current, makeFileRow()])} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white">
            {copy.addFile}
          </button>
        </div>

        {files.map((entry) => (
          <div key={entry.id} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_1fr_1fr_1.4fr_auto]">
            <input
              placeholder={copy.labelZh}
              value={entry.labelZh}
              onChange={(e) => setFiles((current) => current.map((item) => item.id === entry.id ? { ...item, labelZh: e.target.value } : item))}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
            />
            <input
              placeholder={copy.labelEn}
              value={entry.labelEn}
              onChange={(e) => setFiles((current) => current.map((item) => item.id === entry.id ? { ...item, labelEn: e.target.value } : item))}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
            />
            <select
              value={entry.fileType}
              onChange={(e) => setFiles((current) => current.map((item) => item.id === entry.id ? { ...item, fileType: e.target.value as ReleaseFileInput['fileType'] } : item))}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
            >
              <option value="rules">rules</option>
              <option value="cards">cards</option>
              <option value="driver_pack">driver_pack</option>
              <option value="bundle">bundle</option>
            </select>
            <input
              type="file"
              onChange={(e) => setFiles((current) => current.map((item) => item.id === entry.id ? { ...item, file: e.target.files?.[0] ?? null } : item))}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300"
            />
            <button
              type="button"
              onClick={() => setFiles((current) => current.length === 1 ? current : current.filter((item) => item.id !== entry.id))}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-medium text-slate-200"
            >
              {copy.remove}
            </button>
          </div>
        ))}
      </div>

      {message ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">{message}</div> : null}

      <button type="submit" disabled={submitting} className="rounded-full border border-[var(--accent-hot)]/40 bg-[rgba(85,199,255,0.08)] px-6 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)] disabled:cursor-not-allowed disabled:opacity-60">
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
