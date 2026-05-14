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
    name: 'Delta One',
    imageUrl: '/deltadash/drivers/4.0/slide-01.png',
    carName: 'Delta One',
    botProfile: 'balanced',
  },
  {
    id: 'driver-redline-ghost',
    name: 'Redline Ghost',
    imageUrl: '/deltadash/drivers/4.0/slide-02.png',
    carName: 'Redline Ghost',
    botProfile: 'aggressive',
  },
  {
    id: 'driver-azure-spark',
    name: 'Azure Spark',
    imageUrl: '/deltadash/drivers/4.0/slide-03.png',
    carName: 'Azure Spark',
    botProfile: 'balanced',
  },
  {
    id: 'driver-night-runner',
    name: 'Night Runner',
    imageUrl: '/deltadash/drivers/4.0/slide-04.png',
    carName: 'Night Runner',
    botProfile: 'conservative',
  },
];

export function getPrototypeDriver(driverId: string): DeltaDashDriverDefinition | null {
  return prototypeDrivers.find((driver) => driver.id === driverId) ?? null;
}
