# Batch Normalization using an SVD Layer — interactive research showcase

An interactive walkthrough of our research, built for a poster exhibition: a visitor scans the
QR code, the site opens on their phone, and in a couple of minutes they understand the problem,
the experiments, the results, why we picked what we picked, and what the final system does — with
a live in-browser demo of the layer at the end.

Static React + Vite site. No backend, no database, no API keys. Every research number lives in
plain JavaScript/JSON files under `src/data/`.

---

## The sections

| # | Section | What it does |
|---|---------|--------------|
| — | Hero | Project name, the one-line question, headline numbers |
| 01 | Team | Members, links and CVs — driven by `src/data/team.json` |
| 02 | Problem | Input → problem → desired output, plus a live render of the actual task |
| 03 | Research | The five research questions, each with the answer we found |
| 04 | Experiment lab | All five experiments: objective, method, configuration, dataset, results, conclusion |
| 05 | Results | Dashboard — toggle models, switch metric, compare any two models, full scoreboard |
| 06 | Why this approach | The three candidates, their trade-offs, and the one we selected |
| 07 | Final system | The six-stage pipeline, clickable stage by stage |
| 08 | Demo | The truncated SVD running live in the browser on synthetic data |

---

## Install

Requires Node 18 or newer.

```bash
cd app
npm install
```

## Development

```bash
npm run dev
```

Open the printed URL (usually <http://localhost:5173>). Edits hot-reload.

To check it on your phone while developing, run `npm run dev -- --host` and open the network URL
it prints from a device on the same Wi-Fi.

## Production build

```bash
npm run build     # emits dist/
npm run preview   # serves dist/ locally, exactly as it will be deployed
```

`dist/` is fully static — it can be hosted anywhere.

## Deploy to Vercel

1. Push this repository to GitHub.
2. On Vercel: **Add New → Project**, import the repository.
3. **Set Root Directory to `app`** (this project lives in a subfolder).
4. Framework preset: **Vite**. Build command `npm run build`, output directory `dist` —
   `vercel.json` already sets these, so the defaults should be correct.
5. Deploy.

Netlify is the same: base directory `app`, build command `npm run build`, publish directory
`app/dist`.

Every later `git push` redeploys to the **same URL**, so the QR code keeps working.

---

## QR code

**Point the QR code at the main site URL — never at a PDF or a specific section.**

```
https://<your-project>.vercel.app/
```

Because the QR encodes only that root URL, you can change results, charts, CVs, team members and
project text as often as you like, redeploy, and the printed poster stays valid. If you buy a
custom domain later, add it in Vercel and keep the old URL working as a redirect.

Print the QR at 3 cm or larger with a quiet margin around it, and test it with two different
phones before printing the poster.

---

## How to update the research results

All numbers live in **`src/data/results.js`**. Nothing is hard-coded in the UI, and no number is
written down twice — the charts, the experiment cards, the scoreboard and the prose all read from
this file.

| What you want to change | Where |
|---|---|
| The headline noise/small-data table | `noiseSweep` |
| Rank sweep (k = 2 … 32) | `rankSweep` |
| MNIST-background results | `mnistBackgrounds` |
| Evaluation-mode ablation | `evalModes` |
| Gradient-backend stability run | `stability` |
| Shared setup (batch size, optimizer, seeds …) | `setup` |
| Model names, colors, descriptions | `models` |

The **scoreboard** at the bottom of the Results section is computed from those same values —
including which model wins each row — so it updates itself. If you change a number, do not also
edit the winner.

Related files:

- **`src/data/experiments.js`** — one entry per experiment (objective, method, configuration,
  key numbers, conclusion, which chart to show). `chart:` must be one of the keys in
  `chartRegistry` in `src/components/charts/LazyCharts.jsx`.
- **`src/data/research.js`** — the research questions and the project timeline.
- **`src/data/pipeline.js`** — the "why this approach" comparison and the final-system stages.
- **`src/components/charts/ResearchCharts.jsx`** — the chart definitions themselves. Only touch
  this if you need a new *kind* of chart, not to change values.

> **Rule we kept while building this: nothing is invented.** Every figure on the site comes from
> the report or the notebook. If a value is missing, leave the field out or mark it clearly as a
> placeholder rather than filling in a plausible number.

## How to update team members

Edit **`src/data/team.json`** — plain JSON, no JavaScript. Each member is one object:

```json
{
  "name": "Your Name",
  "role": "Experiments and evaluation",
  "affiliation": "KAUST Academy",
  "university": "Your University",
  "email": "you@example.com",
  "linkedin": "https://www.linkedin.com/in/your-handle",
  "github": "https://github.com/your-handle",
  "cv": "cv/your-name.pdf"
}
```

- **Add a member** — copy a block inside `"members"` and edit it.
- **Remove a member** — delete their block.
- **Leave a field blank** (`""`) and it simply does not render. Do not invent values.
- The order in the file is the order on the page.
- `"mentor"` and `"programme"` at the bottom of the file drive the mentor card and the section
  subtitle.

After editing, run `npm run dev` once — if the JSON has a syntax error, Vite will say so
immediately.

## How to replace the CVs

1. Put the PDF in **`public/cv/`**.
2. Point that member's `"cv"` field at it, e.g. `"cv/majed-alsulami.pdf"` — path relative to the
   site root, **no leading slash**.

Files in `public/` are copied to the deployed site as-is. The three PDFs currently in
`public/cv/` are placeholders — replace them with the real ones before the exhibition.

## How to change the project information

**`src/data/project.js`** holds everything above the experiments:

- `title`, `shortTitle`, `tagline`, `subtitle`, `venue` — the hero
- `headlineStats` — the three big numbers under the hero buttons
- `abstract` — the footer text
- `links` — repository, reference implementation, paper
- `problem` — the input → problem → output cards and the open-question note
- `sections` — the navigation. **Each `id` must match a section `id` rendered in `src/App.jsx`.**

Page metadata (browser tab title, social preview text) is in **`index.html`**.

---

## Project structure

```
app/
├── index.html                 page shell, fonts, meta tags
├── vite.config.js             build config (relative base, so any host path works)
├── vercel.json                Vercel/framework settings
├── public/
│   ├── cv/                    team CVs (PDF)  <- replace these
│   ├── figures/               figures used in the experiment lab
│   └── favicon.svg
└── src/
    ├── main.jsx               entry point
    ├── App.jsx                section order — the narrative
    ├── data/                  ALL RESEARCH CONTENT LIVES HERE
    │   ├── project.js         hero, problem, navigation
    │   ├── research.js        research questions, timeline
    │   ├── experiments.js     the five experiments
    │   ├── results.js         every measured number + computed scoreboard
    │   ├── pipeline.js        decision story + final-system stages
    │   ├── team.json          <- team members edit this
    │   └── team.js            reads team.json, drops empty fields
    ├── components/            one folder-level file per section, each with its own CSS
    │   ├── charts/            Recharts definitions + the lazy-loading wrapper
    │   └── ui/                Reveal (scroll animation), ChartFrame, tooltip
    ├── lib/
    │   ├── svd.js             the truncated SVD, in plain JS — powers the live demo
    │   ├── render.js          canvas rendering (viridis colormap)
    │   ├── format.js          number formatting
    │   └── hooks.js           in-view, reduced-motion, active-section, count-up
    └── styles/global.css      design tokens + shared primitives
```

### Re-theming

Every color, radius and spacing token is at the top of `src/styles/global.css` in `:root`.
The three model colors are defined **twice on purpose** — in `global.css` for CSS and in
`src/data/results.js` for the charts. Keep them in sync.

---

## Notes on the demo

The demo in section 08 computes a **real truncated SVD in your browser**, on synthetic data, using
`src/lib/svd.js` (Gram matrix → Jacobi eigendecomposition → rank-k projection). It is not the
trained PyTorch model, and the page says so plainly. The numbers it shows are computed live from
whatever you set the sliders to — nothing is stored or replayed.

It reproduces the mechanism behind both of our findings: with pixel noise the projection gets you
several times closer to the clean source; with structured clutter it does not help at all, because
the clutter occupies the top singular directions itself.

## Performance and accessibility

- Recharts is loaded as a separate chunk after the page is interactive, so the first paint stays
  small (~84 kB gzipped) — it matters when the visitor is on phone data at a poster session.
- Every animation is disabled under `prefers-reduced-motion`.
- Tabs, sliders and the pipeline are keyboard-navigable (arrow keys move between tabs and stages);
  all touch targets are at least 40 px.
- Wide content (the scoreboard table, the pipeline rail) scrolls inside its own container — the
  page itself never scrolls sideways.
