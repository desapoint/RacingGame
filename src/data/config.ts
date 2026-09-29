import raw from './game-data.json';
import type { GameData } from '../types';

export const data = raw as GameData;
validateConfig(data);
export const carById = new Map(data.cars.map((car) => [car.id, car]));
export const partById = new Map(data.parts.map((part) => [part.id, part]));
export const rivalById = new Map(data.rivals.map((rival) => [rival.id, rival]));

export function validateConfig(config: GameData = data): void {
  const ensure = (condition: unknown, message: string) => {
    if (!condition) throw new Error(`Game data: ${message}`);
  };
  ensure(config && typeof config === 'object', 'configuration must be an object');
  for (const [name, items] of Object.entries({
    cars: config.cars,
    parts: config.parts,
    rivals: config.rivals,
    events: config.events,
    jobs: config.jobs,
    classes: config.classes,
  })) {
    ensure(Array.isArray(items) && items.length > 0, `${name} must be a non-empty array`);
    ensure(
      items.every((item) => item && typeof item.id === 'string' && item.id.length > 0),
      `missing ${name} ID`,
    );
    ensure(new Set(items.map((item) => item.id)).size === items.length, `duplicate ${name} ID`);
  }
  ensure(config.classes.length === 4, 'v1 requires four career divisions');
  ensure(config.events.length === 20, 'v1 requires twenty career events');
  ensure(
    config.idle && Array.isArray(config.idle) && config.idle.length > 0,
    'idle levels must be a non-empty array',
  );
  ensure(
    config.tuning?.launch && config.tuning?.drive,
    'launch and final-drive tuning ranges are required',
  );
  ensure(
    config.difficulties?.easy && config.difficulties?.normal && config.difficulties?.hard,
    'easy, normal, and hard difficulty profiles are required',
  );
  const cars = new Map(config.cars.map((car) => [car.id, car]));
  const rivals = new Set(config.rivals.map((rival) => rival.id));
  ensure(cars.has(config.starter) && cars.has(config.loaner), 'missing starter or loaner');
  ensure(config.distance > 0 && config.startCash >= 0, 'invalid race or economy values');
  config.cars.forEach((car) =>
    ensure(
      car.class >= 0 &&
        car.class < config.classes.length &&
        car.price >= 0 &&
        car.acceleration > 0 &&
        car.maxSpeed > 0 &&
        car.mass > 0 &&
        ['coupe', 'hatch', 'super', 'mazda3-sedan', 'forte-gt-sedan'].includes(car.art),
      `invalid car ${car.id}`,
    ),
  );
  config.parts.forEach((part) =>
    ensure(
      ['engine', 'transmission', 'tires', 'nitro', 'weight'].includes(part.slot) &&
        part.price >= 0 &&
        part.effect > 0 &&
        part.level >= 1 &&
        part.level <= 3 &&
        part.minClass >= 0 &&
        part.minClass < config.classes.length,
      `invalid part ${part.id}`,
    ),
  );
  config.rivals.forEach((rival) =>
    ensure(
      cars.has(rival.carId) &&
        rival.reaction >= 0 &&
        rival.shift > 0 &&
        rival.shift <= 1 &&
        rival.consistency >= 0 &&
        rival.tune > 0,
      `invalid rival ${rival.id}`,
    ),
  );
  config.events.forEach((event) =>
    ensure(
      event.division >= 0 &&
        event.division < config.classes.length &&
        event.rivals.length === 3 &&
        event.rivals.every((id) => rivals.has(id)) &&
        event.reward > 0 &&
        event.maxPartLevel >= 1,
      `invalid event ${event.id}`,
    ),
  );
  config.jobs.forEach((job) =>
    ensure(job.participation > 0 && job.bonus >= 0, `invalid job ${job.id}`),
  );
  config.idle.forEach((level) =>
    ensure(
      level.rate >= 0 &&
        level.price >= 0 &&
        level.capacity >= 0 &&
        level.capacity <= Math.min(...config.jobs.map((job) => job.participation)),
      'idle payout exceeds job participation',
    ),
  );
  for (const range of Object.values(config.tuning))
    ensure(
      range.min > 0 &&
        range.max > range.min &&
        range.default >= range.min &&
        range.default <= range.max,
      'invalid tuning range',
    );
  for (const difficulty of Object.values(config.difficulties))
    ensure(
      difficulty.performance > 0 && difficulty.reaction >= 0 && difficulty.mistakes >= 0,
      'invalid difficulty',
    );
}
