// Original lightweight profiles in the same 800 × 300 space as the fictional cars.
// Geometry shares the existing wheel centers, body clipping, and livery coordinates.
export const sedanBodies = {
  'mazda3-sedan':
    'M77 184 L85 145 Q90 135 113 133 L183 128 Q219 94 260 70 Q282 57 317 59 L376 64 Q399 70 422 94 L455 123 Q535 123 625 138 Q665 142 692 161 L698 185 L690 207 L624 213 Q618 157 570 157 Q522 157 517 213 L247 213 Q241 157 192 157 Q143 157 138 213 L83 207 Z',
  'forte-gt-sedan':
    'M76 183 L84 144 L105 134 L193 128 L258 73 Q271 61 294 61 L403 64 Q421 66 438 88 L482 125 L633 137 L679 151 L700 175 L696 207 L624 213 Q618 157 570 157 Q522 157 517 213 L247 213 Q241 157 192 157 Q143 157 138 213 L82 207 Z',
};

export type SedanArt = keyof typeof sedanBodies;
const windows: Record<SedanArt, string> = {
  'mazda3-sedan': 'M209 126 Q239 94 274 77 Q299 68 321 71 L372 76 Q394 83 411 103 L434 125 Z',
  'forte-gt-sedan': 'M216 124 L271 80 Q282 74 301 74 L397 77 Q410 78 425 98 L451 124 Z',
};
const windowPaths = new Map<SedanArt, Path2D>();

export function drawSedanDetails(ctx: CanvasRenderingContext2D, art: SedanArt): void {
  const mazda = art === 'mazda3-sedan';
  let glass = windowPaths.get(art);
  if (!glass) {
    glass = new Path2D(windows[art]);
    windowPaths.set(art, glass);
  }
  ctx.fillStyle = '#151c29';
  ctx.fill(glass);
  ctx.strokeStyle = '#818996';
  ctx.lineWidth = 2;
  ctx.stroke(glass);
  // Rear quarter glass and a dark B-pillar emphasize the four-door cabin.
  ctx.strokeStyle = '#0c111b';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(337, 73);
  ctx.lineTo(330, 127);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(270, 77);
  ctx.lineTo(253, 125);
  ctx.stroke();
  ctx.strokeStyle = '#090c164d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(230, 131);
  ctx.lineTo(239, 154);
  ctx.moveTo(330, 129);
  ctx.lineTo(325, 196);
  ctx.moveTo(mazda ? 446 : 463, 131);
  ctx.lineTo(mazda ? 450 : 470, 195);
  ctx.lineTo(251, 195);
  ctx.stroke();
  ctx.fillStyle = '#22232d';
  ctx.fillRect(282, 141, 23, 4);
  ctx.fillRect(mazda ? 409 : 424, 141, 23, 4);
  ctx.fillRect(mazda ? 434 : 452, 119, 27, 9);
  // Slim Mazda lamps; more angular GT lamps, splitter and rear lip on the Kia.
  ctx.fillStyle = '#f6efdb';
  ctx.beginPath();
  ctx.moveTo(mazda ? 639 : 627, 144);
  ctx.lineTo(678, 154);
  ctx.lineTo(687, mazda ? 160 : 169);
  ctx.lineTo(mazda ? 653 : 641, mazda ? 157 : 164);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fc5265';
  ctx.fillRect(87, 144, mazda ? 35 : 44, 7);
  ctx.fillStyle = '#10131b';
  ctx.fillRect(671, 176, 23, 14);
  ctx.fillRect(650, 201, 41, 5);
  if (!mazda) {
    ctx.fillRect(88, 131, 75, 4);
    ctx.fillStyle = '#d54543';
    ctx.fillRect(665, 187, 22, 3);
    ctx.fillRect(101, 197, 25, 3);
  }
}
