// Motivation layer for Math Quest: streaks, badges and weekly windows. Pure functions over data the
// engine already stores (attempt times, mastered skills), so nothing extra has to be kept in sync.

import { SKILLS_BY_ID, TOPICS_BY_SECTION } from "./skills";

/** Practice answers in a day for it to count toward a streak. */
export const STREAK_MIN_ANSWERS = 5;

/** A day key (YYYY-MM-DD) in the student's local time. `tzOffset` is Date#getTimezoneOffset() minutes. */
export const localDayKey = (time: string | number | Date, tzOffset: number) =>
  new Date(new Date(time).getTime() - tzOffset * 60_000).toISOString().slice(0, 10);

const previousDay = (key: string) => new Date(Date.parse(`${key}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const isWeekend = (key: string) => [0, 6].includes(new Date(`${key}T00:00:00Z`).getUTCDay());

/**
 * Consecutive practice days up to today. Weekends (including Sabbath) never break a streak but
 * count when a student practices, and today doesn't break it before the student has practiced.
 */
export function streakFrom(attemptTimes: string[], tzOffset: number, now = new Date()): number {
  const perDay = new Map<string, number>();
  for (const t of attemptTimes) {
    const key = localDayKey(t, tzOffset);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const practiced = (key: string) => (perDay.get(key) ?? 0) >= STREAK_MIN_ANSWERS;
  let day = localDayKey(now, tzOffset);
  if (!practiced(day)) day = previousDay(day);
  let streak = 0;
  for (let i = 0; i < 366; i++, day = previousDay(day)) {
    if (practiced(day)) streak++;
    else if (!isWeekend(day)) break;
  }
  return streak;
}

/** Start of the student's local week (Monday 00:00) as an ISO timestamp. */
export function weekStart(tzOffset: number, now = new Date()): string {
  let key = localDayKey(now, tzOffset);
  while (new Date(`${key}T00:00:00Z`).getUTCDay() !== 1) key = previousDay(key);
  return new Date(Date.parse(`${key}T00:00:00Z`) + tzOffset * 60_000).toISOString();
}

export interface ProgressStats {
  answered: number;
  streak: number;
  mastered: Set<string>;
  /** Skills the diagnostic marked as gaps. */
  diagnosticGaps: Set<string>;
}

export interface Badge { id: string; name: string; description: string; icon: string }

const MILESTONES: (Badge & { earned: (s: ProgressStats) => boolean })[] = [
  { id: "first-steps", name: "First steps", description: "Answer 10 practice questions", icon: "footprints", earned: (s) => s.answered >= 10 },
  { id: "century", name: "Century", description: "Answer 100 practice questions", icon: "hundred", earned: (s) => s.answered >= 100 },
  { id: "marathon", name: "Marathon", description: "Answer 500 practice questions", icon: "route", earned: (s) => s.answered >= 500 },
  { id: "spark", name: "Spark", description: "Practice 3 days in a row", icon: "flame", earned: (s) => s.streak >= 3 },
  { id: "steady", name: "Steady", description: "Practice 5 days in a row", icon: "flame", earned: (s) => s.streak >= 5 },
  { id: "unstoppable", name: "Unstoppable", description: "Practice 10 days in a row", icon: "flame", earned: (s) => s.streak >= 10 },
  { id: "faithful", name: "Faithful", description: "Practice 20 days in a row", icon: "heart", earned: (s) => s.streak >= 20 },
  { id: "first-mastery", name: "First mastery", description: "Master your first skill", icon: "check", earned: (s) => s.mastered.size >= 1 },
  { id: "skill-builder", name: "Skill builder", description: "Master 10 skills", icon: "blocks", earned: (s) => s.mastered.size >= 10 },
  { id: "skill-master", name: "Skill master", description: "Master 25 skills", icon: "trophy", earned: (s) => s.mastered.size >= 25 },
  { id: "explorer", name: "Math explorer", description: "Master 50 skills", icon: "compass", earned: (s) => s.mastered.size >= 50 },
  { id: "gap-closer", name: "Gap closer", description: "Master a skill the diagnostic found as a weak spot", icon: "bridge",
    earned: (s) => [...s.diagnosticGaps].some((id) => s.mastered.has(id)) },
  { id: "challenger", name: "Challenger", description: "Master a ★ challenge skill", icon: "star",
    earned: (s) => [...s.mastered].some((id) => SKILLS_BY_ID[id]?.advanced) },
];

/** One badge per topic: master every core (non-challenge) skill in it. */
const TOPIC_BADGES = Object.entries(TOPICS_BY_SECTION).flatMap(([section, topics]) => topics.map((t) => {
  const core = t.skillIds.filter((id) => !SKILLS_BY_ID[id]?.advanced);
  const where = Number(section) <= 5 ? "Foundations" : `Grade ${section}`;
  return {
    id: `topic:${section}:${t.letter}`, name: t.title, description: `${where}, topic ${t.letter}: master all ${core.length} core skills`,
    icon: "medal", section: Number(section), earned: (s: ProgressStats) => core.length > 0 && core.every((id) => s.mastered.has(id)),
  };
}));

export interface BadgeStatus extends Badge { earned: boolean; kind: "milestone" | "topic"; section?: number }

export function badgesFor(stats: ProgressStats): BadgeStatus[] {
  return [
    ...MILESTONES.map(({ earned, ...b }) => ({ ...b, kind: "milestone" as const, earned: earned(stats) })),
    ...TOPIC_BADGES.map(({ earned, ...b }) => ({ ...b, kind: "topic" as const, earned: earned(stats) })),
  ];
}

/** Badges earned in `after` that weren't earned in `before`. */
export function newBadges(before: ProgressStats, after: ProgressStats): Badge[] {
  const had = new Set(badgesFor(before).filter((b) => b.earned).map((b) => b.id));
  return badgesFor(after).filter((b) => b.earned && !had.has(b.id)).map(({ id, name, description, icon }) => ({ id, name, description, icon }));
}

/** Start of the student's local day as an ISO timestamp. */
export const dayStart = (tzOffset: number, now = new Date()) =>
  new Date(Date.parse(`${localDayKey(now, tzOffset)}T00:00:00Z`) + tzOffset * 60_000).toISOString();

/** Reads a timezone offset sent by the browser, in minutes (Date#getTimezoneOffset); 0 if missing or invalid. */
export const parseTzOffset = (value: unknown) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : 0;
};
