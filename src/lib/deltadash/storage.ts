import type { DeltaDashEvent, StoredDeltaDashMatchLog } from './types';

const STORAGE_KEY = 'dd:prototype:match';

export function loadStoredDeltaDashEvents(): DeltaDashEvent[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StoredDeltaDashMatchLog;
    if (parsed.version !== 1 || !Array.isArray(parsed.events)) return [];
    return parsed.events;
  } catch {
    return [];
  }
}

export function saveStoredDeltaDashEvents(events: DeltaDashEvent[]) {
  if (typeof window === 'undefined') return;

  const payload: StoredDeltaDashMatchLog = {
    version: 1,
    savedAt: new Date().toISOString(),
    events,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function resetStoredDeltaDashEvents() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
