import { data, carById, partById } from '../data/config';
import { createOwned } from '../game/garage';
import type { SaveEnvelope } from '../types';

const KEY = 'redline.profile.v1';
const finite = (v: unknown, min = 0, max = 1e12): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const textId = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v);
const color = (v: unknown) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

export function freshSave(now = Date.now()): SaveEnvelope {
  return {
    format: 'redline-save',
    schemaVersion: 1,
    appVersion: '0.1.0',
    saveId: globalThis.crypto?.randomUUID?.() ?? `save-${now}-${Math.floor(Math.random() * 1e9)}`,
    createdAt: now,
    updatedAt: now,
    payload: {
      cash: data.startCash,
      cars: [createOwned(carById.get(data.starter)!)],
      selected: data.starter,
      unlocked: 0,
      results: {},
      settings: { difficulty: 'normal', reducedMotion: false },
      idle: { level: 0, bank: 0, lastSeen: now },
      races: 0,
      wins: 0,
    },
  };
}
export function validateSave(value: unknown): asserts value is SaveEnvelope {
  const fail = () => {
    throw new Error(
      'The save is invalid or uses an unsupported format. Your existing save has been preserved.',
    );
  };
  if (!value || typeof value !== 'object') fail();
  const save = value as SaveEnvelope;
  if (
    save.format !== 'redline-save' ||
    save.schemaVersion !== 1 ||
    !textId(save.saveId) ||
    typeof save.appVersion !== 'string' ||
    save.appVersion.length > 80 ||
    !finite(save.createdAt, 0, 8.64e15) ||
    !finite(save.updatedAt, 0, 8.64e15)
  )
    fail();
  const p = save.payload;
  if (
    !p ||
    !finite(p.cash) ||
    !Number.isInteger(p.unlocked) ||
    p.unlocked < 0 ||
    p.unlocked > data.events.length ||
    !Array.isArray(p.cars) ||
    p.cars.length < 1 ||
    p.cars.length > 200 ||
    !textId(p.selected) ||
    !p.cars.some((c) => c?.id === p.selected)
  )
    fail();
  if (new Set(p.cars.map((c) => c.id)).size !== p.cars.length) fail();
  for (const car of p.cars) {
    if (
      !car ||
      !textId(car.id) ||
      !color(car.paint) ||
      !color(car.accent) ||
      !finite(car.launch, data.tuning.launch.min, data.tuning.launch.max) ||
      !finite(car.drive, data.tuning.drive.min, data.tuning.drive.max) ||
      !Number.isInteger(car.wheels) ||
      car.wheels < 0 ||
      car.wheels > 2 ||
      !Array.isArray(car.marks) ||
      car.marks.length > 80 ||
      !car.parts ||
      typeof car.parts !== 'object' ||
      Array.isArray(car.parts)
    )
      fail();
    for (const [slot, id] of Object.entries(car.parts)) {
      if (!['engine', 'transmission', 'tires', 'nitro', 'weight'].includes(slot) || !textId(id))
        fail();
      const part = partById.get(id!);
      if (part && (part.slot !== slot || part.minClass > (carById.get(car.id)?.class ?? 3))) fail();
    }
    for (const mark of car.marks) {
      if (
        !mark ||
        !color(mark.color) ||
        !finite(mark.width, 1, 20) ||
        !Array.isArray(mark.points) ||
        mark.points.length < 1 ||
        mark.points.length > 500
      )
        fail();
      for (const point of mark.points)
        if (
          !Array.isArray(point) ||
          point.length !== 2 ||
          !finite(point[0], 0, 800) ||
          !finite(point[1], 0, 300)
        )
          fail();
    }
  }
  if (
    !p.settings ||
    !['easy', 'normal', 'hard'].includes(p.settings.difficulty) ||
    typeof p.settings.reducedMotion !== 'boolean'
  )
    fail();
  if (
    !p.idle ||
    !Number.isInteger(p.idle.level) ||
    !data.idle[p.idle.level] ||
    !finite(p.idle.bank, 0, data.idle[p.idle.level].capacity) ||
    !finite(p.idle.lastSeen, 0, 8.64e15) ||
    !finite(p.races) ||
    !finite(p.wins) ||
    !Number.isInteger(p.races) ||
    !Number.isInteger(p.wins) ||
    p.wins > p.races
  )
    fail();
  if (
    !p.results ||
    typeof p.results !== 'object' ||
    Array.isArray(p.results) ||
    Object.keys(p.results).length > 500
  )
    fail();
  for (const [id, record] of Object.entries(p.results))
    if (
      !textId(id) ||
      !record ||
      !Number.isInteger(record.place) ||
      record.place < 1 ||
      record.place > 4 ||
      !finite(record.elapsed, 0, 1000) ||
      !finite(record.speed, 0, 2000)
    )
      fail();
}
// Schema 1 is the first public format. Future migrations are added by source version,
// operating on a clone; storage is written only after the full chain validates.
const migrations: Record<number, (value: unknown) => unknown> = {};
export function parseSave(raw: string): SaveEnvelope {
  if (raw.length > 2_000_000) throw new Error('Save exceeds the 2 MB limit.');
  let candidate = JSON.parse(raw);
  const seen = new Set<number>();
  while (candidate?.schemaVersion < 1 && migrations[candidate.schemaVersion]) {
    if (seen.has(candidate.schemaVersion)) throw new Error('Save migration did not advance.');
    seen.add(candidate.schemaVersion);
    candidate = migrations[candidate.schemaVersion](structuredClone(candidate));
  }
  validateSave(candidate);
  return candidate;
}

export class SaveRepository {
  status = 'Opening save…';
  recovery: string | null = null;
  blocked = false;
  private db: IDBDatabase | null = null;
  private queue = Promise.resolve();
  private async database(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('redline-drag-club', 1);
      const timeout = setTimeout(() => reject(new Error('Storage timed out')), 2500);
      request.onupgradeneeded = () => request.result.createObjectStore('saves');
      request.onsuccess = () => {
        clearTimeout(timeout);
        this.db = request.result;
        resolve(request.result);
      };
      request.onerror = () => {
        clearTimeout(timeout);
        reject(request.error);
      };
      request.onblocked = () => {
        clearTimeout(timeout);
        reject(new Error('Storage is busy in another tab'));
      };
    });
  }
  private async idb(mode: IDBTransactionMode, value?: string): Promise<string | undefined> {
    const db = await this.database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', mode),
        store = tx.objectStore('saves');
      const request = mode === 'readwrite' ? store.put(value, KEY) : store.get(KEY);
      tx.oncomplete = () => resolve(mode === 'readonly' ? request.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Save transaction aborted'));
    });
  }
  async load(): Promise<SaveEnvelope> {
    const candidates: string[] = [];
    let available = false;
    try {
      const raw = await this.idb('readonly');
      if (raw) candidates.push(raw);
      available = true;
    } catch {
      /* Try local storage. */
    }
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) candidates.push(raw);
      available = true;
    } catch {
      /* Memory-only mode remains usable. */
    }
    const valid: SaveEnvelope[] = [];
    for (const raw of candidates) {
      try {
        valid.push(parseSave(raw));
      } catch {
        this.recovery = raw;
        this.blocked = true;
      }
    }
    this.status = this.blocked
      ? 'Save needs recovery · export original in Settings'
      : available
        ? 'Autosave ready'
        : 'Storage unavailable · export to keep progress';
    return valid.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? freshSave();
  }
  async write(save: SaveEnvelope): Promise<boolean> {
    if (this.blocked) return false;
    validateSave(save);
    save.updatedAt = Date.now();
    const raw = JSON.stringify(save);
    let success = false;
    this.queue = this.queue.then(async () => {
      try {
        await this.idb('readwrite', raw);
        // Remove stale fallback only after a successful primary commit.
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* No fallback storage access. */
        }
        this.status = 'Saved on this device';
        success = true;
      } catch {
        try {
          localStorage.setItem(KEY, raw);
          this.status = 'Saved · browser fallback';
          success = true;
        } catch {
          this.status = 'Save failed · export to keep progress';
        }
      }
    });
    await this.queue;
    return success;
  }
  async replace(save: SaveEnvelope): Promise<boolean> {
    validateSave(save);
    const wasBlocked = this.blocked;
    this.blocked = false;
    const success = await this.write(save);
    if (success) this.recovery = null;
    else this.blocked = wasBlocked;
    return success;
  }
  async reset(): Promise<SaveEnvelope | null> {
    const next = freshSave();
    return (await this.replace(next)) ? next : null;
  }
}
export function downloadSave(contents: string, name = 'redline-save.json'): void {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
