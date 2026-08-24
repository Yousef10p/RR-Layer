/* ============================================================================
   The SVD layer's core operation, in plain JavaScript.

   This is the real math from the paper — a batch is arranged as a matrix
   (one column per sample), truncated to its top-k singular components and
   rebuilt — running live in the browser on synthetic data.

   It is NOT the trained PyTorch network. Nothing here is a stored result.

   Since a batch matrix X is M×N with M (pixels) ≫ N (batch size), we never
   form U: the rank-k reconstruction is a projection onto the top-k right
   singular vectors,  X̂ = X V_k V_kᵀ,  and V comes from the N×N Gram matrix
   XᵀX, which is tiny.
   ============================================================================ */

/** Deterministic RNG so a given seed always renders the same batch. */
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller standard normal from a uniform generator. */
function normal(next) {
  const u = Math.max(next(), 1e-9);
  const v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** One isotropic Gaussian source of width sigma on a [-1, 1]² grid. */
export function gaussianSource(size, x0, y0, sigma) {
  const img = new Float32Array(size * size);
  for (let iy = 0; iy < size; iy++) {
    const y = -1 + (2 * iy) / (size - 1);
    for (let ix = 0; ix < size; ix++) {
      const x = -1 + (2 * ix) / (size - 1);
      const d2 = (x - x0) * (x - x0) + (y - y0) * (y - y0);
      img[iy * size + ix] = Math.exp(-d2 / (2 * sigma * sigma));
    }
  }
  return img;
}

/** A few smooth, fixed patterns that make up a low-rank "structured" background. */
function clutterBasis(size) {
  const basis = [];
  const make = (fn) => {
    const img = new Float32Array(size * size);
    for (let iy = 0; iy < size; iy++) {
      const y = -1 + (2 * iy) / (size - 1);
      for (let ix = 0; ix < size; ix++) {
        const x = -1 + (2 * ix) / (size - 1);
        img[iy * size + ix] = fn(x, y);
      }
    }
    basis.push(img);
  };
  make((x, y) => Math.exp(-((x + 0.45) ** 2 + (y - 0.4) ** 2) / 0.28));
  make((x, y) => Math.max(0, 1 - Math.abs(2.2 * x - 0.9 * y)) ** 2);
  make((x, y) => Math.exp(-((x - 0.5) ** 2) / 0.06) * Math.max(0, 1 - Math.abs(y)));
  return basis;
}

/**
 * Build a batch of images: a Gaussian source plus a chosen kind of nuisance.
 *
 * nuisance = "noise"     -> i.i.d. pixel noise, spread across every singular direction
 * nuisance = "structure" -> a strong low-rank background shared across the batch
 */
export function makeBatch({
  size = 32,
  batch = 16,
  sigma = 0.22,
  nuisance = "noise",
  strength = 1.0,
  seed = 7
}) {
  const next = rng(seed);
  const basis = nuisance === "structure" ? clutterBasis(size) : null;
  const clean = [];
  const input = [];
  const centers = [];

  for (let n = 0; n < batch; n++) {
    const x0 = next() - 0.5;
    const y0 = next() - 0.5;
    centers.push([x0, y0]);

    const source = gaussianSource(size, x0, y0, sigma);
    clean.push(source);

    const withNuisance = new Float32Array(source.length);
    if (nuisance === "structure") {
      const coeffs = basis.map(() => 0.45 + 0.55 * next());
      for (let i = 0; i < source.length; i++) {
        let bg = 0;
        for (let b = 0; b < basis.length; b++) bg += coeffs[b] * basis[b][i];
        withNuisance[i] = source[i] + strength * bg;
      }
    } else {
      for (let i = 0; i < source.length; i++) {
        withNuisance[i] = source[i] + strength * normal(next);
      }
    }
    input.push(withNuisance);
  }

  return { clean, input, centers, size, batch };
}

/**
 * Eigendecomposition of a small symmetric matrix by the cyclic Jacobi method.
 * Returns eigenvalues in descending order with matching eigenvectors as columns.
 */
export function jacobiEigSym(matrix, n, sweeps = 24) {
  const a = matrix.slice();
  const v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;

  for (let sweep = 0; sweep < sweeps; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) off += a[p * n + q] * a[p * n + q];
    }
    if (off < 1e-18) break;

    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p * n + q];
        if (Math.abs(apq) < 1e-14) continue;
        const theta = (a[q * n + q] - a[p * n + p]) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;

        for (let k = 0; k < n; k++) {
          const akp = a[k * n + p];
          const akq = a[k * n + q];
          a[k * n + p] = c * akp - s * akq;
          a[k * n + q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p * n + k];
          const aqk = a[q * n + k];
          a[p * n + k] = c * apk - s * aqk;
          a[q * n + k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k * n + p];
          const vkq = v[k * n + q];
          v[k * n + p] = c * vkp - s * vkq;
          v[k * n + q] = s * vkp + c * vkq;
        }
      }
    }
  }

  const order = Array.from({ length: n }, (_, i) => i).sort(
    (i, j) => a[j * n + j] - a[i * n + i]
  );
  const values = order.map((i) => Math.max(a[i * n + i], 0));
  const vectors = new Float64Array(n * n);
  order.forEach((src, dst) => {
    for (let k = 0; k < n; k++) vectors[k * n + dst] = v[k * n + src];
  });
  return { values, vectors };
}

/**
 * Truncated SVD of a batch: returns the singular-value spectrum and, for the
 * requested rank, the rank-k reconstruction of every sample.
 */
export function truncatedSVD(samples, rank) {
  const n = samples.length;
  const m = samples[0].length;

  // Gram matrix G = XᵀX  (n × n)
  const gram = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let dot = 0;
      const si = samples[i];
      const sj = samples[j];
      for (let p = 0; p < m; p++) dot += si[p] * sj[p];
      gram[i * n + j] = dot;
      gram[j * n + i] = dot;
    }
  }

  const { values, vectors } = jacobiEigSym(gram, n);
  const singular = values.map((lambda) => Math.sqrt(Math.max(lambda, 0)));

  // Projector onto the top-k right singular vectors: P = V_k V_kᵀ
  const k = Math.max(1, Math.min(rank, n));
  const proj = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let c = 0; c < k; c++) sum += vectors[i * n + c] * vectors[j * n + c];
      proj[i * n + j] = sum;
    }
  }

  // X̂ = X P
  const recon = [];
  for (let out = 0; out < n; out++) {
    const dst = new Float32Array(m);
    for (let src = 0; src < n; src++) {
      const w = proj[src * n + out];
      if (Math.abs(w) < 1e-12) continue;
      const col = samples[src];
      for (let p = 0; p < m; p++) dst[p] += w * col[p];
    }
    recon.push(dst);
  }

  const totalEnergy = singular.reduce((acc, s) => acc + s * s, 0) || 1;
  const keptEnergy = singular.slice(0, k).reduce((acc, s) => acc + s * s, 0);

  return { singular, recon, energyKept: keptEnergy / totalEnergy, rank: k };
}

/** Mean squared error between two equally sized image stacks. */
export function stackMSE(a, b) {
  let sum = 0;
  let count = 0;
  for (let n = 0; n < a.length; n++) {
    for (let p = 0; p < a[n].length; p++) {
      const d = a[n][p] - b[n][p];
      sum += d * d;
      count++;
    }
  }
  return sum / Math.max(count, 1);
}
