import type { Language } from '@/lib/i18n';
import { getCardsForCar } from '@/lib/deltadash/card-selectors';
import { getFinishSummary } from '@/lib/deltadash/selectors';
import { getValidTargetCars } from '@/lib/deltadash/targeting';
import type { DeltaDashCar, DeltaDashMatchState } from '@/lib/deltadash/types';
import { CardPlayCard } from './card-play-card';

export function CardHandPanel({
  state,
  humanCar,
  language,
  onCard,
}: {
  state: DeltaDashMatchState;
  humanCar: DeltaDashCar | null;
  language: Language;
  onCard: (cardDefinitionId: string, targetCarIds?: string[]) => void;
}) {
  const cards = humanCar ? getCardsForCar(state, humanCar.id) : [];
  const playableCards = cards.filter((card) => card.definition.implementationStatus !== 'documented-only');
  const referenceCards = cards.filter((card) => card.definition.implementationStatus === 'documented-only');
  const renderCard = (card: (typeof cards)[number]) => (
    <CardPlayCard
      key={card.definition.id}
      card={card}
      language={language}
      sourceCar={humanCar}
      validTargets={humanCar ? getValidTargetCars(state, humanCar, card.definition) : []}
      onPlay={onCard}
    />
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Your cards' : '你的卡牌'}</h2>
      {state.phase === 'finished' ? (
        <p className="mt-3 text-sm leading-6 text-slate-300">{getFinishSummary(state)}</p>
      ) : humanCar?.retired ? (
        <p className="mt-3 text-sm leading-6 text-red-100">{language === 'en' ? 'Your car has retired.' : '你的赛车已经退赛。'}</p>
      ) : (
        <>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            {language === 'en'
              ? 'Implemented prototype cards are playable now. Provisional and documented cards are shown as the structured rule catalog for later revisions.'
              : '已实现的原型牌现在可打出。临时与仅文档牌会作为后续修订用的结构化规则目录展示。'}
          </p>
          <div className="mt-4 grid gap-3">
            {playableCards.map(renderCard)}
          </div>
          <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-200">
              {language === 'en' ? 'Reference card catalog' : '参考卡牌目录'} · {referenceCards.length}
            </summary>
            <div className="mt-4 grid gap-3">
              {referenceCards.map(renderCard)}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
