import fs from 'fs';
import path from 'path';

const BOX_THIS_LAP_TRACKS = '/Users/leolong/Documents/trae_projects/Box-This-Lap/src/data/tracks';
const OUTPUT_FILE = '/Users/leolong/Desktop/DeltaDash-Online-Assistant/DeltaDash-Platform/src/lib/deltadash/real-tracks.ts';

type BoxThisLapSector = {
  startDistance: number;
  endDistance: number;
  type: string;
  maxSpeed: number;
};

type BoxThisLapTelemetryPoint = {
  dist: number;
  speed: number;
};

type BoxThisLapDrsZone = {
  activationDistance: number;
  endDistance: number;
};

type BoxThisLapTrack = {
  id: string;
  name: string;
  totalDistance: number;
  sectors: BoxThisLapSector[];
  telemetryPoints?: BoxThisLapTelemetryPoint[];
  drsZones?: BoxThisLapDrsZone[];
};

type DeltaDashRealTrackSector = {
  startPercent: number;
  endPercent: number;
  type: 'corner_low_speed' | 'corner_medium_speed' | 'corner_high_speed' | 'straight';
};

type DeltaDashRealTrackData = {
  id: string;
  name: string;
  sectors: DeltaDashRealTrackSector[];
};

async function extractTracks() {
  const trackFiles = fs.readdirSync(BOX_THIS_LAP_TRACKS)
    .filter(f => f.endsWith('.ts') && f !== 'index.ts');

  const tracks: Record<string, DeltaDashRealTrackData> = {};

  for (const file of trackFiles) {
    const trackName = file.replace('.ts', '');
    const filePath = path.join(BOX_THIS_LAP_TRACKS, file);

    try {
      // Dynamic import the track module
      const module = await import(filePath);
      const trackKey = Object.keys(module).find(k => k !== 'default');
      if (!trackKey) continue;

      const track: BoxThisLapTrack = module[trackKey];
      if (!track.sectors || !track.totalDistance) continue;

      const sectors = buildVisualSectors(track);

      tracks[trackName] = {
        id: track.id,
        name: track.name,
        sectors,
      };
    } catch (err) {
      console.warn(`Skipping ${file}:`, err);
    }
  }

  return tracks;
}

function buildVisualSectors(track: BoxThisLapTrack) {
  if (!track.telemetryPoints?.length) {
    return track.sectors.map((s: BoxThisLapSector) => ({
      startPercent: Number((s.startDistance / track.totalDistance).toFixed(4)),
      endPercent: Number((s.endDistance / track.totalDistance).toFixed(4)),
      type: s.type,
    }));
  }

  const points = [...track.telemetryPoints].sort((a, b) => a.dist - b.dist);
  const visualSectors = [];

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const startDistance = current.dist;
    const endDistance = next?.dist ?? track.totalDistance;
    if (endDistance <= startDistance) continue;

    const midpoint = (startDistance + endDistance) / 2;
    const sourceSector = track.sectors.find((sector) => midpoint >= sector.startDistance && midpoint <= sector.endDistance) ?? track.sectors.at(-1)!;

    visualSectors.push({
      startDistance,
      endDistance,
      type: classifyTelemetryInterval(track, sourceSector, current.speed),
    });
  }

  const merged = [];
  for (const sector of visualSectors) {
    const previous = merged.at(-1);
    if (previous && previous.type === sector.type) {
      previous.endDistance = sector.endDistance;
    } else {
      merged.push({ ...sector });
    }
  }

  return merged.map((sector) => ({
    startPercent: Number((sector.startDistance / track.totalDistance).toFixed(4)),
    endPercent: Number((sector.endDistance / track.totalDistance).toFixed(4)),
    type: sector.type,
  }));
}

function classifyTelemetryInterval(track: BoxThisLapTrack, sourceSector: BoxThisLapSector, speed: number) {
  let type = 'corner_low_speed';
  if (speed >= 78) type = 'straight';
  else if (speed >= 68) type = 'corner_high_speed';
  else if (speed >= 52) type = 'corner_medium_speed';

  if (sourceSector.type === 'straight') return 'straight';
  if (track.drsZones?.some((zone) => sourceSector.startDistance < zone.endDistance && sourceSector.endDistance > zone.activationDistance)) return 'straight';
  return type;
}

extractTracks().then(tracks => {
  const output = `export type RealTrackSector = {
  startPercent: number;
  endPercent: number;
  type: 'corner_low_speed' | 'corner_medium_speed' | 'corner_high_speed' | 'straight';
};

export type RealTrackData = {
  id: string;
  name: string;
  sectors: RealTrackSector[];
};

export const REAL_TRACKS: Record<string, RealTrackData> = ${JSON.stringify(tracks, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`Extracted ${Object.keys(tracks).length} tracks to ${OUTPUT_FILE}`);
});
