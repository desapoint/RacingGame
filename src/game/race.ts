import { carById, data, rivalById } from '../data/config';
import { engineProfile, GEAR_RATIOS, powerFactor, recommendedShiftRpm, torqueFactor } from './engine';
import { statsFor } from './garage';
import type { EngineProfile } from './engine';
import type { CarDef, CarStats, Difficulty, OwnedCar, StartMode } from '../types';

const GEAR_TOP = [0.23, 0.36, 0.51, 0.68, 0.85, 1.07] as const;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export interface Racer {
  name: string;
  car: CarDef;
  owned?: OwnedCar;
  stats: CarStats;
  engine: EngineProfile;
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
  throttleHeld: boolean;
  clutch: number;
  wheelSlip: number;
  wheelSpeed: number;
  traction: number;
  limiterCut: number;
  launchRpm: number;
  shiftTarget: number;
}

export class Race {
  readonly racers: Racer[];
  readonly player: Racer;
  readonly startMode: StartMode;
  time = -3.4;
  finished = false;
  paused = false;
  feedback = 'Hold throttle to set your launch RPM.';
  feedbackUntil = 0;
  shifts: string[] = [];
  falseStart = false;

  constructor(
    owned: OwnedCar,
    rivalIds: string[],
    difficulty: Difficulty,
    random: () => number = Math.random,
    startMode: StartMode = 'automatic',
  ) {
    this.startMode = startMode;
    const create = (name: string, car: CarDef, setup?: OwnedCar): Racer => {
      const engine = engineProfile(car);
      return {
        name,
        car,
        owned: setup,
        stats: statsFor(car, setup),
        engine,
        distance: 0,
        speed: 0,
        gear: 0,
        rpm: engine.idleRpm,
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
        throttleHeld: false,
        clutch: 0,
        wheelSlip: 0,
        wheelSpeed: 0,
        traction: 1,
        limiterCut: 0,
        launchRpm: engine.idleRpm,
        shiftTarget: recommendedShiftRpm(engine, 1),
      };
    };

    this.player = create('You', carById.get(owned.id)!, owned);
    this.player.nitroLeft = this.player.stats.nitro ? 2 + this.player.stats.nitro : 0;
    const mode = data.difficulties[difficulty];
    this.racers = [
      this.player,
      ...rivalIds.map((id) => {
        const rival = rivalById.get(id)!;
        const racer = create(rival.name, carById.get(rival.carId)!);
        racer.aiReaction = rival.reaction + mode.reaction + random() * rival.consistency;
        racer.aiShift = Math.min(0.99, Math.max(0.8, rival.shift - random() * mode.mistakes));
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

  setThrottle(active: boolean): void {
    if (this.paused || this.finished || this.player.finish) return;
    this.player.throttleHeld = active;
  }

  /** Legacy/programmatic launch helper. Player controls use throttle + start mode instead. */
  launch(): void {
    if (this.paused || this.finished || this.player.launched) return;
    if (this.time < 0) {
      this.falseStart = true;
      this.feedback = 'Jump start · 0.75 s penalty';
      this.feedbackUntil = 2;
      return;
    }
    this.engageFirst(this.player);
  }

  shift(): void {
    const racer = this.player;
    if (this.paused || this.finished || racer.finish || racer.shiftDelay > 0) return;
    if (racer.gear === 0) {
      if (this.time < 0) {
        this.falseStart = true;
        this.feedback = 'Too early · wait for green before selecting first';
        this.feedbackUntil = 2;
        return;
      }
      this.engageFirst(racer);
      return;
    }
    if (!racer.launched || racer.gear >= GEAR_RATIOS.length) return;

    const target = recommendedShiftRpm(racer.engine, racer.gear);
    const error = Math.abs(racer.rpm - target) / Math.max(1, target);
    const perfect = error <= 0.035;
    const good = error <= 0.1;
    const label = perfect
      ? 'Perfect shift'
      : good
        ? 'Good shift'
        : racer.rpm < target
          ? 'Early shift'
          : 'Late shift';

    this.shifts.push(label);
    racer.quality = perfect ? 1.04 : good ? 0.99 : 0.86;
    racer.shiftDelay = racer.stats.shiftTime + (perfect ? 0 : good ? 0.06 : 0.24);
    racer.gear++;
    racer.shiftTarget = recommendedShiftRpm(racer.engine, racer.gear);
    this.feedback = label;
    this.feedbackUntil = this.time + 1.7;
  }

  nitro(): void {
    if (
      this.paused ||
      this.finished ||
      !this.player.launched ||
      this.player.nitroLeft <= 0
    )
      return;
    this.player.nitroActive = true;
    this.feedback = 'Nitrous engaged';
    this.feedbackUntil = this.time + 1.5;
  }

  private engageFirst(racer: Racer): void {
    if (racer.launched) return;
    racer.launched = true;
    racer.gear = 1;
    racer.launchRpm = racer.rpm;
    racer.clutch = 0.06;
    racer.wheelSpeed = racer.speed;
    racer.reaction =
      racer === this.player ? this.time + (this.falseStart ? 0.75 : 0) : Math.max(0, this.time);
    racer.shiftDelay = racer === this.player && this.falseStart ? 0.75 : 0;
    racer.shiftTarget = recommendedShiftRpm(racer.engine, 1);

    if (racer !== this.player) return;
    const reference = racer.owned?.launch ?? racer.engine.redlineRpm * 0.68;
    const delta = racer.launchRpm - reference;
    racer.launchFactor = clamp(1 - Math.abs(delta) / Math.max(2400, reference), 0.65, 1.05);
    this.feedback =
      delta > 650
        ? 'High launch RPM · tires are likely to spin'
        : delta < -750
          ? 'Low launch RPM · drivetrain load is pulling the engine down'
          : 'Drivetrain engaged · balancing grip and engine load';
    this.feedbackUntil = this.time + 2;
  }

  private limiterThrottle(racer: Racer, requested: number, dt: number): number {
    const engine = racer.engine;
    if (engine.limiterType === 'soft-cut') {
      const start = engine.limitRpm - 280;
      const available =
        racer.rpm <= start ? 1 : clamp((engine.limitRpm - racer.rpm) / Math.max(1, engine.limitRpm - start), 0, 1);
      if (racer.rpm > engine.limitRpm + 60)
        racer.rpm = Math.max(engine.limitRpm, racer.rpm - engine.rpmFallRate * dt);
      return requested * available;
    }

    if (racer.limiterCut <= 0 && racer.rpm >= engine.limitRpm)
      racer.limiterCut = engine.limiterCutSeconds;
    if (racer.limiterCut > 0) {
      racer.limiterCut = Math.max(0, racer.limiterCut - dt);
      const dropRate =
        engine.limiterDropRpm / Math.max(0.02, engine.limiterCutSeconds || 0.02);
      racer.rpm = Math.max(engine.idleRpm, racer.rpm - dropRate * dt);
      return 0;
    }
    return requested;
  }

  private neutralRev(racer: Racer, requestedThrottle: number, dt: number): void {
    const throttle = this.limiterThrottle(racer, requestedThrottle, dt);
    if (throttle > 0) {
      racer.rpm += racer.engine.rpmRiseRate * throttle * dt;
      if (throttle < requestedThrottle)
        racer.rpm -= racer.engine.rpmFallRate * (requestedThrottle - throttle) * 0.35 * dt;
    } else {
      racer.rpm -= racer.engine.rpmFallRate * dt;
    }
    racer.rpm = clamp(racer.rpm, racer.engine.idleRpm, racer.engine.limitRpm + 90);
    racer.wheelSlip = 0;
    racer.wheelSpeed = racer.speed;
    racer.traction = 1;
  }

  private aiStage(racer: Racer, dt: number): void {
    const target = racer.engine.redlineRpm * (0.63 + racer.car.class * 0.018);
    const throttle = racer.rpm < target - 100 ? 0.72 : racer.rpm > target + 100 ? 0 : 0.2;
    this.neutralRev(racer, throttle, dt);
  }

  private driveRacer(racer: Racer, dt: number): void {
    if (racer.gear <= 0) return;
    const drive = (racer.owned?.drive ?? 3.5) / 3.5;
    const gearIndex = racer.gear - 1;
    const gearTop = (racer.stats.maxSpeed * GEAR_TOP[gearIndex]) / drive;
    const rpmSpan = Math.max(1, racer.engine.redlineRpm - racer.engine.idleRpm);
    const tireGrip = clamp(racer.stats.grip, 0.45, 2.2);

    // The driven wheel has its own surface speed. It does not instantly jump to the
    // speed implied by engine RPM when first gear is engaged.
    racer.clutch = Math.min(
      1,
      racer.clutch + dt / (0.5 + Math.max(0, 1 - tireGrip) * 0.18),
    );
    const engineWheelSpeed =
      gearTop * clamp((racer.rpm - racer.engine.idleRpm) / rpmSpan, 0, 1.18);
    const driverThrottle =
      racer === this.player ? (racer.throttleHeld ? 1 : 0) : 1;
    const clutchTransfer =
      (2.8 + racer.clutch * 4.2) *
      racer.clutch *
      (0.25 + driverThrottle * 0.75);
    racer.wheelSpeed +=
      (engineWheelSpeed - racer.wheelSpeed) * Math.min(1, clutchTransfer * dt);

    // Slip is continuous and based on excess driven-wheel surface speed, rather than
    // a boolean. The saturating denominator avoids treating every launch from rest as
    // identical 100% wheelspin.
    const slipSpeed = Math.max(0, racer.wheelSpeed - racer.speed);
    racer.wheelSlip = clamp(slipSpeed / (slipSpeed + 4.5), 0, 1);
    const optimumSlip = 0.11;
    const slipEfficiency =
      racer.wheelSlip <= optimumSlip
        ? 0.9 + (racer.wheelSlip / optimumSlip) * 0.1
        : clamp(
            1 - (racer.wheelSlip - optimumSlip) * (0.82 / Math.max(0.65, tireGrip)),
            0.38,
            1,
          );
    racer.traction = clamp(slipEfficiency * Math.min(1.12, tireGrip), 0.25, 1.12);

    // Road grip continuously pulls the tire surface back toward vehicle speed.
    // Better tires do this more strongly, so wheelspin settles sooner without a
    // discrete "grip returned" event.
    const roadCoupling =
      (2.7 + tireGrip * 2.4) * (0.42 + slipEfficiency * 0.58);
    racer.wheelSpeed +=
      (racer.speed - racer.wheelSpeed) * Math.min(1, roadCoupling * dt);

    const requestedThrottle =
      racer.shiftDelay > 0 ? Math.min(driverThrottle, 0.08) : driverThrottle;
    const throttle = this.limiterThrottle(racer, requestedThrottle, dt);
    const torque = torqueFactor(racer.engine, racer.rpm);
    const power = powerFactor(racer.engine, racer.rpm);
    const curve = torque * 0.6 + power * 0.4;
    const nitro = racer.nitroActive && racer.nitroLeft > 0;
    if (nitro) racer.nitroLeft = Math.max(0, racer.nitroLeft - dt);

    const driveAccel =
      racer.shiftDelay > 0
        ? 0
        : racer.stats.acceleration *
          curve *
          drive *
          racer.performance *
          racer.quality *
          throttle *
          (nitro ? 1.38 : 1);
    const tractionCap =
      (7 + Math.min(2.5, racer.speed * 0.04)) * tireGrip;
    const force = Math.min(driveAccel, tractionCap) * slipEfficiency;
    const aeroDrag = 0.0011 * racer.speed * racer.speed;
    const rollingDrag = racer.speed > 0.15 ? 0.16 + racer.speed * 0.002 : 0;
    const engineBrake =
      throttle <= 0.01 && racer.clutch > 0.55
        ? (0.65 +
            clamp(racer.rpm / racer.engine.redlineRpm, 0, 1.25) * 1.25) *
          (GEAR_RATIOS[gearIndex] / GEAR_RATIOS[0])
        : 0;
    const drag = aeroDrag + rollingDrag + engineBrake;
    const previousDistance = racer.distance;
    racer.speed = Math.max(
      0,
      Math.min(gearTop * 1.035, racer.speed + (force - drag) * dt),
    );
    racer.distance += racer.speed * dt;
    racer.elapsed += dt;

    // Engine RPM follows the driven wheel through the clutch. During a launch this
    // produces the expected engagement drop; during wheelspin it follows the faster
    // spinning wheel; as wheel speed converges with road speed the RPM is already
    // converging too, so reaching zero slip does not cause a sudden extra RPM jump.
    const wheelRpm =
      racer.engine.idleRpm +
      clamp(racer.wheelSpeed / Math.max(0.1, gearTop), 0, 1.18) * rpmSpan;
    const gripCoupling = clamp(1 - racer.wheelSlip * 0.5, 0.45, 1);
    const rpmCoupling =
      (2.1 + (racer.engine.rpmFallRate / 3600) * 4.4) *
      racer.clutch *
      gripCoupling;

    racer.rpm += racer.engine.rpmRiseRate * throttle * (0.09 + curve * 0.08) * dt;
    if (throttle <= 0.01)
      racer.rpm = Math.max(
        racer.engine.idleRpm,
        racer.rpm - racer.engine.rpmFallRate * 0.34 * dt,
      );
    racer.rpm += (wheelRpm - racer.rpm) * Math.min(1, rpmCoupling * dt);
    if (racer.shiftDelay > 0)
      racer.rpm = Math.max(
        racer.engine.idleRpm,
        racer.rpm - racer.engine.rpmFallRate * 0.32 * dt,
      );
    racer.rpm = clamp(
      racer.rpm,
      racer.engine.idleRpm * 0.82,
      racer.engine.limitRpm + 100,
    );
    racer.shiftDelay = Math.max(0, racer.shiftDelay - dt);

    if (racer.distance >= data.distance) {
      const overshoot =
        ((racer.distance - data.distance) /
          Math.max(0.0001, racer.distance - previousDistance)) *
        dt;
      racer.finish = this.time - overshoot;
      racer.elapsed = Math.max(0, racer.finish - racer.reaction);
      racer.trap = racer.speed * 3.6;
      racer.distance = data.distance;
    }
  }

  update(dt: number): void {
    if (this.paused || this.finished) return;
    this.time += dt;

    if (!this.player.launched)
      this.neutralRev(this.player, this.player.throttleHeld ? 1 : 0, dt);
    for (const racer of this.racers.slice(1))
      if (!racer.launched) this.aiStage(racer, dt);

    if (this.time < 0) return;

    if (!this.player.launched && this.startMode === 'automatic') this.engageFirst(this.player);

    for (const racer of this.racers) {
      if (racer.finish) continue;
      if (racer !== this.player) {
        if (!racer.launched && this.time >= racer.aiReaction) this.engageFirst(racer);
        if (
          racer.launched &&
          racer.gear < GEAR_RATIOS.length &&
          racer.shiftDelay <= 0 &&
          racer.rpm >= racer.shiftTarget * racer.aiShift
        ) {
          racer.gear++;
          racer.shiftDelay = racer.stats.shiftTime + 0.03;
          racer.shiftTarget = recommendedShiftRpm(racer.engine, racer.gear);
        }
        if (racer.distance > racer.aiNitroAt) racer.nitroActive = true;
      }
      if (!racer.launched) continue;
      this.driveRacer(racer, dt);
    }

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
