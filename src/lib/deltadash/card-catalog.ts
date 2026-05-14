export type DeltaDashCardSheet = {
  id: string;
  title: string;
  imageUrl: string;
  kind: 'action' | 'tactic' | 'mixed' | 'unknown';
  notes?: string;
};

export const deltaDashCardSheets: DeltaDashCardSheet[] = Array.from({ length: 10 }, (_, index) => {
  const slideNumber = index + 1;
  const padded = String(slideNumber).padStart(2, '0');

  return {
    id: `dd-4-card-sheet-${padded}`,
    title: `Card Sheet ${padded}`,
    imageUrl: `/deltadash/cards/4.0/slide-${padded}.png`,
    kind: 'unknown',
    notes: 'Reference slide sheet from the Delta Dash 2026 beta export.',
  };
});
