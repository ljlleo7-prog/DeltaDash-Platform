import type { DeltaDashCardDefinition } from '@/lib/deltadash/card-types';
import type { Language } from '@/lib/i18n';

export function getCardCategoryFrameClass(category: DeltaDashCardDefinition['category'], selected = false): string {
  const selectedRing = selected ? ' shadow-[0_0_34px_rgba(250,204,21,0.28)] ring-2 ring-yellow-200/60' : '';

  if (category === 'action') return `border-orange-100/60 bg-[radial-gradient(circle_at_20%_0%,rgba(254,215,170,0.58),transparent_30%),linear-gradient(145deg,rgba(194,65,12,0.96),rgba(127,29,29,0.94)_56%,rgba(69,26,3,0.98))] text-orange-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]${selectedRing}`;
  if (category === 'tactic') return `border-cyan-100/60 bg-[radial-gradient(circle_at_20%_0%,rgba(186,230,253,0.56),transparent_30%),linear-gradient(145deg,rgba(14,116,144,0.96),rgba(30,64,175,0.94)_58%,rgba(15,23,42,0.98))] text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]${selectedRing}`;
  if (category === 'response') return `border-violet-100/60 bg-[radial-gradient(circle_at_20%_0%,rgba(221,214,254,0.54),transparent_30%),linear-gradient(145deg,rgba(109,40,217,0.96),rgba(67,56,202,0.94)_58%,rgba(30,27,75,0.98))] text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]${selectedRing}`;
  if (category === 'prototype') return `border-yellow-100/55 bg-[radial-gradient(circle_at_20%_0%,rgba(254,240,138,0.52),transparent_30%),linear-gradient(145deg,rgba(161,98,7,0.96),rgba(154,52,18,0.94)_58%,rgba(69,26,3,0.98))] text-yellow-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]${selectedRing}`;
  return `border-slate-200/35 bg-[linear-gradient(145deg,rgba(71,85,105,0.94),rgba(15,23,42,0.98))] text-slate-50${selectedRing}`;
}

export function getCardCategoryBadgeClass(category: DeltaDashCardDefinition['category']): string {
  if (category === 'action') return 'border-orange-300/35 bg-orange-400/15 text-orange-100';
  if (category === 'tactic') return 'border-cyan-300/35 bg-cyan-400/15 text-cyan-100';
  if (category === 'response') return 'border-violet-300/35 bg-violet-400/15 text-violet-100';
  if (category === 'prototype') return 'border-yellow-300/35 bg-yellow-400/15 text-yellow-100';
  return 'border-slate-300/25 bg-slate-400/10 text-slate-100';
}

export function getCardPriorityClass(priority: DeltaDashCardDefinition['priority']): string {
  if (priority === 'X') return 'border-white/70 bg-[linear-gradient(90deg,#ffffff,#f0abfc,#38bdf8,#86efac,#fde047,#ffffff)] text-black shadow-[0_0_18px_rgba(255,255,255,0.28)]';

  if (priority <= 1) return 'border-sky-300/45 bg-sky-400/20 text-sky-100';
  if (priority === 2) return 'border-cyan-300/45 bg-cyan-400/20 text-cyan-100';
  if (priority === 3) return 'border-lime-300/45 bg-lime-400/18 text-lime-100';
  if (priority === 4) return 'border-yellow-300/50 bg-yellow-400/20 text-yellow-100';
  if (priority === 5) return 'border-orange-300/55 bg-orange-500/22 text-orange-100';
  return 'border-red-300/60 bg-red-500/25 text-red-100';
}

export function getCardCategoryTextClass(category: DeltaDashCardDefinition['category']): string {
  if (category === 'action') return 'text-orange-50';
  if (category === 'tactic') return 'text-cyan-50';
  if (category === 'response') return 'text-violet-50';
  if (category === 'prototype') return 'text-yellow-50';
  return 'text-slate-50';
}

export function getCardCategoryMutedTextClass(category: DeltaDashCardDefinition['category']): string {
  if (category === 'action') return 'text-orange-100/85';
  if (category === 'tactic') return 'text-cyan-100/85';
  if (category === 'response') return 'text-violet-100/85';
  if (category === 'prototype') return 'text-yellow-100/85';
  return 'text-slate-200/85';
}

export function getCardCategoryAccentTextClass(category: DeltaDashCardDefinition['category']): string {
  if (category === 'action') return 'text-yellow-100';
  if (category === 'tactic') return 'text-sky-100';
  if (category === 'response') return 'text-fuchsia-100';
  if (category === 'prototype') return 'text-amber-100';
  return 'text-slate-100';
}

export function getCardCategoryLabel(category: DeltaDashCardDefinition['category'], language: Language): string {
  const labels = {
    action: { en: 'Action', zh: '行动' },
    tactic: { en: 'Tactic', zh: '战术' },
    response: { en: 'Response', zh: '响应' },
    'driver-passive': { en: 'Passive', zh: '被动' },
    prototype: { en: 'Prototype', zh: '原型' },
  } satisfies Record<DeltaDashCardDefinition['category'], Record<Language, string>>;

  return labels[category][language];
}
