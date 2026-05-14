import type { Language } from '@/lib/i18n';
import type { DeltaDashEvent } from '@/lib/deltadash/types';

export function EventLogPanel({ events, language }: { events: DeltaDashEvent[]; language: Language }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">{language === 'en' ? 'Recent event log' : '近期事件日志'}</h2>
      <div className="mt-4 space-y-2 text-xs text-slate-400">
        {events.map((event, index) => (
          <p key={`${event.type}-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            {describeEvent(event)}
          </p>
        ))}
      </div>
    </section>
  );
}

function describeEvent(event: DeltaDashEvent) {
  switch (event.type) {
    case 'MATCH_CREATED':
      return 'MATCH_CREATED · local event log initialized';
    case 'ACTION_COMMITTED':
      return `ACTION_COMMITTED · ${event.carId} chose ${event.action}`;
    case 'CARD_PLAY_COMMITTED':
      return `CARD_PLAY_COMMITTED · ${event.carId} played ${event.cardDefinitionId}`;
    case 'CARD_MOVED':
      return `CARD_MOVED · ${event.cardInstanceId} to ${event.zone}`;
    case 'CARD_RESOLVED':
      return `CARD_RESOLVED · ${event.carId} resolved ${event.cardDefinitionId}`;
    case 'ACTIONS_RESOLVED':
      return `ACTIONS_RESOLVED · ${event.results.length} cars updated`;
    case 'STEWARD_REVIEWED':
      return `STEWARD_REVIEWED · ${event.notes.length} note(s), flag ${event.flag}`;
    case 'ROUND_STARTED':
      return `ROUND_STARTED · round ${event.round}`;
    case 'ROUND_ENDED':
      return `ROUND_ENDED · round ${event.round}`;
    case 'MATCH_FINISHED':
      return `MATCH_FINISHED · round ${event.round}`;
    case 'COMMITMENTS_LOCKED':
      return `COMMITMENTS_LOCKED · round ${event.round}`;
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}
