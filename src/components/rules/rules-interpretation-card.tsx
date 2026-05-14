import type { Language } from '@/lib/i18n';
import { localize } from '@/lib/i18n';
import type { RuleInterpretationNode } from '@/lib/deltadash/rules-interpretation';

export function RulesInterpretationCard({
  node,
  relatedNodes,
  language,
}: {
  node: RuleInterpretationNode;
  relatedNodes: RuleInterpretationNode[];
  language: Language;
}) {
  return (
    <details id={node.slug} className="group rounded-3xl border border-white/10 bg-white/5 p-5" open={node.implementationPriority === 'now'}>
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(node.status)}>{node.status}</Badge>
              <Badge tone={priorityTone(node.implementationPriority)}>{node.implementationPriority}</Badge>
              {node.tags.slice(0, 3).map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">{localize(node.title, language)}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{localize(node.summary, language)}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-400">/{node.slug}</span>
        </div>
      </summary>

      <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
        {node.details.map((detail, index) => (
          <p key={`${node.id}-detail-${index}`}>{localize(detail, language)}</p>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{language === 'en' ? 'Source references' : '来源引用'}</p>
          <ul className="mt-3 space-y-2 text-xs text-slate-400">
            {node.sourceRefs.map((ref) => <li key={ref} className="font-mono">{ref}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{language === 'en' ? 'Related interpretations' : '相关解释'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedNodes.length ? relatedNodes.map((related) => (
              <a key={related.id} href={`#${related.slug}`} className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-500/20">
                {localize(related.title, language)}
              </a>
            )) : <span className="text-xs text-slate-500">{language === 'en' ? 'No linked nodes yet.' : '暂无关联节点。'}</span>}
          </div>
        </div>
      </div>
    </details>
  );
}

function Badge({ children, tone }: { children: string; tone: 'cyan' | 'green' | 'yellow' | 'red' | 'purple' | 'neutral' }) {
  const className = {
    cyan: 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100',
    green: 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100',
    yellow: 'border-yellow-300/25 bg-yellow-500/10 text-yellow-100',
    red: 'border-red-300/25 bg-red-500/10 text-red-100',
    purple: 'border-purple-300/25 bg-purple-500/10 text-purple-100',
    neutral: 'border-white/10 bg-white/5 text-slate-300',
  }[tone];

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function statusTone(status: RuleInterpretationNode['status']) {
  if (status === 'clear') return 'green';
  if (status === 'inferred') return 'cyan';
  if (status === 'ambiguous') return 'yellow';
  return 'red';
}

function priorityTone(priority: RuleInterpretationNode['implementationPriority']) {
  if (priority === 'now') return 'purple';
  if (priority === 'soon') return 'cyan';
  return 'neutral';
}
