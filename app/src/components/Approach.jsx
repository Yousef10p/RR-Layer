import { decision } from "../data/pipeline.js";
import { models, modelOrder, scoreboard } from "../data/results.js";
import Reveal from "./ui/Reveal.jsx";
import "./Approach.css";

/* Which model won each row of the scoreboard — computed, not typed in. */
const modelKeyFor = { plain: "OA", bn: "OA_BN", svd: "OA_RR" };

function record(candidateId) {
  const key = modelKeyFor[candidateId];
  const scored = scoreboard.filter((row) => typeof row.values[key] === "number");
  const wins = scored.filter((row) => row.winner === key).length;
  return { wins, of: scored.length };
}

export default function Approach() {
  return (
    <section className="section" id="approach" aria-labelledby="approach-title">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">06 — Why this approach</p>
          <h2 className="section__title" id="approach-title">
            {decision.title}
          </h2>
          <p className="section__sub">
            Three candidates for one slot in the network. Each one is good at something — the
            question was which trade-off we were willing to keep.
          </p>
        </Reveal>

        <div className="choices">
          {decision.candidates.map((candidate, index) => {
            const key = modelKeyFor[candidate.id];
            const model = models[key];
            const { wins, of } = record(candidate.id);

            return (
              <Reveal key={candidate.id} delay={index * 90}>
                <article
                  className={`choice glass${candidate.selected ? " is-selected" : ""}`}
                  style={{ "--model": model.color }}
                >
                  <header className="choice__head">
                    <span className="choice__dot" aria-hidden="true" />
                    <div>
                      <h3 className="choice__name">{candidate.name}</h3>
                      <p className="choice__slot mono">{candidate.slot}</p>
                    </div>
                    {candidate.selected ? (
                      <span className="choice__badge">Selected</span>
                    ) : null}
                  </header>

                  <ol className="choice__path">
                    <li className="choice__step choice__step--good">
                      <span className="choice__step-label">Strength</span>
                      <p>{candidate.strength}</p>
                    </li>
                    <li className="choice__step choice__step--bad">
                      <span className="choice__step-label">
                        {candidate.selected ? "Trade-off" : "Limitation"}
                      </span>
                      <p>{candidate.limitation}</p>
                    </li>
                  </ol>

                  <footer className="choice__foot">
                    <span className="choice__record">
                      <strong>{wins}</strong> / {of} settings won
                    </span>
                    <span className="choice__bar" aria-hidden="true">
                      {Array.from({ length: of }, (_, i) => (
                        <span key={i} className={i < wins ? "is-on" : undefined} />
                      ))}
                    </span>
                  </footer>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="verdict glass" delay={80}>
          <div className="verdict__main">
            <span className="tag tag--win">The call</span>
            <p className="verdict__text">
              When the nuisance is spread thinly across many directions — sensor noise, the case
              this task family was built around — the SVD layer is the better drop-in, and it is
              the only one of the three that never finishes last. We selected it at{" "}
              <span className="mono">k = 8</span>, on the native autograd backend, and we state
              its failure case in the same breath.
            </p>
          </div>

          <ul className="verdict__models">
            {modelOrder.map((key) => (
              <li key={key}>
                <span className="chip__dot" style={{ color: models[key].color }} />
                <span className="verdict__model-name">{models[key].label}</span>
                <span className="verdict__model-desc">{models[key].description}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="scope" delay={120}>
          <span className="tag">Scope</span>
          <p>{decision.scope}</p>
        </Reveal>
      </div>
    </section>
  );
}
