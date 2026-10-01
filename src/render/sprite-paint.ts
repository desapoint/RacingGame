/** Paint selection is computed once from each reference sprite, never during racing. */
export function rgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function hue(r: number, g: number, b: number): number {
  const maximum = Math.max(r, g, b),
    minimum = Math.min(r, g, b),
    difference = maximum - minimum;
  if (!difference) return 0;
  let value =
    maximum === r
      ? (g - b) / difference
      : maximum === g
        ? 2 + (b - r) / difference
        : 4 + (r - g) / difference;
  return (value * 60 + 360) % 360;
}

export function findPaintPixels(pixels: ImageData, paintColor: string): Uint8Array {
  const { width, height, data } = pixels;
  const selected = new Uint8Array(width * height);
  const reference = rgb(paintColor);
  const targetHue = hue(...reference);
  for (let pixel = 0; pixel < selected.length; pixel++) {
    const offset = pixel * 4;
    if (data[offset + 3] < 100) continue;
    const r = data[offset],
      g = data[offset + 1],
      b = data[offset + 2];
    const maximum = Math.max(r, g, b),
      minimum = Math.min(r, g, b);
    const saturation = maximum ? (maximum - minimum) / maximum : 0;
    const difference = Math.abs(hue(r, g, b) - targetHue);
    if (saturation > 0.19 && Math.min(difference, 360 - difference) < 32 && maximum > 22)
      selected[pixel] = 1;
  }
  // Keep sizeable connected paint panels; exclude isolated lamps, logos and brake calipers.
  const labels = new Int32Array(selected.length);
  const queue = new Int32Array(selected.length);
  const sizes = [0];
  let biggest = 0;
  for (let start = 0; start < selected.length; start++) {
    if (!selected[start] || labels[start]) continue;
    const label = sizes.length;
    let head = 0,
      tail = 1;
    queue[0] = start;
    labels[start] = label;
    while (head < tail) {
      const pixel = queue[head++],
        x = pixel % width;
      for (const neighbor of [
        x > 0 ? pixel - 1 : -1,
        x < width - 1 ? pixel + 1 : -1,
        pixel - width,
        pixel + width,
      ]) {
        if (
          neighbor >= 0 &&
          neighbor < selected.length &&
          selected[neighbor] &&
          !labels[neighbor]
        ) {
          labels[neighbor] = label;
          queue[tail++] = neighbor;
        }
      }
    }
    sizes.push(tail);
    biggest = Math.max(biggest, tail);
  }
  const threshold = Math.max(65, biggest * 0.025);
  for (let pixel = 0; pixel < selected.length; pixel++)
    selected[pixel] = sizes[labels[pixel]] >= threshold ? 255 : 0;
  return selected;
}

export function recolorPixels(
  original: ImageData,
  mask: Uint8Array,
  color: string,
  reference: string,
): ImageData {
  const result = new ImageData(
    new Uint8ClampedArray(original.data),
    original.width,
    original.height,
  );
  const target = rgb(color),
    source = rgb(reference);
  const brightness = Math.max(30, 0.299 * source[0] + 0.587 * source[1] + 0.114 * source[2]);
  for (let pixel = 0; pixel < mask.length; pixel++) {
    if (!mask[pixel]) continue;
    const offset = pixel * 4,
      data = original.data;
    const shade =
      (0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2]) / brightness;
    for (let channel = 0; channel < 3; channel++) {
      result.data[offset + channel] =
        shade <= 1
          ? target[channel] * shade
          : target[channel] + (255 - target[channel]) * Math.min(1, (shade - 1) * 0.7);
    }
  }
  return result;
}
