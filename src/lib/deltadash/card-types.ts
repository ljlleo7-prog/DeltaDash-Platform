import type { LocalizedText } from '@/lib/i18n';
import type { DeltaDashActionType, DeltaDashFlag, DeltaDashPenalty } from './types';

export type DeltaDashCardCategory = 'action' | 'tactic' | 'response' | 'driver-passive' | 'prototype';

export type DeltaDashCardTiming = 'planning' | 'response' | 'resolution' | 'cleanup' | 'passive';

export type DeltaDashCardPriority = number | 'X';

export type DeltaDashCardZone = 'deck' | 'hand' | 'deployed' | 'resolving' | 'discard' | 'removed';

export type DeltaDashCardImplementationStatus = 'implemented' | 'provisional' | 'documented-only';

export type DeltaDashCardCondition =
  | { type: 'not_retired' }
  | { type: 'min_energy'; value: number }
  | { type: 'min_tire'; value: number }
  | { type: 'has_hand_cards' }
  | { type: 'flag_is'; value: DeltaDashFlag }
  | { type: 'flag_not'; value: DeltaDashFlag }
  | { type: 'documented-only'; reason: string };

export type DeltaDashEffectPrimitive =
  | { type: 'modify_time_delta'; amount: number; yellowAmount?: number }
  | { type: 'modify_energy'; amount: number; min?: number; max?: number }
  | { type: 'modify_tire'; amount: number; min?: number; max?: number }
  | { type: 'modify_focus'; amount: number; min?: number; max?: number }
  | { type: 'apply_penalty'; penalty: DeltaDashPenalty }
  | { type: 'clear_penalty'; penalty: DeltaDashPenalty }
  | { type: 'draw_cards'; amount: number }
  | { type: 'set_round_modifier'; modifier: string }
  | { type: 'no_effect' };

export type DeltaDashCardTargeting = {
  kind: 'self' | 'opponent' | 'all-opponents' | 'none';
  range?: {
    minTimeGap?: number;
    maxTimeGap?: number;
    inFrontOnly?: boolean;
  };
};

export type DeltaDashCardDefinition = {
  id: string;
  slug: string;
  name: LocalizedText;
  summary: LocalizedText;
  category: DeltaDashCardCategory;
  timing: DeltaDashCardTiming[];
  priority: DeltaDashCardPriority;
  count: string;
  tags: string[];
  targeting: DeltaDashCardTargeting;
  conditions: DeltaDashCardCondition[];
  effects: DeltaDashEffectPrimitive[];
  onFailedConditions: 'return-to-hand' | 'discard' | 'no-effect' | 'stay-deployed';
  implementationStatus: DeltaDashCardImplementationStatus;
  sourceRef: string;
  rulesRevision: string;
  actionBridge?: DeltaDashActionType;
  interpretationNotes?: LocalizedText[];
};

export type DeltaDashCardInstance = {
  instanceId: string;
  definitionId: string;
  ownerCarId: string;
  zone: DeltaDashCardZone;
  revealed: boolean;
};
