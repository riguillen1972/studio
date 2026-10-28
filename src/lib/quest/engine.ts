// Server-only: the Math Quest engine — diagnostic, post-check, and daily practice.
// Students only ever get approved questions. All progress is stored per student and skill.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/usage";
import { SKILLS, SKILLS_BY_ID, prerequisiteChain, type Skill } from "./skills";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { checkAnswer, type QuestChoice, type QuestItem } from "./answers";
import {
  MASTERED_AT, MIN_ATTEMPTS_FOR_MASTERY, diagnosticPrior, nextReviewDate, statusOf, updatePKnown, type SkillStatus,
} from "./mastery";

export const DIAGNOSTIC_MAX_QUESTIONS = 24;
export const POST_MAX_SKILLS = 8;
export const POST_ITEMS_PER_SKILL = 2;
export const DAILY_GOAL = 15;

// ---------- Shared helpers ----------

export interface PublicItem {
  id: string;
  skill_id: string;
  skill_name: string;
  kind: "multiple_choice" | "numeric";
  stem: string;
  choices: string[] | null;
}

/** What the student sees: no answer, no explanation, no misconception tags. Choices are shuffled. */
export function toPublic(item: QuestItem): PublicItem {
  const choices = item.choices ? shuffle(item.choices.map((c) => c.text)) : null;
  return { id: item.id, skill_id: item.skill_id, skill_name: SKILLS_BY_ID[item.skill_id]?.name ?? "", kind: item.kind, stem: item.stem, choices };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The student's grade, clamped to the pilot's 6–8. Null if they're not a grades 6–8 student. */
export async function questGradeFor(supabase: SupabaseClient, studentId: string): Promise<number | null> {
  const { data } = await supabase.from("profiles").select("role, grade_level").eq("id", studentId).maybeSingle();
  const grade = parseInt(data?.grade_level ?? "", 10);
  if (data?.role !== "k12" || !(grade >= 6 && grade <= 8)) return null;
  return grade;
}

export async function currentClassId(supabase: SupabaseClient, studentId: string): Promise<string | null> {
  const { data } = await supabase.from("enrollments").select("class_id").eq("student_id", studentId).limit(1).maybeSingle();
  return data?.class_id ?? null;
}

/** Picks an approved question for a skill, preferring ones the student hasn't seen and the wanted difficulty. */
async function pickItem(
  supabase: SupabaseClient, studentId: string, skillId: string,
  opts: { difficulty?: number; exclude?: Set<string> } = {},
): Promise<QuestItem | null> {
  const [{ data: items }, { data: seen }] = await Promise.all([
    supabase.from("quest_items").select("id, skill_id, difficulty, kind, stem, choices, answer, explanation")
      .eq("skill_id", skillId).eq("status", "approved"),
    supabase.from("quest_attempts").select("item_id").eq("student_id", studentId).eq("skill_id", skillId),
  ]);
  const pool = ((items ?? []) as QuestItem[]).filter((i) => !opts.exclude?.has(i.id));
  if (pool.length === 0) return null;
  const seenIds = new Set((seen ?? []).map((s) => s.item_id));
  const score = (i: QuestItem) => (seenIds.has(i.id) ? 10 : 0) + Math.abs(i.difficulty - (opts.difficulty ?? 2)) + Math.random() * 0.5;
  return pool.sort((a, b) => score(a) - score(b))[0];
}

async function getItem(supabase: SupabaseClient, itemId: string): Promise<QuestItem | null> {
  const { data } = await supabase.from("quest_items")
    .select("id, skill_id, difficulty, kind, stem, choices, answer, explanation").eq("id", itemId).maybeSingle();
  return (data as QuestItem) ?? null;
}

async function recordAttempt(supabase: SupabaseClient, row: {
  student_id: string; class_id: string | null; item: QuestItem; phase: string;
  assessment_id?: string | null; correct: boolean; response: string; misconception: string | null; seconds: number | null;
}) {
  const { error } = await supabase.from("quest_attempts").insert({
    student_id: row.student_id, class_id: row.class_id, item_id: row.item.id, skill_id: row.item.skill_id,
    phase: row.phase, assessment_id: row.assessment_id ?? null, correct: row.correct,
    response: row.response.slice(0, 200), misconception: row.misconception, seconds: row.seconds,
  });
  if (error) console.error("Failed to record attempt:", error);
}

const clampSeconds = (s: unknown) => {
  const n = Math.round(Number(s));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 1800) : null;
};

// ---------- Assessments (diagnostic and post-check) ----------

interface Asked { skill_id: string; item_id: string; correct: boolean; difficulty: number }
interface AssessmentState {
  grade: number;
  queue: string[];          // skills still to ask
  asked: Asked[];
  probed: string[];         // skills already asked or queued
  current: { item_id: string; skill_id: string } | null;
  max: number;
}

export interface AssessmentProgress {
  assessment_id: string;
  kind: "diagnostic" | "post";
  status: "in_progress" | "completed";
  question: PublicItem | null;
  answered: number;
  total_estimate: number;
  results?: unknown;
}

/** Starts (or resumes) the student's diagnostic or post-check. */
export async function startAssessment(studentId: string, kind: "diagnostic" | "post"): Promise<AssessmentProgress | { error: string }> {
  const supabase = getAdminClient();
  const grade = await questGradeFor(supabase, studentId);
  if (!grade) return { error: "Math Quest is for students in grades 6–8." };
  const classId = await currentClassId(supabase, studentId);

  const { data: existing } = await supabase.from("quest_assessments")
    .select("*").eq("student_id", studentId).eq("kind", kind).eq("status", "in_progress")
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (existing) {
    const state = existing.state as AssessmentState;
    const item = state.current ? await getItem(supabase, state.current.item_id) : null;
    return { assessment_id: existing.id, kind, status: "in_progress", question: item ? toPublic(item) : null, answered: state.asked.length, total_estimate: state.max };
  }

  let queue: string[];
  let max: number;
  if (kind === "diagnostic") {
    // Start with this grade's skills; misses lead back to the skills they build on
    queue = SKILLS.filter((s) => s.grade === grade).map((s) => s.id);
    max = DIAGNOSTIC_MAX_QUESTIONS;
  } else {
    queue = await postCheckSkills(supabase, studentId);
    if (queue.length === 0) return { error: "Practice a few skills first, then take the check." };
    queue = queue.flatMap((s) => Array(POST_ITEMS_PER_SKILL).fill(s));
    max = queue.length;
  }

  const state: AssessmentState = { grade, queue, asked: [], probed: [...new Set(queue)], current: null, max };
  const first = await advance(supabase, studentId, state, kind);
  if (!first) return { error: "There aren't enough approved questions yet. Ask your teacher to approve some in Math Quest." };

  const { data: created, error } = await supabase.from("quest_assessments")
    .insert({ student_id: studentId, class_id: classId, kind, state }).select("id").single();
  if (error || !created) {
    console.error("Failed to start assessment:", error);
    return { error: "Couldn't start. Please try again." };
  }
  return { assessment_id: created.id, kind, status: "in_progress", question: toPublic(first), answered: 0, total_estimate: max };
}

/** Moves to the next skill in the queue that has an approved question. Mutates state. */
async function advance(supabase: SupabaseClient, studentId: string, state: AssessmentState, kind: "diagnostic" | "post"): Promise<QuestItem | null> {
  const usedItems = new Set(state.asked.map((a) => a.item_id));
  if (kind === "post") {
    // Avoid questions seen in the diagnostic or practice where possible
    const { data } = await supabase.from("quest_attempts").select("item_id").eq("student_id", studentId);
    for (const r of data ?? []) if (r.item_id) usedItems.add(r.item_id);
  }
  while (state.queue.length && state.asked.length < state.max) {
    const skillId = state.queue.shift()!;
    let item = await pickItem(supabase, studentId, skillId, { difficulty: 2, exclude: usedItems });
    if (!item && kind === "post") item = await pickItem(supabase, studentId, skillId, { difficulty: 2, exclude: new Set(state.asked.map((a) => a.item_id)) });
    if (item) {
      state.current = { item_id: item.id, skill_id: skillId };
      return item;
    }
  }
  state.current = null;
  return null;
}

/** Records an answer and returns the next question, or the results when finished. */
export async function answerAssessment(
  studentId: string, assessmentId: string, itemId: string, response: string, seconds: unknown,
): Promise<AssessmentProgress | { error: string }> {
  const supabase = getAdminClient();
  const { data: assessment } = await supabase.from("quest_assessments").select("*").eq("id", assessmentId).maybeSingle();
  if (!assessment || assessment.student_id !== studentId) return { error: "Not found" };
  if (assessment.status !== "in_progress") return { error: "This check is already finished." };

  const state = assessment.state as AssessmentState;
  if (!state.current || state.current.item_id !== itemId) return { error: "That question isn't the current one. Reload the page." };
  const item = await getItem(supabase, itemId);
  if (!item) return { error: "Question not found" };

  const { correct, misconception } = checkAnswer(item, response);
  await recordAttempt(supabase, {
    student_id: studentId, class_id: assessment.class_id, item, phase: assessment.kind, assessment_id: assessmentId,
    correct, response, misconception, seconds: clampSeconds(seconds),
  });
  state.asked.push({ skill_id: item.skill_id, item_id: item.id, correct, difficulty: item.difficulty });

  // Diagnostic: a miss means checking the skills this one builds on, nearest first
  if (assessment.kind === "diagnostic" && !correct) {
    const prereqs = (SKILLS_BY_ID[item.skill_id]?.prereqs ?? []).filter((p) => !state.probed.includes(p));
    state.queue.unshift(...prereqs);
    state.probed.push(...prereqs);
  }

  const next = await advance(supabase, studentId, state, assessment.kind);
  if (next) {
    await supabase.from("quest_assessments").update({ state }).eq("id", assessmentId);
    return { assessment_id: assessmentId, kind: assessment.kind, status: "in_progress", question: toPublic(next), answered: state.asked.length, total_estimate: Math.max(state.max, state.asked.length + 1) };
  }

  const results = assessment.kind === "diagnostic"
    ? await finishDiagnostic(supabase, studentId, state)
    : await finishPostCheck(supabase, studentId, state);
  await supabase.from("quest_assessments")
    .update({ state, status: "completed", results, completed_at: new Date().toISOString() }).eq("id", assessmentId);
  return { assessment_id: assessmentId, kind: assessment.kind, status: "completed", question: null, answered: state.asked.length, total_estimate: state.asked.length, results };
}

type DiagnosticResult = "correct" | "wrong" | "inferred_known" | "inferred_unsure";

async function finishDiagnostic(supabase: SupabaseClient, studentId: string, state: AssessmentState) {
  const result = new Map<string, { result: DiagnosticResult; difficulty: number }>();
  for (const a of state.asked) {
    // If a skill was asked twice, a miss wins
    const prev = result.get(a.skill_id);
    if (!prev || !a.correct) result.set(a.skill_id, { result: a.correct ? "correct" : "wrong", difficulty: a.difficulty });
  }
  // Skills a correct answer builds on are probably known
  for (const a of state.asked.filter((x) => x.correct)) {
    for (const p of prerequisiteChain(a.skill_id)) if (!result.has(p)) result.set(p, { result: "inferred_known", difficulty: 2 });
  }
  // Grade-level skills and missed skills' foundations we didn't get to
  const untested = [
    ...SKILLS.filter((s) => s.grade === state.grade).map((s) => s.id),
    ...state.asked.filter((a) => !a.correct).flatMap((a) => SKILLS_BY_ID[a.skill_id]?.prereqs ?? []),
  ];
  for (const id of untested) if (!result.has(id)) result.set(id, { result: "inferred_unsure", difficulty: 2 });

  const now = new Date().toISOString();
  const rows = [...result.entries()].map(([skill_id, r]) => ({
    student_id: studentId, skill_id, p_known: diagnosticPrior(r.result, r.difficulty),
    attempts: 0, correct: 0, streak: 0, review_step: 0, mastered_at: null, next_review: null, updated_at: now,
  }));
  const { error } = await supabase.from("quest_mastery").upsert(rows, { onConflict: "student_id,skill_id" });
  if (error) console.error("Failed to save diagnostic mastery:", error);

  const skills = [...result.entries()].map(([skill_id, r]) => ({
    skill_id, name: SKILLS_BY_ID[skill_id]?.name, grade: SKILLS_BY_ID[skill_id]?.grade,
    result: r.result, status: statusOf(diagnosticPrior(r.result, r.difficulty), 0),
  }));
  return {
    questions: state.asked.length,
    correct: state.asked.filter((a) => a.correct).length,
    gaps: skills.filter((s) => s.result === "wrong").map((s) => s.skill_id),
    skills,
  };
}

/** Skills for the post-check: what the student practiced, weakest first, plus diagnostic gaps. */
async function postCheckSkills(supabase: SupabaseClient, studentId: string): Promise<string[]> {
  const { data: diag } = await supabase.from("quest_assessments").select("results, completed_at")
    .eq("student_id", studentId).eq("kind", "diagnostic").eq("status", "completed")
    .order("completed_at", { ascending: false }).limit(1).maybeSingle();
  const since = diag?.completed_at ?? new Date(0).toISOString();
  const { data: practiced } = await supabase.from("quest_attempts").select("skill_id")
    .eq("student_id", studentId).in("phase", ["practice", "review"]).gte("created_at", since);
  const counts = new Map<string, number>();
  for (const p of practiced ?? []) counts.set(p.skill_id, (counts.get(p.skill_id) ?? 0) + 1);
  const gaps: string[] = (diag?.results as { gaps?: string[] } | null)?.gaps ?? [];
  const ordered = [...new Set([...gaps.filter((g) => counts.has(g)), ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s), ...gaps])];
  return ordered.slice(0, POST_MAX_SKILLS);
}

async function finishPostCheck(supabase: SupabaseClient, studentId: string, state: AssessmentState) {
  const skillIds = [...new Set(state.asked.map((a) => a.skill_id))];
  const { data: diagAttempts } = await supabase.from("quest_attempts").select("skill_id, correct")
    .eq("student_id", studentId).eq("phase", "diagnostic").in("skill_id", skillIds);
  const { data: mastery } = await supabase.from("quest_mastery").select("skill_id, p_known").eq("student_id", studentId).in("skill_id", skillIds);

  const skills = skillIds.map((skill_id) => {
    const post = state.asked.filter((a) => a.skill_id === skill_id);
    const pre = (diagAttempts ?? []).filter((a) => a.skill_id === skill_id);
    return {
      skill_id, name: SKILLS_BY_ID[skill_id]?.name,
      pre_correct: pre.length ? pre.filter((a) => a.correct).length / pre.length : null,
      post_correct: post.filter((a) => a.correct).length / post.length,
      p_known: mastery?.find((m) => m.skill_id === skill_id)?.p_known ?? null,
    };
  });
  const compared = skills.filter((s) => s.pre_correct !== null);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  return {
    questions: state.asked.length,
    correct: state.asked.filter((a) => a.correct).length,
    pre_average: avg(compared.map((s) => s.pre_correct as number)),
    post_average_same_skills: avg(compared.map((s) => s.post_correct)),
    post_average: avg(skills.map((s) => s.post_correct)),
    skills,
  };
}

// ---------- Daily practice ----------

interface MasteryRow {
  skill_id: string; p_known: number; attempts: number; correct: number; streak: number;
  review_step: number; next_review: string | null; mastered_at: string | null;
}

export interface PracticeQuestion {
  question: PublicItem;
  phase: "practice" | "review";
  reason: string;
}

/** Chooses the next practice question: about 60% this week's topic, 25% weak spots, 15% review. */
export async function nextPractice(studentId: string): Promise<PracticeQuestion | { error: string }> {
  const supabase = getAdminClient();
  const grade = await questGradeFor(supabase, studentId);
  if (!grade) return { error: "Math Quest is for students in grades 6–8." };
  const classId = await currentClassId(supabase, studentId);

  const [{ data: rows }, { data: focusRow }, { data: recent }] = await Promise.all([
    supabase.from("quest_mastery").select("skill_id, p_known, attempts, correct, streak, review_step, next_review, mastered_at").eq("student_id", studentId),
    classId ? supabase.from("quest_class_focus").select("skill_ids").eq("class_id", classId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("quest_attempts").select("skill_id").eq("student_id", studentId).order("created_at", { ascending: false }).limit(3),
  ]);
  const mastery = new Map(((rows ?? []) as MasteryRow[]).map((r) => [r.skill_id, r]));
  const p = (id: string) => mastery.get(id)?.p_known ?? 0.3;
  const isMastered = (id: string) => !!mastery.get(id)?.mastered_at;
  // Don't ask the same skill more than 3 times in a row
  const recentSkills = (recent ?? []).map((r) => r.skill_id);
  const overused = recentSkills.length === 3 && recentSkills.every((s) => s === recentSkills[0]) ? recentSkills[0] : null;

  /** If a skill's foundations are shaky, practice the weakest foundation first. */
  const goBack = (id: string): { id: string; via?: string } => {
    const weakPrereq = (SKILLS_BY_ID[id]?.prereqs ?? []).filter((pr) => mastery.has(pr) && p(pr) < 0.6).sort((a, b) => p(a) - p(b))[0];
    return weakPrereq ? { id: weakPrereq, via: id } : { id };
  };

  const focusIds: string[] = ((focusRow as { skill_ids?: string[] } | null)?.skill_ids?.length
    ? (focusRow as { skill_ids: string[] }).skill_ids
    : SKILLS.filter((s) => s.grade === grade).map((s) => s.id));

  const now = Date.now();
  const buckets: { weight: number; phase: "practice" | "review"; pick: () => { id: string; via?: string; reason: string } | null }[] = [
    { weight: 0.6, phase: "practice", pick: () => {
      const id = focusIds.filter((f) => !isMastered(f) && f !== overused).sort((a, b) => p(a) - p(b))[0];
      if (!id) return null;
      const target = goBack(id);
      return { ...target, reason: target.via ? `Building a foundation for ${SKILLS_BY_ID[target.via]?.name}` : "This week's topic" };
    } },
    { weight: 0.25, phase: "practice", pick: () => {
      const id = [...mastery.values()].filter((r) => !r.mastered_at && r.p_known < 0.6 && r.skill_id !== overused)
        .sort((a, b) => a.p_known - b.p_known)[0]?.skill_id;
      if (!id) return null;
      const target = goBack(id);
      return { ...target, reason: target.via ? `Building a foundation for ${SKILLS_BY_ID[target.via]?.name}` : "Strengthening a weak spot" };
    } },
    { weight: 0.15, phase: "review", pick: () => {
      const due = [...mastery.values()].filter((r) => r.mastered_at && r.next_review && Date.parse(r.next_review) <= now && r.skill_id !== overused)
        .sort((a, b) => Date.parse(a.next_review!) - Date.parse(b.next_review!))[0];
      return due ? { id: due.skill_id, reason: "Quick review to keep it fresh" } : null;
    } },
  ];

  // Weighted random over buckets that have something to offer
  const options = buckets.map((b) => ({ ...b, choice: b.pick() })).filter((b) => b.choice);
  if (options.length === 0) return { error: "You've mastered everything available right now. Great work!" };
  let r = Math.random() * options.reduce((s, o) => s + o.weight, 0);
  const chosen = options.find((o) => (r -= o.weight) <= 0) ?? options[options.length - 1];

  const skillId = chosen.choice!.id;
  const difficulty = p(skillId) < 0.4 ? 1 : p(skillId) < 0.75 ? 2 : 3;
  const item = await pickItem(supabase, studentId, skillId, { difficulty });
  if (!item) {
    // No approved questions for that skill yet: try the others in order
    for (const o of options) {
      const alt = o.choice && o.choice.id !== skillId ? await pickItem(supabase, studentId, o.choice.id, { difficulty: 2 }) : null;
      if (alt) return { question: toPublic(alt), phase: o.phase, reason: o.choice!.reason };
    }
    return { error: "Your teacher is still getting questions ready. Check back soon." };
  }
  return { question: toPublic(item), phase: chosen.phase, reason: chosen.choice!.reason };
}

export interface PracticeFeedback {
  correct: boolean;
  correct_answer: string;
  explanation: string;
  mini_lesson: { name: string; text: string } | null;
  status: SkillStatus;
  p_before: number;
  p_after: number;
  just_mastered: boolean;
}

/** Checks a practice answer, updates mastery and review schedule, and returns feedback. */
export async function answerPractice(
  studentId: string, itemId: string, response: string, phase: "practice" | "review", seconds: unknown,
): Promise<PracticeFeedback | { error: string }> {
  const supabase = getAdminClient();
  if (!(await questGradeFor(supabase, studentId))) return { error: "Math Quest is for students in grades 6–8." };
  const item = await getItem(supabase, itemId);
  if (!item) return { error: "Question not found" };
  const classId = await currentClassId(supabase, studentId);

  const { correct, misconception } = checkAnswer(item, response);
  await recordAttempt(supabase, {
    student_id: studentId, class_id: classId, item, phase, correct, response, misconception, seconds: clampSeconds(seconds),
  });

  const { data: row } = await supabase.from("quest_mastery").select("*").eq("student_id", studentId).eq("skill_id", item.skill_id).maybeSingle();
  const before = (row as MasteryRow | null) ?? { skill_id: item.skill_id, p_known: 0.3, attempts: 0, correct: 0, streak: 0, review_step: 0, next_review: null, mastered_at: null };
  const pAfter = updatePKnown(before.p_known, correct, item.kind);
  const attempts = before.attempts + 1;
  const now = new Date();

  let { mastered_at, review_step, next_review } = before;
  let justMastered = false;
  if (!mastered_at && pAfter >= MASTERED_AT && attempts >= MIN_ATTEMPTS_FOR_MASTERY) {
    mastered_at = now.toISOString();
    review_step = 0;
    next_review = nextReviewDate(0, now).toISOString();
    justMastered = true;
  } else if (mastered_at && phase === "review") {
    if (correct) {
      review_step = before.review_step + 1;
      next_review = nextReviewDate(review_step, now).toISOString();
    } else {
      review_step = 0;
      next_review = nextReviewDate(0, now).toISOString();
      if (pAfter < 0.8) mastered_at = null; // slipped: back into regular practice
    }
  }

  await supabase.from("quest_mastery").upsert({
    student_id: studentId, skill_id: item.skill_id, p_known: pAfter, attempts, correct: before.correct + (correct ? 1 : 0),
    streak: correct ? before.streak + 1 : 0, review_step, next_review, mastered_at,
    last_practiced: now.toISOString(), updated_at: now.toISOString(),
  }, { onConflict: "student_id,skill_id" });

  const correctText = item.kind === "multiple_choice" ? (item.choices as QuestChoice[]).find((c) => c.correct)?.text ?? item.answer : item.answer;
  const m = misconception ? MISCONCEPTIONS_BY_ID[misconception] : null;
  return {
    correct,
    correct_answer: correctText,
    explanation: item.explanation,
    mini_lesson: m && m.id !== "computation-slip" ? { name: m.name, text: m.miniLesson } : null,
    status: statusOf(pAfter, attempts),
    p_before: before.p_known,
    p_after: pAfter,
    just_mastered: justMastered,
  };
}

// ---------- Student overview ----------

export async function studentOverview(studentId: string) {
  const supabase = getAdminClient();
  const grade = await questGradeFor(supabase, studentId);
  if (!grade) return { eligible: false as const };
  const classId = await currentClassId(supabase, studentId);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

  const [{ data: assessments }, { data: mastery }, { data: today }, { data: focus }] = await Promise.all([
    supabase.from("quest_assessments").select("id, kind, status, results, completed_at").eq("student_id", studentId).order("started_at", { ascending: false }),
    supabase.from("quest_mastery").select("skill_id, p_known, attempts, mastered_at").eq("student_id", studentId),
    supabase.from("quest_attempts").select("correct, seconds").eq("student_id", studentId).in("phase", ["practice", "review"]).gte("created_at", startOfDay.toISOString()),
    classId ? supabase.from("quest_class_focus").select("skill_ids, post_check_open").eq("class_id", classId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const latest = (kind: string) => (assessments ?? []).find((a) => a.kind === kind) ?? null;
  const masteryById = new Map((mastery ?? []).map((m) => [m.skill_id, m]));
  const relevant: Skill[] = SKILLS.filter((s) => s.grade === grade || masteryById.has(s.id));

  return {
    eligible: true as const,
    grade,
    diagnostic: latest("diagnostic") ? { status: latest("diagnostic")!.status, results: latest("diagnostic")!.results } : null,
    post: latest("post") ? { status: latest("post")!.status, results: latest("post")!.results } : null,
    post_check_open: !!(focus as { post_check_open?: boolean } | null)?.post_check_open,
    today: {
      answered: (today ?? []).length,
      correct: (today ?? []).filter((t) => t.correct).length,
      minutes: Math.round((today ?? []).reduce((s, t) => s + (t.seconds ?? 0), 0) / 60),
      goal: DAILY_GOAL,
    },
    skills: relevant.map((s) => {
      const m = masteryById.get(s.id);
      return {
        id: s.id, name: s.name, grade: s.grade, strand: s.strand,
        status: m?.mastered_at ? "mastered" : statusOf(m?.p_known, m?.attempts ?? 0),
        p_known: m?.p_known ?? null,
      };
    }),
  };
}
