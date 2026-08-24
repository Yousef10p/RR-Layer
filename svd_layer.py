"""
svd_layer.py -- a standalone SVD (Rank Reduction) layer for PyTorch.

Drop-in batch-level layer: during training it rebuilds each mini-batch from
its top-k singular components (truncated SVD across the batch dimension);
during evaluation it projects onto a frozen inference basis, mirroring how
BatchNorm switches from batch statistics to running statistics.

Usage:
    from svd_layer import RRLayer
    block = nn.Sequential(nn.Conv2d(8, 16, 3, padding=1), RRLayer(rank=8), nn.ReLU())

Reference: J. Mounayer et al., "Rank Reduction Autoencoders", arXiv:2405.13980.
KAUST Academy Summer Program 2026 -- "Batch Normalization using an SVD Layer".
"""

import warnings
import math
import torch
import torch.nn as nn
from collections import deque


def stable_svd(X, full_matrices=False):
    # cusolver's default gesvdj can fail to converge on ill-conditioned / repeated-singular-value
    # matrices (common with grid-structured data). Use the accurate gesvd driver on CUDA,
    # and fall back to CPU LAPACK if it still fails. Gradients flow through both paths.
    try:
        if X.is_cuda:
            return torch.linalg.svd(X, full_matrices=full_matrices, driver='gesvd')
        return torch.linalg.svd(X, full_matrices=full_matrices)
    except torch.linalg.LinAlgError:
        U, S, Vh = torch.linalg.svd(X.cpu(), full_matrices=full_matrices)
        return U.to(X.device), S.to(X.device), Vh.to(X.device)


class StableSVD(torch.autograd.Function):
    """
    Custom analytic-gradient SVD. The forward pass uses `stable_svd` (gesvd
    driver on CUDA, CPU LAPACK fallback) for numerical robustness; the
    backward pass implements the analytic SVD gradient by hand instead of
    relying on autograd through torch.linalg.svd.
    """

    @staticmethod
    def forward(ctx, A):
        U, S, Vh = stable_svd(A, full_matrices=False)

        ctx.save_for_backward(U, S, Vh)
        ctx.original_shape = A.shape

        return U, S, Vh

    @staticmethod
    def backward(ctx, dU, dS, dVh):
        """
        Backward pass for stable SVD.
        Computes gradient w.r.t. input A given gradients on U, S, Vh.
        """
        U, S, Vh = ctx.saved_tensors
        m, n = ctx.original_shape[-2:]

        dtype = U.dtype
        device = U.device

        H = lambda x: x.transpose(-2, -1).conj()
        T = lambda x: x.transpose(-2, -1)

        # Diagonal helpers
        def diag_embed(x):
            return torch.diag_embed(x)

        # Singular value vector to diagonal for broadcasting
        S_mat = S.unsqueeze(-2)
        S_diff = S_mat - S_mat.transpose(-2, -1)

        # F matrix for repeated singular values
        eps = 1e-20
        F = torch.where(S_diff.abs() > eps, 1.0 / S_diff, torch.zeros_like(S_diff))

        # Gradient from singular values
        dA = U @ diag_embed(dS) @ Vh

        # Contributions from U
        Ut_dU = H(U) @ dU
        skew_U = F * (Ut_dU - Ut_dU.transpose(-2, -1))
        dA += U @ skew_U @ diag_embed(S) @ Vh

        # Contributions from V
        V = H(Vh)  # n x k
        Vt_dV = H(V) @ H(dVh)  # k x k
        skew_V = F * (Vt_dV - Vt_dV.transpose(-2, -1))
        dA += U @ diag_embed(S) @ skew_V @ Vh

        # Rectangular adjustments (like JAX)
        # s_inv = 1 / S with stable zero handling
        s_zeros = (S == 0).to(dtype)
        s_inv = 1.0 / (S + s_zeros) - s_zeros  # shape: (k,)

        if m > n:
            dAV = dA @ V
            dA += (dAV - U @ (H(U) @ dAV)) * s_inv
        elif n > m:
            dAHU = H(dA) @ U
            dA += H(dAHU - V @ (Vh @ dAHU)) * s_inv.unsqueeze(1)

        return dA


class RRLayer(nn.Module):
    r"""
    Rank Reduction (RR) layer.

    During training, the layer computes a truncated SVD across the batch
    dimension and reconstructs the input using the top ``rank`` singular
    components.

    During evaluation, the layer projects the input onto a learned inference
    basis obtained from the recent training bases.

    A custom basis can always be supplied through the ``basis`` argument of
    :meth:`forward`, in which case the train/eval behavior is bypassed.

    Args:
        rank (int):
            Number of singular values to retain.

        basis_history_size (int, optional):
            Number of recent batch bases to keep when estimating the inference
            basis. Default: 20.

        svd_backend (str, optional):
            Which SVD implementation to use internally:
              - "custom": ``StableSVD.apply`` -- the hand-written analytic
                backward defined above.
              - "torch": ``stable_svd(...)`` directly -- PyTorch's native
                autograd through ``torch.linalg.svd``.
            Default: "torch".

    Shape:
        - Input: ``(N, *)``
        - Output: ``(N, *)``

    Example:
        >>> rr = RRLayer(rank=8)
        >>> rr.train()
        >>> y = rr(torch.randn(32, 768))

        >>> rr.eval()
        >>> y = rr(torch.randn(32, 768))
    """

    def __init__(
        self,
        rank: int,
        basis_history_size: int = 20,
        svd_backend: str = "torch",
    ):
        super().__init__()

        if rank <= 0:
            raise ValueError(
                f"rank must be positive, got {rank}."
            )

        if basis_history_size <= 0:
            raise ValueError(
                f"basis_history_size must be positive, got "
                f"{basis_history_size}."
            )

        if svd_backend not in ("custom", "torch"):
            raise ValueError(
                f"svd_backend must be 'custom' or 'torch', got {svd_backend!r}."
            )

        self.rank = rank
        self.basis_history_size = basis_history_size
        self.svd_backend = svd_backend

        self.register_buffer(
            "inference_basis",
            None,
            persistent=True,
        )

        self._basis_bank = deque(
            maxlen=basis_history_size,
        )

    def _svd(self, X: torch.Tensor):
        """Dispatches to the configured SVD backend."""
        if self.svd_backend == "custom":
            return StableSVD.apply(X)
        return stable_svd(X, full_matrices=False)

    def extra_repr(self) -> str:
        return (
            f"rank={self.rank}, "
            f"basis_history_size={self.basis_history_size}, "
            f"svd_backend={self.svd_backend!r}"
        )

    def train(self, mode: bool = True):
        """
        Switch between training and evaluation mode.

        When switching from training to evaluation for the first time,
        an inference basis is automatically computed from the stored
        training bases.
        """

        previous_mode = self.training

        super().train(mode)

        if (
            previous_mode
            and not mode
            and self.inference_basis is None
            and len(self._basis_bank) > 0
        ):
            self.finalize_basis()

        return self

    @torch.no_grad()
    def finalize_basis(self) -> None:
        """
        Build the inference basis from the stored training bases.
        """

        if len(self._basis_bank) == 0:
            raise RuntimeError(
                "Cannot finalize basis: no stored bases available."
            )

        device = next(self.parameters(), None)

        if device is None:
            device = self.inference_basis.device \
                if self.inference_basis is not None \
                else self._basis_bank[0].device
        else:
            device = device.device

        W = torch.cat(
            [
                basis.to(device)
                for basis in self._basis_bank
            ],
            dim=1,
        )

        U, _, _ = self._svd(W)

        r = min(self.rank, U.shape[1])

        self.inference_basis = U[:, :r]

    @torch.no_grad()
    def finalize_basis_from_data(self, x: torch.Tensor) -> None:
        """
        Build the inference basis directly from a large batch of real data,
        rather than concatenating many small per-minibatch training bases.

        This gives a basis much closer to a true full-dataset SVD -- which
        is what the downstream layers are implicitly trained to expect --
        instead of an average of noisy, small-sample bases.

        x: shape (N, *), same convention as forward()'s input.
        """
        original_shape = x.shape
        batch_size = original_shape[0]

        X = torch.movedim(x, 0, -1)
        X = X.reshape(-1, batch_size)

        U, _, _ = self._svd(X)
        r = min(self.rank, U.shape[1])
        self.inference_basis = U[:, :r]

    def _validate_inputs(
        self,
        x: torch.Tensor,
        basis: torch.Tensor | None,
    ) -> None:
        """
        Validate inputs for RRLayer.
        """

        if not isinstance(x, torch.Tensor):
            raise TypeError(
                f"x must be a torch.Tensor, got {type(x)}."
            )

        if x.ndim < 2:
            raise ValueError(
                "RRLayer expects input of shape (N, ...), "
                f"got shape {tuple(x.shape)}."
            )

        if x.shape[0] == 0:
            raise ValueError(
                "Batch size must be greater than zero."
            )

        if not torch.isfinite(x).all():
            raise ValueError(
                "Input tensor contains NaN or Inf values."
            )

        M = math.prod(x.shape[1:])
        N = x.shape[0]

        rank_max = min(M, N)

        if self.rank > rank_max:
            warnings.warn(
                f"Requested rank={self.rank}, but the maximum "
                f"achievable rank is {rank_max}. "
                f"Using rank={rank_max}.",
                stacklevel=2,
            )

        if basis is not None:

            if not isinstance(basis, torch.Tensor):
                raise TypeError(
                    f"basis must be a torch.Tensor, got {type(basis)}."
                )

            if basis.ndim != 2:
                raise ValueError(
                    "basis must have shape (M, r), "
                    f"got shape {tuple(basis.shape)}."
                )

            if basis.shape[0] != M:
                raise ValueError(
                    f"basis has {basis.shape[0]} rows but "
                    f"expected {M}."
                )

            if basis.shape[1] == 0:
                raise ValueError(
                    "basis must contain at least one column."
                )

            if basis.device != x.device:
                raise ValueError(
                    f"basis is on {basis.device} while "
                    f"x is on {x.device}."
                )

            if basis.dtype != x.dtype:
                raise ValueError(
                    f"basis dtype ({basis.dtype}) does not match "
                    f"x dtype ({x.dtype})."
                )

            if not torch.isfinite(basis).all():
                raise ValueError(
                    "basis contains NaN or Inf values."
                )

    def forward(
        self,
        x: torch.Tensor,
        basis: torch.Tensor | None = None,
        return_factors: bool = False,
    ):
        self._validate_inputs(x, basis)

        original_shape = x.shape
        batch_size = original_shape[0]

        X = torch.movedim(x, 0, -1)
        X = X.reshape(-1, batch_size)

        if basis is not None:

            basis_used = basis

            coeffs = basis_used.T @ X

            X_hat = basis_used @ coeffs

        elif self.training:

            U, S, Vh = self._svd(X)

            r = min(self.rank, S.shape[0])

            basis_used = U[:, :r]

            coeffs = (
                S[:r].unsqueeze(1)
                * Vh[:r]
            )

            X_hat = basis_used @ coeffs

            self._basis_bank.append(
                basis_used.detach().cpu()
            )

        else:

            if self.inference_basis is None:
                raise RuntimeError(
                    "RRLayer has no inference basis. "
                    "Call finalize_basis() or run training "
                    "before evaluation."
                )

            # basis bank lives on CPU, so the finalized basis may be too -- follow x
            basis_used = self.inference_basis.to(device=X.device, dtype=X.dtype)

            coeffs = basis_used.T @ X

            X_hat = basis_used @ coeffs

        output = X_hat.reshape(
            *original_shape[1:],
            batch_size,
        )

        output = torch.movedim(
            output,
            -1,
            0,
        )

        if return_factors:
            return output, basis_used, coeffs

        return output

if __name__ == "__main__":
    # Self-check: shapes, rank constraint, and train->eval round trip.
    torch.manual_seed(0)
    rr = RRLayer(rank=4)

    x = torch.randn(16, 8, 5, 5)
    y = rr(x)
    assert y.shape == x.shape

    # Output batch matrix must have rank <= 4.
    Y = y.reshape(16, -1).T
    s = torch.linalg.svdvals(Y)
    assert (s[4:] < 1e-4 * s[0]).all(), "rank constraint violated"

    # Gradients flow through the truncated SVD.
    x2 = torch.randn(16, 8, 5, 5, requires_grad=True)
    rr(x2).sum().backward()
    assert x2.grad is not None and torch.isfinite(x2.grad).all()

    # Eval mode uses the frozen inference basis built from training bases.
    rr.eval()
    y_eval = rr(torch.randn(16, 8, 5, 5))
    assert y_eval.shape == (16, 8, 5, 5)
    assert rr.inference_basis is not None and rr.inference_basis.shape[1] == 4

    print("svd_layer.py self-check passed")
