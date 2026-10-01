import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const group = process.argv[2] ?? 'expansion-clean';
const specs = JSON.parse(await readFile(`src/assets/cars/${group}-metadata.json`, 'utf8'));
let overrides = {};
try {
  overrides = JSON.parse(await readFile('src/assets/cars/geometry-overrides.json', 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const directory = `/tmp/redline-geometry-${group}`;
await mkdir(directory, { recursive: true });
const files = [];
for (const [id, original] of Object.entries(specs)) {
  const spec = original.renderStyle === 'cartoon-2d' ? original : { ...original, ...overrides[id] };
  const [x, y, w, h] = spec.bounds;
  const draw =
    `rectangle ${x},${y} ${x + w},${y + h} ` +
    spec.wheels
      .map(
        (wheel) =>
          `circle ${wheel.x},${wheel.y} ${wheel.x + wheel.radius},${wheel.y} line ${wheel.x - 15},${wheel.y} ${wheel.x + 15},${wheel.y} line ${wheel.x},${wheel.y - 15} ${wheel.x},${wheel.y + 15}`,
      )
      .join(' ');
  const output = `${directory}/${id}.png`;
  await exec('convert', [
    `src/assets/cars/${spec.file}`,
    '-stroke',
    '#00ff55',
    '-strokewidth',
    '3',
    '-fill',
    'none',
    '-draw',
    draw,
    '-background',
    '#20202a',
    '-alpha',
    'remove',
    '-resize',
    '720x360',
    '-gravity',
    'center',
    '-extent',
    '720x360',
    '-gravity',
    'south',
    '-background',
    '#20202a',
    '-splice',
    '0x30',
    '-stroke',
    'none',
    '-fill',
    'white',
    '-font',
    'DejaVu-Sans',
    '-pointsize',
    '14',
    '-annotate',
    '+0+8',
    id,
    output,
  ]);
  files.push(output);
}
await exec('montage', [...files, '-tile', '2x', '-geometry', '+0+0', `${directory}/sheet.png`]);
console.log(`${directory}/sheet.png`);
