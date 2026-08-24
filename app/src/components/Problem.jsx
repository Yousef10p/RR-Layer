import { useEffect, useRef, useState } from "react";
import { project } from "../data/project.js";
import Reveal from "./ui/Reveal.jsx";
import { gaussianSource, rng } from "../lib/svd.js";
import { drawImage } from "../lib/render.js";
import "./Problem.css";

/* A live 64×64 render of exactly the images the network is trained on:
   one Gaussian source, its center marked. Same generator as the paper's data. */
function TaskStrip() {
  const canvasRef = useRef(null);
  const [center, setCenter] = useState([0.18, -0.24]);
  const [noise, setNoise] = useState(false);

  useEffect(() => {
    const size = 64;
    const img = gaussianSource(size, center[0], center[1], 0.2);
    if (noise) {
      const next = rng(11);
      for (let i = 0; i < img.length; i++) {
        const u = Math.max(next(), 1e-9);
        const v = next();
        img[i] += 1.0 * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      }
    }
    drawImage(canvasRef.current, img, size);
  }, [center, noise]);

  const roll = () => {
    setCenter([Number((Math.random() - 0.5).toFixed(2)), Number((Math.random() - 0.5).toFixed(2))]);
  };

  return (
    <div className="task glass">
      <div className="task__visual">
        <canvas ref={canvasRef} className="task__canvas" aria-hidden="true" />
        <span
          className="task__crosshair"
          style={{
            left: `${((center[0] + 1) / 2) * 100}%`,
            top: `${((center[1] + 1) / 2) * 100}%`
          }}
          aria-hidden="true"
        />
      </div>

      <div className="task__body">
        <p className="tag tag--neutral">The task</p>
        <p className="task__text">{project.problem.task.text}</p>

        <dl className="task__io">
          <div>
            <dt>Input</dt>
            <dd className="mono">64 × 64 image</dd>
          </div>
          <div>
            <dt>Output</dt>
            <dd className="mono">
              ({center[0].toFixed(2)}, {center[1].toFixed(2)})
            </dd>
          </div>
        </dl>

        <div className="task__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={roll}>
            New source
          </button>
          <button
            type="button"
            className={`chip${noise ? " is-active" : ""}`}
            aria-pressed={noise}
            onClick={() => setNoise((v) => !v)}
          >
            Add noise (σ = 1.0)
          </button>
        </div>
        <p className="note">
          Rendered live in your browser from the same generator the experiments use.
        </p>
      </div>
    </div>
  );
}

export default function Problem() {
  return (
    <section className="section" id="problem" aria-labelledby="problem-title">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">02 — The problem</p>
          <h2 className="section__title" id="problem-title">
            Normalizing a batch by moments — or by geometry
          </h2>
          <p className="section__sub">
            Read the three cards left to right: what goes in, what breaks, and what we wanted instead.
          </p>
        </Reveal>

        <div className="flow">
          {project.problem.flow.map((step, index) => (
            <Reveal className="flow__item" key={step.id} delay={index * 90}>
              <article className={`flow__card glass flow__card--${step.id}`}>
                <p className="flow__kicker">{step.kicker}</p>
                <h3 className="flow__title">{step.title}</h3>
                <p className="flow__text">{step.text}</p>
                <p className="flow__detail mono">{step.detail}</p>
              </article>
              {index < project.problem.flow.length - 1 ? (
                <span className="flow__arrow" aria-hidden="true">
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
                </span>
              ) : null}
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <TaskStrip />
        </Reveal>

        <Reveal className="gap-note" delay={160}>
          <span className="tag">The open question</span>
          <p>{project.problem.gap}</p>
        </Reveal>
      </div>
    </section>
  );
}
