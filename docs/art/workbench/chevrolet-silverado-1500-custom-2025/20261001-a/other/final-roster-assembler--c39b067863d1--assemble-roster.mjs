import { readFile, writeFile, access, readdir } from 'node:fs/promises';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const partial = process.argv.includes('--partial');
const plan = await read('src/data/expansion-plan.json');
const expanded = await read('src/data/expansion-models.json');
const config = await read('src/data/game-data.json');
const conditions = await read('src/data/condition-profiles.json');
const planned = new Set(plan.map((model) => model.id));
for (const item of plan) {
  const requestedConditions = item.conditions ?? Object.keys(conditions);
  if (
    !Array.isArray(requestedConditions) ||
    requestedConditions.length === 0 ||
    new Set(requestedConditions).size !== requestedConditions.length ||
    requestedConditions.some((condition) => !conditions[condition])
  )
    throw new Error(`Invalid requested conditions for ${item.id}`);
}
if (planned.size !== plan.length) throw new Error('Duplicate model in expansion plan');
if (new Set(expanded.map((model) => model.id)).size !== expanded.length)
  throw new Error('Duplicate expansion factory sheet');
let originals = [];
try {
  originals = await read('src/data/original-models.json');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const baseCars = config.cars.filter(
  (car) =>
    !planned.has(car.modelId ?? car.id) &&
    !plan.some((model) => car.id === `${model.id}-used` || car.id === `${model.id}-rusty`),
);
for (const car of baseCars) {
  if (!originals.some((model) => model.id === car.id))
    throw new Error(`Missing original factory sheet: ${car.id}`);
}
const metadata = {};
for (const file of (await readdir('src/assets/cars')).filter((name) =>
  name.endsWith('-metadata.json'),
)) {
  for (const [id, spec] of Object.entries(await read(`src/assets/cars/${file}`))) {
    if (metadata[id]) throw new Error(`Duplicate sprite metadata: ${id}`);
    metadata[id] = spec;
  }
}
const categories = {
  'honda-civic-si-2023': 'sedan',
  'volkswagen-golf-gti-2024': 'hatchback',
  'toyota-gr-corolla-2024': 'hatchback',
  'mazda3-turbo-sedan-2021': 'sedan',
  'kia-forte-gt-sedan-2022': 'sedan',
  'ford-mustang-boss302-1969': 'coupe',
  'bmw-m3-competition-2024': 'sedan',
  'audi-rs3-sedan-2024': 'sedan',
  'mercedes-amg-a45s-2024': 'hatchback',
};
for (const car of baseCars) {
  car.modelId = car.id;
  car.category = categories[car.id] ?? 'coupe';
  car.condition = 'standard';
  car.grip = 1;
  car.shiftTime = 0.28;
}
const models = [...originals];
const additions = [];
const missing = [];
for (const car of baseCars) {
  if (metadata[car.art]?.renderStyle !== 'cartoon-2d') missing.push(`${car.id}: 2D game sprite`);
  try {
    await access(`docs/art/realistic/${car.id}.png`);
  } catch {
    missing.push(`${car.id}: archived realistic reference`);
  }
}
for (const item of plan) {
  const model = expanded.find((record) => record.id === item.id);
  if (!model) {
    missing.push(`${item.id}: factory sheet`);
    continue;
  }
  try {
    await access(`docs/art/realistic/${item.id}.png`);
  } catch {
    missing.push(`${item.id}: archived realistic reference`);
  }
  if (model.category !== item.category) throw new Error(`Category mismatch for ${item.id}`);
  if (!model.sources?.length || !(model.powerHp > 0))
    throw new Error(`Factory power and sources required for ${item.id}`);
  // Weights absent from factory documentation are explicit game estimates, never factory claims.
  const estimatedMass = {
    suv: 1800,
    sedan: 1500,
    hatchback: 1350,
    wagon: 1750,
    minivan: 2050,
    pickup: 2200,
    coupe: 1550,
    convertible: 1200,
  }[model.category];
  const mass = model.curbWeightKg ?? estimatedMass;
  const ratio = (model.powerHp * 1000) / mass;
  const tier = ratio >= 320 ? 2 : ratio >= 175 ? 1 : 0;
  const acceleration = +(4.7 + Math.min(360, ratio) * 0.018).toFixed(2);
  const speed = +(43 + Math.min(360, ratio) * 0.11).toFixed(2);
  const price = Math.round((3000 + model.powerHp * 16 + Math.max(0, ratio - 160) * 75) / 100) * 100;
  let installed = false;
  for (const condition of item.conditions ?? Object.keys(conditions)) {
    const profile = conditions[condition];
    const id = condition === 'standard' ? model.id : `${model.id}-${condition}`;
    const spec = metadata[id];
    if (!spec) {
      missing.push(`${id}: sprite metadata`);
      continue;
    }
    if (spec.renderStyle !== 'cartoon-2d') {
      missing.push(`${id}: 2D game sprite`);
      // Superseded realistic wear studies may contain rejected bare panels.
      // Keep them in the archive, out of even an incremental playable build.
      continue;
    }
    try {
      await access(`src/assets/cars/${spec.file}`);
    } catch {
      missing.push(`${id}: sprite image`);
      continue;
    }
    installed = true;
    additions.push({
      id,
      modelId: model.id,
      name: model.name + (condition === 'standard' ? '' : ` · ${profile.label}`),
      tagline:
        condition === 'standard'
          ? model.segment
          : condition === 'used'
            ? 'Neglected care, visible wear, reduced performance.'
            : 'Heavy rust and damage. Cheap to buy, hard to race.',
      class: tier,
      price: Math.round((price * profile.price) / 100) * 100,
      power: Math.round(model.powerHp * profile.power),
      mass,
      acceleration: +(acceleration * profile.acceleration).toFixed(2),
      maxSpeed: +(speed * profile.speed).toFixed(2),
      grip: profile.grip,
      shiftTime: +(0.28 + profile.shiftPenalty).toFixed(2),
      art: id,
      color: spec.paintColor,
      year: model.year,
      era: model.year < 2000 ? 'classic' : 'modern',
      category: model.category,
      condition,
    });
  }
  if (installed) models.push(model);
}
const expectedEntries = plan.reduce(
  (sum, item) => sum + (item.conditions ?? Object.keys(conditions)).length,
  0,
);
if (!partial && (plan.length < 30 || missing.length || additions.length !== expectedEntries))
  throw new Error(`The expansion is incomplete:\n${missing.join('\n')}`);
config.cars = [...baseCars, ...additions];
config.models = models;
delete config.conditionProfiles;
await writeFile('src/data/game-data.json', `${JSON.stringify(config, null, 2)}\n`);
console.log(
  `${partial ? 'Preview' : 'Complete'} roster: ${baseCars.length} existing + ${additions.length} new entries; ${new Set(config.cars.map((car) => car.modelId)).size} models.`,
);
if (missing.length) console.log(`${missing.length} remaining inputs; preview only.`);
