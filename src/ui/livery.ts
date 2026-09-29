import type { OwnedCar } from '../types';
export class LiveryEditor {
  private drawing = false;
  color = '#f4efdd';
  private down = (event: PointerEvent) => {
    if (this.owned.marks.length >= 80) return;
    const point = this.point(event);
    if (!point) return;
    this.canvas.setPointerCapture(event.pointerId);
    this.drawing = true;
    this.owned.marks.push({ color: this.color, width: 6, points: [point] });
    this.render();
  };
  private move = (event: PointerEvent) => {
    if (!this.drawing) return;
    const point = this.point(event),
      mark = this.owned.marks.at(-1)!;
    if (point && mark.points.length < 500) {
      const previous = mark.points.at(-1)!;
      if (Math.hypot(point[0] - previous[0], point[1] - previous[1]) > 2) {
        mark.points.push(point);
        this.render();
      }
    }
  };
  private up = () => {
    if (this.drawing) {
      this.drawing = false;
      this.save();
    }
  };
  private point(event: PointerEvent): [number, number] | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * 1100) / rect.width,
      y = ((event.clientY - rect.top) * 460) / rect.height;
    const px = (x - 112) / 1.1,
      py = (y - 112) / 1.1;
    return px >= 0 && px <= 800 && py >= 0 && py <= 300 ? [Math.round(px), Math.round(py)] : null;
  }
  constructor(
    private canvas: HTMLCanvasElement,
    private owned: OwnedCar,
    private render: () => void,
    private save: () => void,
  ) {
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'crosshair';
    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerup', this.up);
    canvas.addEventListener('pointercancel', this.up);
  }
  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.down);
    this.canvas.removeEventListener('pointermove', this.move);
    this.canvas.removeEventListener('pointerup', this.up);
    this.canvas.removeEventListener('pointercancel', this.up);
  }
}
