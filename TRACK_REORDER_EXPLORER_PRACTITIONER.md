# Track reorder — Explorer + Practitioner

**Goal:** Tracks for "use AI well" personas should **lead with USE**, not with how-it-works internals. Mechanics content moves to optional/late slots, gated by the new Q5 mechanics-interest flag.

**Builder + Researcher tracks unchanged** — their content is correctly calibrated.

---

## Explorer — current vs proposed

### Current (8 weeks)
| Wk | Title | Mechanics content? |
|---|---|---|
| 1 | What AI Actually Is | **Heavy** — 3Blue1Brown neural net video, Prediction Machines |
| 2 | How AI Learns | **Heavy** — gradient descent video, training/bias |
| 3 | Using AI Tools Effectively | None |
| 4 | AI Ethics and Society | None |
| 5 | AI Strategy for Your Work | None |
| 6 | AI Products and Evaluation | None |
| 7 | The AI-Augmented Organization | None |
| 8 | What's Next | None |

**Problem:** An Executive who picked Explorer because they want strategy depth opens Week 1 and sees a neural-network primer. Six of seven sessions in Weeks 1–2 are mechanics. Drop-off risk is highest here.

### Proposed (8 weeks)
| Wk | Title | Mechanics? | Source weeks |
|---|---|---|---|
| 1 | **What AI Can Do For You** | None | New mix: Stanford AI Index exec summary, AI tools landscape survey, Prediction Machines Ch 1–2 (the *economic* framing, not the mechanics) |
| 2 | **Using AI Tools Effectively** | None | Was Wk 3 — moved up |
| 3 | AI Strategy for Your Work | None | Was Wk 5 |
| 4 | AI Ethics and Responsible Use | None | Was Wk 4 |
| 5 | AI Products and Evaluation | None | Was Wk 6 |
| 6 | The AI-Augmented Organization | None | Was Wk 7 |
| 7 | **How AI Actually Works** *(conditional)* | **All of it** | Was Wk 1–2 mechanics content — 3Blue1Brown, gradient descent, Teachable Machine. **Only renders if Q5 ≥ "Some curiosity."** |
| 8 | What's Next — Your AI Future | None | Unchanged |

**Net:** Explorer who picked "Not really" on Q5 gets **7 weeks** of pure use/strategy content, no neural-net videos. Explorer who picked "Pretty interested" or "Very interested" gets the original 8-week experience but with mechanics in Week 7 instead of Week 1 — *after* they've built tool-use confidence.

---

## Practitioner — current vs proposed

### Current (10 weeks)
| Wk | Title | Mechanics content? |
|---|---|---|
| 1 | AI Capabilities and Limits | **Some** — 3Blue1Brown neural net series eps 1–2 |
| 2 | Advanced Prompt Engineering | None |
| 3 | AI Workflow Automation | None |
| 4 | Data Literacy for AI | **Heavy** — Breiman "Two Cultures" 2001 statistics paper |
| 5 | AI Ethics and Responsible Use | None |
| 6 | No-Code and Low-Code AI | None |
| 7 | Evaluating AI Products | None |
| 8 | AI-Augmented Decision Making | None |
| 9 | Building AI-Enhanced Processes | None |
| 10 | Your AI Future | None |

**Problem #1:** Power user shows up wanting prompt skills, Week 1 is a neural network primer.
**Problem #2:** Breiman's "Two Cultures" is a foundational ML *philosophy* paper. Belongs in Researcher. In Practitioner it reads as academic gatekeeping.

### Proposed (10 weeks)
| Wk | Title | Mechanics? | Source / Change |
|---|---|---|---|
| 1 | **Advanced Prompt Engineering** | None | Was Wk 2 — moved up (this is what Practitioners come for) |
| 2 | **AI Workflow Automation** | None | Was Wk 3 |
| 3 | **AI Capabilities and Limits** | None | Was Wk 1 — **3Blue1Brown content REMOVED**, replaced with capability mapping + benchmark-your-use exercises |
| 4 | No-Code and Low-Code AI | None | Was Wk 6 |
| 5 | AI Ethics and Responsible Use | None | Was Wk 5 |
| 6 | **Data Literacy for AI** | None | Was Wk 4 — **Breiman REMOVED** (moves to Researcher), replaced with practical data quality + visualization (Hans Rosling stays) |
| 7 | Evaluating AI Products | None | Was Wk 7 |
| 8 | AI-Augmented Decision Making | None | Was Wk 8 |
| 9 | Building AI-Enhanced Processes | None | Was Wk 9 |
| 10 | Your AI Future | None | Unchanged |

**Optional mechanics add-on** *(conditional on Q5 ≥ "Some curiosity")*: appears as a side-track between Wk 3 and Wk 4 — single session, ~60 min, 3Blue1Brown ep 1 + a 30-min "how transformers work conceptually" reading. **Skippable.**

---

## Where the removed content goes

| Removed from | Item | Lands in |
|---|---|---|
| Explorer Wk 1–2 | 3Blue1Brown neural net visual primer | Explorer Wk 7 (conditional) |
| Explorer Wk 2 | Gradient descent video | Explorer Wk 7 (conditional) |
| Explorer Wk 2 | Teachable Machine exercise | Explorer Wk 7 (conditional) |
| Practitioner Wk 1 | 3Blue1Brown eps 1–2 | Practitioner optional add-on (conditional) |
| Practitioner Wk 4 | Breiman "Two Cultures" | **Researcher Wk 1** (already present there — Builder Wk 1 too — keeps it where it belongs) |

Nothing is deleted from the curriculum. Mechanics content is **gated, not removed.**

---

## Tagging schema needed in `index.html`

To make the conditional rendering work, add a `mechanics` tag to relevant day-items inside `TRACKS`. Example:

```js
{ type: 'watch', time: '25 min', title: 'Neural Networks: A Visual Primer',
  desc: 'Watch "But what is a neural network?" by 3Blue1Brown...',
  url: 'https://...',
  tags: ['beginner', 'no-code', 'technical', 'research', 'mechanics'] }  // ← added
```

Then in the render loop, filter:

```js
const showMechanics = quizAnswers.mechanicsInterest >= 1;  // 0 = Not really, 1+ = some/pretty/very
const visibleDays = week.days.filter(d => showMechanics || !d.tags.includes('mechanics'));
```

Same gate hides the conditional Week 7 in Explorer entirely when `mechanicsInterest === 0`.

---

## What's NOT changing

- Builder track (all 12 weeks) — already correctly mechanics-heavy; that's the persona
- Researcher track (all 14+ weeks) — already correctly papers-and-math-heavy
- Chat-recommendation flow (`CHAT_PERSONAS`, keyword rules) — already routes correctly; no edits
- Certification flow, week-day rendering, progress tracking — all untouched
