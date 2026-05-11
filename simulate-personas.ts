#!/usr/bin/env bun
// Simulate quiz outcomes across persona variants — OLD scoring vs NEW (QUIZ_V2) scoring.
// Run: bun simulate-personas.ts

type Track = 'explorer' | 'practitioner' | 'builder' | 'researcher';
type Scores = Record<Track, number>;
const zero = (): Scores => ({ explorer: 0, practitioner: 0, builder: 0, researcher: 0 });
const add = (a: Scores, b: Scores): Scores => ({
  explorer: a.explorer + b.explorer,
  practitioner: a.practitioner + b.practitioner,
  builder: a.builder + b.builder,
  researcher: a.researcher + b.researcher,
});
const top = (s: Scores): Track =>
  (Object.entries(s).sort((a, b) => b[1] - a[1])[0][0]) as Track;

// ───────────────────────────────────────────────────────────────────
// OLD scoring — extracted verbatim from index.html lines 2256-2305
// ───────────────────────────────────────────────────────────────────
const OLD = {
  role: {
    business:    { explorer: 3, practitioner: 2, builder: 0, researcher: 0 },
    creative:    { explorer: 2, practitioner: 3, builder: 0, researcher: 0 },
    engineering: { explorer: 0, practitioner: 0, builder: 3, researcher: 2 },
    research:    { explorer: 0, practitioner: 0, builder: 1, researcher: 3 },
    other:       { explorer: 2, practitioner: 2, builder: 1, researcher: 1 },
  },
  programming: {
    none:         { explorer: 3, practitioner: 1, builder: 0, researcher: 0 },
    little:       { explorer: 1, practitioner: 3, builder: 1, researcher: 0 },
    intermediate: { explorer: 0, practitioner: 1, builder: 3, researcher: 1 },
    advanced:     { explorer: 0, practitioner: 0, builder: 2, researcher: 3 },
  },
  ai_familiarity: {
    new:         { explorer: 3, practitioner: 1, builder: 0, researcher: 0 },
    use:         { explorer: 1, practitioner: 3, builder: 1, researcher: 0 },
    build:       { explorer: 0, practitioner: 1, builder: 3, researcher: 1 },
    deep_papers: { explorer: 0, practitioner: 0, builder: 1, researcher: 3 }, // ← mechanics-conflated
  },
  goal: {
    decide:    { explorer: 3, practitioner: 2, builder: 0, researcher: 0 },
    effective: { explorer: 1, practitioner: 3, builder: 1, researcher: 0 },
    build:     { explorer: 0, practitioner: 0, builder: 3, researcher: 1 },
    deep:      { explorer: 0, practitioner: 0, builder: 1, researcher: 3 }, // ← only depth option
  },
  time: {
    low:       { explorer: 3, practitioner: 1, builder: 0, researcher: 0 },
    mid:       { explorer: 1, practitioner: 3, builder: 1, researcher: 0 },
    high:      { explorer: 0, practitioner: 1, builder: 3, researcher: 1 },
    very_high: { explorer: 0, practitioner: 0, builder: 1, researcher: 3 }, // ← pushes Researcher
  },
};

// ───────────────────────────────────────────────────────────────────
// NEW scoring — from QUIZ_V2.md
// ───────────────────────────────────────────────────────────────────
const NEW = {
  role: OLD.role, // unchanged
  programming: OLD.programming, // unchanged (but acts as gate, see scoreNew)
  ai_familiarity: {
    new:        { explorer: 3, practitioner: 1, builder: 0, researcher: 0 },
    occasional: { explorer: 2, practitioner: 2, builder: 0, researcher: 0 },
    regular:    { explorer: 1, practitioner: 3, builder: 1, researcher: 0 },
    power_user: { explorer: 0, practitioner: 3, builder: 2, researcher: 0 },
    builder:    { explorer: 0, practitioner: 1, builder: 3, researcher: 1 },
  },
  goal: {
    // v3: bumped primary +4 / secondary +2 (was 3/1) — goal dominates familiarity in ties
    use_effectively:    { explorer: 2, practitioner: 4, builder: 0, researcher: 0 },
    decide:             { explorer: 4, practitioner: 2, builder: 0, researcher: 0 },
    build_products:     { explorer: 0, practitioner: 0, builder: 4, researcher: 2 },
    understand_science: { explorer: 0, practitioner: 0, builder: 2, researcher: 4 },
  },
  // mechanics: { not_really, some, pretty, very } → only sets content-flag, ZERO track score
  // time: pace-only, ZERO track score
};

type OldAnswers = {
  role: keyof typeof OLD.role;
  programming: keyof typeof OLD.programming;
  ai_familiarity: keyof typeof OLD.ai_familiarity;
  goal: keyof typeof OLD.goal;
  time: keyof typeof OLD.time;
};
type NewAnswers = {
  role: keyof typeof NEW.role;
  programming: keyof typeof NEW.programming;
  ai_familiarity: keyof typeof NEW.ai_familiarity;
  goal: keyof typeof NEW.goal;
  mechanics: 'not_really' | 'some' | 'pretty' | 'very';
  time: keyof typeof OLD.time;
};

function scoreOld(a: OldAnswers): { track: Track; scores: Scores } {
  const s = [OLD.role[a.role], OLD.programming[a.programming], OLD.ai_familiarity[a.ai_familiarity], OLD.goal[a.goal], OLD.time[a.time]].reduce(add, zero());
  return { track: top(s), scores: s };
}

// v3: goal answer maps to the track it most strongly targets (the +4 in the goal matrix)
const GOAL_PRIMARY: Record<keyof typeof NEW.goal, Track> = {
  use_effectively: 'practitioner',
  decide: 'explorer',
  build_products: 'builder',
  understand_science: 'researcher',
};

function scoreNew(a: NewAnswers): { track: Track; scores: Scores; mechanicsFlag: boolean } {
  let s = [NEW.role[a.role], NEW.programming[a.programming], NEW.ai_familiarity[a.ai_familiarity], NEW.goal[a.goal]].reduce(add, zero());

  // v3 Fix 3 — Gate: programming<intermediate caps Builder fully.
  // Researcher gated only when programming=none AND goal≠understand_science (aspirational research path stays open).
  if (a.programming === 'none' || a.programming === 'little') {
    s.builder = 0;
    if (a.programming === 'none' && a.goal !== 'understand_science') {
      s.researcher = 0;
    } else if (a.programming === 'little' && a.goal !== 'understand_science') {
      s.researcher = 0;
    }
  }

  // v3 Fix 4 — No-code-builder fallback: someone who wants to build but can't code
  // routes to Practitioner (no-code AI building path), not Explorer.
  if (a.goal === 'build_products' && (a.programming === 'none' || a.programming === 'little')) {
    s.practitioner += 5;
  }

  // v3 Fix 2 — Tiebreak: when top two tracks tied, goal-primary wins.
  const sorted = (Object.entries(s) as [Track, number][]).sort((a, b) => b[1] - a[1]);
  let track: Track;
  if (sorted.length >= 2 && sorted[0][1] === sorted[1][1]) {
    const goalTarget = GOAL_PRIMARY[a.goal];
    const tiedTracks = sorted.filter(([, v]) => v === sorted[0][1]).map(([t]) => t);
    track = tiedTracks.includes(goalTarget) ? goalTarget : sorted[0][0];
  } else {
    track = sorted[0][0];
  }

  const mechanicsFlag = a.mechanics !== 'not_really';
  return { track, scores: s, mechanicsFlag };
}

// ───────────────────────────────────────────────────────────────────
// Persona variants — 12 archetype variants + 3 edge cases
// Each declares quiz answers + EXPECTED track + intent description.
// ───────────────────────────────────────────────────────────────────
type Persona = {
  name: string;
  archetype: string;
  intent: string;
  expected: Track;
  expectedMechanicsShown: boolean; // should mechanics content appear for them?
  old: OldAnswers;
  new: NewAnswers;
};

const PERSONAS: Persona[] = [
  // ─── EXECUTIVE / DECISION-MAKER VARIANTS ───────────────────────
  {
    name: 'Maria — COO healthcare',
    archetype: 'Executive',
    intent: 'No-code, mechanics-curious, wants to evaluate vendors',
    expected: 'explorer', expectedMechanicsShown: true,
    old: { role: 'business', programming: 'none', ai_familiarity: 'use', goal: 'deep', time: 'mid' },
    new: { role: 'business', programming: 'none', ai_familiarity: 'regular', goal: 'decide', mechanics: 'pretty', time: 'mid' },
  },
  {
    name: 'Carlos — CFO mid-market',
    archetype: 'Executive',
    intent: 'No-code, ZERO mechanics interest, pure strategy/decisions',
    expected: 'explorer', expectedMechanicsShown: false,
    old: { role: 'business', programming: 'none', ai_familiarity: 'use', goal: 'decide', time: 'low' },
    new: { role: 'business', programming: 'none', ai_familiarity: 'occasional', goal: 'decide', mechanics: 'not_really', time: 'low' },
  },
  {
    // Re-labeled v3: a coding CTO is the textbook Practitioner profile per the curriculum's own
    // Explorer description ("No coding required"). Was originally tagged Explorer in v2 — wrong.
    name: 'Anya — CTO small SaaS',
    archetype: 'Executive',
    intent: 'Codes a little, evaluates AI vendors via hands-on tool use, very mechanics-curious',
    expected: 'practitioner', expectedMechanicsShown: true,
    old: { role: 'business', programming: 'little', ai_familiarity: 'use', goal: 'deep', time: 'mid' },
    new: { role: 'business', programming: 'little', ai_familiarity: 'regular', goal: 'use_effectively', mechanics: 'very', time: 'mid' },
  },

  // ─── PRACTITIONER / POWER-USER VARIANTS ────────────────────────
  {
    name: 'Dev — senior designer',
    archetype: 'Practitioner',
    intent: 'Daily Claude+Midjourney, wants prompt depth, NO math',
    expected: 'practitioner', expectedMechanicsShown: false,
    old: { role: 'creative', programming: 'little', ai_familiarity: 'use', goal: 'effective', time: 'mid' },
    new: { role: 'creative', programming: 'little', ai_familiarity: 'power_user', goal: 'use_effectively', mechanics: 'not_really', time: 'mid' },
  },
  {
    name: 'Jordan — UX researcher',
    archetype: 'Practitioner',
    intent: 'Regular AI user, mild curiosity about how it works',
    expected: 'practitioner', expectedMechanicsShown: true,
    old: { role: 'creative', programming: 'none', ai_familiarity: 'use', goal: 'effective', time: 'mid' },
    new: { role: 'creative', programming: 'none', ai_familiarity: 'regular', goal: 'use_effectively', mechanics: 'some', time: 'mid' },
  },
  {
    name: 'Priya-PM — product manager',
    archetype: 'Practitioner',
    intent: 'Power user, "pretty interested" in mechanics, wants to talk to eng credibly',
    expected: 'practitioner', expectedMechanicsShown: true,
    old: { role: 'business', programming: 'little', ai_familiarity: 'use', goal: 'effective', time: 'mid' },
    new: { role: 'business', programming: 'little', ai_familiarity: 'power_user', goal: 'use_effectively', mechanics: 'pretty', time: 'mid' },
  },

  // ─── BUILDER / ENGINEER VARIANTS ───────────────────────────────
  {
    name: 'Marcus — senior backend',
    archetype: 'Builder',
    intent: 'Ships AI features via APIs, does NOT care about transformer internals',
    expected: 'builder', expectedMechanicsShown: false,
    old: { role: 'engineering', programming: 'advanced', ai_familiarity: 'build', goal: 'build', time: 'high' },
    new: { role: 'engineering', programming: 'advanced', ai_familiarity: 'builder', goal: 'build_products', mechanics: 'not_really', time: 'high' },
  },
  {
    name: 'Lin — full-stack engineer',
    archetype: 'Builder',
    intent: 'Builds AI features, some curiosity about how models work',
    expected: 'builder', expectedMechanicsShown: true,
    old: { role: 'engineering', programming: 'intermediate', ai_familiarity: 'build', goal: 'build', time: 'mid' },
    new: { role: 'engineering', programming: 'intermediate', ai_familiarity: 'builder', goal: 'build_products', mechanics: 'some', time: 'mid' },
  },
  {
    name: 'Rajesh — ML engineer',
    archetype: 'Builder',
    intent: 'Builds AI features AND deeply interested in mechanics',
    expected: 'builder', expectedMechanicsShown: true,
    old: { role: 'engineering', programming: 'advanced', ai_familiarity: 'deep_papers', goal: 'build', time: 'high' },
    new: { role: 'engineering', programming: 'advanced', ai_familiarity: 'builder', goal: 'build_products', mechanics: 'very', time: 'high' },
  },

  // ─── RESEARCHER VARIANTS ───────────────────────────────────────
  {
    name: 'Priya-PhD — ML PhD student',
    archetype: 'Researcher',
    intent: 'Reads papers, wants depth, interpretability research',
    expected: 'researcher', expectedMechanicsShown: true,
    old: { role: 'research', programming: 'advanced', ai_familiarity: 'deep_papers', goal: 'deep', time: 'very_high' },
    new: { role: 'research', programming: 'advanced', ai_familiarity: 'builder', goal: 'understand_science', mechanics: 'very', time: 'very_high' },
  },
  {
    name: 'David — applied postdoc',
    archetype: 'Researcher',
    intent: 'Builds with HF, reads some papers, mostly hands-on research',
    expected: 'researcher', expectedMechanicsShown: true,
    old: { role: 'research', programming: 'intermediate', ai_familiarity: 'build', goal: 'deep', time: 'high' },
    new: { role: 'research', programming: 'intermediate', ai_familiarity: 'builder', goal: 'understand_science', mechanics: 'pretty', time: 'high' },
  },
  {
    name: 'Eli — undergrad CS',
    archetype: 'Researcher',
    intent: 'Learning fast, wants research depth but skills still developing',
    expected: 'researcher', expectedMechanicsShown: true,
    old: { role: 'research', programming: 'little', ai_familiarity: 'use', goal: 'deep', time: 'very_high' },
    new: { role: 'research', programming: 'little', ai_familiarity: 'regular', goal: 'understand_science', mechanics: 'very', time: 'very_high' },
  },

  // ─── CHAT_PERSONAS COVERAGE — 6 personas matching the site's declared archetypes ─
  {
    name: 'Sloan — data analyst',
    archetype: 'CHAT_PERSONA',
    intent: 'SQL + Excel + some Python, wants to move into ML and build features',
    expected: 'builder', expectedMechanicsShown: true,
    old: { role: 'engineering', programming: 'intermediate', ai_familiarity: 'use', goal: 'build', time: 'mid' },
    new: { role: 'engineering', programming: 'intermediate', ai_familiarity: 'regular', goal: 'build_products', mechanics: 'pretty', time: 'mid' },
  },
  {
    name: 'Ms. Chen — elementary teacher',
    archetype: 'CHAT_PERSONA',
    intent: 'Wants practical AI for classroom + help students navigate responsibly. With reworded Q4 (broader Decide framing), now picks Decide.',
    expected: 'explorer', expectedMechanicsShown: false,
    old: { role: 'other', programming: 'none', ai_familiarity: 'use', goal: 'effective', time: 'low' },
    new: { role: 'other', programming: 'none', ai_familiarity: 'regular', goal: 'decide', mechanics: 'not_really', time: 'low' },
  },
  {
    name: 'Reza — tech journalist',
    archetype: 'CHAT_PERSONA',
    intent: 'Covers AI accurately, wants to evaluate company claims, distinguish real vs hype',
    expected: 'explorer', expectedMechanicsShown: true,
    old: { role: 'creative', programming: 'none', ai_familiarity: 'use', goal: 'decide', time: 'mid' },
    new: { role: 'creative', programming: 'none', ai_familiarity: 'regular', goal: 'decide', mechanics: 'some', time: 'mid' },
  },
  {
    name: 'Dr. Okafor — healthcare clinician',
    archetype: 'CHAT_PERSONA',
    intent: 'Clinical AI literacy — wants to evaluate diagnostic tools + understand regulatory picture',
    expected: 'explorer', expectedMechanicsShown: true,
    old: { role: 'other', programming: 'none', ai_familiarity: 'use', goal: 'decide', time: 'low' },
    new: { role: 'other', programming: 'none', ai_familiarity: 'occasional', goal: 'decide', mechanics: 'pretty', time: 'low' },
  },
  {
    name: 'Avery — legal professional',
    archetype: 'CHAT_PERSONA',
    intent: 'Wants conceptual understanding + regulatory landscape. Q4 trap candidate: "conceptual understanding" could pull to Understand_Science.',
    expected: 'explorer', expectedMechanicsShown: true,
    old: { role: 'business', programming: 'none', ai_familiarity: 'use', goal: 'deep', time: 'low' },
    // Modeling the trap: lawyer reads "Understand the science" as "conceptual understanding"
    new: { role: 'business', programming: 'none', ai_familiarity: 'occasional', goal: 'understand_science', mechanics: 'pretty', time: 'low' },
  },
  {
    name: 'Mei — humanities student wanting AI literacy',
    archetype: 'CHAT_PERSONA',
    intent: 'Lit major, wants to use AI for studying + research, not a Researcher track candidate',
    expected: 'practitioner', expectedMechanicsShown: false,
    old: { role: 'research', programming: 'little', ai_familiarity: 'use', goal: 'effective', time: 'mid' },
    new: { role: 'research', programming: 'little', ai_familiarity: 'regular', goal: 'use_effectively', mechanics: 'not_really', time: 'mid' },
  },

  // ─── EDGE CASES ────────────────────────────────────────────────
  {
    name: 'EDGE: Tariq — career changer wants to build',
    archetype: 'Edge',
    intent: 'No code, no AI exp, picks "Build products" — gate should redirect to Practitioner/Explorer',
    expected: 'practitioner', expectedMechanicsShown: false,
    old: { role: 'other', programming: 'none', ai_familiarity: 'new', goal: 'build', time: 'high' },
    new: { role: 'other', programming: 'none', ai_familiarity: 'new', goal: 'build_products', mechanics: 'not_really', time: 'high' },
  },
  {
    name: 'EDGE: Sasha — designer deeply mechanics-curious',
    archetype: 'Edge',
    intent: 'Designer who picks "Very interested" in mechanics — should stay Practitioner, NOT pulled to Builder/Researcher',
    expected: 'practitioner', expectedMechanicsShown: true,
    old: { role: 'creative', programming: 'little', ai_familiarity: 'deep_papers', goal: 'deep', time: 'mid' },
    new: { role: 'creative', programming: 'little', ai_familiarity: 'power_user', goal: 'use_effectively', mechanics: 'very', time: 'mid' },
  },
  {
    name: 'EDGE: Hugo — senior eng picks Understand Science',
    archetype: 'Edge',
    intent: 'Senior engineer who wants research depth — ambiguous Builder vs Researcher; should go Researcher if "Understand Science" + "Very interested"',
    expected: 'researcher', expectedMechanicsShown: true,
    old: { role: 'engineering', programming: 'advanced', ai_familiarity: 'deep_papers', goal: 'deep', time: 'high' },
    new: { role: 'engineering', programming: 'advanced', ai_familiarity: 'builder', goal: 'understand_science', mechanics: 'very', time: 'high' },
  },
];

// ───────────────────────────────────────────────────────────────────
// Run simulation & format report
// ───────────────────────────────────────────────────────────────────
function pad(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n);
  return s + ' '.repeat(n - s.length);
}

function check(actual: Track, expected: Track): string {
  return actual === expected ? '✓' : '✗ wrong';
}

console.log('# Quiz simulation — OLD vs NEW scoring across 15 persona variants\n');
console.log('Generated by `bun simulate-personas.ts`. See `QUIZ_V2.md` for the new scoring matrix.\n');

let oldCorrect = 0, newCorrect = 0;
let oldMechanicsRight = 0, newMechanicsRight = 0;

const rows: string[] = [];
rows.push('| Persona | Intent → Expected | OLD track | NEW track | NEW mechanics shown? | Verdict |');
rows.push('|---|---|---|---|---|---|');

for (const p of PERSONAS) {
  const oldR = scoreOld(p.old);
  const newR = scoreNew(p.new);
  const oldOk = oldR.track === p.expected;
  const newOk = newR.track === p.expected;
  const mechOk = newR.mechanicsFlag === p.expectedMechanicsShown;
  if (oldOk) oldCorrect++;
  if (newOk) newCorrect++;
  // OLD doesn't have a mechanics flag — it's all-or-nothing by track. Approximate: OLD shows mechanics iff track is builder/researcher OR explorer/practitioner Week 1 (which it always does, since mechanics is unconditional). So OLD always "shows" mechanics in Wk 1 of every track.
  const oldShowsMech = true; // OLD has no gate — mechanics always shown
  if (oldShowsMech === p.expectedMechanicsShown) oldMechanicsRight++;
  if (mechOk) newMechanicsRight++;

  rows.push(
    `| ${p.name} | ${p.intent.length > 50 ? p.intent.slice(0, 47) + '...' : p.intent} → **${p.expected}** | ${oldR.track} ${check(oldR.track, p.expected)} | ${newR.track} ${check(newR.track, p.expected)} | ${newR.mechanicsFlag ? 'yes' : 'no'} ${mechOk ? '✓' : '✗ wrong'} | ${newOk && mechOk ? '✓ FIXED' : oldOk && !newOk ? '⚠ REGRESSION' : newOk ? '~ partial' : '✗ still wrong'} |`
  );
}

console.log(rows.join('\n'));

console.log(`\n## Aggregate\n`);
console.log(`- OLD track-correct: **${oldCorrect}/${PERSONAS.length}** (${Math.round(100*oldCorrect/PERSONAS.length)}%)`);
console.log(`- NEW track-correct: **${newCorrect}/${PERSONAS.length}** (${Math.round(100*newCorrect/PERSONAS.length)}%)`);
console.log(`- OLD mechanics-content-correct: **${oldMechanicsRight}/${PERSONAS.length}** (always shows, so only matches when expected=true)`);
console.log(`- NEW mechanics-content-correct: **${newMechanicsRight}/${PERSONAS.length}** (${Math.round(100*newMechanicsRight/PERSONAS.length)}%)`);

console.log(`\n## Per-archetype breakdown\n`);
const archetypes = [...new Set(PERSONAS.map(p => p.archetype))];
for (const arch of archetypes) {
  const sub = PERSONAS.filter(p => p.archetype === arch);
  const oldOk = sub.filter(p => scoreOld(p.old).track === p.expected).length;
  const newOk = sub.filter(p => scoreNew(p.new).track === p.expected).length;
  const mechOk = sub.filter(p => scoreNew(p.new).mechanicsFlag === p.expectedMechanicsShown).length;
  console.log(`- **${arch}** (n=${sub.length}): OLD ${oldOk}/${sub.length} track, NEW ${newOk}/${sub.length} track, NEW ${mechOk}/${sub.length} mechanics-gate`);
}

console.log(`\n## Mismatches under NEW (where the proposal still fails)\n`);
const newFails = PERSONAS.filter(p => scoreNew(p.new).track !== p.expected || scoreNew(p.new).mechanicsFlag !== p.expectedMechanicsShown);
if (newFails.length === 0) {
  console.log('_None. All 15 personas route correctly under NEW scoring._');
} else {
  for (const p of newFails) {
    const r = scoreNew(p.new);
    console.log(`- **${p.name}** — expected **${p.expected}** (mech=${p.expectedMechanicsShown}), got **${r.track}** (mech=${r.mechanicsFlag}). Scores: ${JSON.stringify(r.scores)}.`);
  }
}
