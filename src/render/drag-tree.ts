type TreeState = {
  time: number;
  falseStart: boolean;
};

const lampRows = [
  { y: 20, radius: 6, color: '#f3e7b3', kind: 'pre' as const },
  { y: 42, radius: 6, color: '#f3e7b3', kind: 'stage' as const },
  { y: 82, radius: 10, color: '#f0a51f', kind: 'amber1' as const },
  { y: 113, radius: 10, color: '#f0a51f', kind: 'amber2' as const },
  { y: 144, radius: 10, color: '#f0a51f', kind: 'amber3' as const },
  { y: 184, radius: 10, color: '#45d864', kind: 'green' as const },
  { y: 215, radius: 10, color: '#e7463d', kind: 'red' as const },
];

function isLit(kind: (typeof lampRows)[number]['kind'], state: TreeState): boolean {
  switch (kind) {
    case 'pre':
      return true;
    case 'stage':
      return state.time > -3.25;
    case 'amber1':
      return state.time > -3;
    case 'amber2':
      return state.time > -2;
    case 'amber3':
      return state.time > -1;
    case 'green':
      return state.time >= 0 && !state.falseStart;
    case 'red':
      return state.falseStart;
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawLamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  lit: boolean,
): void {
  ctx.save();

  // Deep visor/hood, similar to the real tree hardware.
  const hood = ctx.createLinearGradient(x, y - radius - 7, x, y + radius + 7);
  hood.addColorStop(0, '#050606');
  hood.addColorStop(0.52, '#181a18');
  hood.addColorStop(1, '#050606');
  ctx.fillStyle = hood;
  roundedRect(ctx, x - radius - 7, y - radius - 8, radius * 2 + 14, radius * 2 + 16, 5);
  ctx.fill();

  ctx.fillStyle = '#030403';
  ctx.beginPath();
  ctx.ellipse(x, y - radius - 4, radius + 5, radius * 0.58, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Metal bezel.
  const bezel = ctx.createRadialGradient(
    x - radius * 0.35,
    y - radius * 0.45,
    1,
    x,
    y,
    radius + 4,
  );
  bezel.addColorStop(0, '#d3d0c7');
  bezel.addColorStop(0.28, '#777970');
  bezel.addColorStop(0.62, '#272a26');
  bezel.addColorStop(1, '#090a09');
  ctx.fillStyle = bezel;
  ctx.beginPath();
  ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
  ctx.fill();

  const darkLens = color === '#45d864' ? '#10391a' : color === '#e7463d' ? '#411515' : '#493815';
  if (lit) {
    ctx.shadowColor = color;
    ctx.shadowBlur = radius * 1.45;
    const lens = ctx.createRadialGradient(
      x - radius * 0.28,
      y - radius * 0.32,
      1,
      x,
      y,
      radius,
    );
    lens.addColorStop(0, '#fffde7');
    lens.addColorStop(0.2, color);
    lens.addColorStop(0.72, color);
    lens.addColorStop(1, darkLens);
    ctx.fillStyle = lens;
  } else {
    const lens = ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.35,
      1,
      x,
      y,
      radius,
    );
    lens.addColorStop(0, '#56564d');
    lens.addColorStop(0.25, darkLens);
    lens.addColorStop(1, '#080908');
    ctx.fillStyle = lens;
  }
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = lit ? '#ffffff88' : '#ffffff18';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x - radius * 0.28, y - radius * 0.3, Math.max(1.5, radius * 0.24), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawDragTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  state: TreeState,
): void {
  ctx.save();
  ctx.translate(x, top);

  // Ground shadow and weighted base.
  ctx.fillStyle = '#00000066';
  ctx.beginPath();
  ctx.ellipse(0, 238, 44, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  const foot = ctx.createLinearGradient(-34, 0, 34, 0);
  foot.addColorStop(0, '#1b1d1a');
  foot.addColorStop(0.45, '#777a71');
  foot.addColorStop(0.55, '#b0b1a9');
  foot.addColorStop(1, '#1b1d1a');
  ctx.fillStyle = foot;
  roundedRect(ctx, -34, 224, 68, 8, 2);
  ctx.fill();
  roundedRect(ctx, -22, 216, 44, 7, 2);
  ctx.fill();

  // Chrome mast with a darker back edge.
  const mast = ctx.createLinearGradient(-7, 0, 7, 0);
  mast.addColorStop(0, '#171917');
  mast.addColorStop(0.25, '#555951');
  mast.addColorStop(0.48, '#c5c5bc');
  mast.addColorStop(0.62, '#74776e');
  mast.addColorStop(1, '#181a18');
  ctx.fillStyle = mast;
  roundedRect(ctx, -7, 0, 14, 222, 3);
  ctx.fill();
  ctx.fillStyle = '#080908';
  ctx.fillRect(5, 5, 3, 209);

  // Top placard and small cable box make the pole read as real hardware rather than UI circles.
  const plate = ctx.createLinearGradient(0, -8, 0, 14);
  plate.addColorStop(0, '#343733');
  plate.addColorStop(1, '#0b0c0b');
  ctx.fillStyle = plate;
  roundedRect(ctx, -27, -11, 54, 18, 3);
  ctx.fill();
  ctx.strokeStyle = '#8c8d842f';
  ctx.stroke();
  ctx.fillStyle = '#d4cec0';
  ctx.font = '700 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('STAGE', 0, 1);

  ctx.fillStyle = '#111310';
  roundedRect(ctx, 8, 53, 12, 84, 2);
  ctx.fill();
  ctx.strokeStyle = '#66685f55';
  ctx.stroke();

  for (const row of lampRows) {
    const lit = isLit(row.kind, state);
    const bracketY = row.y;
    const bracket = ctx.createLinearGradient(-33, bracketY, 33, bracketY);
    bracket.addColorStop(0, '#222420');
    bracket.addColorStop(0.5, '#767970');
    bracket.addColorStop(1, '#222420');
    ctx.fillStyle = bracket;
    roundedRect(ctx, -34, bracketY - 3, 68, 6, 2);
    ctx.fill();

    drawLamp(ctx, -16, bracketY, row.radius, row.color, lit);
    drawLamp(ctx, 16, bracketY, row.radius, row.color, lit);
  }

  // Tiny fasteners/wiring details keep the silhouette legible at high DPI.
  ctx.fillStyle = '#c4c2b777';
  for (const y of [18, 40, 80, 111, 142, 182, 213]) {
    ctx.beginPath();
    ctx.arc(0, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
