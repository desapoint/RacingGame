import { carById, data, partById } from '../data/config';
import { statsFor } from '../game/garage';
import { eligible } from '../game/economy';
import type { OwnedCar, Profile, Screen, Slot } from '../types';

import { money, escape, button, tag } from './format';
export { money, escape, button } from './format';
export const difficultySelect = (p: Profile) =>
  `<label class="difficulty">Difficulty <select aria-label="Race difficulty" id="difficulty">${['easy', 'normal', 'hard'].map((mode) => `<option value="${mode}" ${p.settings.difficulty === mode ? 'selected' : ''}>${mode[0].toUpperCase() + mode.slice(1)}</option>`).join('')}</select></label>`;
export function shell(p: Profile, screen: Screen, status: string): string {
  const items = [
    ['garage', '◉', 'Garage'],
    ['career', '⚑', 'Career'],
    ['dealership', '▰', 'Dealership'],
    ['jobs', '⌘', 'Jobs & workshop'],
    ['settings', '⚙', 'Settings'],
  ];
  return `<aside class="sidebar"><a href="#garage" data-action="nav" data-id="garage" class="brand" aria-label="Redline home"><span class="brand-mark">R<span> /</span></span><span>REDLINE<small>DRAG CLUB</small></span></a><div class="nav-label">YOUR NEXT PERSONAL BEST.</div><nav aria-label="Main navigation">${items.map(([id, icon, label]) => `<button data-action="nav" data-id="${id}" class="nav-item ${screen === id ? 'active' : ''}" ${screen === id ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${icon}</span>${label}${screen === id ? '<span class="nav-dot"></span>' : ''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="club-card"><span class="online-dot"></span> THE MIDNIGHT CLUB<p>Good cars.<br>Better competition.</p><span class="tiny">¼ MILE. ALL HEART.</span></div><span class="version">V1.0 &nbsp; / &nbsp; OFFLINE READY</span></div></aside><div class="workspace"><header class="topbar"><span class="breadcrumb">THE CLUB <span>/</span> ${items.find((i) => i[0] === screen)?.[2].toUpperCase()}</span><div class="account"><span class="balance-label">YOUR BALANCE</span><span class="credit-icon">C</span><strong id="balance">${money(p.cash)}</strong><div class="avatar" title="Local driver profile">DR</div></div></header><main id="main"></main><footer><span class="save-status" id="save-status">● ${escape(status)}</span><span>NO ENTRY FEES. NO LIMITS.</span></footer></div><div class="toast" id="toast" role="status" hidden></div><dialog id="modal"></dialog>`;
}
export function garage(p: Profile, owned: OwnedCar, editor: boolean): string {
  const car = carById.get(owned.id)!,
    stats = statsFor(car, owned),
    division = data.classes[car.class],
    next = data.events[Math.min(p.unlocked, data.events.length - 1)];
  const unavailable = p.cars.filter((c) => !carById.has(c.id));
  return `<div class="page-heading"><div><div class="eyebrow">MAKE IT YOURS</div><h1>The garage<span class="heading-dot">.</span></h1><p>Your car. Your setup. Your next win.</p></div><label class="car-select">CURRENT RIDE<select id="car-select" aria-label="Current car">${p.cars
    .filter((c) => carById.has(c.id))
    .map(
      (c) =>
        `<option value="${c.id}" ${c.id === owned.id ? 'selected' : ''}>${carById.get(c.id)!.name}</option>`,
    )
    .join(
      '',
    )}</select></label></div>${unavailable.length ? `<div class="notice">${unavailable.length} unavailable car ID(s) preserved in your save.</div>` : ''}<div class="garage-layout"><section class="car-showcase panel"><div class="showcase-title"><div>${tag(`${division.name.toUpperCase()} CLASS · ${car.era === 'classic' ? 'CLASSIC' : car.year}`)}<h2>${car.name}</h2><p>${car.tagline}</p>${button('Specs & condition ↗', 'specs', car.id, 'text-button')}</div><span class="serial">${String(data.cars.indexOf(car) + 1).padStart(2, '0')}<small>/ ${data.cars.length}</small></span></div><canvas id="garage-canvas" aria-label="Side view of your ${car.name}. ${editor ? 'Draw a livery with a pointer.' : ''}"></canvas><div class="car-specs">${[
    ['POWER', stats.power, 'HP'],
    ['WEIGHT', money(stats.mass), 'KG'],
    ['RACE SPEED', Math.round(stats.maxSpeed * 3.6), 'KM/H'],
    ['RACE GEARS', '6', 'SPEED'],
  ]
    .map(
      ([label, value, unit]) =>
        `<div><span>${label}</span><strong>${value} <small>${unit}</small></strong></div>`,
    )
    .join(
      '',
    )}</div></section><aside class="garage-side"><section class="next-race panel"><div class="eyebrow">${p.unlocked === 20 ? 'CAREER COMPLETE' : 'UP NEXT / CAREER'}</div><div class="race-art"><span class="road-line"></span><span class="finish-flag">▦</span><span class="track-label">402 M</span></div>${tag(data.classes[next.division].name.toUpperCase())}<h2>${next.name}</h2><p>${next.final ? 'Division final' : 'Round ' + ((p.unlocked % 5) + 1)} · Quarter mile · 4 drivers</p><div class="reward-line"><span>WINNER’S PURSE</span><strong><span class="credit-icon">C</span> ${money(next.reward)}</strong></div>${button('Go to career <span>↗</span>', 'nav', 'career', 'primary wide')}</section><section class="quick-race panel"><div><h3>Just you and the strip.</h3><p>Practice with your current setup.</p></div>${button('Quick race <span>→</span>', 'quick', '', 'text-button')}</section></aside></div><div class="section-heading"><h2>Under the hood</h2><span>SMALL CHANGES. BIG DIFFERENCE.</span></div><div class="upgrade-grid">${(
    ['engine', 'transmission', 'tires', 'nitro', 'weight'] as Slot[]
  )
    .map((slot) => {
      const installed = partById.get(owned.parts[slot] ?? '');
      const unavailable = !!owned.parts[slot] && !installed;
      const nextPart = data.parts.find(
        (part) => part.slot === slot && part.level === (installed?.level ?? 0) + 1,
      );
      return `<section class="upgrade-card panel"><div class="upgrade-top"><span class="part-icon">${{ engine: '▤', transmission: '⌘', tires: '◉', nitro: 'ϟ', weight: '≋', electronics: '●' }[slot]}</span><span class="stage">${unavailable ? 'UNAVAILABLE' : installed ? 'STAGE ' + installed.level : 'STOCK'}</span></div><h3>${{ engine: 'Engine', transmission: 'Transmission', tires: 'Tires', nitro: 'Nitrous', weight: 'Weight reduction', electronics: 'Shift light' }[slot]}</h3><p>${unavailable ? 'Unknown part · preserved in save' : installed ? installed.name : slot === 'nitro' ? 'No system installed' : slot === 'electronics' ? 'No shift light installed' : 'Factory specification'}</p><div class="level-bars">${Array.from({ length: slot === 'electronics' ? 2 : 3 }, (_, index) => index + 1).map((i) => `<i class="${i <= (installed?.level ?? 0) ? 'filled' : ''}"></i>`).join('')}</div>${nextPart ? button(nextPart.minClass > car.class ? `Requires ${data.classes[nextPart.minClass].name}` : `Upgrade <span> C ${money(nextPart.price)}</span>`, 'part', nextPart.id, 'upgrade-button', unavailable || nextPart.minClass > car.class || p.cash < nextPart.price) : '<span class="maxed">Fully upgraded ✓</span>'}</section>`;
    })
    .join(
      '',
    )}</div><div class="setup-grid"><section class="panel setup-panel"><div class="section-heading"><h2>Fine tune</h2>${tag('FREE')}</div><label class="range-label" for="launch-tune">Launch reference <strong id="launch-value">${owned.launch} RPM</strong></label><input type="range" id="launch-tune" min="${data.tuning.launch.min}" max="${data.tuning.launch.max}" step="100" value="${owned.launch}"><div class="range-ends"><span>LOWER TARGET</span><span>HIGHER TARGET</span></div><p class="hint">This is a reference marker only. At the tree, hold Space to raise RPM and release it to let the engine fall naturally.</p><label class="range-label" for="drive-tune">Final drive <strong id="drive-value">${owned.drive.toFixed(2)}</strong></label><input type="range" id="drive-tune" min="${data.tuning.drive.min}" max="${data.tuning.drive.max}" step="0.05" value="${owned.drive}"><div class="range-ends"><span>TOP SPEED</span><span>ACCELERATION</span></div></section><section class="panel setup-panel"><div class="section-heading"><h2>Make a statement</h2>${tag('PAINT SHOP')}</div><div class="paint-controls"><label>Body<input id="body-color" type="color" value="${owned.paint}"></label><label>Lower trim<input id="accent-color" type="color" value="${owned.accent}"></label><label>Wheels<select id="wheels"><option value="0" ${owned.wheels === 0 ? 'selected' : ''}>Factory wheels</option><option value="1" ${owned.wheels === 1 ? 'selected' : ''}>Mesh / bronze</option><option value="2" ${owned.wheels === 2 ? 'selected' : ''}>Factory / black</option></select></label></div><div class="livery-tools">${button(editor ? 'Done drawing ✓' : 'Draw a livery ↗', 'editor', '', 'secondary')}${editor ? `<label class="ink-label">Ink<input type="color" id="ink-color" value="#f4efdd"></label>` : ''}${button('Undo mark', 'undo', '', 'text-button', !owned.marks.length)}${button('Clear', 'clear-livery', '', 'text-button', !owned.marks.length)}</div><p class="hint">${editor ? 'Draw directly on the car above. Up to 80 strokes.' : 'Paint and liveries are free. Your style shouldn’t cost a win.'}</p></section></div>`;
}
export function career(p: Profile, owned: OwnedCar): string {
  return `<div class="page-heading"><div><div class="eyebrow">EARN YOUR PLACE</div><h1>The ladder<span class="heading-dot">.</span></h1><p>Four divisions. Twenty races. One name at the top.</p></div>${difficultySelect(p)}</div><div class="career-summary panel"><div><span class="eyebrow">CAREER PROGRESS</span><h2>${p.unlocked} <small>/ 20 events cleared</small></h2></div><div class="career-progress"><i style="width:${p.unlocked * 5}%"></i></div><div><strong>${p.wins}</strong><span>WINS</span></div><div><strong>${p.races}</strong><span>STARTS</span></div></div><p class="hint career-hint">Podium finishes unlock the next event. Each event ranks four drivers; your featured rival runs beside you. Retries are always free.</p>${data.classes
    .map(
      (division, tier) =>
        `<section class="division"><div class="section-heading"><h2><span class="division-number">0${tier + 1}</span> ${division.name}</h2><span>${division.subtitle}</span></div><div class="event-grid">${data.events
          .filter((event) => event.division === tier)
          .map((event) => {
            const index = data.events.indexOf(event),
              locked = index > p.unlocked,
              record = p.results[event.id],
              restriction = eligible(event, owned);
            return `<article class="event-card panel ${locked ? 'locked' : ''} ${index === p.unlocked ? 'current' : ''}"><div class="event-top"><span>${String((index % 5) + 1).padStart(2, '0')} / ${event.final ? 'FINAL' : 'ROUND'}</span>${record ? tag('P' + record.place, 'green') : locked ? '<span>LOCKED</span>' : tag('UP NEXT')}</div><div class="event-road"><i></i>${event.final ? '▦' : '↗'}</div><h3>${event.name}</h3><p>${division.name} class · Stage ${event.maxPartLevel} max</p><strong class="event-prize">C ${money(event.reward)}</strong><span class="event-best">${record ? `BEST ${record.elapsed.toFixed(3)} s` : '402 M / QUARTER MILE'}</span>${button(locked ? 'Win a podium to unlock' : (restriction ?? (record ? 'Race again →' : 'Race event →')), 'event', event.id, index === p.unlocked ? 'primary' : 'secondary', locked || !!restriction)}</article>`;
          })
          .join('')}</div></section>`,
    )
    .join('')}`;
}
export function jobs(p: Profile): string {
  const facility = data.idle[p.idle.level],
    next = data.idle[p.idle.level + 1];
  return `<div class="page-heading"><div><div class="eyebrow">KEEP THE WHEELS TURNING</div><h1>After hours<span class="heading-dot">.</span></h1><p>A fresh start is always one race away.</p></div>${difficultySelect(p)}</div><div class="jobs-grid">${data.jobs.map((job, i) => `<article class="panel job-card"><span class="job-number">0${i + 1}</span>${tag(i === 0 ? 'FREE LOANER' : 'YOUR CURRENT CAR')}<h2>${job.name}</h2><p>${job.description}</p><div class="job-payout"><div><span>EVERY FINISH</span><strong>C ${money(job.participation)}</strong></div><div><span>WIN BONUS</span><strong>+ ${money(job.bonus)}</strong></div></div>${button('Clock in & race ↗', 'job', job.id, 'primary wide')}<p class="hint">No entry fee. No repairs. Paid even when you lose.</p></article>`).join('')}</div><section class="panel workshop"><div><div class="eyebrow">A LITTLE SOMETHING ON THE SIDE</div><h2>${facility.name}</h2><p>Your crew keeps things moving while you’re away.</p><span class="tag">LEVEL ${p.idle.level + 1} / ${data.idle.length}</span></div><div class="workshop-bank"><span>READY TO COLLECT</span><strong>C ${money(p.idle.bank)}</strong><p>${facility.rate} credits / hour · ${facility.capacity} capacity</p>${button('Collect credits', 'claim', '', 'primary', p.idle.bank < 1)}</div><div class="workshop-upgrade">${next ? `<h3>${next.name}</h3><p>${next.rate} / hour · ${next.capacity} capacity</p>${button(`Expand · C ${money(next.price)}`, 'facility', '', 'secondary', p.cash < next.price)}` : '<h3>Fully expanded</h3><p>Your crew has everything they need.</p>'}<p class="hint">Offline time is capped at 12 hours.</p></div></section>`;
}
export function settings(p: Profile, status: string, recovery: boolean): string {
  return `<div class="page-heading"><div><div class="eyebrow">YOUR RULES</div><h1>In the details<span class="heading-dot">.</span></h1><p>Make yourself at home. Take your progress with you.</p></div></div><div class="settings-grid"><section class="panel setup-panel"><h2>Driving preferences</h2><p>Difficulty changes rival pace. Rewards stay the same.</p>${difficultySelect(p)}<label class="difficulty">Start control <select aria-label="Start control mode" id="start-mode"><option value="automatic" ${(p.settings.startMode ?? 'automatic') === 'automatic' ? 'selected' : ''}>Auto first on green</option><option value="manual" ${p.settings.startMode === 'manual' ? 'selected' : ''}>Manual first gear</option></select></label><label class="checkbox-label"><input id="reduced-motion" type="checkbox" ${p.settings.reducedMotion ? 'checked' : ''}> Reduced motion <span>Disable track scrolling and wheel rotation.</span></label><h3>The controls</h3><div class="control-guide"><span><kbd>Space</kbd> Hold throttle while staging</span><span><kbd>↑</kbd> / <kbd>Shift</kbd> Gear up / engage first in manual mode</span><span><kbd>N</kbd> Use nitrous</span><span><kbd>Esc</kbd> Pause / resume</span></div><p class="hint">Shift timing follows each car’s power band. Optional shift-light equipment gives single-lamp or progressive timing guidance. The launch marker is a reference; staged RPM is controlled directly. On-screen buttons work with touch.</p></section><section class="panel setup-panel"><h2>Your progress, safely kept</h2><p class="storage-state">${escape(status)}</p><p>Autosaves stay in this browser. When playing from a local file, browser storage can vary. Export a backup to keep or move your progress.</p><div class="save-actions">${button('Export save ↓', 'export', '', 'primary')}<label class="button secondary import-label">Import save ↑<input id="import-save" type="file" accept="application/json,.json"></label></div>${recovery ? `<div class="notice">A stored save could not be loaded. Autosave is paused to preserve it.</div>${button('Export original for recovery', 'recovery', '', 'secondary')}${button('Use this session as new save', 'recover-new', '', 'text-button')}` : ''}<p class="hint">Imports are validated and previewed before replacing your current profile. V1 uses save schema 1.</p><div class="reset-zone"><h3>Reset progression</h3><p>Start over from the original starter car and starting credits. This removes every local unlock, purchase, tune, result, workshop level, statistic, preference, and save identifier.</p>${button('Reset all progression', 'reset-progression', '', 'danger')}</div></section></div><section class="panel about"><span class="brand-word">REDLINE /</span><p>A small game for big evenings.<br>Canvas 2D · No account · No network required</p><span class="tiny">VERSION 0.1.0</span></section>`;
}
