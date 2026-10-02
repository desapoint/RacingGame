import { test } from 'node:test';
import assert from 'node:assert/strict';
import { data, carById, validateConfig } from '../src/data/config';
import { createOwned, statsFor, buyPart, buyCar } from '../src/game/garage';
import { accrueIdle, claimIdle, careerReward, eligible } from '../src/game/economy';
import { Race } from '../src/game/race';
import { engineProfile, powerFactor, torqueFactor } from '../src/game/engine';
import { freshSave, parseSave, validateSave } from '../src/storage/save';
import { instrumentCluster } from '../src/ui/instruments';

function drive(race: Race, skilled = true) {
  for (let tick = 0; tick < 8000 && !race.finished; tick++) {
    if (race.time < 0)
      race.setThrottle(race.player.rpm < (race.player.owned?.launch ?? race.player.engine.redlineRpm * 0.68));
    race.update(1 / 120);
    if (race.time >= 0.08 && !race.player.launched) race.launch();
    if (skilled && race.player.gear > 0 && race.player.rpm >= race.player.shiftTarget) race.shift();
    if (race.player.distance > 60) race.nitro();
  }
  assert.ok(race.finished, 'race resolves in bounded time');
  return race;
}
test('content is valid, unique and complete', () => {
  validateConfig();
  assert.equal(data.events.length, 20);
  for (let division = 0; division < 4; division++)
    assert.ok(data.cars.filter((c) => c.class === division).length >= 3);
  const bad = structuredClone(data);
  bad.events[0].rivals[0] = 'missing';
  assert.throws(() => validateConfig(bad));
});
test('all 20 career events can be completed sequentially with stock cars on Easy', () => {
  const profile = freshSave().payload;
  for (const event of data.events) {
    const car = data.cars.find((c) => c.class === event.division)!;
    const owned = createOwned(car);
    assert.equal(eligible(event, owned), null);
    const race = drive(new Race(owned, event.rivals, 'easy', () => 0.5));
    assert.ok(race.place <= 3, `${event.id}: P${race.place}`);
    careerReward(profile, event, race.place, race.player.elapsed, race.player.trap);
  }
  assert.equal(profile.unlocked, 20);
});
test('losses pay, do not unlock, and locked events cannot pay', () => {
  const profile = freshSave().payload,
    cash = profile.cash;
  assert.equal(careerReward(profile, data.events[1], 1, 12, 150), 0);
  const reward = careerReward(profile, data.events[0], 4, 30, 90);
  assert.ok(reward > 0);
  assert.equal(profile.unlocked, 0);
  assert.equal(profile.cash, cash + reward);
});
test('every class finishes and skill improves times', () => {
  for (let tier = 0; tier < 4; tier++) {
    const owned = createOwned(data.cars.find((c) => c.class === tier)!);
    const event = data.events[tier * 5];
    const skilled = drive(new Race(owned, event.rivals, 'normal', () => 0.5));
    const unskilled = drive(new Race(owned, event.rivals, 'normal', () => 0.5), false);
    assert.ok(skilled.player.finish < unskilled.player.finish);
    assert.ok(skilled.player.trap > 100);
  }
});
test('nitro, tuning and upgrades affect actual performance', () => {
  const car = carById.get(data.starter)!,
    stock = createOwned(car),
    upgraded = createOwned(car);
  upgraded.parts = {
    engine: 'engine-1',
    tires: 'tires-1',
    weight: 'weight-1',
    nitro: 'nitro-1',
    transmission: 'transmission-1',
  };
  assert.ok(statsFor(car, upgraded).power > statsFor(car, stock).power);
  const baseline = drive(new Race(stock, data.events[0].rivals, 'normal', () => 0.5));
  const faster = drive(new Race(upgraded, data.events[0].rivals, 'normal', () => 0.5));
  assert.ok(faster.player.finish < baseline.player.finish);
  const tuned = structuredClone(stock);
  tuned.drive = 4.4;
  assert.notEqual(
    drive(new Race(tuned, data.events[0].rivals, 'normal', () => 0.5)).player.finish,
    baseline.player.finish,
  );
});
test('jump start is penalized and pause freezes state', () => {
  const race = new Race(createOwned(data.cars[0]), data.events[0].rivals, 'normal', () => 0.5);
  race.launch();
  assert.ok(race.falseStart);
  race.paused = true;
  race.update(1);
  assert.equal(race.time, -3.4);
  race.paused = false;
  drive(race);
  assert.ok(race.player.reaction >= 0.75);
});
test('staging throttle is manual and RPM falls again when released', () => {
  const race = new Race(createOwned(data.cars[0]), data.events[0].rivals, 'normal', () => 0.5);
  const idle = race.player.rpm;
  race.setThrottle(true);
  for (let i = 0; i < 90; i++) race.update(1 / 120);
  const raised = race.player.rpm;
  assert.ok(raised > idle + 1000);
  assert.equal(race.player.gear, 0);
  race.setThrottle(false);
  for (let i = 0; i < 45; i++) race.update(1 / 120);
  assert.ok(race.player.rpm < raised);
  assert.ok(race.player.rpm >= race.player.engine.idleRpm);
});

test('manual-start mode stays neutral on green until first gear is selected', () => {
  const race = new Race(
    createOwned(data.cars[0]),
    data.events[0].rivals,
    'normal',
    () => 0.5,
    'manual',
  );
  race.setThrottle(true);
  while (race.time < 0.05) race.update(1 / 120);
  assert.equal(race.player.gear, 0);
  assert.equal(race.player.launched, false);
  race.shift();
  assert.equal(race.player.gear, 1);
  assert.equal(race.player.launched, true);
});

test('high-RPM launch uses continuous wheel slip while still moving forward', () => {
  const owned = createOwned(data.cars[0]);
  const race = new Race(owned, data.events[0].rivals, 'normal', () => 0.5);
  race.setThrottle(true);
  while (race.time < 0.02) race.update(1 / 120);
  for (let i = 0; i < 30; i++) race.update(1 / 120);
  assert.ok(race.player.wheelSlip > 0);
  assert.ok(race.player.wheelSlip <= 1);
  assert.ok(race.player.speed > 0);
  assert.ok(race.player.distance > 0);
  assert.ok(race.player.traction > 0);
});

test('launch RPM produces distinct wheelspin and drivetrain-load behavior', () => {
  const sample = (rpm: number, tires?: string) => {
    const owned = createOwned(data.cars[0]);
    if (tires) owned.parts.tires = tires;
    const race = new Race(owned, data.events[0].rivals, 'normal', () => 0.5, 'manual');
    race.time = 0;
    race.player.rpm = rpm;
    race.shift();
    const initialRpm = race.player.rpm;
    let peakSlip = 0;
    for (let i = 0; i < 72; i++) {
      race.update(1 / 120);
      peakSlip = Math.max(peakSlip, race.player.wheelSlip);
    }
    return {
      peakSlip,
      slip: race.player.wheelSlip,
      rpm: race.player.rpm,
      initialRpm,
      speed: race.player.speed,
    };
  };

  const low = sample(2400);
  const balanced = sample(4700);
  const high = sample(6400);
  assert.ok(high.peakSlip > low.peakSlip + 0.08, 'higher launch RPM creates more wheelspin');
  assert.ok(low.rpm < low.initialRpm, 'engaging first loads the engine at low RPM');
  assert.ok(high.speed > 0 && low.speed > 0, 'wheelspin and bogging still produce forward motion');
  assert.ok(balanced.speed > low.speed, 'a balanced launch outruns a bogged launch initially');
  assert.ok(balanced.speed > high.speed, 'a balanced launch outruns excessive wheelspin initially');

  const stockHigh = sample(6400);
  const tireHigh = sample(6400, 'tires-1');
  assert.ok(tireHigh.slip < stockHigh.slip, 'better tires settle launch slip sooner');
});

test('shift-light equipment is purchasable and changes race guidance capability', () => {
  const car = carById.get(data.starter)!;
  const owned = createOwned(car);
  const profile = freshSave().payload;
  profile.cash = 100_000;
  buyPart(profile, owned, 'shiftlight-single');
  assert.equal(statsFor(car, owned).shiftLight, 1);
  buyPart(profile, owned, 'shiftlight-multi');
  assert.equal(statsFor(car, owned).shiftLight, 2);
});

test('rev limiter and RPM fall configuration resolve from the car engine profile', () => {
  const race = new Race(createOwned(data.cars[0]), data.events[0].rivals, 'normal', () => 0.5);
  race.setThrottle(true);
  for (let i = 0; i < 900; i++) race.update(1 / 120);
  assert.ok(race.player.rpm <= race.player.engine.limitRpm + 100);
  assert.ok(race.player.engine.rpmFallRate > 0);
  assert.ok(race.player.engine.redlineRpm < race.player.engine.tachMaxRpm);
});

test('factory horsepower and torque anchor the race engine curve', () => {
  const car = carById.get('mazda3-turbo-sedan-2021')!;
  const engine = engineProfile(car);
  assert.equal(engine.curveSource, 'factory-ratings');
  assert.equal(engine.factoryPowerHp, 250);
  assert.equal(engine.factoryTorqueNm, 434);
  assert.ok(engine.torqueCurve.length >= 6);
  assert.ok(torqueFactor(engine, engine.torquePeakRpm) > 0.95);
  assert.ok(powerFactor(engine, engine.powerPeakRpm) > 0.9);
  assert.ok(engine.torquePeakRpm < engine.powerPeakRpm);
});

test('instrument style survives save validation and invalid styles are rejected', () => {
  const save = freshSave();
  save.payload.settings.gaugeStyle = 'rect-solid';
  assert.doesNotThrow(() => validateSave(save));
  (save.payload.settings as any).gaugeStyle = 'broken-gauge';
  assert.throws(() => validateSave(save));
});

test('perimeter instrument variants use one rounded path and solid mode removes segmentation', () => {
  for (const style of ['rect-24', 'rect-16', 'rect-8', 'rect-track'] as const) {
    const html = instrumentCluster(style);
    assert.match(html, /Q 30 20 50 20/);
    assert.match(html, /Q 670 20 670 40/);
    assert.ok(html.includes(`<mask id="perimeter-mask-${style}"`));
    assert.ok(html.includes(`mask="url(#perimeter-mask-${style})"`));
    assert.ok(!html.includes('rect-corner'));
  }

  const solid = instrumentCluster('rect-solid');
  assert.match(solid, /Q 30 20 50 20/);
  assert.match(solid, /Q 670 20 670 40/);
  assert.ok(!solid.includes('<mask'));
  assert.ok(!solid.includes('mask="url('));
  assert.ok(!solid.includes('rect-corner'));
});

test('idle handles caps, repeat claims, twelve hours and backwards clocks', () => {
  const now = 1_800_000_000_000,
    profile = freshSave(now).payload;
  assert.equal(accrueIdle(profile, now + 3_600_000), 60);
  assert.equal(accrueIdle(profile, now + 3_600_000), 0);
  assert.equal(accrueIdle(profile, now), 0);
  assert.equal(accrueIdle(profile, now + 2 * 3_600_000), 60);
  accrueIdle(profile, now + 48 * 3_600_000);
  assert.equal(profile.idle.bank, 180);
  profile.idle.lastSeen = Date.now();
  const cash = profile.cash;
  assert.equal(claimIdle(profile), 180);
  assert.equal(claimIdle(profile), 0);
  assert.equal(profile.cash, cash + 180);
  for (const level of data.idle) assert.ok(level.capacity <= data.jobs[0].participation);
});
test('save roundtrip preserves unknown owned IDs and rejects malformed nested data', () => {
  const save = freshSave();
  save.payload.cars.push({ ...createOwned(data.cars[0]), id: 'retired-car' });
  save.payload.cars[0].parts.engine = 'retired-part';
  assert.deepEqual(parseSave(JSON.stringify(save)), save);
  for (const mutate of [
    (s: any) => (s.payload.cash = -1),
    (s: any) => (s.schemaVersion = 99),
    (s: any) =>
      (s.payload.cars[0].marks = [{ points: [[Infinity, 5]], color: '#ffffff', width: 3 }]),
    (s: any) => (s.payload.settings = null),
    (s: any) => (s.payload.idle.bank = 1e8),
  ]) {
    const bad = structuredClone(save);
    mutate(bad);
    assert.throws(() => validateSave(bad));
  }
});
test('purchases enforce funds and class restrictions; loaner remains available', () => {
  const p = freshSave().payload;
  p.cash = 0;
  buyCar(p, data.cars[1].id);
  assert.equal(p.cars.length, 1);
  buyPart(p, p.cars[0], 'engine-1');
  assert.equal(p.cars[0].parts.engine, undefined);
  p.cash = 100_000;
  buyPart(p, p.cars[0], 'engine-3');
  assert.equal(p.cars[0].parts.engine, undefined);
  buyPart(p, p.cars[0], 'engine-1');
  assert.equal(p.cars[0].parts.engine, 'engine-1');
  assert.equal(p.cash, 98_600);
  assert.ok(createOwned(carById.get(data.loaner)!));
});
