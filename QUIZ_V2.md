# QUIZ V2 (v3 scoring) — separating mechanics-interest from skill level

**Validation status:** 21/21 personas route correctly under the scoring described below (per `simulate-personas.ts`, 2026-05-10).

**Goal:** Stop forcing learners who want to *use AI tools well* through *how-AI-works-internally* content. Make mechanics-curiosity an independent axis so it modifies content depth, not track selection.

**Core changes from current site:**
- 5 questions → 6 questions
- Q3 + Q4 rewritten
- New Q5 (mechanics axis, content-flag only)
- Old Q5 (time) becomes Q6 and stops pushing toward Researcher
- Scoring tweaks: goal-dominant weighting, tiebreak rule, gate exceptions, no-code-builder fallback

---

## Q1 — Role *(unchanged)*

> What best describes your current role?

Options + scoring stay the same.

---

## Q2 — Programming experience *(unchanged)*

> How much programming experience do you have?

Options stay the same. **Acts as a gate** — see scoring section below.

---

## Q3 — AI familiarity *(REWRITTEN — frequency/breadth only, no mechanics)*

**BEFORE:**
> What's your experience with AI so far?
> - Brand new
> - I use AI tools
> - I build with AI
> - **Deep experience — trained models, read ML papers** ← mechanics conflated with skill

**AFTER:**
> How often and broadly do you use AI tools today?
> - **Brand new** — heard about AI but rarely use it
> - **Occasional** — open ChatGPT or Claude when I remember to
> - **Regular** — use AI daily across several tasks
> - **Power user** — AI is core to my workflow; built custom GPTs / Projects / automations
> - **Builder** — shipped code that calls AI APIs

| Option | explorer | practitioner | builder | researcher |
|---|---|---|---|---|
| Brand new | 3 | 1 | 0 | 0 |
| Occasional | 2 | 2 | 0 | 0 |
| Regular | 1 | 3 | 1 | 0 |
| Power user | 0 | 3 | 2 | 0 |
| Builder | 0 | 1 | 3 | 1 |

---

## Q4 — Primary goal *(REWRITTEN — orthogonal use/decide/build/understand, v3 reword for non-enterprise decision-makers)*

**BEFORE:**
> What's your primary learning goal?
> - Understand AI to make better decisions
> - Use AI tools more effectively
> - Build AI-powered applications
> - **Deep understanding of AI systems**

**AFTER (v3 — note the reworded "Decide" option):**
> What's your primary learning goal?
> - **Use AI more effectively** in my current work (better prompts, workflows, daily tooling)
> - **Make smart AI decisions** — decide what to use, govern adoption, evaluate claims and tools *(works for personal, classroom, clinical, organizational, or vendor-procurement decisions)*
> - **Build AI-powered products or features** — apps, integrations, agents
> - **Understand the science** — how transformers work, read papers, do research

**Why the reword on Decide:** v2 framed Decide as "evaluate vendors, set policy, choose what to adopt" — which reads as enterprise IT procurement. The simulator caught that an elementary teacher reading those words won't pick Decide for her classroom; she'll pick Use_effectively instead and misroute to Practitioner. v3 wording explicitly includes non-enterprise decision contexts (classroom, clinical, personal).

| Option | explorer | practitioner | builder | researcher |
|---|---|---|---|---|
| Use more effectively | 2 | **4** | 0 | 0 |
| Make smart decisions | **4** | 2 | 0 | 0 |
| Build products/features | 0 | 0 | **4** | 2 |
| Understand the science | 0 | 0 | 2 | **4** |

**v3 change:** Goal weights bumped from `3/1` → `4/2` so goal is the dominant signal in any tie. Validated against 21 personas.

---

## Q5 — Mechanics interest *(NEW — the orthogonal axis)*

> How much do you care about *how* AI works under the hood?
> - **Not really** — I want to use it well, not understand the math
> - **Some curiosity** — a visual intro is nice, but I don't want to dwell there
> - **Pretty interested** — I want a working mental model of neural nets, training, attention
> - **Very interested** — I want to read papers, build mental models from first principles

**Critical:** Q5 is a **content modifier, not a track selector.** Contributes **zero** to track scoring. Sets a flag that gates which content shows up *inside* the chosen track:

- "Not really" → mechanics content **hidden**
- "Some curiosity" → one optional mechanics week at the end
- "Pretty interested" → mechanics content visible as required intro
- "Very interested" → mechanics content surfaced first + Researcher add-ons offered

---

## Q6 — Time commitment *(was Q5 — pace-only now)*

> How much time can you commit per week?
> - 2–3 hours
> - 4–6 hours
> - 7–10 hours
> - 10+ hours

**v3:** Affects **pace only** (8 vs 10 vs 12 week schedule) and **week density**, not which track. Zero contribution to track scoring. A CEO with 10 hrs/week is still an Executive learner.

---

## Scoring algorithm — v3 in pseudocode

```
function scoreNew(answers):
  s = role[answers.role] + programming[answers.programming]
    + ai_familiarity[answers.ai_familiarity] + goal[answers.goal]

  // GATE — programming<intermediate caps Builder; Researcher only gated when goal≠understand_science
  if answers.programming in {none, little}:
    s.builder = 0
    if answers.goal != understand_science:
      s.researcher = 0

  // NO-CODE-BUILDER FALLBACK — someone wanting to build but can't code → no-code AI building = Practitioner
  if answers.goal == build_products AND answers.programming in {none, little}:
    s.practitioner += 5

  // TIEBREAK — if top two tracks tied, goal-target wins
  topTwo = top 2 tracks by score
  if topTwo[0].score == topTwo[1].score:
    goalTarget = GOAL_PRIMARY[answers.goal]  // {use_effectively→practitioner, decide→explorer, build→builder, science→researcher}
    if goalTarget in {topTwo[0].track, topTwo[1].track}:
      return goalTarget
  return topTwo[0].track
```

**Four v3 fixes over v2:**
1. Goal weighting bumped `{3,1,0,0}` → `{4,2,0,0}` per primary — goal dominates familiarity in ties
2. Tiebreak rule — goal targets break track ties
3. Researcher gate relaxed when `goal=understand_science` — aspirational research path stays open for low-programming learners
4. No-code-builder fallback — `goal=build_products + programming∈{none,little}` adds +5 Practitioner (routes "I want to build but can't code yet" to no-code AI building path)

---

## Net effect — validated against 21 personas (per `simulate-personas.ts`)

| Layer | OLD | NEW v3 |
|---|---|---|
| 4 archetypes × 3 variants | 10/12 | **12/12** |
| 6 CHAT_PERSONAS (PM, Designer, Data Analyst, Teacher, Executive, Journalist, Healthcare, Legal, Student-humanities) | 5/6 | **6/6** |
| 3 edge cases (no-code-builder, mechanics-curious-designer, sci-curious-eng) | 2/3 | **3/3** |
| **Total** | **17/21 (81%)** | **21/21 (100%)** |
| Mechanics-content correct | ~15/21 (gate doesn't exist) | **21/21 (100%)** |

---

## Files to change in `index.html`

1. **`QUESTIONS` array** (lines 2250–2307) — replace per above (6 questions, new options)
2. **Scoring function** — add gate + tiebreak + fallback logic per pseudocode above
3. **Track rendering** (lines ~3021+) — add `mechanics` tag to relevant day-items in `TRACKS`, filter at render time based on Q5 answer
4. **Day-item tag schema** — see `TRACK_REORDER_EXPLORER_PRACTITIONER.md` for which items get the `mechanics` tag

No backend changes. All client-side.
