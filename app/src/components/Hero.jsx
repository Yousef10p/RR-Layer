import { project } from "../data/project.js";
import { setup } from "../data/results.js";
import Reveal from "./ui/Reveal.jsx";
import "./Hero.css";

/* Schematic of the layer's operation: a batch spectrum truncated at k = 8.
   Illustrative — not measured data. */
function SpectrumMark() {
  const bars = [1, 0.86, 0.7, 0.58, 0.47, 0.38, 0.3, 0.24, 0.19, 0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04];
  const kept = 8;

  return (
    <div className="hero__mark" aria-hidden="true">
      <div className="hero__mark-head">
        <span className="mono">X = U Σ Vᵀ → X̂ = U₈ Σ₈ V₈ᵀ</span>
      </div>
      <div className="hero__spectrum">
        {bars.map((height, i) => (
          <span
            key={i}
            className={`hero__bar${i < kept ? " is-kept" : " is-dropped"}`}
            style={{ "--h": `${height * 100}%`, "--i": i }}
          />
        ))}
        <span className="hero__cut" style={{ left: `calc(${(kept / bars.length) * 100}% - 1px)` }}>
          <em className="mono">k = 8</em>
        </span>
      </div>
      <div className="hero__mark-foot">
        <span>kept — top-k directions</span>
        <span>discarded</span>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <Reveal as="p" className="hero__venue">
          <span className="hero__pulse" aria-hidden="true" />
          {project.venue}
        </Reveal>

        <Reveal as="h1" className="hero__title" delay={60}>
          {project.title}
        </Reveal>

        <Reveal as="p" className="hero__tagline" delay={120}>
          {project.tagline}
        </Reveal>

        <Reveal as="p" className="hero__subtitle" delay={180}>
          {project.subtitle}
        </Reveal>

        <Reveal className="hero__actions" delay={240}>
          <a className="btn btn--primary" href="#problem">
            Explore the Research
          </a>
          <a className="btn btn--ghost" href="#demo">
            Try the Demo
          </a>
        </Reveal>

        <Reveal className="hero__stats" delay={300}>
          {project.headlineStats.map((stat) => (
            <div className="hero__stat" key={stat.label}>
              <span className="hero__stat-value">{stat.value}</span>
              <span className="hero__stat-label">{stat.label}</span>
              <span className="hero__stat-detail">{stat.detail}</span>
            </div>
          ))}
        </Reveal>

        <Reveal className="hero__visual" delay={340}>
          <SpectrumMark />
          <p className="hero__visual-note note">
            Schematic of the operation. The layer sits where BatchNorm sits — {" "}
            <span className="mono">conv → SVD layer → ReLU</span> — with rank k ={" "}
            {setup.rank} as its only hyperparameter.
          </p>
        </Reveal>
      </div>

      <a className="hero__scroll" href="#problem" aria-label="Scroll to the problem">
        <span className="hero__scroll-line" aria-hidden="true" />
        Scroll
      </a>
    </section>
  );
}
