import { drawCar } from './car';
import { data } from '../data/config';
import type { Race } from '../game/race';
import type { CarDef, OwnedCar } from '../types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private background = document.createElement('canvas');
  width = 1100;
  height = 460;
  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
    this.buildBackground();
  }
  resize(): void {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = this.width * ratio;
    this.canvas.height = this.height * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  private buildBackground(): void {
    const c = this.background;
    c.width = this.width;
    c.height = this.height;
    const ctx = c.getContext('2d')!;
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#171922');
    sky.addColorStop(1, '#36303d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1100, 460);
    ctx.fillStyle = '#ddddc8';
    ctx.beginPath();
    ctx.arc(858, 76, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20202a';
    for (let i = 0; i < 22; i++) {
      const h = 35 + ((i * 47) % 92);
      ctx.fillRect(i * 58 - 12, 236 - h, 43, h);
    }
    ctx.fillStyle = '#171921';
    ctx.fillRect(0, 219, 1100, 50);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = i % 4 === 0 ? '#b8a1e657' : '#6f68752b';
      ctx.fillRect(i * 68 + 15, 230, 25, 5);
    }
    ctx.fillStyle = '#49434d';
    ctx.fillRect(0, 263, 1100, 5);
    ctx.fillStyle = '#1d1e26';
    ctx.fillRect(0, 268, 1100, 192);
    ctx.fillStyle = '#34343e';
    ctx.fillRect(0, 350, 1100, 2);
    ctx.fillRect(0, 445, 1100, 3);
    ctx.strokeStyle = '#bab0c018';
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 50, 268);
      ctx.lineTo(i * 50 - 90, 460);
      ctx.stroke();
    }
  }
  garage(car: CarDef, owned: OwnedCar, editing = false): void {
    const ctx = this.ctx;
    const bg = ctx.createLinearGradient(0, 0, 1100, 460);
    bg.addColorStop(0, '#24212f');
    bg.addColorStop(0.65, '#18191f');
    bg.addColorStop(1, '#202029');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1100, 460);
    ctx.strokeStyle = '#a798c313';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 270 + i * 22);
      ctx.lineTo(1100, 270 + i * 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(550, 230);
      ctx.lineTo(i * 130 - 150, 460);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff03';
    ctx.font = 'italic 900 205px Arial';
    ctx.fillText('REDLINE', 55, 262);
    ctx.strokeStyle = '#bfa3ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(71, 66);
    ctx.lineTo(238, 66);
    ctx.stroke();
    ctx.strokeStyle = '#bfa3ff20';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(71, 70);
    ctx.lineTo(238, 70);
    ctx.stroke();
    ctx.save();
    ctx.translate(112, 112);
    ctx.scale(1.1, 1.1);
    drawCar(ctx, car, owned);
    ctx.restore();
    ctx.fillStyle = '#96929f';
    ctx.font = '11px monospace';
    ctx.fillText(
      editing ? 'DRAW ON THE BODY · MARKS ARE CLIPPED TO THE PAINT' : '01 / PRIVATE GARAGE',
      40,
      427,
    );
    ctx.textAlign = 'right';
    ctx.fillText('EST. 2026    /    BUILT AFTER HOURS', 1060, 427);
    ctx.textAlign = 'left';
  }
  race(race: Race, reducedMotion: boolean): void {
    const ctx = this.ctx;
    ctx.drawImage(this.background, 0, 0);
    const scroll = reducedMotion ? 0 : race.player.distance * 7;
    ctx.fillStyle = '#aaa0b254';
    for (let i = -1; i < 15; i++) ctx.fillRect(i * 110 - (scroll % 110), 349, 58, 3);
    ctx.fillStyle = '#88718f';
    ctx.font = 'bold 10px monospace';
    for (let i = 0; i < 7; i++) {
      const x = i * 210 - (scroll % 210);
      ctx.fillRect(x, 267, 3, 12);
      ctx.fillText(
        `${Math.min(400, Math.floor(race.player.distance / 30) * 30 + i * 30)} m`,
        x + 6,
        280,
      );
    }
    const finishX = 490 + (data.distance - race.player.distance) * 7;
    if (finishX < 1200) {
      for (let row = 0; row < 12; row++)
        for (let col = 0; col < 3; col++) {
          ctx.fillStyle = (row + col) % 2 ? '#24242c' : '#d8d3dc';
          ctx.fillRect(finishX + col * 9, 269 + row * 15, 9, 15);
        }
    }
    const rival = race.racers[1];
    const rivalX = Math.max(
      -280,
      Math.min(1020, 159 + (rival.distance - race.player.distance) * 7),
    );
    ctx.save();
    ctx.translate(rivalX, 227);
    ctx.scale(0.48, 0.48);
    drawCar(
      ctx,
      rival.car,
      undefined,
      reducedMotion ? 0 : rival.distance * 2,
      rival.nitroActive && rival.nitroLeft > 0,
    );
    ctx.restore();
    ctx.save();
    ctx.translate(130, 310);
    ctx.scale(0.52, 0.52);
    drawCar(
      ctx,
      race.player.car,
      race.player.owned,
      reducedMotion ? 0 : race.player.distance * 2,
      race.player.nitroActive && race.player.nitroLeft > 0,
    );
    ctx.restore();
    ctx.fillStyle = '#beb8c9';
    ctx.font = '11px monospace';
    ctx.fillText(
      `${rival.name.toUpperCase()}  /  ${rival.car.name.toUpperCase()}`,
      Math.max(20, rivalX + 100),
      235,
    );
    ctx.fillStyle = '#cbb7ff';
    ctx.fillText('YOU', 228, 321);
    const startX = 352 - race.player.distance * 7;
    if (startX > -90 && startX < 1160) {
      ctx.fillStyle = '#e9e3d6aa';
      ctx.fillRect(startX, 269, 4, 191);
      ctx.fillStyle = '#e9e3d644';
      ctx.fillRect(startX - 8, 269, 20, 5);
    }
    if (race.time < 0.85 && startX > -90) {
      const treeX = startX + 54;
      const poleTop = 126;
      const poleBottom = 354;
      ctx.fillStyle = '#121416';
      ctx.fillRect(treeX - 7, poleTop, 14, poleBottom - poleTop);
      ctx.fillStyle = '#74716a';
      ctx.fillRect(treeX - 2, poleTop, 4, poleBottom - poleTop);
      ctx.fillStyle = '#8a8780';
      ctx.fillRect(treeX - 28, poleBottom - 4, 56, 7);
      ctx.fillRect(treeX - 18, poleBottom - 12, 36, 6);

      const lamp = (y: number, lit: boolean, color: string, radius = 10) => {
        ctx.fillStyle = '#090a0b';
        ctx.fillRect(treeX - 31, y - 14, 62, 28);
        for (const x of [treeX - 15, treeX + 15]) {
          ctx.fillStyle = lit ? color : '#2a2926';
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          if (lit) {
            ctx.strokeStyle = color + '55';
            ctx.lineWidth = 5;
            ctx.stroke();
          }
        }
      };
      lamp(145, true, '#efe7c1', 6);
      lamp(166, race.time > -3.25, '#efe7c1', 6);
      lamp(202, race.time > -3, '#f2aa32');
      lamp(232, race.time > -2, '#f2aa32');
      lamp(262, race.time > -1, '#f2aa32');
      lamp(299, race.time >= 0 && !race.falseStart, '#67cf6f');
      lamp(329, race.falseStart, '#e44f43');

      ctx.fillStyle = '#c8c2b6';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRE', treeX, 120);
      ctx.textAlign = 'left';
    }
    if (race.paused) {
      ctx.fillStyle = '#111217cf';
      ctx.fillRect(0, 0, 1100, 460);
      ctx.fillStyle = '#eeeaf5';
      ctx.font = 'bold 34px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('RACE PAUSED', 550, 220);
      ctx.font = '16px Arial';
      ctx.fillText('Press Esc or Resume when you’re ready', 550, 255);
      ctx.textAlign = 'left';
    }
  }
}
