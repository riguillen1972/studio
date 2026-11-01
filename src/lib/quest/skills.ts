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

  // ---------- Grade 6 ----------
  // 6.NO.1 Multi-digit and decimal operations
  { id: "6.long-division", name: "Divide multi-digit numbers", grade: 6, strand: "numbers", standard: "6.NS.2", nad: "6.NO.1", prereqs: ["f.multiply-whole"],
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
  { id: "6.ratios", name: "Ratios and ratio tables", grade: 6, strand: "ratios", standard: "6.RP.1, 6.RP.3a", nad: "6.NO.5", prereqs: ["f.multiply-whole", "f.equiv-fractions"],
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
  { id: "6.elapsed-time", name: "Elapsed time", grade: 6, strand: "measurement", standard: "4.MD.2", nad: "6.M.1", prereqs: ["f.unit-conversion"],
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
  { id: "6.statistical-questions", name: "Statistical questions", grade: 6, strand: "statistics", standard: "6.SP.1, 6.SP.2", nad: "6.DSP.1", prereqs: ["f.line-plots"],
    description: "Tell whether a question is statistical (expects variability in the answers) and recognize that a data set has a center, spread and shape." },
  { id: "6.mean-median-mode", name: "Mean, median, mode and range", grade: 6, strand: "statistics", standard: "6.SP.3, 6.SP.5c", nad: "6.DSP.1", prereqs: ["6.decimal-operations", "f.line-plots"],
    description: "Find the mean, median, mode and range of a data set given as a list." },
  { id: "6.mad-iqr", name: "Interquartile range and mean absolute deviation", grade: 6, strand: "statistics", standard: "6.SP.5c", nad: "6.DSP.1", prereqs: ["6.mean-median-mode", "6.absolute-value"],
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
  { id: "6.decimal-estimation", name: "Estimate with decimals", grade: 6, strand: "numbers", standard: "6.NS.3", nad: "6.NO.1", prereqs: ["6.decimal-operations"],
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
