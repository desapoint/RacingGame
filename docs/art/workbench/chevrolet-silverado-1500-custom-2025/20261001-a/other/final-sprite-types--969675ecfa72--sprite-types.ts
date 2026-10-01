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
  /** Optional native-image polygons for neutral paint that hue detection cannot find. */
  paintAreas?: [number, number][][];
  facing?: 'left' | 'right';
}
