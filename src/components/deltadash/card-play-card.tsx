import type { Language } from '@/lib/i18n';
import { localize } from '@/lib/i18n';
import type { DeltaDashCardDefinition } from '@/lib/deltadash/card-types';
import type { DeltaDashPlayableCard } from '@/lib/deltadash/card-selectors';
import type { DeltaDashCar } from '@/lib/deltadash/types';
import { getTimeGap } from '@/lib/deltadash/targeting';
import { getCardCategoryAccentTextClass, getCardCategoryBadgeClass, getCardCategoryFrameClass, getCardCategoryLabel, getCardCategoryMutedTextClass, getCardCategoryTextClass, getCardPriorityClass } from './card-visual-style';

export function CardFace({
  definition,
  language,
  disabledReason,
  selected = false,
  compact = false,
}: {
  definition: DeltaDashCardDefinition;
  language: Language;
  disabledReason?: string | null;
  selected?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border transition ${compact ? 'p-3' : 'p-4'} ${getCardCategoryFrameClass(definition.category, selected)} ${selected ? 'ring-1 ring-yellow-200/45' : ''}`}>
      <CardBody definition={definition} language={language} disabledReason={disabledReason} compact={compact} />
    </div>
  );
}

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
  onDiscard,
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
  onDiscard?: (cardInstanceId: string) => void;
}) {
  const needsTarget = card.definition.targeting.kind === 'opponent';
  const disabled = !card.playable || (needsTarget && !validTargets.length);
  const canDeploy = !disabled && (!needsTarget || selectedTargetCarIds.length > 0);
  const outerClass = `rounded-2xl border p-4 transition ${getCardCategoryFrameClass(card.definition.category, selected)} ${selected ? 'ring-1 ring-yellow-200/45' : ''} ${disabled ? 'opacity-55' : ''}`;

  if (mode === 'queue') {
    return (
      <div className="relative">
        <button type="button" disabled={disabled} onClick={() => onPlay(card.definition.id)} className={`block w-full text-left ${outerClass} enabled:hover:-translate-y-0.5`}>
          <CardBody definition={card.definition} language={language} disabledReason={card.disabledReason} />
        </button>
        {card.instance && onDiscard ? (
          <button
            type="button"
            onClick={() => onDiscard(card.instance!.instanceId)}
            className="absolute right-3 top-3 rounded-full border border-red-300/35 bg-red-500/20 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-red-100 transition hover:bg-red-300 hover:text-slate-950"
          >
            {language === 'en' ? 'Discard' : '弃牌'}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={outerClass}>
      <CardBody definition={card.definition} language={language} disabledReason={card.disabledReason} />
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

function CardBody({ definition, language, disabledReason, compact = false }: { definition: DeltaDashCardDefinition; language: Language; disabledReason?: string | null; compact?: boolean }) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-black ${getCardCategoryTextClass(definition.category)}`}>{localize(definition.name, language)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[0.62rem] font-black uppercase tracking-[0.16em]">
            <span className={`rounded-full border px-2.5 py-1 ${getCardCategoryBadgeClass(definition.category)}`}>{getCardCategoryLabel(definition.category, language)}</span>
            <span className={`rounded-full border px-2.5 py-1 ${getCardPriorityClass(definition.priority)}`}>P{definition.priority}</span>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-medium ${statusClass(definition.implementationStatus)}`}>
          {definition.implementationStatus}
        </span>
      </div>
      <p className={`mt-3 text-xs ${compact ? 'line-clamp-3' : ''} leading-5 ${getCardCategoryMutedTextClass(definition.category)}`}>{localize(definition.summary, language)}</p>
      {definition.targeting.range ? (
        <p className={`mt-2 text-[0.65rem] uppercase tracking-[0.18em] ${getCardCategoryAccentTextClass(definition.category)}`}>
          {language === 'en' ? 'Window' : '窗口'} ≤ {definition.targeting.range.maxTimeGap ?? '∞'}s
        </p>
      ) : null}
      {disabledReason ? <p className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">{disabledReason}</p> : null}
    </>
  );
}

function statusClass(status: DeltaDashPlayableCard['definition']['implementationStatus']) {
  if (status === 'implemented') return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100';
  if (status === 'provisional') return 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100';
  return 'border-yellow-300/25 bg-yellow-500/10 text-yellow-100';
}
