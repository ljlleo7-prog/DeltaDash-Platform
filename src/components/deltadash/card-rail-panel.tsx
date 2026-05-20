import type { Language } from '@/lib/i18n';
import { getCardPileCounts, getCardsForCar } from '@/lib/deltadash/card-selectors';
import { getFinishSummary } from '@/lib/deltadash/selectors';
import type { DeltaDashCar, DeltaDashMatchState } from '@/lib/deltadash/types';
import { getValidTargetCars } from '@/lib/deltadash/targeting';
import { CardPlayCard } from './card-play-card';

export function CardRailPanel({
  state,
  humanCar,
  language,
  queuedCardInstanceIds,
  onQueueCard,
}: {
  state: DeltaDashMatchState;
  humanCar: DeltaDashCar | null;
  language: Language;
  queuedCardInstanceIds: string[];
  onQueueCard: (cardDefinitionId: string, cardInstanceId?: string) => void;
}) {
  const cards = humanCar ? getCardsForCar(state, humanCar.id) : [];
  const pileCounts = humanCar ? getCardPileCounts(state, humanCar.id) : null;
  const playableCards = cards.filter((card) => card.definition.implementationStatus !== 'documented-only');
  const deploySlotsFull = queuedCardInstanceIds.length >= 3;

  return (
    <section className="h-full rounded-3xl border border-lime-300/25 bg-slate-950/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="bg-lime-300 px-4 py-3 text-slate-950">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.25em]">{language === 'en' ? 'Card rail' : '卡牌栏'}</p>
        <h3 className="text-lg font-black italic">{language === 'en' ? 'Queue to deploy' : '选择并部署'}</h3>
      </div>

      <div className="p-3">
        {state.phase === 'finished' ? (
          <p className="text-sm leading-6 text-slate-300">{getFinishSummary(state)}</p>
        ) : humanCar?.retired ? (
          <p className="text-sm leading-6 text-red-100">{language === 'en' ? 'Your car has retired.' : '你的赛车已经退赛。'}</p>
        ) : (
          <>
            <p className="mb-3 text-xs leading-5 text-slate-400">
              {language === 'en'
                ? 'Click up to three playable cards to fill the deploy slots.'
                : '点击最多三张可用卡牌，填入部署槽。'}
            </p>
            {pileCounts ? (
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[0.65rem] font-black uppercase tracking-[0.16em]">
                <PileCount label={language === 'en' ? 'Deck' : '牌库'} value={pileCounts.deck} />
                <PileCount label={language === 'en' ? 'Hand' : '手牌'} value={pileCounts.hand} />
                <PileCount label={language === 'en' ? 'Discard' : '弃牌'} value={pileCounts.discard} />
              </div>
            ) : null}
            <div className="grid max-h-[560px] gap-3 overflow-y-auto pr-1">
              {playableCards.map((card) => (
                <CardPlayCard
                  key={card.instance?.instanceId ?? card.definition.id}
                  card={card}
                  language={language}
                  sourceCar={humanCar}
                  validTargets={humanCar ? getValidTargetCars(state, humanCar, card.definition) : []}
                  onPlay={deploySlotsFull ? () => undefined : (cardDefinitionId) => onQueueCard(cardDefinitionId, card.instance?.instanceId)}
                  mode="queue"
                  selected={card.instance ? queuedCardInstanceIds.includes(card.instance.instanceId) : false}
                />
              ))}
            </div>

          </>
        )}
      </div>
    </section>
  );
}

function PileCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-lime-300/20 bg-lime-300/10 px-2 py-2 text-lime-100">
      <p className="opacity-70">{label}</p>
      <p className="mt-1 text-base text-white">{value}</p>
    </div>
  );
}
