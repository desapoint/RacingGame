import { modelById } from '../data/config';
import type { CarDef, RevLimiterType, VehicleModel } from '../types';

export const GEAR_RATIOS = [3.2, 2.08, 1.47, 1.13, 0.91, 0.76] as const;
export const DEFAULT_RPM_FALL_RATE = 3600;
const DEFAULT_RPM_RISE_RATE = 5200;
const HP_TO_WATTS = 745.699872;
const POWER_CONSTANT = (HP_TO_WATTS * 60) / (2 * Math.PI);

export interface EngineCurvePoint {
  rpm: number;
  torqueNm: number;
}

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
  factoryPowerHp: number | null;
  factoryTorqueNm: number | null;
  curveSource: 'factory-ratings' | 'arcade-fallback';
  torqueCurve: EngineCurvePoint[];
  curvePeakTorqueNm: number;
  curvePeakPower: number;
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

function engineCharacter(model: VehicleModel | undefined): 'electric' | 'diesel' | 'turbo' | 'naturally-aspirated' | 'hybrid' | 'generic' {
  if (!model) return 'generic';
  if (model.fuel === 'electric') return 'electric';
  if (model.fuel === 'diesel') return 'diesel';
  if (model.fuel === 'hybrid' || model.fuel === 'plug-in hybrid' || model.fuel === 'mild hybrid')
    return 'hybrid';
  const engine = model.engine.toLowerCase();
  if (engine.includes('turbo') || engine.includes('supercharg')) return 'turbo';
  if (engine.includes('naturally aspirated') || engine.includes('n/a')) return 'naturally-aspirated';
  return 'generic';
}

function inferredPeakRatios(
  model: VehicleModel | undefined,
  torqueToPower: number,
): { torque: number; power: number } {
  const character = engineCharacter(model);
  if (character === 'electric') return { torque: 0.2, power: 0.72 };
  if (character === 'diesel') return { torque: 0.42, power: 0.82 };
  if (character === 'turbo') return { torque: clamp(0.48 - (torqueToPower - 1.2) * 0.06, 0.34, 0.55), power: 0.9 };
  if (character === 'hybrid') return { torque: 0.46, power: 0.86 };
  if (character === 'naturally-aspirated') return { torque: 0.66, power: 0.92 };
  return {
    torque: clamp(0.6 - (torqueToPower - 1.1) * 0.1, 0.42, 0.68),
    power: clamp(0.88 + (1.05 - torqueToPower) * 0.035, 0.82, 0.94),
  };
}

function requiredTorqueForPower(powerHp: number, rpm: number): number {
  return (powerHp * POWER_CONSTANT) / Math.max(1, rpm);
}

function uniqueCurve(points: EngineCurvePoint[]): EngineCurvePoint[] {
  const sorted = points
    .map((point) => ({ rpm: Math.round(point.rpm), torqueNm: Math.max(0.01, point.torqueNm) }))
    .sort((a, b) => a.rpm - b.rpm);
  const result: EngineCurvePoint[] = [];
  for (const point of sorted) {
    const previous = result[result.length - 1];
    if (previous && previous.rpm === point.rpm) previous.torqueNm = Math.max(previous.torqueNm, point.torqueNm);
    else result.push(point);
  }
  return result;
}

function factoryCurve(
  idleRpm: number,
  redlineRpm: number,
  limitRpm: number,
  torquePeakRpm: number,
  powerPeakRpm: number,
  peakTorqueNm: number,
  powerHp: number,
  model: VehicleModel | undefined,
): EngineCurvePoint[] {
  const character = engineCharacter(model);
  const powerTorque = Math.min(peakTorqueNm, requiredTorqueForPower(powerHp, powerPeakRpm));
  const low =
    character === 'electric'
      ? 0.94
      : character === 'diesel'
        ? 0.72
        : character === 'turbo'
          ? 0.58
          : character === 'naturally-aspirated'
            ? 0.45
            : 0.5;
  const shoulder =
    character === 'electric'
      ? 0.98
      : character === 'diesel'
        ? 0.94
        : character === 'turbo'
          ? 0.97
          : character === 'naturally-aspirated'
            ? 0.9
            : 0.92;
  const midRpm = torquePeakRpm + (powerPeakRpm - torquePeakRpm) * 0.55;
  const midTorque = Math.max(powerTorque * 1.05, peakTorqueNm * shoulder);
  const redlineTorque =
    character === 'electric'
      ? powerTorque * 0.72
      : character === 'diesel'
        ? powerTorque * 0.58
        : powerTorque * 0.76;
  return uniqueCurve([
    { rpm: idleRpm, torqueNm: peakTorqueNm * low },
    { rpm: idleRpm + (torquePeakRpm - idleRpm) * 0.48, torqueNm: peakTorqueNm * Math.min(0.95, low + 0.28) },
    { rpm: torquePeakRpm, torqueNm: peakTorqueNm },
    { rpm: midRpm, torqueNm: midTorque },
    { rpm: powerPeakRpm, torqueNm: powerTorque },
    { rpm: redlineRpm, torqueNm: redlineTorque },
    { rpm: limitRpm + 100, torqueNm: redlineTorque * 0.24 },
  ]);
}

function fallbackCurve(
  idleRpm: number,
  redlineRpm: number,
  limitRpm: number,
  torquePeakRpm: number,
  powerPeakRpm: number,
): EngineCurvePoint[] {
  return uniqueCurve([
    { rpm: idleRpm, torqueNm: 0.38 },
    { rpm: idleRpm + (torquePeakRpm - idleRpm) * 0.5, torqueNm: 0.72 },
    { rpm: torquePeakRpm, torqueNm: 1 },
    { rpm: torquePeakRpm + (powerPeakRpm - torquePeakRpm) * 0.55, torqueNm: 0.93 },
    { rpm: powerPeakRpm, torqueNm: 0.82 },
    { rpm: redlineRpm, torqueNm: 0.62 },
    { rpm: limitRpm + 100, torqueNm: 0.08 },
  ]);
}

function torqueAt(curve: EngineCurvePoint[], rpm: number): number {
  if (rpm <= curve[0].rpm) return curve[0].torqueNm;
  for (let index = 1; index < curve.length; index++) {
    const next = curve[index];
    const previous = curve[index - 1];
    if (rpm <= next.rpm) {
      const mix = (rpm - previous.rpm) / Math.max(1, next.rpm - previous.rpm);
      return previous.torqueNm + (next.torqueNm - previous.torqueNm) * mix;
    }
  }
  return curve[curve.length - 1].torqueNm;
}

export function engineProfile(car: CarDef): EngineProfile {
  const model = modelById.get(car.modelId ?? car.id);
  const redlineRpm = car.redlineRpm ?? verifiedRedlines[car.modelId ?? car.id] ?? fallbackRedline(car);
  const seed = hash(car.id);
  const limiterType: RevLimiterType =
    car.revLimiterType ??
    (car.era === 'classic' ? 'vintage-bounce' : seed % 4 === 0 ? 'hard-cut' : 'soft-cut');
  const limitRpm = Math.max(redlineRpm + 100, car.revLimitRpm ?? redlineRpm + 200);
  const factoryPowerHp = model?.powerHp ?? null;
  const factoryTorqueNm = model?.torqueNm ?? null;
  const torqueToPower =
    factoryTorqueNm && factoryPowerHp ? clamp(factoryTorqueNm / factoryPowerHp, 0.55, 2.4) : 1.25;
  const ratios = inferredPeakRatios(model, torqueToPower);
  const idleRpm = car.idleRpm ?? (car.era === 'classic' ? 900 : model?.fuel === 'electric' ? 400 : 800);
  let torquePeakRpm = Math.round(redlineRpm * ratios.torque);
  let powerPeakRpm = Math.round(redlineRpm * ratios.power);
  if (factoryTorqueNm && factoryPowerHp) {
    // Peak power cannot require more torque than the published torque maximum.
    const physicalMinimum = Math.ceil((factoryPowerHp * POWER_CONSTANT) / factoryTorqueNm);
    powerPeakRpm = Math.max(powerPeakRpm, physicalMinimum + 100);
    powerPeakRpm = clamp(powerPeakRpm, torquePeakRpm + 350, Math.round(redlineRpm * 0.97));
    torquePeakRpm = clamp(torquePeakRpm, idleRpm + 250, powerPeakRpm - 250);
  }
  const torqueCurve =
    factoryTorqueNm && factoryPowerHp
      ? factoryCurve(
          idleRpm,
          redlineRpm,
          limitRpm,
          torquePeakRpm,
          powerPeakRpm,
          factoryTorqueNm,
          factoryPowerHp,
          model,
        )
      : fallbackCurve(idleRpm, redlineRpm, limitRpm, torquePeakRpm, powerPeakRpm);
  const curvePeakTorqueNm = Math.max(...torqueCurve.map((point) => point.torqueNm));
  const curvePeakPower = Math.max(...torqueCurve.map((point) => point.torqueNm * point.rpm));
  return {
    idleRpm,
    redlineRpm,
    limitRpm,
    tachMaxRpm: Math.max(8000, Math.ceil((limitRpm + 250) / 1000) * 1000),
    rpmRiseRate: car.rpmRiseRate ?? DEFAULT_RPM_RISE_RATE,
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
    torquePeakRpm,
    powerPeakRpm,
    torqueBias: torqueToPower,
    factoryPowerHp,
    factoryTorqueNm,
    curveSource: factoryTorqueNm && factoryPowerHp ? 'factory-ratings' : 'arcade-fallback',
    torqueCurve,
    curvePeakTorqueNm,
    curvePeakPower,
  };
}

export function torqueNmAt(profile: EngineProfile, rpm: number): number | null {
  if (profile.curveSource !== 'factory-ratings') return null;
  return torqueAt(profile.torqueCurve, clamp(rpm, profile.idleRpm, profile.limitRpm + 500));
}

export function powerHpAt(profile: EngineProfile, rpm: number): number | null {
  const torqueNm = torqueNmAt(profile, rpm);
  if (torqueNm == null) return null;
  return (torqueNm * Math.max(profile.idleRpm, rpm)) / POWER_CONSTANT;
}

export function torqueFactor(profile: EngineProfile, rpm: number): number {
  const safeRpm = clamp(rpm, profile.idleRpm, profile.limitRpm + 500);
  const torque = torqueAt(profile.torqueCurve, safeRpm);
  return clamp(torque / Math.max(0.01, profile.curvePeakTorqueNm), 0.04, 1.08);
}

export function powerFactor(profile: EngineProfile, rpm: number): number {
  const safeRpm = clamp(rpm, profile.idleRpm, profile.limitRpm + 500);
  const raw = torqueAt(profile.torqueCurve, safeRpm) * safeRpm;
  return clamp(raw / Math.max(0.01, profile.curvePeakPower), 0.04, 1.08);
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
