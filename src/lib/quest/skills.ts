// Skill map for the grades 6–8 math pilot: fractions → ratios & proportions → equations.
// Each skill lists the skills it builds on, so the engine can trace a weak skill back to
// an earlier gap. Standard codes are Common Core, which the NAD math standards build on.

export type Strand = "fractions" | "ratios" | "numbers" | "expressions" | "equations" | "functions";

export interface Skill {
  id: string;
  name: string;
  grade: number; // 4–5 = foundation skills used to find earlier gaps
  strand: Strand;
  standard: string;
  /** Skills this one builds on. */
  prereqs: string[];
  /** What a question for this skill should ask (used to draft questions). */
  description: string;
}

export const SKILLS: Skill[] = [
  // ---------- Foundation (grades 4–5) ----------
  { id: "f.equiv-fractions", name: "Equivalent fractions", grade: 4, strand: "fractions", standard: "4.NF.1", prereqs: [],
    description: "Recognize and generate equivalent fractions, including simplifying to lowest terms." },
  { id: "f.compare-fractions", name: "Compare fractions", grade: 4, strand: "fractions", standard: "4.NF.2", prereqs: ["f.equiv-fractions"],
    description: "Compare two fractions with different numerators and denominators using <, =, >." },
  { id: "f.add-like", name: "Add and subtract fractions (same denominator)", grade: 4, strand: "fractions", standard: "4.NF.3", prereqs: [],
    description: "Add and subtract fractions and mixed numbers with like denominators." },
  { id: "f.add-unlike", name: "Add and subtract fractions (different denominators)", grade: 5, strand: "fractions", standard: "5.NF.1", prereqs: ["f.equiv-fractions", "f.add-like"],
    description: "Add and subtract fractions and mixed numbers with unlike denominators." },
  { id: "f.multiply-fractions", name: "Multiply fractions", grade: 5, strand: "fractions", standard: "5.NF.4", prereqs: ["f.equiv-fractions"],
    description: "Multiply a fraction by a whole number or by another fraction, including word problems." },
  { id: "f.divide-unit", name: "Divide with unit fractions", grade: 5, strand: "fractions", standard: "5.NF.7", prereqs: ["f.multiply-fractions"],
    description: "Divide a unit fraction by a whole number and a whole number by a unit fraction." },
  { id: "f.decimal-place-value", name: "Decimal place value", grade: 5, strand: "numbers", standard: "5.NBT.3", prereqs: [],
    description: "Read, write and compare decimals to thousandths." },
  { id: "f.fraction-decimal", name: "Fractions and decimals", grade: 4, strand: "numbers", standard: "4.NF.6", prereqs: ["f.equiv-fractions"],
    description: "Convert between fractions (denominators 2, 4, 5, 10, 100) and decimals." },
  { id: "f.multiply-whole", name: "Multi-digit multiplication", grade: 5, strand: "numbers", standard: "5.NBT.5", prereqs: [],
    description: "Multiply multi-digit whole numbers." },
  { id: "f.order-of-operations", name: "Order of operations", grade: 5, strand: "expressions", standard: "5.OA.1", prereqs: [],
    description: "Evaluate numerical expressions with parentheses using the order of operations." },

  // ---------- Grade 6 ----------
  { id: "6.divide-fractions", name: "Divide fractions by fractions", grade: 6, strand: "fractions", standard: "6.NS.1", prereqs: ["f.divide-unit", "f.multiply-fractions"],
    description: "Divide a fraction by a fraction, including word problems." },
  { id: "6.ratios", name: "Ratios and ratio tables", grade: 6, strand: "ratios", standard: "6.RP.1, 6.RP.3a", prereqs: ["f.multiply-whole", "f.equiv-fractions"],
    description: "Write ratios in words and notation, and complete tables of equivalent ratios." },
  { id: "6.unit-rate", name: "Unit rates", grade: 6, strand: "ratios", standard: "6.RP.2, 6.RP.3b", prereqs: ["6.ratios"],
    description: "Find and use unit rates, including unit price and constant speed." },
  { id: "6.percent", name: "Percent of a number", grade: 6, strand: "ratios", standard: "6.RP.3c", prereqs: ["6.ratios", "f.fraction-decimal"],
    description: "Find a percent of a quantity and find the whole given a part and the percent." },
  { id: "6.integers", name: "Integers on the number line", grade: 6, strand: "numbers", standard: "6.NS.5, 6.NS.6", prereqs: [],
    description: "Use positive and negative numbers in context, opposites, and locate them on a number line." },
  { id: "6.absolute-value", name: "Absolute value and ordering", grade: 6, strand: "numbers", standard: "6.NS.7", prereqs: ["6.integers"],
    description: "Order rational numbers and interpret absolute value as distance from zero." },
  { id: "6.expressions", name: "Write and evaluate expressions", grade: 6, strand: "expressions", standard: "6.EE.2", prereqs: ["f.order-of-operations"],
    description: "Write expressions with variables from words and evaluate them for given values." },
  { id: "6.equivalent-expressions", name: "Equivalent expressions", grade: 6, strand: "expressions", standard: "6.EE.3", prereqs: ["6.expressions"],
    description: "Use the distributive property and combine like terms to write equivalent expressions." },
  { id: "6.one-step-equations", name: "One-step equations", grade: 6, strand: "equations", standard: "6.EE.7", prereqs: ["6.expressions"],
    description: "Solve one-step equations of the form x + p = q and px = q with nonnegative rational numbers." },

  // ---------- Grade 7 ----------
  { id: "7.add-integers", name: "Add and subtract integers and rationals", grade: 7, strand: "numbers", standard: "7.NS.1", prereqs: ["6.integers", "f.add-unlike"],
    description: "Add and subtract positive and negative integers, fractions and decimals." },
  { id: "7.multiply-integers", name: "Multiply and divide integers and rationals", grade: 7, strand: "numbers", standard: "7.NS.2", prereqs: ["6.integers", "6.divide-fractions"],
    description: "Multiply and divide positive and negative integers, fractions and decimals, including sign rules." },
  { id: "7.complex-rates", name: "Unit rates with fractions", grade: 7, strand: "ratios", standard: "7.RP.1", prereqs: ["6.unit-rate", "6.divide-fractions"],
    description: "Compute unit rates from ratios of fractions, e.g. miles per hour from 1/2 mile in 1/4 hour." },
  { id: "7.proportional", name: "Recognize proportional relationships", grade: 7, strand: "ratios", standard: "7.RP.2a", prereqs: ["6.ratios"],
    description: "Decide whether two quantities are proportional using tables or graphs through the origin." },
  { id: "7.constant-proportionality", name: "Constant of proportionality", grade: 7, strand: "ratios", standard: "7.RP.2b, 7.RP.2c", prereqs: ["7.proportional", "6.unit-rate"],
    description: "Find the constant of proportionality k and write equations y = kx." },
  { id: "7.percent-problems", name: "Percent problems (tax, discount, change)", grade: 7, strand: "ratios", standard: "7.RP.3", prereqs: ["6.percent"],
    description: "Solve multi-step percent problems: tax, tips, discounts, markups, percent increase and decrease." },
  { id: "7.like-terms", name: "Combine like terms and expand", grade: 7, strand: "expressions", standard: "7.EE.1", prereqs: ["6.equivalent-expressions", "7.add-integers"],
    description: "Add, subtract, factor and expand linear expressions with rational coefficients." },
  { id: "7.two-step-equations", name: "Two-step equations", grade: 7, strand: "equations", standard: "7.EE.4a", prereqs: ["6.one-step-equations", "7.add-integers", "7.multiply-integers"],
    description: "Solve equations of the form px + q = r and p(x + q) = r, including word problems." },
  { id: "7.inequalities", name: "Two-step inequalities", grade: 7, strand: "equations", standard: "7.EE.4b", prereqs: ["7.two-step-equations"],
    description: "Solve inequalities of the form px + q > r, including flipping the sign when multiplying or dividing by a negative." },

  // ---------- Grade 8 ----------
  { id: "8.multi-step-equations", name: "Equations with variables on both sides", grade: 8, strand: "equations", standard: "8.EE.7b", prereqs: ["7.two-step-equations", "7.like-terms"],
    description: "Solve multi-step linear equations with variables on both sides and rational coefficients." },
  { id: "8.solution-types", name: "One, none, or infinitely many solutions", grade: 8, strand: "equations", standard: "8.EE.7a", prereqs: ["8.multi-step-equations"],
    description: "Decide whether a linear equation has one solution, no solution, or infinitely many solutions." },
  { id: "8.slope", name: "Slope", grade: 8, strand: "functions", standard: "8.EE.6, 8.F.4", prereqs: ["7.constant-proportionality", "7.multiply-integers"],
    description: "Find slope from a graph, a table, or two points." },
  { id: "8.proportional-graphs", name: "Graph and compare proportional relationships", grade: 8, strand: "functions", standard: "8.EE.5", prereqs: ["7.constant-proportionality", "8.slope"],
    description: "Interpret the unit rate as the slope and compare proportional relationships shown in different ways." },
  { id: "8.slope-intercept", name: "Slope-intercept form", grade: 8, strand: "functions", standard: "8.F.4", prereqs: ["8.slope", "7.two-step-equations"],
    description: "Write y = mx + b from a graph, table, two points or a word problem, and interpret m and b." },
  { id: "8.systems", name: "Systems of equations", grade: 8, strand: "functions", standard: "8.EE.8", prereqs: ["8.slope-intercept", "8.multi-step-equations"],
    description: "Solve simple systems of two linear equations by graphing or substitution, and interpret the solution." },
];

export const SKILLS_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): Skill | undefined {
  return SKILLS_BY_ID[id];
}

/** All skills a skill depends on, directly or indirectly, nearest first. */
export function prerequisiteChain(id: string): string[] {
  const seen = new Set<string>();
  const queue = [...(SKILLS_BY_ID[id]?.prereqs ?? [])];
  const order: string[] = [];
  while (queue.length) {
    const next = queue.shift()!;
    if (seen.has(next)) continue;
    seen.add(next);
    order.push(next);
    queue.push(...(SKILLS_BY_ID[next]?.prereqs ?? []));
  }
  return order;
}

/** Skills for a student's grade plus everything below it (for the diagnostic). */
export function skillsUpToGrade(grade: number): Skill[] {
  return SKILLS.filter((s) => s.grade <= grade);
}
