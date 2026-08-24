/* ============================================================================
   RESULTS  —  every number below is measured, taken from the project's report
   (Tables 1 & 2, Sections 4.1–4.5) and the experiment notebook RR_focused.ipynb.
   ----------------------------------------------------------------------------
   TO UPDATE RESULTS: edit the arrays here. Charts and experiment cards read
   from this file, so the whole site follows automatically.
   ============================================================================ */

/* The three models compared. Colors follow the figures in the report/slides. */
export const models = {
  OA: {
    key: "OA",
    label: "Plain",
    longLabel: "OA — plain network",
    slot: "conv → ReLU",
    color: "#5b9cff",
    description: "No normalization between a convolution and its activation."
  },
  OA_BN: {
    key: "OA_BN",
    label: "BatchNorm",
    longLabel: "OA_BN — BatchNorm2d",
    slot: "conv → BatchNorm2d → ReLU",
    color: "#f7a23b",
    description: "The standard baseline: each feature rescaled to mean 0, variance 1."
  },
  OA_RR: {
    key: "OA_RR",
    label: "SVD layer",
    longLabel: "OA_RR — SVD layer",
    slot: "conv → SVD layer → ReLU",
    color: "#3ddc97",
    description: "Ours: the batch rebuilt from its top-k singular components."
  }
};

export const modelOrder = ["OA", "OA_BN", "OA_RR"];

/* ---------------------------------------------------------------------------
   1. HEADLINE EXPERIMENT — small data + heavy noise
   Table 1: test MSE (mean ± std over 32 seeds), input noise std 1.0.
   train / gap values come from the notebook's per-seed aggregation.
   --------------------------------------------------------------------------- */
export const noiseSweep = [
  {
    ntr: 25,
    OA: 0.0436, OA_std: 0.0224, OA_train: 0.0, OA_gap: 0.0435,
    OA_BN: 0.0763, OA_BN_std: 0.0276, OA_BN_train: 0.0554, OA_BN_gap: 0.021,
    OA_RR: 0.0197, OA_RR_std: 0.0095, OA_RR_train: 0.0, OA_RR_gap: 0.0197,
    vsPlain: 2.2, vsBN: 3.9
  },
  {
    ntr: 50,
    OA: 0.0241, OA_std: 0.0192, OA_train: 0.0, OA_gap: 0.0241,
    OA_BN: 0.0584, OA_BN_std: 0.0276, OA_BN_train: 0.0314, OA_BN_gap: 0.027,
    OA_RR: 0.0091, OA_RR_std: 0.0059, OA_RR_train: 0.0002, OA_RR_gap: 0.009,
    vsPlain: 2.6, vsBN: 6.4
  },
  {
    ntr: 100,
    OA: 0.0133, OA_std: 0.0165, OA_train: 0.0, OA_gap: 0.0133,
    OA_BN: 0.0379, OA_BN_std: 0.0296, OA_BN_train: 0.0272, OA_BN_gap: 0.0107,
    OA_RR: 0.0044, OA_RR_std: 0.0038, OA_RR_train: 0.0003, OA_RR_gap: 0.004,
    vsPlain: 3.0, vsBN: 8.6
  },
  {
    ntr: 200,
    OA: 0.006, OA_std: 0.0085, OA_train: 0.0, OA_gap: 0.006,
    OA_BN: 0.0375, OA_BN_std: 0.0304, OA_BN_train: 0.0322, OA_BN_gap: 0.0053,
    OA_RR: 0.0025, OA_RR_std: 0.002, OA_RR_train: 0.0005, OA_RR_gap: 0.002,
    vsPlain: 2.4, vsBN: 15.0
  },
  {
    ntr: 400,
    OA: 0.0034, OA_std: 0.0049, OA_train: 0.0003, OA_gap: 0.0032,
    OA_BN: 0.0258, OA_BN_std: 0.0263, OA_BN_train: 0.023, OA_BN_gap: 0.0027,
    OA_RR: 0.0021, OA_RR_std: 0.0026, OA_RR_train: 0.0004, OA_RR_gap: 0.0017,
    vsPlain: 1.6, vsBN: 12.3
  }
];

export const noiseSweepMeta = {
  seeds: 32,
  noiseStd: 1.0,
  metric: "test MSE",
  note: "Pixel noise std 1.0 against a source peak of 1.0 — pixel SNR at or below 1."
};

/* ---------------------------------------------------------------------------
   2. RANK SWEEP — clean data, per-layer placement, 4 seeds (Section 4.1)
   --------------------------------------------------------------------------- */
export const rankSweep = [
  { k: 2, mse: 0.0414, std: 0.0033 },
  { k: 4, mse: 0.0014, std: null },
  { k: 8, mse: 0.0007, std: null },
  { k: 16, mse: 0.0006, std: null },
  { k: 32, mse: 0.0002, std: null }
];

export const rankSweepMeta = {
  seeds: 4,
  bnReference: 0.0611,
  plainReference: "below 1e-4",
  chosenRank: 8,
  note: "k = 32 equals the batch size, i.e. no truncation at all during training."
};

/* ---------------------------------------------------------------------------
   3. REAL BACKGROUNDS — MNIST source injection, 16 seeds (Table 2)
   --------------------------------------------------------------------------- */
export const mnistBackgrounds = [
  { model: "OA", mse: 0.0089, std: 0.0042 },
  { model: "OA_BN", mse: 0.0755, std: 0.0215 },
  { model: "OA_RR", mse: 0.0509, std: 0.0057 }
];

export const mnistMeta = {
  seeds: 16,
  ntr: 200,
  backgroundAmplitude: 1.5,
  note: "Backgrounds are real MNIST digits scaled to 64×64; train and test pools are disjoint."
};

/* ---------------------------------------------------------------------------
   4. EVALUATION-MODE ABLATION — clean data, k = 8, 4 seeds (Section 4.4)
   --------------------------------------------------------------------------- */
export const evalModes = [
  { mode: "Per-batch SVD", short: "per-batch", mse: 0.0004, description: "The training-time behavior, kept at test time." },
  { mode: "Basis bank", short: "basis bank", mse: 0.0007, description: "Default: one frozen basis merged from the last 20 batch bases." },
  { mode: "Full-data basis", short: "full-data", mse: 0.0006, description: "One SVD over a single large pass of the data." }
];

/* ---------------------------------------------------------------------------
   5. GRADIENT BACKEND / STABILITY — clean data, Ntr = 800, 8 seeds (Section 4.5)
   --------------------------------------------------------------------------- */
export const stability = {
  nativeBackend: [
    { model: "OA", mse: 0.0, std: null },
    { model: "OA_BN", mse: 0.0009, std: 0.0004 },
    { model: "OA_RR", mse: 0.0003, std: 0.0002 }
  ],
  seeds: 8,
  ntr: 800,
  trainingLoss: { from: 2.68, to: 0.0003, epochs: 20 },
  customBackend: "diverged — training loss climbed by orders of magnitude within a few epochs and never recovered"
};

/* ---------------------------------------------------------------------------
   Shared experimental configuration (Section 3.2)
   --------------------------------------------------------------------------- */
export const setup = {
  imageSize: "64 × 64",
  sigma: 0.2,
  centerRange: "[−0.5, 0.5]²",
  backbone: "3 conv blocks · 3×3 kernels · padding 1 · channels 1 → 8 → 16 → 32 · no pooling",
  head: "Linear(32·64·64 → 128) → ReLU → Linear(128 → 2)",
  rank: 8,
  batchSize: 32,
  optimizer: "Adam",
  learningRate: 0.001,
  loss: "MSE",
  epochs: "20 at Ntr = 800, scaled up as Ntr shrinks",
  framework: "PyTorch",
  svdBackend: "torch.linalg.svd native autograd (gesvd driver on CUDA)",
  seeds: "up to 32 per reported point, seeds 2000–2031",
  fairness: "the same seed is re-applied before each model is built, so all three start from identical Conv/Linear weights"
};

/* ---------------------------------------------------------------------------
   SCOREBOARD — the same three models across every setting we tested.
   Nothing new is measured here: each row points at numbers defined above, so
   editing an experiment updates this table automatically.
   `winner` is computed, never typed in.
   --------------------------------------------------------------------------- */
const noiseAt = (ntr) => noiseSweep.find((row) => row.ntr === ntr);
const byModel = (rows) => Object.fromEntries(rows.map((r) => [r.model, r.mse]));

const scoreboardRows = [
  {
    id: "clean-perlayer",
    setting: "Clean data, SVD layer after every conv",
    detail: `k = ${rankSweepMeta.chosenRank} · ${rankSweepMeta.seeds} seeds · Section 4.1`,
    nuisance: "none",
    values: { OA: null, OA_BN: rankSweepMeta.bnReference, OA_RR: rankSweep.find((r) => r.k === 8).mse },
    // The plain network's error is reported only as an upper bound, so it is
    // shown as text and excluded from the computed winner.
    footnote: `Plain network: ${rankSweepMeta.plainReference} (reported as a bound, not a value).`
  },
  {
    id: "clean-800",
    setting: "Clean data, Ntr = 800, native autograd",
    detail: `${stability.seeds} seeds · Section 4.5`,
    nuisance: "none",
    values: byModel(stability.nativeBackend)
  },
  {
    id: "noise-200",
    setting: "Pixel noise std 1.0, Ntr = 200",
    detail: `${noiseSweepMeta.seeds} seeds · Table 1`,
    nuisance: "high-rank (i.i.d. noise)",
    values: {
      OA: noiseAt(200).OA,
      OA_BN: noiseAt(200).OA_BN,
      OA_RR: noiseAt(200).OA_RR
    },
    headline: true
  },
  {
    id: "mnist-200",
    setting: "Real MNIST backgrounds, Ntr = 200",
    detail: `${mnistMeta.seeds} seeds · Table 2`,
    nuisance: "low-rank (structured clutter)",
    values: byModel(mnistBackgrounds)
  }
];

export const scoreboard = scoreboardRows.map((row) => {
  const scored = modelOrder.filter((key) => typeof row.values[key] === "number");
  const winner = scored.reduce(
    (best, key) => (best === null || row.values[key] < row.values[best] ? key : best),
    null
  );
  return { ...row, winner };
});
