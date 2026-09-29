import { data, partById, carById } from '../data/config';
import type { EventDef, OwnedCar, Profile } from '../types';

export function accrueIdle(profile: Profile, now = Date.now()): number {
  const idle = profile.idle;
  const level = data.idle[idle.level];
  const hours = Math.min(12, Math.max(0, now - idle.lastSeen) / 3_600_000);
  const previous = idle.bank;
  idle.bank = Math.min(level.capacity, idle.bank + hours * level.rate);
  // Retain the high-water timestamp when the system clock moves backwards.
  idle.lastSeen = Math.max(idle.lastSeen, now);
  return idle.bank - previous;
}
export function claimIdle(profile: Profile): number {
  accrueIdle(profile);
  const amount = Math.floor(profile.idle.bank);
  profile.idle.bank -= amount;
  profile.cash += amount;
  return amount;
}
export function eligible(event: EventDef, car: OwnedCar): string | null {
  if (carById.get(car.id)?.class !== event.division)
    return `Requires a ${data.classes[event.division].name} car.`;
  if (Object.values(car.parts).some((id) => (partById.get(id!)?.level ?? 0) > event.maxPartLevel))
    return `Parts limited to stage ${event.maxPartLevel}.`;
  return null;
}
export function careerReward(
  profile: Profile,
  event: EventDef,
  place: number,
  elapsed: number,
  speed: number,
): number {
  const index = data.events.findIndex((item) => item.id === event.id);
  if (index < 0 || index > profile.unlocked) return 0;
  const reward = Math.round(event.reward * [1, 0.75, 0.55, 0.2][place - 1]);
  profile.cash += reward;
  const previous = profile.results[event.id];
  if (
    !previous ||
    place < previous.place ||
    (place === previous.place && elapsed < previous.elapsed)
  )
    profile.results[event.id] = { place, elapsed, speed };
  if (place <= 3)
    profile.unlocked = Math.max(profile.unlocked, Math.min(data.events.length, index + 1));
  return reward;
}
