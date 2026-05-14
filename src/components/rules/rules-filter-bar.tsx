import type { Language } from '@/lib/i18n';
import type { RuleInterpretationStatus } from '@/lib/deltadash/rules-interpretation';

const statusOptions: RuleInterpretationStatus[] = ['clear', 'inferred', 'ambiguous', 'open-question'];

export function RulesFilterBar({
  tags,
  selectedTag,
  selectedStatus,
  language,
  onTagChange,
  onStatusChange,
}: {
  tags: string[];
  selectedTag: string | null;
  selectedStatus: RuleInterpretationStatus | null;
  language: Language;
  onTagChange: (tag: string | null) => void;
  onStatusChange: (status: RuleInterpretationStatus | null) => void;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{language === 'en' ? 'Filter by topic' : '按主题筛选'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterButton active={!selectedTag} label={language === 'en' ? 'All topics' : '全部主题'} onClick={() => onTagChange(null)} />
          {tags.map((tag) => (
            <FilterButton key={tag} active={selectedTag === tag} label={tag} onClick={() => onTagChange(tag)} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{language === 'en' ? 'Filter by confidence' : '按确定性筛选'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterButton active={!selectedStatus} label={language === 'en' ? 'All statuses' : '全部状态'} onClick={() => onStatusChange(null)} />
          {statusOptions.map((status) => (
            <FilterButton key={status} active={selectedStatus === status} label={status} onClick={() => onStatusChange(status)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active
        ? 'rounded-full border border-[var(--accent-cold)]/40 bg-[var(--accent-cold)]/15 px-3 py-1.5 text-xs font-medium text-cyan-100'
        : 'rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10'}
    >
      {label}
    </button>
  );
}
