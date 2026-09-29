import { carById, data, partById } from '../data/config';
import type { CarDef, CarStats, OwnedCar, Profile, Slot } from '../types';

export function createOwned(car: CarDef): OwnedCar {
  return {
    id: car.id,
    parts: {},
    launch: data.tuning.launch.default,
    drive: data.tuning.drive.default,
    paint: car.color,
    accent: '#343345',
    wheels: 0,
    marks: [],
  };
}
export function statsFor(car: CarDef, owned?: OwnedCar): CarStats {
  const effect = (slot: Slot) => partById.get(owned?.parts[slot] ?? '')?.effect ?? 0;
  const power = 1 + effect('engine');
  const weight = 1 - effect('weight');
  return {
    acceleration: (car.acceleration * power) / weight,
    maxSpeed: car.maxSpeed * Math.sqrt(power),
    grip: 1 + effect('tires'),
    shiftTime: 0.28 - effect('transmission'),
    nitro: effect('nitro'),
    power: Math.round(car.power * power),
    mass: Math.round(car.mass * weight),
  };
}
export function buyCar(profile: Profile, id: string): string {
  const car = carById.get(id);
  if (!car) return 'This car is unavailable.';
  if (profile.cars.some((owned) => owned.id === id)) {
    profile.selected = id;
    return `${car.name} selected.`;
  }
  if (car.class > Math.floor(profile.unlocked / 5))
    return 'Finish the previous division to unlock this car.';
  if (profile.cash < car.price) return 'Earn more credits in career races or jobs.';
  profile.cash -= car.price;
  profile.cars.push(createOwned(car));
  profile.selected = id;
  return `${car.name} is in your garage.`;
}
export function buyPart(profile: Profile, owned: OwnedCar, id: string): string {
  const part = partById.get(id),
    car = carById.get(owned.id);
  if (!part || !car) return 'This part is unavailable.';
  if (part.minClass > car.class) return 'This part requires a higher car class.';
  const installedId = owned.parts[part.slot];
  if (installedId && !partById.has(installedId))
    return 'An unavailable part occupies this slot. Its ID is preserved for recovery.';
  const current = partById.get(installedId ?? '');
  if (current && current.level >= part.level) return 'This upgrade is already installed.';
  if (profile.cash < part.price) return 'Not enough credits. Jobs always pay.';
  profile.cash -= part.price;
  owned.parts[part.slot] = part.id;
  return `${part.name} installed.`;
}
