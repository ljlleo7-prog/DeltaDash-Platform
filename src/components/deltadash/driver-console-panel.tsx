import { useEffect } from 'react';
import type { Language } from '@/lib/i18n';
import { getCardInstanceDefinition, getCardsForCar, getCardInstancesForCar } from '@/lib/deltadash/card-selectors';
import type { DeltaDashCardPlayInput } from '@/lib/deltadash/match-flow';
import { getDefaultTargetCarIds, getValidTargetCars, normalizeTargetCarIds } from '@/lib/deltadash/targeting';
import type { DeltaDashCar, DeltaDashMatchState } from '@/lib/deltadash/types';
import { CardDeployPanel } from './card-deploy-panel';

export function DriverConsolePanel({
  state,
  humanCar,
  language,
  deploySlots,
  onUpdateDeploySlot,
  onConfirmDeploy,
  onRemoveDeployedCard,
}: {
  state: DeltaDashMatchState;
  humanCar: DeltaDashCar | null;
  language: Language;
  deploySlots: (DeltaDashCardPlayInput | null)[];
  onUpdateDeploySlot: (slotIndex: number, slot: DeltaDashCardPlayInput | null) => void;
  onConfirmDeploy: () => void;
  onRemoveDeployedCard: (cardInstanceId: string) => void;
}) {
  const cards = humanCar ? getCardsForCar(state, humanCar.id) : [];
  const deployedCards = humanCar
    ? getCardInstancesForCar(state, humanCar.id, 'deployed').flatMap((instance) => {
      const definition = getCardInstanceDefinition(instance);
      return definition ? [{ instance, definition }] : [];
    })
    : [];
  const slotCards = deploySlots.map((slot) => {
    if (!slot) return null;
    return cards.find((card) => card.definition.id === slot.cardDefinitionId && card.playable && (!slot.cardInstanceId || card.instance?.instanceId === slot.cardInstanceId)) ?? null;
  });

  useEffect(() => {
    if (!humanCar) return;

    deploySlots.forEach((slot, index) => {
      const card = slotCards[index];
      if (!slot || !card) return;
      const normalizedTargets = normalizeTargetCarIds(state, humanCar, card.definition, slot.targetCarIds ?? []);
      const targetCarIds = normalizedTargets ?? getDefaultTargetCarIds(state, humanCar, card.definition);
      if ((slot.targetCarIds ?? []).join('|') !== targetCarIds.join('|')) {
        onUpdateDeploySlot(index, { ...slot, targetCarIds });
      }
    });
  }, [deploySlots, humanCar, onUpdateDeploySlot, slotCards, state]);

  function toggleTarget(slotIndex: number, targetCarId: string) {
    const slot = deploySlots[slotIndex];
    const card = slotCards[slotIndex];
    if (!slot || !card) return;

    if (card.definition.targeting.kind === 'opponent') {
      onUpdateDeploySlot(slotIndex, { ...slot, targetCarIds: [targetCarId] });
      return;
    }

    const currentTargetIds = slot.targetCarIds ?? [];
    onUpdateDeploySlot(slotIndex, {
      ...slot,
      targetCarIds: currentTargetIds.includes(targetCarId) ? currentTargetIds.filter((id) => id !== targetCarId) : [...currentTargetIds, targetCarId],
    });
  }

  const deploySlotViews = deploySlots.map((slot, index) => {
    const card = slotCards[index];
    return {
      slot,
      card,
      validTargets: card && humanCar ? getValidTargetCars(state, humanCar, card.definition) : [],
      selectedTargetCarIds: slot?.targetCarIds ?? [],
    };
  });

  return (
    <CardDeployPanel
      slots={deploySlotViews}
      language={language}
      sourceCar={humanCar}
      onToggleTarget={toggleTarget}
      onClearSlot={(slotIndex) => onUpdateDeploySlot(slotIndex, null)}
      onConfirmDeploy={onConfirmDeploy}
      deployedCards={deployedCards}
      onRemoveDeployedCard={onRemoveDeployedCard}
    />
  );
}
