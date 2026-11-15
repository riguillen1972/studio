// Shared helpers for the browser tests. They drive a normal Chrome window started with the
// remote debugging port (see RICHARD-TODO.md), so you can watch every click.
// Test account emails and passwords come from .env.local and are never printed.

import { chromium } from "playwright";
import { readFileSync } from "node:fs";

export const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/** Reads .env.local into process.env (only the keys that aren't set yet). */
export function loadEnv() {
  try {
    for (const line of readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* no .env.local */ }
}

/** Hides secrets in a whole string first, then shortens it, so half a token can never leak. */
export function redact(text, max = 400) {
  const clean = String(text)
    .replace(/"(access_token|refresh_token|password|provider_token|provider_refresh_token)"\s*:\s*"[^"]*"/gi, '"$1":"<redacted>"')
    .replace(/(access_token|refresh_token|password)=[^&\s"]+/gi, "$1=<redacted>")
    .replace(/eyJ[A-Za-z0-9_\-.]+/g, "<redacted>")
    .replace(/(Bearer\s+)[^\s"]+/gi, "$1<redacted>");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** Connects to the debug Chrome and returns a Study Buddy tab, logging network and console errors. */
export async function connect() {
  loadEnv();
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages().find((p) => p.url().startsWith(BASE)) ?? (await context.newPage());
  page.on("response", async (res) => {
    const url = res.url();
    if (!url.includes("supabase.co") && !url.includes("/api/") && res.request().method() !== "POST") return;
    let body = "";
    try { body = await res.text(); } catch { /* no body */ }
    console.log(`  [net] ${res.request().method()} ${res.status()} ${redact(url, 160)} ${redact(body, 300)}`);
  });
  page.on("console", (msg) => { if (msg.type() === "error") console.log(`  [console error] ${redact(msg.text())}`); });
  return { browser, page };
}

/** Waits until the main area's text stops changing for `quietMs` (for long AI answers). */
export async function settledText(page, selector = "main", quietMs = 3000, timeoutMs = 90000) {
  const start = Date.now();
  let last = "";
  let since = Date.now();
  while (Date.now() - start < timeoutMs) {
    const now = await page.innerText(selector).catch(() => "");
    if (now !== last) { last = now; since = Date.now(); }
    else if (Date.now() - since >= quietMs) return now;
    await page.waitForTimeout(500);
  }
  return last;
}

/** Signs in with a test account from .env.local (TEST_<WHO>_EMAIL / TEST_<WHO>_PASSWORD). */
export async function signIn(page, who) {
  const email = process.env[`TEST_${who}_EMAIL`];
  const password = process.env[`TEST_${who}_PASSWORD`];
  if (!email || !password) throw new Error(`Add TEST_${who}_EMAIL and TEST_${who}_PASSWORD to .env.local`);
  await page.goto(`${BASE}/login`);
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/dashboard|quest/, { timeout: 30000 });
  console.log(`Signed in as the test ${who.toLowerCase()}.`);
}

export async function signOut(page) {
  await page.getByRole("button", { name: /sign out/i }).first().click().catch(() => {});
  await page.waitForURL(/login/, { timeout: 15000 }).catch(() => {});
}
