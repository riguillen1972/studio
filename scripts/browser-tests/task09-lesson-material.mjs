// Task 9: the tutor uses the teacher's Context Pack and doesn't invent memories.
// First, as the test teacher, upload a lesson Context Pack with a made-up fact, for example:
//   "Pond field trip: we counted 37 turtles. Cattails are the producers in our pond."
// Run: node scripts/browser-tests/task09-lesson-material.mjs
import { BASE, connect, settledText, signIn } from "./helpers.mjs";

const { browser, page } = await connect();
try {
  await signIn(page, "STUDENT");
  const ask = async (q) => {
    await page.goto(`${BASE}/dashboard`);
    const box = page.getByRole("textbox").last();
    await box.fill(q);
    await box.press("Enter");
    const text = await settledText(page);
    return text.slice(text.lastIndexOf(q) + q.length).trim();
  };
  const a1 = await ask("How many turtles did we count on our pond field trip?");
  console.log(/37/.test(a1) ? "PASS: used the Context Pack (37)" : "FAIL: didn't use the Context Pack", "\n", a1.slice(0, 500));
  const a2 = await ask("What animals did we see on our trip to the zoo?");
  console.log(/don.?t know|not sure|didn.?t see|tell me|no information|isn.?t in/i.test(a2) ? "\nPASS: said it doesn't know" : "\nCHECK: read this answer", "\n", a2.slice(0, 500));
} finally {
  await browser.close();
}
