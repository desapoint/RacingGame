import { carById, data, rivalById } from '../data/config';
import { statsFor } from './garage';
import type { CarDef, CarStats, Difficulty, OwnedCar } from '../types';

export interface Racer {
  name: string;
  car: CarDef;
  owned?: OwnedCar;
  stats: CarStats;
  distance: number;
  speed: number;
  gear: number;
  rpm: number;
  launched: boolean;
  reaction: number;
  elapsed: number;
  finish: number;
  trap: number;
  shiftDelay: number;
  nitroLeft: number;
  nitroActive: boolean;
  launchFactor: number;
  quality: number;
  aiReaction: number;
  aiShift: number;
  aiNitroAt: number;
  performance: number;
}
export class Race {
  readonly racers: Racer[];
  readonly player: Racer;
  time = -3.4;
  finished = false;
  paused = false;
  feedback = 'Wait for green. Time your launch.';
  feedbackUntil = 0;
  shifts: string[] = [];
  falseStart = false;
  constructor(
    owned: OwnedCar,
    rivalIds: string[],
    difficulty: Difficulty,
    random: () => number = Math.random,
  ) {
    const create = (name: string, car: CarDef, setup?: OwnedCar): Racer => ({
      name,
      car,
      owned: setup,
      stats: statsFor(car, setup),
      distance: 0,
      speed: 0,
      gear: 1,
      rpm: 3000,
      launched: false,
      reaction: 0,
      elapsed: 0,
      finish: 0,
      trap: 0,
      shiftDelay: 0,
      nitroLeft: 0,
      nitroActive: false,
      launchFactor: 1,
      quality: 1,
      aiReaction: 0,
      aiShift: 0.93,
      aiNitroAt: 150,
      performance: 1,
    });
    this.player = create('You', carById.get(owned.id)!, owned);
    this.player.nitroLeft = this.player.stats.nitro ? 2 + this.player.stats.nitro : 0;
    const mode = data.difficulties[difficulty];
    this.racers = [
      this.player,
      ...rivalIds.map((id) => {
        const rival = rivalById.get(id)!;
        const racer = create(rival.name, carById.get(rival.carId)!);
        racer.aiReaction = rival.reaction + mode.reaction + random() * rival.consistency;
        racer.aiShift = Math.min(0.97, Math.max(0.76, rival.shift - random() * mode.mistakes));
        racer.aiNitroAt = rival.nitroAt;
        racer.performance =
          mode.performance * rival.tune * (1 - random() * rival.consistency * 0.3);
        racer.nitroLeft = racer.car.class > 0 ? 2 : 0;
        return racer;
      }),
    ];
  }
  get place(): number {
    return (
      1 +
      this.racers
        .slice(1)
        .filter((r) =>
          this.player.finish
            ? r.finish > 0 && r.finish < this.player.finish
            : r.distance > this.player.distance,
        ).length
    );
  }
  launch(): void {
    if (this.paused || this.finished || this.player.launched) return;
    if (this.time < 0) {
      this.falseStart = true;
      this.feedback = 'Jump start · 0.75 s penalty';
      this.feedbackUntil = 2;
      return;
    }
    const player = this.player;
    player.launched = true;
    player.reaction = this.time + (this.falseStart ? 0.75 : 0);
    player.shiftDelay = this.falseStart ? 0.75 : 0;
    player.launchFactor = Math.max(
      0.68,
      1 - Math.abs(player.rpm - (player.owned?.launch ?? 4800)) / 6500,
    );
    this.feedback =
      player.launchFactor > 0.93
        ? 'Perfect launch'
        : player.launchFactor > 0.8
          ? 'Good launch'
          : 'Wheelspin · launch outside the window';
    this.feedbackUntil = this.time + 2;
  }
  shift(): void {
    const racer = this.player;
    if (
      this.paused ||
      this.finished ||
      !racer.launched ||
      racer.finish ||
      racer.gear >= 6 ||
      racer.shiftDelay > 0
    )
      return;
    const perfect = racer.rpm >= 6100 && racer.rpm <= 6800;
    const good = racer.rpm >= 5300 && racer.rpm < 7100;
    const label = perfect
      ? 'Perfect shift'
      : good
        ? 'Good shift'
        : racer.rpm < 5300
          ? 'Early shift'
          : 'Late shift';
    this.shifts.push(label);
    racer.quality = perfect ? 1.04 : good ? 0.99 : 0.86;
    racer.shiftDelay = racer.stats.shiftTime + (perfect ? 0 : good ? 0.06 : 0.24);
    racer.gear++;
    this.feedback = label;
    this.feedbackUntil = this.time + 1.7;
  }
  nitro(): void {
    if (this.paused || this.finished || !this.player.launched || this.player.nitroLeft <= 0) return;
    this.player.nitroActive = true;
    this.feedback = 'Nitrous engaged';
    this.feedbackUntil = this.time + 1.5;
  }
  update(dt: number): void {
    if (this.paused || this.finished) return;
    this.time += dt;
    if (!this.player.launched) this.player.rpm = 3300 + (Math.sin(this.time * 3.2) + 1) * 1450;
    if (this.time < 0) return;
    for (const racer of this.racers) {
      if (racer.finish) continue;
      if (racer !== this.player) {
        if (this.time >= racer.aiReaction) {
          racer.launched = true;
          racer.reaction = racer.aiReaction;
        }
        if (racer.rpm >= 7200 * racer.aiShift && racer.gear < 6 && racer.shiftDelay <= 0) {
          racer.gear++;
          racer.shiftDelay = 0.29;
        }
        if (racer.distance > racer.aiNitroAt) racer.nitroActive = true;
      }
      if (!racer.launched) continue;
      const drive = (racer.owned?.drive ?? 3.5) / 3.5;
      const gearTop =
        (racer.stats.maxSpeed * [0.23, 0.36, 0.51, 0.68, 0.85, 1.07][racer.gear - 1]) / drive;
      racer.rpm = Math.max(1600, Math.min(7400, (racer.speed / gearTop) * 7200));
      racer.shiftDelay = Math.max(0, racer.shiftDelay - dt);
      const torque = 0.65 + 0.35 * Math.min(1, racer.rpm / 5000);
      const launch =
        racer.distance < 28 ? Math.min(1.12, racer.launchFactor * racer.stats.grip) : 1;
      const nitro = racer.nitroActive && racer.nitroLeft > 0;
      if (nitro) racer.nitroLeft = Math.max(0, racer.nitroLeft - dt);
      const drag = 0.0011 * racer.speed * racer.speed;
      const force =
        racer.shiftDelay > 0
          ? 0
          : racer.stats.acceleration *
            torque *
            launch *
            drive *
            racer.performance *
            racer.quality *
            (nitro ? 1.38 : 1);
      const previousDistance = racer.distance;
      racer.speed = Math.max(0, Math.min(gearTop * 1.025, racer.speed + (force - drag) * dt));
      racer.distance += racer.speed * dt;
      racer.elapsed += dt;
      if (racer.distance >= data.distance) {
        const overshoot =
          ((racer.distance - data.distance) / Math.max(0.0001, racer.distance - previousDistance)) *
          dt;
        racer.finish = this.time - overshoot;
        racer.elapsed = Math.max(0, racer.finish - racer.reaction);
        racer.trap = racer.speed * 3.6;
        racer.distance = data.distance;
      }
    }
    // A missed launch or a stalled run still reaches a result and can be retried.
    if (this.time >= 60) {
      for (const racer of this.racers)
        if (!racer.finish) {
          racer.finish = 60 + (data.distance - racer.distance);
          racer.elapsed = 60;
          racer.trap = racer.speed * 3.6;
        }
    }
    this.finished = this.racers.every((racer) => racer.finish > 0);
  }
}
