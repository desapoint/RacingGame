import type { CarDef, OwnedCar } from '../types';
import { sedanBodies, drawSedanDetails } from './sedans';

const bodies = {
  ...sedanBodies,
  hatch:
    'M78 183 L89 138 Q94 126 115 125 L203 121 L259 66 Q267 57 288 57 L440 60 Q467 64 493 100 L517 121 L645 139 Q677 145 688 170 L685 205 L620 213 Q617 157 568 157 Q520 157 516 213 L247 213 Q241 157 192 157 Q143 157 138 213 L86 207 Z',
  coupe:
    'M73 184 L89 145 L217 123 L301 72 Q315 64 337 64 L426 68 Q451 73 498 118 L639 137 Q682 145 699 179 L695 205 L624 213 Q618 157 570 157 Q522 157 517 213 L247 213 Q241 157 192 157 Q143 157 138 213 L82 206 Z',
  super:
    'M67 185 L103 151 L223 128 L320 78 Q340 69 362 69 L448 78 L517 126 L652 144 L706 179 L699 208 L624 213 Q618 157 570 157 Q522 157 517 213 L247 213 Q241 157 192 157 Q143 157 138 213 L77 207 Z',
};
const paths = new Map<string, Path2D>();
export function bodyPath(art: CarDef['art']): Path2D {
  let path = paths.get(art);
  if (!path) {
    path = new Path2D(bodies[art]);
    paths.set(art, path);
  }
  return path;
}
export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: CarDef,
  owned?: OwnedCar,
  rotation = 0,
  nitro = false,
): void {
  ctx.save();
  ctx.fillStyle = '#00000066';
  ctx.beginPath();
  ctx.ellipse(390, 231, 321, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  if (nitro) {
    ctx.fillStyle = '#c3b1ff';
    ctx.beginPath();
    ctx.moveTo(83, 190);
    ctx.lineTo(12, 202);
    ctx.lineTo(84, 211);
    ctx.fill();
    ctx.fillStyle = '#fff1cb';
    ctx.fillRect(54, 198, 35, 6);
  }
  const body = bodyPath(car.art);
  ctx.fillStyle = owned?.paint ?? car.color;
  ctx.fill(body);
  ctx.save();
  ctx.clip(body);
  const grad = ctx.createLinearGradient(0, 60, 0, 220);
  grad.addColorStop(0, '#ffffff42');
  grad.addColorStop(0.45, '#ffffff00');
  grad.addColorStop(1, '#00000060');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 300);
  ctx.fillStyle = owned?.accent ?? '#343345';
  ctx.fillRect(65, 194, 650, 24);
  ctx.strokeStyle = '#ffffff35';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(91, 143);
  ctx.lineTo(510, 135);
  ctx.lineTo(681, 160);
  ctx.stroke();
  for (const mark of owned?.marks ?? []) {
    ctx.strokeStyle = mark.color;
    ctx.lineWidth = mark.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    mark.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (mark.points.length === 1) ctx.lineTo(mark.points[0][0] + 0.1, mark.points[0][1]);
    ctx.stroke();
  }
  ctx.restore();
  if (car.art === 'mazda3-sedan' || car.art === 'forte-gt-sedan') {
    drawSedanDetails(ctx, car.art);
  } else {
    ctx.fillStyle = '#171c29';
    ctx.strokeStyle = '#080d18';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(car.art === 'hatch' ? 228 : 252, 121);
    ctx.lineTo(car.art === 'hatch' ? 278 : 321, 77);
    ctx.quadraticCurveTo(341, 72, 423, 81);
    ctx.lineTo(474, 119);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#b1d0e04d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(258, 114);
    ctx.lineTo(324, 82);
    ctx.lineTo(420, 86);
    ctx.stroke();
    ctx.strokeStyle = owned?.paint ?? car.color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(346, 76);
    ctx.lineTo(337, 123);
    ctx.stroke();
    ctx.strokeStyle = '#10101e60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(253, 131);
    ctx.lineTo(253, 194);
    ctx.lineTo(473, 194);
    ctx.lineTo(485, 133);
    ctx.stroke();
    ctx.fillStyle = '#20202b';
    ctx.fillRect(441, 141, 25, 5);
    ctx.fillRect(473, 112, 29, 10);
    ctx.fillStyle = '#ffe9b7';
    ctx.beginPath();
    ctx.moveTo(649, 148);
    ctx.lineTo(679, 157);
    ctx.lineTo(687, 171);
    ctx.lineTo(649, 164);
    ctx.fill();
    ctx.fillStyle = '#ff555f';
    ctx.fillRect(91, 143, 18, 19);
    ctx.fillStyle = '#101017';
    ctx.fillRect(655, 186, 33, 8);
  }
  for (const x of [192, 570]) {
    ctx.save();
    ctx.translate(x, 204);
    ctx.fillStyle = '#0a0b10';
    ctx.beginPath();
    ctx.arc(0, 0, 43, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#292c34';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 37, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#13151d';
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(rotation);
    ctx.strokeStyle = ['#bfc1ce', '#e7bd7d', '#393c48'][owned?.wheels ?? 0];
    ctx.lineWidth = owned?.wheels === 1 ? 5 : 7;
    const spokes = owned?.wheels === 1 ? 9 : 5;
    for (let i = 0; i < spokes; i++) {
      ctx.rotate((Math.PI * 2) / spokes);
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(26, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#858791';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
