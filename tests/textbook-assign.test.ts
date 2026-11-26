import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanAssignments,
  dueLabel,
  isOverdue,
  MAX_ASSIGNED_LESSONS,
} from "../src/lib/textbook-assign";
import { SKILLS } from "../src/lib/quest/skills";

test("cleanAssignments returns null when value is not an array", () => {
  assert.equal(cleanAssignments("6.long-division"), null);
  assert.equal(cleanAssignments(undefined), null);
  assert.equal(cleanAssignments({ skill_id: "6.long-division" }), null);
});

test("cleanAssignments drops non-objects, unknown skills, and non-string skill_id", () => {
  const result = cleanAssignments([
    null,
    42,
    "6.long-division",
    { skill_id: "fake.skill", due: null, assigned_at: "2026-10-01T00:00:00.000Z" },
    { skill_id: 123, due: null, assigned_at: "2026-10-01T00:00:00.000Z" },
    { skill_id: "6.long-division", due: null, assigned_at: "2026-10-01T00:00:00.000Z" },
  ]);

  assert.equal(result?.length, 1);
  assert.equal(result?.[0].skill_id, "6.long-division");
});

test("cleanAssignments keeps only the first entry for a duplicated skill_id", () => {
  const result = cleanAssignments([
    { skill_id: "6.long-division", due: "2026-11-30", assigned_at: "2026-10-01T00:00:00.000Z" },
    { skill_id: "6.ratios", due: null, assigned_at: "2026-10-02T00:00:00.000Z" },
    { skill_id: "6.long-division", due: "2026-12-15", assigned_at: "2026-10-03T00:00:00.000Z" },
  ]);

  assert.deepEqual(result, [
    { skill_id: "6.long-division", due: "2026-11-30", assigned_at: "2026-10-01T00:00:00.000Z" },
    { skill_id: "6.ratios", due: null, assigned_at: "2026-10-02T00:00:00.000Z" },
  ]);
});

test("cleanAssignments keeps valid due dates and turns invalid ones into null", () => {
  const result = cleanAssignments([
    { skill_id: "6.long-division", due: "2026-11-30", assigned_at: "2026-10-01T00:00:00.000Z" },
    { skill_id: "6.ratios", due: "not-a-date", assigned_at: "2026-10-01T00:00:00.000Z" },
    { skill_id: "6.decimal-operations", due: "11/30/2026", assigned_at: "2026-10-01T00:00:00.000Z" },
    { skill_id: "6.divide-fractions", due: 5, assigned_at: "2026-10-01T00:00:00.000Z" },
  ]);

  assert.equal(result?.[0].due, "2026-11-30");
  assert.equal(result?.[1].due, null);
  assert.equal(result?.[2].due, null);
  assert.equal(result?.[3].due, null);
});

test("cleanAssignments keeps valid assigned_at and fills missing or invalid ones with an ISO date", () => {
  const validAt = "2026-10-01T12:00:00.000Z";
  const result = cleanAssignments([
    { skill_id: "6.long-division", due: null, assigned_at: validAt },
    { skill_id: "6.ratios", due: null },
    { skill_id: "6.decimal-operations", due: null, assigned_at: "not-a-timestamp" },
  ]);

  assert.equal(result?.[0].assigned_at, validAt);
  for (const idx of [1, 2]) {
    const ts = result?.[idx].assigned_at ?? "";
    assert.ok(!Number.isNaN(Date.parse(ts)));
    assert.match(ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  }
});

test("cleanAssignments caps the list at MAX_ASSIGNED_LESSONS", () => {
  assert.ok(SKILLS.length >= MAX_ASSIGNED_LESSONS + 10);
  const many = SKILLS.slice(0, MAX_ASSIGNED_LESSONS + 10).map((s) => ({
    skill_id: s.id,
    due: null,
    assigned_at: "2026-10-01T00:00:00.000Z",
  }));

  const result = cleanAssignments(many);
  assert.equal(result?.length, MAX_ASSIGNED_LESSONS);
});

test("dueLabel returns null for null and formats a valid date starting with Due and containing the day", () => {
  assert.equal(dueLabel(null), null);
  const label = dueLabel("2026-11-30");
  assert.ok(label !== null);
  assert.ok(label.startsWith("Due "));
  assert.ok(label.includes("30"));
});

test("isOverdue treats null, future dates, and today as on time, and past dates as overdue", () => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  assert.equal(isOverdue(null), false);
  assert.equal(isOverdue("2000-01-01"), true);
  assert.equal(isOverdue("2099-01-01"), false);
  assert.equal(isOverdue(today), false);
});
