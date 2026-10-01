import type { CarDef, OwnedCar } from '../types';
import { CAR_BODY_ATLAS, CAR_PAINT_MASK_ATLAS, WHEEL_ATLAS, WHEEL_META } from './sprite-data';

const COLUMNS = 6;
const CAR_CELL_WIDTH = 80;
const CAR_CELL_HEIGHT = 30;
const WHEEL_CELL = 32;
const carAtlas = new Image();
const paintMaskAtlas = new Image();
const wheelAtlas = new Image();
let preloadPromise: Promise<void> | undefined;
const tintCache = new Map<string, HTMLCanvasElement>();
const liveryCache = new WeakMap<OwnedCar, { signature: string; canvas: HTMLCanvasElement }>();

function loadImage(image: HTMLImageElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to decode car sprite atlas.'));
    image.src = src;
    if (image.complete && image.naturalWidth) resolve();
  });
}

export function preloadCarSprites(): Promise<void> {
  if (!preloadPromise)
    preloadPromise = Promise.all([
      loadImage(carAtlas, CAR_BODY_ATLAS),
      loadImage(paintMaskAtlas, CAR_PAINT_MASK_ATLAS),
      loadImage(wheelAtlas, WHEEL_ATLAS),
    ]).then(() => undefined);
  return preloadPromise;
}

function cell(index: number, width: number, height: number): [number, number, number, number] {
  const zero = index - 1;
  return [(zero % COLUMNS) * width, Math.floor(zero / COLUMNS) * height, width, height];
}

function tintLayer(index: number, color: string, lower = false): HTMLCanvasElement {
  const key = `${index}:${color}:${lower ? 'lower' : 'body'}`;
  const cached = tintCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = CAR_CELL_WIDTH;
  canvas.height = CAR_CELL_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const [sx, sy, sw, sh] = cell(index, CAR_CELL_WIDTH, CAR_CELL_HEIGHT);
  ctx.drawImage(paintMaskAtlas, sx, sy, sw, sh, 0, 0, sw, sh);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  const lowerY = Math.round(CAR_CELL_HEIGHT * 0.64);
  ctx.fillRect(0, lower ? lowerY : 0, sw, lower ? sh - lowerY : sh);
  ctx.globalCompositeOperation = 'source-over';
  tintCache.set(key, canvas);
  if (tintCache.size > 96) tintCache.delete(tintCache.keys().next().value!);
  return canvas;
}

function liveryLayer(car: CarDef, owned: OwnedCar): HTMLCanvasElement | undefined {
  if (!owned.marks.length) return undefined;
  const points = owned.marks.reduce((sum, mark) => sum + mark.points.length, 0);
  const last = owned.marks.at(-1);
  const signature = `${owned.marks.length}:${points}:${last?.color ?? ''}:${last?.width ?? 0}`;
  const cached = liveryCache.get(owned);
  if (cached?.signature === signature) return cached.canvas;
  const canvas = document.createElement('canvas');
  canvas.width = CAR_CELL_WIDTH;
  canvas.height = CAR_CELL_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(CAR_CELL_WIDTH / 800, CAR_CELL_HEIGHT / 300);
  for (const mark of owned.marks) {
    ctx.strokeStyle = mark.color;
    ctx.lineWidth = mark.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    mark.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (mark.points.length === 1) ctx.lineTo(mark.points[0][0] + 0.1, mark.points[0][1]);
    ctx.stroke();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  const [sx, sy, sw, sh] = cell(car.spriteIndex, CAR_CELL_WIDTH, CAR_CELL_HEIGHT);
  ctx.drawImage(paintMaskAtlas, sx, sy, sw, sh, 0, 0, sw, sh);
  ctx.globalCompositeOperation = 'source-over';
  liveryCache.set(owned, { signature, canvas });
  return canvas;
}

function wheelSpriteIndex(car: CarDef, owned?: OwnedCar): number {
  if (owned?.wheels === 1) return 10;
  if (owned?.wheels === 2) return 30;
  return car.spriteIndex;
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  index: number,
  x: number,
  y: number,
  diameter: number,
  rotation: number,
): void {
  const [sx, sy, sw, sh] = cell(index, WHEEL_CELL, WHEEL_CELL);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(wheelAtlas, sx, sy, sw, sh, -diameter / 2, -diameter / 2, diameter, diameter);
  ctx.restore();
}

export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: CarDef,
  owned?: OwnedCar,
  rotation = 0,
  nitro = false,
): void {
  ctx.save();
  // Preserve the intentional pixel detail when the tiny source atlas is enlarged.
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#00000066';
  ctx.beginPath();
  ctx.ellipse(400, 258, 330, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  if (nitro) {
    ctx.fillStyle = '#c3b1ff';
    ctx.beginPath();
    ctx.moveTo(88, 226);
    ctx.lineTo(18, 242);
    ctx.lineTo(92, 252);
    ctx.fill();
    ctx.fillStyle = '#fff1cb';
    ctx.fillRect(58, 238, 38, 6);
  }

  const [leftWheelX, rightWheelX, wheelY, diameter] = WHEEL_META[car.spriteIndex - 1];
  const wheelIndex = wheelSpriteIndex(car, owned);
  drawWheel(ctx, wheelIndex, leftWheelX, wheelY, diameter, rotation);
  drawWheel(ctx, wheelIndex, rightWheelX, wheelY, diameter, rotation);

  const [sx, sy, sw, sh] = cell(car.spriteIndex, CAR_CELL_WIDTH, CAR_CELL_HEIGHT);
  ctx.drawImage(carAtlas, sx, sy, sw, sh, 0, 0, 800, 300);
  const paint = owned?.paint ?? car.color;
  ctx.globalAlpha = 0.72;
  ctx.drawImage(tintLayer(car.spriteIndex, paint), 0, 0, 800, 300);
  ctx.globalAlpha = 1;
  if (owned?.accent) {
    ctx.globalAlpha = 0.48;
    ctx.drawImage(tintLayer(car.spriteIndex, owned.accent, true), 0, 0, 800, 300);
    ctx.globalAlpha = 1;
  }
  const livery = owned ? liveryLayer(car, owned) : undefined;
  if (livery) ctx.drawImage(livery, 0, 0, 800, 300);
  ctx.restore();
}
