import { carById, data } from './data/config';
import { createOwned, buyCar, buyPart } from './game/garage';
import { accrueIdle, careerReward, claimIdle, eligible } from './game/economy';
import { Race } from './game/race';
import { Controls, type Action } from './input/controls';
import { Renderer } from './render/renderer';
import { drawCarPreview, prepareCarSprites } from './render/car';
import { SaveRepository, downloadSave, parseSave } from './storage/save';
import { LiveryEditor } from './ui/livery';
import * as ui from './ui/screens';
import { dealership, initialDealerFilters, dealerSelection } from './ui/dealership';
import { vehicleSpecs } from './ui/vehicle-specs';
import { instrumentCluster } from './ui/instruments';
import type { Difficulty, GaugeStyle, OwnedCar, SaveEnvelope, Screen, StartMode } from './types';

type RaceContext = { type: 'career' | 'job' | 'quick'; id: string; title: string };
class App {
  private root = document.querySelector<HTMLDivElement>('#app')!;
  private repository = new SaveRepository();
  private save!: SaveEnvelope;
  private screen: Screen = 'garage';
  private renderer?: Renderer;
  private editor?: LiveryEditor;
  private editing = false;
  private race?: Race;
  private context?: RaceContext;
  private frame = 0;
  private toastTimer = 0;
  private outcomePaid = false;
  private lastHud = 0;
  private controls: Controls;
  private dealerFilters = initialDealerFilters();
  private viewRevision = 0;
  private searchTimer = 0;
  private loadingRace = false;
  constructor() {
    this.controls = new Controls(
      (action) => this.raceAction(action),
      (active) => {
        this.race?.setThrottle(active);
        this.root
          .querySelector<HTMLButtonElement>('[data-action="throttle"]')
          ?.classList.toggle('held', active);
        this.updateHud();
      },
      () => !!this.race && !this.race.finished,
    );
    this.root.addEventListener('pointerdown', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
        '[data-action="throttle"]',
      );
      if (!button || button.disabled || !this.race) return;
      event.preventDefault();
      this.race.setThrottle(true);
      button.classList.add('held');
      this.updateHud();
    });
    const releaseThrottle = () => {
      this.race?.setThrottle(false);
      this.root
        .querySelector<HTMLButtonElement>('[data-action="throttle"]')
        ?.classList.remove('held');
      this.updateHud();
    };
    window.addEventListener('pointerup', releaseThrottle);
    window.addEventListener('pointercancel', releaseThrottle);
    window.addEventListener('blur', releaseThrottle);
    this.root.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
      if (button && !button.disabled)
        void this.action(button.dataset.action!, button.dataset.id ?? '').catch((error) =>
          this.toast(error instanceof Error ? error.message : 'Something went wrong.'),
        );
    });
    this.root.addEventListener(
      'change',
      (event) =>
        void this.change(event).catch((error) =>
          this.toast(error instanceof Error ? error.message : 'Unable to apply change.'),
        ),
    );
    this.root.addEventListener('input', (event) => this.input(event));
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.race && !this.race.finished) {
          this.race.paused = true;
          this.updateHud();
          this.renderer?.race(this.race, this.save.payload.settings.reducedMotion);
        }
        void this.persist();
      }
    });
    window.addEventListener('resize', () => {
      this.renderer?.resize();
      this.draw();
      document
        .querySelectorAll<HTMLCanvasElement>('.dealer-canvas')
        .forEach((canvas) =>
          drawCarPreview(canvas, carById.get(canvas.dataset.car!)!),
        );
    });
    setInterval(() => {
      if (this.save) void this.persist();
    }, 15000);
  }
  async start(): Promise<void> {
    this.root.innerHTML = '<div class="loading">REDLINE / <span>Opening the garage…</span></div>';
    this.save = await this.repository.load();
    this.ensureLoaner();
    await prepareCarSprites([carById.get(this.owned.id)!]);
    accrueIdle(this.save.payload);
    this.render();
    await this.persist();
  }
  private get profile() {
    return this.save.payload;
  }
  private ensureLoaner(): void {
    if (this.profile.cars.length < 200 && !this.profile.cars.some((car) => carById.has(car.id))) {
      this.profile.cars.push(createOwned(carById.get(data.loaner)!));
      this.profile.selected = data.loaner;
    }
  }
  private get owned(): OwnedCar {
    return (
      this.profile.cars.find((c) => c.id === this.profile.selected && carById.has(c.id)) ??
      this.profile.cars.find((c) => carById.has(c.id)) ??
      createOwned(carById.get(data.loaner)!)
    );
  }
  private async persist(): Promise<void> {
    if (!this.save) return;
    accrueIdle(this.profile);
    await this.repository.write(this.save);
    const status = document.querySelector('#save-status');
    if (status) status.textContent = `● ${this.repository.status}`;
  }
  private render(): void {
    const revision = ++this.viewRevision;
    this.editor?.destroy();
    this.editor = undefined;
    this.renderer = undefined;
    this.root.innerHTML = ui.shell(this.profile, this.screen, this.repository.status);
    const main = document.querySelector<HTMLElement>('#main')!;
    switch (this.screen) {
      case 'garage':
        main.innerHTML = ui.garage(this.profile, this.owned, this.editing);
        break;
      case 'career':
        main.innerHTML = ui.career(this.profile, this.owned);
        break;
      case 'dealership':
        main.innerHTML = dealership(this.profile, this.dealerFilters);
        break;
      case 'jobs':
        accrueIdle(this.profile);
        main.innerHTML = ui.jobs(this.profile);
        break;
      case 'settings':
        main.innerHTML = ui.settings(
          this.profile,
          this.repository.status,
          !!this.repository.recovery,
        );
        break;
    }
    const canvas = document.querySelector<HTMLCanvasElement>('#garage-canvas');
    if (canvas) {
      this.renderer = new Renderer(canvas);
      this.draw();
      if (this.editing)
        this.editor = new LiveryEditor(
          canvas,
          this.owned,
          () => this.draw(),
          () => {
            this.root
              .querySelectorAll<HTMLButtonElement>(
                '[data-action="undo"], [data-action="clear-livery"]',
              )
              .forEach((button) => (button.disabled = !this.owned.marks.length));
            void this.persist();
          },
        );
    }
    const visible =
      this.screen === 'garage'
        ? [carById.get(this.owned.id)!]
        : this.screen === 'dealership'
          ? dealerSelection(this.dealerFilters).cars
          : [];
    if (visible.length) {
      const status = document.querySelector('#car-loading');
      if (status) status.textContent = 'Loading cars…';
      void prepareCarSprites(visible, undefined, () => revision === this.viewRevision)
        .then(() => {
          if (revision !== this.viewRevision) return;
          this.draw();
          document
            .querySelectorAll<HTMLCanvasElement>('.dealer-canvas')
            .forEach((canvas) =>
              drawCarPreview(canvas, carById.get(canvas.dataset.car!)!),
            );
          if (status) status.textContent = '';
        })
        .catch((error) => {
          if (revision === this.viewRevision)
            this.toast(error instanceof Error ? error.message : 'Unable to load car artwork.');
        });
    }
  }
  private draw(): void {
    if (this.race) this.renderer?.race(this.race, this.profile.settings.reducedMotion);
    else if (this.screen === 'garage')
      this.renderer?.garage(carById.get(this.owned.id)!, this.owned, this.editing);
  }
  private toast(message: string): void {
    const element = document.querySelector<HTMLElement>('#toast');
    if (!element) return;
    clearTimeout(this.toastTimer);
    element.textContent = message;
    element.hidden = false;
    this.toastTimer = window.setTimeout(() => (element.hidden = true), 3800);
  }
  private async action(action: string, id: string): Promise<void> {
    if (action === 'specs') {
      const car = carById.get(id);
      if (!car) return;
      const dialog = document.querySelector<HTMLDialogElement>('#modal')!;
      dialog.innerHTML = vehicleSpecs(
        car,
        this.profile.cars.find((item) => item.id === id),
      );
      dialog.classList.add('vehicle-modal');
      dialog.setAttribute('aria-labelledby', 'spec-title');
      dialog.showModal();
      dialog.scrollTop = 0;
      return;
    }
    if (action === 'dealer-page') {
      this.dealerFilters.page = Math.max(0, Number(id) || 0);
      this.render();
      window.scrollTo(0, 0);
      return;
    }
    if (action === 'nav') {
      if (this.race && !this.race.finished) {
        this.race.paused = true;
        this.draw();
        if (!confirm('Leave this race? No credits will be charged.')) return;
      }
      this.stopRace();
      this.screen = id as Screen;
      this.editing = false;
      this.render();
      window.scrollTo(0, 0);
      return;
    }
    if (action === 'throttle') return;
    if (action === 'shift' || action === 'nitro' || action === 'pause') {
      this.raceAction(action);
      return;
    }
    if (action === 'event') {
      const event = data.events.find((e) => e.id === id);
      if (!event || data.events.indexOf(event) > this.profile.unlocked) return;
      const restriction = eligible(event, this.owned);
      if (restriction) {
        this.toast(restriction);
        return;
      }
      await this.startRace({ type: 'career', id, title: event.name }, this.owned, event.rivals);
      return;
    }
    if (action === 'quick') {
      await this.startRace(
        { type: 'quick', id: 'quick', title: 'Open strip / single race' },
        this.owned,
      );
      return;
    }
    if (action === 'job') {
      const job = data.jobs.find((j) => j.id === id);
      if (!job) return;
      await this.startRace(
        { type: 'job', id, title: job.name },
        id === 'night-shift' ? createOwned(carById.get(data.loaner)!) : this.owned,
      );
      return;
    }
    if (action === 'retry') {
      const context = this.context!;
      this.stopRace();
      if (context.type === 'career') await this.action('event', context.id);
      else if (context.type === 'job') await this.action('job', context.id);
      else await this.action('quick', '');
      return;
    }
    let message = '';
    if (action === 'buy-car') message = buyCar(this.profile, id);
    if (action === 'part') message = buyPart(this.profile, this.owned, id);
    if (action === 'editor') {
      this.editing = !this.editing;
      this.render();
      if (this.editing)
        document.querySelector('#garage-canvas')?.scrollIntoView({
          behavior: this.profile.settings.reducedMotion ? 'instant' : 'smooth',
          block: 'center',
        });
      return;
    }
    if (action === 'undo') this.owned.marks.pop();
    if (action === 'clear-livery') this.owned.marks = [];
    if (action === 'claim') message = `Collected C ${ui.money(claimIdle(this.profile))}.`;
    if (action === 'facility') {
      const next = data.idle[this.profile.idle.level + 1];
      if (next && this.profile.cash >= next.price) {
        accrueIdle(this.profile);
        this.profile.cash -= next.price;
        this.profile.idle.level++;
        message = 'The workshop is ready for more business.';
      }
    }
    if (action === 'export') {
      accrueIdle(this.profile);
      downloadSave(JSON.stringify(this.save, null, 2));
      this.toast('Save exported. Keep the JSON file as your backup.');
      return;
    }
    if (action === 'reset-progression') {
      if (
        !confirm(
          'Reset all progression? This permanently deletes your credits, cars, upgrades, race results, career unlocks, workshop progress, preferences, and local save history. This cannot be undone unless you exported a backup.',
        )
      )
        return;
      const fresh = await this.repository.reset();
      if (!fresh) {
        this.toast('Reset failed. Your current profile has been kept.');
        return;
      }
      this.save = fresh;
      this.stopRace();
      this.screen = 'garage';
      this.editing = false;
      this.render();
      this.toast('Progress reset. A brand-new save has been created.');
      return;
    }
    if (action === 'recovery') {
      downloadSave(this.repository.recovery ?? '', 'redline-recovery.json');
      return;
    }
    if (action === 'recover-new') {
      if (
        !confirm(
          'Replace the unreadable stored save with this session? Export the original first if you want to recover it later.',
        )
      )
        return;
      if (!(await this.repository.replace(this.save))) {
        this.toast(
          'Could not replace the save. Original preserved. Export this session to keep it.',
        );
        return;
      }
      message = 'This session is now your saved profile.';
    }
    if (action === 'close-modal') {
      document.querySelector<HTMLDialogElement>('#modal')?.close();
      return;
    }
    await this.persist();
    this.render();
    if (message) this.toast(message);
  }
  private input(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.id === 'dealer-search') {
      this.dealerFilters.search = target.value;
      this.dealerFilters.page = 0;
      clearTimeout(this.searchTimer);
      this.searchTimer = window.setTimeout(() => {
        if (this.screen !== 'dealership' || this.race) return;
        const focused = document.activeElement === target;
        const position = target.selectionStart;
        this.render();
        if (focused) {
          const search = document.querySelector<HTMLInputElement>('#dealer-search')!;
          search.focus();
          search.setSelectionRange(position, position);
        }
      }, 200);
      return;
    }
    if (target.id === 'launch-tune') {
      this.owned.launch = Number(target.value);
      document.querySelector('#launch-value')!.textContent = `${target.value} RPM`;
    }
    if (target.id === 'drive-tune') {
      this.owned.drive = Number(target.value);
      document.querySelector('#drive-value')!.textContent = Number(target.value).toFixed(2);
    }
    if (target.id === 'body-color') {
      this.owned.paint = target.value;
      this.draw();
    }
    if (target.id === 'accent-color') {
      this.owned.accent = target.value;
      this.draw();
    }
    if (target.id === 'ink-color' && this.editor) this.editor.color = target.value;
  }
  private async change(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const dealerKey = (
      {
        'dealer-category': 'category',
        'dealer-condition': 'condition',
        'dealer-sort': 'sort',
      } as const
    )[target.id as 'dealer-category'];
    if (dealerKey) {
      this.dealerFilters[dealerKey] = target.value;
      this.dealerFilters.page = 0;
      this.render();
      return;
    }
    if (target.id === 'difficulty') this.profile.settings.difficulty = target.value as Difficulty;
    if (target.id === 'start-mode') this.profile.settings.startMode = target.value as StartMode;
    if (target.id === 'gauge-style') this.profile.settings.gaugeStyle = target.value as GaugeStyle;
    if (target.id === 'reduced-motion') this.profile.settings.reducedMotion = target.checked;
    if (target.id === 'car-select') {
      this.profile.selected = target.value;
      this.render();
    }
    if (target.id === 'wheels') {
      this.owned.wheels = Number(target.value);
      this.draw();
    }
    if (target.id === 'import-save') {
      const file = target.files?.[0];
      if (!file) return;
      if (file.size > 2_000_000) {
        this.toast('Save exceeds the 2 MB limit.');
        return;
      }
      try {
        const candidate = parseSave(await file.text());
        const dialog = document.querySelector<HTMLDialogElement>('#modal')!;
        dialog.classList.remove('vehicle-modal');
        dialog.removeAttribute('aria-labelledby');
        dialog.innerHTML = `<div class="eyebrow">SAVE IMPORT PREVIEW</div><h2>Continue this story?</h2><p>Schema ${candidate.schemaVersion} · App ${ui.escape(candidate.appVersion)}<br>${candidate.payload.cars.length} cars · C ${ui.money(candidate.payload.cash)}<br>${candidate.payload.unlocked} / 20 career events<br>Saved ${new Date(candidate.updatedAt).toLocaleString()}</p><p>This replaces your current profile. Export a backup first if you want to keep both.</p><div class="save-actions"><button class="primary" id="confirm-import">Import this save</button>${ui.button('Cancel', 'close-modal', '', 'secondary')}</div>`;
        dialog.showModal();
        document.querySelector('#confirm-import')!.addEventListener(
          'click',
          async () => {
            if (await this.repository.replace(candidate)) {
              this.save = candidate;
              this.ensureLoaner();
              accrueIdle(this.profile);
              dialog.close();
              this.render();
              await this.persist();
              this.toast('Save imported. Welcome back.');
            } else this.toast('Storage failed. Your active profile was kept.');
          },
          { once: true },
        );
      } catch (error) {
        this.toast(error instanceof Error ? error.message : 'This file could not be imported.');
      }
      target.value = '';
      return;
    }
    await this.persist();
  }
  private async startRace(context: RaceContext, owned: OwnedCar, rivals?: string[]): Promise<void> {
    if (this.loadingRace) return;
    this.loadingRace = true;
    const revision = ++this.viewRevision;
    let race: Race;
    try {
      const tier = carById.get(owned.id)!.class;
      race = new Race(
        structuredClone(owned),
        rivals ?? data.rivals.filter((r) => carById.get(r.carId)!.class === tier).map((r) => r.id),
        this.profile.settings.difficulty,
        Math.random,
        this.profile.settings.startMode ?? 'automatic',
      );
      await prepareCarSprites(
        [race.player.car, race.racers[1].car],
        undefined,
        () => revision === this.viewRevision,
      );
    } finally {
      this.loadingRace = false;
    }
    if (revision !== this.viewRevision) return;
    this.editor?.destroy();
    this.editor = undefined;
    this.editing = false;
    this.context = context;
    this.outcomePaid = false;
    this.race = race;
    const main = document.querySelector<HTMLElement>('#main')!;
    main.innerHTML = `<div class="page-heading race-heading"><div><div class="eyebrow">${context.type.toUpperCase()} / ${this.profile.settings.difficulty.toUpperCase()}</div><h1>${context.title}<span class="heading-dot">.</span></h1><p>¼ mile · ${carById.get(owned.id)!.name} · Featured rival: ${this.race.racers[1].name}</p></div>${ui.button('Pause <kbd>Esc</kbd>', 'pause', '', 'secondary')}</div><section class="panel race-panel"><div class="race-top"><span id="race-status">STAGING</span><div class="distance-bar"><i id="distance-fill"></i></div><span id="race-distance">0 / 402 M</span></div><canvas id="race-canvas" aria-label="Two lane drag race"></canvas><div class="race-feedback" id="race-feedback" role="status">Hold throttle to set launch RPM.</div>${instrumentCluster(this.profile.settings.gaugeStyle ?? 'classic')}</section><div class="race-controls">${ui.button('<kbd>Space</kbd><span>Throttle<small>Hold to rev · release to let RPM fall</small></span>', 'throttle', '', 'secondary control-launch')}${ui.button('<kbd>↑</kbd><span>Gear up<small>Engages first in manual-start mode</small></span>', 'shift', '', 'primary control-shift')}${ui.button('<kbd>N</kbd><span>Nitrous<small id="nitro-label">' + (this.race.player.nitroLeft ? 'Ready to use' : 'Install a system in the garage') + '</small></span>', 'nitro', '', 'secondary control-nitro', !this.race.player.nitroLeft)}</div><p class="race-note">Stage in neutral and use throttle to choose your RPM. Automatic start selects first on green; manual start waits for your gear-up input. Excess RPM creates wheelspin instead of a binary launch penalty.</p>`;
    this.renderer = new Renderer(document.querySelector<HTMLCanvasElement>('#race-canvas')!);
    window.scrollTo(0, 0);
    this.lastHud = 0;
    this.updateHud();
    let last = performance.now(),
      accumulator = 0;
    const frame = (now: number) => {
      if (!this.race) return;
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!this.race.paused && !document.hidden) {
        accumulator += delta;
        while (accumulator >= 1 / 120) {
          this.race.update(1 / 120);
          accumulator -= 1 / 120;
        }
      } else accumulator = 0;
      this.renderer?.race(this.race, this.profile.settings.reducedMotion);
      if (now - this.lastHud > 50) {
        this.updateHud();
        this.lastHud = now;
      }
      if (this.race.finished) {
        void this.finishRace();
        return;
      }
      this.frame = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(frame);
  }
  private raceAction(action: Action): void {
    if (!this.race || this.race.finished) return;
    if (action === 'pause') this.race.paused = !this.race.paused;
    else this.race[action]();
    this.updateHud();
  }
  private updateHud(): void {
    const race = this.race;
    if (!race) return;
    const player = race.player;
    const set = (id: string, text: string) => {
      const node = document.getElementById(id);
      if (node && node.textContent !== text) node.textContent = text;
    };
    set('speed', Math.round(player.speed * 3.6).toString());
    set('gear', player.gear === 0 ? 'N' : player.gear.toString());
    set('rpm', (player.rpm / 1000).toFixed(1));
    set('elapsed', player.elapsed.toFixed(3));
    set('redline-label', `RED ${(player.engine.redlineRpm / 1000).toFixed(1)}`);
    set('tach-max-label', (player.engine.tachMaxRpm / 1000).toFixed(0));
    set('cluster-slip', `${Math.round(player.wheelSlip * 100)}%`);
    set('cluster-traction', `${Math.round(player.traction * 100)}%`);
    set('cluster-throttle', player.launched || player.throttleHeld ? '100%' : '0%');
    set(
      'cluster-shift-target',
      `${Math.round(player.launched ? player.shiftTarget : (player.owned?.launch ?? player.engine.redlineRpm * 0.68))} RPM`,
    );
    set('cluster-curve', player.engine.curveSource === 'factory-ratings' ? 'FACTORY' : 'FALLBACK');
    const perimeterFill = document.getElementById('perimeter-rpm-fill') as unknown as SVGPathElement | null;
    if (perimeterFill) {
      const progress = Math.max(0, Math.min(100, (player.rpm / player.engine.tachMaxRpm) * 100));
      perimeterFill.style.strokeDasharray = `${progress} 100`;
    }
    set('race-distance', `${Math.floor(player.distance)} / 402 M`);
    const speedGauge = document.getElementById('speed-gauge');
    if (speedGauge)
      speedGauge.style.setProperty(
        '--needle-angle',
        `${-120 + Math.min(1, (player.speed * 3.6) / 320) * 240}deg`,
      );
    const tachGauge = document.getElementById('tach-gauge');
    if (tachGauge) {
      tachGauge.style.setProperty(
        '--needle-angle',
        `${-120 + Math.min(1, player.rpm / player.engine.tachMaxRpm) * 240}deg`,
      );
      const redlineStart = Math.min(239, (player.engine.redlineRpm / player.engine.tachMaxRpm) * 240);
      tachGauge.style.setProperty('--redline-start', `${redlineStart}deg`);
      const shiftError = Math.abs(player.rpm - player.shiftTarget) / Math.max(1, player.shiftTarget);
      tachGauge.classList.toggle('perfect', player.stats.shiftLight > 0 && shiftError <= 0.035);
      tachGauge.classList.toggle('redline', player.rpm >= player.engine.redlineRpm);
    }
    set(
      'race-status',
      race.finished
        ? 'FINISHED'
        : race.paused
          ? 'PAUSED'
          : race.time < 0
            ? 'STAGING'
            : player.finish
              ? 'FINISHED'
              : `POSITION ${race.place} / 4`,
    );
    set(
      'race-feedback',
      race.finished
        ? 'Race complete · your results are below'
        : race.paused
          ? 'Take your time. Resume when you’re ready.'
          : race.time < 0
            ? race.falseStart
              ? race.feedback
              : player.throttleHeld
                ? 'THROTTLE OPEN · RELEASE SPACE TO LET RPM FALL'
                : 'STAGING IN NEUTRAL · HOLD SPACE FOR THROTTLE'
            : !player.launched
              ? 'GREEN · PRESS GEAR UP TO ENGAGE FIRST'
              : player.finish
                ? 'Across the line. Waiting for the field…'
                : race.time < race.feedbackUntil
                  ? race.feedback
                  : player.wheelSlip > 0.16 && player.distance < 55
                    ? 'WHEELSPIN · GRIP IS BUILDING'
                    : player.rpm >= player.engine.redlineRpm
                      ? 'REDLINE · SHIFT UP'
                      : 'Build speed. Watch the tach and shift lights.',
    );
    const shiftError = Math.abs(player.rpm - player.shiftTarget) / Math.max(1, player.shiftTarget);
    set(
      'shift-label',
      !player.launched
        ? 'NEUTRAL'
        : player.rpm >= player.engine.redlineRpm
          ? 'REDLINE'
          : player.stats.shiftLight > 0 && shiftError <= 0.035
            ? 'SHIFT NOW'
            : 'SHIFT',
    );
    const shiftLightBar = document.getElementById('shift-lights');
    shiftLightBar?.classList.toggle('single', player.stats.shiftLight === 1);
    shiftLightBar?.classList.toggle('multi', player.stats.shiftLight === 2);
    const shiftLights = document.querySelectorAll<HTMLElement>('#shift-lights i');
    const lightProgress = Math.max(
      0,
      Math.min(1, (player.rpm - player.shiftTarget * 0.78) / Math.max(1, player.shiftTarget * 0.22)),
    );
    const litCount =
      player.stats.shiftLight === 2
        ? Math.ceil(lightProgress * shiftLights.length)
        : player.stats.shiftLight === 1 && player.rpm >= player.shiftTarget * 0.97
          ? shiftLights.length
          : 0;
    shiftLights.forEach((light, index) => {
      light.classList.toggle('available', player.stats.shiftLight > 0);
      light.classList.toggle('lit', index < litCount);
    });
    set(
      'nitro-label',
      player.stats.nitro
        ? `${player.nitroLeft.toFixed(1)} s ${player.nitroActive ? 'remaining' : 'ready'}`
        : 'Install a system in the garage',
    );
    const distance = document.getElementById('distance-fill');
    if (distance) distance.style.width = `${(player.distance / data.distance) * 100}%`;
    const raceControls = document.querySelector<HTMLElement>('.race-controls');
    if (raceControls) raceControls.classList.toggle('finished', race.finished);
    const pause = document.querySelector<HTMLButtonElement>('[data-action="pause"]');
    if (pause) {
      pause.innerHTML = `${race.paused ? 'Resume' : 'Pause'} <kbd>Esc</kbd>`;
      pause.disabled = race.finished;
    }
    const throttle = document.querySelector<HTMLButtonElement>('[data-action="throttle"]');
    if (throttle) throttle.disabled = player.launched || race.finished;
    const shiftButton = document.querySelector<HTMLButtonElement>('[data-action="shift"]');
    if (shiftButton)
      shiftButton.disabled =
        !!player.finish ||
        player.gear >= 6 ||
        (player.gear === 0 && race.startMode === 'automatic');
    const nitro = document.querySelector<HTMLButtonElement>('[data-action="nitro"]');
    if (nitro)
      nitro.disabled =
        !player.launched || player.nitroLeft <= 0 || player.nitroActive || !!player.finish;
  }
  private async finishRace(): Promise<void> {
    if (this.outcomePaid || !this.race || !this.context) return;
    this.outcomePaid = true;
    const race = this.race,
      player = race.player,
      context = this.context,
      place = race.place;
    let reward = 0;
    this.profile.races++;
    if (place === 1) this.profile.wins++;
    if (context.type === 'career')
      reward = careerReward(
        this.profile,
        data.events.find((e) => e.id === context.id)!,
        place,
        player.elapsed,
        player.trap,
      );
    if (context.type === 'job') {
      const job = data.jobs.find((j) => j.id === context.id)!;
      reward =
        job.participation +
        (place === 1
          ? job.bonus
          : Math.round(job.bonus * (place === 2 ? 0.5 : place === 3 ? 0.25 : 0)));
      this.profile.cash += reward;
    }
    this.updateHud();
    const sorted = [...race.racers].sort((a, b) => a.finish - b.finish);
    document
      .querySelector('#main')!
      .insertAdjacentHTML(
        'beforeend',
        `<section class="panel results timing-slip" id="race-results" tabindex="-1"><div class="results-heading"><div><span class="eyebrow">${place === 1 ? 'THAT’S HOW IT’S DONE' : place <= 3 ? 'ON THE PODIUM' : 'ANOTHER RUN, ANOTHER LESSON'}</span><h2>${place === 1 ? 'You took the win.' : `P${place}. Keep chasing.`}</h2><p>${context.type === 'career' ? (place <= 3 ? 'Next event unlocked. Your story continues.' : 'A podium unlocks the next event. Retry for free.') : context.type === 'job' ? 'Shift complete. Your payout is in the bank.' : 'Practice complete. Try a different setup or take on the ladder.'}</p></div><div class="result-reward">+ C ${ui.money(reward)}<span>RACE REWARD</span></div></div><div class="result-stats"><div><span>REACTION</span><strong>${player.launched ? player.reaction.toFixed(3) : '—'} <small>s</small></strong></div><div><span>ELAPSED TIME</span><strong>${player.elapsed.toFixed(3)} <small>s</small></strong></div><div><span>TRAP SPEED</span><strong>${player.trap.toFixed(1)} <small>km/h</small></strong></div><div><span>PERFECT SHIFTS</span><strong>${race.shifts.filter((s) => s === 'Perfect shift').length} <small>/ ${race.shifts.length}</small></strong></div></div><div class="strip-header"><span>FINISH ORDER</span><span>402 M DRAG STRIP / OFFICIAL TIMING</span></div><div class="standings drag-strip-results">${sorted.map((r, i) => `<div class="standing ${r === player ? 'is-player' : ''}"><strong>0${i + 1}</strong><span>${r.name}<small>${r.car.name}</small></span><span>${r.distance < data.distance ? 'DNF' : r.finish.toFixed(3) + ' s'}<small>TOTAL TIME</small></span></div>`).join('')}</div><div class="result-actions">${ui.button('Back to garage', 'nav', 'garage', 'secondary')}${ui.button('Run it back ↻', 'retry', '', 'secondary')}${ui.button('Continue career →', 'nav', 'career', 'primary')}</div></section>`,
      );
    document.querySelector<HTMLElement>('#race-results')?.focus({ preventScroll: true });
    document.querySelector('#race-results')?.scrollIntoView({
      behavior: this.profile.settings.reducedMotion ? 'instant' : 'smooth',
      block: 'start',
    });
    await this.persist();
    const balance = document.getElementById('balance');
    if (balance) balance.textContent = ui.money(this.profile.cash);
  }
  private stopRace(): void {
    this.viewRevision++;
    cancelAnimationFrame(this.frame);
    this.race = undefined;
    this.renderer = undefined;
  }
}

void new App().start().catch((error) => {
  document.querySelector('#app')!.textContent =
    `Unable to start Redline: ${error instanceof Error ? error.message : 'Unknown error'}`;
});
