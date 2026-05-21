import type { DeltaDashDriverStats } from './types';

export type DeltaDashBotProfile = 'balanced' | 'aggressive' | 'conservative';

export type DeltaDashDriverDefinition = {
  id: string;
  name: string;
  imageUrl: string;
  carName: string;
  botProfile?: DeltaDashBotProfile;
  stats: DeltaDashDriverStats;
};

export const prototypeDrivers: DeltaDashDriverDefinition[] = [
  {
    id: 'driver-delta-one',
    name: 'Alpha',
    imageUrl: '/deltadash/drivers/4.0/slide-01.png',
    carName: 'Alpha',
    botProfile: 'balanced',
    stats: { raceModifier: 0.5, qualifyingModifier: 1.0, focusCap: 8, ability: '水中漂离' },
  },
  {
    id: 'driver-redline-ghost',
    name: 'Bravo',
    imageUrl: '/deltadash/drivers/4.0/slide-02.png',
    carName: 'Bravo',
    botProfile: 'aggressive',
    stats: { raceModifier: 1.0, qualifyingModifier: 1.0, focusCap: 6, ability: '团队风作 / 赛车大拉' },
  },
  {
    id: 'driver-azure-spark',
    name: 'Charlie',
    imageUrl: '/deltadash/drivers/4.0/slide-03.png',
    carName: 'Charlie',
    botProfile: 'balanced',
    stats: { raceModifier: -0.5, qualifyingModifier: -0.2, focusCap: 8, ability: '拉力车手' },
  },
  {
    id: 'driver-night-runner',
    name: 'Delta',
    imageUrl: '/deltadash/drivers/4.0/slide-04.png',
    carName: 'Delta',
    botProfile: 'conservative',
    stats: { raceModifier: 0, qualifyingModifier: -0.7, focusCap: 8, ability: '优秀在我' },
  },
  {
    id: 'driver-apex-viper',
    name: 'Echo',
    imageUrl: '/deltadash/drivers/4.0/slide-01.png',
    carName: 'Echo',
    botProfile: 'aggressive',
    stats: { raceModifier: 0.8, qualifyingModifier: 0.4, focusCap: 7, ability: 'Late-brake pressure' },
  },
  {
    id: 'driver-silver-hare',
    name: 'Foxtrot',
    imageUrl: '/deltadash/drivers/4.0/slide-02.png',
    carName: 'Foxtrot',
    botProfile: 'conservative',
    stats: { raceModifier: -0.2, qualifyingModifier: 0.7, focusCap: 9, ability: 'Clean air saver' },
  },
  {
    id: 'driver-orbit-hawk',
    name: 'Golf',
    imageUrl: '/deltadash/drivers/4.0/slide-03.png',
    carName: 'Golf',
    botProfile: 'balanced',
    stats: { raceModifier: 0.3, qualifyingModifier: -0.4, focusCap: 8, ability: 'Slipstream read' },
  },
  {
    id: 'driver-iron-lynx',
    name: 'Hotel',
    imageUrl: '/deltadash/drivers/4.0/slide-04.png',
    carName: 'Hotel',
    botProfile: 'conservative',
    stats: { raceModifier: -0.7, qualifyingModifier: -0.9, focusCap: 10, ability: 'Incident patience' },
  },
];

export function getPrototypeDriver(driverId: string): DeltaDashDriverDefinition | null {
  return prototypeDrivers.find((driver) => driver.id === driverId) ?? null;
}
