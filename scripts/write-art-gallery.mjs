import { readFile, readdir, writeFile, access } from 'node:fs/promises';

const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
const metadata = {};
for (const file of (await readdir('src/assets/cars')).filter((name) =>
  name.endsWith('-metadata.json'),
)) {
  Object.assign(metadata, await read(`src/assets/cars/${file}`));
}
const originals = await read('src/data/original-models.json');
const expansion = await read('src/data/expansion-models.json');
const entries = [];
for (const model of [...originals, ...expansion]) {
  const reference = `docs/art/realistic/${model.id}.png`;
  const images = [(await exists(reference)) ? `realistic/${model.id}.png` : null];
  for (const suffix of ['', '-used', '-rusty']) {
    const spec = metadata[model.id + suffix];
    images.push(
      spec?.renderStyle === 'cartoon-2d' && (await exists(`src/assets/cars/${spec.file}`))
        ? `../../src/assets/cars/${spec.file}`
        : null,
    );
  }
  entries.push({
    name: model.name,
    category: model.category,
    images,
    expanded: expansion.includes(model),
  });
}
const data = JSON.stringify(entries).replaceAll('<', '\\u003c');
await writeFile(
  'docs/art/gallery.html',
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redline car art comparison</title>
<style>
:root{color-scheme:dark;font:16px system-ui,sans-serif;background:#171820;color:#f4f4f8}
body{max-width:1400px;margin:auto;padding:24px}h1{font-size:1.7rem;margin:0 0 12px}
p{color:#bdc0cc;line-height:1.5}a{color:#a4c9ff}nav{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:24px 0}
button,select{font:inherit;color:inherit;background:#292c38;border:1px solid #626779;border-radius:6px;padding:10px;max-width:100%}
select{flex:1;min-width:200px}button:disabled{opacity:.4}button:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #a4c9ff;outline-offset:3px}
main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}figure{margin:0;background:#242631;border:1px solid #434653;border-radius:8px;overflow:hidden}
figcaption{padding:14px;font-weight:650}.picture{height:260px;padding:12px;display:grid;place-items:center;background:#20212b}
img{display:block;max-width:100%;max-height:100%;object-fit:contain}figure a{display:flex;width:100%;height:100%;align-items:center;justify-content:center}
.pending{color:#adb2c3}#position{font-variant-numeric:tabular-nums}footer{margin-top:24px;font-size:.9rem}
@media(max-width:700px){body{padding:16px}main{grid-template-columns:1fr}.picture{height:200px}}
</style></head><body>
<h1>Car art comparison</h1>
<p>Realistic model references and the separate illustrated gameplay sprites. Painted panels remain on worn cars; rust and holes are localized. Pending images are still in production.</p>
<nav aria-label="Choose a car"><button id="previous" type="button">Previous</button><select id="model" aria-label="Car model"></select><button id="next" type="button">Next</button><span id="position" aria-live="polite"></span></nav>
<main id="images" aria-label="Selected car artwork"></main>
<footer><a href="roster.md">Publication index</a> · <a href="README.md">Art guidance</a><p>Open this page directly from the project folder. It loads at most four local PNGs at a time and uses no network requests or server. Click an image to view the source. This documentation page is separate from the compact game release.</p></footer>
<script>
const entries=${data};
const select=document.getElementById('model');
const previous=document.getElementById('previous');
const next=document.getElementById('next');
const labels=['Realistic reference','Standard 2D','Neglected 2D','Rusty 2D'];
entries.forEach((entry,index)=>{const option=document.createElement('option');option.value=index;option.textContent=entry.name;select.append(option)});
function render(){
  const index=Number(select.value),entry=entries[index];
  previous.disabled=index===0;next.disabled=index===entries.length-1;
  document.getElementById('position').textContent=(index+1)+' / '+entries.length;
  const container=document.getElementById('images');container.replaceChildren();
  entry.images.forEach((path,i)=>{
    const figure=document.createElement('figure'),caption=document.createElement('figcaption'),picture=document.createElement('div');
    caption.textContent=labels[i];picture.className='picture';
    if(path){const link=document.createElement('a'),image=document.createElement('img');link.href=path;image.src=path;image.alt=entry.name+' — '+labels[i];image.decoding='async';link.append(image);picture.append(link)}
    else{const text=document.createElement('span');text.className='pending';text.textContent=i>1&&!entry.expanded?'Not part of this batch':'Pending';picture.append(text)}
    figure.append(caption,picture);container.append(figure);
  });
}
select.addEventListener('change',render);
previous.addEventListener('click',()=>{select.value=Number(select.value)-1;render()});
next.addEventListener('click',()=>{select.value=Number(select.value)+1;render()});
render();
</script></body></html>\n`,
);
console.log(`Art comparison: ${entries.length} model pages, at most four local images per view.`);
