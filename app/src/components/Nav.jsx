import { useEffect, useState } from "react";
import { project } from "../data/project.js";
import { useActiveSection } from "../lib/hooks.js";
import "./Nav.css";

const SECTION_IDS = project.sections.map((s) => s.id);

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const active = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 8);
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="container nav__inner">
        <a className="nav__brand" href="#top" onClick={() => setOpen(false)}>
          <span className="nav__mark" aria-hidden="true" />
          <span className="nav__brand-text">
            SVD&nbsp;Layer
            <span className="nav__brand-sub">vs BatchNorm</span>
          </span>
        </a>

        <nav id="nav-menu" className={`nav__menu${open ? " is-open" : ""}`} aria-label="Sections">
          {project.sections.map((section) => (
            <a
              key={section.id}
              className={`nav__link${active === section.id ? " is-active" : ""}`}
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              onClick={() => setOpen(false)}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      <div className="nav__progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </header>
  );
}
