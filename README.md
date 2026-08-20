# RR Layer Experiments

## Overview

This repository contains experimental work investigating the **Rank Reduction (RR) layer** — a
neural-network layer that replaces its input batch with a truncated-SVD reconstruction computed
across the batch dimension. The RR layer derives from the Rank Reduction Autoencoders of
Mounayer et al. (2024); the experiments here study it as a standalone layer inside a convolutional
network, compared against Batch Normalization and against an unnormalized baseline.

The repository is intended to preserve the research experiments, the layer implementation, the
evaluations, and the associated presentation materials produced during this work.

## Team

The work was carried out by, as credited on the poster:

- Yousef Alogiely
- Abdulmohsen Mohammedsaleh
- Majed Alsulami

Supervisor: **Jad Mounayer** (jad.mounayer@outlook.com)

## Repository Contents

```text
repository/
├── RR_focused.ipynb    # RR Layer implementation and experiments (Colab/GPU notebook)
├── poster.pdf          # Research poster, "Batch Normalization using an SVD Layer"
├── poster.html         # HTML version/source of the poster
└── README.md           # This file
```

`RR_focused.ipynb` is self-contained: it defines the RR layer, the data generators, the model
variants, and the two experiments it reports, with stored outputs from a run on a GPU runtime
(notebook metadata records `gpuType: A100`).

## Experiments

### Layer implementation

The notebook defines `RRLayer(rank, basis_history_size=20, svd_backend="torch")`:

- **Training mode** — an input of shape `(N, *)` is reshaped to a matrix `X` of shape `(M, N)`
  (feature dimensions flattened, batch as the column index), a thin SVD is taken, and the input is
  reconstructed from the top-`rank` singular components, `X̂ = U_k Σ_k V_kᵀ`. Each batch's basis
  `U_k` is stored in a bounded history buffer.
- **Evaluation mode** — the input is projected onto a fixed *inference basis*, finalized either
  from the stored training bases (`finalize_basis`, an SVD of the concatenated history) or directly
  from a large batch of data (`finalize_basis_from_data`). A caller-supplied basis may also be
  passed to `forward`, bypassing both paths.
- **SVD backends** — `"torch"` uses autograd through `torch.linalg.svd`; `"custom"` uses
  `StableSVD`, a `torch.autograd.Function` with a hand-written analytic SVD backward. Forward
  passes use the `gesvd` driver on CUDA with a CPU LAPACK fallback on convergence failure. The
  experiments below run with the `"torch"` backend.

### Architectures compared

Three variants of the same convolutional regressor are built from **identical initial weights**
(the same seed is re-applied before each constructor), so the only difference is what occupies the
slot between each convolution and its ReLU:

| Model | Feature extractor block |
| --- | --- |
| `OA` | `Conv2d → ReLU` (plain baseline) |
| `OA_BN` | `Conv2d → BatchNorm2d → ReLU` |
| `OA_RR` | `Conv2d → RRLayer → ReLU` |

The extractor is 3 convolution blocks with channels `1 → 8 → 16 → 32`, kernel size 3, padding 1,
and no pooling (spatial size stays 64×64), followed by a flatten and a
`Linear(→128) → ReLU → Linear(→2)` head. In the RR variant the layer is inserted **after every
convolution**, flattening `(N, C, H, W)` internally and unflattening after.

### Task and data

The task is **point-source localization**: regress the centre `(x₀, y₀)` of a 2-D Gaussian source
(σ = 0.2) from a 64×64 image, with centres drawn uniformly from `[-0.5, 0.5]²`. Two data
generators are used:

- **Synthetic** (`generate_data`) — standardized Gaussian-blob images, with a per-seed
  `np.random.RandomState` so each seed yields a reproducible but distinct dataset.
- **Source injection on real backgrounds** (`generate_data_mnist`) — the same Gaussian source
  added to MNIST digits (bilinearly resized to 64×64, background amplitude 1.5), with **disjoint
  digit pools** for train and test, then standardized. Ground truth stays exact while the clutter
  statistics become real.

### Configuration

Adam, learning rate `1e-3`, MSE loss, batch size 32, rank `k = 8`, depth 3, 200 test samples.
The epoch budget is scaled as `20 × (800 / Ntr)` so every training-set size receives a comparable
number of gradient updates. Seeds are `2000…2031`.

### Metrics

Test MSE, mean and median L2 position error, final train MSE, and the generalization gap
(`test MSE − train MSE`), aggregated as mean ± std across seeds.

### Experiment 4 — small data and heavy noise

Additive Gaussian pixel noise with `noise_std = 1.0`, sweeping `Ntr ∈ {25, 50, 100, 200, 400}`
over **32 seeds**. Recorded test MSE (mean ± std):

| Ntr | `OA` | `OA_BN` | `OA_RR` |
| --- | --- | --- | --- |
| 25 | 0.0436 ± 0.0224 | 0.0763 ± 0.0276 | **0.0197 ± 0.0095** |
| 50 | 0.0241 ± 0.0192 | 0.0584 ± 0.0276 | **0.0091 ± 0.0059** |
| 100 | 0.0133 ± 0.0165 | 0.0379 ± 0.0296 | **0.0044 ± 0.0038** |
| 200 | 0.0060 ± 0.0085 | 0.0375 ± 0.0304 | **0.0025 ± 0.0020** |
| 400 | 0.0034 ± 0.0049 | 0.0258 ± 0.0263 | **0.0021 ± 0.0026** |

In this sweep `OA_RR` records the lowest test MSE and the smallest seed-to-seed spread at every
training-set size, together with the smallest generalization gap (e.g. 0.0197 versus 0.0435 for
`OA` at `Ntr = 25`).

### Experiment 6 — real MNIST backgrounds

Source injection on MNIST backgrounds, `Ntr = 200`, 16 seeds. Recorded test MSE (mean ± std):

| Model | Test MSE |
| --- | --- |
| `OA` | **0.0089 ± 0.0042** |
| `OA_BN` | 0.0755 ± 0.0215 |
| `OA_RR` | 0.0509 ± 0.0057 |

Here the plain network records the lowest error; `OA_RR` remains ahead of `OA_BN`.

The final notebook cell regenerates the individual poster figures (`exp4_test_mse`,
`exp4_train_mse`, `exp4_gap`, `exp6_preview`, `exp6_test_mse`) into a `poster_figs/` directory and
archive; those generated artifacts are not checked into this repository.

## Research Poster

`poster.pdf` contains the research poster, **"Batch Normalization using an SVD Layer"**
(Abdulmohsen Mohammedsaleh, Majed Alsulami, Yousef Alogiley; mentor: Jad Mounayer;
KAUST Academy Summer Program 2026). `poster.html` contains the HTML version/source from which the
poster was rendered; its text corresponds to an earlier revision and differs from `poster.pdf` in
places, notably in the statement of the layer's reconstruction and in the concluding remarks.

The poster asks whether the truncated SVD alone can normalize a batch as well as Batch
Normalization does, motivated by the observation that Rank Reduction Autoencoders regularize
networks through the truncated SVD with no added loss term and, like BN, alter the statistics of
the batch. It presents the point-source localization task, the Plain/BN/SVD comparison from
identical initial weights, a sweep over rank `k`, and the source-injection check on real
backgrounds. Its stated conclusion is that the SVD layer is a more robust drop-in alternative to
BN and, under input noise, outperforms even the unregularized network at every dataset size
tested, with the noted limitation that the retained singular values are unconstrained so the batch
mean is not forced to be small — encouraging singular values toward 1 or 0 is given as the natural
next step. The poster also records that early training blow-ups traced to a bug in the
hand-written SVD gradient rather than to the layer itself.

## Repository Purpose

This repository serves as a record of research experiments and supporting materials related to the
RR Layer.

## References

- J. Mounayer, S. Rodriguez, C. Ghnatios, E. Cueto, F. Chinesta. *Rank Reduction Autoencoders*.
  arXiv:2405.13980, 2024. <https://arxiv.org/abs/2405.13980> — the original paper introducing the
  rank-reduction mechanism on which this layer is based.
<!-- - S. Ioffe, C. Szegedy. *Batch Normalization: Accelerating Deep Network Training by Reducing
  Internal Covariate Shift*. ICML 2015. <https://arxiv.org/abs/1502.03167>
- R. Soummer, L. Pueyo, J. Larkin. *Detection and Characterization of Exoplanets and Disks Using
  Projections on Karhunen-Loève Eigenimages (KLIP)*. ApJL 2012.
  <https://arxiv.org/abs/1207.4197> — cited in `poster.html`. -->

