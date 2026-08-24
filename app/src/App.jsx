import { useEffect } from "react";
import { prefetchCharts } from "./components/charts/LazyCharts.jsx";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Problem from "./components/Problem.jsx";
import Research from "./components/Research.jsx";
import ExperimentLab from "./components/ExperimentLab.jsx";
import Results from "./components/Results.jsx";
import Approach from "./components/Approach.jsx";
import System from "./components/System.jsx";
import Demo from "./components/Demo.jsx";
import Team from "./components/Team.jsx";
import Footer from "./components/Footer.jsx";

/* The team comes first, then the narrative:
   problem → research → experiments → comparison → results → final approach → demo.
   Section ids here must match project.sections in src/data/project.js. */
export default function App() {
  // Charts live in their own chunk; fetch it once the browser is idle so the
  // first tap in the experiment lab never waits on the network.
  useEffect(prefetchCharts, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Nav />

      <main id="main">
        <Hero />
        <Team />
        <Problem />
        <Research />
        <ExperimentLab />
        <Results />
        <Approach />
        <System />
        <Demo />
      </main>

      <Footer />
    </>
  );
}
