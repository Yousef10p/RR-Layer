/* ============================================================================
   Recharts is by far the heaviest dependency on the site, and the visitor
   arriving from a QR code sees the hero and the problem section first. So the
   whole chart module is loaded as a separate chunk, in the background, while
   they read. Every chart is used through this file — never import
   ResearchCharts.jsx directly from a section.
   ============================================================================ */

import { lazy } from "react";

const loadCharts = () => import("./ResearchCharts.jsx");
const chart = (name) => lazy(() => loadCharts().then((m) => ({ default: m[name] })));

export const NoiseSweepChart = chart("NoiseSweepChart");
export const RankSweepChart = chart("RankSweepChart");
export const MnistChart = chart("MnistChart");
export const EvalModesChart = chart("EvalModesChart");
export const StabilityChart = chart("StabilityChart");
export const TrainTestScatter = chart("TrainTestScatter");
export const HeadToHeadChart = chart("HeadToHeadChart");

/** Experiment id -> chart, mirroring `chart:` in src/data/experiments.js. */
export const chartRegistry = {
  noiseSweep: NoiseSweepChart,
  rankSweep: RankSweepChart,
  mnist: MnistChart,
  evalModes: EvalModesChart,
  stability: StabilityChart
};

/** Warm the chunk as soon as the browser is idle, so a tap never waits. */
export function prefetchCharts() {
  if (typeof window === "undefined") return;
  const go = () => {
    loadCharts();
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 2500 });
  else window.setTimeout(go, 1200);
}
