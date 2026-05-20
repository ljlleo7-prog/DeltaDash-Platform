export type DeltaDashBotProfile = 'balanced' | 'aggressive' | 'conservative';

export type DeltaDashDriverDefinition = {
  id: string;
  name: string;
  imageUrl: string;
  carName: string;
  botProfile?: DeltaDashBotProfile;
};

export const prototypeDrivers: DeltaDashDriverDefinition[] = [
  {
    id: 'driver-delta-one',
    name: 'Alpha',
    imageUrl: '/deltadash/drivers/4.0/slide-01.png',
    carName: 'Alpha',
    botProfile: 'balanced',
  },
  {
    id: 'driver-redline-ghost',
    name: 'Bravo',
    imageUrl: '/deltadash/drivers/4.0/slide-02.png',
    carName: 'Bravo',
    botProfile: 'aggressive',
  },
  {
    id: 'driver-azure-spark',
    name: 'Charlie',
    imageUrl: '/deltadash/drivers/4.0/slide-03.png',
    carName: 'Charlie',
    botProfile: 'balanced',
  },
  {
    id: 'driver-night-runner',
    name: 'Delta',
    imageUrl: '/deltadash/drivers/4.0/slide-04.png',
    carName: 'Delta',
    botProfile: 'conservative',
  },
];

export function getPrototypeDriver(driverId: string): DeltaDashDriverDefinition | null {
  return prototypeDrivers.find((driver) => driver.id === driverId) ?? null;
}
