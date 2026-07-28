# OA vs BN vs RR

This notebook (`OA_vs_BN_vs_RR.ipynb`) compares three versions of the same small image-regression model. All three share the same convolutional feature extractor and the same final linear layers — they only differ in what sits between them (the "bottleneck"):

- **OA** — no bottleneck, features pass straight through.
- **OA_BN** — a BatchNorm layer (a standard normalization trick).
- **OA_RR** — a custom "Rank Reduction" layer that compresses features down to their most important directions (via SVD) before passing them on.

The task: look at an image of a 2D Gaussian blob and predict the (x, y) coordinates of its center.

Below is what each section of the notebook does, in plain English.

## Notebook flow

```mermaid
flowchart TD
    A["Getting Data<br/>generate_data(seed) -> Gaussian-blob images + centers"]
    Acom["uses a seeded RNG, so the<br/>same seed = the same dataset<br/>every time it's rerun"]

    B["Prepare dataset<br/>GaussianCenterDataset / DataLoader"]
    Bcom["wraps images + centers so<br/>they can be fed to a model<br/>in batches"]

    C["common make_feature_extractor()<br/>shared conv blocks, depth 1-3"]
    Ccom["builds the shared 'eyes';<br/>depth is adjustable so it can<br/>be reused for the depth sweep"]

    D1["Original Architecture<br/>OA"]
    D1com["no bottleneck: features go<br/>straight to the output layers"]

    D2["Batch_Norm Architecture<br/>OA_BN"]
    D2com["same as OA, + a BatchNorm<br/>bottleneck before the output"]

    D3["RR_Layers Architecture<br/>OA_RR"]
    D3com["same as OA, + the custom<br/>Rank-Reduction (SVD) bottleneck"]

    E["Experiment configuration & model builder<br/>build_models(seed): same starting weights for all three"]
    Ecom["re-applies the same seed before<br/>building each model, so all three<br/>start with identical weights"]

    F["Sanity check<br/>shared initial weights across OA / OA_BN / OA_RR"]
    Fcom["confirms that identical-weights<br/>claim by comparing layers<br/>one by one"]

    G["Training / evaluation / multi-seed infrastructure<br/>train_and_evaluate, run_single_experiment, run_multi_seed, plot helpers"]
    Gcom["defines the reusable train / test /<br/>repeat-across-seeds / plot functions;<br/>nothing is trained yet here"]

    H["Baseline sanity check<br/>(single seed)"]
    Hcom["one quick run, one seed -<br/>just confirms training works<br/>end-to-end"]

    I["Baseline plots"]
    Icom["visualizes that single run's<br/>loss curve and test metrics"]

    J["Multi-seed comparison<br/>(mean ± std over 8 seeds)"]
    Jcom["the real answer: averages 8 seeds<br/>so results aren't just a lucky<br/>or unlucky run"]

    K["Architecture depth sweep<br/>(does BN/RR help independent of extractor depth?)"]
    Kcom["repeats the comparison with a<br/>1, 2, and 3-block extractor to see<br/>if the effect survives a smaller net"]

    L["Training set size sweep<br/>(when does OA start overfitting, and do BN/RR help?)"]
    Lcom["repeats the comparison at<br/>800/500/300/150 samples to see<br/>when overfitting kicks in"]

    A --> B --> C
    C --> D1 --> E
    C --> D2 --> E
    C --> D3 --> E
    E --> F --> G
    G --> H --> I
    G --> J
    G --> K
    G --> L

    A -.- Acom
    B -.- Bcom
    C -.- Ccom
    D1 -.- D1com
    D2 -.- D2com
    D3 -.- D3com
    E -.- Ecom
    F -.- Fcom
    G -.- Gcom
    H -.- Hcom
    I -.- Icom
    J -.- Jcom
    K -.- Kcom
    L -.- Lcom

    classDef comment fill:none,stroke:#999,stroke-dasharray: 3 3,color:#777,font-style:italic;
    class Acom,Bcom,Ccom,D1com,D2com,D3com,Ecom,Fcom,Gcom,Hcom,Icom,Jcom,Kcom,Lcom comment;
```

Everything above "Training / evaluation / multi-seed infrastructure" is setup (data, datasets, model definitions). Everything below it reuses the same toolbox to run four different comparisons: a quick one-seed check, the real multi-seed comparison, a sweep over feature-extractor depth, and a sweep over training-set size.

## Getting Data

Generates the Gaussian-blob images and their true center coordinates. Uses a seeded random generator so the same seed always produces the same dataset — important for making comparisons across runs reproducible instead of accidentally comparing different data each time.

## Prepare dataset

Wraps the generated images and coordinates into a PyTorch `Dataset`/`DataLoader` so they can be fed to a model in batches during training.

## common make_feature_extractor()

Builds the shared "eyes" of all three models — a stack of convolution + pooling blocks that shrink the image and extract features. The number of blocks (depth) is adjustable, so the same function can build a shallow or deep extractor later on.

## Original Architecture

Defines **OA**: feature extractor → straight into the final linear layers, no bottleneck. The baseline everything else is compared against.

## Batch_Norm Architecture

Defines **OA_BN**: same as OA, but with a BatchNorm layer inserted right before the final linear layers.

## RR_Layers Architecture

Defines **OA_RR**: same as OA, but with the custom Rank Reduction layer inserted before the final linear layers.

## Experiment configuration & model builder

Sets the shared settings used everywhere below (how many random seeds to test, how many training samples, how many epochs, learning rate, etc.), and defines `build_models`, which creates OA / OA_BN / OA_RR with **identical starting weights** for a given seed — so any difference in results comes from the bottleneck, not from lucky/unlucky initialization.

## Sanity check: shared initial weights across OA / OA_BN / OA_RR

Double-checks that `build_models` really did give all three models the same starting weights, by comparing their layers one by one.

## Training / evaluation / multi-seed infrastructure

The toolbox the rest of the notebook runs on — defines the reusable functions for training, testing, repeating an experiment across many random seeds, and plotting the results with error bars. Nothing is trained yet in this cell.

## Baseline sanity check (single seed)

Trains all three models once, on one seed, printing the loss every epoch — a quick "does everything work?" check before running the expensive multi-seed experiments.

## Baseline plots

Two plots for that single quick run: a bar chart of final test error per model, and a line chart of training loss over epochs.

## Multi-seed comparison (mean ± std)

The real comparison. Repeats the full experiment across 8 different random seeds and reports the **average result ± how much it varies** for each model, instead of trusting a single lucky/unlucky run. 

## (does BN/RR help independent of extractor depth?)

Repeats the full 8-seed comparison with a 1-block, 2-block, and 3-block (original) feature extractor, to check whether BatchNorm/RR's benefit holds up even with a much smaller network, or whether it's specific to the original architecture size.

## (when does OA start overfitting, and do BN/RR help?)

Repeats the full 8-seed comparison with 800, 500, 300, and 150 training images. Tracks the gap between training error and test error at each size — a growing gap is the signature of overfitting — to see when the plain model (OA) starts overfitting, and whether BatchNorm or RR delay or reduce it.
