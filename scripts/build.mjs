import { build } from 'esbuild';
import { mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
const [javascript, css] = await Promise.all([
  build({
    entryPoints: ['src/main.ts'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    minify: true,
    write: false,
    metafile: true,
    plugins: [
      {
        name: 'editable-release-config',
        setup(builder) {
          builder.onLoad({ filter: /[/\\]game-data\.json$/ }, () => ({
            contents: 'export default globalThis.REDLINE_CONFIG;',
            loader: 'js',
          }));
        },
      },
    ],
  }),
  build({ entryPoints: ['src/styles.css'], minify: true, write: false, metafile: true }),
]);
for (const result of [javascript, css]) {
  for (const output of Object.values(result.metafile.outputs)) {
    if (output.imports.length)
      throw new Error('Offline release must not contain external imports.');
  }
}
const template = await readFile('index.html', 'utf8');
const bootstrap = /<!-- REDLINE_BOOTSTRAP_START -->[\s\S]*?<!-- REDLINE_BOOTSTRAP_END -->/;
if (!bootstrap.test(template)) throw new Error('Missing HTML bootstrap markers.');
const script = javascript.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const styles = css.outputFiles[0].text.replace(/<\/style/gi, '<\\/style');
const config = JSON.parse(await readFile('src/data/game-data.json', 'utf8'));
await writeFile(
  'dist/config.js',
  '// Editable game configuration. Keep this file beside index.html.\n' +
    '// Edit the JSON object below, then reload the game. No rebuild is needed.\n' +
    '// A new npm run build replaces this file from src/data/game-data.json.\n' +
    `globalThis.REDLINE_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
);
const launch = `<script src="./config.js"></script>
<script>
try {
  if (!globalThis.REDLINE_CONFIG) throw new Error('Missing or unreadable config.js. Keep it beside index.html and check its syntax.');
  ${script}
} catch (error) {
  document.getElementById('app').textContent = 'Unable to start Redline: ' + (error instanceof Error ? error.message : 'Invalid configuration.');
}
</script>`;
// Replacement callbacks preserve literal dollar signs in the bundled source.
const html = template
  .replace('</head>', () => `<style>${styles}</style>\n  </head>`)
  .replace(bootstrap, () => launch);
await writeFile('dist/index.html', html);
// Remove only the obsolete assets produced by our previous release format.
await Promise.all(['game.js', 'styles.css'].map((name) => rm(`dist/${name}`, { force: true })));
for (const name of ['index.html', 'config.js'])
  console.log(
    `Offline release: dist/${name} (${((await stat(`dist/${name}`)).size / 1024).toFixed(1)} KB)`,
  );
