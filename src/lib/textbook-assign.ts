// Textbook lessons a teacher assigns to a class. Stored in classes.settings.assigned_lessons.

import { SKILLS_BY_ID } from "./quest/skills";

export interface AssignedLesson {
  skill_id: string;
  /** Due date as YYYY-MM-DD, or null for no due date. */
  due: string | null;
  assigned_at: string;
}

export const MAX_ASSIGNED_LESSONS = 300;

/** Keeps only valid assignments (known lessons, real dates), one per lesson. */
export function cleanAssignments(value: unknown): AssignedLesson[] | null {
  if (!Array.isArray(value)) return null;
  const seen = new Set<string>();
  const out: AssignedLesson[] = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const { skill_id, due, assigned_at } = v as Record<string, unknown>;
    if (typeof skill_id !== "string" || !SKILLS_BY_ID[skill_id] || seen.has(skill_id)) continue;
    const dueOk = typeof due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(due) && !Number.isNaN(Date.parse(due));
    seen.add(skill_id);
    out.push({
      skill_id,
      due: dueOk ? (due as string) : null,
      assigned_at: typeof assigned_at === "string" && !Number.isNaN(Date.parse(assigned_at)) ? assigned_at : new Date().toISOString(),
    });
  }
  return out.slice(0, MAX_ASSIGNED_LESSONS);
}

/** "Due Nov 30" style label (dates are shown in the viewer's own calendar, not shifted by time zone). */
export function dueLabel(due: string | null): string | null {
  if (!due) return null;
  const [y, m, d] = due.split("-").map(Number);
  return `Due ${new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/** True when the due date has passed (the due day itself still counts as on time). */
export function isOverdue(due: string | null): boolean {
  if (!due) return false;
  const [y, m, d] = due.split("-").map(Number);
  return new Date(y, m - 1, d + 1).getTime() <= Date.now();
}
