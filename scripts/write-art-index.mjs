import { readFile, writeFile, readdir, access } from 'node:fs/promises';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
const originals = await read('src/data/original-models.json');
const plan = await read('src/data/expansion-plan.json');
const metadata = {};
for (const file of (await readdir('src/assets/cars')).filter((name) =>
  name.endsWith('-metadata.json'),
))
  Object.assign(metadata, await read(`src/assets/cars/${file}`));
let references = 0,
  illustrated = 0;
const rows = [];
for (const model of [...originals, ...plan]) {
  const path = `docs/art/realistic/${model.id}.png`;
  const archived = await exists(path);
  if (archived) references++;
  const provenance = await exists(`docs/art/realistic/${model.id}.json`);
  const cells = [
    model.name,
    archived
      ? `[PNG](realistic/${model.id}.png)${provenance ? ` · [sources](realistic/${model.id}.json)` : ''}`
      : 'Pending',
  ];
  const expanded = plan.some((item) => item.id === model.id);
  for (const suffix of ['', '-used', '-rusty']) {
    if (suffix && !expanded) {
      cells.push('—');
      continue;
    }
    const sprite = metadata[model.id + suffix];
    if (sprite?.renderStyle === 'cartoon-2d' && (await exists(`src/assets/cars/${sprite.file}`))) {
      cells.push(`[PNG](../../src/assets/cars/${sprite.file})`);
      illustrated++;
    } else cells.push('Pending');
  }
  rows.push(`| ${cells.join(' | ')} |`);
}
const target = originals.length + plan.length * 3;
await writeFile(
  'docs/art/roster.md',
  `# Car art index\n\n${references}/${originals.length + plan.length} realistic model references archived; ${illustrated}/${target} illustrated game sprites published. ${illustrated === target ? 'All planned illustrations are present.' : 'Production is in progress; pending cells are unfinished.'}\n\nGenerated from current files by \`node scripts/write-art-index.mjs\`. This index records asset publication, not final visual review or release verification. See [art guidance](README.md) and [specification/condition notes](../roster-expansion.md).\n\n| Model | Realistic reference | Standard 2D | Neglected 2D | Rusty 2D |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`,
);
console.log(
  `Art index: ${references} realistic references, ${illustrated}/${target} illustrated sprites.`,
);
