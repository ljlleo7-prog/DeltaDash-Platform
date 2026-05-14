import type { Language } from '@/lib/i18n';
import { localize } from '@/lib/i18n';
import type { DeltaDashPlayableCard } from '@/lib/deltadash/card-selectors';

export function CardPlayCard({ card, language, onPlay }: { card: DeltaDashPlayableCard; language: Language; onPlay: (definitionId: string) => void }) {
  const disabled = !card.playable;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPlay(card.definition.id)}
      className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition enabled:hover:border-[var(--accent-cold)]/45 enabled:hover:bg-black/35 disabled:cursor-not-allowed disabled:opacity-55"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{localize(card.definition.name, language)}</p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">{card.definition.category} · P{card.definition.priority}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-medium ${statusClass(card.definition.implementationStatus)}`}>
          {card.definition.implementationStatus}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">{localize(card.definition.summary, language)}</p>
      {card.disabledReason ? <p className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">{card.disabledReason}</p> : null}
    </button>
  );
}

function statusClass(status: DeltaDashPlayableCard['definition']['implementationStatus']) {
  if (status === 'implemented') return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100';
  if (status === 'provisional') return 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100';
  return 'border-yellow-300/25 bg-yellow-500/10 text-yellow-100';
}
