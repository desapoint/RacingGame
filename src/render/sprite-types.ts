export interface SpriteWheel {
  x: number;
  y: number;
  radius: number;
}

export interface CarSpriteSpec {
  url: string;
  width: number;
  height: number;
  bounds: [number, number, number, number];
  wheels: [SpriteWheel, SpriteWheel];
  paintColor: string;
  facing?: 'left' | 'right';
}
