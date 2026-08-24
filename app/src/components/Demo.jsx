import { useEffect, useMemo, useRef, useState } from "react";
import { makeBatch, stackMSE, truncatedSVD } from "../lib/svd.js";
import { drawImage, stackRange } from "../lib/render.js";
import { setup } from "../data/results.js";
import Reveal from "./ui/Reveal.jsx";
import "./Demo.css";

const SIZE = 32;
const BATCH = 16;

const NUISANCE = [
  {
    id: "noise",
    label: "Pixel noise",
    caption: "i.i.d. noise — spread evenly across every singular direction",
    expect: "The layer should strip it: the spectrum is long and flat past the signal."
  },
  {
    id: "structure",
    label: "Structured clutter",
    caption: "a strong low-rank background shared across the batch",
    expect: "The layer should keep it: the clutter sits in the top directions itself."
  }
];

/** One labelled 32×32 panel. */
function Panel({ title, data, range, tone, note }) {
  const ref = useRef(null);

  useEffect(() => {
    drawImage(ref.current, data, SIZE, range);
  }, [data, range]);

  return (
    <figure className={`panel${tone ? ` panel--${tone}` : ""}`}>
      <canvas ref={ref} className="panel__canvas" role="img" aria-label={`${title}: ${note}`} />
      <figcaption>
        <span className="panel__title">{title}</span>
        <span className="panel__note note">{note}</span>
      </figcaption>
    </figure>
  );
}

export default function Demo() {
  const [nuisanceId, setNuisanceId] = useState("noise");
  const [strength, setStrength] = useState(1);
  const [rank, setRank] = useState(4);
  const [seed, setSeed] = useState(7);
  const [index, setIndex] = useState(0);

  const nuisance = NUISANCE.find((n) => n.id === nuisanceId);

  const batch = useMemo(
    () =>
      makeBatch({
        size: SIZE,
        batch: BATCH,
        sigma: 0.22,
        nuisance: nuisanceId,
        strength,
        seed
      }),
    [nuisanceId, strength, seed]
  );

  const result = useMemo(() => truncatedSVD(batch.input, rank), [batch, rank]);

  const mseBefore = useMemo(() => stackMSE(batch.input, batch.clean), [batch]);
  const mseAfter = useMemo(() => stackMSE(result.recon, batch.clean), [result, batch]);
  const improvement = mseBefore / Math.max(mseAfter, 1e-12);
  const clean = strength < 0.05; // nothing to remove — the slider is at zero
  const helped = !clean && improvement > 1.05;

  const range = useMemo(
    () => stackRange([batch.input[index], result.recon[index], batch.clean[index]]),
    [batch, result, index]
  );

  const spectrum = result.singular;
  const peak = Math.max(...spectrum, 1e-9);
  const [probe, setProbe] = useState(null);
  const probed = probe !== null && probe < spectrum.length ? probe : null;

  return (
    <section className="section" id="demo" aria-labelledby="demo-title">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">08 — Interactive demo</p>
          <h2 className="section__title" id="demo-title">
            Run the layer yourself
          </h2>
          <p className="section__sub">
            This is the layer&rsquo;s actual operation — a batch of 16 images is flattened into a
            matrix, truncated to its top-k singular components and rebuilt — computed live in your
            browser. Change the nuisance and watch the result invert.
          </p>
        </Reveal>

        <Reveal className="disclaimer">
          <span className="tag tag--neutral">What this is</span>
          <p>
            Real math, not the trained network. The truncated SVD below is the same operation the
            PyTorch layer performs, running on synthetic data in JavaScript. Our trained model is
            not shipped to the browser, and none of these numbers are stored results — they are
            computed from what you see.
          </p>
        </Reveal>

        <Reveal className="demo glass">
          <div className="demo__controls">
            <div className="control">
              <span className="control__label" id="demo-nuisance">
                Nuisance
              </span>
              <div className="chip-row" role="group" aria-labelledby="demo-nuisance">
                {NUISANCE.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`chip${nuisanceId === option.id ? " is-active" : ""}`}
                    aria-pressed={nuisanceId === option.id}
                    onClick={() => setNuisanceId(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="control__hint note">{nuisance.caption}</p>
            </div>

            <div className="control">
              <label className="control__label" htmlFor="demo-rank">
                Rank k — kept directions
                <output className="control__value mono">{rank}</output>
              </label>
              <input
                id="demo-rank"
                type="range"
                min="1"
                max={BATCH}
                step="1"
                value={rank}
                onChange={(event) => setRank(Number(event.target.value))}
              />
              <p className="control__hint note">
                {rank === BATCH
                  ? "k equals the batch size — no truncation at all."
                  : `${BATCH - rank} of ${BATCH} directions discarded · ${(
                      result.energyKept * 100
                    ).toFixed(1)}% of the batch energy kept.`}
              </p>
            </div>

            <div className="control">
              <label className="control__label" htmlFor="demo-strength">
                Nuisance strength
                <output className="control__value mono">{strength.toFixed(2)}</output>
              </label>
              <input
                id="demo-strength"
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={strength}
                onChange={(event) => setStrength(Number(event.target.value))}
              />
              <p className="control__hint note">
                Source peak is 1.0, so 1.00 means the nuisance is as strong as the signal.
              </p>
            </div>

            <div className="control control--actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setSeed((s) => s + 1)}
              >
                New batch
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setIndex((i) => (i + 1) % BATCH)}
              >
                Next sample
              </button>
              <span className="note">
                sample {index + 1} of {BATCH}
              </span>
            </div>
          </div>

          <div className="demo__stage" key={`${nuisanceId}-${rank}-${seed}-${index}`}>
            <Panel
              title="Input"
              data={batch.input[index]}
              range={range}
              note="what the layer receives"
            />
            <span className="demo__arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  d="M4 12h14m0 0-5-5m5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <em className="mono">rank {rank}</em>
            </span>
            <Panel
              title="After the SVD layer"
              data={result.recon[index]}
              range={range}
              tone="ours"
              note="rebuilt from the top-k directions"
            />
            <span className="demo__arrow demo__arrow--compare" aria-hidden="true">
              <em className="mono">compare</em>
            </span>
            <Panel
              title="Clean source"
              data={batch.clean[index]}
              range={range}
              note="the signal we want to recover"
            />
          </div>

          <div className="demo__readout">
            <div className="spectrum">
              <div className="spectrum__head">
                <h3 className="spectrum__title">Singular values of this batch</h3>
                <p className="note">
                  {probed === null ? (
                    <>
                      Bars left of the cut are kept. Tap one for its value — computed from the Gram
                      matrix XᵀX by Jacobi eigendecomposition.
                    </>
                  ) : (
                    <>
                      <span className="mono spectrum__probe">
                        σ{probed + 1} = {spectrum[probed].toFixed(2)}
                      </span>{" "}
                      · {probed < rank ? "kept by the layer" : "discarded by the layer"}
                    </>
                  )}
                </p>
              </div>
              <div className="spectrum__bars">
                {spectrum.map((value, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`spectrum__bar${i < rank ? " is-kept" : " is-dropped"}${
                      probed === i ? " is-probed" : ""
                    }`}
                    style={{ "--h": `${Math.max(2, (value / peak) * 100)}%` }}
                    onClick={() => setProbe(probed === i ? null : i)}
                    onMouseEnter={() => setProbe(i)}
                    onMouseLeave={() => setProbe(null)}
                    aria-label={`Singular value ${i + 1}: ${value.toFixed(2)}, ${
                      i < rank ? "kept" : "discarded"
                    }`}
                  />
                ))}
              </div>
              <div className="spectrum__axis note">
                <span>σ₁</span>
                <span>σ{BATCH}</span>
              </div>
            </div>

            <div className="verdict-card">
              <h3 className="verdict-card__title">Distance to the clean source</h3>
              <ul className="verdict-card__rows">
                <li>
                  <span>Input</span>
                  <span className="mono">{mseBefore.toFixed(4)}</span>
                </li>
                <li className="is-ours">
                  <span>After the layer</span>
                  <span className="mono">{mseAfter.toFixed(4)}</span>
                </li>
              </ul>
              <p className={`verdict-card__verdict${helped ? " is-good" : " is-bad"}`}>
                {clean ? (
                  <>
                    <strong>Nothing to remove</strong> — with no nuisance the projection can only
                    lose signal. Turn the strength up.
                  </>
                ) : helped ? (
                  <>
                    <strong>{improvement.toFixed(1)}× closer</strong> to the clean source after the
                    projection.
                  </>
                ) : (
                  <>
                    <strong>No gain</strong> — the projection keeps the nuisance along with the
                    signal.
                  </>
                )}
              </p>
              <p className="note">{clean ? "Add a nuisance to see what the layer does with it." : nuisance.expect}</p>
            </div>
          </div>

          <p className="demo__link note">
            This is the mechanism behind both of our headline findings: it strips a high-rank
            nuisance and preserves a low-rank one. In the real experiments the layer sits inside the
            network at k&nbsp;=&nbsp;{setup.rank}, with a batch of {setup.batchSize}.{" "}
            <a href="#experiments">Back to the experiments</a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
