import type { CarDef, OwnedCar } from '../types';
import { spriteCatalog } from '../assets/cars/catalog';
import type { CarSpriteSpec, SpriteWheel } from './sprite-types';
import { findPaintPixels, recolorPixels } from './sprite-paint';

const WIDTH = 800,
  HEIGHT = 300;
interface Wheel extends SpriteWheel {
  image: HTMLCanvasElement;
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
}
interface Appearance {
  paint: string;
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

function canvas(width = WIDTH, height = HEIGHT): HTMLCanvasElement {
  const result = document.createElement('canvas');
  result.width = width;
  result.height = height;
  return result;
}

async function prepare(spec: CarSpriteSpec): Promise<PreparedCar> {
  const image = new Image();
  image.src = spec.url;
  await image.decode();
  const [x, y, width, height] = spec.bounds;
  const scale = Math.min(700 / width, 235 / height);
  const left = (WIDTH - width * scale) / 2,
    top = 254 - height * scale;
  const body = canvas(),
    ctx = body.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.save();
  if (spec.facing === 'left') {
    ctx.translate(WIDTH, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    image,
    (x * image.naturalWidth) / spec.width,
    (y * image.naturalHeight) / spec.height,
    (width * image.naturalWidth) / spec.width,
    (height * image.naturalHeight) / spec.height,
    left,
    top,
    width * scale,
    height * scale,
  );
  ctx.restore();
  const wheels = spec.wheels.map((wheel) => {
    const radius = wheel.radius * scale;
    const sourceX = left + (wheel.x - x) * scale;
    const centerX = spec.facing === 'left' ? WIDTH - sourceX : sourceX,
      centerY = top + (wheel.y - y) * scale;
    const image = canvas(Math.ceil(radius * 2 + 4), Math.ceil(radius * 2 + 4));
    const context = image.getContext('2d')!;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.beginPath();
    context.arc(image.width / 2, image.height / 2, radius, 0, Math.PI * 2);
    context.clip();
    context.drawImage(
      body,
      centerX - image.width / 2,
      centerY - image.height / 2,
      image.width,
      image.height,
      0,
      0,
      image.width,
      image.height,
    );
    return { x: centerX, y: centerY, radius, image };
  });
  // Body and wheels become separate parts once at load, preserving the generated stock rims.
  ctx.globalCompositeOperation = 'destination-out';
  for (const wheel of wheels) {
    ctx.beginPath();
    ctx.arc(wheel.x, wheel.y, wheel.radius * 0.99, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  const pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const mask = findPaintPixels(pixels, spec.paintColor);
  const maskCanvas = canvas(),
    maskContext = maskCanvas.getContext('2d')!;
  const maskPixels = maskContext.createImageData(WIDTH, HEIGHT);
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
    right: left + width * scale,
    bottom: 254,
  };
}

export async function prepareCarSprites(
  cars: CarDef[],
  progress?: (done: number, total: number) => void,
  current: () => boolean = () => true,
): Promise<void> {
  const work = async () => {
    for (const [index, car] of cars.entries()) {
      if (!current()) return;
      const spec = spriteCatalog[car.art];
      if (!spec)
        throw new Error(`No sprite installed for ${car.name}. Check its art ID in config.js.`);
      const sprite = prepared.get(car.art) ?? (await prepare(spec));
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
  const recolor = !result || result.paint !== owned.paint || result.accent !== owned.accent;
  if (!result) {
    result = {
      paint: '',
      accent: '',
      painted: canvas(),
      composed: canvas(),
      marks: owned.marks,
      count: -1,
      points: -1,
    };
    appearances.set(owned, result);
    while (appearances.size > 8) appearances.delete(appearances.keys().next().value!);
  }
  if (recolor) {
    const ctx = result.painted.getContext('2d')!;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
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
      ctx.putImageData(trim, 0, 0, 0, Math.round(sprite.bottom - 36), WIDTH, 9);
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
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Draw all livery ink first, then mask it to body paint, excluding glass, lights and wheels.
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
  ctx.drawImage(wheel.image, -wheel.image.width / 2, -wheel.image.height / 2);
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
  ctx.drawImage(cosmetics ? appearance(cosmetics, sprite) : sprite.body, 0, 0);
  ctx.restore();
}
