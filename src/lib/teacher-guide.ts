// The teacher guide for a textbook lesson: a timed plan, what to ask the class, mistakes to watch
// for, help and stretch ideas, an exit ticket and the answer key. Built from the lesson itself, so
// it always matches what students read. Used by the teacher guide page and by the AI Teacher in a
// Live Session.

import { SKILLS_BY_ID } from "./quest/skills";
import { allProblems, type BookProblem, type TextbookLesson, type WorksheetProblem } from "./textbook-lesson";

export interface GuideQuestion { q: string; a: string }
export interface GuideSection {
  title: string;
  minutes: number;
  /** What the teacher does, in order. */
  steps: string[];
  /** Questions to ask the class, with the answer to listen for. */
  ask: GuideQuestion[];
  /** Problems the class tries in this section (answers are in the answer key). */
  problems: { label: string; question: string }[];
}
export interface Misconception { mistake: string; example: string; respond: string }
export interface AnswerKeyItem { label: string; question: string; answer: string; solution: string[] }

export interface TeacherGuide {
  skill_id: string;
  title: string;
  grade: number | null;
  standards: string;
  goal: string;
  overview: string;
  vocabulary: { term: string; meaning: string }[];
  prerequisites: string[];
  totalMinutes: number;
  /** True when the plan runs long enough that splitting it over two class periods is suggested. */
  twoDays: boolean;
  plan: GuideSection[];
  misconceptions: Misconception[];
  support: string[];
  challenge: string[];
  exitTicket: AnswerKeyItem[];
  answerKey: AnswerKeyItem[];
}

const MINUTES = { warmUp: 5, intro: 3, part: 8, mistake: 5, practiceMin: 10, practiceMax: 15, wrapUp: 4 };
const CLASS_PERIOD = 50;
const MAX_MISCONCEPTIONS = 8;

/** Markdown bold and extra spaces out, for plain guide text. */
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\s+/g, " ").trim();
const firstSentence = (s: string) => plain(s).match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? plain(s);
const keyItem = (label: string, p: BookProblem): AnswerKeyItem => ({
  label,
  question: plain(p.question) + (p.choices ? ` (Choices: ${p.choices.join(" | ")})` : ""),
  answer: p.answer,
  solution: p.solution.map(plain),
});

/**
 * The exit ticket: up to 3 worksheet problems (the hardest practice one, the first apply and think
 * ones), or the last Try Its when there's no worksheet. Labels match the answer key's.
 */
function exitTicketProblems(l: TextbookLesson): { label: string; problem: BookProblem }[] {
  const all = allProblems(l);
  if (!l.worksheet.length) return all.filter((x) => x.label.includes("Try It")).slice(-3);
  const at = (level: WorksheetProblem["level"], last = false) => {
    const list = l.worksheet.map((problem, i) => ({ problem, i })).filter((x) => x.problem.level === level);
    return last ? list[list.length - 1] : list[0];
  };
  return [at("practice", true), at("apply"), at("think")]
    .filter((x): x is { problem: WorksheetProblem; i: number } => !!x)
    .map(({ problem, i }) => ({ label: `Worksheet ${i + 1}`, problem }));
}

export function buildTeacherGuide(l: TextbookLesson): TeacherGuide {
  const skill = SKILLS_BY_ID[l.skill_id];
  const plan: GuideSection[] = [];

  if (l.warm_up.length) {
    plan.push({
      title: "Warm-up",
      minutes: MINUTES.warmUp,
      steps: [
        "Put the warm-up problems on the board as students come in. They review earlier skills this lesson needs.",
        "Give students a couple of minutes, then go over the answers. If many miss one, reteach that skill briefly before moving on.",
      ],
      ask: [],
      problems: l.warm_up.map((p, i) => ({ label: `Warm-up ${i + 1}`, question: plain(p.question) })),
    });
  }

  plan.push({
    title: "Introduce the lesson",
    minutes: MINUTES.intro,
    steps: [
      `Read or tell the opening situation: "${plain(l.hook)}"`,
      `Share the goal: "${plain(l.goal)}"`,
      ...(l.vocabulary.length ? [`Introduce the key words: ${l.vocabulary.map((v) => v.term).join(", ")}.`] : []),
    ],
    ask: [{ q: "What do you already know that could help with this?", a: "The warm-up skills and the earlier skills this lesson builds on." }],
    problems: [],
  });

  l.parts.forEach((part, i) => {
    const steps: string[] = [];
    if (part.read.length) steps.push(`Teach the idea: ${part.read.map(firstSentence).join(" ")}`);
    if (part.model) steps.push(`Show the model on the board: ${part.model.caption}.`);
    steps.push(`Work the example together, one step at a time: ${plain(part.example.problem)}`);
    part.example.steps.forEach((s, j) => steps.push(`Step ${j + 1}: ${plain(s.say)}`));
    steps.push(`Answer: ${plain(part.example.answer)}`);
    if (part.try_it.length) steps.push("Have students do the Try It on their own or with a partner, then check together. Aim for most of the class getting it right before moving on.");
    plan.push({
      title: `Part ${i + 1}: ${plain(part.heading)}`,
      minutes: MINUTES.part,
      steps,
      // The "why" of each step makes a good question: students explain the step before you do
      ask: part.example.steps.filter((s) => s.why).slice(0, 2).map((s) => ({ q: `Why do we do this: "${firstSentence(s.say)}"?`, a: plain(s.why) })),
      problems: part.try_it.map((p, j) => ({ label: `Try It ${i + 1}.${j + 1}`, question: plain(p.question) })),
    });
  });

  if (l.mistake.problem) {
    plan.push({
      title: "Spot the mistake",
      minutes: MINUTES.mistake,
      steps: [
        `Show this student work: ${plain(l.mistake.problem)}`,
        ...l.mistake.work.map(plain),
        "Give students a minute to find the mistake on their own, then discuss.",
        `The fix: ${plain(l.mistake.fix)}`,
      ],
      ask: [{ q: "What went wrong, and how would you fix it?", a: plain(l.mistake.what_went_wrong) }],
      problems: [],
    });
  }

  const ticket = exitTicketProblems(l);
  const used = plan.reduce((s, x) => s + x.minutes, 0) + MINUTES.wrapUp;
  if (l.worksheet.length) {
    plan.push({
      title: "Worksheet",
      minutes: Math.min(MINUTES.practiceMax, Math.max(MINUTES.practiceMin, CLASS_PERIOD - used)),
      steps: [
        `Students work on the worksheet (${l.worksheet.length} problems: practice, word problems, thinking questions, review and a challenge). Their mentor gives hints and feedback, and finished worksheets are graded automatically.`,
        "Walk around and check in with students who are stuck, or pull a small group for the hardest problems.",
        "Early finishers: the challenge problem, then Math Quest practice on this skill.",
      ],
      ask: [],
      problems: [],
    });
  }
  plan.push({
    title: "Wrap-up and exit ticket",
    minutes: MINUTES.wrapUp,
    steps: [
      ...l.summary.map((s) => `Review: ${plain(s)}`),
      ...(ticket.length ? [`Exit ticket: students answer ${ticket.length === 1 ? "this question" : `these ${ticket.length} questions`} on paper before they leave. Use the answers to plan tomorrow.`] : []),
      ...(l.faith ? [`Faith connection (optional): ${plain(l.faith)}`] : []),
    ],
    ask: [{ q: "What's one thing you'd tell a friend who missed today's lesson?", a: "The key ideas in the review above." }],
    problems: ticket.map((t) => ({ label: t.label, question: plain(t.problem.question) })),
  });

  // Mistakes students make, from the wrong answers the lesson already knows about
  const misconceptions: Misconception[] = [];
  const seen = new Set<string>();
  for (const { label, problem } of allProblems(l)) {
    for (const w of problem.wrong) {
      const key = plain(w.feedback).toLowerCase().slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      misconceptions.push({ mistake: `Answering ${w.answer}`, example: `${label}: ${plain(problem.question)}`, respond: plain(w.feedback) });
    }
  }

  const support = [
    "Let students use Read it to me and ask their mentor about any page.",
    ...l.parts.filter((p) => p.model).map((p) => `Keep this model visible while they work: ${p.model!.caption}.`),
    ...l.parts.flatMap((p) => p.try_it.slice(0, 1)).map((p) => `If a student is stuck on a Try It, give the first hint: "${plain(p.hints[0] ?? "")}"`).slice(0, 2),
    ...(skill?.prereqs.length ? [`Review first if needed: ${skill.prereqs.map((id) => SKILLS_BY_ID[id]?.name ?? id).join(", ")}.`] : []),
  ];
  const challenge = [
    ...l.worksheet.filter((p) => p.level === "challenge").map((p) => `Challenge problem: ${plain(p.question)}`),
    "Ask students to write their own word problem for this skill, then swap and solve.",
    "Ask students to explain a worked example to a partner without looking at the steps.",
  ];

  const totalMinutes = plan.reduce((s, x) => s + x.minutes, 0);
  return {
    skill_id: l.skill_id,
    title: plain(l.title),
    grade: skill?.grade ?? null,
    standards: [skill?.nad && `NAD ${skill.nad}`, skill?.standard && `Common Core ${skill.standard}`].filter(Boolean).join(" · "),
    goal: plain(l.goal),
    overview: plain(l.hook),
    vocabulary: l.vocabulary.map((v) => ({ term: v.term, meaning: plain(v.meaning) })),
    prerequisites: (skill?.prereqs ?? []).map((id) => SKILLS_BY_ID[id]?.name ?? id),
    totalMinutes,
    twoDays: totalMinutes > CLASS_PERIOD + 10,
    plan,
    misconceptions: misconceptions.slice(0, MAX_MISCONCEPTIONS),
    support,
    challenge,
    exitTicket: ticket.map((t) => keyItem(t.label, t.problem)),
    answerKey: allProblems(l).map(({ label, problem }) => keyItem(label, problem)),
  };
}

/** The guide as text, for the AI Teacher's lesson material and its answer key. */
export function guideAsText(g: TeacherGuide): { lesson: string; answerKey: string } {
  const lesson = [
    `# ${g.title}`,
    g.standards,
    `Goal: ${g.goal}`,
    `Opening situation: ${g.overview}`,
    g.vocabulary.length ? `Words to know:\n${g.vocabulary.map((v) => `- ${v.term}: ${v.meaning}`).join("\n")}` : "",
    `Lesson plan (about ${g.totalMinutes} minutes). Teach it in this order:`,
    ...g.plan.map((s) => [
      `## ${s.title} (${s.minutes} min)`,
      ...s.steps.map((x) => `- ${x}`),
      ...s.problems.map((p) => `- Class problem (${p.label}): ${p.question}`),
      ...s.ask.map((q) => `- Ask the class: ${q.q} (Listen for: ${q.a})`),
    ].join("\n")),
    g.misconceptions.length ? `Mistakes to watch for:\n${g.misconceptions.map((m) => `- ${m.mistake} (${m.example}): ${m.respond}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
  const answerKey = g.answerKey.map((a) => `${a.label}: ${a.answer}. ${a.solution.join(" ")}`).join("\n");
  return { lesson, answerKey };
}
