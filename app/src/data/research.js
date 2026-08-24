/* ============================================================================
   RESEARCH QUESTIONS + THE PATH WE TOOK
   Each question is answered by an experiment in experiments.js (see `answeredBy`).
   ============================================================================ */

export const researchQuestions = [
  {
    id: "rq1",
    number: "RQ1",
    question: "Can the truncated SVD alone normalize a batch as well as BatchNorm does?",
    why:
      "Rank Reduction Autoencoders showed the SVD regularizes — but only at an autoencoder " +
      "bottleneck, entangled with the rest of that architecture.",
    answer:
      "Yes, on this task family. The SVD layer beat BatchNorm in every comparison we ran, by 1.5–15×.",
    status: "answered",
    answeredBy: null
  },
  {
    id: "rq2",
    number: "RQ2",
    question: "What does the rank k actually control?",
    why:
      "The directions are chosen automatically by the SVD; only how many survive is up to the user. " +
      "That makes k the layer's single hyperparameter.",
    answer:
      "It is a strength dial. Error falls monotonically from 0.0414 at k = 2 to 0.0002 at k = 32; " +
      "k = 8 is the smallest rank that solves the task comfortably.",
    status: "answered",
    answeredBy: "rank-sweep"
  },
  {
    id: "rq3",
    number: "RQ3",
    question: "Does it help where regularization matters most — few samples, heavy noise?",
    why:
      "A regularizer earns its place when data is scarce and the nuisance is strong enough that a " +
      "plain network memorizes it.",
    answer:
      "Yes, and it beats the unregularized network too: 1.6–3.0× over plain and 3.9–15× over " +
      "BatchNorm at every training-set size from 25 to 400 samples.",
    status: "answered",
    answeredBy: "small-data-noise"
  },
  {
    id: "rq4",
    number: "RQ4",
    question: "Does the advantage survive real, structured backgrounds?",
    why:
      "Synthetic Gaussian noise is the friendliest possible nuisance for a rank constraint. Real " +
      "clutter is not.",
    answer:
      "No — and that is the useful part. On real MNIST backgrounds the ranking flips and the plain " +
      "network wins (0.0089 vs 0.0509); the SVD layer still beats BatchNorm.",
    status: "answered-negative",
    answeredBy: "mnist-backgrounds"
  },
  {
    id: "rq5",
    number: "RQ5",
    question: "Why did networks with an SVD layer after every convolution diverge?",
    why:
      "Our first per-layer runs blew up within a few epochs. We initially read that as “the SVD " +
      "layer cannot be stacked”.",
    answer:
      "It was a hand-written analytic SVD backward, not the layer. With native autograd the same " +
      "network trains stably at every position.",
    status: "answered",
    answeredBy: "svd-gradient"
  }
];

/* The arc of the project, as the report tells it. */
export const timeline = [
  {
    phase: "Background",
    title: "BatchNorm is a moment constraint",
    text:
      "BN rescales every feature of a mini-batch to mean 0 and variance 1, then applies a learned " +
      "affine map. Its statistics come from the batch itself — a batch-level operation."
  },
  {
    phase: "Idea",
    title: "A geometric constraint instead",
    text:
      "The truncated SVD is also batch-level, but it constrains the batch to lie in a low-dimensional " +
      "subspace — the best rank-k approximation by Eckart–Young — rather than fixing moments."
  },
  {
    phase: "Design",
    title: "One layer, two modes",
    text:
      "Training: a truncated SVD per mini-batch, gradients flowing through it, each basis pushed into " +
      "a rolling bank of 20. Evaluation: those bases merged into one frozen inference basis, mirroring " +
      "BN's running statistics."
  },
  {
    phase: "Setup",
    title: "A controlled head-to-head",
    text:
      "Three architectures with identical initial Conv/Linear weights. Only the slot between each " +
      "convolution and its ReLU changes: nothing, BatchNorm2d, or the SVD layer."
  },
  {
    phase: "Experiments",
    title: "Sweep rank, noise, dataset size, background type",
    text:
      "Five studies, up to 32 seeds per reported point, on a task whose ground truth is analytic: " +
      "recover the center of a Gaussian point source."
  },
  {
    phase: "Finding",
    title: "A win, a loss, and one geometry that explains both",
    text:
      "The layer wins when the nuisance is high-rank and the signal is low-rank; it loses when the " +
      "nuisance is itself low-rank and strong. Same projection, opposite outcome."
  }
];

export default researchQuestions;
