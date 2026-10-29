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
    description: "Find the GCF of two numbers up to 100 and the LCM of two numbers up to 12, use the GCF to factor sums like 36 + 8 = 4(9 + 2), and solve word problems." },
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
    description: "Find the mean, median, mode and range of a data set given as a list, including a missing value needed for a given mean." },
  { id: "6.mad-iqr", name: "Interquartile range and mean absolute deviation", grade: 6, strand: "statistics", standard: "6.SP.5c", nad: "6.DSP.1", prereqs: ["6.mean-median-mode", "6.absolute-value"],
    description: "Find the quartiles and interquartile range, and the mean absolute deviation, of a small data set given as a list." },
  // 6.DSP.2 Distributions
  { id: "6.data-displays", name: "Dot plots, histograms and box plots", grade: 6, strand: "statistics", standard: "6.SP.4", nad: "6.DSP.2", prereqs: ["6.mean-median-mode"],
    description: "Read data displays described in text: a frequency table for a dot plot or histogram, or a five-number summary for a box plot." },
  { id: "6.describe-distributions", name: "Describe and summarize data", grade: 6, strand: "statistics", standard: "6.SP.5", nad: "6.DSP.2", prereqs: ["6.data-displays", "6.mad-iqr"],
    description: "Choose the best measure of center and spread for a data set (for example median and IQR when there is an outlier) and describe how an outlier changes the mean." },

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
    description: "Convert between standard form and scientific notation (written like 4.5 × 10^6 or 3.2 × 10^-4) and compare numbers in scientific notation." },
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
    description: "Convert units within the customary system and within the metric system using ratio reasoning, including rates like feet per second to miles per hour." },
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
    description: "Compare two data sets using their means, medians, MADs or IQRs, including how many MADs apart the centers are." },
  // 7.DSP.3 Probability
  { id: "7.probability", name: "Probability of simple events", grade: 7, strand: "statistics", standard: "7.SP.5, 7.SP.6, 7.SP.7", nad: "7.DSP.3", prereqs: ["f.equiv-fractions", "6.fraction-decimal-percent"],
    description: "Find theoretical and experimental probability as a fraction, decimal or percent between 0 and 1, and predict outcomes over many trials." },
  { id: "7.compound-probability", name: "Probability of compound events", grade: 7, strand: "statistics", standard: "7.SP.8", nad: "7.DSP.3", prereqs: ["7.probability", "f.multiply-fractions"],
    description: "Find probabilities of compound events using organized lists, tables or tree diagrams (described in words), and count outcomes in a sample space." },

  // ---------- Grade 8 ----------
  // 8.NO.1 Irrational numbers
  { id: "8.irrational", name: "Rational and irrational numbers", grade: 8, strand: "numbers", standard: "8.NS.1", nad: "8.NO.1", prereqs: ["6.repeating-decimals", "7.exponents-roots"],
    description: "Classify numbers as rational or irrational (including square roots and repeating decimals) and convert a repeating decimal like 0.4444... to a fraction." },
  { id: "8.estimate-irrationals", name: "Estimate irrational numbers", grade: 8, strand: "numbers", standard: "8.NS.2", nad: "8.NO.1", prereqs: ["8.irrational"],
    description: "Estimate square roots and π to the nearest whole number or tenth, place them on a number line, and order them with rational numbers." },
  // 8.OAT.1 Radicals and integer exponents
  { id: "8.exponent-rules", name: "Integer exponent rules", grade: 8, strand: "expressions", standard: "8.EE.1", nad: "8.OAT.1", prereqs: ["7.exponents-roots", "7.multiply-integers"],
    description: "Use the product, quotient, power, zero and negative exponent rules to simplify and evaluate expressions like 3^2 × 3^-5." },
  { id: "8.roots", name: "Square roots and cube roots", grade: 8, strand: "expressions", standard: "8.EE.2", nad: "8.OAT.1", prereqs: ["7.exponents-roots"],
    description: "Solve x^2 = p and x^3 = p, and evaluate square roots of small perfect squares and cube roots of small perfect cubes." },
  { id: "8.scientific-operations", name: "Operations with scientific notation", grade: 8, strand: "numbers", standard: "8.EE.3, 8.EE.4", nad: "8.OAT.1", prereqs: ["7.scientific-notation", "8.exponent-rules"],
    description: "Multiply, divide, add and subtract numbers in scientific notation, and tell how many times larger one quantity is than another." },
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
    description: "Count the significant digits in a measurement, round to a given number of significant digits, and give a computed measurement with the right precision." },
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
  { id: "8.volume-curved", name: "Volume of cylinders, cones and spheres", grade: 8, strand: "geometry", standard: "8.G.9", nad: "8.GEO.3", prereqs: ["7.circles", "6.volume-prisms"],
    description: "Find the volume of cylinders, cones and spheres, and a missing dimension. The stem must say to use 3.14 for π and how to round." },
  // 8.DSP.1 Bivariate data
  { id: "8.scatter-plots", name: "Scatter plots and association", grade: 8, strand: "statistics", standard: "8.SP.1", nad: "8.DSP.1", prereqs: ["f.first-quadrant", "6.statistical-questions"],
    description: "Describe the association in paired data given as a table (positive, negative, none; linear or not), and spot outliers and clusters." },
  { id: "8.line-of-fit", name: "Lines of best fit", grade: 8, strand: "statistics", standard: "8.SP.2, 8.SP.3", nad: "8.DSP.1", prereqs: ["8.scatter-plots", "8.slope-intercept"],
    description: "Use the equation of a line of fit to make predictions, and interpret its slope and intercept in context." },
  { id: "8.two-way-tables", name: "Two-way tables", grade: 8, strand: "statistics", standard: "8.SP.4", nad: "8.DSP.1", prereqs: ["6.ratios", "6.percent"],
    description: "Read and complete two-way frequency tables, and find relative frequencies for rows or columns to look for an association." },
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
 * Order for the diagnostic's opening questions: the grade's most advanced skills first (a correct
 * answer also vouches for everything they build on), taking turns across strands so every strand
 * is sampled before the question limit runs out.
 */
export function diagnosticOrder(grade: number, focus: string[] = []): string[] {
  const gradeSkills = SKILLS.filter((s) => s.grade === grade);
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
