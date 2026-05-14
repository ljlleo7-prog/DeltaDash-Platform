import { useMemo, useState } from 'react';
import type { Language } from '@/lib/i18n';
import { ruleInterpretationNodes, ruleInterpretationTags, type RuleInterpretationStatus } from '@/lib/deltadash/rules-interpretation';
import { RulesFilterBar } from './rules-filter-bar';
import { RulesInterpretationCard } from './rules-interpretation-card';

export function RulesInterpretationMap({ language }: { language: Language }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<RuleInterpretationStatus | null>(null);
  const nodeMap = useMemo(() => new Map(ruleInterpretationNodes.map((node) => [node.id, node])), []);
  const filteredNodes = useMemo(() => ruleInterpretationNodes.filter((node) => {
    if (selectedTag && !node.tags.includes(selectedTag)) return false;
    if (selectedStatus && node.status !== selectedStatus) return false;
    return true;
  }), [selectedStatus, selectedTag]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-cold)]">
            {language === 'en' ? 'AI interpretation map' : 'AI 解释地图'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {language === 'en' ? 'Mechanisms for a local-first online rules engine' : '面向本地优先在线规则引擎的机制拆解'}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            {language === 'en'
              ? 'Browse the interpreted mechanisms as connected implementation topics. Use filters to isolate uncertain or near-term areas.'
              : '以互相关联的实现主题浏览规则机制。可通过筛选快速查看不确定或近期要实现的部分。'}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-400">
          {filteredNodes.length}/{ruleInterpretationNodes.length}
        </span>
      </div>

      <RulesFilterBar
        tags={ruleInterpretationTags}
        selectedTag={selectedTag}
        selectedStatus={selectedStatus}
        language={language}
        onTagChange={setSelectedTag}
        onStatusChange={setSelectedStatus}
      />

      <div className="grid gap-4">
        {filteredNodes.map((node) => (
          <RulesInterpretationCard
            key={node.id}
            node={node}
            relatedNodes={node.relatedNodeIds.map((id) => nodeMap.get(id)).filter((related): related is NonNullable<typeof related> => Boolean(related))}
            language={language}
          />
        ))}
      </div>
    </section>
  );
}
