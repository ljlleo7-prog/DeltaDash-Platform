'use client';

import { useEffect, useState } from 'react';
import { getOfficialLoginUrl, getSharedSessionProfile, getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { toLocalizedText as normalizeLocalizedText, type Language, type LocalizedText } from '@/lib/i18n';
import type { Version } from '@/lib/types';

type TransitionPriceInput = {
  id: string;
  fromVersionId: string;
  transitionType: 'upgrade' | 'fallback';
  tokenPrice: string;
};

type ReleaseFileInput = {
  id: string;
  labelZh: string;
  labelEn: string;
  fileType: Version['files'][number]['fileType'];
  fileUrl: string;
  mediafireQuickKey: string;
  sizeLabel: string;
};

type PublishFormState = {
  name: string;
  titleZh: string;
  titleEn: string;
  status: Version['status'];
  summaryZh: string;
  summaryEn: string;
  changelogZh: string;
  changelogEn: string;
  parentVersionId: string;
  firstPurchaseTokenPrice: string;
};

type ReleasePublishFormProps = {
  versions: Version[];
  versionsLoading?: boolean;
  language: Language;
  editVersionId?: string;
};

const emptyForm: PublishFormState = {
  name: '',
  titleZh: '',
  titleEn: '',
  status: 'beta',
  summaryZh: '',
  summaryEn: '',
  changelogZh: '',
  changelogEn: '',
  parentVersionId: '',
  firstPurchaseTokenPrice: '0',
};

function makeTransitionRow(): TransitionPriceInput {
  return {
    id: crypto.randomUUID(),
    fromVersionId: '',
    transitionType: 'upgrade',
    tokenPrice: '0',
  };
}

function makeReleaseFileRow(): ReleaseFileInput {
  return {
    id: crypto.randomUUID(),
    labelZh: '',
    labelEn: '',
    fileType: 'bundle',
    fileUrl: '',
    mediafireQuickKey: '',
    sizeLabel: '',
  };
}

function toLocalizedText(zh: string, en: string): LocalizedText {
  return {
    zh: zh.trim(),
    en: en.trim(),
  };
}

export function ReleasePublishForm({ versions, versionsLoading = false, language, editVersionId }: ReleasePublishFormProps) {
  const [loading, setLoading] = useState(true);
  const [isPublisher, setIsPublisher] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydratingEditVersion, setHydratingEditVersion] = useState(false);
  const [transitionPrices, setTransitionPrices] = useState<TransitionPriceInput[]>([makeTransitionRow()]);
  const [files, setFiles] = useState<ReleaseFileInput[]>([makeReleaseFileRow()]);
  const [form, setForm] = useState<PublishFormState>(emptyForm);

  const copy = {
    envMissing: language === 'en' ? 'Supabase env is not configured.' : '尚未配置 Supabase 环境变量。',
    clientMissing: language === 'en' ? 'Supabase client unavailable.' : 'Supabase 客户端不可用。',
    createFailed: language === 'en' ? 'Failed to create version.' : '创建版本失败。',
    updateFailed: language === 'en' ? 'Failed to update version.' : '更新版本失败。',
    missingEditVersion: language === 'en' ? 'The selected version could not be found.' : '未找到要编辑的版本。',
    loadEditVersionFailed: language === 'en' ? 'Failed to load the selected version into the editor.' : '将所选版本加载到编辑器失败。',
    publishSuccess: language === 'en' ? 'Official release published successfully.' : '官方版本发布成功。',
    updateSuccess: language === 'en' ? 'Official release updated successfully.' : '官方版本更新成功。',
    publishFailed: language === 'en' ? 'Failed to publish release.' : '发布版本失败。',
    checking: language === 'en' ? 'Checking developer publishing access…' : '正在检查开发者发布权限…',
    loadingEditor: language === 'en' ? 'Loading saved release data…' : '正在加载已保存的版本数据…',
    guestTitle: language === 'en' ? 'Official release publishing' : '官方版本发布',
    guestDescription:
      language === 'en'
        ? 'You must sign in through the official Geeks Production Studio SSO before publishing releases.'
        : '发布官方版本前，必须先通过 Geeks Production Studio 官方单点登录。',
    signIn: language === 'en' ? 'Sign in to continue' : '登录后继续',
    deniedTitle: language === 'en' ? 'Access denied' : '无权访问',
    deniedDescription:
      language === 'en'
        ? 'Only approved developers can publish official releases.'
        : '只有已批准的开发者账号才可发布官方版本。',
    formTitle: editVersionId
      ? language === 'en'
        ? 'Edit official release'
        : '编辑官方版本'
      : language === 'en'
        ? 'Publish official release'
        : '发布官方版本',
    formDescription:
      editVersionId
        ? language === 'en'
          ? 'Load the saved release data, adjust metadata, and save the updated official version.'
          : '加载已保存的版本数据，调整元数据并保存更新后的官方版本。'
        : language === 'en'
          ? 'Create a version entry, attach an optional parent branch, and define release pricing metadata.'
          : '创建版本条目、关联可选父分支，并配置版本价格元数据。',
    versionName: language === 'en' ? 'Version name' : '版本编号',
    titleZh: language === 'en' ? 'Title (Chinese)' : '标题（中文）',
    titleEn: language === 'en' ? 'Title (English)' : '标题（英文）',
    status: language === 'en' ? 'Status' : '状态',
    parentVersion: language === 'en' ? 'Parent version' : '父版本',
    noParent: language === 'en' ? 'No parent' : '无父版本',
    summaryZh: language === 'en' ? 'Summary (Chinese)' : '简介（中文）',
    summaryEn: language === 'en' ? 'Summary (English)' : '简介（英文）',
    firstPurchasePrice: language === 'en' ? 'First purchase price (tokens)' : '首购价格（代币）',
    transitionTitle: language === 'en' ? 'Transition pricing' : '版本转换价格',
    transitionDescription:
      language === 'en'
        ? 'Define explicit upgrade and fall-back prices from existing versions into this release.'
        : '为已有版本到此版本的升级与回退分别设置明确价格。',
    sourceVersion: language === 'en' ? 'Source version' : '来源版本',
    transitionType: language === 'en' ? 'Transition type' : '转换类型',
    transitionPrice: language === 'en' ? 'Token price' : '代币价格',
    addTransition: language === 'en' ? 'Add transition' : '添加转换价格',
    upgrade: language === 'en' ? 'Upgrade' : '升级',
    fallback: language === 'en' ? 'Fall-back' : '回退',
    duplicateTransition: language === 'en' ? 'Each source version can only define one price per transition type.' : '同一来源版本与转换类型只能定义一条价格。',
    invalidPrice: language === 'en' ? 'Token prices must be zero or greater.' : '代币价格必须大于或等于 0。',
    changelogZh: language === 'en' ? 'Changelog (Chinese, one item per line)' : '更新说明（中文，每行一条）',
    changelogEn: language === 'en' ? 'Changelog (English, one item per line)' : '更新说明（英文，每行一条）',
    filesTitle: language === 'en' ? 'Release files' : '发布文件',
    filesDescription:
      language === 'en'
        ? 'Manage downloadable file metadata here, including public URLs and MediaFire quickkeys.'
        : '在此管理可下载文件元数据，包括公开链接与 MediaFire quickkey。',
    addFile: language === 'en' ? 'Add file' : '添加文件',
    labelZh: language === 'en' ? 'Label (Chinese)' : '标签（中文）',
    labelEn: language === 'en' ? 'Label (English)' : '标签（英文）',
    fileType: language === 'en' ? 'File type' : '文件类型',
    fileUrl: language === 'en' ? 'File URL' : '文件链接',
    mediafireQuickKey: language === 'en' ? 'MediaFire quickkey' : 'MediaFire quickkey',
    sizeLabel: language === 'en' ? 'Size label' : '大小标签',
    rules: language === 'en' ? 'Rules' : '规则',
    cards: language === 'en' ? 'Cards' : '卡牌',
    driverPack: language === 'en' ? 'Driver pack' : '驱动包',
    bundle: language === 'en' ? 'Bundle' : '整合包',
    remove: language === 'en' ? 'Remove' : '移除',
    publishing: language === 'en' ? 'Publishing…' : '发布中…',
    saving: language === 'en' ? 'Saving…' : '保存中…',
    publish: language === 'en' ? 'Publish release' : '发布版本',
    save: language === 'en' ? 'Save changes' : '保存更改',
    mediafireNoteTitle: language === 'en' ? 'MediaFire workflow' : 'MediaFire 工作流',
    mediafireNoteBody:
      language === 'en'
        ? 'Large release files are no longer uploaded to Supabase from this page. Upload them to MediaFire separately, then manage any download rows or quickkeys outside this form.'
        : '此页面不再将大型发布文件上传到 Supabase。请先单独上传到 MediaFire，再在此表单之外维护下载记录或 quickkey。',
    mediafireLinkLabel: language === 'en' ? 'Open MediaFire' : '打开 MediaFire',
    stable: language === 'en' ? 'Stable' : '稳定版',
    beta: language === 'en' ? 'Beta' : '测试版',
    experimental: language === 'en' ? 'Experimental' : '实验版',
  };

  useEffect(() => {
    void (async () => {
      const { user, authority } = await getSharedSessionProfile();
      setSignedIn(Boolean(user));
      setIsPublisher(authority.isReleasePublisher);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!editVersionId) {
      setForm(emptyForm);
      setTransitionPrices([makeTransitionRow()]);
      setFiles([makeReleaseFileRow()]);
      return;
    }

    if (versionsLoading) {
      return;
    }

    setHydratingEditVersion(true);
    setMessage(null);

    void (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setMessage(copy.clientMissing);
        setHydratingEditVersion(false);
        return;
      }

      try {
        const { data: versionRow, error: versionError } = await supabase
          .from('dd_version_list')
          .select('id, name, title, status, summary, changelog, first_purchase_token_price')
          .eq('id', editVersionId)
          .maybeSingle();

        if (versionError) {
          throw versionError;
        }

        if (!versionRow) {
          setMessage(copy.missingEditVersion);
          setHydratingEditVersion(false);
          return;
        }

        const { data: branchRows, error: branchError } = await supabase
          .from('dd_branch_map')
          .select('parent_version_id')
          .eq('child_version_id', editVersionId)
          .limit(1);

        if (branchError) {
          throw branchError;
        }

        const { data: transitionRows, error: transitionError } = await supabase
          .from('dd_version_transition_prices')
          .select('id, from_version_id, transition_type, token_price')
          .eq('to_version_id', editVersionId)
          .order('created_at');

        if (transitionError) {
          throw transitionError;
        }

        const { data: fileRows, error: fileError } = await supabase
          .from('dd_version_files')
          .select('id, label, file_type, file_url, mediafire_quickkey, size_label')
          .eq('version_id', editVersionId)
          .order('created_at');

        if (fileError) {
          throw fileError;
        }

        setForm({
          name: String(versionRow.name ?? ''),
          titleZh: normalizeLocalizedText(versionRow.title).zh,
          titleEn: normalizeLocalizedText(versionRow.title).en,
          status: versionRow.status as Version['status'],
          summaryZh: normalizeLocalizedText(versionRow.summary).zh,
          summaryEn: normalizeLocalizedText(versionRow.summary).en,
          changelogZh: (versionRow.changelog ?? []).map((item: unknown) => normalizeLocalizedText(item).zh).filter(Boolean).join('\n'),
          changelogEn: (versionRow.changelog ?? []).map((item: unknown) => normalizeLocalizedText(item).en).filter(Boolean).join('\n'),
          parentVersionId: String(branchRows?.[0]?.parent_version_id ?? ''),
          firstPurchaseTokenPrice: String(versionRow.first_purchase_token_price ?? 0),
        });

        setTransitionPrices(
          transitionRows?.length
            ? transitionRows.map((entry) => ({
                id: String(entry.id),
                fromVersionId: String(entry.from_version_id),
                transitionType: entry.transition_type as TransitionPriceInput['transitionType'],
                tokenPrice: String(entry.token_price ?? 0),
              }))
            : [makeTransitionRow()],
        );

        setFiles(
          fileRows?.length
            ? fileRows.map((file) => ({
                id: String(file.id),
                labelZh: normalizeLocalizedText(file.label).zh,
                labelEn: normalizeLocalizedText(file.label).en,
                fileType: file.file_type as ReleaseFileInput['fileType'],
                fileUrl: String(file.file_url ?? ''),
                mediafireQuickKey: String(file.mediafire_quickkey ?? ''),
                sizeLabel: String(file.size_label ?? ''),
              }))
            : [makeReleaseFileRow()],
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : copy.loadEditVersionFailed);
      } finally {
        setHydratingEditVersion(false);
      }
    })();
  }, [copy.clientMissing, copy.loadEditVersionFailed, copy.missingEditVersion, editVersionId, versionsLoading]);

  const loginUrl = getOfficialLoginUrl(editVersionId ? `/versions/publish?edit=${encodeURIComponent(editVersionId)}` : '/versions/publish');

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

    if (editVersionId && hydratingEditVersion) {
      return;
    }

    setSubmitting(true);

    try {
      const firstPurchaseTokenPrice = Number.parseInt(form.firstPurchaseTokenPrice, 10);
      if (Number.isNaN(firstPurchaseTokenPrice) || firstPurchaseTokenPrice < 0) {
        throw new Error(copy.invalidPrice);
      }

      const activeTransitionPrices = transitionPrices
        .filter((entry) => entry.fromVersionId)
        .map((entry) => ({
          rowId: entry.id,
          fromVersionId: entry.fromVersionId,
          transitionType: entry.transitionType,
          tokenPrice: Number.parseInt(entry.tokenPrice, 10),
        }));

      if (activeTransitionPrices.some((entry) => Number.isNaN(entry.tokenPrice) || entry.tokenPrice < 0)) {
        throw new Error(copy.invalidPrice);
      }

      const transitionKeys = new Set<string>();
      for (const entry of activeTransitionPrices) {
        const key = `${entry.fromVersionId}:${entry.transitionType}`;
        if (transitionKeys.has(key)) {
          throw new Error(copy.duplicateTransition);
        }
        transitionKeys.add(key);
      }

      const changelogZh = form.changelogZh.split('\n').map((item) => item.trim()).filter(Boolean);
      const changelogEn = form.changelogEn.split('\n').map((item) => item.trim()).filter(Boolean);
      const changelog = changelogZh.map((zh, index) => ({
        zh,
        en: changelogEn[index] ?? '',
      }));

      const activeFiles = files.filter((file) => file.labelZh.trim() || file.labelEn.trim() || file.fileUrl.trim() || file.mediafireQuickKey.trim() || file.sizeLabel.trim());

      const payload = {
        name: form.name,
        title: toLocalizedText(form.titleZh, form.titleEn),
        status: form.status,
        summary: toLocalizedText(form.summaryZh, form.summaryEn),
        changelog,
        first_purchase_token_price: firstPurchaseTokenPrice,
      };

      let versionId = editVersionId ?? '';

      if (editVersionId) {
        const { error: versionError } = await supabase
          .from('dd_version_list')
          .update(payload)
          .eq('id', editVersionId);

        if (versionError) {
          throw versionError;
        }
      } else {
        const { data: versionRow, error: versionError } = await supabase
          .from('dd_version_list')
          .insert(payload)
          .select('id')
          .single();

        if (versionError || !versionRow) {
          throw versionError ?? new Error(copy.createFailed);
        }

        versionId = String(versionRow.id);
      }

      if (!versionId) {
        throw new Error(copy.updateFailed);
      }

      const { error: deleteBranchError } = await supabase
        .from('dd_branch_map')
        .delete()
        .eq('child_version_id', versionId);

      if (deleteBranchError) {
        throw deleteBranchError;
      }

      if (form.parentVersionId) {
        const { error: branchError } = await supabase.from('dd_branch_map').insert({
          parent_version_id: form.parentVersionId,
          child_version_id: versionId,
          relation_type: form.status === 'experimental' ? 'experimental' : 'branch',
        });

        if (branchError) {
          throw branchError;
        }
      }

      const { error: deleteTransitionError } = await supabase
        .from('dd_version_transition_prices')
        .delete()
        .eq('to_version_id', versionId);

      if (deleteTransitionError) {
        throw deleteTransitionError;
      }

      if (activeTransitionPrices.length) {
        const { error: transitionError } = await supabase.from('dd_version_transition_prices').insert(
          activeTransitionPrices.map((entry) => ({
            from_version_id: entry.fromVersionId,
            to_version_id: versionId,
            transition_type: entry.transitionType,
            token_price: entry.tokenPrice,
          })),
        );

        if (transitionError) {
          throw transitionError;
        }
      }

      const { error: deleteFilesError } = await supabase
        .from('dd_version_files')
        .delete()
        .eq('version_id', versionId);

      if (deleteFilesError) {
        throw deleteFilesError;
      }

      if (activeFiles.length) {
        const { error: fileInsertError } = await supabase.from('dd_version_files').insert(
          activeFiles.map((file) => ({
            version_id: versionId,
            label: toLocalizedText(file.labelZh, file.labelEn),
            file_type: file.fileType,
            file_url: file.fileUrl.trim(),
            mediafire_quickkey: file.mediafireQuickKey.trim() || null,
            size_label: file.sizeLabel.trim(),
          })),
        );

        if (fileInsertError) {
          throw fileInsertError;
        }
      }

      setMessage(editVersionId ? copy.updateSuccess : copy.publishSuccess);
      if (!editVersionId) {
        setForm(emptyForm);
        setTransitionPrices([makeTransitionRow()]);
        setFiles([makeReleaseFileRow()]);
      }
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

  if (!isPublisher) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-100">
        <h2 className="text-xl font-semibold text-white">{copy.deniedTitle}</h2>
        <p className="mt-3 leading-6 text-red-100/80">{copy.deniedDescription}</p>
      </div>
    );
  }

  if (editVersionId && hydratingEditVersion) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">{copy.loadingEditor}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">{copy.formTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{copy.formDescription}</p>
      </div>

      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-sm text-cyan-50">
        <h3 className="text-base font-semibold text-white">{copy.mediafireNoteTitle}</h3>
        <p className="mt-2 leading-6 text-cyan-50/85">{copy.mediafireNoteBody}</p>
        <a
          href="https://www.mediafire.com"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-full border border-cyan-300/30 bg-black/20 px-4 py-2 font-medium text-cyan-100 transition hover:bg-black/30"
        >
          {copy.mediafireLinkLabel}
        </a>
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
            {versions.filter((version) => version.id !== editVersionId).map((version) => (
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
        <Field label={copy.firstPurchasePrice}>
          <input
            type="number"
            min="0"
            step="1"
            value={form.firstPurchaseTokenPrice}
            onChange={(e) => setForm({ ...form, firstPurchaseTokenPrice: e.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
          />
        </Field>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{copy.transitionTitle}</h3>
            <p className="mt-2 text-sm text-slate-400">{copy.transitionDescription}</p>
          </div>
          <button type="button" onClick={() => setTransitionPrices((current) => [...current, makeTransitionRow()])} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white">
            {copy.addTransition}
          </button>
        </div>

        {transitionPrices.map((entry) => (
          <div key={entry.id} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1.5fr_1fr_1fr_auto]">
            <select
              value={entry.fromVersionId}
              onChange={(e) => setTransitionPrices((current) => current.map((item) => item.id === entry.id ? { ...item, fromVersionId: e.target.value } : item))}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
            >
              <option value="">{copy.sourceVersion}</option>
              {versions.filter((version) => version.id !== editVersionId).map((version) => (
                <option key={version.id} value={version.id}>{version.name}</option>
              ))}
            </select>
            <select
              value={entry.transitionType}
              onChange={(e) => setTransitionPrices((current) => current.map((item) => item.id === entry.id ? { ...item, transitionType: e.target.value as TransitionPriceInput['transitionType'] } : item))}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
            >
              <option value="upgrade">{copy.upgrade}</option>
              <option value="fallback">{copy.fallback}</option>
            </select>
            <input
              type="number"
              min="0"
              step="1"
              placeholder={copy.transitionPrice}
              value={entry.tokenPrice}
              onChange={(e) => setTransitionPrices((current) => current.map((item) => item.id === entry.id ? { ...item, tokenPrice: e.target.value } : item))}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => setTransitionPrices((current) => current.length === 1 ? current : current.filter((item) => item.id !== entry.id))}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-medium text-slate-200"
            >
              {copy.remove}
            </button>
          </div>
        ))}
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
          <button type="button" onClick={() => setFiles((current) => [...current, makeReleaseFileRow()])} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white">
            {copy.addFile}
          </button>
        </div>

        {files.map((file) => (
          <div key={file.id} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={copy.labelZh}>
                <input value={file.labelZh} onChange={(e) => setFiles((current) => current.map((item) => item.id === file.id ? { ...item, labelZh: e.target.value } : item))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
              </Field>
              <Field label={copy.labelEn}>
                <input value={file.labelEn} onChange={(e) => setFiles((current) => current.map((item) => item.id === file.id ? { ...item, labelEn: e.target.value } : item))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
              </Field>
              <Field label={copy.fileType}>
                <select value={file.fileType} onChange={(e) => setFiles((current) => current.map((item) => item.id === file.id ? { ...item, fileType: e.target.value as ReleaseFileInput['fileType'] } : item))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
                  <option value="rules">{copy.rules}</option>
                  <option value="cards">{copy.cards}</option>
                  <option value="driver_pack">{copy.driverPack}</option>
                  <option value="bundle">{copy.bundle}</option>
                </select>
              </Field>
              <Field label={copy.sizeLabel}>
                <input value={file.sizeLabel} onChange={(e) => setFiles((current) => current.map((item) => item.id === file.id ? { ...item, sizeLabel: e.target.value } : item))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={copy.fileUrl}>
                <input value={file.fileUrl} onChange={(e) => setFiles((current) => current.map((item) => item.id === file.id ? { ...item, fileUrl: e.target.value } : item))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
              </Field>
              <Field label={copy.mediafireQuickKey}>
                <input value={file.mediafireQuickKey} onChange={(e) => setFiles((current) => current.map((item) => item.id === file.id ? { ...item, mediafireQuickKey: e.target.value } : item))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
              </Field>
            </div>
            <button type="button" onClick={() => setFiles((current) => current.length === 1 ? current : current.filter((item) => item.id !== file.id))} className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-medium text-slate-200">
              {copy.remove}
            </button>
          </div>
        ))}
      </div>

      {message ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">{message}</div> : null}

      <button type="submit" disabled={submitting || hydratingEditVersion} className="rounded-full border border-[var(--accent-hot)]/40 bg-[rgba(85,199,255,0.08)] px-6 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.16)] disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? (editVersionId ? copy.saving : copy.publishing) : (editVersionId ? copy.save : copy.publish)}
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
