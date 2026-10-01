import { readFile, writeFile, readdir, mkdir, stat, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, basename } from 'node:path';

// Full-resolution generated PNGs remain the source of truth. Runtime WebPs are
// large enough for the game's 800x300 logical car space at high-DPI display
// densities while remaining materially smaller than the source PNGs.
const execute = promisify(execFile);
const directory = 'src/assets/cars';
const files = (await readdir(directory)).filter((name) => name.endsWith('-metadata.json')).sort();
const metadata = {};
for (const file of files) {
  const group = JSON.parse(await readFile(`${directory}/${file}`, 'utf8'));
  for (const [id, spec] of Object.entries(group)) {
    if (metadata[id]) throw new Error(`Duplicate sprite metadata: ${id}`);
    metadata[id] = spec;
  }
}
const config = JSON.parse(await readFile('src/data/game-data.json', 'utf8'));
const overrides = JSON.parse(await readFile(`${directory}/geometry-overrides.json`, 'utf8'));
for (const [id, correction] of Object.entries(overrides)) {
  if (!metadata[id]) throw new Error(`Geometry override has no sprite: ${id}`);
  if (metadata[id].renderStyle !== 'cartoon-2d') Object.assign(metadata[id], correction);
}

const optimized = `${directory}/optimized`;
const payloads = `${directory}/payloads`;
await rm(payloads, { recursive: true, force: true });
await mkdir(optimized, { recursive: true });
await mkdir(payloads, { recursive: true });

const images = [];
const entries = [];
let total = 0;

for (const car of config.cars) {
  const spec = metadata[car.art];
  if (!spec) throw new Error(`Missing artwork metadata for ${car.name} (${car.art})`);
  const input = resolve(directory, basename(spec.file));
  const output = `${optimized}/${car.art}.webp`;
  const width = spec.width;
  const height = spec.height;

  if (!(width > 0 && height > 0) || spec.bounds?.length !== 4 || spec.wheels?.length !== 2)
    throw new Error(`Invalid sprite dimensions for ${car.art}`);

  const [x, y, boxWidth, boxHeight] = spec.bounds;
  if (
    ![x, y, boxWidth, boxHeight].every(Number.isFinite) ||
    x < 0 ||
    y < 0 ||
    boxWidth <= 0 ||
    boxHeight <= 0 ||
    x + boxWidth > width ||
    y + boxHeight > height
  )
    throw new Error(`Bounds must be [x, y, width, height] inside the PNG: ${car.art}`);

  if (
    !spec.wheels.every(
      (wheel) =>
        Number.isFinite(wheel.x) &&
        Number.isFinite(wheel.y) &&
        wheel.radius > 0 &&
        wheel.x - wheel.radius >= 0 &&
        wheel.y - wheel.radius >= 0 &&
        wheel.x + wheel.radius <= width &&
        wheel.y + wheel.radius <= height,
    )
  )
    throw new Error(`Wheel discs must be inside the PNG: ${car.art}`);

  if (spec.facing !== undefined && !['left', 'right'].includes(spec.facing))
    throw new Error(`Invalid facing: ${car.art}`);

  // Garage cars can occupy roughly 770 CSS px and the renderer supports up to
  // 2x-3x backing density. 1536 px preserves real detail instead of upscaling
  // the former 256 px runtime assets.
  await execute('convert', [
    input,
    '-resize',
    '1536x768>',
    '-quality',
    '82',
    '-define',
    'webp:alpha-quality=100',
    output,
  ]);

  total += (await stat(output)).size;
  images.push(`data:image/webp;base64,${(await readFile(output)).toString('base64')}`);

  const body = JSON.stringify({
    width,
    height,
    bounds: spec.bounds,
    wheels: spec.wheels,
    paintColor: spec.paintColor,
    facing: spec.facing ?? 'right',
  });
  entries.push(`  ${JSON.stringify(car.art)}: { url: images[${images.length - 1}], ...${body} }`);
}

const chunkSize = 3;
const chunkCount = Math.ceil(images.length / chunkSize);
for (let index = 0; index < chunkCount; index++) {
  const chunk = images.slice(index * chunkSize, (index + 1) * chunkSize);
  await writeFile(
    `${payloads}/chunk-${index}.ts`,
    `// High-resolution runtime sprite payload generated from full-resolution source art.\nconst payload = ${JSON.stringify(chunk)};\nexport default payload;\n`,
  );
}

const imports = Array.from(
  { length: chunkCount },
  (_, index) => `import payload${index} from './payloads/chunk-${index}';`,
);
const spreads = Array.from({ length: chunkCount }, (_, index) => `...payload${index}`).join(', ');

await writeFile(
  `${directory}/catalog.ts`,
  `// Runtime catalog generated from full-resolution local art. High-resolution WebP sprites are embedded as data URLs; source/reference PNGs remain checked in separately.\nimport type { CarSpriteSpec } from '../../render/sprite-types';\n${imports.join('\n')}\nconst images = [${spreads}];\n\nexport const spriteCatalog: Record<string, CarSpriteSpec> = {\n${entries.join(',\n')}\n};\n`,
);

await rm(`${directory}/runtime`, { recursive: true, force: true });

console.log(
  `Prepared ${entries.length} embedded runtime sprites at up to 1536x768 / WebP q82: ${(
    total /
    1024 /
    1024
  ).toFixed(1)} MB combined WebP across ${chunkCount} payload chunks.`,
);
