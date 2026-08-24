/* ============================================================================
   THE FINAL SYSTEM  —  what the selected approach actually does, stage by stage.
   Structure follows Sections 2 and 3.2 of the report.
   ============================================================================ */

export const decision = {
  title: "Why the SVD layer, at rank 8, on the native autograd backend",
  candidates: [
    {
      id: "plain",
      name: "Plain network",
      slot: "conv → ReLU",
      strength: "Best raw accuracy on clean data and on real structured backgrounds (0.0089).",
      limitation:
        "Under heavy noise it memorizes: train error goes to zero while test error stays 1.6–3.0× " +
        "worse than the SVD layer. Its generalization gap is essentially its whole test error.",
      selected: false
    },
    {
      id: "bn",
      name: "BatchNorm2d",
      slot: "conv → BatchNorm2d → ReLU",
      strength: "The standard drop-in; trains fine and needs no tuning.",
      limitation:
        "Lost every comparison we ran on this task family, by 1.5–15×, with the largest across-seed " +
        "variance. Rescaling each feature to unit variance amplifies exactly the noise-dominated " +
        "directions the SVD layer discards.",
      selected: false
    },
    {
      id: "svd",
      name: "SVD layer (k = 8)",
      slot: "conv → SVD layer → ReLU",
      strength:
        "Best overall balance under noise-like nuisance: 1.6–3.0× better than plain and 3.9–15× " +
        "better than BatchNorm at every training-set size, with the tightest seed variance and the " +
        "smallest train/test gap.",
      limitation:
        "Not a universal improvement — when the nuisance is itself low-rank and strong, the top-k " +
        "projection preserves the clutter and the plain network wins.",
      selected: true
    }
  ],
  scope:
    "Scoped claim: BatchNorm lost in every comparison we ran on this task family. That is not a " +
    "statement about BatchNorm at ImageNet scale — these networks are shallow and easy to optimize, " +
    "so BN's optimization benefits do not show while its costs do."
};

export const pipeline = [
  {
    id: "input",
    label: "Input batch",
    short: "Input",
    formula: "32 × 1 × 64 × 64",
    title: "A mini-batch of images",
    text:
      "A single Gaussian source of width σ = 0.2 on a [−1, 1]² grid, its center drawn uniformly in " +
      "[−0.5, 0.5]². Images are standardized to zero mean and unit variance. Optionally with pixel " +
      "noise or real background clutter.",
    detail: "Ground truth is analytic — the data has exactly two generative degrees of freedom."
  },
  {
    id: "conv",
    label: "Conv block",
    short: "Conv",
    formula: "3×3, pad 1 · 1 → 8 → 16 → 32",
    title: "Three convolutional blocks",
    text:
      "No pooling, so the spatial size stays 64×64 throughout. The SVD layer sits in the slot between " +
      "each convolution and its ReLU — exactly where BatchNorm would go.",
    detail: "All three compared models share these weights at initialization."
  },
  {
    id: "svd",
    label: "SVD layer",
    short: "SVD",
    formula: "X = U Σ Vᵀ → X̂ = U_k Σ_k V_kᵀ",
    title: "Flatten · truncate · unflatten",
    highlight: true,
    text:
      "The batch is flattened into a matrix X (one column per sample) and rebuilt from its top k = 8 " +
      "singular components. Every sample becomes a combination of the same k basis vectors: the batch " +
      "is projected onto its own dominant k-dimensional subspace.",
    detail: "Gradients flow through the SVD using PyTorch's native autograd.",
    modes: {
      train:
        "Training mode — a truncated SVD is computed on every mini-batch and the rank-k reconstruction " +
        "is passed on. Each batch basis U_k is stored in a rolling bank of the last 20.",
      eval:
        "Evaluation mode — the stored bases are merged by a final SVD into one frozen inference basis, " +
        "and test inputs are projected onto it (X̂ = U_k U_kᵀ X). This mirrors BN's running statistics: " +
        "behavior at test time no longer depends on the batch."
    }
  },
  {
    id: "relu",
    label: "ReLU",
    short: "ReLU",
    formula: "max(0, ·)",
    title: "Activation",
    text:
      "The normalization slot comes before the activation, matching how BatchNorm is normally placed. " +
      "The conv → normalize → ReLU block repeats three times.",
    detail: "Only this slot differs between the plain, BatchNorm and SVD-layer networks."
  },
  {
    id: "head",
    label: "Regression head",
    short: "Head",
    formula: "Linear(131072 → 128) → ReLU → Linear(128 → 2)",
    title: "From features to coordinates",
    text:
      "The 32 × 64 × 64 feature map is flattened and passed through a plain two-layer head that outputs " +
      "two numbers.",
    detail: "Identical in all three models."
  },
  {
    id: "output",
    label: "Output",
    short: "Output",
    formula: "(x₀, y₀)",
    title: "The predicted source center",
    text:
      "Trained against the true center with an MSE loss — which is also the metric reported in every " +
      "experiment on this site.",
    detail: "Adam, learning rate 1e-3, batch size 32, 20 epochs at Ntr = 800."
  }
];

export default pipeline;
