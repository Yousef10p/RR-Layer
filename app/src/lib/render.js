/* Canvas helpers for the demo: a viridis-style ramp matching the notebook figures. */

const RAMP = [
  [68, 1, 84],
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [110, 206, 88],
  [181, 222, 43],
  [253, 231, 37]
];

function viridis(t) {
  const x = Math.min(1, Math.max(0, t)) * (RAMP.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = RAMP[i];
  const b = RAMP[Math.min(i + 1, RAMP.length - 1)];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f)
  ];
}

/**
 * Draw one square image (Float32Array of size*size) onto a canvas.
 * `range` fixes the color scale so frames stay comparable; omit to autoscale.
 */
export function drawImage(canvas, data, size, range) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let lo;
  let hi;
  if (range) {
    [lo, hi] = range;
  } else {
    lo = Infinity;
    hi = -Infinity;
    for (let i = 0; i < data.length; i++) {
      if (data[i] < lo) lo = data[i];
      if (data[i] > hi) hi = data[i];
    }
  }
  const span = hi - lo || 1;

  const img = ctx.createImageData(size, size);
  for (let i = 0; i < data.length; i++) {
    const [r, g, b] = viridis((data[i] - lo) / span);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }

  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  off.getContext("2d").putImageData(img, 0, 0);

  canvas.width = size * 6;
  canvas.height = size * 6;
  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
}

/** Min/max across a stack, used to keep all three panels on one color scale. */
export function stackRange(stacks) {
  let lo = Infinity;
  let hi = -Infinity;
  stacks.forEach((data) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i] < lo) lo = data[i];
      if (data[i] > hi) hi = data[i];
    }
  });
  return [lo, hi];
}
