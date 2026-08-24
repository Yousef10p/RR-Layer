/* ============================================================================
   PROJECT INFORMATION
   ----------------------------------------------------------------------------
   Everything on this page comes from the project's own report, slides and
   notebook. Edit the values here to change the hero, the problem section and
   the footer. No numbers are invented anywhere in src/data.
   ============================================================================ */

export const project = {
  title: "Batch Normalization using an SVD Layer",
  shortTitle: "SVD Layer",
  codeName: "RR-Layer",

  // One line a visitor reads in under five seconds.
  tagline: "Can a truncated SVD normalize a mini-batch as well as BatchNorm does?",

  subtitle:
    "We isolate the truncated SVD into a standalone, drop-in PyTorch layer and " +
    "test it head-to-head against BatchNorm on a controlled point-source localization task.",

  venue: "KAUST Academy Summer Program 2026 · University of Oxford stage",

  links: {
    code: "https://github.com/Yousef10p/RR-Layer",
    referenceImplementation: "https://github.com/JadM133/RR_layer",
    rraePaper: "https://arxiv.org/abs/2405.13980"
  },

  // Straight from the report abstract.
  abstract:
    "Batch Normalization (BN) is the standard way to control the statistics of activations " +
    "inside a neural network. Rank Reduction Autoencoders showed that the truncated Singular " +
    "Value Decomposition (SVD) can regularize an autoencoder without any extra loss term, but " +
    "the effect of the SVD by itself, separated from the autoencoder, has not been studied. " +
    "We isolate it into a standalone SVD layer: a drop-in PyTorch module that rebuilds each " +
    "mini-batch from its top-k singular components during training and projects onto a frozen " +
    "inference basis at test time.",

  // Headline numbers — every one of them appears in the report.
  headlineStats: [
    { value: "1.5–15×", label: "better than BatchNorm", detail: "in every comparison we ran" },
    { value: "1.6–3.0×", label: "better than the plain network", detail: "under heavy input noise, at every training-set size" },
    { value: "32", label: "seeds per reported point", detail: "identical initial weights across all three models" }
  ],

  /* --------------------------------------------------------------------------
     THE PROBLEM  —  input → problem → desired output
     -------------------------------------------------------------------------- */
  problem: {
    task: {
      title: "The task",
      text:
        "Regress the center (x₀, y₀) of a single Gaussian point source in a 64×64 image — " +
        "the setting of astrometry and single-molecule microscopy — optionally under heavy " +
        "pixel noise or on top of real background clutter."
    },
    flow: [
      {
        id: "input",
        kicker: "Input",
        title: "A mini-batch of activations",
        text:
          "Inside the network, each conv block hands on a batch of feature maps. " +
          "The signal is smooth and low-rank; whatever else is in the image — sensor noise, " +
          "background clutter — rides along with it.",
        detail: "Batch of 32 · feature map C×64×64 · flattened to a matrix, one column per sample"
      },
      {
        id: "problem",
        kicker: "The problem",
        title: "BatchNorm controls scale, not direction",
        text:
          "BN forces every feature to mean 0 and variance 1. That fixes the scale of each " +
          "coordinate without changing which directions carry information — so under input " +
          "noise it rescales exactly the noise-dominated features right back up.",
        detail: "y = γ · (x − μ_B) / σ_B + β  ·  a moment constraint, not a geometric one"
      },
      {
        id: "output",
        kicker: "Desired output",
        title: "A geometric normalizer you can drop in",
        text:
          "Keep only the top-k singular directions of the batch and discard the rest. " +
          "One hyperparameter, no extra loss term, and it sits exactly where BatchNorm sits: " +
          "between a convolution and its activation.",
        detail: "X = U Σ Vᵀ  →  X̂ = U_k Σ_k V_kᵀ  ·  best rank-k approximation (Eckart–Young)"
      }
    ],
    gap:
      "Rank Reduction Autoencoders (Mounayer et al., 2024) showed the truncated SVD can " +
      "regularize an autoencoder with no extra loss term — but only at an autoencoder " +
      "bottleneck, entangled with the rest of that design. Nobody had asked what the SVD does " +
      "on its own, in BatchNorm's slot."
  },

  /* --------------------------------------------------------------------------
     NAVIGATION — section ids must match the ids rendered in App.jsx
     -------------------------------------------------------------------------- */
  sections: [
    { id: "team", label: "Team" },
    { id: "problem", label: "Problem" },
    { id: "research", label: "Research" },
    { id: "experiments", label: "Experiments" },
    { id: "results", label: "Results" },
    { id: "approach", label: "Why This" },
    { id: "system", label: "System" },
    { id: "demo", label: "Demo" }
  ]
};

export default project;
