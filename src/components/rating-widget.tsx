'use client';

import { useState } from 'react';
import { upsertReview } from '@/lib/platform-data';
import type { RatingSummary } from '@/lib/types';
import type { Language } from '@/lib/i18n';

export function RatingWidget({
  targetType,
  targetId,
  summary,
  interactive = false,
  language,
}: {
  targetType: 'version' | 'dlc' | 'mod';
  targetId: string;
  summary?: RatingSummary;
  interactive?: boolean;
  language: Language;
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stars) return;
    setSubmitting(true);
    setError(null);
    try {
      await upsertReview({ targetType, targetId, stars, comment: comment.trim() || undefined });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'en' ? 'Failed to submit review.' : '提交评价失败。'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3">
      {summary ? (
        <p className="text-xs text-slate-400">
          {'★'.repeat(Math.round(summary.average))}{'☆'.repeat(5 - Math.round(summary.average))}{' '}
          {summary.average.toFixed(1)} ({summary.count})
        </p>
      ) : (
        <p className="text-xs text-slate-500">{language === 'en' ? 'No ratings yet' : '暂无评分'}</p>
      )}

      {interactive && !submitted && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                className={`text-lg leading-none transition ${n <= stars ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={language === 'en' ? 'Optional comment…' : '可选评论…'}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-slate-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!stars || submitting}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {submitting ? (language === 'en' ? 'Submitting…' : '提交中…') : (language === 'en' ? 'Submit review' : '提交评价')}
          </button>
        </form>
      )}
      {interactive && submitted && (
        <p className="mt-2 text-xs text-cyan-400">{language === 'en' ? 'Review submitted.' : '评价已提交。'}</p>
      )}
    </div>
  );
}
