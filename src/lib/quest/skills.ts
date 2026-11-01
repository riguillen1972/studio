// Skill map for grades 6–8 math, covering every NAD Elementary Mathematics Standard for
// grades 6, 7 and 8 (2012). Each skill lists the skills it builds on, so the engine can trace a
// weak skill back to an earlier gap. `nad` is the NAD standard; `standard` is the matching
// Common Core code, which the NAD standards are correlated to.

export type Strand =
  | "numbers" | "fractions" | "ratios" | "expressions" | "equations" | "functions"
  | "geometry" | "measurement" | "statistics";

export const STRAND_NAMES: Record<Strand, string> = {
  numbers: "Number sense and operations",
  fractions: "Fractions",
  ratios: "Ratios, rates and percents",
  expressions: "Expressions and exponents",
  equations: "Equations and inequalities",
  functions: "Lines and functions",
  geometry: "Geometry",
  measurement: "Measurement",
  statistics: "Data, statistics and probability",
};

export const STRAND_ORDER = Object.keys(STRAND_NAMES) as Strand[];

export interface Skill {
  id: string;
  name: string;
  grade: number; // 4–5 = foundation skills used to find earlier gaps
  strand: Strand;
  /** Common Core code (empty when the NAD standard has no Common Core match). */
  standard: string;
  /** NAD standard code (empty for foundation skills). */
  nad: string;
  /** Skills this one builds on. */
  prereqs: string[];
  /** Challenge skill beyond the core of the standard: left out of the diagnostic and offered once its foundations are mastered. */
  advanced?: boolean;
  /** What a question for this skill should ask (used to draft questions). */
  description: string;
}

export const SKILLS: Skill[] = [
  // ---------- Foundation (grades 4–5) ----------
  { id: "f.equiv-fractions", name: "Equivalent fractions", grade: 4, strand: "fractions", standard: "4.NF.1", nad: "", prereqs: [],
    description: "Recognize and generate equivalent fractions, including simplifying to lowest terms." },
  { id: "f.compare-fractions", name: "Compare fractions", grade: 4, strand: "fractions", standard: "4.NF.2", nad: "", prereqs: ["f.equiv-fractions"],
    description: "Compare two fractions with different numerators and denominators using <, =, >." },
  { id: "f.add-like", name: "Add and subtract fractions (same denominator)", grade: 4, strand: "fractions", standard: "4.NF.3", nad: "", prereqs: [],
    description: "Add and subtract fractions and mixed numbers with like denominators." },
  { id: "f.add-unlike", name: "Add and subtract fractions (different denominators)", grade: 5, strand: "fractions", standard: "5.NF.1", nad: "", prereqs: ["f.equiv-fractions", "f.add-like"],
    description: "Add and subtract fractions and mixed numbers with unlike denominators." },
  { id: "f.multiply-fractions", name: "Multiply fractions", grade: 5, strand: "fractions", standard: "5.NF.4", nad: "", prereqs: ["f.equiv-fractions"],
    description: "Multiply a fraction by a whole number or by another fraction, including word problems." },
  { id: "f.divide-unit", name: "Divide with unit fractions", grade: 5, strand: "fractions", standard: "5.NF.7", nad: "", prereqs: ["f.multiply-fractions"],
    description: "Divide a unit fraction by a whole number and a whole number by a unit fraction." },
  { id: "f.decimal-place-value", name: "Decimal place value", grade: 5, strand: "numbers", standard: "5.NBT.3", nad: "", prereqs: [],
    description: "Read, write and compare decimals to thousandths." },
  { id: "f.powers-of-ten", name: "Multiply and divide by powers of 10", grade: 5, strand: "numbers", standard: "5.NBT.2", nad: "", prereqs: ["f.decimal-place-value"],
    description: "Multiply and divide whole numbers and decimals by 10, 100, 1000 and by powers of 10 written with exponents, like 10^3." },
  { id: "f.fraction-decimal", name: "Fractions and decimals", grade: 4, strand: "numbers", standard: "4.NF.6", nad: "", prereqs: ["f.equiv-fractions"],
    description: "Convert between fractions (denominators 2, 4, 5, 10, 100) and decimals." },
  { id: "f.multiply-whole", name: "Multi-digit multiplication", grade: 5, strand: "numbers", standard: "5.NBT.5", nad: "", prereqs: [],
    description: "Multiply multi-digit whole numbers." },
  { id: "f.order-of-operations", name: "Order of operations", grade: 5, strand: "expressions", standard: "5.OA.1", nad: "", prereqs: [],
    description: "Evaluate numerical expressions with parentheses using the order of operations." },
  { id: "f.first-quadrant", name: "Graph points in the first quadrant", grade: 5, strand: "functions", standard: "5.G.1, 5.G.2", nad: "", prereqs: [],
    description: "Name and interpret points (x, y) with nonnegative coordinates; points are given as ordered pairs or described in words, never shown in a picture." },
  { id: "f.area-perimeter", name: "Area and perimeter of rectangles", grade: 4, strand: "geometry", standard: "4.MD.3", nad: "", prereqs: [],
    description: "Find the area and perimeter of rectangles and squares from their side lengths, including finding a missing side." },
  { id: "f.volume-boxes", name: "Volume of rectangular prisms", grade: 5, strand: "geometry", standard: "5.MD.5", nad: "", prereqs: ["f.area-perimeter"],
    description: "Find the volume of a rectangular prism with whole-number edges using V = l × w × h, including combined boxes." },
  { id: "f.angles", name: "Measure and classify angles", grade: 4, strand: "geometry", standard: "4.MD.5, 4.MD.7, 4.G.2", nad: "", prereqs: [],
    description: "Classify angles as acute, right, obtuse or straight, and find a missing angle when angles add up to a known total. Angles are described in words." },
  { id: "f.unit-conversion", name: "Convert units within a system", grade: 5, strand: "measurement", standard: "5.MD.1", nad: "", prereqs: ["f.multiply-whole", "f.decimal-place-value"],
    description: "Convert within one system (feet and inches, pounds and ounces, meters and centimeters, hours and minutes), including multi-step word problems." },
  { id: "f.line-plots", name: "Read line plots and tables", grade: 5, strand: "statistics", standard: "5.MD.2", nad: "", prereqs: ["f.add-like"],
    description: "Answer questions about a small data set given as a list or frequency table (most common value, total, difference between greatest and least)." },

  // ---------- Foundation: more starting points (one or more in every strand) ----------
  { id: "f.divide-whole", name: "Divide by one- and two-digit numbers", grade: 5, strand: "numbers", standard: "5.NBT.6", nad: "", prereqs: [],
    description: "Divide whole numbers up to four digits by one- and two-digit divisors, with or without remainders." },
  { id: "f.round-decimals", name: "Round whole numbers and decimals", grade: 5, strand: "numbers", standard: "5.NBT.4", nad: "", prereqs: ["f.decimal-place-value"],
    description: "Round whole numbers and decimals to a given place, like 3.476 to the nearest tenth or 2,349 to the nearest hundred." },
  { id: "f.fractions-as-division", name: "Fractions as division", grade: 5, strand: "fractions", standard: "5.NF.3", nad: "", prereqs: ["f.equiv-fractions"],
    description: "Understand a/b as a ÷ b, like 3 pizzas shared by 4 people is 3/4 each, and write division answers as fractions or mixed numbers." },
  { id: "f.times-as-many", name: "Times as many", grade: 4, strand: "ratios", standard: "4.OA.2", nad: "", prereqs: [],
    description: "Solve multiplicative comparison problems: 'Ana has 4 times as many stamps as Ben', finding the larger amount, the smaller amount, or how many times as many." },
  { id: "f.find-unknown", name: "Find the unknown number", grade: 4, strand: "equations", standard: "4.OA.3", nad: "", prereqs: [],
    description: "Find the unknown in number sentences like 7 × ? = 56, ? − 18 = 25 or 72 ÷ ? = 9, and in one-step word problems." },
  { id: "f.numerical-expressions", name: "Write numerical expressions", grade: 5, strand: "expressions", standard: "5.OA.2", nad: "", prereqs: ["f.order-of-operations"],
    description: "Write numerical expressions from words, like 'add 8 and 7, then multiply by 2' as 2 × (8 + 7), and compare expressions without evaluating them." },
  { id: "f.number-patterns", name: "Number patterns and rules", grade: 5, strand: "functions", standard: "5.OA.3", nad: "", prereqs: [],
    description: "Continue patterns from a rule like 'start at 0, add 3', and compare two patterns term by term (each term of one is twice the other)." },
  { id: "f.measurement-problems", name: "Measurement word problems", grade: 4, strand: "measurement", standard: "4.MD.2", nad: "", prereqs: [],
    description: "Solve word problems about distance, time, liquid volume, mass and money, including simple fractions and decimals of a unit." },
  { id: "f.bar-graphs", name: "Bar graphs and pictographs", grade: 4, strand: "statistics", standard: "3.MD.3", nad: "", prereqs: [],
    description: "Read bar graphs and pictographs described as category counts (a pictograph key where one symbol = 5): how many in a category, how many more, and totals." },
  { id: "f.classify-shapes", name: "Classify two-dimensional figures", grade: 5, strand: "geometry", standard: "5.G.4", nad: "", prereqs: ["f.angles"],
    description: "Classify triangles and quadrilaterals by sides and angles, and use the hierarchy (every square is a rectangle and a rhombus)." },

  // ---------- Grade 6 ----------
  // 6.NO.1 Multi-digit and decimal operations
  { id: "6.long-division", name: "Divide multi-digit numbers", grade: 6, strand: "numbers", standard: "6.NS.2", nad: "6.NO.1", prereqs: ["f.multiply-whole", "f.divide-whole"],
    description: "Divide multi-digit whole numbers fluently, including word problems and interpreting remainders." },
  { id: "6.decimal-operations", name: "Add, subtract, multiply and divide decimals", grade: 6, strand: "numbers", standard: "6.NS.3", nad: "6.NO.1", prereqs: ["f.decimal-place-value", "6.long-division"],
    description: "Add, subtract, multiply and divide multi-digit decimals, including money word problems." },
  // 6.NO.2 Factors, multiples, exponents
  { id: "6.factors-primes", name: "Factors, multiples and prime factorization", grade: 6, strand: "numbers", standard: "6.NS.4", nad: "6.NO.2", prereqs: ["f.multiply-whole"],
    description: "Identify factors, multiples, prime and composite numbers, and write a prime factorization (like 2^2 × 3 × 5)." },
  { id: "6.gcf-lcm", name: "Greatest common factor and least common multiple", grade: 6, strand: "numbers", standard: "6.NS.4", nad: "6.NO.2", prereqs: ["6.factors-primes"],
    description: "Find the GCF of two numbers up to 100 and the LCM of two numbers up to 12, including simple word problems." },
  { id: "6.exponents", name: "Whole-number exponents", grade: 6, strand: "expressions", standard: "6.EE.1", nad: "6.NO.2", prereqs: ["f.multiply-whole", "f.order-of-operations"],
    description: "Write and evaluate numerical expressions with whole-number exponents, like 3^4 or 2^3 + 5 × 2, using the order of operations. Write powers with ^." },
  // 6.NO.3 Integers and the coordinate plane
  { id: "6.integers", name: "Integers on the number line", grade: 6, strand: "numbers", standard: "6.NS.5, 6.NS.6", nad: "6.NO.3", prereqs: [],
    description: "Use positive and negative numbers in context, opposites, and locate them on a number line." },
  { id: "6.absolute-value", name: "Absolute value and ordering", grade: 6, strand: "numbers", standard: "6.NS.7", nad: "6.NO.3", prereqs: ["6.integers"],
    description: "Order rational numbers and interpret absolute value as distance from zero." },
  { id: "6.coordinate-plane", name: "The coordinate plane (all four quadrants)", grade: 6, strand: "functions", standard: "6.NS.6b, 6.NS.6c, 6.NS.8", nad: "6.NO.3", prereqs: ["6.integers", "f.first-quadrant"],
    description: "Name the quadrant of a point, reflect a point across the x- or y-axis, and find the distance between two points with the same x or the same y. Points are given as ordered pairs." },
  // 6.NO.4 Fractions, decimals, percents
  { id: "6.divide-fractions", name: "Divide fractions by fractions", grade: 6, strand: "fractions", standard: "6.NS.1", nad: "6.NO.4", prereqs: ["f.divide-unit", "f.multiply-fractions"],
    description: "Divide a fraction by a fraction, including word problems." },
  { id: "6.fraction-decimal-percent", name: "Convert fractions, decimals and percents", grade: 6, strand: "numbers", standard: "6.RP.3c", nad: "6.NO.4", prereqs: ["f.fraction-decimal", "f.decimal-place-value", "f.compare-fractions"],
    description: "Convert between fractions, decimals and percents, and order numbers written in different forms." },
  { id: "6.repeating-decimals", name: "Terminating and repeating decimals", grade: 6, strand: "numbers", standard: "7.NS.2d", nad: "6.NO.4", prereqs: ["6.fraction-decimal-percent", "6.long-division"],
    description: "Convert a fraction to a decimal by dividing and tell whether it terminates or repeats (write repeating decimals in words, like \"0.333... repeating\")." },
  // 6.NO.5 Ratios
  { id: "6.ratios", name: "Ratios and ratio tables", grade: 6, strand: "ratios", standard: "6.RP.1, 6.RP.3a", nad: "6.NO.5", prereqs: ["f.multiply-whole", "f.equiv-fractions", "f.times-as-many"],
    description: "Write ratios in words and notation, and complete tables of equivalent ratios." },
  { id: "6.unit-rate", name: "Unit rates", grade: 6, strand: "ratios", standard: "6.RP.2, 6.RP.3b", nad: "6.NO.5", prereqs: ["6.ratios"],
    description: "Find and use unit rates, including unit price and constant speed." },
  { id: "6.percent", name: "Percent of a number", grade: 6, strand: "ratios", standard: "6.RP.3c", nad: "6.NO.5", prereqs: ["6.ratios", "6.fraction-decimal-percent"],
    description: "Find a percent of a quantity and find the whole given a part and the percent." },
  // 6.OAT.1 Expressions, equations and inequalities
  { id: "6.expressions", name: "Write and evaluate expressions", grade: 6, strand: "expressions", standard: "6.EE.2", nad: "6.OAT.1", prereqs: ["f.order-of-operations"],
    description: "Write expressions with variables from words and evaluate them for given values." },
  { id: "6.expression-parts", name: "Parts of an expression", grade: 6, strand: "expressions", standard: "6.EE.2b", nad: "6.OAT.1", prereqs: ["6.expressions"],
    description: "Identify terms, coefficients, constants, factors and sums in an expression, like the coefficient in 7y + 3." },
  { id: "6.equivalent-expressions", name: "Equivalent expressions", grade: 6, strand: "expressions", standard: "6.EE.3, 6.EE.4", nad: "6.OAT.1", prereqs: ["6.expressions"],
    description: "Use the distributive property and combine like terms to write equivalent expressions." },
  { id: "6.one-step-equations", name: "One-step equations", grade: 6, strand: "equations", standard: "6.EE.5, 6.EE.7", nad: "6.OAT.1", prereqs: ["6.expressions"],
    description: "Solve one-step equations of the form x + p = q and px = q with nonnegative rational numbers." },
  { id: "6.inequalities", name: "Write and graph inequalities", grade: 6, strand: "equations", standard: "6.EE.5, 6.EE.8", nad: "6.OAT.1", prereqs: ["6.integers", "6.expressions"],
    description: "Write an inequality like x > 4 or x ≤ 12 from a situation, decide which values make it true, and describe its number-line graph in words (open or closed circle, which direction)." },
  // 6.OAT.2 Dependent and independent variables
  { id: "6.variables", name: "Dependent and independent variables", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["6.expressions", "6.ratios"],
    description: "Identify the dependent and independent variable in a situation, and use a table or an equation like d = 50t to find missing values." },
  // 6.M.1 Elapsed time
  { id: "6.elapsed-time", name: "Elapsed time", grade: 6, strand: "measurement", standard: "4.MD.2", nad: "6.M.1", prereqs: ["f.unit-conversion", "f.measurement-problems"],
    description: "Find elapsed time, start time or end time across hours and noon or midnight. For numeric questions the stem must ask for the answer in minutes; use multiple choice for clock times." },
  // 6.GEO.1 Area, surface area, volume
  { id: "6.area-polygons", name: "Area of triangles, parallelograms and trapezoids", grade: 6, strand: "geometry", standard: "6.G.1", nad: "6.GEO.1", prereqs: ["f.area-perimeter", "f.multiply-fractions"],
    description: "Find the area of triangles, parallelograms, trapezoids and shapes made of them, from given base and height measurements." },
  { id: "6.polygons-coordinate", name: "Polygons on the coordinate plane", grade: 6, strand: "geometry", standard: "6.G.3", nad: "6.GEO.1", prereqs: ["6.coordinate-plane", "f.area-perimeter"],
    description: "Given the vertices of a rectangle or right triangle as ordered pairs, find side lengths, perimeter or area, or a missing vertex." },
  { id: "6.surface-area", name: "Surface area with nets", grade: 6, strand: "geometry", standard: "6.G.4", nad: "6.GEO.1", prereqs: ["6.area-polygons"],
    description: "Find the surface area of rectangular prisms, triangular prisms and square pyramids from their dimensions (described in words)." },
  { id: "6.volume-prisms", name: "Volume of prisms with fractional edges", grade: 6, strand: "geometry", standard: "6.G.2", nad: "6.GEO.1", prereqs: ["f.volume-boxes", "f.multiply-fractions"],
    description: "Find the volume of rectangular prisms with fractional or decimal edge lengths, and find a missing edge given the volume." },
  // 6.DSP.1 Statistical variability
  { id: "6.statistical-questions", name: "Statistical questions", grade: 6, strand: "statistics", standard: "6.SP.1, 6.SP.2", nad: "6.DSP.1", prereqs: ["f.line-plots", "f.bar-graphs"],
    description: "Tell whether a question is statistical (expects variability in the answers) and recognize that a data set has a center, spread and shape." },
  { id: "6.mean-median-mode", name: "Mean, median, mode and range", grade: 6, strand: "statistics", standard: "6.SP.3, 6.SP.5c", nad: "6.DSP.1", prereqs: ["6.decimal-operations", "f.line-plots"],
    description: "Find the mean, median, mode and range of a data set given as a list." },
  { id: "6.mad-iqr", name: "Interquartile range and mean absolute deviation", grade: 6, strand: "statistics", standard: "6.SP.5c", nad: "6.DSP.1", prereqs: ["6.mean-median-mode", "6.absolute-value", "6.quartiles"],
    description: "Find the quartiles and interquartile range, and the mean absolute deviation, of a small data set given as a list." },
  // 6.DSP.2 Distributions
  { id: "6.data-displays", name: "Dot plots", grade: 6, strand: "statistics", standard: "6.SP.4", nad: "6.DSP.2", prereqs: ["6.mean-median-mode"],
    description: "Read dot plots described in text as value counts: how many, the most common value, the median, and what fraction of the data meets a condition." },
  { id: "6.describe-distributions", name: "Describe and summarize data", grade: 6, strand: "statistics", standard: "6.SP.5", nad: "6.DSP.2", prereqs: ["6.data-displays", "6.mad-iqr"],
    description: "Choose the best measure of center and spread for a data set (for example median and IQR when there is an outlier) and describe how an outlier changes the mean." },


  // ---------- Grade 6: deeper and challenge skills (5–6 per NAD standard) ----------
  // 6.NO.1
  { id: "6.decimal-quotients", name: "Division with decimal answers", grade: 6, strand: "numbers", standard: "6.NS.2, 6.NS.3", nad: "6.NO.1", prereqs: ["6.long-division", "6.decimal-operations"],
    description: "Divide whole numbers and decimals, continuing past the decimal point to the place the stem asks for, including dividing by a decimal like 7.5 ÷ 0.25." },
  { id: "6.decimal-estimation", name: "Estimate with decimals", grade: 6, strand: "numbers", standard: "6.NS.3", nad: "6.NO.1", prereqs: ["6.decimal-operations", "f.round-decimals"],
    description: "Round and estimate sums, differences, products and quotients of decimals, and decide whether a computed answer is reasonable." },
  { id: "6.decimal-word-problems", name: "Multi-step decimal word problems", grade: 6, strand: "numbers", standard: "6.NS.3", nad: "6.NO.1", prereqs: ["6.decimal-operations", "6.decimal-quotients"], advanced: true,
    description: "Solve word problems that need two or three decimal operations, like buying several items and finding change, or sharing a cost evenly." },
  { id: "6.budgets", name: "Budgets and money planning", grade: 6, strand: "numbers", standard: "6.NS.3", nad: "6.NO.1", prereqs: ["6.decimal-word-problems"], advanced: true,
    description: "Plan with money: stay within a budget, compare savings plans, and find how many weeks of saving reach a goal, using decimals and remainders sensibly." },
  // 6.NO.2
  { id: "6.factor-sums-gcf", name: "Factor sums with the GCF", grade: 6, strand: "expressions", standard: "6.NS.4", nad: "6.NO.2", prereqs: ["6.gcf-lcm"],
    description: "Use the distributive property to rewrite a sum using its greatest common factor, like 36 + 8 = 4(9 + 2) or 24 + 60 = 12(2 + 5)." },
  { id: "6.gcf-lcm-word-problems", name: "Choose GCF or LCM in word problems", grade: 6, strand: "numbers", standard: "6.NS.4", nad: "6.NO.2", prereqs: ["6.gcf-lcm"], advanced: true,
    description: "Decide whether a word problem needs the GCF (splitting into equal groups) or the LCM (when events line up again), then solve it." },
  { id: "6.exponents-fractions", name: "Exponents with fractions and decimals", grade: 6, strand: "expressions", standard: "6.EE.1", nad: "6.NO.2", prereqs: ["6.exponents", "f.multiply-fractions"], advanced: true,
    description: "Evaluate powers of fractions and decimals, like (2/3)^2 or 0.5^3, and expressions that combine them with other operations." },
  // 6.NO.3
  { id: "6.rational-number-line", name: "Fractions and decimals on the number line", grade: 6, strand: "numbers", standard: "6.NS.6a, 6.NS.6c", nad: "6.NO.3", prereqs: ["6.integers", "f.fraction-decimal"],
    description: "Locate negative fractions and decimals on a number line, find a number between two others, and find opposites like -(-2.5)." },
  { id: "6.compare-rationals", name: "Inequality statements with rational numbers", grade: 6, strand: "numbers", standard: "6.NS.7a, 6.NS.7b", nad: "6.NO.3", prereqs: ["6.absolute-value", "6.rational-number-line"],
    description: "Write, read and explain statements like -3 > -7 in real situations (temperatures, elevations), and order sets that mix negative fractions and decimals." },
  { id: "6.absolute-value-context", name: "Absolute value in real situations", grade: 6, strand: "numbers", standard: "6.NS.7c, 6.NS.7d", nad: "6.NO.3", prereqs: ["6.absolute-value"], advanced: true,
    description: "Use absolute value to describe size in context (a debt of more than $30 means a balance less than -30) and distinguish comparing absolute values from comparing values." },
  // 6.NO.4
  { id: "6.fraction-division-word", name: "Fraction division word problems", grade: 6, strand: "fractions", standard: "6.NS.1", nad: "6.NO.4", prereqs: ["6.divide-fractions"],
    description: "Solve word problems by dividing fractions, like how many 3/4-cup servings are in 6 cups or how wide a rectangle is given its area and length." },
  { id: "6.mixed-numbers", name: "Multiply and divide mixed numbers", grade: 6, strand: "fractions", standard: "6.NS.1", nad: "6.NO.4", prereqs: ["6.divide-fractions"],
    description: "Multiply and divide mixed numbers by converting to improper fractions, and give the answer as a simplified fraction or mixed number." },
  { id: "6.unusual-percents", name: "Percents above 100% and below 1%", grade: 6, strand: "numbers", standard: "6.RP.3c", nad: "6.NO.4", prereqs: ["6.fraction-decimal-percent"], advanced: true,
    description: "Convert and use percents like 250%, 0.5% and 100%, and compare them with fractions and decimals." },
  // 6.NO.5
  { id: "6.part-whole-ratios", name: "Part-to-part and part-to-whole ratios", grade: 6, strand: "ratios", standard: "6.RP.1, 6.RP.3", nad: "6.NO.5", prereqs: ["6.ratios"],
    description: "Use tape-diagram reasoning (in words) to find parts and totals from a ratio, like boys to girls is 3:5 with 32 students in all." },
  { id: "6.compare-rates", name: "Compare ratios and rates", grade: 6, strand: "ratios", standard: "6.RP.3a, 6.RP.3b", nad: "6.NO.5", prereqs: ["6.unit-rate"],
    description: "Decide which is the better buy, the faster runner or the stronger mixture by comparing unit rates or equivalent ratios." },
  { id: "6.ratio-multistep", name: "Multi-step ratio problems", grade: 6, strand: "ratios", standard: "6.RP.3", nad: "6.NO.5", prereqs: ["6.part-whole-ratios", "6.compare-rates"], advanced: true,
    description: "Solve problems where a ratio changes or several steps are needed, like adding more of one ingredient to reach a new ratio or scaling a recipe for a new number of people." },
  // 6.OAT.1
  { id: "6.equation-word-problems", name: "Write and solve equations from word problems", grade: 6, strand: "equations", standard: "6.EE.6, 6.EE.7", nad: "6.OAT.1", prereqs: ["6.one-step-equations"], advanced: true,
    description: "Write a one-step equation for a real situation (with whole numbers, fractions or decimals), solve it, and choose the equation that matches a story." },
  // 6.OAT.2
  { id: "6.tables-to-equations", name: "Write an equation from a table", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["6.variables"],
    description: "Given a table of x and y values with a constant multiplier or constant difference, write the equation like y = 4x or y = x + 7." },
  { id: "6.equations-to-tables", name: "Use an equation to make a table", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["6.variables"],
    description: "Use an equation like c = 2.5n to fill in missing table values and ordered pairs, including working backward from y to x." },
  { id: "6.relationship-graphs", name: "Relationships shown on graphs", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["6.equations-to-tables", "6.coordinate-plane"],
    description: "Given points on a graph listed as ordered pairs, find the rule, predict another point, and say what a point means in the situation." },
  { id: "6.two-variable-problems", name: "Two-variable word problems", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["6.tables-to-equations"], advanced: true,
    description: "Model a situation with two variables (pay per hour, distance at a constant speed), choose the matching equation, table or graph description, and answer questions with it." },
  // 6.M.1
  { id: "6.time-units", name: "Convert units of time", grade: 6, strand: "measurement", standard: "5.MD.1", nad: "6.M.1", prereqs: ["f.unit-conversion"],
    description: "Convert between seconds, minutes, hours, days and weeks, including mixed units like 2 hours 45 minutes in minutes." },
  { id: "6.schedules", name: "Schedules and timetables", grade: 6, strand: "measurement", standard: "4.MD.2", nad: "6.M.1", prereqs: ["6.elapsed-time"],
    description: "Use a schedule or timetable written as a list (bus or class times) to find durations, gaps and the latest time to leave." },
  { id: "6.elapsed-time-multistep", name: "Multi-step elapsed time", grade: 6, strand: "measurement", standard: "4.MD.2", nad: "6.M.1", prereqs: ["6.elapsed-time", "6.time-units"], advanced: true,
    description: "Plan with several activities in a row, work backward from an end time, or add durations that cross noon or midnight." },
  { id: "6.time-zones", name: "Elapsed time across time zones", grade: 6, strand: "measurement", standard: "4.MD.2", nad: "6.M.1", prereqs: ["6.elapsed-time-multistep"], advanced: true,
    description: "Find arrival times and flight durations when travel crosses time zones (the stem states the time difference)." },
  // 6.GEO.1
  { id: "6.composite-polygons", name: "Area of composite polygons", grade: 6, strand: "geometry", standard: "6.G.1", nad: "6.GEO.1", prereqs: ["6.area-polygons"],
    description: "Find the area of a figure made of rectangles and triangles (described in words) by adding parts or subtracting a cut-out." },
  { id: "6.missing-dimension", name: "Find a missing dimension", grade: 6, strand: "geometry", standard: "6.G.1, 6.G.2", nad: "6.GEO.1", prereqs: ["6.area-polygons", "6.volume-prisms"], advanced: true,
    description: "Work backward from a given area, surface area or volume to find a missing base, height or edge length." },
  // 6.DSP.1
  { id: "6.frequency-tables", name: "Frequency tables and grouped data", grade: 6, strand: "statistics", standard: "6.SP.4, 6.SP.5a", nad: "6.DSP.1", prereqs: ["f.line-plots"],
    description: "Organize data into a frequency table with intervals, and find how many values fall in a range or what fraction of the data is above a value." },
  { id: "6.mean-balance", name: "Mean as a balance point", grade: 6, strand: "statistics", standard: "6.SP.3, 6.SP.5c", nad: "6.DSP.1", prereqs: ["6.mean-median-mode"], advanced: true,
    description: "Find a missing value that gives a stated mean, find the new mean after adding or removing a value, and reason about the mean as a fair share." },
  { id: "6.interpret-spread", name: "Interpret MAD and IQR", grade: 6, strand: "statistics", standard: "6.SP.3, 6.SP.5c", nad: "6.DSP.1", prereqs: ["6.mad-iqr"], advanced: true,
    description: "Use the MAD or IQR to say which data set is more consistent and what the spread tells you in context." },
  // 6.DSP.2
  { id: "6.histograms", name: "Histograms", grade: 6, strand: "statistics", standard: "6.SP.4", nad: "6.DSP.2", prereqs: ["6.frequency-tables"],
    description: "Read histograms described as interval counts: how many values in an interval, the total count, and which interval holds the median." },
  { id: "6.box-plots", name: "Box plots and five-number summaries", grade: 6, strand: "statistics", standard: "6.SP.4", nad: "6.DSP.2", prereqs: ["6.mad-iqr"],
    description: "Find the five-number summary of a data set, and read a box plot given as a five-number summary (what percent of data lies in each part)." },
  { id: "6.data-shape", name: "Shape of a distribution", grade: 6, strand: "statistics", standard: "6.SP.2, 6.SP.5d", nad: "6.DSP.2", prereqs: ["6.histograms", "6.data-displays"], advanced: true,
    description: "Describe a distribution given as a frequency table as symmetric or skewed, with peaks, gaps, clusters or outliers, and tell how the shape affects the mean and median." },

  // ---------- Grade 6: more practice skills (10–12 per NAD standard) ----------
  // 6.NO.1
  { id: "6.remainders", name: "Interpret remainders", grade: 6, strand: "numbers", standard: "6.NS.2", nad: "6.NO.1", prereqs: ["6.long-division", "f.fractions-as-division"],
    description: "Solve division word problems where the remainder has to be interpreted: round up (buses needed), drop it (full boxes), report it (left over), or write it as a fraction or decimal." },
  { id: "6.compare-decimals", name: "Compare and order decimals", grade: 6, strand: "numbers", standard: "6.NS.3", nad: "6.NO.1", prereqs: ["f.decimal-place-value"],
    description: "Compare and order decimals with different numbers of places, like 0.5, 0.45 and 0.405, including measurements and prices." },
  { id: "6.mental-decimals", name: "Mental math with decimals", grade: 6, strand: "numbers", standard: "6.NS.3", nad: "6.NO.1", prereqs: ["f.powers-of-ten", "6.decimal-operations"],
    description: "Multiply and divide by 0.1, 0.01, 0.5 and 0.25 by reasoning (× 0.5 is half, ÷ 0.25 is × 4), and use compatible numbers to compute without writing it out." },
  { id: "6.decimal-error-analysis", name: "Find the mistake in decimal work", grade: 6, strand: "numbers", standard: "6.NS.3", nad: "6.NO.1", prereqs: ["6.decimal-operations", "6.decimal-quotients"], advanced: true,
    description: "Given a worked decimal calculation described step by step with one error (misplaced decimal point, places not lined up, dividing the wrong way), choose the wrong step or the correct answer." },
  { id: "6.missing-digits", name: "Missing-digit puzzles", grade: 6, strand: "numbers", standard: "6.NS.2, 6.NS.3", nad: "6.NO.1", prereqs: ["6.long-division", "6.decimal-operations"], advanced: true,
    description: "Find a missing digit or number in a multi-digit or decimal computation, like 4_.6 × 3 = 139.8, by reasoning about place value and estimation." },
  // 6.NO.2
  { id: "6.divisibility-rules", name: "Divisibility rules", grade: 6, strand: "numbers", standard: "6.NS.4", nad: "6.NO.2", prereqs: ["f.multiply-whole"],
    description: "Use the divisibility rules for 2, 3, 4, 5, 6, 9 and 10 to decide whether a number is divisible without dividing, and find a digit that makes a number divisible." },
  { id: "6.prime-composite", name: "Prime and composite numbers", grade: 6, strand: "numbers", standard: "6.NS.4", nad: "6.NO.2", prereqs: ["6.divisibility-rules"],
    description: "Decide whether numbers up to 100 are prime or composite with a reason (1 is neither), and find the primes in a range." },
  { id: "6.exponent-order-of-operations", name: "Order of operations with exponents", grade: 6, strand: "expressions", standard: "6.EE.1, 6.EE.2c", nad: "6.NO.2", prereqs: ["6.exponents", "f.order-of-operations"],
    description: "Evaluate numerical expressions with whole-number exponents, parentheses and all four operations, like 3 + 2^3 × (6 − 4)." },
  { id: "6.lcm-denominators", name: "Use the LCM for common denominators", grade: 6, strand: "numbers", standard: "6.NS.4", nad: "6.NO.2", prereqs: ["6.gcf-lcm", "f.add-unlike"],
    description: "Use the least common multiple to find the least common denominator, and the GCF to simplify fractions, when adding, subtracting and comparing fractions." },
  { id: "6.gcf-lcm-from-factorizations", name: "GCF and LCM from prime factorizations", grade: 6, strand: "numbers", standard: "6.NS.4", nad: "6.NO.2", prereqs: ["6.factors-primes", "6.gcf-lcm"], advanced: true,
    description: "Find the GCF and LCM of two or three numbers using their prime factorizations written with exponents, like 2^3 × 3 and 2 × 3^2 × 5." },
  // 6.NO.3
  { id: "6.integers-context", name: "Integers in real life", grade: 6, strand: "numbers", standard: "6.NS.5", nad: "6.NO.3", prereqs: ["6.integers"],
    description: "Use positive and negative numbers for temperature, elevation, bank balances and scores, and tell what 0 means in each situation." },
  { id: "6.opposites", name: "Opposites", grade: 6, strand: "numbers", standard: "6.NS.6a", nad: "6.NO.3", prereqs: ["6.integers"],
    description: "Find the opposite of a number, including the opposite of an opposite like −(−7), and tell how opposites sit on the number line." },
  { id: "6.reflect-points", name: "Reflect points across the axes", grade: 6, strand: "functions", standard: "6.NS.6b", nad: "6.NO.3", prereqs: ["6.coordinate-plane"],
    description: "Give the coordinates of a point after reflecting it across the x-axis, the y-axis or both, and name the quadrant it lands in." },
  { id: "6.coordinate-distance", name: "Distance on the coordinate plane", grade: 6, strand: "functions", standard: "6.NS.8", nad: "6.NO.3", prereqs: ["6.coordinate-plane", "6.absolute-value"],
    description: "Find the distance between two points that share an x- or y-coordinate, including points in different quadrants, using absolute value." },
  { id: "6.coordinate-problems", name: "Coordinate plane word problems", grade: 6, strand: "functions", standard: "6.NS.8, 6.G.3", nad: "6.NO.3", prereqs: ["6.coordinate-distance"], advanced: true,
    description: "Solve map and grid problems given as coordinates: perimeter of a rectangle from its vertices, the missing fourth vertex, or total distance along a route." },
  // 6.NO.4
  { id: "6.reciprocals", name: "Reciprocals", grade: 6, strand: "fractions", standard: "6.NS.1", nad: "6.NO.4", prereqs: ["f.multiply-fractions"],
    description: "Find the reciprocal of a fraction, whole number or mixed number, and use that a number times its reciprocal is 1." },
  { id: "6.quotient-size", name: "Predict the size of a quotient", grade: 6, strand: "fractions", standard: "6.NS.1", nad: "6.NO.4", prereqs: ["6.divide-fractions"],
    description: "Without computing, decide whether a quotient is greater or less than the dividend (dividing by a number less than 1 gives a larger result)." },
  { id: "6.order-fdp", name: "Order fractions, decimals and percents", grade: 6, strand: "numbers", standard: "6.RP.3c", nad: "6.NO.4", prereqs: ["6.fraction-decimal-percent"],
    description: "Compare and order a mix of fractions, decimals and percents, like 3/8, 0.4 and 35%." },
  { id: "6.fraction-expressions", name: "Expressions with fraction operations", grade: 6, strand: "fractions", standard: "6.NS.1", nad: "6.NO.4", prereqs: ["6.divide-fractions", "f.add-unlike"],
    description: "Evaluate expressions that combine adding, subtracting, multiplying and dividing fractions and mixed numbers, following the order of operations." },
  { id: "6.fraction-division-meaning", name: "What fraction division means", grade: 6, strand: "fractions", standard: "6.NS.1", nad: "6.NO.4", prereqs: ["6.divide-fractions"], advanced: true,
    description: "Interpret fraction division as 'how many groups' or 'how much in one group': pick the story that matches an expression like 3/4 ÷ 1/8, or write the division for a story." },
  // 6.NO.5
  { id: "6.equivalent-ratios", name: "Equivalent ratios", grade: 6, strand: "ratios", standard: "6.RP.3a", nad: "6.NO.5", prereqs: ["6.ratios"],
    description: "Decide whether two ratios are equivalent and find a missing value in an equivalent ratio, like 3 : 5 = ? : 35." },
  { id: "6.ratio-graphs", name: "Graph a ratio table", grade: 6, strand: "ratios", standard: "6.RP.3a", nad: "6.NO.5", prereqs: ["6.ratios", "f.first-quadrant"],
    description: "Plot pairs from a ratio table as points, read pairs from points given as coordinates, and notice that the points line up with (0, 0)." },
  { id: "6.percent-whole", name: "Find the whole from a part and percent", grade: 6, strand: "ratios", standard: "6.RP.3c", nad: "6.NO.5", prereqs: ["6.percent"],
    description: "Find the whole when a part and the percent are known, like '12 is 30% of what number?', and find what percent one number is of another." },
  { id: "6.unit-price", name: "Unit price and the better buy", grade: 6, strand: "ratios", standard: "6.RP.3b", nad: "6.NO.5", prereqs: ["6.unit-rate", "6.decimal-quotients"],
    description: "Find unit prices and decide which size or package is the better buy." },
  { id: "6.ratio-totals", name: "Ratios with a total or difference", grade: 6, strand: "ratios", standard: "6.RP.3", nad: "6.NO.5", prereqs: ["6.part-whole-ratios"], advanced: true,
    description: "Solve problems where a ratio and the total or difference are known, like 'boys to girls is 3 : 5 and there are 40 students' or 'there are 12 more girls than boys'." },
  // 6.OAT.1
  { id: "6.expressions-from-words", name: "Write expressions from words", grade: 6, strand: "expressions", standard: "6.EE.2a", nad: "6.OAT.1", prereqs: ["6.expressions", "f.numerical-expressions"],
    description: "Translate phrases like '5 less than twice a number' or 'the quotient of n and 4' into expressions, paying attention to order in 'less than' and 'quotient of'." },
  { id: "6.evaluate-formulas", name: "Evaluate formulas", grade: 6, strand: "expressions", standard: "6.EE.2c", nad: "6.OAT.1", prereqs: ["6.expressions", "6.exponents"],
    description: "Substitute values into formulas like A = lw, V = s^3, d = rt and P = 2l + 2w, including fraction and decimal values." },
  { id: "6.check-solutions", name: "Is it a solution?", grade: 6, strand: "equations", standard: "6.EE.5", nad: "6.OAT.1", prereqs: ["6.expressions", "f.find-unknown"],
    description: "Check whether a number makes an equation or inequality true by substituting, and choose the solutions from a given set." },
  { id: "6.one-step-fractions", name: "One-step equations with fractions and decimals", grade: 6, strand: "equations", standard: "6.EE.7", nad: "6.OAT.1", prereqs: ["6.one-step-equations", "6.divide-fractions"],
    description: "Solve one-step equations like x + 2.75 = 8.1, (2/3)x = 12 and x ÷ 0.4 = 15." },
  { id: "6.inequality-situations", name: "Inequalities for real situations", grade: 6, strand: "equations", standard: "6.EE.8", nad: "6.OAT.1", prereqs: ["6.inequalities"], advanced: true,
    description: "Write an inequality such as x ≥ 13 or x < 50 for a real limit ('at least', 'no more than'), test values, and decide whether only whole numbers make sense." },
  // 6.OAT.2
  { id: "6.rate-tables", name: "Tables for rate situations", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["6.variables", "6.unit-rate"],
    description: "Complete a table for a rate situation (cost per item, distance at a steady speed) and find a value far down the table without listing every row." },
  { id: "6.graph-to-equation", name: "Write an equation from a graph", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["6.relationship-graphs", "6.tables-to-equations"],
    description: "From points on a line given as coordinates, write the equation (like y = 4x or y = x + 3) and tell what a point means in the situation." },
  { id: "6.add-or-multiply", name: "Adding rule or multiplying rule?", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["6.tables-to-equations"],
    description: "Decide whether a table follows a rule like y = x + c or y = kx, and write the rule." },
  { id: "6.sequences", name: "Number sequences", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["f.number-patterns", "6.variables"],
    description: "Extend arithmetic sequences and simple doubling or tripling sequences, describe the rule, and find a term far along, like the 20th." },
  { id: "6.compare-plans", name: "Compare two plans", grade: 6, strand: "functions", standard: "6.EE.9", nad: "6.OAT.2", prereqs: ["6.tables-to-equations", "6.compare-rates"], advanced: true,
    description: "Compare two options given as an equation and a table (like gym A: c = 5m + 20, gym B as a table) to find which costs less for a given amount and when they cost the same." },
  // 6.M.1
  { id: "6.24-hour-time", name: "12-hour and 24-hour time", grade: 6, strand: "measurement", standard: "4.MD.2", nad: "6.M.1", prereqs: ["6.time-units"],
    description: "Convert between 12-hour (a.m./p.m.) and 24-hour time, and find elapsed time across noon or midnight." },
  { id: "6.start-or-end-time", name: "Find a start or end time", grade: 6, strand: "measurement", standard: "4.MD.2", nad: "6.M.1", prereqs: ["6.elapsed-time"],
    description: "Work forward or backward: given an end time and a duration find the start time, or given a start time and a duration find the end time." },
  { id: "6.time-fractions-decimals", name: "Time in fractions and decimals", grade: 6, strand: "measurement", standard: "5.MD.1", nad: "6.M.1", prereqs: ["6.time-units", "f.fraction-decimal"],
    description: "Convert between hours and minutes written as fractions or decimals, like 1.75 hours = 1 hour 45 minutes and 20 minutes = 1/3 hour." },
  { id: "6.calendar", name: "Calendar problems", grade: 6, strand: "measurement", standard: "4.MD.2", nad: "6.M.1", prereqs: ["6.time-units"],
    description: "Count days between dates, find the day of the week a number of days later, and use months with 28 to 31 days." },
  { id: "6.time-rates", name: "Time, speed and pay rates", grade: 6, strand: "measurement", standard: "6.RP.3b", nad: "6.M.1", prereqs: ["6.time-fractions-decimals", "6.unit-rate"], advanced: true,
    description: "Solve rate problems with time: how long a trip takes at a speed, pay for hours worked at an hourly wage, or pages read per minute, with times in hours and minutes." },
  // 6.GEO.1
  { id: "6.surface-area-formulas", name: "Surface area of prisms and pyramids", grade: 6, strand: "geometry", standard: "6.G.4", nad: "6.GEO.1", prereqs: ["6.surface-area"],
    description: "Find the surface area of rectangular prisms, triangular prisms and square pyramids from their dimensions by adding the areas of the faces." },
  { id: "6.volume-unit-cubes", name: "Volume with fractional unit cubes", grade: 6, strand: "geometry", standard: "6.G.2", nad: "6.GEO.1", prereqs: ["f.volume-boxes", "f.multiply-fractions"],
    description: "Find how many 1/2-inch or 1/4-inch cubes fill a prism and show that V = lwh gives the same volume." },
  { id: "6.choose-measure", name: "Perimeter, area, surface area or volume?", grade: 6, strand: "geometry", standard: "6.G.1, 6.G.4", nad: "6.GEO.1", prereqs: ["6.area-polygons", "f.volume-boxes"],
    description: "Decide which measure a situation needs (fencing, carpet, wrapping paper, filling a box), give its units, and compute it." },
  { id: "6.nets", name: "Nets of solids", grade: 6, strand: "geometry", standard: "6.G.4", nad: "6.GEO.1", prereqs: ["f.area-perimeter", "f.classify-shapes"],
    description: "Identify the solid a described net folds into from the number and shape of its faces, and count faces, edges and vertices of prisms and pyramids." },
  { id: "6.composite-volume", name: "Volume of composite solids", grade: 6, strand: "geometry", standard: "6.G.2", nad: "6.GEO.1", prereqs: ["6.volume-prisms"], advanced: true,
    description: "Find the volume of a solid made of two or three rectangular prisms (like an L-shaped step) by splitting it or subtracting." },
  // 6.DSP.1
  { id: "6.range-outliers", name: "Range and outliers", grade: 6, strand: "statistics", standard: "6.SP.5c", nad: "6.DSP.1", prereqs: ["6.mean-median-mode"],
    description: "Find the range, spot an outlier, and tell how removing it changes the mean, median and range." },
  { id: "6.missing-value-mean", name: "Find a missing value from the mean", grade: 6, strand: "statistics", standard: "6.SP.3", nad: "6.DSP.1", prereqs: ["6.mean-median-mode", "6.one-step-equations"],
    description: "Given the mean and all but one value, find the missing value, or find the score needed on the next test to reach a target average." },
  { id: "6.choose-center", name: "Mean or median?", grade: 6, strand: "statistics", standard: "6.SP.5d", nad: "6.DSP.1", prereqs: ["6.mean-median-mode"],
    description: "Decide whether the mean or the median better describes a data set with an outlier or a skew, and explain why." },
  { id: "6.quartiles", name: "Find quartiles", grade: 6, strand: "statistics", standard: "6.SP.5c", nad: "6.DSP.1", prereqs: ["6.mean-median-mode"],
    description: "Find the lower and upper quartiles of a data set with an odd or even number of values." },
  { id: "6.changing-data", name: "How changes to data affect statistics", grade: 6, strand: "statistics", standard: "6.SP.5c", nad: "6.DSP.1", prereqs: ["6.mean-median-mode", "6.mad-iqr"], advanced: true,
    description: "Predict how adding the same amount to every value, adding a new value, or doubling every value changes the mean, median, range and MAD." },
  // 6.DSP.2
  { id: "6.stem-and-leaf", name: "Stem-and-leaf plots", grade: 6, strand: "statistics", standard: "6.SP.4", nad: "6.DSP.2", prereqs: ["6.mean-median-mode"],
    description: "Read a stem-and-leaf plot written as text (2 | 3 5 8 means 23, 25, 28): count the values and find the least, greatest, median, mode and range." },
  { id: "6.choose-display", name: "Choose a data display", grade: 6, strand: "statistics", standard: "6.SP.4", nad: "6.DSP.2", prereqs: ["6.data-displays", "6.histograms", "f.bar-graphs"],
    description: "Pick the best display (dot plot, histogram, box plot, bar graph) for a purpose and kind of data, and say why." },
  { id: "6.dot-plot-statistics", name: "Statistics from dot plots", grade: 6, strand: "statistics", standard: "6.SP.4, 6.SP.5", nad: "6.DSP.2", prereqs: ["6.data-displays"],
    description: "Find the mean, median, mode and range from a dot plot given as how many dots sit above each value." },
  { id: "6.percent-in-range", name: "Fraction of data in a range", grade: 6, strand: "statistics", standard: "6.SP.5", nad: "6.DSP.2", prereqs: ["6.box-plots", "6.frequency-tables"],
    description: "Find the fraction or percent of values above, below or between given numbers from a frequency table or a box plot." },
  { id: "6.misleading-graphs", name: "Misleading graphs", grade: 6, strand: "statistics", standard: "6.SP.4", nad: "6.DSP.2", prereqs: ["6.data-displays"], advanced: true,
    description: "Spot how a graph described in words misleads (axis not starting at 0, uneven intervals, a chosen time window) and what a fair graph would show." },

  // ---------- Grade 7 ----------
  // 7.NO.1–2 Rational number operations and properties
  { id: "7.add-integers", name: "Add and subtract integers and rationals", grade: 7, strand: "numbers", standard: "7.NS.1", nad: "7.NO.1", prereqs: ["6.integers", "f.add-unlike"],
    description: "Add and subtract positive and negative integers, fractions and decimals." },
  { id: "7.multiply-integers", name: "Multiply and divide integers and rationals", grade: 7, strand: "numbers", standard: "7.NS.2", nad: "7.NO.1", prereqs: ["6.integers", "6.divide-fractions"],
    description: "Multiply and divide positive and negative integers, fractions and decimals, including sign rules." },
  { id: "7.number-properties", name: "Properties of operations", grade: 7, strand: "numbers", standard: "7.NS.1d, 7.NS.2c", nad: "7.NO.2", prereqs: ["7.add-integers", "7.multiply-integers"],
    description: "Use and name the commutative, associative, distributive, identity and inverse properties to compute with rational numbers efficiently." },
  { id: "7.rational-word-problems", name: "Word problems with rational numbers", grade: 7, strand: "numbers", standard: "7.NS.3", nad: "7.NO.2", prereqs: ["7.add-integers", "7.multiply-integers"],
    description: "Solve real-world problems with all four operations on positive and negative fractions and decimals (temperature, elevation, money)." },
  // 7.NO.3 Scientific notation, exponents, square roots
  { id: "7.exponents-roots", name: "Powers and square roots", grade: 7, strand: "expressions", standard: "8.EE.2", nad: "7.NO.3", prereqs: ["6.exponents"],
    description: "Evaluate powers (including negative bases, like (-3)^2 vs -3^2) and square roots of perfect squares, and find which two whole numbers a square root lies between." },
  { id: "7.scientific-notation", name: "Read and write scientific notation", grade: 7, strand: "numbers", standard: "8.EE.3", nad: "7.NO.3", prereqs: ["6.exponents", "f.powers-of-ten"],
    description: "Convert between standard form and scientific notation (written like 4.5 × 10^6 or 3.2 × 10^-4)." },
  // 7.NO.4 Proportional relationships
  { id: "7.complex-rates", name: "Unit rates with fractions", grade: 7, strand: "ratios", standard: "7.RP.1", nad: "7.NO.4", prereqs: ["6.unit-rate", "6.divide-fractions"],
    description: "Compute unit rates from ratios of fractions, e.g. miles per hour from 1/2 mile in 1/4 hour." },
  { id: "7.proportional", name: "Recognize proportional relationships", grade: 7, strand: "ratios", standard: "7.RP.2a", nad: "7.NO.4", prereqs: ["6.ratios"],
    description: "Decide whether two quantities are proportional using tables or graphs through the origin." },
  { id: "7.constant-proportionality", name: "Constant of proportionality", grade: 7, strand: "ratios", standard: "7.RP.2b, 7.RP.2c, 7.RP.2d", nad: "7.NO.4", prereqs: ["7.proportional", "6.unit-rate"],
    description: "Find the constant of proportionality k and write equations y = kx." },
  { id: "7.percent-problems", name: "Percent problems (tax, discount, change)", grade: 7, strand: "ratios", standard: "7.RP.3", nad: "7.NO.4", prereqs: ["6.percent"],
    description: "Solve multi-step percent problems: tax, tips, discounts, markups, percent increase and decrease." },
  { id: "7.interest", name: "Simple interest and commission", grade: 7, strand: "ratios", standard: "7.RP.3", nad: "7.NO.4", prereqs: ["7.percent-problems"],
    description: "Use I = Prt for simple interest and find commissions and fees, including the total amount after interest." },
  // 7.OAT.1 Equivalent expressions
  { id: "7.like-terms", name: "Combine like terms and expand", grade: 7, strand: "expressions", standard: "7.EE.1", nad: "7.OAT.1", prereqs: ["6.equivalent-expressions", "7.add-integers"],
    description: "Add, subtract, factor and expand linear expressions with rational coefficients." },
  { id: "7.rewrite-expressions", name: "Rewrite expressions to show meaning", grade: 7, strand: "expressions", standard: "7.EE.2", nad: "7.OAT.1", prereqs: ["7.like-terms"],
    description: "Rewrite an expression in a different form to show what it means, like a + 0.05a = 1.05a for a 5% increase." },
  // 7.OAT.2 Solving problems with equations
  { id: "7.two-step-equations", name: "Two-step equations", grade: 7, strand: "equations", standard: "7.EE.4a", nad: "7.OAT.2", prereqs: ["6.one-step-equations", "7.add-integers", "7.multiply-integers"],
    description: "Solve equations of the form px + q = r and p(x + q) = r, including word problems." },
  { id: "7.estimation", name: "Multi-step problems and estimation", grade: 7, strand: "equations", standard: "7.EE.3", nad: "7.OAT.2", prereqs: ["7.rational-word-problems", "7.percent-problems"],
    description: "Solve multi-step problems that mix whole numbers, fractions, decimals and percents, and use estimation to judge whether an answer is reasonable." },
  // 7.OAT.3 Patterns, rules and inequalities
  { id: "7.patterns", name: "Patterns and rules", grade: 7, strand: "functions", standard: "8.F.1", nad: "7.OAT.3", prereqs: ["6.variables", "7.multiply-integers"],
    description: "Find the next terms and the rule of arithmetic and geometric number patterns, and find a term like the 20th using the rule." },
  { id: "7.inequalities", name: "Two-step inequalities", grade: 7, strand: "equations", standard: "7.EE.4b", nad: "7.OAT.3", prereqs: ["7.two-step-equations", "6.inequalities"],
    description: "Solve inequalities of the form px + q > r, including flipping the sign when multiplying or dividing by a negative." },
  // 7.M.1 Converting units
  { id: "7.unit-conversion", name: "Convert customary and metric units", grade: 7, strand: "measurement", standard: "6.RP.3d", nad: "7.M.1", prereqs: ["f.unit-conversion", "6.unit-rate"],
    description: "Convert units within the customary system and within the metric system using ratio reasoning and conversion tables." },
  { id: "7.metric-customary", name: "Convert between metric and customary", grade: 7, strand: "measurement", standard: "6.RP.3d", nad: "7.M.1", prereqs: ["7.unit-conversion"],
    description: "Convert between customary and metric units using a given conversion factor (the stem must give it, like 1 inch = 2.54 cm), rounding as the stem says." },
  // 7.GEO.1 Figures and relationships
  { id: "7.scale-drawings", name: "Scale drawings", grade: 7, strand: "geometry", standard: "7.G.1", nad: "7.GEO.1", prereqs: ["7.proportional", "6.area-polygons"],
    description: "Use a scale (like 1 inch = 20 feet) to find actual lengths and areas from a scale drawing, or drawing lengths from actual ones." },
  { id: "7.triangles", name: "Construct and classify triangles", grade: 7, strand: "geometry", standard: "7.G.2", nad: "7.GEO.1", prereqs: ["f.angles"],
    description: "Decide whether three side lengths can make a triangle (triangle inequality) and classify triangles by sides and angles." },
  { id: "7.cross-sections", name: "Cross-sections of solids", grade: 7, strand: "geometry", standard: "7.G.3", nad: "7.GEO.1", prereqs: ["6.surface-area"],
    description: "Name the 2D shape made by slicing a prism, pyramid, cylinder or cone in a described direction (multiple choice)." },
  // 7.GEO.2 Angles, perimeter, area, surface area, volume
  { id: "7.angle-relationships", name: "Angle relationships", grade: 7, strand: "geometry", standard: "7.G.5", nad: "7.GEO.2", prereqs: ["f.angles", "6.one-step-equations"],
    description: "Use supplementary, complementary, vertical and adjacent angles to find an unknown angle, including writing and solving a simple equation." },
  { id: "7.circles", name: "Circumference and area of circles", grade: 7, strand: "geometry", standard: "7.G.4", nad: "7.GEO.2", prereqs: ["6.decimal-operations", "6.exponents"],
    description: "Find the circumference and area of a circle from its radius or diameter. The stem must say to use 3.14 for π and how to round." },
  { id: "7.composite-area", name: "Area of composite figures", grade: 7, strand: "geometry", standard: "7.G.6", nad: "7.GEO.2", prereqs: ["6.area-polygons", "7.circles"],
    description: "Find the area and perimeter of figures made of rectangles, triangles, trapezoids and half or quarter circles, described in words." },
  { id: "7.surface-volume", name: "Surface area and volume of prisms", grade: 7, strand: "geometry", standard: "7.G.6", nad: "7.GEO.2", prereqs: ["6.surface-area", "6.volume-prisms"],
    description: "Find the surface area and volume of right prisms with rectangular, triangular or trapezoid bases, and the surface area of pyramids, in real-world problems." },
  // 7.DSP.1 Sampling
  { id: "7.sampling", name: "Random samples and predictions", grade: 7, strand: "statistics", standard: "7.SP.1, 7.SP.2", nad: "7.DSP.1", prereqs: ["6.statistical-questions", "6.ratios"],
    description: "Decide whether a sample is random and representative, and use sample results to predict for a whole population (12 of 40 sampled → how many of 600)." },
  // 7.DSP.2 Comparing populations
  { id: "7.compare-populations", name: "Compare two populations", grade: 7, strand: "statistics", standard: "7.SP.3, 7.SP.4", nad: "7.DSP.2", prereqs: ["6.describe-distributions"],
    description: "Compare two data sets given as lists using their means, medians, MADs or IQRs." },
  // 7.DSP.3 Probability
  { id: "7.probability", name: "Probability of simple events", grade: 7, strand: "statistics", standard: "7.SP.5, 7.SP.6, 7.SP.7", nad: "7.DSP.3", prereqs: ["f.equiv-fractions", "6.fraction-decimal-percent"],
    description: "Find the theoretical probability of a simple event as a fraction, decimal or percent between 0 and 1, and the probability that it does not happen." },
  { id: "7.compound-probability", name: "Probability of compound events", grade: 7, strand: "statistics", standard: "7.SP.8", nad: "7.DSP.3", prereqs: ["7.probability", "f.multiply-fractions"],
    description: "Find probabilities of compound events using organized lists, tables or tree diagrams (described in words), and count outcomes in a sample space." },


  // ---------- Grade 7: deeper and challenge skills (5–6 per NAD standard) ----------
  // 7.NO.1
  { id: "7.rational-distance", name: "Distance between rational numbers", grade: 7, strand: "numbers", standard: "7.NS.1b, 7.NS.1c", nad: "7.NO.1", prereqs: ["7.add-integers", "6.absolute-value"],
    description: "Find the distance between two rational numbers as the absolute value of their difference, like the change from -8°F to 5°F." },
  { id: "7.signed-order-of-operations", name: "Order of operations with negative numbers", grade: 7, strand: "numbers", standard: "7.NS.3", nad: "7.NO.1", prereqs: ["7.add-integers", "7.multiply-integers", "f.order-of-operations"],
    description: "Evaluate expressions with negative integers, fractions and decimals using the order of operations, like -3 + 4(-2)^2 ÷ 8." },
  { id: "7.signed-fraction-division", name: "Dividing signed fractions", grade: 7, strand: "numbers", standard: "7.NS.2b", nad: "7.NO.1", prereqs: ["7.multiply-integers"], advanced: true,
    description: "Divide positive and negative fractions and mixed numbers, and recognize that -(p/q) = (-p)/q = p/(-q)." },
  // 7.NO.2
  { id: "7.additive-inverses", name: "Opposites and additive inverses", grade: 7, strand: "numbers", standard: "7.NS.1a, 7.NS.1b", nad: "7.NO.2", prereqs: ["7.add-integers"],
    description: "Recognize that a number and its opposite add to 0, and describe situations where quantities combine to make 0 (a gain and a loss of the same amount)." },
  { id: "7.sign-reasoning", name: "Predict the sign of a result", grade: 7, strand: "numbers", standard: "7.NS.2a", nad: "7.NO.2", prereqs: ["7.multiply-integers"], advanced: true,
    description: "Decide whether a sum, product or quotient is positive, negative or zero without computing it, including products of many negative factors." },
  { id: "7.rational-multistep", name: "Multi-step problems with signed numbers", grade: 7, strand: "numbers", standard: "7.NS.3", nad: "7.NO.2", prereqs: ["7.rational-word-problems", "7.signed-order-of-operations"], advanced: true,
    description: "Solve real problems that need several operations on positive and negative rational numbers, like average daily temperature change or an account balance over several weeks." },
  // 7.NO.3
  { id: "7.squares-cubes", name: "Perfect squares and perfect cubes", grade: 7, strand: "expressions", standard: "8.EE.2", nad: "7.NO.3", prereqs: ["6.exponents"],
    description: "Recognize perfect squares to 225 and perfect cubes to 1000, and evaluate squares and cubes of fractions and decimals." },
  { id: "7.negative-powers-of-ten", name: "Positive and negative powers of 10", grade: 7, strand: "numbers", standard: "8.EE.1, 8.EE.3", nad: "7.NO.3", prereqs: ["f.powers-of-ten", "6.exponents"],
    description: "Write numbers like 0.001 as 10^-3 and 10,000 as 10^4, and multiply or divide decimals by powers of 10." },
  { id: "7.compare-scientific", name: "Compare numbers in scientific notation", grade: 7, strand: "numbers", standard: "8.EE.3", nad: "7.NO.3", prereqs: ["7.scientific-notation"], advanced: true,
    description: "Order and compare numbers written in scientific notation, and estimate how many times larger one is than another using powers of 10." },
  { id: "7.exponent-order-of-operations", name: "Order of operations with powers and roots", grade: 7, strand: "expressions", standard: "8.EE.2", nad: "7.NO.3", prereqs: ["7.exponents-roots", "7.signed-order-of-operations"], advanced: true,
    description: "Evaluate expressions that combine powers, square roots and negative numbers, like 2√49 - 3^2 or (-2)^3 + √16." },
  // 7.NO.4
  { id: "7.solve-proportions", name: "Solve proportions", grade: 7, strand: "ratios", standard: "7.RP.2", nad: "7.NO.4", prereqs: ["7.proportional"],
    description: "Solve proportions like x/12 = 5/8 with cross products or scaling, including word problems." },
  // 7.OAT.1
  { id: "7.factor-expressions", name: "Factor linear expressions", grade: 7, strand: "expressions", standard: "7.EE.1", nad: "7.OAT.1", prereqs: ["7.like-terms", "6.factor-sums-gcf"],
    description: "Factor expressions like 6x + 9 = 3(2x + 3) and -4x + 12 = -4(x - 3), including factoring out a negative." },
  { id: "7.subtract-expressions", name: "Subtract expressions with parentheses", grade: 7, strand: "expressions", standard: "7.EE.1", nad: "7.OAT.1", prereqs: ["7.like-terms"],
    description: "Add and subtract linear expressions in parentheses, like (5x - 3) - (2x - 7), distributing the negative to every term." },
  { id: "7.expressions-in-context", name: "Write expressions for real situations", grade: 7, strand: "expressions", standard: "7.EE.2", nad: "7.OAT.1", prereqs: ["7.rewrite-expressions"], advanced: true,
    description: "Write and simplify an expression for a situation, like the perimeter of a figure with sides in terms of x or the price after a discount and tax." },
  // 7.OAT.2
  { id: "7.equations-with-parentheses", name: "Equations with parentheses", grade: 7, strand: "equations", standard: "7.EE.4a", nad: "7.OAT.2", prereqs: ["7.two-step-equations", "6.equivalent-expressions"],
    description: "Solve equations of the form p(x + q) = r with negative and fractional values, either by distributing or by dividing first." },
  { id: "7.equations-fractions-decimals", name: "Equations with fractions and decimals", grade: 7, strand: "equations", standard: "7.EE.4a", nad: "7.OAT.2", prereqs: ["7.two-step-equations"],
    description: "Solve two-step equations with fraction and decimal coefficients, like (1/3)x - 2 = 5 or 0.4x + 1.2 = 3." },
  { id: "7.equation-word-problems", name: "Write two-step equations from word problems", grade: 7, strand: "equations", standard: "7.EE.4a", nad: "7.OAT.2", prereqs: ["7.two-step-equations"], advanced: true,
    description: "Write and solve a two-step equation for a real situation (a fee plus a rate, a perimeter), and pick the equation that matches a story." },
  // 7.OAT.3
  { id: "7.input-output-rules", name: "Input–output rules", grade: 7, strand: "functions", standard: "8.F.1", nad: "7.OAT.3", prereqs: ["7.patterns"],
    description: "Find the rule for an input–output table that needs two operations, like multiply by 3 then subtract 2, and use it to fill in missing values." },
  { id: "7.inequality-word-problems", name: "Inequality word problems", grade: 7, strand: "equations", standard: "7.EE.4b", nad: "7.OAT.3", prereqs: ["7.inequalities"],
    description: "Write and solve a two-step inequality for a situation using phrases like at most, at least, no more than." },
  { id: "7.interpret-inequality-solutions", name: "Interpret inequality solutions", grade: 7, strand: "equations", standard: "7.EE.4b", nad: "7.OAT.3", prereqs: ["7.inequality-word-problems"], advanced: true,
    description: "Interpret the solution set in context, like the greatest whole number of tickets you can buy, and describe the graph of the solution in words." },
  // 7.M.1
  { id: "7.metric-prefixes", name: "Metric prefixes", grade: 7, strand: "measurement", standard: "5.MD.1", nad: "7.M.1", prereqs: ["f.powers-of-ten"],
    description: "Use kilo-, hecto-, deka-, deci-, centi- and milli- to convert metric lengths, masses and capacities by powers of 10." },
  { id: "7.rate-conversion", name: "Convert rates", grade: 7, strand: "measurement", standard: "6.RP.3d", nad: "7.M.1", prereqs: ["7.unit-conversion"], advanced: true,
    description: "Convert rates using two conversion factors, like feet per second to miles per hour or liters per minute to liters per hour." },
  { id: "7.area-volume-units", name: "Convert area and volume units", grade: 7, strand: "measurement", standard: "6.RP.3d", nad: "7.M.1", prereqs: ["7.unit-conversion", "6.area-polygons"], advanced: true,
    description: "Convert square and cubic units, like square feet to square yards (divide by 9) or cubic feet to cubic inches (multiply by 1728)." },
  // 7.GEO.1
  { id: "7.rescale-drawings", name: "Redraw at a different scale", grade: 7, strand: "geometry", standard: "7.G.1", nad: "7.GEO.1", prereqs: ["7.scale-drawings"], advanced: true,
    description: "Find new drawing lengths when a scale drawing is redrawn with a different scale, and compare areas at the two scales." },
  { id: "7.unique-triangles", name: "When conditions make a unique triangle", grade: 7, strand: "geometry", standard: "7.G.2", nad: "7.GEO.1", prereqs: ["7.triangles"], advanced: true,
    description: "Decide whether given side and angle measures make one triangle, more than one, or none (for example three angles alone give many triangles)." },
  // 7.GEO.2
  { id: "7.angle-equations", name: "Multi-step angle equations", grade: 7, strand: "geometry", standard: "7.G.5", nad: "7.GEO.2", prereqs: ["7.angle-relationships", "7.two-step-equations"], advanced: true,
    description: "Write and solve equations for angles given as expressions, like (2x + 10)° and (3x - 5)° being supplementary, then find each angle." },
  { id: "7.circle-problems", name: "Circle word problems", grade: 7, strand: "geometry", standard: "7.G.4", nad: "7.GEO.2", prereqs: ["7.circles"], advanced: true,
    description: "Solve circle problems like how far a wheel rolls in 10 turns, the radius from a given circumference, or the area of a ring. The stem must say to use 3.14 for π and how to round." },
  // 7.DSP.1
  { id: "7.sampling-methods", name: "Sampling methods", grade: 7, strand: "statistics", standard: "7.SP.1", nad: "7.DSP.1", prereqs: ["6.statistical-questions"],
    description: "Identify simple random, systematic, convenience and voluntary samples, and decide which is most likely to be representative." },
  { id: "7.biased-questions", name: "Biased survey questions", grade: 7, strand: "statistics", standard: "7.SP.1", nad: "7.DSP.1", prereqs: ["7.sampling-methods"],
    description: "Recognize survey questions and situations that push people toward an answer, and choose a fair way to ask." },
  { id: "7.sample-variation", name: "Variation between samples", grade: 7, strand: "statistics", standard: "7.SP.2", nad: "7.DSP.1", prereqs: ["7.sampling"], advanced: true,
    description: "Use the results of several random samples (listed in the stem) to estimate a population value and judge how much estimates vary, including why larger samples vary less." },
  { id: "7.mark-recapture", name: "Estimate a population size", grade: 7, strand: "statistics", standard: "7.SP.2", nad: "7.DSP.1", prereqs: ["7.sampling", "7.solve-proportions"], advanced: true,
    description: "Estimate the size of a population with mark-and-recapture (tag 40 fish, later 6 of 50 caught are tagged) using a proportion." },
  // 7.DSP.2
  { id: "7.compare-box-plots", name: "Compare box plots", grade: 7, strand: "statistics", standard: "7.SP.3, 7.SP.4", nad: "7.DSP.2", prereqs: ["6.box-plots"],
    description: "Compare two groups from their five-number summaries: medians, IQRs, ranges and how much they overlap." },
  { id: "7.choose-measures", name: "Choose measures to compare groups", grade: 7, strand: "statistics", standard: "7.SP.4", nad: "7.DSP.2", prereqs: ["7.compare-populations"],
    description: "Decide whether to compare groups with mean and MAD or median and IQR, based on outliers and skew." },
  { id: "7.overlap-mads", name: "Measure overlap in MADs", grade: 7, strand: "statistics", standard: "7.SP.3", nad: "7.DSP.2", prereqs: ["7.compare-populations", "6.interpret-spread"], advanced: true,
    description: "Express the difference between two means as a multiple of the MAD, and say whether the groups overlap a lot or a little." },
  { id: "7.sample-comparisons", name: "Comparative inferences from samples", grade: 7, strand: "statistics", standard: "7.SP.4", nad: "7.DSP.2", prereqs: ["7.compare-populations", "7.sampling"], advanced: true,
    description: "Use random samples from two populations to decide whether one population is likely different from the other, like comparing word lengths in two books." },
  // 7.DSP.3
  { id: "7.likelihood", name: "Likelihood and the probability scale", grade: 7, strand: "statistics", standard: "7.SP.5", nad: "7.DSP.3", prereqs: ["f.equiv-fractions"],
    description: "Describe events as impossible, unlikely, equally likely, likely or certain, and match them to probabilities from 0 to 1." },
  { id: "7.experimental-probability", name: "Experimental probability", grade: 7, strand: "statistics", standard: "7.SP.6", nad: "7.DSP.3", prereqs: ["7.probability"],
    description: "Find experimental probability from trial results, compare it with theoretical probability, and predict results of future trials." },
  { id: "7.probability-models", name: "Probability models", grade: 7, strand: "statistics", standard: "7.SP.7", nad: "7.DSP.3", prereqs: ["7.experimental-probability"], advanced: true,
    description: "Build a probability model from outcomes or observed frequencies, decide whether outcomes are equally likely, and explain differences between the model and results." },
  { id: "7.simulations", name: "Simulations", grade: 7, strand: "statistics", standard: "7.SP.8c", nad: "7.DSP.3", prereqs: ["7.compound-probability", "7.experimental-probability"], advanced: true,
    description: "Choose a simulation that models a real event (coins, number cubes, random numbers) and estimate a compound probability from simulation results given in the stem." },

  // ---------- Grade 7: more practice skills (10–12 per NAD standard) ----------
  // 7.NO.1
  { id: "7.integer-number-line", name: "Add integers on a number line", grade: 7, strand: "numbers", standard: "7.NS.1a, 7.NS.1b", nad: "7.NO.1", prereqs: ["6.integers"],
    description: "Model adding and subtracting integers as moves on a number line: p + q is |q| units from p, to the right if q is positive and to the left if negative." },
  { id: "7.subtract-as-adding", name: "Subtract by adding the opposite", grade: 7, strand: "numbers", standard: "7.NS.1c", nad: "7.NO.1", prereqs: ["7.add-integers"],
    description: "Rewrite subtraction as adding the opposite, including subtracting negatives like 5 − (−8) and −2.5 − 4.25, and with fractions." },
  { id: "7.powers-of-negatives", name: "Powers of negative numbers", grade: 7, strand: "numbers", standard: "7.NS.2", nad: "7.NO.1", prereqs: ["7.multiply-integers", "6.exponents"],
    description: "Evaluate powers like (−2)^3, (−3)^2 and −3^2, and predict the sign of a power of a negative number." },
  { id: "7.add-several-signed", name: "Add several signed numbers", grade: 7, strand: "numbers", standard: "7.NS.1d", nad: "7.NO.1", prereqs: ["7.add-integers"],
    description: "Add a list of positive and negative numbers efficiently by grouping: combine the positives, combine the negatives, and cancel opposites." },
  { id: "7.signed-expressions", name: "Expressions with signed fractions and decimals", grade: 7, strand: "numbers", standard: "7.NS.3", nad: "7.NO.1", prereqs: ["7.signed-order-of-operations", "7.powers-of-negatives"], advanced: true,
    description: "Evaluate multi-operation expressions that mix negative fractions, decimals and powers, like −3/4 + 2(−0.5)^2." },
  // 7.NO.2
  { id: "7.properties-mental-math", name: "Mental math with properties", grade: 7, strand: "numbers", standard: "7.NS.2c", nad: "7.NO.2", prereqs: ["7.number-properties"],
    description: "Use the distributive, commutative and associative properties to compute mentally, like 8 × 99, 25 × 4.6 × 4 or 3.7 + 5.8 + 6.3." },
  { id: "7.multiplicative-inverses", name: "Multiplicative inverses", grade: 7, strand: "numbers", standard: "7.NS.2", nad: "7.NO.2", prereqs: ["7.multiply-integers", "6.reciprocals"],
    description: "Find the multiplicative inverse of signed fractions, decimals and mixed numbers, and rewrite division as multiplying by the inverse." },
  { id: "7.change-per-unit", name: "Average change over time", grade: 7, strand: "numbers", standard: "7.NS.3", nad: "7.NO.2", prereqs: ["7.multiply-integers"],
    description: "Find the average change per hour, day or step from a total change (the temperature fell 18° in 6 hours) and use it to predict later values." },
  { id: "7.negative-fraction-forms", name: "Equivalent forms of negative fractions", grade: 7, strand: "numbers", standard: "7.NS.2b", nad: "7.NO.2", prereqs: ["7.multiply-integers"],
    description: "Recognize that −(p/q), (−p)/q and p/(−q) are equal, and that dividing by zero is undefined." },
  { id: "7.compare-without-computing", name: "Compare signed expressions without computing", grade: 7, strand: "numbers", standard: "7.NS.2, 7.NS.3", nad: "7.NO.2", prereqs: ["7.sign-reasoning"], advanced: true,
    description: "Decide which of two expressions is greater, like −3 × 0.9 or −3, or −8 ÷ 0.5 or −8 × 0.5, by reasoning about sign and size." },
  // 7.NO.3
  { id: "7.estimate-powers-of-ten", name: "Estimate with powers of 10", grade: 7, strand: "numbers", standard: "8.EE.3", nad: "7.NO.3", prereqs: ["7.negative-powers-of-ten"],
    description: "Estimate very large or very small quantities as a single digit times a power of 10, like the world's population ≈ 8 × 10^9 or a cell ≈ 1 × 10^−5 m." },
  { id: "7.root-equations", name: "Square and cube root equations", grade: 7, strand: "expressions", standard: "8.EE.2", nad: "7.NO.3", prereqs: ["7.squares-cubes"],
    description: "Solve equations like x^2 = 49 (x = 7 or −7) and x^3 = 64 using square and cube roots of perfect squares and cubes." },
  { id: "7.exponential-form", name: "Exponential and expanded form", grade: 7, strand: "expressions", standard: "8.EE.1", nad: "7.NO.3", prereqs: ["6.exponents"],
    description: "Write repeated factors in exponential form and back, including bases that are fractions, decimals and negative numbers, like (2/3)^3." },
  { id: "7.calculator-notation", name: "Scientific notation on calculators", grade: 7, strand: "numbers", standard: "8.EE.4", nad: "7.NO.3", prereqs: ["7.scientific-notation"],
    description: "Read calculator and computer displays like 4.5E−3 or 2.1E8 as scientific notation and write them in standard form." },
  { id: "7.exponent-growth", name: "Repeated doubling and tripling", grade: 7, strand: "expressions", standard: "8.EE.1", nad: "7.NO.3", prereqs: ["7.exponential-form"], advanced: true,
    description: "Model repeated doubling or tripling (bacteria, a message forwarded to 3 friends) with powers, and find the amount after n steps or the step when it passes a value." },
  // 7.NO.4
  { id: "7.percent-error", name: "Percent error", grade: 7, strand: "ratios", standard: "7.RP.3", nad: "7.NO.4", prereqs: ["7.percent-problems"],
    description: "Find the percent error between an estimate or measurement and the actual value." },
  { id: "7.markup-markdown", name: "Markup, markdown and tips", grade: 7, strand: "ratios", standard: "7.RP.3", nad: "7.NO.4", prereqs: ["7.percent-problems"],
    description: "Find the selling price after a markup, the sale price after a markdown and the total with a tip, and find the original price from the final price." },
  { id: "7.proportional-graph-points", name: "What points on a proportional graph mean", grade: 7, strand: "ratios", standard: "7.RP.2d", nad: "7.NO.4", prereqs: ["7.constant-proportionality", "6.coordinate-plane"],
    description: "Explain what (0, 0) and (1, r) mean on the graph of a proportional relationship, and read the unit rate from any point (x, y)." },
  { id: "7.scale-recipes", name: "Recipes and mixtures", grade: 7, strand: "ratios", standard: "7.RP.1", nad: "7.NO.4", prereqs: ["7.complex-rates"],
    description: "Scale recipes and mixtures with fraction amounts, and find the amount per one unit, like cups of flour per batch." },
  { id: "7.successive-percents", name: "Two percent changes in a row", grade: 7, strand: "ratios", standard: "7.RP.3", nad: "7.NO.4", prereqs: ["7.markup-markdown"], advanced: true,
    description: "Apply two percent changes in a row (20% off, then 10% off; up 10%, then down 10%) and compare the result with a single change." },
  { id: "7.interest-unknowns", name: "Find the rate, time or principal", grade: 7, strand: "ratios", standard: "7.RP.3", nad: "7.NO.4", prereqs: ["7.interest"], advanced: true,
    description: "Use I = Prt to find the interest rate, the time or the principal when the other values are known." },
  // 7.OAT.1
  { id: "7.distribute-negatives", name: "Distribute with negative numbers", grade: 7, strand: "expressions", standard: "7.EE.1", nad: "7.OAT.1", prereqs: ["7.like-terms", "7.multiply-integers"],
    description: "Expand expressions like −3(2x − 5) and −(x + 4), then combine like terms." },
  { id: "7.fraction-coefficients", name: "Fraction and decimal coefficients", grade: 7, strand: "expressions", standard: "7.EE.1", nad: "7.OAT.1", prereqs: ["7.like-terms"],
    description: "Combine like terms such as (1/2)x + (3/4)x − 0.2x and expand (2/3)(6x − 9)." },
  { id: "7.evaluate-signed-values", name: "Evaluate expressions with negative values", grade: 7, strand: "expressions", standard: "7.EE.1, 7.NS.3", nad: "7.OAT.1", prereqs: ["6.expressions", "7.signed-order-of-operations"],
    description: "Substitute negative numbers and fractions into expressions like 3x^2 − 2y or (a − b)/c and evaluate." },
  { id: "7.equivalent-or-not", name: "Are the expressions equivalent?", grade: 7, strand: "expressions", standard: "7.EE.1", nad: "7.OAT.1", prereqs: ["7.like-terms"],
    description: "Decide whether two expressions are equivalent by simplifying or by testing values, and pick all the expressions equivalent to a given one." },
  { id: "7.geometry-expressions", name: "Expressions for perimeter and area", grade: 7, strand: "expressions", standard: "7.EE.2", nad: "7.OAT.1", prereqs: ["7.like-terms", "7.rewrite-expressions"], advanced: true,
    description: "Write and simplify expressions for the perimeter or area of figures with side lengths like x + 3 and 2x − 1." },
  // 7.OAT.2
  { id: "7.equation-steps", name: "Steps for solving an equation", grade: 7, strand: "equations", standard: "7.EE.4a", nad: "7.OAT.2", prereqs: ["7.two-step-equations"],
    description: "Choose the correct first step for an equation, or find the step where a worked solution went wrong." },
  { id: "7.negative-equations", name: "Two-step equations with negative numbers", grade: 7, strand: "equations", standard: "7.EE.4a", nad: "7.OAT.2", prereqs: ["7.two-step-equations"],
    description: "Solve equations like −4x + 7 = −13 and x/(−3) − 2 = 5, where coefficients, constants or answers are negative." },
  { id: "7.use-formulas", name: "Find an unknown in a formula", grade: 7, strand: "equations", standard: "7.EE.4a", nad: "7.OAT.2", prereqs: ["7.two-step-equations", "6.evaluate-formulas"],
    description: "Use a formula like P = 2l + 2w or C = 2πr to find an unknown value when the others are given." },
  { id: "7.equation-models", name: "Match an equation to a situation", grade: 7, strand: "equations", standard: "7.EE.4a", nad: "7.OAT.2", prereqs: ["7.two-step-equations"],
    description: "Choose the equation that models a situation, like px + q = r for a fee plus a rate, or p(x + q) = r for equal groups that each get extra." },
  { id: "7.consecutive-numbers", name: "Consecutive number problems", grade: 7, strand: "equations", standard: "7.EE.4a", nad: "7.OAT.2", prereqs: ["7.equation-word-problems"], advanced: true,
    description: "Find consecutive whole numbers, or consecutive even or odd numbers, with a given sum by writing and solving an equation." },
  // 7.OAT.3
  { id: "7.graph-inequality-solutions", name: "Graph inequality solutions", grade: 7, strand: "equations", standard: "7.EE.4b", nad: "7.OAT.3", prereqs: ["7.inequalities"],
    description: "Describe the graph of a solution set (open or closed circle, which direction) and pick the inequality that matches a described graph." },
  { id: "7.reverse-inequality", name: "Multiply or divide by a negative", grade: 7, strand: "equations", standard: "7.EE.4b", nad: "7.OAT.3", prereqs: ["7.inequalities"],
    description: "Solve inequalities where you multiply or divide by a negative number and the sign reverses, like −3x > 12 or −x/2 ≤ 5." },
  { id: "7.arithmetic-sequences", name: "Arithmetic sequences", grade: 7, strand: "functions", standard: "8.F.1", nad: "7.OAT.3", prereqs: ["7.patterns"],
    description: "Find the common difference, a rule for the nth term and a later term of an arithmetic sequence, including decreasing sequences." },
  { id: "7.figure-patterns", name: "Growing shape patterns", grade: 7, strand: "functions", standard: "8.F.1", nad: "7.OAT.3", prereqs: ["7.patterns"],
    description: "Find a rule for a growing pattern described in words (each figure adds 3 tiles to the one before) and the number of tiles in figure n." },
  { id: "7.between-inequalities", name: "Values between two limits", grade: 7, strand: "equations", standard: "7.EE.4b", nad: "7.OAT.3", prereqs: ["7.inequality-word-problems"], advanced: true,
    description: "Write and interpret 'between' situations like 3 < x ≤ 8, and find the whole-number values that meet two conditions at once." },
  // 7.M.1
  { id: "7.capacity-weight", name: "Capacity and weight", grade: 7, strand: "measurement", standard: "6.RP.3d", nad: "7.M.1", prereqs: ["7.unit-conversion"],
    description: "Convert cups, pints, quarts and gallons, ounces, pounds and tons, and liters and milliliters." },
  { id: "7.mixed-units", name: "Mixed units", grade: 7, strand: "measurement", standard: "6.RP.3d", nad: "7.M.1", prereqs: ["7.unit-conversion"],
    description: "Add, subtract and convert measurements in mixed units, like 5 ft 8 in + 2 ft 7 in or 3 lb 12 oz − 1 lb 15 oz." },
  { id: "7.temperature", name: "Fahrenheit and Celsius", grade: 7, strand: "measurement", standard: "6.RP.3d, 7.EE.4", nad: "7.M.1", prereqs: ["7.unit-conversion", "6.evaluate-formulas"],
    description: "Convert temperatures with F = (9/5)C + 32 and C = (5/9)(F − 32), and compare temperatures given in different scales." },
  { id: "7.sensible-units", name: "Choose sensible units", grade: 7, strand: "measurement", standard: "6.RP.3d", nad: "7.M.1", prereqs: ["7.metric-prefixes"],
    description: "Choose a sensible unit and estimate (is a door 2 m or 20 m tall?), and order measurements given in different units." },
  { id: "7.chain-conversions", name: "Multi-step unit conversions", grade: 7, strand: "measurement", standard: "6.RP.3d", nad: "7.M.1", prereqs: ["7.rate-conversion"], advanced: true,
    description: "Chain conversion factors, like miles per hour to feet per second or dollars per pound to cents per ounce." },
  // 7.GEO.1
  { id: "7.find-scale", name: "Find the scale", grade: 7, strand: "geometry", standard: "7.G.1", nad: "7.GEO.1", prereqs: ["7.scale-drawings"],
    description: "Find the scale or scale factor from a drawing length and the actual length, with units, like 2 cm : 5 m." },
  { id: "7.scale-area", name: "Area from a scale drawing", grade: 7, strand: "geometry", standard: "7.G.1", nad: "7.GEO.1", prereqs: ["7.scale-drawings", "6.area-polygons"],
    description: "Find actual areas from a scale drawing, noticing that areas scale by the square of the scale factor." },
  { id: "7.triangle-inequality", name: "Can these sides make a triangle?", grade: 7, strand: "geometry", standard: "7.G.2", nad: "7.GEO.1", prereqs: ["7.triangles"],
    description: "Use the triangle inequality to decide whether three lengths make a triangle and to find the possible range of a third side." },
  { id: "7.classify-quadrilaterals", name: "Classify quadrilaterals", grade: 7, strand: "geometry", standard: "7.G.2", nad: "7.GEO.1", prereqs: ["f.classify-shapes"],
    description: "Classify quadrilaterals by sides and angles, and decide whether statements like 'a rhombus is a square' are always, sometimes or never true." },
  { id: "7.map-scale", name: "Map scale problems", grade: 7, strand: "geometry", standard: "7.G.1", nad: "7.GEO.1", prereqs: ["7.find-scale"], advanced: true,
    description: "Use a map scale to find real distances and travel times, and convert a drawing from one scale to another." },
  // 7.GEO.2
  { id: "7.circle-parts", name: "Radius, diameter and pi", grade: 7, strand: "geometry", standard: "7.G.4", nad: "7.GEO.2", prereqs: ["6.decimal-operations"],
    description: "Use the relationship between radius and diameter, and understand pi as circumference ÷ diameter (about 3.14 or 22/7)." },
  { id: "7.volume-triangular-prisms", name: "Volume of triangular prisms", grade: 7, strand: "geometry", standard: "7.G.6", nad: "7.GEO.2", prereqs: ["6.volume-prisms", "6.area-polygons"],
    description: "Find the volume of triangular and other right prisms as base area × height." },
  { id: "7.surface-area-triangular", name: "Surface area of triangular prisms and pyramids", grade: 7, strand: "geometry", standard: "7.G.6", nad: "7.GEO.2", prereqs: ["6.surface-area"],
    description: "Find the surface area of triangular prisms and square or triangular pyramids from their dimensions." },
  { id: "7.semicircles", name: "Semicircles and quarter circles", grade: 7, strand: "geometry", standard: "7.G.4, 7.G.6", nad: "7.GEO.2", prereqs: ["7.circles"],
    description: "Find the perimeter and area of semicircles and quarter circles, remembering to include the straight edges in the perimeter." },
  { id: "7.area-from-circumference", name: "Area from circumference", grade: 7, strand: "geometry", standard: "7.G.4", nad: "7.GEO.2", prereqs: ["7.circles"], advanced: true,
    description: "Find the area of a circle when given its circumference, or the circumference when given its area." },
  // 7.DSP.1
  { id: "7.population-sample", name: "Population and sample", grade: 7, strand: "statistics", standard: "7.SP.1", nad: "7.DSP.1", prereqs: ["6.statistical-questions"],
    description: "Name the population and the sample in a study, and decide whether surveying everyone or a sample makes sense." },
  { id: "7.representative-samples", name: "Is the sample representative?", grade: 7, strand: "statistics", standard: "7.SP.1", nad: "7.DSP.1", prereqs: ["7.sampling-methods"],
    description: "Decide whether a sample represents the population and how the sampling could be improved." },
  { id: "7.survey-percents", name: "Survey results as percents", grade: 7, strand: "statistics", standard: "7.SP.2", nad: "7.DSP.1", prereqs: ["6.percent"],
    description: "Turn survey counts into fractions and percents of the sample, and compare the results for different groups." },
  { id: "7.sample-size", name: "Larger samples and reliability", grade: 7, strand: "statistics", standard: "7.SP.2", nad: "7.DSP.1", prereqs: ["7.sampling"],
    description: "Explain why larger random samples give more reliable estimates, and pick the most reliable of several described samples." },
  { id: "7.estimate-range", name: "A likely range from several samples", grade: 7, strand: "statistics", standard: "7.SP.2", nad: "7.DSP.1", prereqs: ["7.sample-variation"], advanced: true,
    description: "Use the results of several random samples to give a likely range for a population value, and tell whether a claim fits that range." },
  // 7.DSP.2
  { id: "7.compare-dot-plots", name: "Compare dot plots", grade: 7, strand: "statistics", standard: "7.SP.3", nad: "7.DSP.2", prereqs: ["6.data-displays"],
    description: "Compare two data sets given as dot plot counts: their centers, spreads and how much they overlap." },
  { id: "7.compare-means-mads", name: "Compare means and MADs", grade: 7, strand: "statistics", standard: "7.SP.4", nad: "7.DSP.2", prereqs: ["6.mad-iqr"],
    description: "Find and compare the means and MADs of two small data sets, and say which group is typically higher and which is more consistent." },
  { id: "7.back-to-back-stem", name: "Back-to-back stem-and-leaf plots", grade: 7, strand: "statistics", standard: "7.SP.3", nad: "7.DSP.2", prereqs: ["6.stem-and-leaf"],
    description: "Read a back-to-back stem-and-leaf plot written as text and compare the two groups' medians and ranges." },
  { id: "7.supported-conclusions", name: "Which conclusion is supported?", grade: 7, strand: "statistics", standard: "7.SP.4", nad: "7.DSP.2", prereqs: ["7.compare-populations"],
    description: "Choose the statement a comparison supports and reject ones it doesn't (like 'every' versus 'typically')." },
  { id: "7.outliers-in-comparisons", name: "Outliers in comparisons", grade: 7, strand: "statistics", standard: "7.SP.4", nad: "7.DSP.2", prereqs: ["7.compare-means-mads", "6.range-outliers"], advanced: true,
    description: "Decide how an outlier changes a comparison between two groups and whether the median and IQR give a fairer comparison." },
  // 7.DSP.3
  { id: "7.complement", name: "Complement of an event", grade: 7, strand: "statistics", standard: "7.SP.5, 7.SP.7", nad: "7.DSP.3", prereqs: ["7.probability"],
    description: "Find P(not A) = 1 − P(A) and use it to solve problems." },
  { id: "7.sample-spaces", name: "Sample spaces and counting", grade: 7, strand: "statistics", standard: "7.SP.8b", nad: "7.DSP.3", prereqs: ["7.probability"],
    description: "List outcomes with organized lists or tables, and count outcomes with the counting principle (3 shirts × 4 pants)." },
  { id: "7.predict-outcomes", name: "Predict with probability", grade: 7, strand: "statistics", standard: "7.SP.6, 7.SP.7", nad: "7.DSP.3", prereqs: ["7.probability", "6.percent"],
    description: "Predict about how many times an event will happen in n trials, like rolling a 6 in 300 rolls." },
  { id: "7.theoretical-vs-experimental", name: "Theoretical or experimental?", grade: 7, strand: "statistics", standard: "7.SP.7b", nad: "7.DSP.3", prereqs: ["7.experimental-probability"],
    description: "Compare experimental results with the theoretical probability, and explain why they differ and what happens with more trials." },
  { id: "7.without-replacement", name: "Draws without replacement", grade: 7, strand: "statistics", standard: "7.SP.8", nad: "7.DSP.3", prereqs: ["7.compound-probability"], advanced: true,
    description: "Find the probability of two draws without replacement, like picking two red marbles in a row from a bag." },

  // ---------- Grade 8 ----------
  // 8.NO.1 Irrational numbers
  { id: "8.irrational", name: "Rational and irrational numbers", grade: 8, strand: "numbers", standard: "8.NS.1", nad: "8.NO.1", prereqs: ["6.repeating-decimals", "7.exponents-roots"],
    description: "Classify numbers as rational or irrational, including square roots, π, fractions and repeating decimals." },
  { id: "8.estimate-irrationals", name: "Estimate irrational numbers", grade: 8, strand: "numbers", standard: "8.NS.2", nad: "8.NO.1", prereqs: ["8.irrational"],
    description: "Estimate square roots and π to the nearest whole number or tenth, place them on a number line, and order them with rational numbers." },
  // 8.OAT.1 Radicals and integer exponents
  { id: "8.exponent-rules", name: "Integer exponent rules", grade: 8, strand: "expressions", standard: "8.EE.1", nad: "8.OAT.1", prereqs: ["7.exponents-roots", "7.multiply-integers"],
    description: "Use the product, quotient and power rules to simplify and evaluate expressions like 3^2 × 3^5 ÷ 3^4 and (2^3)^2." },
  { id: "8.roots", name: "Square roots and cube roots", grade: 8, strand: "expressions", standard: "8.EE.2", nad: "8.OAT.1", prereqs: ["7.exponents-roots"],
    description: "Solve x^2 = p and x^3 = p, and evaluate square roots of small perfect squares and cube roots of small perfect cubes." },
  { id: "8.scientific-operations", name: "Operations with scientific notation", grade: 8, strand: "numbers", standard: "8.EE.3, 8.EE.4", nad: "8.OAT.1", prereqs: ["7.scientific-notation", "8.exponent-rules"],
    description: "Multiply, divide, add and subtract numbers in scientific notation, giving the answer in scientific notation." },
  // 8.OAT.2 Proportional relationships, slope and lines
  { id: "8.slope", name: "Slope", grade: 8, strand: "functions", standard: "8.EE.6, 8.F.4", nad: "8.OAT.2", prereqs: ["7.constant-proportionality", "7.multiply-integers"],
    description: "Find slope from a graph, a table, or two points." },
  { id: "8.proportional-graphs", name: "Graph and compare proportional relationships", grade: 8, strand: "functions", standard: "8.EE.5", nad: "8.OAT.2", prereqs: ["7.constant-proportionality", "8.slope"],
    description: "Interpret the unit rate as the slope and compare proportional relationships shown in different ways." },
  { id: "8.slope-intercept", name: "Slope-intercept form", grade: 8, strand: "functions", standard: "8.EE.6, 8.F.4", nad: "8.OAT.2", prereqs: ["8.slope", "7.two-step-equations"],
    description: "Write y = mx + b from a graph, table, two points or a word problem, and interpret m and b." },
  // 8.OAT.3 Linear equations and systems
  { id: "8.multi-step-equations", name: "Equations with variables on both sides", grade: 8, strand: "equations", standard: "8.EE.7b", nad: "8.OAT.3", prereqs: ["7.two-step-equations", "7.like-terms"],
    description: "Solve multi-step linear equations with variables on both sides and rational coefficients." },
  { id: "8.solution-types", name: "One, none, or infinitely many solutions", grade: 8, strand: "equations", standard: "8.EE.7a", nad: "8.OAT.3", prereqs: ["8.multi-step-equations"],
    description: "Decide whether a linear equation has one solution, no solution, or infinitely many solutions." },
  { id: "8.systems", name: "Systems of equations", grade: 8, strand: "equations", standard: "8.EE.8", nad: "8.OAT.3", prereqs: ["8.slope-intercept", "8.multi-step-equations"],
    description: "Solve simple systems of two linear equations by graphing or substitution, and interpret the solution." },
  // 8.OAT.4 Functions
  { id: "8.functions", name: "What is a function", grade: 8, strand: "functions", standard: "8.F.1", nad: "8.OAT.4", prereqs: ["6.variables", "6.coordinate-plane"],
    description: "Decide whether a set of ordered pairs, a table or a rule is a function (each input has exactly one output), and evaluate a function for a given input." },
  { id: "8.compare-functions", name: "Compare functions", grade: 8, strand: "functions", standard: "8.F.2", nad: "8.OAT.4", prereqs: ["8.functions", "8.slope-intercept"],
    description: "Compare the rate of change or initial value of two linear functions given in different forms (equation, table, words)." },
  { id: "8.linear-nonlinear", name: "Linear and nonlinear functions", grade: 8, strand: "functions", standard: "8.F.3", nad: "8.OAT.4", prereqs: ["8.functions", "8.slope"],
    description: "Decide whether a function given as an equation or table is linear or nonlinear (like y = x^2 or y = 2^x)." },
  { id: "8.function-models", name: "Model with linear functions", grade: 8, strand: "functions", standard: "8.F.4", nad: "8.OAT.4", prereqs: ["8.slope-intercept"],
    description: "Write a linear function for a real situation (a starting fee plus a rate) and interpret the rate of change and initial value." },
  { id: "8.describe-graphs", name: "Describe graphs of functions", grade: 8, strand: "functions", standard: "8.F.5", nad: "8.OAT.4", prereqs: ["8.functions"],
    description: "Match a situation described in words to how its graph behaves (increasing, decreasing, constant, linear or not), multiple choice." },
  // 8.M.1 Significant digits
  { id: "8.significant-digits", name: "Significant digits and precision", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["f.decimal-place-value", "7.scientific-notation"],
    description: "Count the significant digits in a measurement, including numbers with leading, trailing and in-between zeros." },
  // 8.GEO.1 Congruence and similarity
  { id: "8.transformations", name: "Translations, reflections and rotations", grade: 8, strand: "geometry", standard: "8.G.1, 8.G.3", nad: "8.GEO.1", prereqs: ["6.coordinate-plane"],
    description: "Find the image of a point after a translation, a reflection across an axis, or a rotation of 90° or 180° about the origin, using coordinates." },
  { id: "8.dilations", name: "Dilations", grade: 8, strand: "geometry", standard: "8.G.3", nad: "8.GEO.1", prereqs: ["8.transformations", "7.scale-drawings"],
    description: "Find the image of a point after a dilation centered at the origin, find the scale factor, and tell whether it is an enlargement or reduction." },
  { id: "8.congruence-similarity", name: "Congruent and similar figures", grade: 8, strand: "geometry", standard: "8.G.2, 8.G.4", nad: "8.GEO.1", prereqs: ["8.transformations", "8.dilations"],
    description: "Decide whether figures are congruent or similar, and use similar figures to find a missing side length." },
  { id: "8.angle-facts", name: "Angles in triangles and parallel lines", grade: 8, strand: "geometry", standard: "8.G.5", nad: "8.GEO.1", prereqs: ["7.angle-relationships"],
    description: "Use the triangle angle sum, exterior angles, and angles formed when a transversal crosses parallel lines (described in words) to find unknown angles." },
  // 8.GEO.2 Pythagorean theorem
  { id: "8.pythagorean", name: "Pythagorean theorem", grade: 8, strand: "geometry", standard: "8.G.7", nad: "8.GEO.2", prereqs: ["8.roots", "6.area-polygons"],
    description: "Find a missing side of a right triangle, including real-world problems (ladders, diagonals). The stem must say how to round when the answer isn't whole." },
  { id: "8.pythagorean-converse", name: "Converse of the Pythagorean theorem", grade: 8, strand: "geometry", standard: "8.G.6", nad: "8.GEO.2", prereqs: ["8.pythagorean"],
    description: "Decide whether three side lengths make a right triangle." },
  { id: "8.distance", name: "Distance between two points", grade: 8, strand: "geometry", standard: "8.G.8", nad: "8.GEO.2", prereqs: ["8.pythagorean", "6.coordinate-plane"],
    description: "Find the distance between two points given as ordered pairs using the Pythagorean theorem." },
  // 8.GEO.3 Volume of cylinders, cones, spheres
  { id: "8.volume-curved", name: "Mixed volume problems (cylinders, cones, spheres)", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["8.volume-cylinder", "8.volume-cone", "8.volume-sphere"],
    description: "Choose the right formula and find the volume when cylinders, cones and spheres are mixed in one set of problems. The stem must say to use 3.14 for π and how to round." },
  // 8.DSP.1 Bivariate data
  { id: "8.scatter-plots", name: "Scatter plots and association", grade: 8, strand: "statistics", standard: "8.SP.1", nad: "8.DSP.1", prereqs: ["f.first-quadrant", "6.statistical-questions"],
    description: "Describe the association in paired data given as a table (positive, negative, none; linear or not), and spot outliers and clusters." },
  { id: "8.line-of-fit", name: "Lines of best fit", grade: 8, strand: "statistics", standard: "8.SP.2, 8.SP.3", nad: "8.DSP.1", prereqs: ["8.scatter-plots", "8.slope-intercept"],
    description: "Use the equation of a line of fit to make predictions, and interpret its slope and intercept in context." },
  { id: "8.two-way-tables", name: "Two-way tables", grade: 8, strand: "statistics", standard: "8.SP.4", nad: "8.DSP.1", prereqs: ["6.ratios", "6.percent"],
    description: "Read and complete two-way frequency tables, including missing counts and totals." },

  // ---------- Grade 8: deeper and challenge skills (5–6 per NAD standard) ----------
  // 8.NO.1
  { id: "8.repeating-to-fraction", name: "Repeating decimals to fractions", grade: 8, strand: "numbers", standard: "8.NS.1", nad: "8.NO.1", prereqs: ["8.irrational", "6.repeating-decimals"],
    description: "Convert repeating decimals like 0.272727... or 0.1666... to fractions in lowest terms." },
  { id: "8.real-number-system", name: "The real number system", grade: 8, strand: "numbers", standard: "8.NS.1", nad: "8.NO.1", prereqs: ["8.irrational"],
    description: "Classify numbers into natural, whole, integer, rational and irrational, and decide whether statements like \"every integer is rational\" are true." },
  { id: "8.irrational-expressions", name: "Estimate expressions with irrational numbers", grade: 8, strand: "numbers", standard: "8.NS.2", nad: "8.NO.1", prereqs: ["8.estimate-irrationals"], advanced: true,
    description: "Estimate and compare expressions like √50 vs 7.1, π^2, or 2√3, to the nearest tenth, by narrowing between squares." },
  // 8.OAT.1
  { id: "8.zero-negative-exponents", name: "Zero and negative exponents", grade: 8, strand: "expressions", standard: "8.EE.1", nad: "8.OAT.1", prereqs: ["7.negative-powers-of-ten", "7.exponents-roots"],
    description: "Evaluate expressions with zero and negative exponents, like 5^0, 2^-3 and (1/2)^-2, writing answers as fractions or whole numbers." },
  { id: "8.times-as-large", name: "How many times larger", grade: 8, strand: "numbers", standard: "8.EE.3", nad: "8.OAT.1", prereqs: ["7.compare-scientific", "8.exponent-rules"],
    description: "Use powers of 10 to estimate how many times larger one quantity is than another, like the population of the world vs a city." },
  { id: "8.scientific-units", name: "Scientific notation in science and technology", grade: 8, strand: "numbers", standard: "8.EE.4", nad: "8.OAT.1", prereqs: ["8.scientific-operations"], advanced: true,
    description: "Choose sensible units for very large or small measurements (millimeters vs kilometers, bytes vs gigabytes), and read calculator output like 3.5E6." },
  // 8.OAT.2
  { id: "8.slope-similar-triangles", name: "Slope and similar triangles", grade: 8, strand: "functions", standard: "8.EE.6", nad: "8.OAT.2", prereqs: ["8.slope", "8.congruence-similarity"], advanced: true,
    description: "Explain with similar right triangles (described in words) why the slope is the same between any two points on a line, and use it to find a missing coordinate." },
  { id: "8.graph-lines", name: "Graph lines from equations", grade: 8, strand: "functions", standard: "8.EE.6", nad: "8.OAT.2", prereqs: ["8.slope-intercept"],
    description: "Find intercepts and points on a line from its equation, decide whether a point is on the line, and rewrite an equation like 2x + y = 6 in slope-intercept form." },
  // 8.OAT.3
  { id: "8.equations-distribution", name: "Multi-step equations with distribution and fractions", grade: 8, strand: "equations", standard: "8.EE.7b", nad: "8.OAT.3", prereqs: ["8.multi-step-equations", "7.equations-with-parentheses"],
    description: "Solve equations that need distributing and collecting like terms on both sides, including fraction coefficients like (2/3)(x - 6) = x + 1." },
  { id: "8.system-solution-types", name: "Systems with no or infinitely many solutions", grade: 8, strand: "equations", standard: "8.EE.8b", nad: "8.OAT.3", prereqs: ["8.systems", "8.solution-types"], advanced: true,
    description: "Decide from the equations whether a system has one solution, none (parallel lines) or infinitely many (the same line)." },
  { id: "8.systems-word-problems", name: "Systems of equations word problems", grade: 8, strand: "equations", standard: "8.EE.8c", nad: "8.OAT.3", prereqs: ["8.systems"], advanced: true,
    description: "Write and solve a system for a real situation, like comparing two phone plans or ticket sales of two kinds, and interpret the solution." },
  // 8.OAT.4
  { id: "8.nonlinear-context", name: "Nonlinear functions in context", grade: 8, strand: "functions", standard: "8.F.3, 8.F.5", nad: "8.OAT.4", prereqs: ["8.linear-nonlinear"], advanced: true,
    description: "Recognize nonlinear patterns in situations like the area of a square vs its side, or a population that doubles, and compare them with linear growth using tables." },
  // 8.M.1
  { id: "8.precision-accuracy", name: "Precision and accuracy", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["f.decimal-place-value"],
    description: "Tell precision (how fine the measurement is) from accuracy (how close to the true value), and choose the more precise measurement or tool." },
  { id: "8.round-significant", name: "Round to significant digits", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["8.significant-digits"],
    description: "Round whole numbers and decimals to a given number of significant digits, like 0.004862 to 2 significant digits." },
  { id: "8.sig-digits-multiply", name: "Significant digits when multiplying and dividing", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["8.round-significant"], advanced: true,
    description: "Give the product or quotient of measurements with as many significant digits as the least precise measurement." },
  { id: "8.sig-digits-add", name: "Precision when adding and subtracting", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["8.round-significant", "8.precision-accuracy"], advanced: true,
    description: "Round a sum or difference of measurements to the least precise decimal place, like 12.6 cm + 3.47 cm = 16.1 cm." },
  // 8.GEO.1
  { id: "8.transformation-sequences", name: "Sequences of transformations", grade: 8, strand: "geometry", standard: "8.G.2, 8.G.4", nad: "8.GEO.1", prereqs: ["8.transformations"], advanced: true,
    description: "Apply two or more transformations in order to a point, and identify a sequence of transformations that maps one figure onto another (given by coordinates)." },
  { id: "8.aa-similarity", name: "Angle-angle similarity", grade: 8, strand: "geometry", standard: "8.G.5", nad: "8.GEO.1", prereqs: ["8.angle-facts", "8.congruence-similarity"], advanced: true,
    description: "Use two pairs of equal angles to show triangles are similar, then find a missing side or height (like using shadows to find a tree's height)." },
  // 8.GEO.2
  { id: "8.pythagorean-multistep", name: "Multi-step right triangle problems", grade: 8, strand: "geometry", standard: "8.G.7", nad: "8.GEO.2", prereqs: ["8.pythagorean"], advanced: true,
    description: "Use the Pythagorean theorem as one step in a bigger problem, like finding a missing side and then the perimeter or area. The stem must say how to round." },
  { id: "8.pythagorean-3d", name: "Pythagorean theorem in 3D", grade: 8, strand: "geometry", standard: "8.G.7", nad: "8.GEO.2", prereqs: ["8.pythagorean-multistep"], advanced: true,
    description: "Find the diagonal of a rectangular box or the slant height of a cone or pyramid. The stem must say how to round." },
  // 8.GEO.3
  { id: "8.volume-cylinder", name: "Volume of cylinders", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["7.circles", "6.volume-prisms"],
    description: "Find the volume of a cylinder from its radius or diameter and height. The stem must say to use 3.14 for π and how to round." },
  { id: "8.volume-cone", name: "Volume of cones", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["8.volume-cylinder"],
    description: "Find the volume of a cone and compare it with a cylinder of the same base and height. The stem must say to use 3.14 for π and how to round." },
  { id: "8.volume-sphere", name: "Volume of spheres and hemispheres", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["7.circles", "7.squares-cubes"],
    description: "Find the volume of a sphere or hemisphere from its radius or diameter. The stem must say to use 3.14 for π and how to round." },
  { id: "8.volume-missing-dimension", name: "Find a missing dimension from volume", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["8.volume-curved", "8.roots"], advanced: true,
    description: "Work backward from the volume of a cylinder, cone or sphere to find its height or radius." },
  { id: "8.volume-composite", name: "Volume of composite solids", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["8.volume-curved"], advanced: true,
    description: "Find the volume of solids built from cylinders, cones, hemispheres and prisms, like an ice cream cone topped with a hemisphere or a silo." },
  // 8.DSP.1
  { id: "8.judge-line-of-fit", name: "Judge a line of fit", grade: 8, strand: "statistics", standard: "8.SP.2", nad: "8.DSP.1", prereqs: ["8.line-of-fit"], advanced: true,
    description: "Decide which of two lines fits paired data better by checking how close the data points are to each line, and spot predictions that go too far beyond the data." },
  { id: "8.relative-frequency", name: "Relative frequency and association", grade: 8, strand: "statistics", standard: "8.SP.4", nad: "8.DSP.1", prereqs: ["8.two-way-tables"], advanced: true,
    description: "Find row or column relative frequencies in a two-way table and use them to decide whether two categories are associated." },
  { id: "8.association-causation", name: "Association vs causation", grade: 8, strand: "statistics", standard: "8.SP.1", nad: "8.DSP.1", prereqs: ["8.scatter-plots"], advanced: true,
    description: "Decide whether a conclusion from paired data is justified, separating association from cause and naming possible hidden factors." },


  // ---------- Grade 8: more practice skills (10–12 per NAD standard) ----------
  // 8.NO.1
  { id: "8.order-real-numbers", name: "Compare and order real numbers", grade: 8, strand: "numbers", standard: "8.NS.2", nad: "8.NO.1", prereqs: ["8.estimate-irrationals"],
    description: "Order lists that mix square roots, pi, fractions and decimals, like √50, 7.1, 22/3 and 2π." },
  { id: "8.roots-of-fractions", name: "Square roots of fractions and decimals", grade: 8, strand: "numbers", standard: "8.EE.2", nad: "8.NO.1", prereqs: ["7.exponents-roots"],
    description: "Find square roots like √(9/25), √0.49 and √0.0016, and tell whether the result is rational." },
  { id: "8.rational-irrational-results", name: "Rational or irrational result?", grade: 8, strand: "numbers", standard: "8.NS.1", nad: "8.NO.1", prereqs: ["8.irrational"],
    description: "Decide whether results like 3 + √2, √2 × √2, 0.5 × π or √16 + 1/3 are rational or irrational." },
  { id: "8.decimal-expansions", name: "Decimal expansions", grade: 8, strand: "numbers", standard: "8.NS.1", nad: "8.NO.1", prereqs: ["8.irrational"],
    description: "Decide from a decimal expansion whether a number is rational (it ends or repeats) or irrational, and find a digit far into a repeating decimal." },
  { id: "8.estimate-cube-roots", name: "Estimate cube roots", grade: 8, strand: "numbers", standard: "8.NS.2", nad: "8.NO.1", prereqs: ["8.estimate-irrationals", "7.squares-cubes"], advanced: true,
    description: "Tell which two whole numbers a cube root lies between, like ∛50, and estimate it to one decimal place." },
  // 8.OAT.1
  { id: "8.combine-exponent-rules", name: "Simplify with several exponent rules", grade: 8, strand: "expressions", standard: "8.EE.1", nad: "8.OAT.1", prereqs: ["8.exponent-rules", "8.zero-negative-exponents"],
    description: "Simplify expressions that need two or more rules, like (3^2)^3 × 3^−4, and write the answer with a positive exponent." },
  { id: "8.evaluate-integer-exponents", name: "Evaluate integer exponents", grade: 8, strand: "expressions", standard: "8.EE.1", nad: "8.OAT.1", prereqs: ["8.zero-negative-exponents"],
    description: "Evaluate 2^−3, (1/2)^−2, 5^0 and expressions that combine them, as fractions or decimals." },
  { id: "8.scientific-add-subtract", name: "Add and subtract in scientific notation", grade: 8, strand: "numbers", standard: "8.EE.4", nad: "8.OAT.1", prereqs: ["8.scientific-operations"],
    description: "Add and subtract numbers in scientific notation with different powers of 10 by rewriting them with the same power first." },
  { id: "8.missing-exponent", name: "Find the missing exponent", grade: 8, strand: "expressions", standard: "8.EE.1", nad: "8.OAT.1", prereqs: ["8.exponent-rules"],
    description: "Find n in equations like 2^5 × 2^n = 2^12, 7^n ÷ 7^3 = 7^2 or (5^n)^2 = 5^8." },
  { id: "8.exponent-mistakes", name: "Spot exponent mistakes", grade: 8, strand: "expressions", standard: "8.EE.1", nad: "8.OAT.1", prereqs: ["8.combine-exponent-rules"], advanced: true,
    description: "Find the error in work like 2^3 × 2^4 = 4^7, (−2)^4 = −16 or 3^−2 = −9, and give the correct value." },
  // 8.OAT.2
  { id: "8.slope-two-points", name: "Slope from two points", grade: 8, strand: "functions", standard: "8.F.4", nad: "8.OAT.2", prereqs: ["8.slope"],
    description: "Find slope with (y2 − y1)/(x2 − x1), including negative, zero and undefined slopes." },
  { id: "8.line-from-table", name: "Slope and intercept from a table", grade: 8, strand: "functions", standard: "8.F.4", nad: "8.OAT.2", prereqs: ["8.slope-intercept"],
    description: "Find the slope and y-intercept from a table of values, even when the x-values skip, and write y = mx + b." },
  { id: "8.write-line-equation", name: "Write the equation of a line", grade: 8, strand: "functions", standard: "8.F.4", nad: "8.OAT.2", prereqs: ["8.slope-two-points", "8.slope-intercept"],
    description: "Write y = mx + b from two points, or from a slope and one point." },
  { id: "8.interpret-slope-intercept", name: "What slope and intercept mean", grade: 8, strand: "functions", standard: "8.F.4", nad: "8.OAT.2", prereqs: ["8.slope-intercept"],
    description: "Explain what the slope and y-intercept mean in a situation, like the cost per ride and the entry fee." },
  { id: "8.parallel-slopes", name: "Parallel lines and slope", grade: 8, strand: "functions", standard: "8.EE.6", nad: "8.OAT.2", prereqs: ["8.slope-intercept"], advanced: true,
    description: "Recognize parallel lines by equal slopes, and write the equation of a line parallel to a given line through a given point." },
  // 8.OAT.3
  { id: "8.systems-substitution", name: "Solve systems by substitution", grade: 8, strand: "equations", standard: "8.EE.8b", nad: "8.OAT.3", prereqs: ["8.systems"],
    description: "Solve systems of two linear equations by substituting one equation into the other, and check the solution in both." },
  { id: "8.systems-elimination", name: "Solve systems by elimination", grade: 8, strand: "equations", standard: "8.EE.8b", nad: "8.OAT.3", prereqs: ["8.systems"],
    description: "Solve systems by adding or subtracting the equations (multiplying one first if needed) to eliminate a variable." },
  { id: "8.systems-graphing", name: "Solve systems by graphing", grade: 8, strand: "equations", standard: "8.EE.8a", nad: "8.OAT.3", prereqs: ["8.systems", "8.graph-lines"],
    description: "Find the solution of a system as the point where two lines meet, from their equations or points, and check it." },
  { id: "8.both-sides-word-problems", name: "Variables on both sides in word problems", grade: 8, strand: "equations", standard: "8.EE.7", nad: "8.OAT.3", prereqs: ["8.multi-step-equations"],
    description: "Write and solve equations with the variable on both sides from situations, like when two phone plans cost the same." },
  { id: "8.literal-equations", name: "Solve a formula for a variable", grade: 8, strand: "equations", standard: "8.EE.7", nad: "8.OAT.3", prereqs: ["8.multi-step-equations"], advanced: true,
    description: "Rearrange formulas like A = (1/2)bh, d = rt or y = mx + b to solve for another variable." },
  // 8.OAT.4
  { id: "8.function-values", name: "Inputs and outputs of functions", grade: 8, strand: "functions", standard: "8.F.1", nad: "8.OAT.4", prereqs: ["8.functions"],
    description: "Find the output for an input from a rule, table or list of pairs, and find the input that gives a certain output." },
  { id: "8.story-graphs", name: "Match graphs and stories", grade: 8, strand: "functions", standard: "8.F.5", nad: "8.OAT.4", prereqs: ["8.describe-graphs"],
    description: "Match a story (speeds up, stops, comes back) to a description of a graph, and describe the story a graph tells." },
  { id: "8.increasing-decreasing", name: "Increasing, decreasing or constant", grade: 8, strand: "functions", standard: "8.F.5", nad: "8.OAT.4", prereqs: ["8.describe-graphs"],
    description: "Name where a function given as points or a story is increasing, decreasing or constant, and where it is fastest." },
  { id: "8.is-table-linear", name: "Is the table linear?", grade: 8, strand: "functions", standard: "8.F.3", nad: "8.OAT.4", prereqs: ["8.linear-nonlinear"],
    description: "Decide whether a table shows a linear function by checking for a constant rate of change, even when the x-values change by different amounts." },
  { id: "8.piecewise-situations", name: "Situations with changing rates", grade: 8, strand: "functions", standard: "8.F.4, 8.F.5", nad: "8.OAT.4", prereqs: ["8.story-graphs", "8.function-models"], advanced: true,
    description: "Model situations with different rates in different intervals (parking fees by the hour, a trip with a stop) and compute values from them." },
  // 8.M.1
  { id: "8.precise-measurement", name: "Choose the more precise measurement", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["8.precision-accuracy"],
    description: "Pick the more precise measurement or tool (to the nearest mm or the nearest cm) and state the precision of a measurement." },
  { id: "8.greatest-possible-error", name: "Greatest possible error", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["8.precision-accuracy"],
    description: "Find the greatest possible error of a measurement (half the smallest unit) and the range its true value could be in." },
  { id: "8.zeros-significant", name: "Zeros and significant digits", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["8.significant-digits"],
    description: "Count significant digits in numbers with leading, trailing and in-between zeros, like 0.00450, 1200 and 3.040." },
  { id: "8.significant-scientific", name: "Significant digits in scientific notation", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["8.significant-digits", "7.scientific-notation"],
    description: "Write a measurement in scientific notation with the right number of significant digits, like 45,000 m to 3 significant digits." },
  { id: "8.relative-error", name: "Relative error of a measurement", grade: 8, strand: "measurement", standard: "", nad: "8.M.1", prereqs: ["8.greatest-possible-error", "7.percent-error"], advanced: true,
    description: "Find the relative error (greatest possible error ÷ measurement) as a percent, and compare which measurement is relatively more precise." },
  // 8.GEO.1
  { id: "8.translation-rules", name: "Coordinate rules for translations", grade: 8, strand: "geometry", standard: "8.G.3", nad: "8.GEO.1", prereqs: ["8.transformations"],
    description: "Apply and write rules like (x, y) → (x + 3, y − 2), and find the image or original point." },
  { id: "8.reflection-rotation-rules", name: "Coordinate rules for reflections and rotations", grade: 8, strand: "geometry", standard: "8.G.3", nad: "8.GEO.1", prereqs: ["8.transformations"],
    description: "Find images after reflecting over the x- or y-axis or rotating 90°, 180° or 270° about the origin." },
  { id: "8.what-transformations-keep", name: "What transformations keep the same", grade: 8, strand: "geometry", standard: "8.G.1", nad: "8.GEO.1", prereqs: ["8.transformations"],
    description: "Tell which transformations keep lengths, angle measures, parallel lines and orientation, and which (dilations) change size." },
  { id: "8.exterior-angles", name: "Exterior angles of triangles", grade: 8, strand: "geometry", standard: "8.G.5", nad: "8.GEO.1", prereqs: ["8.angle-facts"],
    description: "Use the fact that an exterior angle of a triangle equals the sum of the two remote interior angles, including with algebra." },
  { id: "8.polygon-angle-sums", name: "Angle sums of polygons", grade: 8, strand: "geometry", standard: "8.G.5", nad: "8.GEO.1", prereqs: ["8.angle-facts"], advanced: true,
    description: "Find the interior angle sum of a polygon with n sides, and each angle of a regular polygon." },
  // 8.GEO.2
  { id: "8.missing-leg", name: "Find a missing leg", grade: 8, strand: "geometry", standard: "8.G.7", nad: "8.GEO.2", prereqs: ["8.pythagorean"],
    description: "Use the Pythagorean theorem to find a missing leg when the hypotenuse and the other leg are known." },
  { id: "8.pythagorean-word-problems", name: "Pythagorean theorem word problems", grade: 8, strand: "geometry", standard: "8.G.7", nad: "8.GEO.2", prereqs: ["8.pythagorean"],
    description: "Solve problems with ladders against walls, screen diagonals and shortcuts across rectangular fields." },
  { id: "8.pythagorean-triples", name: "Pythagorean triples", grade: 8, strand: "geometry", standard: "8.G.6, 8.G.7", nad: "8.GEO.2", prereqs: ["8.pythagorean-converse"],
    description: "Recognize triples like 3-4-5, 5-12-13 and 8-15-17 and their multiples, and use them to find sides quickly." },
  { id: "8.pythagorean-rounding", name: "Sides that aren't whole numbers", grade: 8, strand: "geometry", standard: "8.G.7", nad: "8.GEO.2", prereqs: ["8.pythagorean", "8.estimate-irrationals"],
    description: "Find a side as a square root, like √74, and round it to the nearest tenth." },
  { id: "8.pythagorean-areas", name: "Explain the theorem with areas", grade: 8, strand: "geometry", standard: "8.G.6", nad: "8.GEO.2", prereqs: ["8.pythagorean"], advanced: true,
    description: "Use the areas of the squares on a triangle's sides to explain or check the Pythagorean theorem and its converse." },
  // 8.GEO.3
  { id: "8.volume-in-pi", name: "Volume in terms of pi", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["8.volume-cylinder"],
    description: "Give volumes as exact expressions like 48π cm³, and compare them with decimal approximations." },
  { id: "8.compare-solid-volumes", name: "Compare cylinders, cones and spheres", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["8.volume-cone", "8.volume-sphere"],
    description: "Use that a cone holds 1/3 of a cylinder with the same base and height, and compare a sphere with the cylinder that fits around it." },
  { id: "8.volume-word-problems", name: "Volume word problems", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["8.volume-curved"],
    description: "Solve problems like how much water fills a tank or how many cones a tub of ice cream fills." },
  { id: "8.volume-from-diameter", name: "Volume from diameter or circumference", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["8.volume-cylinder", "7.circle-parts"],
    description: "Find a volume when the diameter or circumference is given instead of the radius." },
  { id: "8.volume-scaling", name: "How volume changes with size", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["8.volume-cylinder"], advanced: true,
    description: "Predict how a volume changes when the radius or height is doubled, tripled or halved." },
  // 8.DSP.1
  { id: "8.outliers-clusters", name: "Outliers and clusters in scatter plots", grade: 8, strand: "statistics", standard: "8.SP.1", nad: "8.DSP.1", prereqs: ["8.scatter-plots"],
    description: "Identify outliers and clusters in paired data given as a table of points, and describe what they mean." },
  { id: "8.predict-with-line", name: "Predict with a line of fit", grade: 8, strand: "statistics", standard: "8.SP.3", nad: "8.DSP.1", prereqs: ["8.line-of-fit"],
    description: "Use the equation of a line of fit to make predictions, and interpret its slope and intercept in context." },
  { id: "8.complete-two-way", name: "Complete a two-way table", grade: 8, strand: "statistics", standard: "8.SP.4", nad: "8.DSP.1", prereqs: ["8.two-way-tables"],
    description: "Fill in missing counts in a two-way table using row and column totals." },
  { id: "8.data-types", name: "Scatter plot or two-way table?", grade: 8, strand: "statistics", standard: "8.SP.1, 8.SP.4", nad: "8.DSP.1", prereqs: ["8.scatter-plots", "8.two-way-tables"],
    description: "Decide whether paired data is numerical (scatter plot) or categorical (two-way table), and name the two variables." },
  { id: "8.residuals", name: "How far from the line?", grade: 8, strand: "statistics", standard: "8.SP.2", nad: "8.DSP.1", prereqs: ["8.predict-with-line"], advanced: true,
    description: "Find the difference between an actual value and the value a line of fit predicts, and judge which points fit the line worst." },
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

/**
 * Order for the diagnostic's opening questions (core skills only): the grade's deepest skills first (a correct
 * answer also vouches for everything they build on), taking turns across strands so every strand
 * is sampled before the question limit runs out.
 */
export function diagnosticOrder(grade: number, focus: string[] = []): string[] {
  const gradeSkills = SKILLS.filter((s) => s.grade === grade && !s.advanced);
  const builtOn = new Set(gradeSkills.flatMap((s) => prerequisiteChain(s.id)));
  const byStrand = STRAND_ORDER.map((strand) => {
    const skills = gradeSkills.filter((s) => s.strand === strand);
    const top = skills.filter((s) => !builtOn.has(s.id)).sort((a, b) => prerequisiteChain(b.id).length - prerequisiteChain(a.id).length);
    return [...top, ...skills.filter((s) => builtOn.has(s.id))].map((s) => s.id);
  });
  const interleaved: string[] = [];
  for (let i = 0; byStrand.some((list) => i < list.length); i++) {
    for (const list of byStrand) if (i < list.length) interleaved.push(list[i]);
  }
  const focusFirst = focus.filter((id) => SKILLS_BY_ID[id]);
  return [...new Set([...focusFirst, ...interleaved])];
}

/** Section a skill is listed under: "Foundations" for grades 4–5, otherwise its grade. */
export const sectionOf = (skill: Skill) => (skill.grade <= 5 ? 5 : skill.grade);

/** Topic titles for the NAD standards, in the order they're listed (one topic = one NAD lesson). */
export const NAD_TOPICS: Record<string, string> = {
  "6.NO.1": "Whole numbers and decimals",
  "6.NO.2": "Factors, multiples and exponents",
  "6.NO.3": "Integers and the coordinate plane",
  "6.NO.4": "Fractions, decimals and percents",
  "6.NO.5": "Ratios and rates",
  "6.OAT.1": "Expressions, equations and inequalities",
  "6.OAT.2": "Variables and relationships",
  "6.M.1": "Time",
  "6.GEO.1": "Area, surface area and volume",
  "6.DSP.1": "Statistics: center and spread",
  "6.DSP.2": "Data displays and distributions",
  "7.NO.1": "Operations with integers and rationals",
  "7.NO.2": "Number properties and problem solving",
  "7.NO.3": "Exponents, roots and scientific notation",
  "7.NO.4": "Proportional relationships and percents",
  "7.OAT.1": "Equivalent expressions",
  "7.OAT.2": "Solving equations",
  "7.OAT.3": "Patterns, rules and inequalities",
  "7.M.1": "Units of measure",
  "7.GEO.1": "Scale drawings, triangles and solids",
  "7.GEO.2": "Angles, circles, area and volume",
  "7.DSP.1": "Sampling",
  "7.DSP.2": "Comparing populations",
  "7.DSP.3": "Probability",
  "8.NO.1": "Rational and irrational numbers",
  "8.OAT.1": "Exponents and scientific notation",
  "8.OAT.2": "Slope and lines",
  "8.OAT.3": "Equations and systems",
  "8.OAT.4": "Functions",
  "8.M.1": "Precision and significant digits",
  "8.GEO.1": "Transformations, congruence and similarity",
  "8.GEO.2": "The Pythagorean theorem",
  "8.GEO.3": "Volume of cylinders, cones and spheres",
  "8.DSP.1": "Scatter plots and two-way tables",
};

export interface Topic { letter: string; title: string; nad: string; skillIds: string[] }

/**
 * The lettered topics in each section. Grades 6–8 have one topic per NAD standard (its 5–6
 * skills, core first); Foundations are grouped by strand.
 */
export const TOPICS_BY_SECTION: Record<number, Topic[]> = (() => {
  const result: Record<number, Topic[]> = {};
  for (const section of [...new Set(SKILLS.map(sectionOf))].sort()) {
    const inSection = SKILLS.filter((s) => sectionOf(s) === section);
    const groups = section <= 5
      ? STRAND_ORDER.map((strand) => ({ title: STRAND_NAMES[strand], nad: "", skills: inSection.filter((s) => s.strand === strand) }))
      : Object.keys(NAD_TOPICS).filter((code) => code.startsWith(`${section}.`))
          .map((code) => ({ title: NAD_TOPICS[code], nad: code, skills: inSection.filter((s) => s.nad === code) }));
    result[section] = groups.filter((g) => g.skills.length).map((g, i) => ({
      letter: String.fromCharCode(65 + i), title: g.title, nad: g.nad, skillIds: g.skills.map((s) => s.id),
    }));
  }
  return result;
})();

/** Short skill codes like "C.4": topic letter, then the skill's number within the topic. */
export const SKILL_CODES: Record<string, string> = Object.fromEntries(
  Object.values(TOPICS_BY_SECTION).flat().flatMap((t) => t.skillIds.map((id, i) => [id, `${t.letter}.${i + 1}`])),
);
