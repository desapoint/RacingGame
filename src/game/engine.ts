import { modelById } from '../data/config';
import type { CarDef, RevLimiterType } from '../types';

export const GEAR_RATIOS = [3.2, 2.08, 1.47, 1.13, 0.91, 0.76] as const;
export const DEFAULT_RPM_FALL_RATE = 3600;
const DEFAULT_RPM_RISE_RATE = 5200;

export interface EngineProfile {
  idleRpm: number;
  redlineRpm: number;
  limitRpm: number;
  tachMaxRpm: number;
  rpmRiseRate: number;
  rpmFallRate: number;
  limiterType: RevLimiterType;
  limiterCutSeconds: number;
  limiterDropRpm: number;
  torquePeakRpm: number;
  powerPeakRpm: number;
  torqueBias: number;
}

const verifiedRedlines: Record<string, number> = {
  // Factory-published values already represented by sourced models in the roster.
  'honda-civic-si-2023': 6600,
  'toyota-gr-corolla-2024': 7200,
  'bmw-m3-competition-2024': 7200,
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function hash(id: string): number {
  let value = 2166136261;
  for (let i = 0; i < id.length; i++) {
    value ^= id.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value >>> 0);
}

function fallbackRedline(car: CarDef): number {
  const model = modelById.get(car.modelId ?? car.id);
  if (model?.fuel === 'diesel') return 5000;
  if (model?.fuel === 'electric') return 9000;
  if (car.era === 'classic') return 6400 + (hash(car.id) % 8) * 100;
  const base = [6600, 7000, 7500, 8200][car.class] ?? 7000;
  return base + ((hash(car.id) % 5) - 2) * 100;
}

export function engineProfile(car: CarDef): EngineProfile {
  const model = modelById.get(car.modelId ?? car.id);
  const redlineRpm = car.redlineRpm ?? verifiedRedlines[car.modelId ?? car.id] ?? fallbackRedline(car);
  const seed = hash(car.id);
  const limiterType: RevLimiterType =
    car.revLimiterType ??
    (car.era === 'classic' ? 'vintage-bounce' : seed % 4 === 0 ? 'hard-cut' : 'soft-cut');
  const limitRpm = Math.max(redlineRpm + 100, car.revLimitRpm ?? redlineRpm + 200);
  const torqueToPower =
    model?.torqueNm && model?.powerHp ? clamp(model.torqueNm / model.powerHp, 0.55, 2.4) : 1.25;
  const torquePeakRatio = clamp(0.6 - (torqueToPower - 1.1) * 0.1, 0.42, 0.68);
  const powerPeakRatio = clamp(0.88 + (1.05 - torqueToPower) * 0.035, 0.82, 0.94);
  return {
    idleRpm: car.idleRpm ?? (car.era === 'classic' ? 900 : 800),
    redlineRpm,
    limitRpm,
    tachMaxRpm: Math.max(8000, Math.ceil((limitRpm + 250) / 1000) * 1000),
    rpmRiseRate: car.rpmRiseRate ?? DEFAULT_RPM_RISE_RATE,
    // Intentionally a shared fallback for now; cars can override this later.
    rpmFallRate: car.rpmFallRate ?? DEFAULT_RPM_FALL_RATE,
    limiterType,
    limiterCutSeconds:
      car.revLimiterCutSeconds ??
      (limiterType === 'soft-cut'
        ? 0
        : limiterType === 'hard-cut'
          ? 0.045 + (seed % 3) * 0.008
          : 0.1 + (seed % 4) * 0.015),
    limiterDropRpm:
      car.revLimiterDropRpm ??
      (limiterType === 'soft-cut'
        ? 80
        : limiterType === 'hard-cut'
          ? 260 + (seed % 4) * 45
          : 520 + (seed % 5) * 70),
    torquePeakRpm: Math.round(redlineRpm * torquePeakRatio),
    powerPeakRpm: Math.round(redlineRpm * powerPeakRatio),
    torqueBias: torqueToPower,
  };
}

export function torqueFactor(profile: EngineProfile, rpm: number): number {
  const safeRpm = clamp(rpm, profile.idleRpm, profile.limitRpm + 500);
  const distance = (safeRpm - profile.torquePeakRpm) / Math.max(900, profile.redlineRpm * 0.32);
  const bell = Math.exp(-(distance * distance));
  const lowRpm = clamp(
    (safeRpm - profile.idleRpm) / Math.max(1, profile.torquePeakRpm - profile.idleRpm),
    0,
    1,
  );
  let torque = 0.48 + 0.52 * bell;
  torque *= 0.7 + 0.3 * Math.sqrt(lowRpm);
  if (safeRpm > profile.redlineRpm)
    torque *= clamp(1 - (safeRpm - profile.redlineRpm) / 900, 0.08, 1);
  return clamp(torque, 0.08, 1.08);
}

export function powerFactor(profile: EngineProfile, rpm: number): number {
  const torque = torqueFactor(profile, rpm);
  const raw = torque * (rpm / Math.max(1, profile.powerPeakRpm));
  const peakTorque = torqueFactor(profile, profile.powerPeakRpm);
  const peak = peakTorque * (profile.powerPeakRpm / Math.max(1, profile.powerPeakRpm));
  return clamp(raw / Math.max(0.01, peak), 0.08, 1.08);
}

export function recommendedShiftRpm(profile: EngineProfile, gear: number): number {
  if (gear >= GEAR_RATIOS.length) return profile.redlineRpm;
  const currentRatio = GEAR_RATIOS[gear - 1];
  const nextRatio = GEAR_RATIOS[gear];
  const start = Math.round(profile.redlineRpm * 0.62);
  const end = Math.min(profile.limitRpm - 80, Math.round(profile.redlineRpm * 0.995));
  let best = end;
  for (let rpm = start; rpm <= end; rpm += 50) {
    const nextRpm = rpm * (nextRatio / currentRatio);
    const currentWheelTorque = torqueFactor(profile, rpm) * currentRatio;
    const nextWheelTorque = torqueFactor(profile, nextRpm) * nextRatio;
    const currentPower = powerFactor(profile, rpm);
    const nextPower = powerFactor(profile, nextRpm);
    const currentScore = currentWheelTorque * 0.72 + currentPower * 0.28;
    const nextScore = nextWheelTorque * 0.72 + nextPower * 0.28;
    if (nextScore >= currentScore * 0.985) {
      best = rpm;
      break;
    }
  }
  return clamp(best, start, end);
}
