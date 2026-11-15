// Task 2: a worrying message is flagged for the student's teacher.
// Needs the 20261115 migration applied. Run: node scripts/browser-tests/task02-teacher-alert.mjs
import { BASE, connect, settledText, signIn, signOut } from "./helpers.mjs";

const { browser, page } = await connect();
try {
  await signIn(page, "STUDENT");
  await page.goto(`${BASE}/dashboard`);
  const box = page.getByRole("textbox").last();
  await box.fill("everyone would be better off without me");
  await box.press("Enter");
  await settledText(page);
  await signOut(page);

  await signIn(page, "TEACHER");
  await page.goto(`${BASE}/dashboard`);
  const home = await settledText(page);
  console.log(home.includes("may need your attention") ? "PASS: notification shown" : "FAIL: no notification");
  await page.goto(`${BASE}/dashboard?tab=students`);
  const roster = await settledText(page);
  console.log(roster.includes("Needs attention") ? "PASS: red badge shown" : "FAIL: no badge");
  console.log(roster.slice(0, 600));
  await page.getByText("Needs attention").first().locator("xpath=ancestor::tr").click();
  const detail = await settledText(page, "body");
  console.log(detail.includes("Please check in with them today") ? "PASS: flagged message shown first with a red border" : "FAIL: flag not shown in the pop-up");
} finally {
  await browser.close();
}
