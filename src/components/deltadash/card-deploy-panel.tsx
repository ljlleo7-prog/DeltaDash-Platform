import type { Language } from '@/lib/i18n';
import { localize } from '@/lib/i18n';
import type { DeltaDashCardDefinition, DeltaDashCardInstance } from '@/lib/deltadash/card-types';
import type { DeltaDashPlayableCard } from '@/lib/deltadash/card-selectors';
import type { DeltaDashCardPlayInput } from '@/lib/deltadash/match-flow';
import { getCarTimeOffset } from '@/lib/deltadash/selectors';
import type { DeltaDashCar } from '@/lib/deltadash/types';
import { getTimeGap } from '@/lib/deltadash/targeting';

type DeploySlotView = {
  slot: DeltaDashCardPlayInput | null;
  card: DeltaDashPlayableCard | null;
  validTargets: DeltaDashCar[];
  selectedTargetCarIds: string[];
};

type DeployedCardView = {
  instance: DeltaDashCardInstance;
  definition: DeltaDashCardDefinition;
};

export function CardDeployPanel({
  slots,
  language,
  sourceCar,
  onToggleTarget,
  onClearSlot,
  onConfirmDeploy,
  deployedCards,
  onRemoveDeployedCard,
}: {
  slots: DeploySlotView[];
  language: Language;
  sourceCar: DeltaDashCar | null;
  onToggleTarget: (slotIndex: number, targetCarId: string) => void;
  onClearSlot: (slotIndex: number) => void;
  onConfirmDeploy: () => void;
  deployedCards: DeployedCardView[];
  onRemoveDeployedCard: (cardInstanceId: string) => void;
}) {
  const filledCount = slots.filter((slot) => slot.card).length;
  const hasInvalidTarget = slots.some(({ card, selectedTargetCarIds }) => card?.definition.targeting.kind === 'opponent' && !selectedTargetCarIds.length);

  return (
    <section className="rounded-[2rem] border border-orange-300/25 bg-[linear-gradient(135deg,rgba(250,204,21,0.16),rgba(34,197,94,0.12),rgba(15,23,42,0.72))] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-200">{language === 'en' ? 'Deploy zone' : '部署区'}</p>
          <h3 className="mt-1 text-2xl font-black italic text-white">{sourceCar?.name ?? 'Alpha'}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-right">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-yellow-100">{language === 'en' ? 'Timing' : '时间窗'}</p>
          <p className="text-xl font-black text-white">{sourceCar ? `${getCarTimeOffset(sourceCar).toFixed(1)}s` : '-'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-300">{language === 'en' ? 'Card sequence' : '卡牌序列'}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {language === 'en'
                ? 'Fill any number of slots, including none, then confirm the round.'
                : '可填入任意数量卡槽，也可以不填，然后确认本回合。'}
            </p>
          </div>
          <button type="button" onClick={onConfirmDeploy} disabled={hasInvalidTarget} className="rounded-full border border-lime-300/35 bg-lime-300/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-lime-100 transition hover:bg-lime-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
            {language === 'en' ? `Confirm ${filledCount}/3` : `确认 ${filledCount}/3`}
          </button>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {slots.map((slot, index) => (
            <DeploySlotCard
              key={index}
              index={index}
              slot={slot}
              language={language}
              sourceCar={sourceCar}
              onToggleTarget={onToggleTarget}
              onClearSlot={onClearSlot}
            />
          ))}
        </div>

        {deployedCards.length ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-300">{language === 'en' ? 'Persistent cards' : '持续卡牌'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {deployedCards.map((card) => (
                <button key={card.instance.instanceId} type="button" onClick={() => onRemoveDeployedCard(card.instance.instanceId)} className="rounded-full border border-orange-300/25 bg-orange-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-orange-100 transition hover:bg-orange-300 hover:text-slate-950">
                  {language === 'en' ? 'Remove' : '移除'} · {localize(card.definition.name, language)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <TelemetryTile label={language === 'en' ? 'Energy' : '电量'} value={sourceCar ? `${sourceCar.energy}/6` : '-'} tone="cyan" />
        <TelemetryTile label={language === 'en' ? 'Tire' : '轮胎'} value={sourceCar ? `${sourceCar.tire}/6` : '-'} tone="lime" />
        <TelemetryTile label={language === 'en' ? 'Focus' : '专注'} value={sourceCar ? `${sourceCar.focus ?? 0}/${sourceCar.focusCap ?? 8}` : '-'} tone="orange" />
      </div>
    </section>
  );
}

function DeploySlotCard({
  index,
  slot,
  language,
  sourceCar,
  onToggleTarget,
  onClearSlot,
}: {
  index: number;
  slot: DeploySlotView;
  language: Language;
  sourceCar: DeltaDashCar | null;
  onToggleTarget: (slotIndex: number, targetCarId: string) => void;
  onClearSlot: (slotIndex: number) => void;
}) {
  const { card, validTargets, selectedTargetCarIds } = slot;

  return (
    <div className={`min-h-[180px] rounded-3xl border p-4 ${card ? 'border-yellow-200/35 bg-yellow-300/10' : 'border-dashed border-white/15 bg-black/20'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-yellow-100">{language === 'en' ? `Slot ${index + 1}` : `卡槽 ${index + 1}`}</p>
        {card ? (
          <button type="button" onClick={() => onClearSlot(index)} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.16em] text-slate-100 transition hover:bg-white/10">
            {language === 'en' ? 'Clear' : '清除'}
          </button>
        ) : null}
      </div>

      {card ? (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-sm font-black text-white">{localize(card.definition.name, language)}</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">{localize(card.definition.summary, language)}</p>
          </div>
          {card.definition.targeting.range ? (
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-cyan-200">
              {language === 'en' ? 'Window' : '窗口'} ≤ {card.definition.targeting.range.maxTimeGap ?? '∞'}s
            </p>
          ) : null}
          {card.definition.targeting.kind === 'none' ? (
            <p className="rounded-2xl border border-lime-300/20 bg-lime-300/10 px-3 py-2 text-xs text-lime-100">{language === 'en' ? 'Self / no target required.' : '自身 / 无需目标。'}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {validTargets.length ? validTargets.map((target) => {
                const selected = selectedTargetCarIds.includes(target.id);
                return (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => onToggleTarget(index, target.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${selected ? 'border-yellow-200 bg-yellow-300 text-slate-950' : 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20'}`}
                  >
                    {target.name} · {sourceCar ? `${getTimeGap(sourceCar, target).toFixed(1)}s` : '-'}
                  </button>
                );
              }) : <span className="text-xs text-slate-500">{language === 'en' ? 'No valid target in timing window.' : '时间窗口内没有有效目标。'}</span>}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 text-center text-sm leading-6 text-slate-500">
          {language === 'en' ? 'Empty slot' : '空卡槽'}
        </div>
      )}
    </div>
  );
}

function TelemetryTile({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'lime' | 'orange' }) {
  const toneClass = {
    cyan: 'border-cyan-300/30 bg-cyan-500/10 text-cyan-100',
    lime: 'border-lime-300/30 bg-lime-500/10 text-lime-100',
    orange: 'border-orange-300/30 bg-orange-500/10 text-orange-100',
  }[tone];

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
