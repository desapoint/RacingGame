import { data, modelById } from '../data/config';
import { statsFor } from '../game/garage';
import type { CarDef, OwnedCar } from '../types';
import { button, escape, money } from './format';
import { categoryLabels, conditionLabels } from './dealership';

export function vehicleSpecs(car: CarDef, owned?: OwnedCar): string {
  const model = modelById.get(car.modelId ?? car.id);
  const stats = statsFor(car, owned);
  const condition = car.condition ?? 'standard';
  const variants = data.cars.filter(
    (item) => (item.modelId ?? item.id) === (car.modelId ?? car.id),
  );
  const number = (value: number | null | undefined, unit: string) =>
    value == null ? 'Not verified in source' : `${money(value)} ${unit}`;
  const rows: [string, string][] = model
    ? [
        ['Model year / market', `${model.year} · ${model.market}`],
        ['Make / model', `${model.make} ${model.model}`],
        ['Trim', model.trim],
        ['Category', `${categoryLabels[model.category]} · ${model.segment}`],
        ['Engine / motor', model.engine],
        ['Energy', model.fuel],
        ['Drivetrain', model.drivetrain],
        ['Transmission', model.transmission],
        ['Seats / doors', `${model.seats} seats · ${model.doors} doors`],
        ['Factory power', number(model.powerHp, 'hp')],
        ['Factory torque', number(model.torqueNm, 'Nm')],
        ['Curb weight', number(model.curbWeightKg, 'kg')],
        ...(model.lengthMm ? [['Length', number(model.lengthMm, 'mm')] as [string, string]] : []),
        ...(model.wheelbaseMm
          ? [['Wheelbase', number(model.wheelbaseMm, 'mm')] as [string, string]]
          : []),
      ]
    : [
        ['Model year', String(car.year)],
        ['Category', car.category ? categoryLabels[car.category] : 'Car'],
      ];
  return `<div class="spec-heading"><div><div class="eyebrow">VEHICLE DOSSIER</div><h2 id="spec-title">${escape(car.name)}</h2></div>${button('Close ✕', 'close-modal', '', 'secondary')}</div><p class="condition-label condition-${condition}">${conditionLabels[condition]}</p>
    <h3>Factory specification</h3><dl class="spec-sheet">${rows.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
    ${model?.notes ? `<p class="hint">${escape(model.notes)}</p>` : ''}
    <h3>On the strip</h3><p>${condition === 'standard' ? 'Standard condition, ready to race.' : condition === 'used' ? 'Neglected maintenance: reduced output and traction, with slower shifts.' : 'Severe wear and rust: substantial power loss, tired tires and a sluggish transmission.'} ${owned ? 'Your installed upgrades are included below.' : 'These are the stock game values for this condition.'}</p>
    <div class="spec-game-stats"><span><strong>${stats.power} hp</strong>Available power</span><span><strong>${stats.acceleration.toFixed(2)} m/s²</strong>Base acceleration</span><span><strong>${Math.round(stats.maxSpeed * 3.6)} km/h</strong>Game speed ceiling</span><span><strong>${Math.round(stats.grip * 100)}%</strong>Grip rating</span><span><strong>${stats.shiftTime.toFixed(2)} s</strong>Shift time</span></div>
    ${variants.length > 1 ? `<h3>Compare conditions</h3><div class="spec-table-scroll"><table class="condition-table"><thead><tr><th>Condition</th><th>Power</th><th>Acceleration</th><th>Speed</th><th>Grip</th><th>Price</th></tr></thead><tbody>${variants.map((item) => `<tr ${item.id === car.id ? 'class="selected-condition"' : ''}><th>${conditionLabels[item.condition ?? 'standard']}</th><td>${item.power} hp</td><td>${item.acceleration.toFixed(2)} m/s²</td><td>${Math.round(item.maxSpeed * 3.6)} km/h</td><td>${Math.round((item.grip ?? 1) * 100)}%</td><td>C ${money(item.price)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <p class="hint">Condition losses, speed ceilings, prices and race performance are game estimates. Factory figures describe the original model. Every car uses the game's six-speed race controls. Game mass: ${Math.round(stats.mass)} kg${model?.curbWeightKg == null ? ' (estimated)' : ''}. Door counts exclude rear hatches and tailgates.</p>
    ${model ? `<details class="spec-sources"><summary>Specification sources</summary><ul>${model.sources.map((source) => `<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)}</a></li>`).join('')}</ul></details>` : ''}
    <div class="save-actions">${button('Back to cars', 'close-modal', '', 'primary')}</div>`;
}
