import { REAL_TRACKS, type RealTrackData } from './real-tracks';
import type { DeltaDashTrack } from './types';

const TRACK_DEFAULTS = {
  finishTimeDelta: 15,
  collisionTimeThreshold: 0.5,
  maxRounds: 12,
  rainMm: 0.8,
  surfaceGrip: 0.92,
  tyreStress: 0.64,
};

export const DEFAULT_REAL_TRACK_ID = 'bahrain';

export type RealTrackOption = RealTrackData & {
  key: string;
};

export const REAL_TRACK_OPTIONS: RealTrackOption[] = Object.entries(REAL_TRACKS)
  .map(([key, track]) => ({ ...track, key }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getRealTrackData(trackKey: string): RealTrackData {
  return REAL_TRACKS[trackKey] ?? REAL_TRACKS[DEFAULT_REAL_TRACK_ID];
}

export function createDeltaDashTrack(trackKey: string): DeltaDashTrack {
  const track = getRealTrackData(trackKey);

  return {
    ...TRACK_DEFAULTS,
    id: track.id,
    name: track.name,
    realTrackKey: REAL_TRACKS[trackKey] ? trackKey : DEFAULT_REAL_TRACK_ID,
  };
}
