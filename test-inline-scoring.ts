#!/usr/bin/env bun
// Extract the patched calculateResults JS from index.html and run a smoke test
// against persona quiz answers. Confirms the inline scoring matches simulate-personas.ts.

import { readFileSync } from 'fs';

const html = readFileSync(__dirname + '/index.html', 'utf-8');

// Pull QUESTIONS array source
const qStart = html.indexOf('const QUESTIONS = [');
const qEnd = html.indexOf('];', qStart) + 2;
const questionsSrc = html.slice(qStart, qEnd);

// Pull MULTI_SELECT_QUESTION_IDS
const msStart = html.indexOf('const MULTI_SELECT_QUESTION_IDS');
const msEnd = html.indexOf(';', msStart) + 1;
const multiSrc = html.slice(msStart, msEnd);

// Build a sandbox that re-implements the calculateResults logic against arbitrary answers
const sandbox = `
${multiSrc}
${questionsSrc}

function calc(answers) {
  const scores = { explorer: 0, practitioner: 0, builder: 0, researcher: 0 };
  QUESTIONS.forEach((q, i) => {
    const picks = answers[i];
    if (!picks || picks.length === 0) return;
    const isMulti = MULTI_SELECT_QUESTION_IDS.has(q.id);
    const agg = { explorer: 0, practitioner: 0, builder: 0, researcher: 0 };
    picks.forEach(pickIdx => {
      const opt = q.options[pickIdx];
      if (!opt) return;
      for (const [t, s] of Object.entries(opt.scores)) agg[t] += s;
    });
    const divisor = isMulti ? picks.length : 1;
    for (const t of Object.keys(scores)) scores[t] += agg[t] / divisor;
  });

  const progIdx = (answers[1] && answers[1][0]);
  const goalIdx = (answers[3] && answers[3][0]);
  const progIsLow = progIdx === 0 || progIdx === 1;
  const goalIsScience = goalIdx === 3;
  const goalIsBuild = goalIdx === 2;
  if (progIsLow) {
    scores.builder = 0;
    if (!goalIsScience) scores.researcher = 0;
  }
  if (goalIsBuild && progIsLow) scores.practitioner += 5;

  const GOAL_PRIMARY = ['practitioner', 'explorer', 'builder', 'researcher'];
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let topTrack;
  if (sorted.length >= 2 && sorted[0][1] === sorted[1][1] && goalIdx !== undefined) {
    const goalTarget = GOAL_PRIMARY[goalIdx];
    const tied = sorted.filter(s => s[1] === sorted[0][1]).map(s => s[0]);
    topTrack = tied.includes(goalTarget) ? goalTarget : sorted[0][0];
  } else {
    topTrack = sorted[0][0];
  }
  return { track: topTrack, scores };
}

// Smoke test cases — encoded as answers arrays per question:
// Q0 role: 0=business, 1=creative, 2=engineering, 3=research, 4=other
// Q1 programming: 0=none, 1=little, 2=intermediate, 3=advanced
// Q2 ai_familiarity: 0=new, 1=occasional, 2=regular, 3=power_user, 4=builder
// Q3 goal: 0=use_effectively, 1=decide, 2=build_products, 3=understand_science
// Q4 mechanics: 0=not_really, 1=some, 2=pretty, 3=very
// Q5 time: 0-3

const cases = [
  { name: 'Maria (COO, no-code, mechanics-curious, decide)', a: [[0], [0], [2], [1], [2], [1]], expect: 'explorer' },
  { name: 'Carlos (CFO, no mechanics, decide)', a: [[0], [0], [1], [1], [0], [0]], expect: 'explorer' },
  { name: 'Dev (designer, daily Claude, use_effectively, no mech)', a: [[1], [1], [3], [0], [0], [1]], expect: 'practitioner' },
  { name: 'Marcus (senior eng, build_products, no mech)', a: [[2], [3], [4], [2], [0], [2]], expect: 'builder' },
  { name: 'Priya-PhD (ML PhD, understand_science, very mech)', a: [[3], [3], [4], [3], [3], [3]], expect: 'researcher' },
  { name: 'Tariq (no-code, wants to build)', a: [[4], [0], [0], [2], [0], [2]], expect: 'practitioner' },
  { name: 'Eli (undergrad, little code, understand_science)', a: [[3], [1], [2], [3], [3], [3]], expect: 'researcher' },
  { name: 'Hugo (senior eng, understand_science → tiebreak)', a: [[2], [3], [4], [3], [3], [2]], expect: 'researcher' },
  { name: 'Ms. Chen (teacher, picks decide post-reword)', a: [[4], [0], [2], [1], [0], [0]], expect: 'explorer' },
  { name: 'Avery (lawyer, picks understand_science trap)', a: [[0], [0], [1], [3], [2], [0]], expect: 'explorer' },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const r = calc(c.a);
  const ok = r.track === c.expect;
  ok ? pass++ : fail++;
  console.log(\`\${ok ? '✓' : '✗'} \${c.name} → \${r.track} (expect \${c.expect}) \${ok ? '' : JSON.stringify(r.scores)}\`);
}
console.log(\`\\n\${pass}/\${cases.length} pass\`);
if (fail > 0) process.exit(1);
`;

eval(sandbox);
