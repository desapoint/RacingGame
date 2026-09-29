export type Slot = 'engine' | 'transmission' | 'tires' | 'nitro' | 'weight';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Screen = 'garage' | 'career' | 'dealership' | 'jobs' | 'settings';
export interface CarDef {
  id: string;
  name: string;
  tagline: string;
  class: number;
  price: number;
  power: number;
  mass: number;
  acceleration: number;
  maxSpeed: number;
  spriteIndex: number;
  color: string;
}
export interface PartDef {
  id: string;
  name: string;
  slot: Slot;
  level: number;
  price: number;
  minClass: number;
  effect: number;
}
export interface RivalDef {
  id: string;
  name: string;
  carId: string;
  reaction: number;
  shift: number;
  consistency: number;
  nitroAt: number;
  tune: number;
}
export interface EventDef {
  id: string;
  name: string;
  division: number;
  rivals: string[];
  reward: number;
  maxPartLevel: number;
  final: boolean;
}
export interface GameData {
  title: string;
  distance: number;
  startCash: number;
  starter: string;
  loaner: string;
  classes: { id: string; name: string; subtitle: string; color: string }[];
  cars: CarDef[];
  parts: PartDef[];
  rivals: RivalDef[];
  events: EventDef[];
  difficulties: Record<Difficulty, { performance: number; reaction: number; mistakes: number }>;
  jobs: { id: string; name: string; description: string; participation: number; bonus: number }[];
  idle: { name: string; price: number; rate: number; capacity: number }[];
  tuning: {
    launch: { min: number; max: number; default: number };
    drive: { min: number; max: number; default: number };
  };
}
export interface Mark {
  color: string;
  width: number;
  points: [number, number][];
}
export interface OwnedCar {
  id: string;
  parts: Partial<Record<Slot, string>>;
  launch: number;
  drive: number;
  paint: string;
  accent: string;
  wheels: number;
  marks: Mark[];
}
export interface RaceRecord {
  place: number;
  elapsed: number;
  speed: number;
}
export interface Profile {
  cash: number;
  cars: OwnedCar[];
  selected: string;
  unlocked: number;
  results: Record<string, RaceRecord>;
  settings: { difficulty: Difficulty; reducedMotion: boolean };
  idle: { level: number; bank: number; lastSeen: number };
  races: number;
  wins: number;
}
export interface SaveEnvelope {
  format: 'redline-save';
  schemaVersion: number;
  appVersion: string;
  saveId: string;
  createdAt: number;
  updatedAt: number;
  payload: Profile;
}
export interface CarStats {
  acceleration: number;
  maxSpeed: number;
  grip: number;
  shiftTime: number;
  nitro: number;
  power: number;
  mass: number;
}
