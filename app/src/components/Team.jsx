import { mentor, programme, team } from "../data/team.js";
import Reveal from "./ui/Reveal.jsx";
import "./Team.css";

const ICONS = {
  linkedin: (
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95C21.4 8.75 22 11 22 14v7h-4v-6.2c0-1.5-.03-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21h-4V9Z" />
  ),
  github: (
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  ),
  cv: (
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 2 4.5 4.5H14V4ZM8 13h8v2H8v-2Zm0 4h8v2H8v-2Zm0-8h4v2H8V9Z" />
  ),
  email: (
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm8 7.2 8-4.95V6H4v.25l8 4.95ZM4 8.6V18h16V8.6l-8 4.95L4 8.6Z" />
  )
};

function LinkPill({ kind, href, label, external = true }) {
  return (
    <a
      className={`plink plink--${kind}`}
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
        {ICONS[kind]}
      </svg>
      {label}
    </a>
  );
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Team() {
  return (
    <section className="section section--tight" id="team" aria-labelledby="team-title">
      <div className="container">
        <Reveal className="section__head">
          <p className="eyebrow">01 — Team</p>
          <h2 className="section__title" id="team-title">
            Who built this
          </h2>
          <p className="section__sub">
            {programme.name}
            {programme.stage ? ` · ${programme.stage}` : ""}
          </p>
        </Reveal>

        <ul className="team">
          {team.map((member, index) => (
            <Reveal as="li" key={member.name} delay={index * 70}>
              <article className="member glass">
                <div className="member__top">
                  <span className="member__avatar" aria-hidden="true">
                    {initials(member.name)}
                  </span>
                  <div className="member__id">
                    <h3 className="member__name">{member.name}</h3>
                    {member.role ? <p className="member__role">{member.role}</p> : null}
                    {member.affiliation ? (
                      <p className="member__org">{member.affiliation}</p>
                    ) : null}
                    {member.university ? (
                      <p className="member__org member__org--sub">{member.university}</p>
                    ) : null}
                  </div>
                </div>

                <div className="member__links">
                  {member.linkedin ? (
                    <LinkPill kind="linkedin" href={member.linkedin} label="LinkedIn" />
                  ) : null}
                  {member.github ? (
                    <LinkPill kind="github" href={member.github} label="GitHub" />
                  ) : null}
                  {member.cv ? <LinkPill kind="cv" href={member.cv} label="CV (PDF)" /> : null}
                  {member.email ? (
                    <LinkPill
                      kind="email"
                      href={`mailto:${member.email}`}
                      label="Email"
                      external={false}
                    />
                  ) : null}
                </div>
              </article>
            </Reveal>
          ))}
        </ul>

        {mentor ? (
          <Reveal className="mentor glass" delay={90}>
            <div>
              <span className="tag">{mentor.role ?? "Mentor"}</span>
              <h3 className="mentor__name">{mentor.name}</h3>
              {mentor.note ? <p className="mentor__note">{mentor.note}</p> : null}
            </div>
            <div className="member__links">
              {mentor.link ? (
                <LinkPill kind="github" href={mentor.link} label="Reference implementation" />
              ) : null}
              {mentor.email ? (
                <LinkPill
                  kind="email"
                  href={`mailto:${mentor.email}`}
                  label="Email"
                  external={false}
                />
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
