import { data, modelById } from '../data/config';
import type { CarDef, Profile, VehicleCategory, VehicleCondition } from '../types';
import { button, escape, money, tag } from './format';

export const categoryLabels: Record<VehicleCategory, string> = {
  suv: 'SUV & crossover',
  sedan: 'Sedan',
  hatchback: 'Hatchback',
  wagon: 'Wagon',
  minivan: 'Minivan',
  pickup: 'Pickup',
  coupe: 'Coupe',
  convertible: 'Convertible',
};
export const conditionLabels: Record<VehicleCondition, string> = {
  standard: 'Standard',
  used: 'Neglected / used',
  rusty: 'Rusty / battered',
};
export interface DealerFilters {
  search: string;
  category: string;
  condition: string;
  sort: string;
  page: number;
}
export const initialDealerFilters = (): DealerFilters => ({
  search: '',
  category: 'all',
  condition: 'standard',
  sort: 'roster',
  page: 0,
});
export const PAGE_SIZE = 12;
export function dealerSelection(filters: DealerFilters): {
  cars: CarDef[];
  count: number;
  page: number;
  pages: number;
} {
  const words = filters.search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const cars = data.cars.filter((car) => {
    const model = modelById.get(car.modelId ?? car.id);
    const text =
      `${car.name} ${model?.segment ?? ''} ${model?.engine ?? ''} ${car.category ?? ''}`.toLowerCase();
    return (
      (filters.category === 'all' || car.category === filters.category) &&
      (filters.condition === 'all' || (car.condition ?? 'standard') === filters.condition) &&
      words.every((word) => text.includes(word))
    );
  });
  if (filters.sort === 'price')
    cars.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  if (filters.sort === 'power')
    cars.sort((a, b) => b.power - a.power || a.name.localeCompare(b.name));
  if (filters.sort === 'name') cars.sort((a, b) => a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(cars.length / PAGE_SIZE));
  const page = Math.min(Math.max(0, filters.page), pages - 1);
  return {
    cars: cars.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    count: cars.length,
    page,
    pages,
  };
}
const options = (entries: [string, string][], selected: string) =>
  entries
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === selected ? 'selected' : ''}>${escape(label)}</option>`,
    )
    .join('');
export function dealership(p: Profile, filters: DealerFilters): string {
  const selection = dealerSelection(filters);
  const modelCount = new Set(data.cars.map((car) => car.modelId ?? car.id)).size;
  return `<div class="page-heading"><div><div class="eyebrow">FIND YOUR NEXT CHAPTER</div><h1>Fresh metal<span class="heading-dot">.</span></h1><p>${modelCount} models · ${data.cars.length} cars. Family haulers to weekend favorites.</p></div></div>
  <section class="dealer-filters panel" aria-label="Filter cars">
    <label class="dealer-search">Find a car<input id="dealer-search" type="search" value="${escape(filters.search)}" placeholder="Model, engine or category"></label>
    <label>Category<select id="dealer-category">${options([['all', 'Every category'], ...Object.entries(categoryLabels)], filters.category)}</select></label>
    <label>Condition<select id="dealer-condition">${options([['all', 'Every condition'], ...Object.entries(conditionLabels)], filters.condition)}</select></label>
    <label>Sort<select id="dealer-sort">${options(
      [
        ['roster', 'Roster order'],
        ['price', 'Price: low to high'],
        ['power', 'Power: high to low'],
        ['name', 'Model name'],
      ],
      filters.sort,
    )}</select></label>
  </section><div class="dealer-summary"><span>${selection.count} matching cars · Page ${selection.page + 1} of ${selection.pages}</span><span id="car-loading" role="status"></span></div>
  <div class="dealer-grid">${selection.cars
    .map((car) => {
      const owned = p.cars.some((c) => c.id === car.id),
        locked = car.class > Math.floor(p.unlocked / 5);
      const condition = car.condition ?? 'standard';
      const model = modelById.get(car.modelId ?? car.id);
      return `<article class="dealer-card panel">${tag(`${data.classes[car.class].name.toUpperCase()} · ${car.category ? categoryLabels[car.category] : car.year}`)}
      <canvas class="dealer-canvas" data-car="${car.id}" width="800" height="300" aria-label="${escape(car.name)}"></canvas>
      <div class="dealer-details"><div class="condition-label condition-${condition}">${conditionLabels[condition]}</div><h2>${escape(car.name)}</h2><p>${escape(model?.segment ?? car.tagline)}</p>
      <div class="dealer-stats"><span>${car.power} HP</span><span>${money(car.mass)} KG</span><span>${Math.round(car.maxSpeed * 3.6)} KM/H</span></div>
      ${button('Specs & condition ↗', 'specs', car.id, 'secondary wide spec-button')}
      ${button(owned ? (p.selected === car.id ? 'Selected ✓' : 'Select car →') : locked ? 'Complete previous division' : `Buy car <span>C ${money(car.price)}</span>`, 'buy-car', car.id, owned ? 'secondary wide' : 'primary wide', locked || (!owned && p.cash < car.price) || p.selected === car.id)}
      </div></article>`;
    })
    .join(
      '',
    )}</div>${selection.count ? '' : '<div class="panel empty-roster">No matching cars. Try another category, condition, or search.</div>'}
  <nav class="dealer-pagination" aria-label="Car pages">${button('← Previous', 'dealer-page', String(selection.page - 1), 'secondary', selection.page === 0)}<span>${selection.page + 1} / ${selection.pages}</span>${button('Next →', 'dealer-page', String(selection.page + 1), 'secondary', selection.page + 1 >= selection.pages)}</nav>`;
}
