import { data, carById } from '../data/config';
import type { SaveEnvelope } from '../types';

/** Resolve retired fictional IDs without deleting a car or replacing existing customization. */
export function resolveCarAliases(save: SaveEnvelope): void {
  const ownedIds = new Set(save.payload.cars.map((car) => car.id));
  for (const car of save.payload.cars) {
    const replacement = data.carAliases?.[car.id];
    if (!replacement || !carById.has(replacement) || ownedIds.has(replacement)) continue;
    const previous = car.id;
    car.id = replacement;
    ownedIds.delete(previous);
    ownedIds.add(replacement);
    if (save.payload.selected === previous) save.payload.selected = replacement;
  }
}
