// Common misunderstandings in this strand. Wrong answer choices are tagged with one of these,
// so the engine can tell *why* a student got it wrong and show the matching mini-lesson
// instead of just more of the same problem. Mini-lessons should be checked by a math teacher.

export interface Misconception {
  id: string;
  name: string;
  /** Short reteach shown when a student shows this pattern (Markdown). */
  miniLesson: string;
}

export const MISCONCEPTIONS: Misconception[] = [
  { id: "add-denominators", name: "Adds the denominators",
    miniLesson: "When adding fractions, the **denominator names the size of the pieces**, so it doesn't get added. First rewrite both fractions with the same denominator, then add only the numerators.\n\nExample: 1/2 + 1/4 → 2/4 + 1/4 = **3/4** (not 2/6)." },
  { id: "no-common-denominator", name: "Adds without a common denominator",
    miniLesson: "You can only add pieces of the **same size**. Find a common denominator first (a number both denominators divide into), rewrite each fraction, then add.\n\nExample: 2/3 + 1/6 → 4/6 + 1/6 = **5/6**." },
  { id: "flip-wrong-fraction", name: "Flips the wrong fraction when dividing",
    miniLesson: "To divide by a fraction, **keep the first fraction, change ÷ to ×, and flip the second fraction** (the divisor).\n\nExample: 3/4 ÷ 1/2 → 3/4 × 2/1 = 6/4 = **1 1/2**." },
  { id: "multiply-cross", name: "Cross-multiplies when multiplying fractions",
    miniLesson: "To multiply fractions, multiply **straight across**: numerator × numerator and denominator × denominator.\n\nExample: 2/3 × 3/5 = 6/15 = **2/5**." },
  { id: "bigger-denominator-bigger", name: "Thinks a bigger denominator means a bigger fraction",
    miniLesson: "A bigger denominator means the whole is cut into **more, smaller pieces**. So 1/8 is smaller than 1/4. To compare, rewrite with a common denominator or compare to 1/2." },
  { id: "decimal-place-value", name: "Misreads decimal place value",
    miniLesson: "Line up the decimal points and compare digit by digit from the left. 0.5 is the same as 0.50, so **0.5 > 0.45** even though 45 looks bigger than 5." },
  { id: "ratio-order", name: "Reverses the order of a ratio",
    miniLesson: "Order matters in a ratio. \"3 cats to 5 dogs\" is **3 : 5**. Read the words carefully and write the quantities in the same order they're named." },
  { id: "additive-ratio", name: "Adds instead of multiplying in ratios",
    miniLesson: "Equivalent ratios grow by **multiplying** both parts by the same number, not adding. If 2 : 3 becomes ? : 12, the 3 was multiplied by 4, so 2 × 4 = **8**." },
  { id: "rate-inverted", name: "Divides the wrong way for a unit rate",
    miniLesson: "A unit rate is \"how much for **one** of something\". Divide by the quantity you want one of. Price per item: total price ÷ number of items." },
  { id: "percent-as-number", name: "Treats a percent as a plain number",
    miniLesson: "Percent means **per hundred**. 20% is 20/100 = 0.20. So 20% of 50 is 0.20 × 50 = **10**, not 50 − 20 or 50 × 20." },
  { id: "percent-change-base", name: "Uses the wrong base for percent change",
    miniLesson: "Percent change = (change ÷ **original** amount) × 100. Always divide by the starting value, not the new one." },
  { id: "subtract-negative", name: "Sign errors subtracting negatives",
    miniLesson: "Subtracting a negative is the same as **adding its opposite**: 5 − (−3) = 5 + 3 = **8**. On a number line, taking away a debt moves you up." },
  { id: "sign-rules-multiply", name: "Sign errors multiplying or dividing",
    miniLesson: "Same signs give a **positive**; different signs give a **negative**. (−4) × (−3) = 12, and (−12) ÷ 3 = −4." },
  { id: "absolute-value-sign", name: "Thinks absolute value just removes the sign incorrectly",
    miniLesson: "Absolute value is **distance from zero**, so it's never negative: |−7| = 7 and |7| = 7. When ordering negatives, the one farther from zero is **smaller**: −9 < −2." },
  { id: "order-of-operations", name: "Works left to right instead of using order of operations",
    miniLesson: "Do **parentheses first**, then exponents, then multiplication and division (left to right), then addition and subtraction (left to right). 3 + 4 × 2 = 3 + 8 = **11**." },
  { id: "distribute-first-only", name: "Distributes to only the first term",
    miniLesson: "The number outside parentheses multiplies **every** term inside. 3(x + 4) = 3x + **12**, not 3x + 4." },
  { id: "combine-unlike", name: "Combines unlike terms",
    miniLesson: "You can only combine **like terms**, which have the same variable part. 3x + 2 stays 3x + 2; it is not 5x." },
  { id: "inverse-wrong-op", name: "Uses the wrong inverse operation",
    miniLesson: "To undo an operation, do its **opposite** to both sides: undo + with −, undo × with ÷. For x + 7 = 12, subtract 7 from both sides: x = **5**." },
  { id: "two-step-order", name: "Undoes steps in the wrong order",
    miniLesson: "Undo operations in **reverse order**: first undo adding or subtracting, then undo multiplying or dividing. For 3x + 4 = 19: subtract 4 → 3x = 15, then divide by 3 → x = **5**." },
  { id: "one-side-only", name: "Changes only one side of the equation",
    miniLesson: "An equation is a balance. Whatever you do to one side, you must do to the **other side** too, or it stops being equal." },
  { id: "inequality-flip", name: "Forgets to flip the inequality sign",
    miniLesson: "When you **multiply or divide both sides by a negative number**, flip the inequality sign. −2x > 6 → x **<** −3." },
  { id: "slope-swapped", name: "Uses run over rise for slope",
    miniLesson: "Slope = **rise ÷ run** = change in y ÷ change in x. From (1, 2) to (3, 8): (8 − 2) ÷ (3 − 1) = 6 ÷ 2 = **3**." },
  { id: "slope-intercept-swap", name: "Mixes up slope and y-intercept",
    miniLesson: "In y = **m**x + **b**, m is the slope (how steep) and b is the y-intercept (where the line crosses the y-axis, when x = 0)." },
  { id: "solution-types", name: "Misreads no-solution and infinite-solution equations",
    miniLesson: "If the variables cancel and you get something **false** (like 3 = 5), there is **no solution**. If you get something **always true** (like 4 = 4), there are **infinitely many solutions**." },
  { id: "computation-slip", name: "Arithmetic slip",
    miniLesson: "Your method looks right, but a calculation slipped. Slow down on the arithmetic and check each step, or estimate first to see if your answer makes sense." },
];

export const MISCONCEPTIONS_BY_ID: Record<string, Misconception> = Object.fromEntries(MISCONCEPTIONS.map((m) => [m.id, m]));
export const MISCONCEPTION_IDS = MISCONCEPTIONS.map((m) => m.id);
