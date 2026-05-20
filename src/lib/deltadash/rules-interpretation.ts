import type { LocalizedText } from '@/lib/i18n';

export type RuleInterpretationStatus = 'clear' | 'inferred' | 'ambiguous' | 'open-question';

export type RuleInterpretationPriority = 'now' | 'soon' | 'later';

export type RuleInterpretationNode = {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  details: LocalizedText[];
  sourceRefs: string[];
  relatedNodeIds: string[];
  status: RuleInterpretationStatus;
  tags: string[];
  implementationPriority: RuleInterpretationPriority;
};

export const ruleInterpretationNodes: RuleInterpretationNode[] = [
  {
    id: 'event-log-first',
    slug: 'event-log-first',
    title: { zh: '事件日志优先', en: 'Event log first' },
    summary: {
      zh: '比赛的权威记录应是一串可回放事件，当前状态只由事件投影得出。',
      en: 'The authoritative match record should be a replayable event log, with visible state projected from events.',
    },
    details: [
      { zh: '任何能改变比赛的操作都应写入事件，而不是直接改 UI 状态。', en: 'Any match-changing operation should be recorded as an event rather than directly mutating UI state.' },
      { zh: '这允许本地优先、刷新恢复、未来同步和回放审查使用同一套基础。', en: 'This supports local-first persistence, refresh recovery, future sync, and replay review with the same foundation.' },
    ],
    sourceRefs: ['docs/deltadash-local-first-rules-interpretation.md#core-local-first-design-principles'],
    relatedNodeIds: ['round-lifecycle', 'steward-arbitration'],
    status: 'clear',
    tags: ['local-first', 'engine', 'sync'],
    implementationPriority: 'now',
  },
  {
    id: 'match-setup',
    slug: 'match-setup',
    title: { zh: '比赛初始化', en: 'Match setup' },
    summary: {
      zh: '初始化应锁定赛道、玩家、车辆、随机种子、天气与起手资源。',
      en: 'Setup should lock track, players, cars, seed, weather, and starting resources.',
    },
    details: [
      { zh: '所有客户端必须从同一初始事件重建相同牌堆、天气和车辆状态。', en: 'All clients must rebuild the same decks, weather, and car state from the same initial event.' },
    ],
    sourceRefs: ['docs/deltadash-local-first-rules-interpretation.md#match-setup-interpretation'],
    relatedNodeIds: ['event-log-first', 'card-zones'],
    status: 'clear',
    tags: ['setup', 'seed', 'cards'],
    implementationPriority: 'now',
  },
  {
    id: 'round-lifecycle',
    slug: 'round-lifecycle',
    title: { zh: '回合生命周期', en: 'Round lifecycle' },
    summary: {
      zh: '每回合应分为准备、行动提交、揭示结算、数据更新和清理。',
      en: 'Each round should move through preparation, action commit, reveal/resolve, data update, and cleanup.',
    },
    details: [
      { zh: '当前原型已经有 planning/resolving/steward/roundEnd 阶段，之后可细分响应窗口。', en: 'The current prototype already has planning/resolving/steward/roundEnd phases and can later split response windows further.' },
    ],
    sourceRefs: ['docs/deltadash-local-first-rules-interpretation.md#round-lifecycle'],
    relatedNodeIds: ['priority-response', 'steward-arbitration'],
    status: 'inferred',
    tags: ['rounds', 'phase', 'engine'],
    implementationPriority: 'now',
  },
  {
    id: 'energy-system',
    slug: 'energy-system',
    title: { zh: '能量系统', en: 'Energy system' },
    summary: {
      zh: '能量是车辆资源；根据修订说明，硬上限为 4.0MJ，不能低于 0.0MJ。',
      en: 'Energy is a car resource; per the revised abstraction, it has a hard cap of 4.0MJ and cannot drop below 0.0MJ.',
    },
    details: [
      { zh: '释放、回收、防御和部分卡牌都会读写能量，必须通过事件记录。', en: 'Release, recovery, defense, and some cards read/write energy and should be recorded through events.' },
      { zh: '回收牌现在解释为用卡立即换取 1MJ，但下一回合不能普通释放。', en: 'Recover is now interpreted as exchanging a card for 1MJ immediately, with a no-normal-release penalty next round.' },
    ],
    sourceRefs: ['docs/deltadash-local-first-rules-interpretation.md#energy-system', 'docs/deltadash-card-abstraction.md#回收-recycle--recover'],
    relatedNodeIds: ['card-zones', 'priority-response'],
    status: 'clear',
    tags: ['energy', 'cards', 'resources'],
    implementationPriority: 'now',
  },
  {
    id: 'position-rank',
    slug: 'position-rank',
    title: { zh: '位置、排名与关系', en: 'Position, rank, and relationships' },
    summary: {
      zh: '引擎应存绝对时间差并派生排名、前后关系、1.5 秒邻近和超车状态。',
      en: 'The engine should store absolute timeDelta and derive rank, front/back relationships, 1.5-second proximity, and overtake state.',
    },
    details: [
      { zh: '烧胎、保胎、曲线救国和渔翁得利都依赖位置或关系谓词。', en: 'Burn Tires, Protect Tires, Roundabout Rescue, and Fisherman’s Profit all depend on position or relationship predicates.' },
    ],
    sourceRefs: ['docs/deltadash-local-first-rules-interpretation.md#position-and-timeDelta-system'],
    relatedNodeIds: ['card-zones', 'flags-incidents'],
    status: 'inferred',
    tags: ['position', 'rank', 'cards'],
    implementationPriority: 'soon',
  },
  {
    id: 'card-zones',
    slug: 'card-zones',
    title: { zh: '卡牌区域与状态', en: 'Card zones and state' },
    summary: {
      zh: '需要明确牌堆、手牌、部署区、结算中、弃牌和移除区。',
      en: 'The game needs explicit deck, hand, deployed, resolving, discard, and removed zones.',
    },
    details: [
      { zh: '死守狮防可长期留在部署区，因此卡牌区域必须能跨回合保存。', en: 'Steadfast Lion Defense can remain deployed across rounds, so card zones must persist across rounds.' },
      { zh: '本次实现先建立数据结构，复杂隐藏信息和响应栈后续再扩展。', en: 'This pass should establish the data structure first; complex hidden information and response stacks can come later.' },
    ],
    sourceRefs: ['docs/deltadash-local-first-rules-interpretation.md#card-deployment-and-activation', 'docs/deltadash-card-abstraction.md'],
    relatedNodeIds: ['priority-response', 'energy-system'],
    status: 'clear',
    tags: ['cards', 'zones', 'engine'],
    implementationPriority: 'now',
  },
  {
    id: 'priority-response',
    slug: 'priority-response',
    title: { zh: '优先级与响应窗口', en: 'Priority and response windows' },
    summary: {
      zh: '卡牌左上角数字或 X 表示结算顺序或条件响应，不能只用普通按钮替代。',
      en: 'The top-left number or X indicates resolution priority or conditional response timing, so simple buttons are not enough long-term.',
    },
    details: [
      { zh: '第一步只用优先级作为展示和简单结算元数据；完整响应栈稍后实现。', en: 'The first step should use priority as display/simple resolution metadata; full response stacks can be implemented later.' },
    ],
    sourceRefs: ['docs/deltadash-card-abstraction.md#action--tactic-cards'],
    relatedNodeIds: ['card-zones', 'round-lifecycle'],
    status: 'inferred',
    tags: ['priority', 'response', 'cards'],
    implementationPriority: 'soon',
  },
  {
    id: 'flags-incidents',
    slug: 'flags-incidents',
    title: { zh: '旗况与事故', en: 'Flags and incidents' },
    summary: {
      zh: '事故、黄旗、安全车、红旗等应作为结算后的比赛状态和赛会事件处理。',
      en: 'Incidents, yellow flags, safety cars, red flags, and related states should be handled as post-resolution race state and steward events.',
    },
    details: [
      { zh: '当前原型已有黄旗和赛会判定；安全车、红旗等先保留为后续扩展。', en: 'The current prototype already has yellow flags and steward review; safety car and red flag behavior should remain future work.' },
    ],
    sourceRefs: ['docs/deltadash-local-first-rules-interpretation.md#flags-and-incidents'],
    relatedNodeIds: ['steward-arbitration', 'position-rank'],
    status: 'inferred',
    tags: ['flags', 'incidents', 'steward'],
    implementationPriority: 'later',
  },
  {
    id: 'steward-arbitration',
    slug: 'steward-arbitration',
    title: { zh: '赛会仲裁', en: 'Steward arbitration' },
    summary: {
      zh: '赛会应先作为确定性仲裁层，验证合法性、记录处罚并处理事故。',
      en: 'The steward should first be a deterministic arbitration layer for legality, penalties, and incidents.',
    },
    details: [
      { zh: 'AI/自动赛会不应隐藏结论，应该把判定写入事件日志。', en: 'AI/automatic stewarding should not hide decisions; rulings should be written into the event log.' },
    ],
    sourceRefs: ['docs/deltadash-local-first-rules-interpretation.md#steward-role'],
    relatedNodeIds: ['event-log-first', 'flags-incidents'],
    status: 'clear',
    tags: ['steward', 'penalty', 'engine'],
    implementationPriority: 'now',
  },
  {
    id: 'scoring-end',
    slug: 'scoring-end',
    title: { zh: '完赛与计分', en: 'Finish and scoring' },
    summary: {
      zh: '完赛检测、回合上限、退赛和计分应由状态派生并通过事件锁定。',
      en: 'Finish detection, round limits, retirement, and scoring should be derived from state and locked through events.',
    },
    details: [
      { zh: '当前原型已支持时间差目标和最大回合；正式计分表后续再接入。', en: 'The current prototype supports time-delta target and max rounds; official point tables can be added later.' },
    ],
    sourceRefs: ['docs/deltadash-local-first-rules-interpretation.md#match-end-and-scoring'],
    relatedNodeIds: ['event-log-first', 'round-lifecycle'],
    status: 'inferred',
    tags: ['finish', 'scoring', 'engine'],
    implementationPriority: 'later',
  },
  {
    id: 'card-abstraction-status',
    slug: 'card-abstraction-status',
    title: { zh: '卡牌抽象状态', en: 'Card abstraction status' },
    summary: {
      zh: '当前卡牌解释来自 AI 视觉识别和用户修订，部分卡牌只应作为文档或临时逻辑。',
      en: 'The current card interpretation comes from AI visual extraction plus user revision; some cards should remain documented-only or provisional.',
    },
    details: [
      { zh: '已明确：基础行动牌与战术牌分类成立；所有车手牌数量为 1；能量硬上限 4.0MJ。', en: 'Clarified so far: action/tactic taxonomy is valid; all driver cards count as 1; energy hard-caps at 4.0MJ.' },
      { zh: '复杂攻击/防御链、目标选择和安全车/红旗类效果不在第一轮完整实现。', en: 'Complex attack/defense chains, target selection, and safety-car/red-flag effects are not fully implemented in the first pass.' },
    ],
    sourceRefs: ['docs/deltadash-card-abstraction.md'],
    relatedNodeIds: ['card-zones', 'priority-response', 'energy-system'],
    status: 'ambiguous',
    tags: ['cards', 'implementation', 'ai-processed'],
    implementationPriority: 'now',
  },
];

export const ruleInterpretationTags = Array.from(new Set(ruleInterpretationNodes.flatMap((node) => node.tags))).sort();
