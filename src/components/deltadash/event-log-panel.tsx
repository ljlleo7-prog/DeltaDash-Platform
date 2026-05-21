import type { Language } from '@/lib/i18n';
import type { DeltaDashEvent } from '@/lib/deltadash/types';

export function EventLogPanel({ events, language }: { events: DeltaDashEvent[]; language: Language }) {
  const lines = events.map((event) => describeEvent(event));

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/80">
      <div className="border-b border-white/10 px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.18em] text-slate-500">
        {language === 'en' ? 'Log' : '日志'}
      </div>
      <pre className="max-h-32 overflow-auto px-2 py-1 font-mono text-[0.65rem] leading-4 text-slate-400">
        {lines.length ? lines.join('\n') : language === 'en' ? 'No events yet.' : '暂无事件。'}
      </pre>
    </section>
  );
}

function describeEvent(event: DeltaDashEvent) {
  switch (event.type) {
    case 'MATCH_CREATED':
      return 'MATCH_CREATED · local event log initialized';
    case 'RACE_STARTED':
      return `RACE_STARTED · round ${event.round}`;
    case 'PIT_ENTRY_REQUESTED':
      return `PIT_ENTRY_REQUESTED · ${event.carId}`;
    case 'PIT_SERVICE_SELECTED':
      return `PIT_SERVICE_SELECTED · ${event.carId} ${event.compound}${event.repairSelected ? ' + repair' : ''}`;
    case 'PIT_EXITED':
      return `PIT_EXITED · ${event.carId}`;
    case 'ACTION_COMMITTED':
      return `ACTION_COMMITTED · ${event.carId} chose ${event.action}${event.targetCarIds?.length ? ` → ${event.targetCarIds.join(', ')}` : ''}`;
    case 'CARD_PLAY_COMMITTED':
      return `CARD_PLAY_COMMITTED · ${event.carId} played ${event.cardDefinitionId}${event.targetCarIds?.length ? ` → ${event.targetCarIds.join(', ')}` : ''}`;
    case 'CARD_MOVED':
      return `CARD_MOVED · ${event.cardInstanceId} to ${event.zone}`;
    case 'CARD_RESOLVED':
      return `CARD_RESOLVED · ${event.carId} resolved ${event.cardDefinitionId}`;
    case 'CARDS_DRAWN':
      return `CARDS_DRAWN · ${event.carId} drew ${event.cardInstanceIds.length} card(s)`;
    case 'ACTIONS_RESOLVED':
      return `ACTIONS_RESOLVED · ${event.results.length} cars updated`;
    case 'STEWARD_REVIEWED':
      return `STEWARD_REVIEWED · ${event.notes.length} note(s), flag ${event.flag}`;
    case 'WEATHER_UPDATED':
      return `WEATHER_UPDATED · ${event.weather.sky}, grip ${Math.round(event.surfaceGrip * 100)}%`;
    case 'TYRE_SELECTED':
      return `TYRE_SELECTED · ${event.carId} ${event.compound}`;
    case 'PIT_STATUS_CHANGED':
      return `PIT_STATUS_CHANGED · ${event.carId} ${event.status}`;
    case 'DATA_UPDATE_APPLIED':
      return `DATA_UPDATE_APPLIED · round ${event.round}`;
    case 'ROUND_STARTED':
      return `ROUND_STARTED · round ${event.round}`;
    case 'ROUND_ENDED':
      return `ROUND_ENDED · round ${event.round}`;
    case 'MATCH_FINISHED':
      return `MATCH_FINISHED · round ${event.round}`;
    case 'COMMITMENTS_LOCKED':
      return `COMMITMENTS_LOCKED · round ${event.round}, response ${event.responseWindowSeconds}s`;
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}
