// Task 17: count how many times one page load asks for the profile, token usage and classes.
// Run while signed in (any test account): node scripts/browser-tests/task17-request-count.mjs
import { BASE, connect } from "./helpers.mjs";

const { browser, page } = await connect();
try {
  const counts = { profiles: 0, token_usage: 0, classes: 0 };
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/rest/v1/profiles")) counts.profiles++;
    if (url.includes("/rest/v1/token_usage")) counts.token_usage++;
    if (url.includes("/api/classes") && req.method() === "GET") counts.classes++;
  });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  console.log("Requests on one dashboard load:", counts);
  console.log(counts.profiles <= 1 && counts.token_usage <= 1 && counts.classes <= 1
    ? "PASS: each loaded once (in production; `npm run dev` may double them on purpose, see the note in RICHARD-TODO.md)"
    : "CHECK: something loaded more than once");
} finally {
  await browser.close();
}
