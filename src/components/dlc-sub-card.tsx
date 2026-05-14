'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { localize, type Language } from '@/lib/i18n';
import { RatingWidget } from '@/components/rating-widget';
import type { Dlc } from '@/lib/types';

export function DlcSubCard({ dlc, language }: { dlc: Dlc; language: Language }) {
  const [purchasing, setPurchasing] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const firstFile = dlc.files[0];

  async function handlePurchase() {
    if (!firstFile) return;
    setPurchasing(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Client unavailable');
      const { data, error: rpcError } = await supabase.rpc('purchase_dlc_license', {
        p_dlc_id: dlc.id,
        p_file_id: firstFile.id,
      });
      if (rpcError) throw rpcError;
      const result = data as { success: boolean; message?: string; file_url?: string };
      if (!result.success) throw new Error(result.message ?? 'Purchase failed');
      setFileUrl(result.file_url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'en' ? 'Purchase failed.' : '购买失败。'));
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <div className="dd-subpanel mt-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-cold)]">DLC</p>
          <p className="mt-1 text-sm font-medium text-white">{dlc.name} — {localize(dlc.title, language)}</p>
          <p className="mt-1 text-xs text-slate-400">{localize(dlc.description, language)}</p>
        </div>
        <span className="dd-badge shrink-0">
          {dlc.isLicensed
            ? (language === 'en' ? 'Owned' : '已拥有')
            : `${dlc.firstPurchaseTokenPrice} ${language === 'en' ? 'tokens' : '代币'}`}
        </span>
      </div>

      {dlc.soldCount ? (
        <p className="text-xs text-slate-500">{language === 'en' ? `${dlc.soldCount} sold` : `已售 ${dlc.soldCount}`}</p>
      ) : null}

      <RatingWidget targetType="dlc" targetId={dlc.id} summary={dlc.rating} language={language} interactive />

      {fileUrl ? (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-cyan-300/30 bg-black/20 px-4 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-black/30">
          {language === 'en' ? 'Download DLC' : '下载 DLC'}
        </a>
      ) : !dlc.isLicensed && firstFile ? (
        <button
          type="button"
          onClick={handlePurchase}
          disabled={purchasing}
          className="rounded-full border border-[var(--accent-cold)]/30 bg-[rgba(85,199,255,0.08)] px-4 py-1.5 text-xs font-medium text-[var(--text-main)] transition hover:bg-[rgba(85,199,255,0.16)] disabled:opacity-50"
        >
          {purchasing ? (language === 'en' ? 'Processing…' : '处理中…') : (language === 'en' ? 'Buy & Download' : '购买并下载')}
        </button>
      ) : dlc.isLicensed && firstFile ? (
        <a href={firstFile.fileUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-cyan-300/30 bg-black/20 px-4 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-black/30">
          {language === 'en' ? 'Download DLC' : '下载 DLC'}
        </a>
      ) : null}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
