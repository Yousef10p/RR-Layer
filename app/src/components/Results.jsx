import { Suspense, useState } from "react";
import {
  models,
  modelOrder,
  noiseSweep,
  noiseSweepMeta,
  scoreboard
} from "../data/results.js";
import Reveal from "./ui/Reveal.jsx";
import ChartFrame, { ChartSkeleton } from "./ui/ChartFrame.jsx";
import { HeadToHeadChart, NoiseSweepChart, TrainTestScatter } from "./charts/LazyCharts.jsx";
import { fmtMSE } from "../lib/format.js";
import "./Results.css";

const METRICS = [
  {
    id: "mse",
    label: "Test MSE",
    title: "Test MSE vs training-set size",
    sub: "Log-log · error bars are ±1 std over 32 seeds · lower is better"
  },
  {
    id: "gap",
    label: "Generalization gap",
    title: "Generalization gap vs training-set size",
    sub: "test MSE − train MSE · how much of the test error is memorization"
  }
];

/* Two-model comparison: pick A and B, everything below recomputes. */
function HeadToHead() {
  const [a, setA] = useState("OA_RR");
  const [b, setB] = useState("OA_BN");

  const ratios = noiseSweep.map((row) => row[b] / row[a]);
  const lo = Math.min(...ratios);
  const hi = Math.max(...ratios);
  const aWins = lo >= 1;

  const picker = (legend, value, setValue, other) => (
    <fieldset className="h2h__picker">
      <legend>{legend}</legend>
      <div className="chip-row">
        {modelOrder.map((key) => (
          <button
            key={key}
            type="button"
            className={`chip${value === key ? " is-active" : ""}`}
            aria-pressed={value === key}
            disabled={other === key}
            onClick={() => setValue(key)}
          >
            <span className="chip__dot" style={{ color: models[key].color }} />
            {models[key].label}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="h2h glass">
      <div className="h2h__head">
        <h3 className="h2h__title">Compare two models</h3>
        <p className="note">
          Under pixel noise std {noiseSweepMeta.noiseStd}, at every training-set size.
        </p>
      </div>

      <div className="h2h__pickers">
        {picker("Model A", a, setA, b)}
        <span className="h2h__vs" aria-hidden="true">
          vs
        </span>
        {picker("Model B", b, setB, a)}
      </div>

      <div className="h2h__chart">
        <Suspense fallback={<ChartSkeleton />}>
          <HeadToHeadChart a={a} b={b} />
        </Suspense>
      </div>

      <p className="h2h__verdict">
        <span className={`tag ${aWins ? "tag--win" : "tag--loss"}`}>
          {aWins ? `${models[a].label} ahead` : "Mixed"}
        </span>
        {aWins ? (
          <>
            <strong>{models[a].label}</strong> has {lo.toFixed(1)}–{hi.toFixed(1)}× lower test
            error than <strong>{models[b].label}</strong> at every training-set size from 25 to
            400 samples.
          </>
        ) : (
          <>
            <strong>{models[b].label}</strong> is ahead in places — every bar below the dashed
            line is a size where model B wins.
          </>
        )}
      </p>
    </div>
  );
}

/* Every setting we tested, one row each. The winner is computed in results.js. */
function Scoreboard() {
  return (
    <div className="board glass">
      <div className="board__head">
        <h3 className="board__title">Every setting we tested</h3>
        <p className="note">
          Test MSE, lower is better. The winner of each row is highlighted — BatchNorm never
          takes one.
        </p>
      </div>

      <div className="board__scroll">
        <table className="board__table">
          <caption className="sr-only">
            Test MSE for the plain, BatchNorm and SVD-layer networks across the four settings
            tested.
          </caption>
          <thead>
            <tr>
              <th scope="col">Setting</th>
              {modelOrder.map((key) => (
                <th scope="col" key={key} className="board__model">
                  <span className="chip__dot" style={{ color: models[key].color }} />
                  {models[key].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scoreboard.map((row) => (
              <tr key={row.id} className={row.headline ? "is-headline" : undefined}>
                <th scope="row">
                  <span className="board__setting">{row.setting}</span>
                  <span className="board__detail note">{row.detail}</span>
                  <span className="board__nuisance">nuisance: {row.nuisance}</span>
                </th>
                {modelOrder.map((key) => {
                  const value = row.values[key];
                  const isWinner = row.winner === key;
                  return (
                    <td
                      key={key}
                      className={`board__cell mono${isWinner ? " is-winner" : ""}`}
                      style={isWinner ? { "--win-color": models[key].color } : undefined}
                    >
                      {typeof value === "number" ? fmtMSE(value) : "—"}
                      {isWinner ? <span className="board__badge">best</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scoreboard
        .filter((row) => row.footnote)
        .map((row) => (
          <p className="note board__footnote" key={row.id}>
            {row.setting} — {row.footnote}
          </p>
        ))}
    </div>
  );
}

export default function Results() {
  const [visible, setVisible] = useState(modelOrder);
  const [metric, setMetric] = useState("mse");
  const active = METRICS.find((m) => m.id === metric);

  /* Keep the legend order stable and never let the chart go empty. */
  const toggle = (key) => {
    setVisible((current) =>
      current.includes(key)
        ? current.length > 1
          ? current.filter((k) => k !== key)
          : current
        : modelOrder.filter((k) => current.includes(k) || k === key)
    );
  };

  return (
    <section className="section" id="results" aria-labelledby="results-title">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">05 — Results</p>
          <h2 className="section__title" id="results-title">
            The numbers, all in one place
          </h2>
          <p className="section__sub">
            Toggle a model off to isolate a comparison, switch the metric, or put any two models
            head to head. Every value comes from the tables in our report.
          </p>
        </Reveal>

        <Reveal className="dash__controls">
          <div className="chip-row" role="group" aria-label="Models shown">
            {modelOrder.map((key) => (
              <button
                key={key}
                type="button"
                className={`chip${visible.includes(key) ? " is-active" : ""}`}
                aria-pressed={visible.includes(key)}
                onClick={() => toggle(key)}
              >
                <span className="chip__dot" style={{ color: models[key].color }} />
                {models[key].label}
              </button>
            ))}
          </div>

          <div className="chip-row" role="group" aria-label="Metric">
            {METRICS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip${metric === m.id ? " is-active" : ""}`}
                aria-pressed={metric === m.id}
                onClick={() => setMetric(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <ChartFrame title={active.title} subtitle={active.sub} height={320}>
            <NoiseSweepChart visible={visible} metric={metric} />
          </ChartFrame>
        </Reveal>

        <div className="dash__grid">
          <Reveal>
            <ChartFrame
              title="Train error vs test error"
              subtitle="One point per training-set size · bubble size = Ntr"
              note="Points on the dashed line generalize perfectly. The plain network sits on the left edge: it drives train error to zero, so its whole test error is the gap."
              height={300}
            >
              <TrainTestScatter visible={visible} />
            </ChartFrame>
          </Reveal>

          <Reveal delay={80}>
            <HeadToHead />
          </Reveal>
        </div>

        <Reveal delay={60}>
          <Scoreboard />
        </Reveal>
      </div>
    </section>
  );
}
