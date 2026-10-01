import raw from './game-data.json';
import type { GameData } from '../types';

export const data = raw as GameData;
validateConfig(data);
export const carById = new Map(data.cars.map((car) => [car.id, car]));
export const modelById = new Map((data.models ?? []).map((model) => [model.id, model]));
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
  const categories = [
    'suv',
    'sedan',
    'hatchback',
    'wagon',
    'minivan',
    'pickup',
    'coupe',
    'convertible',
  ];
  const models = config.models ?? [];
  ensure(Array.isArray(models), 'models must be an array');
  ensure(
    models.every((model) => model && typeof model.id === 'string' && model.id.length > 0),
    'missing model ID',
  );
  ensure(new Set(models.map((model) => model.id)).size === models.length, 'duplicate model ID');
  for (const model of models) {
    ensure(model && typeof model.id === 'string' && model.id.length > 0, 'missing model ID');
    ensure(categories.includes(model.category), `invalid model category ${model.id}`);
    for (const field of [
      'name',
      'make',
      'model',
      'trim',
      'segment',
      'market',
      'engine',
      'transmission',
      'notes',
    ] as const)
      ensure(typeof model[field] === 'string', `missing ${field} for ${model.id}`);
    ensure(
      Number.isInteger(model.year) && model.year >= 1960 && model.year <= 2030,
      `invalid model year ${model.id}`,
    );
    ensure(
      ['petrol', 'diesel', 'mild hybrid', 'hybrid', 'plug-in hybrid', 'electric'].includes(
        model.fuel,
      ),
      `invalid fuel ${model.id}`,
    );
    ensure(
      ['FWD', 'RWD', 'AWD', '4WD'].includes(model.drivetrain),
      `invalid drivetrain ${model.id}`,
    );
    ensure(
      Number.isInteger(model.gears) && model.gears >= 0 && model.gears <= 10,
      `invalid gearbox ${model.id}`,
    );
    ensure(
      Number.isInteger(model.seats) &&
        model.seats >= 1 &&
        model.seats <= 9 &&
        Number.isInteger(model.doors) &&
        model.doors >= 2 &&
        model.doors <= 6,
      `invalid seating/doors ${model.id}`,
    );
    for (const field of ['powerHp', 'torqueNm', 'curbWeightKg'] as const)
      ensure(
        model[field] === null || (Number.isFinite(model[field]) && model[field]! > 0),
        `invalid factory ${field} for ${model.id}`,
      );
    ensure(
      Array.isArray(model.sources) &&
        model.sources.length > 0 &&
        model.sources.every(
          (source) => typeof source.label === 'string' && /^https?:\/\/[^\s]+$/.test(source.url),
        ),
      `missing specification sources for ${model.id}`,
    );
  }
  const modelIds = new Set(models.map((model) => model.id));
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
        (car.grip === undefined || (Number.isFinite(car.grip) && car.grip > 0 && car.grip <= 3)) &&
        (car.shiftTime === undefined ||
          (Number.isFinite(car.shiftTime) && car.shiftTime >= 0.2 && car.shiftTime <= 2)) &&
        (car.idleRpm === undefined || (Number.isFinite(car.idleRpm) && car.idleRpm >= 500 && car.idleRpm <= 1800)) &&
        (car.redlineRpm === undefined || (Number.isFinite(car.redlineRpm) && car.redlineRpm >= 3500 && car.redlineRpm <= 12000)) &&
        (car.revLimitRpm === undefined || (Number.isFinite(car.revLimitRpm) && car.revLimitRpm >= 3500 && car.revLimitRpm <= 12500)) &&
        (car.rpmRiseRate === undefined || (Number.isFinite(car.rpmRiseRate) && car.rpmRiseRate > 0 && car.rpmRiseRate <= 20000)) &&
        (car.rpmFallRate === undefined || (Number.isFinite(car.rpmFallRate) && car.rpmFallRate > 0 && car.rpmFallRate <= 20000)) &&
        (car.revLimiterType === undefined || ['soft-cut', 'hard-cut', 'vintage-bounce'].includes(car.revLimiterType)) &&
        (car.revLimiterCutSeconds === undefined || (Number.isFinite(car.revLimiterCutSeconds) && car.revLimiterCutSeconds >= 0 && car.revLimiterCutSeconds <= 1)) &&
        (car.revLimiterDropRpm === undefined || (Number.isFinite(car.revLimiterDropRpm) && car.revLimiterDropRpm >= 0 && car.revLimiterDropRpm <= 2500)) &&
        (car.category === undefined || categories.includes(car.category)) &&
        (car.condition === undefined || ['standard', 'used', 'rusty'].includes(car.condition)) &&
        (car.modelId === undefined || modelIds.has(car.modelId)) &&
        typeof car.color === 'string' &&
        /^#[0-9a-f]{6}$/i.test(car.color) &&
        typeof car.art === 'string' &&
        car.art.length > 0 &&
        Number.isInteger(car.year) &&
        car.year >= 1960 &&
        car.year <= 2030 &&
        ['modern', 'classic'].includes(car.era),
      `invalid car ${car.id}`,
    ),
  );
  for (const [previous, current] of Object.entries(config.carAliases ?? {})) {
    ensure(!cars.has(previous) && cars.has(current), `invalid retired-car mapping ${previous}`);
  }
  config.parts.forEach((part) =>
    ensure(
      ['engine', 'transmission', 'tires', 'nitro', 'weight', 'electronics'].includes(part.slot) &&
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
