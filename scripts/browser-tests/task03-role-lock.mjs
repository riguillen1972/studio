// Task 3: a signed-in student can't change their own role or plan, even by skipping the website.
// Signs in as the test student with Supabase directly. Run: node scripts/browser-tests/task03-role-lock.mjs
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./helpers.mjs";

loadEnv();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data: auth, error: signInError } = await supabase.auth.signInWithPassword({
  email: process.env.TEST_STUDENT_EMAIL,
  password: process.env.TEST_STUDENT_PASSWORD,
});
if (signInError) throw new Error(`Couldn't sign in the test student: ${signInError.message}`);
const id = auth.user.id;

const { data: before } = await supabase.from("profiles").select("role, tier").eq("id", id).single();
console.log("Before:", before);

for (const [label, change] of [["role → teacher", { role: "teacher" }], ["tier → max", { tier: "max" }], ["class_code → ABC123", { class_code: "ABC123" }]]) {
  const { error } = await supabase.from("profiles").update(change).eq("id", id);
  console.log(`${error ? "PASS (refused)" : "FAIL (allowed!)"}: ${label}${error ? ` — ${error.message}` : ""}`);
}

const { data: after } = await supabase.from("profiles").select("role, tier").eq("id", id).single();
console.log("After:", after, JSON.stringify(after) === JSON.stringify(before) ? "(unchanged, good)" : "(CHANGED!)");
await supabase.auth.signOut();
