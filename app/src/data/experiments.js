/* ============================================================================
   EXPERIMENT LAB
   ----------------------------------------------------------------------------
   The experiments actually run in this project, in the order the report
   presents them. Numeric results live in results.js and are referenced by id,
   so a number is never written down twice.
   ============================================================================ */

import { setup, rankSweepMeta, noiseSweepMeta, mnistMeta, stability } from "./results.js";

export const experiments = [
  {
    id: "rank-sweep",
    number: "01",
    name: "Rank sweep",
    verdict: "calibration",
    verdictLabel: "Calibration",
    question: "How strong should the constraint be?",
    objective:
      "Find what the retained rank k actually controls, and pick the value used everywhere else.",
    method:
      "Sweep k ∈ {2, 4, 8, 16, 32} with an SVD layer after every convolution, on clean data, " +
      "and compare against a per-layer BatchNorm reference trained on the same data.",
    dataset: "Gaussian point source, 64×64, clean (no noise, no clutter)",
    configuration: {
      "Rank k": "2 → 32 (swept)",
      Placement: "after every convolution",
      Seeds: rankSweepMeta.seeds,
      "Batch size": setup.batchSize,
      Optimizer: `${setup.optimizer}, lr ${setup.learningRate}`,
      Loss: setup.loss
    },
    metricLabel: "Test MSE (lower is better)",
    keyNumbers: [
      { label: "k = 2", value: "0.0414", note: "too aggressive" },
      { label: "k = 8", value: "0.0007", note: "chosen" },
      { label: "k = 32", value: "0.0002", note: "no truncation" },
      { label: "BatchNorm", value: "0.0611", note: "same data" }
    ],
    chart: "rankSweep",
    conclusion:
      "Test error falls monotonically as k grows. Two directions cannot carry both coordinates " +
      "of the center plus nuisance variation, so k = 2 costs about 60× relative to k = 8 — yet " +
      "even that worst setting still beats the BatchNorm reference on the same clean data. " +
      "We fix k = 8: the smallest rank that solves the task comfortably.",
    takeaway: "The rank is a strength dial. Err on the large side."
  },

  {
    id: "small-data-noise",
    number: "02",
    name: "Small data + heavy noise",
    verdict: "win",
    verdictLabel: "SVD layer wins",
    headline: true,
    question: "Does the layer help where regularization matters most?",
    objective:
      "Test the regime where a plain network should overfit hardest: very few training samples " +
      "and pixel noise as strong as the signal itself.",
    method:
      "Additive Gaussian pixel noise (std 1.0) on train and test images, training-set size swept " +
      "over {25, 50, 100, 200, 400}. Epochs scale up as Ntr shrinks so every configuration gets a " +
      "comparable number of gradient updates.",
    dataset: "Gaussian point source, 64×64, input noise std 1.0 (pixel SNR ≤ 1)",
    configuration: {
      "Rank k": setup.rank,
      "Noise std": noiseSweepMeta.noiseStd,
      "Training sizes": "25, 50, 100, 200, 400",
      Seeds: noiseSweepMeta.seeds,
      "Batch size": setup.batchSize,
      Epochs: setup.epochs
    },
    metricLabel: "Test MSE (lower is better)",
    keyNumbers: [
      { label: "vs BatchNorm", value: "3.9–15×", note: "better at every Ntr" },
      { label: "vs plain", value: "1.6–3.0×", note: "better at every Ntr" },
      { label: "Best gap", value: "0.0017", note: "test − train, at Ntr = 400" },
      { label: "Seeds", value: "32", note: "tightest variance of the three" }
    ],
    chart: "noiseSweep",
    conclusion:
      "The SVD layer beats both baselines at every training-set size from 25 to 400 samples, with " +
      "the tightest across-seed variance and the smallest generalization gap. The plain network " +
      "drives train error to zero by memorizing the noise, so its gap is essentially its whole test " +
      "error. BatchNorm is the worst of the three here: it trains, but it generalizes poorly.",
    mechanism:
      "i.i.d. pixel noise spreads across all singular directions while the smooth source occupies a " +
      "low-rank subspace — so the top-k projection strips noise faster than signal, at every layer.",
    takeaway: "This is the headline result: under noise-like nuisance, the layer is the better drop-in."
  },

  {
    id: "mnist-backgrounds",
    number: "03",
    name: "Real backgrounds",
    verdict: "loss",
    verdictLabel: "SVD layer loses",
    question: "Does the advantage survive real, structured clutter?",
    objective:
      "External-validity check: keep the ground truth exact, but make the clutter statistics real " +
      "instead of Gaussian.",
    method:
      "Source injection — astronomy's standard check. A synthetic source with known position is " +
      "injected onto real MNIST digit backgrounds scaled to 64×64, at 1.5× the source peak. " +
      "Train and test draw from disjoint background pools.",
    dataset: "Gaussian source injected on real MNIST backgrounds, Ntr = 200",
    configuration: {
      "Rank k": setup.rank,
      "Background": "real MNIST digits, 64×64",
      "Background amplitude": `${mnistMeta.backgroundAmplitude}× the source peak`,
      "Training size": mnistMeta.ntr,
      Seeds: mnistMeta.seeds,
      Pools: "disjoint for train and test"
    },
    metricLabel: "Test MSE (lower is better)",
    keyNumbers: [
      { label: "Plain", value: "0.0089", note: "wins" },
      { label: "SVD layer", value: "0.0509", note: "2nd" },
      { label: "BatchNorm", value: "0.0755", note: "3rd" },
      { label: "vs BatchNorm", value: "1.5×", note: "still ahead" }
    ],
    chart: "mnist",
    figure: {
      src: "figures/mnist-injection-preview.png",
      alt: "Four 64×64 images: a Gaussian source marked with a red cross injected on real MNIST digit backgrounds",
      caption: "Injected source (red +) on real MNIST backgrounds — the label stays exact, the clutter is real."
    },
    conclusion:
      "The ranking flips. MNIST digits are themselves approximately low-rank, and at 1.5× the source " +
      "peak they dominate the batch's variance — so keeping the top singular components keeps the " +
      "background as faithfully as the signal. The plain network wins by about 5.7×; the SVD layer " +
      "still beats BatchNorm by 1.5×.",
    mechanism:
      "The layer's advantage is specific to nuisance spread thinly across many directions. It inverts " +
      "when the nuisance is concentrated in a few strong directions.",
    takeaway: "A negative result we kept: the layer is a prior, not a universal improvement."
  },

  {
    id: "eval-basis",
    number: "04",
    name: "Evaluation-mode ablation",
    verdict: "ablation",
    verdictLabel: "Ablation",
    question: "Is the frozen inference basis a sound test-time procedure?",
    objective:
      "Check how much the train/eval mismatch costs — the layer sees a fresh SVD per batch during " +
      "training but a frozen basis at test time.",
    method:
      "Evaluate the same trained models three ways: per-batch SVD (training behavior), the default " +
      "basis bank of the last 20 bases, and a basis computed in one pass over a large data batch.",
    dataset: "Gaussian point source, clean, single SVD layer",
    configuration: {
      "Rank k": setup.rank,
      Placement: "single SVD layer",
      Seeds: 4,
      Data: "clean"
    },
    metricLabel: "Test MSE (lower is better)",
    keyNumbers: [
      { label: "Per-batch SVD", value: "0.0004", note: "training behavior" },
      { label: "Basis bank", value: "0.0007", note: "default" },
      { label: "Full-data basis", value: "0.0006", note: "closest to a true SVD" }
    ],
    chart: "evalModes",
    conclusion:
      "All three agree to within a few 10⁻⁴ — far below every model-to-model difference reported " +
      "elsewhere. The frozen-basis approximation costs almost nothing, so the layer's residual error " +
      "relative to the plain network comes from the rank constraint itself, not from the train/eval " +
      "mismatch.",
    takeaway: "The simple rolling basis bank is a sound inference procedure."
  },

  {
    id: "svd-gradient",
    number: "05",
    name: "Gradients through the SVD",
    verdict: "diagnosis",
    verdictLabel: "Diagnosis",
    question: "Why did stacking SVD layers diverge?",
    objective:
      "Diagnose training blow-ups that first appeared to be intrinsic to putting an SVD layer after " +
      "every convolution.",
    method:
      "Compare two backward passes through the same layer: a hand-written analytic SVD backward " +
      "(the textbook formula with 1/(σᵢ − σⱼ) factors) against PyTorch's native autograd through " +
      "torch.linalg.svd.",
    dataset: "Gaussian point source, clean, Ntr = 800",
    configuration: {
      "Rank k": setup.rank,
      Placement: "after every convolution",
      Seeds: stability.seeds,
      "Training size": stability.ntr,
      Backends: "hand-written analytic vs native autograd"
    },
    metricLabel: "Test MSE (lower is better)",
    keyNumbers: [
      { label: "Analytic backward", value: "diverged", note: "loss into the hundreds" },
      { label: "Native autograd", value: "0.0003", note: "± 0.0002, 8 seeds" },
      { label: "Plain", value: "0.0000", note: "same setting" },
      { label: "BatchNorm", value: "0.0009", note: "± 0.0004" }
    ],
    chart: "stability",
    conclusion:
      "The instability was a gradient bug, not the layer. The 1/(σᵢ − σⱼ) terms blow up whenever two " +
      "singular values come close — frequent for structured feature maps. With native autograd the " +
      "same per-layer network trains smoothly (training loss 2.68 → 0.0003 over 20 epochs) and lands " +
      "between the plain network and BatchNorm. All final results use this backend.",
    takeaway: "The backward pass through an SVD is the numerically dangerous part — use the library's."
  }
];

export const experimentById = Object.fromEntries(experiments.map((e) => [e.id, e]));

export default experiments;
