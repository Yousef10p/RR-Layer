import { useRef, useState } from "react";
import { experiments } from "../data/experiments.js";
import { models, modelOrder, noiseSweep } from "../data/results.js";
import Reveal from "./ui/Reveal.jsx";
import ChartFrame from "./ui/ChartFrame.jsx";
import { chartRegistry } from "./charts/LazyCharts.jsx";
import { fmtMSE } from "../lib/format.js";
import "./ExperimentLab.css";

const verdictClass = {
  win: "tag--win",
  loss: "tag--loss",
  calibration: "tag--neutral",
  ablation: "tag--neutral",
  diagnosis: "tag--neutral"
};

/* Horizontal bars comparing the three models at one training-set size. */
function MetricBars() {
  const [ntr, setNtr] = useState(100);
  const row = noiseSweep.find((r) => r.ntr === ntr) ?? noiseSweep[0];
  const max = Math.max(...modelOrder.map((key) => row[key]));

  return (
    <div className="bars glass">
      <div className="bars__head">
        <div>
          <h4 className="bars__title">Test MSE at one training-set size</h4>
          <p className="note">Input noise std 1.0 · 32 seeds · lower is better</p>
        </div>
        <div className="chip-row" role="group" aria-label="Training-set size">
          {noiseSweep.map((option) => (
            <button
              key={option.ntr}
              type="button"
              className={`chip${option.ntr === ntr ? " is-active" : ""}`}
              aria-pressed={option.ntr === ntr}
              onClick={() => setNtr(option.ntr)}
            >
              {option.ntr}
            </button>
          ))}
        </div>
      </div>

      <ul className="bars__list">
        {modelOrder.map((key) => {
          const value = row[key];
          const width = `${Math.max(4, (value / max) * 100)}%`;
          const best = value === Math.min(...modelOrder.map((k) => row[k]));
          return (
            <li className="bars__row" key={key}>
              <span className="bars__label">
                <span className="chip__dot" style={{ color: models[key].color }} />
                {models[key].label}
              </span>
              <span className="bars__track">
                <span
                  className="bars__fill"
                  style={{ width, background: models[key].color }}
                />
              </span>
              <span className={`bars__value mono${best ? " is-best" : ""}`}>
                {fmtMSE(value)}
                <em>± {fmtMSE(row[`${key}_std`])}</em>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="bars__footer note">
        Train MSE at Ntr = {ntr}: plain {fmtMSE(row.OA_train)}, BatchNorm {fmtMSE(row.OA_BN_train)},
        SVD layer {fmtMSE(row.OA_RR_train)}. The plain network drives training error to zero by
        memorizing the noise — its generalization gap is essentially its whole test error.
      </p>
    </div>
  );
}

export default function ExperimentLab() {
  const [activeId, setActiveId] = useState(experiments[1].id);
  const tabsRef = useRef([]);
  const active = experiments.find((e) => e.id === activeId) ?? experiments[0];
  const Chart = chartRegistry[active.chart];

  const onKeyDown = (event) => {
    const index = experiments.findIndex((e) => e.id === activeId);
    let next = null;
    if (event.key === "ArrowRight") next = (index + 1) % experiments.length;
    if (event.key === "ArrowLeft") next = (index - 1 + experiments.length) % experiments.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = experiments.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActiveId(experiments[next].id);
    tabsRef.current[next]?.focus();
  };

  return (
    <section className="section" id="experiments" aria-labelledby="experiments-title">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">04 — Experiment lab</p>
          <h2 className="section__title" id="experiments-title">
            Every experiment we ran
          </h2>
          <p className="section__sub">
            Pick one. Configuration, dataset and result are exactly as reported — including the one
            where our layer loses.
          </p>
        </Reveal>

        <Reveal>
          <div
            className="lab__tabs"
            role="tablist"
            aria-label="Experiments"
            onKeyDown={onKeyDown}
          >
            {experiments.map((experiment, index) => (
              <button
                key={experiment.id}
                ref={(el) => {
                  tabsRef.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${experiment.id}`}
                aria-selected={experiment.id === activeId}
                aria-controls={`panel-${experiment.id}`}
                tabIndex={experiment.id === activeId ? 0 : -1}
                className={`lab__tab${experiment.id === activeId ? " is-active" : ""} lab__tab--${experiment.verdict}`}
                onClick={() => setActiveId(experiment.id)}
              >
                <span className="lab__tab-number mono">{experiment.number}</span>
                <span className="lab__tab-name">{experiment.name}</span>
                {experiment.headline ? <span className="lab__tab-flag">headline</span> : null}
              </button>
            ))}
          </div>
        </Reveal>

        <div
          className="lab__panel glass"
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          key={active.id}
        >
          <header className="lab__header">
            <div>
              <span className={`tag ${verdictClass[active.verdict]}`}>{active.verdictLabel}</span>
              <h3 className="lab__title">{active.name}</h3>
              <p className="lab__question">{active.question}</p>
            </div>
          </header>

          <div className="lab__grid">
            <div className="lab__col">
              <section className="lab__block">
                <h4 className="lab__block-title">Objective</h4>
                <p>{active.objective}</p>
              </section>

              <section className="lab__block">
                <h4 className="lab__block-title">Method</h4>
                <p>{active.method}</p>
              </section>

              <section className="lab__block">
                <h4 className="lab__block-title">Dataset</h4>
                <p className="mono lab__dataset">{active.dataset}</p>
              </section>
            </div>

            <div className="lab__col">
              <section className="lab__block">
                <h4 className="lab__block-title">Configuration</h4>
                <dl className="config">
                  {Object.entries(active.configuration).map(([label, value]) => (
                    <div className="config__row" key={label}>
                      <dt>{label}</dt>
                      <dd className="mono">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="lab__block">
                <h4 className="lab__block-title">Models compared</h4>
                <ul className="lab__models">
                  {modelOrder.map((key) => (
                    <li key={key}>
                      <span className="chip__dot" style={{ color: models[key].color }} />
                      <strong>{models[key].label}</strong>
                      <span className="mono">{models[key].slot}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <section className="lab__results">
            <h4 className="lab__block-title">Results — {active.metricLabel}</h4>
            <ul className="keynums">
              {active.keyNumbers.map((item) => (
                <li className="keynum" key={item.label}>
                  <span className="keynum__label">{item.label}</span>
                  <span className="keynum__value">{item.value}</span>
                  <span className="keynum__note">{item.note}</span>
                </li>
              ))}
            </ul>

            {Chart ? (
              <ChartFrame
                title={active.name}
                subtitle={active.metricLabel}
                height={active.chart === "noiseSweep" ? 300 : 260}
              >
                <Chart />
              </ChartFrame>
            ) : null}

            {active.headline ? <MetricBars /> : null}

            {active.figure ? (
              <figure className="lab__figure">
                <img src={active.figure.src} alt={active.figure.alt} loading="lazy" />
                <figcaption className="note">{active.figure.caption}</figcaption>
              </figure>
            ) : null}
          </section>

          <section className="lab__conclusion">
            <h4 className="lab__block-title">Conclusion</h4>
            <p>{active.conclusion}</p>
            {active.mechanism ? (
              <p className="lab__mechanism">
                <span className="tag">Why</span>
                {active.mechanism}
              </p>
            ) : null}
            <p className="lab__takeaway">{active.takeaway}</p>
          </section>
        </div>
      </div>
    </section>
  );
}
