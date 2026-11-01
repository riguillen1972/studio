// Placement: from a diagnostic's answers, the grade level a student is working at in each strand
// (like "grade 6 in fractions, grade 8 in geometry"). Pure functions over the stored diagnostic
// results, so older diagnostics get a placement too and check-ins can be compared for growth.

import { SKILLS, SKILLS_BY_ID, STRAND_NAMES, STRAND_ORDER, prerequisiteChain, type Skill, type Strand } from "./skills";

export type DiagnosticResult = "correct" | "wrong" | "inferred_known" | "inferred_unsure";

/**
 * Placement levels: 4 = below grade 5 (foundations not secure yet), 5 = grade 5 (foundations),
 * 6–8 = that grade, 9 = above grade 8 (grade 8 challenge skills).
 */
export const LOWEST_LEVEL = 4;
export const HIGHEST_LEVEL = 9;

/** The level a skill measures. */
export const levelOf = (skill: Skill) => (skill.grade <= 5 ? 5 : skill.grade === 8 && skill.advanced ? 9 : skill.grade);

export interface StrandPlacement {
  strand: Strand; name: string; level: number | null; questions: number;
  /** Answered the strand's last level right (for example, fractions end at grade 6). */
  completed?: boolean;
}
export interface Placement {
  strands: StrandPlacement[];
  /** Middle of the strand levels: the headline placement. */
  overall: number | null;
  /** Average strand level, to one decimal: what growth between check-ins is measured on. */
  average: number | null;
}

/** The highest level a strand has skills for. */
export const strandTop = (strand: Strand) =>
  Math.max(...SKILLS.filter((s) => s.strand === strand && (levelOf(s) === HIGHEST_LEVEL ? true : !s.advanced)).map(levelOf));

/**
 * Per strand, the highest level where the student answered a question directly and got at least
 * half of that level's skills (asked or implied by a harder correct answer) right. A strand that
 * ends below the student's grade and is completed counts as on grade level.
 */
export function placementFrom(skills: { skill_id: string; result: DiagnosticResult }[], grade: number): Placement {
  const strands = STRAND_ORDER.map((strand): StrandPlacement => {
    const rows = skills.filter((s) => SKILLS_BY_ID[s.skill_id]?.strand === strand && s.result !== "inferred_unsure");
    const atLevel = (level: number) => rows.filter((s) => levelOf(SKILLS_BY_ID[s.skill_id]) === level);
    const direct = rows.filter((s) => s.result === "correct" || s.result === "wrong");
    let level: number | null = null;
    for (let l = HIGHEST_LEVEL; l >= 5 && level === null; l--) {
      const here = atLevel(l);
      const known = here.filter((s) => s.result === "correct" || s.result === "inferred_known").length;
      if (here.some((s) => s.result === "correct" || s.result === "wrong") && known / here.length >= 0.5) level = l;
    }
    // Nothing known: one level below the lowest miss (below grade 5 at the bottom)
    if (level === null && direct.length) {
      const missed = direct.map((s) => levelOf(SKILLS_BY_ID[s.skill_id]));
      level = Math.max(LOWEST_LEVEL, Math.min(...missed) - 1);
    }
    const completed = level !== null && level === strandTop(strand);
    if (completed && level! < grade) level = grade;
    return { strand, name: STRAND_NAMES[strand], level, questions: direct.length, ...(completed ? { completed } : {}) };
  });
  return summarize(strands);
}

function summarize(strands: StrandPlacement[]): Placement {
  const levels = strands.map((s) => s.level).filter((l): l is number => l !== null).sort((a, b) => a - b);
  return {
    strands,
    overall: levels.length ? levels[Math.floor((levels.length - 1) / 2)] : null,
    average: levels.length ? Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10 : null,
  };
}

// ---------- Level search (how the diagnostic finds each strand's level) ----------

/** Per strand: highest level answered right, lowest level missed, and the level to ask next (null = done). */
export interface StrandSearch {
  lo: number | null; hi: number | null; target: number | null; dir: 1 | -1;
  /** Right and wrong answers at the student's own grade, decided best of three. */
  hits: number; misses: number;
  asked: number;
}

/** Core skills at a level in a strand (challenge skills only for "above grade 8"), deepest first. */
export function levelSkills(strand: Strand, level: number): string[] {
  return SKILLS.filter((s) => s.strand === strand && levelOf(s) === level && (level === HIGHEST_LEVEL || !s.advanced))
    .sort((a, b) => prerequisiteChain(b.id).length - prerequisiteChain(a.id).length).map((s) => s.id);
}

/** Every strand starts at the student's grade, or the nearest level that has skills in that strand. */
export function initSearch(grade: number): Record<Strand, StrandSearch> {
  return Object.fromEntries(STRAND_ORDER.map((strand) => {
    const start = [grade, grade - 1, grade + 1, grade - 2, grade + 2].find((l) => l >= 5 && l <= HIGHEST_LEVEL && levelSkills(strand, l).length);
    return [strand, { lo: null, hi: null, target: start ?? null, dir: 1, hits: 0, misses: 0, asked: 0 }];
  })) as Record<Strand, StrandSearch>;
}

/** Moves the target past levels with no askable skill, in the search direction. Mutates. */
export function skipLevel(search: StrandSearch) {
  if (search.target === null) return;
  const next = search.target + search.dir;
  search.target = next < 5 || next > HIGHEST_LEVEL || (search.hi !== null && next >= search.hi) || (search.lo !== null && next <= search.lo) ? null : next;
}

/**
 * Records an answer at `level`. Right: try a level up. Wrong: try a level down. Whether the
 * student is at their own grade is decided best of three, so one slip or lucky guess can't move
 * them off grade: a miss there gets a second question, and so does a single right answer that the
 * search would otherwise stop on. Mutates.
 */
export function updateSearch(search: StrandSearch, grade: number, level: number, correct: boolean) {
  search.asked++;
  if (level === grade) {
    if (correct) search.hits++;
    else search.misses++;
    const decided = search.hits >= 2 || search.misses >= 2;
    if (!decided && search.misses > 0) {
      search.target = grade; // ask again at this level
      search.dir = correct ? 1 : -1;
      return;
    }
    if (decided) {
      correct = search.hits >= 2;
      if (!correct) search.lo = null; // a single earlier hit was the lucky one
    }
  } else if (!correct && level === grade + 1 && search.lo === grade && search.hits === 1 && search.misses === 0) {
    // Stopping just above grade on one right answer at grade: confirm it first
    search.hi = level;
    search.target = grade;
    return;
  }
  if (correct) {
    search.lo = Math.max(search.lo ?? level, level);
    search.dir = 1;
  } else {
    search.hi = Math.min(search.hi ?? level, level);
    search.dir = -1;
  }
  search.target = level;
  skipLevel(search);
}

/** The strand to ask next: the unfinished one with the fewest questions so far, in strand order. */
export function nextSearchStrand(searches: Record<Strand, StrandSearch>): Strand | null {
  let best: Strand | null = null;
  for (const strand of STRAND_ORDER) {
    const s = searches[strand];
    if (s.target !== null && (best === null || s.asked < searches[best].asked)) best = strand;
  }
  return best;
}

/** Placement straight from a finished level search (later gap-finding questions don't move it). */
export function placementFromSearch(searches: Record<Strand, StrandSearch>, grade: number): Placement {
  return summarize(STRAND_ORDER.map((strand): StrandPlacement => {
    const s = searches[strand];
    let level = s.lo ?? (s.hi !== null ? Math.max(LOWEST_LEVEL, s.hi - 1) : null);
    const completed = level !== null && level === strandTop(strand);
    if (completed && level! < grade) level = grade;
    return { strand, name: STRAND_NAMES[strand], level, questions: s.asked, ...(completed ? { completed } : {}) };
  }));
}

export const levelLabel = (level: number) =>
  level <= LOWEST_LEVEL ? "Below grade 5" : level >= HIGHEST_LEVEL ? "Above grade 8" : `Grade ${level}`;

/** Short form for tables: "<5", "6", "8+". */
export const levelShort = (level: number) => (level <= LOWEST_LEVEL ? "<5" : level >= HIGHEST_LEVEL ? "8+" : String(level));

export type Relation = "above" | "on" | "one_below" | "two_below";

export const relationOf = (level: number, grade: number): Relation => {
  const d = level - grade;
  return d >= 1 ? "above" : d === 0 ? "on" : d === -1 ? "one_below" : "two_below";
};

export const RELATION_LABELS: Record<Relation, string> = {
  above: "Above grade level",
  on: "On grade level",
  one_below: "One grade below",
  two_below: "Two or more grades below",
};
