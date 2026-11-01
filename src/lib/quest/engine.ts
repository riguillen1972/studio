// Server-only: the Math Quest engine — diagnostic, post-check, and daily practice.
// Students only ever get approved questions. All progress is stored per student and skill.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/usage";
import { SKILLS, SKILLS_BY_ID, SKILL_CODES, diagnosticOrder, prerequisiteChain, sectionOf } from "./skills";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { badgesFor, dayStart, localDayKey, newBadges, streakFrom, weekStart, type Badge, type ProgressStats } from "./progress";
import { strengthsAndFocus, topicScores } from "./reports";
import { checkAnswer, type QuestChoice, type QuestItem } from "./answers";
import {
  MASTERED_AT, MIN_ATTEMPTS_FOR_MASTERY, diagnosticPrior, nextReviewDate, scoreOf, statusOf, updatePKnown, type SkillStatus,
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
    // Start with the teacher's focus skills, then this grade's skills taking turns across strands;
    // misses lead back to the skills they build on
    const { data: focusRow } = classId
      ? await supabase.from("quest_class_focus").select("skill_ids").eq("class_id", classId).maybeSingle()
      : { data: null };
    queue = diagnosticOrder(grade, (focusRow?.skill_ids as string[] | undefined) ?? []);
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
    ...SKILLS.filter((s) => s.grade === state.grade && !s.advanced).map((s) => s.id),
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

  // No focus set: the grade's core skills, plus challenge skills once their foundations are mastered
  const focusIds: string[] = ((focusRow as { skill_ids?: string[] } | null)?.skill_ids?.length
    ? (focusRow as { skill_ids: string[] }).skill_ids
    : SKILLS.filter((s) => s.grade === grade && (!s.advanced || s.prereqs.every(isMastered))).map((s) => s.id));

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

/**
 * Practice one skill the student picked from the skill list (any grade). Questions get harder as
 * the score rises, and the question just answered isn't repeated right away.
 */
export async function nextSkillPractice(studentId: string, skillId: string, lastItemId?: string | null): Promise<PracticeQuestion | { error: string }> {
  const supabase = getAdminClient();
  if (!(await questGradeFor(supabase, studentId))) return { error: "Math Quest is for students in grades 6–8." };
  const skill = SKILLS_BY_ID[skillId];
  if (!skill) return { error: "Skill not found" };
  const { data: row } = await supabase.from("quest_mastery").select("p_known").eq("student_id", studentId).eq("skill_id", skillId).maybeSingle();
  const p = (row as { p_known: number } | null)?.p_known ?? 0.3;
  const difficulty = p < 0.4 ? 1 : p < 0.75 ? 2 : 3;
  const item = (lastItemId ? await pickItem(supabase, studentId, skillId, { difficulty, exclude: new Set([lastItemId]) }) : null)
    ?? await pickItem(supabase, studentId, skillId, { difficulty });
  if (!item) return { error: "Questions for this skill aren't ready yet. Try another skill, or ask your teacher." };
  return { question: toPublic(item), phase: "practice", reason: "" };
}

export interface PracticeFeedback {
  correct: boolean;
  correct_answer: string;
  explanation: string;
  mini_lesson: { name: string; text: string } | null;
  status: SkillStatus;
  p_before: number;
  p_after: number;
  score_before: number;
  score_after: number;
  just_mastered: boolean;
  /** Badges this answer earned, to celebrate. */
  new_badges: Badge[];
  streak: number;
}

/** Checks a practice answer, updates mastery and review schedule, and returns feedback. */
export async function answerPractice(
  studentId: string, itemId: string, response: string, phase: "practice" | "review", seconds: unknown, tzOffset = 0,
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

  // What this answer changed for streaks and badges
  const { stats, times } = await progressStats(supabase, studentId, tzOffset);
  const mastered = new Set(stats.mastered);
  if (justMastered) mastered.delete(item.skill_id);
  const statsBefore: ProgressStats = { ...stats, answered: stats.answered - 1, streak: streakFrom(times.slice(1), tzOffset), mastered };

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
    score_before: row ? scoreOf(before.p_known, before.attempts, before.mastered_at) : 0,
    score_after: scoreOf(pAfter, attempts, mastered_at),
    just_mastered: justMastered,
    new_badges: newBadges(statsBefore, stats),
    streak: stats.streak,
  };
}

// ---------- Student overview ----------

export async function studentOverview(studentId: string, tzOffset = 0) {
  const supabase = getAdminClient();
  const grade = await questGradeFor(supabase, studentId);
  if (!grade) return { eligible: false as const };
  const classId = await currentClassId(supabase, studentId);
  const startOfDay = new Date(dayStart(tzOffset));
  const monday = weekStart(tzOffset);

  const [{ data: assessments }, { data: mastery }, { data: today }, { data: focus }, { data: approved }, progress, classDone] = await Promise.all([
    supabase.from("quest_assessments").select("id, kind, status, results, completed_at").eq("student_id", studentId).order("started_at", { ascending: false }),
    supabase.from("quest_mastery").select("skill_id, p_known, attempts, mastered_at").eq("student_id", studentId),
    supabase.from("quest_attempts").select("correct, seconds").eq("student_id", studentId).in("phase", ["practice", "review"]).gte("created_at", startOfDay.toISOString()),
    classId ? supabase.from("quest_class_focus").select("skill_ids, post_check_open, weekly_goal").eq("class_id", classId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("quest_items").select("skill_id").eq("status", "approved"),
    progressStats(supabase, studentId, tzOffset),
    classId ? classQuestionsSince(supabase, classId, monday) : Promise.resolve(0),
  ]);
  const weeklyGoal = (focus as { weekly_goal?: number | null } | null)?.weekly_goal ?? null;
  const ready = new Set((approved ?? []).map((a) => a.skill_id));
  const latest = (kind: string) => (assessments ?? []).find((a) => a.kind === kind) ?? null;
  const masteryById = new Map((mastery ?? []).map((m) => [m.skill_id, m]));

  return {
    eligible: true as const,
    grade,
    diagnostic: latest("diagnostic") ? { status: latest("diagnostic")!.status, results: latest("diagnostic")!.results } : null,
    post: latest("post") ? { status: latest("post")!.status, results: latest("post")!.results } : null,
    post_check_open: !!(focus as { post_check_open?: boolean } | null)?.post_check_open,
    progress: {
      streak: progress.stats.streak,
      answered: progress.stats.answered,
      // Milestones, plus topic badges for Foundations and the student's grade (and any earned elsewhere)
      badges: badgesFor(progress.stats).filter((b) => b.kind === "milestone" || b.earned || b.section === grade || (b.section ?? 0) <= 5),
      week_questions: progress.times.filter((t) => t >= monday).length,
      week_mastered: (mastery ?? []).filter((m) => m.mastered_at && m.mastered_at >= monday).length,
    },
    class_goal: classId && weeklyGoal ? { goal: weeklyGoal, done: classDone } : null,
    today: {
      answered: (today ?? []).length,
      correct: (today ?? []).filter((t) => t.correct).length,
      minutes: Math.round((today ?? []).reduce((s, t) => s + (t.seconds ?? 0), 0) / 60),
      goal: DAILY_GOAL,
    },
    // Every skill, so students can browse other grades too
    skills: SKILLS.map((s) => {
      const m = masteryById.get(s.id);
      return {
        id: s.id, code: SKILL_CODES[s.id], name: s.name, grade: s.grade, section: sectionOf(s), strand: s.strand, nad: s.nad, advanced: !!s.advanced,
        status: m?.mastered_at ? "mastered" : statusOf(m?.p_known, m?.attempts ?? 0),
        score: scoreOf(m?.p_known, m?.attempts ?? 0, m?.mastered_at ?? null),
        practiced: (m?.attempts ?? 0) > 0,
        ready: ready.has(s.id),
      };
    }),
  };
}

// ---------- Streaks, badges, goals and certificates ----------

/** Everything badges and streaks are computed from, plus recent practice times (newest first). */
async function progressStats(supabase: SupabaseClient, studentId: string, tzOffset: number): Promise<{ stats: ProgressStats; times: string[] }> {
  const since = new Date(Date.now() - 120 * 86_400_000).toISOString();
  const [{ count }, { data: recent }, { data: mastered }, { data: diagnostic }] = await Promise.all([
    supabase.from("quest_attempts").select("id", { count: "exact", head: true }).eq("student_id", studentId).in("phase", ["practice", "review"]),
    supabase.from("quest_attempts").select("created_at").eq("student_id", studentId).in("phase", ["practice", "review"])
      .gte("created_at", since).order("created_at", { ascending: false }).limit(1000),
    supabase.from("quest_mastery").select("skill_id").eq("student_id", studentId).not("mastered_at", "is", null),
    supabase.from("quest_assessments").select("results").eq("student_id", studentId).eq("kind", "diagnostic").eq("status", "completed")
      .order("completed_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const times = (recent ?? []).map((r) => r.created_at as string);
  return {
    times,
    stats: {
      answered: count ?? 0,
      streak: streakFrom(times, tzOffset),
      mastered: new Set((mastered ?? []).map((m) => m.skill_id)),
      diagnosticGaps: new Set(((diagnostic?.results as { gaps?: string[] } | null)?.gaps) ?? []),
    },
  };
}

/** Practice questions the whole class has answered since a time (for the weekly class goal). */
export async function classQuestionsSince(supabase: SupabaseClient, classId: string, since: string): Promise<number> {
  const { count } = await supabase.from("quest_attempts").select("id", { count: "exact", head: true })
    .eq("class_id", classId).in("phase", ["practice", "review"]).gte("created_at", since);
  return count ?? 0;
}

export interface Certificate {
  student_id: string; name: string; grade: number | null;
  week_questions: number; week_mastered: string[]; streak: number; badges: number;
}

/** This week's achievements for certificates, one per student. */
export async function certificatesFor(studentIds: string[], tzOffset = 0): Promise<Certificate[]> {
  if (studentIds.length === 0) return [];
  const supabase = getAdminClient();
  const monday = weekStart(tzOffset);
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, grade_level").in("id", studentIds);
  const certificates = await Promise.all((profiles ?? []).map(async (p) => {
    const [{ stats, times }, { data: masteredRows }] = await Promise.all([
      progressStats(supabase, p.id, tzOffset),
      supabase.from("quest_mastery").select("skill_id").eq("student_id", p.id).gte("mastered_at", monday),
    ]);
    return {
      student_id: p.id,
      name: p.display_name || "Student",
      grade: p.grade_level ? Number(p.grade_level) : null,
      week_questions: times.filter((t) => t >= monday).length,
      week_mastered: (masteredRows ?? []).map((m) => SKILLS_BY_ID[m.skill_id]?.name).filter((n): n is string => !!n),
      streak: stats.streak,
      badges: badgesFor(stats).filter((b) => b.earned).length,
    };
  }));
  return certificates.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------- Teacher reports ----------

/** Everything about one student's Math Quest work, for the teacher's detail view and parent summaries. */
export async function studentReport(studentId: string, tzOffset = 0) {
  const supabase = getAdminClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [{ data: profile }, { data: mastery }, { data: attempts }, { data: diagnostic }, progress] = await Promise.all([
    supabase.from("profiles").select("id, display_name, grade_level").eq("id", studentId).maybeSingle(),
    supabase.from("quest_mastery").select("skill_id, p_known, attempts, mastered_at, last_practiced").eq("student_id", studentId),
    supabase.from("quest_attempts").select("skill_id, phase, correct, misconception, seconds, created_at")
      .eq("student_id", studentId).gte("created_at", since).order("created_at", { ascending: false }).limit(1000),
    supabase.from("quest_assessments").select("results, completed_at").eq("student_id", studentId).eq("kind", "diagnostic").eq("status", "completed")
      .order("completed_at", { ascending: false }).limit(1).maybeSingle(),
    progressStats(supabase, studentId, tzOffset),
  ]);
  const rows = (mastery ?? []) as { skill_id: string; p_known: number; attempts: number; mastered_at: string | null; last_practiced: string | null }[];
  const practice = (attempts ?? []).filter((a) => a.phase === "practice" || a.phase === "review");
  const topics = topicScores(rows);

  // Questions per day for the last 14 days, oldest first
  const days: { date: string; questions: number; correct: number; minutes: number }[] = [];
  for (let i = 13; i >= 0; i--) days.push({ date: localDayKey(Date.now() - i * 86_400_000, tzOffset), questions: 0, correct: 0, minutes: 0 });
  const dayIndex = new Map(days.map((d, i) => [d.date, i]));
  for (const a of practice) {
    const i = dayIndex.get(localDayKey(a.created_at, tzOffset));
    if (i === undefined) continue;
    days[i].questions++;
    if (a.correct) days[i].correct++;
    days[i].minutes += (a.seconds ?? 0) / 60;
  }
  days.forEach((d) => { d.minutes = Math.round(d.minutes); });

  const mistakeCounts = new Map<string, number>();
  for (const a of attempts ?? []) {
    if (a.misconception && a.misconception !== "computation-slip") mistakeCounts.set(a.misconception, (mistakeCounts.get(a.misconception) ?? 0) + 1);
  }

  return {
    student: { id: studentId, name: profile?.display_name || "Student", grade: profile?.grade_level ? Number(profile.grade_level) : null },
    totals: {
      questions_30d: practice.length,
      accuracy_30d: practice.length ? Math.round((practice.filter((a) => a.correct).length / practice.length) * 100) : null,
      minutes_30d: Math.round(practice.reduce((t, a) => t + (a.seconds ?? 0), 0) / 60),
      mastered: rows.filter((r) => r.mastered_at).length,
      streak: progress.stats.streak,
    },
    badges: badgesFor(progress.stats).filter((b) => b.earned).map((b) => b.name),
    diagnostic: diagnostic ? {
      completed_at: diagnostic.completed_at,
      gaps: ((diagnostic.results as { gaps?: string[] }).gaps ?? []).map((g) => SKILLS_BY_ID[g]?.name ?? g),
    } : null,
    topics,
    ...strengthsAndFocus(topics),
    skills: rows
      .filter((r) => SKILLS_BY_ID[r.skill_id])
      .map((r) => ({
        id: r.skill_id, code: SKILL_CODES[r.skill_id], name: SKILLS_BY_ID[r.skill_id].name, section: sectionOf(SKILLS_BY_ID[r.skill_id]),
        score: scoreOf(r.p_known, r.attempts, r.mastered_at), attempts: r.attempts, mastered: !!r.mastered_at, last_practiced: r.last_practiced,
      }))
      .sort((a, b) => a.section - b.section || a.code.localeCompare(b.code, undefined, { numeric: true })),
    mistakes: [...mistakeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, count]) => ({ id, name: MISCONCEPTIONS_BY_ID[id]?.name ?? id, count })),
    activity: days,
    recent: practice.slice(0, 15).map((a) => ({ skill: SKILLS_BY_ID[a.skill_id]?.name ?? a.skill_id, correct: a.correct, at: a.created_at })),
  };
}

export type StudentReport = Awaited<ReturnType<typeof studentReport>>;
