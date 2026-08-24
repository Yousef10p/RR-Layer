import { useState } from "react";
import { researchQuestions, timeline } from "../data/research.js";
import Reveal from "./ui/Reveal.jsx";
import "./Research.css";

function statusLabel(status) {
  if (status === "answered-negative") return { text: "Answered — negative", cls: "tag--loss" };
  return { text: "Answered", cls: "tag--win" };
}

export default function Research() {
  const [open, setOpen] = useState("rq1");

  return (
    <section className="section" id="research" aria-labelledby="research-title">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">03 — Our research</p>
          <h2 className="section__title" id="research-title">
            Five questions, asked in order
          </h2>
          <p className="section__sub">
            Each question is answered by an experiment further down. Tap a card to see what we found.
          </p>
        </Reveal>

        <div className="rq-list">
          {researchQuestions.map((rq, index) => {
            const isOpen = open === rq.id;
            const status = statusLabel(rq.status);
            return (
              <Reveal key={rq.id} delay={index * 70}>
                <article className={`rq glass${isOpen ? " is-open" : ""}`}>
                  <h3 className="rq__heading">
                    <button
                      type="button"
                      className="rq__button"
                      aria-expanded={isOpen}
                      aria-controls={`${rq.id}-panel`}
                      onClick={() => setOpen(isOpen ? null : rq.id)}
                    >
                      <span className="rq__number mono">{rq.number}</span>
                      <span className="rq__question">{rq.question}</span>
                      <span className="rq__chevron" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                          <path
                            d="m6 9 6 6 6-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                  </h3>

                  <div className="rq__panel" id={`${rq.id}-panel`} hidden={!isOpen}>
                    <p className="rq__why">{rq.why}</p>
                    <div className="rq__answer">
                      <span className={`tag ${status.cls}`}>{status.text}</span>
                      <p>{rq.answer}</p>
                    </div>
                    {rq.answeredBy ? (
                      <a className="rq__link" href="#experiments">
                        See the experiment
                        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                          <path
                            d="M4 12h14m0 0-5-5m5 5-5 5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    ) : null}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="timeline" delay={80}>
          <h3 className="timeline__title">How the project got there</h3>
          <ol className="timeline__list">
            {timeline.map((item) => (
              <li className="timeline__item" key={item.phase}>
                <span className="timeline__phase">{item.phase}</span>
                <h4 className="timeline__heading">{item.title}</h4>
                <p className="timeline__text">{item.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
