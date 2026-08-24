import { project } from "../data/project.js";
import { setup } from "../data/results.js";
import "./Footer.css";

export default function Footer() {
  const links = [
    { href: project.links.code, label: "Project repository" },
    { href: project.links.referenceImplementation, label: "Reference implementation (RR_layer)" },
    { href: project.links.rraePaper, label: "Rank Reduction Autoencoders — arXiv" }
  ].filter((link) => link.href);

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__about">
          <p className="footer__title">{project.title}</p>
          <p className="footer__abstract">{project.abstract}</p>
          <p className="note footer__meta">
            {setup.framework} · {setup.svdBackend} · {setup.seeds}
          </p>
        </div>

        <nav className="footer__links" aria-label="Project links">
          <p className="footer__links-title">Links</p>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer noopener">
                  {link.label}
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path
                      d="M7 17 17 7m0 0H8m9 0v9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="container footer__bar">
        <span>{project.venue}</span>
        <a href="#top">Back to top</a>
      </div>
    </footer>
  );
}
