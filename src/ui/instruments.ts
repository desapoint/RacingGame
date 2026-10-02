import type { GaugeStyle } from '../types';

export const gaugeStyles: { id: GaugeStyle; name: string; description: string }[] = [
  { id: 'classic', name: 'Classic analog', description: 'Twin analog speed and RPM gauges with shift lights.' },
  { id: 'analog-digital-mix', name: 'Digital / analog mix', description: 'Large analog tach with digital speed, gear and live traction data.' },
  { id: 'rect-24', name: 'Rectangular perimeter 24', description: 'Fine segmented RPM path around the left, top and right edges.' },
  { id: 'rect-16', name: 'Rectangular perimeter 16', description: 'Chunkier segmented RPM perimeter with smooth curved corners.' },
  { id: 'rect-8', name: 'Rectangular perimeter 8', description: 'Eight large perimeter stages with rounded corner geometry.' },
  { id: 'rect-track', name: 'Rectangular track screen', description: 'Dense digital race display with a perimeter tach.' },
  { id: 'rect-solid', name: 'Continuous perimeter', description: 'One solid RPM line flowing around the full three-sided perimeter.' },
];

const shiftLights = () =>
  '<div class="shift-lights" id="shift-lights" aria-label="Shift light"><i></i><i></i><i></i><i></i><i></i></div>';

function classicCluster(): string {
  return `<div class="dashboard instrument-cluster" data-gauge-style="classic"><div class="gauge speed-gauge" id="speed-gauge"><div class="gauge-face"><span class="gauge-caption">SPEED</span><i class="gauge-needle"></i><i class="gauge-hub"></i><strong id="speed">0</strong><small>KM/H</small><div class="gauge-scale"><span>0</span><span>160</span><span>320</span></div></div></div><div class="gauge tach-gauge" id="tach-gauge"><div class="gauge-face"><span class="gauge-caption">RPM</span><div class="tach-range" aria-hidden="true"><span>0</span><span id="redline-label">RED</span><span id="tach-max-label">MAX</span></div>${shiftLights()}<i class="gauge-needle"></i><i class="gauge-hub"></i><strong id="rpm">0.9</strong><small>×1000 RPM</small><span class="shift-callout" id="shift-label">NEUTRAL</span></div></div><div class="gear-console"><span>GEAR</span><strong id="gear">N</strong><small>6-SPEED</small><div class="shift-gate" aria-hidden="true"><i></i><i></i><i></i></div></div><div class="race-time odometer"><span>RUN TIMER</span><strong id="elapsed">0.000</strong><small>SECONDS</small></div></div>`;
}

function mixedCluster(): string {
  return `<div class="dashboard instrument-cluster custom-instrument analog-digital-mix" data-gauge-style="analog-digital-mix">
    <div class="mix-speed" id="speed-gauge"><span>SPEED</span><strong id="speed">0</strong><small>KM/H</small><div class="mix-live"><b id="cluster-traction">100%</b><span>TRACTION</span></div></div>
    <div class="gauge tach-gauge mix-tach" id="tach-gauge"><div class="gauge-face"><span class="gauge-caption">RPM</span><div class="tach-range" aria-hidden="true"><span>0</span><span id="redline-label">RED</span><span id="tach-max-label">MAX</span></div>${shiftLights()}<i class="gauge-needle"></i><i class="gauge-hub"></i><strong id="rpm">0.9</strong><small>×1000 RPM</small><span class="shift-callout" id="shift-label">NEUTRAL</span></div></div>
    <div class="mix-center"><span>GEAR</span><strong id="gear">N</strong><div><b id="cluster-slip">0%</b><small>WHEEL SLIP</small></div><div><b id="cluster-shift-target">—</b><small>SHIFT TARGET</small></div></div>
    <div class="race-time odometer mix-time"><span>RUN TIMER</span><strong id="elapsed">0.000</strong><small>SECONDS</small></div>
  </div>`;
}

type PerimeterConfig = {
  style: GaugeStyle;
  segmented: boolean;
  dash: number;
  gap: number;
  dense?: boolean;
};

function perimeterCluster(config: PerimeterConfig): string {
  const maskId = `perimeter-mask-${config.style}`;
  const dashArray = config.segmented ? `${config.dash} ${config.gap}` : '';
  const mask = config.segmented
    ? `<mask id="${maskId}" maskUnits="userSpaceOnUse"><path d="M 30 194 V 40 Q 30 20 50 20 H 650 Q 670 20 670 40 V 194" pathLength="100" fill="none" stroke="white" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${dashArray}"/></mask>`
    : '';
  const masked = config.segmented ? ` mask="url(#${maskId})"` : '';
  const trackDash = config.segmented ? ` stroke-dasharray="${dashArray}"` : '';
  return `<div class="dashboard instrument-cluster custom-instrument perimeter-cluster ${config.style} ${config.dense ? 'dense' : ''}" data-gauge-style="${config.style}">
    <div class="perimeter-shell" id="tach-gauge">
      <svg class="perimeter-svg" viewBox="0 0 700 214" preserveAspectRatio="none" aria-hidden="true">
        <defs>${mask}<linearGradient id="perimeter-hot-${config.style}" x1="0" x2="1"><stop offset="0%" stop-color="#e6edf3"/><stop offset="72%" stop-color="#e6edf3"/><stop offset="86%" stop-color="#ffd65a"/><stop offset="100%" stop-color="#ff5948"/></linearGradient></defs>
        <path class="perimeter-track" d="M 30 194 V 40 Q 30 20 50 20 H 650 Q 670 20 670 40 V 194" pathLength="100" fill="none" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"${trackDash}/>
        <path class="perimeter-fill" id="perimeter-rpm-fill" d="M 30 194 V 40 Q 30 20 50 20 H 650 Q 670 20 670 40 V 194" pathLength="100" fill="none" stroke="url(#perimeter-hot-${config.style})" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0 100"${masked}/>
      </svg>
      <div class="perimeter-topline"><div><span>RPM PERIMETER</span><strong><b id="rpm">0.9</b> <small>×1000</small></strong></div><div class="perimeter-red"><span id="redline-label">RED</span><small id="tach-max-label">MAX</small></div></div>
      ${shiftLights()}
      <div class="perimeter-center">
        <div class="perimeter-speed" id="speed-gauge"><strong id="speed">0</strong><small>KM/H</small></div>
        <div class="perimeter-gear"><span>GEAR</span><strong id="gear">N</strong></div>
      </div>
      <div class="perimeter-status"><span id="shift-label">NEUTRAL</span><span><b id="cluster-slip">0%</b> SLIP</span></div>
    </div>
    <div class="perimeter-info">
      <div><b id="cluster-traction">100%</b><span>Traction</span></div>
      <div><b id="cluster-throttle">0%</b><span>Throttle</span></div>
      <div><b id="cluster-shift-target">—</b><span>Shift target</span></div>
      <div><b id="cluster-curve">FACTORY</b><span>Power curve</span></div>
      <div class="perimeter-time"><b id="elapsed">0.000</b><span>Run timer</span></div>
    </div>
  </div>`;
}

export function instrumentCluster(style: GaugeStyle): string {
  if (style === 'analog-digital-mix') return mixedCluster();
  if (style === 'rect-24') return perimeterCluster({ style, segmented: true, dash: 3.15, gap: 1.02 });
  if (style === 'rect-16') return perimeterCluster({ style, segmented: true, dash: 4.95, gap: 1.3 });
  if (style === 'rect-8') return perimeterCluster({ style, segmented: true, dash: 10.65, gap: 1.85 });
  if (style === 'rect-track') return perimeterCluster({ style, segmented: true, dash: 3.9, gap: 1.1, dense: true });
  if (style === 'rect-solid') return perimeterCluster({ style, segmented: false, dash: 0, gap: 0 });
  return classicCluster();
}
