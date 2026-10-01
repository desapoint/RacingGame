import type { CarDef, OwnedCar } from '../types';
import { spriteCatalog } from '../assets/cars/catalog';
import type { CarSpriteSpec, SpriteWheel } from './sprite-types';
import { findPaintPixels, recolorPixels } from './sprite-paint';

const WIDTH = 800,
  HEIGHT = 300,
  MIN_DETAIL_SCALE = 2,
  MAX_DETAIL_SCALE = 3;
interface Wheel extends SpriteWheel {
  image: HTMLCanvasElement;
  drawWidth: number;
  drawHeight: number;
}
interface PreparedCar {
  body: HTMLCanvasElement;
  pixels: ImageData;
  mask: Uint8Array;
  maskCanvas: HTMLCanvasElement;
  wheels: Wheel[];
  paintColor: string;
  left: number;
  right: number;
  bottom: number;
  pixelScale: number;
}
interface Appearance {
  paint: string;
  pixelScale: number;
  accent: string;
  painted: HTMLCanvasElement;
  composed: HTMLCanvasElement;
  marks: OwnedCar['marks'];
  count: number;
  points: number;
}
const prepared = new Map<string, PreparedCar>();
const MAX_PREPARED = 12;
let preparationQueue: Promise<void> = Promise.resolve();
type Cosmetics = Pick<OwnedCar, 'paint' | 'accent' | 'marks'>;
const appearances = new Map<Cosmetics, Appearance>();
const factoryPaint = new Map<string, Cosmetics>();

function canvas(width = WIDTH, height = HEIGHT, pixelScale = 1): HTMLCanvasElement {
  const result = document.createElement('canvas');
  result.width = Math.ceil(width * pixelScale);
  result.height = Math.ceil(height * pixelScale);
  return result;
}

async function prepare(spec: CarSpriteSpec, pixelScale: number): Promise<PreparedCar> {
  const image = new Image();
  image.src = spec.url;
  await image.decode();
  const [x, y, width, height] = spec.bounds;
  const fitScale = Math.min(700 / width, 235 / height);
  const left = (WIDTH - width * fitScale) / 2,
    top = 254 - height * fitScale;
  const body = canvas(WIDTH, HEIGHT, pixelScale),
    ctx = body.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.save();
  if (spec.facing === 'left') {
    ctx.translate(body.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    image,
    (x * image.naturalWidth) / spec.width,
    (y * image.naturalHeight) / spec.height,
    (width * image.naturalWidth) / spec.width,
    (height * image.naturalHeight) / spec.height,
    left * pixelScale,
    top * pixelScale,
    width * fitScale * pixelScale,
    height * fitScale * pixelScale,
  );
  ctx.restore();
  const wheels = spec.wheels.map((wheel) => {
    const radius = wheel.radius * fitScale;
    const sourceX = left + (wheel.x - x) * fitScale;
    const centerX = spec.facing === 'left' ? WIDTH - sourceX : sourceX,
      centerY = top + (wheel.y - y) * fitScale;
    const drawWidth = Math.ceil(radius * 2 + 4),
      drawHeight = drawWidth;
    const wheelImage = canvas(drawWidth, drawHeight, pixelScale);
    const context = wheelImage.getContext('2d')!;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.beginPath();
    context.arc(wheelImage.width / 2, wheelImage.height / 2, radius * pixelScale, 0, Math.PI * 2);
    context.clip();
    context.drawImage(
      body,
      (centerX - drawWidth / 2) * pixelScale,
      (centerY - drawHeight / 2) * pixelScale,
      drawWidth * pixelScale,
      drawHeight * pixelScale,
      0,
      0,
      wheelImage.width,
      wheelImage.height,
    );
    return { x: centerX, y: centerY, radius, image: wheelImage, drawWidth, drawHeight };
  });
  // Body and wheels become separate parts once at load, preserving the generated stock rims.
  ctx.globalCompositeOperation = 'destination-out';
  for (const wheel of wheels) {
    ctx.beginPath();
    ctx.arc(
      wheel.x * pixelScale,
      wheel.y * pixelScale,
      wheel.radius * 0.99 * pixelScale,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  const pixels = ctx.getImageData(0, 0, body.width, body.height);
  const mask = findPaintPixels(pixels, spec.paintColor);
  const maskCanvas = canvas(WIDTH, HEIGHT, pixelScale),
    maskContext = maskCanvas.getContext('2d')!;
  const maskPixels = maskContext.createImageData(maskCanvas.width, maskCanvas.height);
  for (let index = 0; index < mask.length; index++) {
    const offset = index * 4;
    maskPixels.data[offset] = maskPixels.data[offset + 1] = maskPixels.data[offset + 2] = 255;
    maskPixels.data[offset + 3] = mask[index];
  }
  maskContext.putImageData(maskPixels, 0, 0);
  // The decoder image is no longer retained once preparation returns.
  return {
    body,
    pixels,
    mask,
    maskCanvas,
    wheels,
    paintColor: spec.paintColor,
    left,
    right: left + width * fitScale,
    bottom: 254,
    pixelScale,
  };
}

export async function prepareCarSprites(
  cars: CarDef[],
  progress?: (done: number, total: number) => void,
  current: () => boolean = () => true,
): Promise<void> {
  const work = async () => {
    // Detail views track display density up to 3x. Dealer grids use a lower
    // density because each 800x300 logical car is displayed substantially smaller.
    const deviceScale = Math.max(1, window.devicePixelRatio || 1);
    const pixelScale =
      cars.length <= 2
        ? Math.min(MAX_DETAIL_SCALE, Math.max(MIN_DETAIL_SCALE, deviceScale))
        : Math.min(1.5, Math.max(1, deviceScale / 2));
    for (const [index, car] of cars.entries()) {
      if (!current()) return;
      const spec = spriteCatalog[car.art];
      if (!spec)
        throw new Error(`No sprite installed for ${car.name}. Check its art ID in config.js.`);
      const cached = prepared.get(car.art);
      const sprite =
        cached && cached.pixelScale >= pixelScale ? cached : await prepare(spec, pixelScale);
      prepared.delete(car.art);
      prepared.set(car.art, sprite);
      while (prepared.size > MAX_PREPARED) prepared.delete(prepared.keys().next().value!);
      progress?.(index + 1, cars.length);
    }
  };
  preparationQueue = preparationQueue.then(work, work);
  return preparationQueue;
}

function appearance(owned: Cosmetics, sprite: PreparedCar): HTMLCanvasElement {
  let result = appearances.get(owned);
  if (!result || result.pixelScale !== sprite.pixelScale) {
    result = {
      paint: '',
      pixelScale: sprite.pixelScale,
      accent: '',
      painted: canvas(WIDTH, HEIGHT, sprite.pixelScale),
      composed: canvas(WIDTH, HEIGHT, sprite.pixelScale),
      marks: owned.marks,
      count: -1,
      points: -1,
    };
    appearances.set(owned, result);
    while (appearances.size > 8) appearances.delete(appearances.keys().next().value!);
  }
  const recolor = result.paint !== owned.paint || result.accent !== owned.accent;
  if (recolor) {
    const ctx = result.painted.getContext('2d')!;
    ctx.clearRect(0, 0, result.painted.width, result.painted.height);
    if (owned.paint.toLowerCase() === sprite.paintColor.toLowerCase())
      ctx.drawImage(sprite.body, 0, 0);
    else
      ctx.putImageData(
        recolorPixels(sprite.pixels, sprite.mask, owned.paint, sprite.paintColor),
        0,
        0,
      );
    // A second color affects only the painted lower sill, preserving glass and fixed trim.
    if (owned.accent !== '#343345') {
      const trim = recolorPixels(sprite.pixels, sprite.mask, owned.accent, sprite.paintColor);
      ctx.putImageData(
        trim,
        0,
        0,
        0,
        Math.round((sprite.bottom - 36) * sprite.pixelScale),
        result.painted.width,
        Math.max(1, Math.round(9 * sprite.pixelScale)),
      );
    }
    result.paint = owned.paint;
    result.accent = owned.accent;
  }
  const points = owned.marks.at(-1)?.points.length ?? 0;
  if (
    recolor ||
    result.marks !== owned.marks ||
    result.count !== owned.marks.length ||
    result.points !== points
  ) {
    const ctx = result.composed.getContext('2d')!;
    ctx.clearRect(0, 0, result.composed.width, result.composed.height);
    // Livery points are stored in the 800x300 logical coordinate space. Scale the
    // drawing context so their backing pixels retain the same high-DPI density.
    ctx.save();
    ctx.scale(sprite.pixelScale, sprite.pixelScale);
    for (const mark of owned.marks) {
      ctx.strokeStyle = mark.color;
      ctx.lineWidth = mark.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      mark.points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (mark.points.length === 1) ctx.lineTo(mark.points[0][0] + 0.1, mark.points[0][1]);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(sprite.maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(result.painted, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    result.marks = owned.marks;
    result.count = owned.marks.length;
    result.points = points;
  }
  return result.composed;
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  wheel: Wheel,
  rotation: number,
  style: number,
): void {
  ctx.save();
  ctx.translate(wheel.x, wheel.y);
  ctx.rotate(rotation);
  ctx.drawImage(
    wheel.image,
    -wheel.drawWidth / 2,
    -wheel.drawHeight / 2,
    wheel.drawWidth,
    wheel.drawHeight,
  );
  if (style === 1) {
    const rim = wheel.radius * 0.66;
    ctx.fillStyle = '#15171a';
    ctx.beginPath();
    ctx.arc(0, 0, rim, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c4a069';
    ctx.lineWidth = Math.max(2, wheel.radius * 0.07);
    for (let spoke = 0; spoke < 10; spoke++) {
      ctx.rotate(Math.PI / 5);
      ctx.beginPath();
      ctx.moveTo(rim * 0.13, 0);
      ctx.lineTo(rim * 0.94, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#ad8c55';
    ctx.beginPath();
    ctx.arc(0, 0, rim * 0.15, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 2) {
    ctx.fillStyle = '#080a0e88';
    ctx.beginPath();
    ctx.arc(0, 0, wheel.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: CarDef,
  owned?: OwnedCar,
  rotation = 0,
  nitro = false,
): void {
  const sprite = prepared.get(car.art);
  if (!sprite) return;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#00000050';
  ctx.beginPath();
  ctx.ellipse(
    (sprite.left + sprite.right) / 2,
    sprite.bottom + 2,
    (sprite.right - sprite.left) * 0.46,
    7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (nitro) {
    ctx.fillStyle = '#c3b1ff';
    ctx.beginPath();
    ctx.moveTo(sprite.left + 10, sprite.bottom - 27);
    ctx.lineTo(sprite.left - 55, sprite.bottom - 20);
    ctx.lineTo(sprite.left + 10, sprite.bottom - 12);
    ctx.fill();
  }
  for (const wheel of sprite.wheels) drawWheel(ctx, wheel, rotation, owned?.wheels ?? 0);
  let cosmetics: Cosmetics | undefined = owned;
  if (!cosmetics && car.color.toLowerCase() !== sprite.paintColor.toLowerCase()) {
    cosmetics = factoryPaint.get(car.id);
    if (!cosmetics || cosmetics.paint !== car.color) {
      cosmetics = { paint: car.color, accent: '#343345', marks: [] };
      factoryPaint.set(car.id, cosmetics);
    }
  }
  ctx.drawImage(cosmetics ? appearance(cosmetics, sprite) : sprite.body, 0, 0, WIDTH, HEIGHT);
  ctx.restore();
}


/** Draw a dealership/list preview with a backing store matched to its CSS size and DPR. */
export function drawCarPreview(canvas: HTMLCanvasElement, car: CarDef): void {
  const bounds = canvas.getBoundingClientRect();
  const displayWidth = bounds.width || WIDTH;
  const displayHeight = bounds.height || displayWidth * (HEIGHT / WIDTH);
  const deviceScale = Math.max(1, window.devicePixelRatio || 1);
  const backingWidth = Math.max(1, Math.round(displayWidth * deviceScale));
  const backingHeight = Math.max(1, Math.round(displayHeight * deviceScale));
  if (canvas.width !== backingWidth) canvas.width = backingWidth;
  if (canvas.height !== backingHeight) canvas.height = backingHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(backingWidth / WIDTH, 0, 0, backingHeight / HEIGHT, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawCar(ctx, car);
}
