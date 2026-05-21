import { REAL_TRACKS, type RealTrackData } from './real-tracks';
import type { DeltaDashClimate, DeltaDashSky, DeltaDashTemperatureBand, DeltaDashTrack, DeltaDashTyreCurveProfile, DeltaDashWeatherState } from './types';

const TRACK_DEFAULTS = {
  collisionTimeThreshold: 0.5,
  maxRounds: 12,
};

const THEORETICAL_LAP_SECONDS: Record<string, number> = {
  abuDhabi: 83,
  austin: 96,
  bahrain: 91,
  baku: 101,
  catalunya: 73,
  china: 92,
  hungaroring: 76,
  imola: 75,
  interlagos: 70,
  jeddah: 89,
  lasVegas: 94,
  melbourne: 80,
  mexicoCity: 78,
  miami: 89,
  monaco: 72,
  montreal: 72,
  monza: 80,
  qatar: 84,
  silverstone: 87,
  singapore: 100,
  spa: 105,
  spielberg: 65,
  suzuka: 90,
  zandvoort: 71,
};

const CLIMATE_DEFAULTS: Record<DeltaDashClimate, {
  canRain: boolean;
  defaultSky: DeltaDashSky;
  rainChance: number;
  temperatureBand: DeltaDashTemperatureBand;
  abrasionBias: number;
  gripBias: number;
}> = {
  arid: { canRain: false, defaultSky: 'clear', rainChance: 0, temperatureBand: 'hot', abrasionBias: 0.10, gripBias: -0.01 },
  temperate: { canRain: true, defaultSky: 'cloudy', rainChance: 0.28, temperatureBand: 'mild', abrasionBias: 0.02, gripBias: 0.01 },
  tropical: { canRain: true, defaultSky: 'cloudy', rainChance: 0.48, temperatureBand: 'hot', abrasionBias: 0.04, gripBias: 0 },
  street: { canRain: true, defaultSky: 'cloudy', rainChance: 0.22, temperatureBand: 'mild', abrasionBias: 0.01, gripBias: -0.02 },
};

const TRACK_METADATA: Record<string, Partial<Pick<RealTrackData, 'climate' | 'canRain' | 'defaultSky' | 'rainChance' | 'temperatureBand' | 'abrasionBias' | 'gripBias'>>> = {
  abuDhabi: { climate: 'arid', canRain: false, defaultSky: 'clear', rainChance: 0, temperatureBand: 'hot', abrasionBias: 0.08 },
  austin: { climate: 'temperate', temperatureBand: 'hot', abrasionBias: 0.08, rainChance: 0.20 },
  bahrain: { climate: 'arid', canRain: false, defaultSky: 'clear', rainChance: 0, temperatureBand: 'hot', abrasionBias: 0.14 },
  baku: { climate: 'street', rainChance: 0.16, gripBias: -0.03 },
  catalunya: { climate: 'temperate', temperatureBand: 'hot', abrasionBias: 0.12, rainChance: 0.16 },
  china: { climate: 'temperate', rainChance: 0.26, abrasionBias: 0.05 },
  hungaroring: { climate: 'temperate', temperatureBand: 'hot', rainChance: 0.22, abrasionBias: 0.08 },
  imola: { climate: 'temperate', rainChance: 0.30, abrasionBias: 0.04 },
  interlagos: { climate: 'tropical', rainChance: 0.52, abrasionBias: 0.06 },
  jeddah: { climate: 'arid', canRain: false, defaultSky: 'clear', rainChance: 0, temperatureBand: 'hot', gripBias: -0.02 },
  lasVegas: { climate: 'arid', canRain: false, defaultSky: 'clear', rainChance: 0, temperatureBand: 'cool', gripBias: -0.03 },
  melbourne: { climate: 'temperate', rainChance: 0.24 },
  mexicoCity: { climate: 'temperate', rainChance: 0.18, gripBias: -0.01 },
  miami: { climate: 'tropical', rainChance: 0.38, temperatureBand: 'hot' },
  monaco: { climate: 'street', rainChance: 0.18, gripBias: -0.03 },
  montreal: { climate: 'temperate', rainChance: 0.32, temperatureBand: 'cool' },
  monza: { climate: 'temperate', rainChance: 0.28, abrasionBias: -0.01, gripBias: 0.02 },
  qatar: { climate: 'arid', canRain: false, defaultSky: 'clear', rainChance: 0, temperatureBand: 'hot', abrasionBias: 0.16 },
  silverstone: { climate: 'temperate', rainChance: 0.42, temperatureBand: 'cool' },
  singapore: { climate: 'tropical', rainChance: 0.44, temperatureBand: 'hot', gripBias: -0.02 },
  spa: { climate: 'temperate', rainChance: 0.50, temperatureBand: 'cool' },
  spielberg: { climate: 'temperate', rainChance: 0.34, abrasionBias: 0.04 },
  suzuka: { climate: 'temperate', rainChance: 0.36, abrasionBias: 0.06 },
  zandvoort: { climate: 'temperate', rainChance: 0.30, abrasionBias: 0.10, gripBias: -0.01 },
};

const TRACK_CURVE_OVERRIDES: Partial<Record<string, Partial<DeltaDashTyreCurveProfile>>> = {
  china: {
    baseWear: { soft: 9, medium: 6, hard: 4, intermediate: 5, wet: 5.8 },
    degradationStartPercent: 72,
    degradationExponent: 1.65,
    maxPaceLoss: 1.7,
  },
  bahrain: {
    baseWear: { soft: 10.2, medium: 7.1, hard: 4.8, intermediate: 5.8, wet: 6.8 },
    degradationStartPercent: 76,
    degradationExponent: 1.8,
    maxPaceLoss: 2.0,
  },
  monza: {
    baseWear: { soft: 7.2, medium: 4.8, hard: 3.3, intermediate: 4.2, wet: 5 },
    degradationStartPercent: 66,
    degradationExponent: 1.5,
    maxPaceLoss: 1.35,
  },
  suzuka: {
    baseWear: { soft: 9.8, medium: 6.7, hard: 4.5, intermediate: 5.4, wet: 6.2 },
    degradationStartPercent: 74,
    degradationExponent: 1.75,
    maxPaceLoss: 1.9,
  },
  silverstone: {
    baseWear: { soft: 11.4, medium: 7.8, hard: 5.3, intermediate: 6.4, wet: 7.1 },
    degradationStartPercent: 78,
    degradationExponent: 1.9,
    maxPaceLoss: 2.15,
  },
  singapore: {
    baseWear: { soft: 7.8, medium: 5.4, hard: 3.8, intermediate: 4.8, wet: 5.5 },
    degradationStartPercent: 68,
    degradationExponent: 1.55,
    maxPaceLoss: 1.5,
  },
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

export function createDeltaDashTrack(trackKey: string, seed = 0): DeltaDashTrack {
  const track = getRealTrackData(trackKey);
  const resolvedTrackKey = REAL_TRACKS[trackKey] ? trackKey : DEFAULT_REAL_TRACK_ID;
  const metadata = getTrackMetadata(resolvedTrackKey, track);
  const load = getSectorLoad(track);
  const tyreCurve = getTyreCurveProfile(resolvedTrackKey, metadata, load);
  const tyreStress = clamp(0.38 + (0.30 * load.highSpeedLoad) + (0.18 * load.tractionLoad) - (0.10 * load.coolingRelief) + metadata.abrasionBias, 0.30, 0.95);
  const drySurfaceGrip = clamp(0.88 + metadata.gripBias - (0.04 * metadata.abrasionBias), 0.78, 0.98);
  const weather = createInitialWeather(resolvedTrackKey, metadata, seed);
  const surfaceGrip = getSurfaceGrip(drySurfaceGrip, weather.trackWetness);

  return {
    ...TRACK_DEFAULTS,
    finishTimeDelta: getScaledFinishTimeDelta(resolvedTrackKey),
    id: track.id,
    name: track.name,
    rainMm: weather.rainIntensity * 8,
    surfaceGrip,
    drySurfaceGrip,
    tyreStress,
    climate: metadata.climate,
    canRain: metadata.canRain,
    weather,
    tyreCurve,
    realTrackKey: resolvedTrackKey,
  };
}

function getScaledFinishTimeDelta(trackKey: string): number {
  return Math.round(((THEORETICAL_LAP_SECONDS[trackKey] ?? 90) / 3) * 10) / 10;
}

function getTrackMetadata(trackKey: string, track: RealTrackData) {
  const climate = track.climate ?? TRACK_METADATA[trackKey]?.climate ?? 'temperate';
  const defaults = CLIMATE_DEFAULTS[climate];
  return {
    climate,
    canRain: track.canRain ?? TRACK_METADATA[trackKey]?.canRain ?? defaults.canRain,
    defaultSky: track.defaultSky ?? TRACK_METADATA[trackKey]?.defaultSky ?? defaults.defaultSky,
    rainChance: track.rainChance ?? TRACK_METADATA[trackKey]?.rainChance ?? defaults.rainChance,
    temperatureBand: track.temperatureBand ?? TRACK_METADATA[trackKey]?.temperatureBand ?? defaults.temperatureBand,
    abrasionBias: track.abrasionBias ?? TRACK_METADATA[trackKey]?.abrasionBias ?? defaults.abrasionBias,
    gripBias: track.gripBias ?? TRACK_METADATA[trackKey]?.gripBias ?? defaults.gripBias,
  };
}

function getTyreCurveProfile(trackKey: string, metadata: ReturnType<typeof getTrackMetadata>, load: ReturnType<typeof getSectorLoad>): DeltaDashTyreCurveProfile {
  const loadFactor = clamp(0.84 + (0.34 * load.highSpeedLoad) + (0.24 * load.tractionLoad) - (0.14 * load.coolingRelief) + metadata.abrasionBias, 0.72, 1.24);
  const defaultCurve: DeltaDashTyreCurveProfile = {
    baseWear: {
      soft: roundToTenth(9 * loadFactor),
      medium: roundToTenth(6 * loadFactor),
      hard: roundToTenth(4 * loadFactor),
      intermediate: roundToTenth(5 * loadFactor),
      wet: roundToTenth(5.8 * loadFactor),
    },
    degradationStartPercent: Math.round(clamp(70 + (metadata.abrasionBias * 45) + (load.highSpeedLoad * 8), 62, 78)),
    degradationExponent: roundToTenth(clamp(1.55 + (metadata.abrasionBias * 1.1) + (load.tractionLoad * 0.25), 1.35, 1.95)),
    maxPaceLoss: roundToTenth(clamp(1.55 + (metadata.abrasionBias * 3.2) + (load.tractionLoad * 0.55), 1.2, 2.15)),
    wetCrossover: {
      slickMaxWetness: 0.18,
      intermediateMinWetness: 0.12,
      intermediateMaxWetness: 0.55,
      wetMinWetness: 0.42,
    },
  };
  const override = TRACK_CURVE_OVERRIDES[trackKey];
  return {
    ...defaultCurve,
    ...override,
    baseWear: { ...defaultCurve.baseWear, ...override?.baseWear },
    wetCrossover: { ...defaultCurve.wetCrossover, ...override?.wetCrossover },
  };
}

function getSectorLoad(track: RealTrackData) {
  return track.sectors.reduce((load, sector) => {
    const length = Math.max(0, sector.endPercent - sector.startPercent);
    if (sector.type === 'corner_high_speed') return { ...load, highSpeedLoad: load.highSpeedLoad + length };
    if (sector.type === 'corner_low_speed') return { ...load, tractionLoad: load.tractionLoad + length };
    if (sector.type === 'straight') return { ...load, coolingRelief: load.coolingRelief + length };
    return { ...load, mediumLoad: load.mediumLoad + length };
  }, { highSpeedLoad: 0, tractionLoad: 0, mediumLoad: 0, coolingRelief: 0 });
}

function createInitialWeather(trackKey: string, metadata: ReturnType<typeof getTrackMetadata>, seed: number): DeltaDashWeatherState {
  if (!metadata.canRain || metadata.defaultSky === 'clear') {
    return { sky: 'clear', rainIntensity: 0, trackWetness: 0, temperatureBand: metadata.temperatureBand, trend: 0 };
  }

  const roll = deterministicNoise(`${trackKey}:weather:${seed}`);
  if (roll > metadata.rainChance) {
    return { sky: metadata.defaultSky, rainIntensity: 0, trackWetness: 0, temperatureBand: metadata.temperatureBand, trend: 0 };
  }

  const lightRain = roll > metadata.rainChance * 0.28;
  return {
    sky: lightRain ? 'light-rain' : 'steady-rain',
    rainIntensity: lightRain ? 0.32 : 0.58,
    trackWetness: lightRain ? 0.18 : 0.34,
    temperatureBand: metadata.temperatureBand,
    trend: lightRain ? 0 : 1,
  };
}

export function getSurfaceGrip(drySurfaceGrip: number, trackWetness: number): number {
  return clamp(drySurfaceGrip - (0.22 * trackWetness), 0.58, 0.98);
}

function deterministicNoise(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
