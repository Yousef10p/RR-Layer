import { useRef, useState } from "react";
import { pipeline } from "../data/pipeline.js";
import { setup } from "../data/results.js";
import Reveal from "./ui/Reveal.jsx";
import "./System.css";

export default function System() {
  const [activeId, setActiveId] = useState("svd");
  const [mode, setMode] = useState("train");
  const stageRefs = useRef([]);
  const active = pipeline.find((stage) => stage.id === activeId) ?? pipeline[0];

  const onKeyDown = (event) => {
    const index = pipeline.findIndex((stage) => stage.id === activeId);
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % pipeline.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + pipeline.length) % pipeline.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = pipeline.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActiveId(pipeline[next].id);
    stageRefs.current[next]?.focus();
  };

  return (
    <section className="section" id="system" aria-labelledby="system-title">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">07 — Final system</p>
          <h2 className="section__title" id="system-title">
            Our final approach, end to end
          </h2>
          <p className="section__sub">
            Tap any stage to see what happens there. Only one of these six boxes is new — the rest
            is a deliberately ordinary network, so the comparison stays clean.
          </p>
        </Reveal>

        <Reveal>
          <div
            className="pipe"
            role="tablist"
            aria-label="Pipeline stages"
            onKeyDown={onKeyDown}
          >
            {pipeline.map((stage, index) => (
              <div className="pipe__slot" key={stage.id}>
                <button
                  type="button"
                  role="tab"
                  ref={(el) => {
                    stageRefs.current[index] = el;
                  }}
                  id={`stage-${stage.id}`}
                  aria-selected={stage.id === activeId}
                  aria-controls="stage-panel"
                  tabIndex={stage.id === activeId ? 0 : -1}
                  className={`pipe__stage${stage.id === activeId ? " is-active" : ""}${
                    stage.highlight ? " is-ours" : ""
                  }`}
                  onClick={() => setActiveId(stage.id)}
                >
                  <span className="pipe__index mono">{String(index + 1).padStart(2, "0")}</span>
                  <span className="pipe__label">{stage.label}</span>
                  <span className="pipe__formula mono">{stage.formula}</span>
                  {stage.highlight ? <span className="pipe__flag">ours</span> : null}
                </button>

                {index < pipeline.length - 1 ? (
                  <span className="pipe__arrow" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        d="M4 12h14m0 0-5-5m5 5-5 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </Reveal>

        <div
          className={`stage glass${active.highlight ? " is-ours" : ""}`}
          id="stage-panel"
          role="tabpanel"
          aria-labelledby={`stage-${active.id}`}
          key={active.id}
        >
          <div className="stage__body">
            <p className="stage__kicker">
              Stage {pipeline.findIndex((s) => s.id === active.id) + 1} of {pipeline.length}
            </p>
            <h3 className="stage__title">{active.title}</h3>
            <p className="stage__formula mono">{active.formula}</p>
            <p className="stage__text">{active.text}</p>
            <p className="stage__detail note">{active.detail}</p>

            {active.modes ? (
              <div className="stage__modes">
                <div className="chip-row" role="group" aria-label="Layer mode">
                  <button
                    type="button"
                    className={`chip${mode === "train" ? " is-active" : ""}`}
                    aria-pressed={mode === "train"}
                    onClick={() => setMode("train")}
                  >
                    model.train()
                  </button>
                  <button
                    type="button"
                    className={`chip${mode === "eval" ? " is-active" : ""}`}
                    aria-pressed={mode === "eval"}
                    onClick={() => setMode("eval")}
                  >
                    model.eval()
                  </button>
                </div>
                <p className="stage__mode-text">{active.modes[mode]}</p>
              </div>
            ) : null}
          </div>

          <aside className="stage__side">
            <h4 className="stage__side-title">Shared setup</h4>
            <dl className="stage__specs">
              {[
                ["Image", setup.imageSize],
                ["Backbone", setup.backbone],
                ["Head", setup.head],
                ["Rank k", setup.rank],
                ["Optimizer", `${setup.optimizer}, lr ${setup.learningRate}`],
                ["Loss", setup.loss],
                ["SVD backend", setup.svdBackend]
              ].map(([label, value]) => (
                <div className="stage__spec" key={label}>
                  <dt>{label}</dt>
                  <dd className="mono">{String(value)}</dd>
                </div>
              ))}
            </dl>
            <p className="note stage__fairness">{setup.fairness}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
