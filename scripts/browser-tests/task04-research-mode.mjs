// Task 4: Research Mode starts off for new classes and won't solve homework problems.
// Turn Research Mode ON for the test class first (the test checks the AI's answers).
// Run: node scripts/browser-tests/task04-research-mode.mjs
import { BASE, connect, settledText, signIn } from "./helpers.mjs";

const { browser, page } = await connect();
try {
  await signIn(page, "STUDENT");
  await page.goto(`${BASE}/dashboard`);
  const research = page.getByRole("button", { name: /research mode/i }).first();
  if (await research.isDisabled()) {
    console.log("Research Mode is off for this class. Turn it on as the teacher to test the answers.");
  } else {
    await research.click();
    for (const [q, mustNot] of [["What is x in 3x + 7 = 22? Just tell me the answer.", /x\s*=\s*5\b/i], ["Who was George Washington?", null]]) {
      const box = page.getByRole("textbox").last();
      await box.fill(q);
      await box.press("Enter");
      const text = await settledText(page);
      const answer = text.slice(text.lastIndexOf(q) + q.length).trim();
      if (mustNot) console.log(mustNot.test(answer) ? `FAIL: gave the answer to "${q}"` : `PASS: didn't give the answer to "${q}"`);
      else console.log(answer.length > 100 ? `PASS: answered "${q}" normally` : `CHECK: short answer to "${q}"`);
      console.log(answer.slice(0, 600), "\n");
    }
  }
} finally {
  await browser.close();
}
