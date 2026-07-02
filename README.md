# AI Curriculum — Personalized Learning Path

A free, adaptive AI curriculum that meets you where you are. Take a 6-question assessment and get a study schedule tailored to your experience level — from first encounter to frontier research.

### The track almost nobody else teaches

Most AI courses skip it: **Your AI Data Footprint** — what gets stored, what trains the model, and what stays local. It's a privacy sidecar you can run next to any primary track, built from the real data-use disclosures of the tools you already use (Anthropic, OpenAI, Google, Microsoft, and more). Six weeks, 2–3 hrs/week.

## Five Tracks

| Track | Duration | Hours/Week | For |
|-------|----------|------------|-----|
| **Explorer** | 8 weeks | 2–3 | Non-technical learners who want to understand AI |
| **Practitioner** | 10 weeks | 4–6 | Power users who want to use AI tools effectively |
| **Builder** | 12 weeks | 6–10 | Developers who want to build AI applications |
| **Researcher** | 16 weeks | 10+ | Advanced learners pursuing deep understanding |
| **Your AI Data Footprint** _(privacy sidecar)_ | 6 weeks | 2–3 | Recommended alongside any primary track — what gets stored, what trains the model, what stays local |

## Features

- **Adaptive quiz** — 6 questions determine your recommended track
- **Validated routing** — quiz routing validated against 21 simulated personas (`simulate-personas.ts`)
- **Real resources** — every link points to a real paper, course, book, or tool
- **Progress tracking** — check off completed activities (saved in your browser)
- **No account needed** — works entirely client-side; nothing leaves your machine unless you explicitly submit the optional outcomes form
- **Single HTML file** — zero dependencies, works offline

Practicing what the privacy track teaches, the site discloses its own data flow: it has exactly one optional external endpoint — an outcomes form (a 6-week check-in and/or a learning-community interest check) you may choose to submit — and nothing is sent anywhere unless you fill it in and submit it. The community option is an interest check, not a signup for something that exists.

## Resources Include

- Stanford HAI AI Index
- 3Blue1Brown neural network series
- Andrej Karpathy's Zero to Hero
- fast.ai Practical Deep Learning
- Anthropic prompt engineering documentation
- HuggingFace NLP Course
- Goodfellow's Deep Learning textbook
- Original papers (Attention Is All You Need, Constitutional AI, Scaling Laws)
- Books (Prediction Machines, Designing ML Systems, Superagency)

## Usage

Open `index.html` in a browser. That's it.

Or visit the hosted version: [srieg.github.io/ai-curriculum](https://srieg.github.io/ai-curriculum)

## Fork & Customize

This curriculum is a single HTML file with zero external dependencies. Fork it, swap in your content, and have a live site in about 20 minutes.

### 5-minute quickstart

1. Click **Fork** on this repo (top-right on GitHub).
2. In your fork, go to **Settings → Pages**. Set Source to _Deploy from a branch_, branch `main`, folder `/ (root)`. Click Save.
3. Edit `index.html` in the GitHub web editor or clone locally.
4. Your site is live at `https://{your-handle}.github.io/ai-curriculum/` within 60 seconds of your first push.

### What to edit

All the content you'll want to change lives in the JavaScript data block (~lines 2200–2720):

| What to edit | Where (approx. line) | Notes |
|---|---|---|
| Assessment questions | `const QUESTIONS` ~2260 | 6 objects with `options[]` and per-track scoring weights |
| Track definitions (name, color, duration) | `const TRACKS` ~2335 | Keys: `explorer`, `practitioner`, `builder`, `researcher`, `privacy` |
| Per-day resources | `TRACKS[*].weeks[*].days[*]` | `{type, time, title, desc, url, tags[]}` |
| Track metadata (philosophy, reading order) | `const DEEP_DIVES` ~4160 | Used for context panels, not the day schedule |
| Track display order | `const TRACK_ORDER` ~2730 | Simple array of track keys |
| localStorage namespace | 17 keys prefixed `ai-curriculum-*` | **Must rename in forks** — see below |

### ⚠ Don't break progress tracking — rename the localStorage namespace

**Before publishing your fork:** change the localStorage namespace from `ai-curriculum-` to your own prefix (e.g., `my-ai-path-`). If you don't, and a learner visits both the original site and your fork in the same browser, their progress data will collide.

Find-and-replace all 17 keys:

```
ai-curriculum-theme
ai-curriculum-track
ai-curriculum-progress
ai-curriculum-profile
ai-curriculum-knowledge
ai-curriculum-knowledge-state
ai-curriculum-interests
ai-curriculum-reviews
ai-curriculum-difficulties
ai-curriculum-engagement
ai-curriculum-chat-quality
ai-curriculum-api-key
ai-curriculum-problems
ai-curriculum-mastery-skips
ai-curriculum-cert-name
ai-curriculum-reassessment-dismissed
ai-curriculum-outcomes-optin-dismissed
```

A single find-and-replace of `ai-curriculum-` → `your-prefix-` across the file handles all 17 in one shot.

### Attribution

Attribution is not required under the MIT license, but a link back to the original is appreciated. The community benefit compounds when forks are discoverable.

## License

MIT

## Author

[Sam Riegel](https://www.linkedin.com/in/sam-riegel/)
