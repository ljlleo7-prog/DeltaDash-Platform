import type { Language } from '@/lib/i18n';
import { localize } from '@/lib/i18n';
import type { DeltaDashPlayableCard } from '@/lib/deltadash/card-selectors';
import type { DeltaDashCar } from '@/lib/deltadash/types';
import { getTimeGap } from '@/lib/deltadash/targeting';

export function CardPlayCard({
  card,
  language,
  sourceCar,
  validTargets,
  onPlay,
  mode = 'deploy',
  selected = false,
  selectedTargetCarIds = [],
  onSelectTarget,
}: {
  card: DeltaDashPlayableCard;
  language: Language;
  sourceCar: DeltaDashCar | null;
  validTargets: DeltaDashCar[];
  onPlay: (definitionId: string, targetCarIds?: string[]) => void;
  mode?: 'deploy' | 'queue' | 'preview';
  selected?: boolean;
  selectedTargetCarIds?: string[];
  onSelectTarget?: (targetCarId: string) => void;
}) {
  const needsTarget = card.definition.targeting.kind === 'opponent';
  const disabled = !card.playable || (needsTarget && !validTargets.length);
  const canDeploy = !disabled && (!needsTarget || selectedTargetCarIds.length > 0);
  const outerClass = `rounded-2xl border p-4 transition ${selected ? 'border-yellow-300/70 bg-yellow-300/15 shadow-[0_0_28px_rgba(250,204,21,0.18)]' : 'border-white/10 bg-black/25'} ${disabled ? 'opacity-55' : ''}`;

  if (mode === 'queue') {
    return (
      <button type="button" disabled={disabled} onClick={() => onPlay(card.definition.id)} className={`block w-full text-left ${outerClass} enabled:hover:-translate-y-0.5`}>
        <CardBody card={card} language={language} />
      </button>
    );
  }

  return (
    <div className={outerClass}>
      <CardBody card={card} language={language} />
      {needsTarget ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {validTargets.length ? validTargets.map((target) => {
            const isSelectedTarget = selectedTargetCarIds.includes(target.id);
            return (
              <button
                key={target.id}
                type="button"
                disabled={!card.playable || !onSelectTarget}
                onClick={() => onSelectTarget?.(target.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed ${isSelectedTarget ? 'border-yellow-200 bg-yellow-300 text-slate-950' : 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100 enabled:hover:bg-cyan-500/20'}`}
              >
                {target.name} · {language === 'en' ? 'gap' : '差'} {sourceCar ? `${getTimeGap(sourceCar, target).toFixed(1)}s` : '-'}
              </button>
            );
          }) : <span className="text-xs text-slate-500">{language === 'en' ? 'No valid target in timing window.' : '时间窗口内没有有效目标。'}</span>}
        </div>
      ) : null}

      {mode === 'deploy' ? (
        <button
          type="button"
          disabled={!canDeploy}
          onClick={() => onPlay(card.definition.id, selectedTargetCarIds)}
          className="mt-3 rounded-full border border-lime-300/35 bg-lime-300/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-lime-100 transition enabled:hover:bg-lime-300 enabled:hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {language === 'en' ? 'Deploy card' : '部署卡牌'}
        </button>
      ) : null}
    </div>
  );
}

function CardBody({ card, language }: { card: DeltaDashPlayableCard; language: Language }) {
  return (
    <>
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
      {card.definition.targeting.range ? (
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-cyan-200">
          {language === 'en' ? 'Window' : '窗口'} ≤ {card.definition.targeting.range.maxTimeGap ?? '∞'}s
        </p>
      ) : null}
      {card.disabledReason ? <p className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">{card.disabledReason}</p> : null}
    </>
  );
}

function statusClass(status: DeltaDashPlayableCard['definition']['implementationStatus']) {
  if (status === 'implemented') return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100';
  if (status === 'provisional') return 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100';
  return 'border-yellow-300/25 bg-yellow-500/10 text-yellow-100';
}
