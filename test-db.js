const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Checking profiles table...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  if (pErr) console.error("Error with profiles:", pErr.message);
  else console.log("Profiles check passed! Roles, class_code, career_field should exist.");

  console.log("Checking student_instructions table...");
  const { data: inst, error: iErr } = await supabase.from('student_instructions').select('*').limit(1);
  if (iErr) console.error("Error with student_instructions:", iErr.message);
  else console.log("student_instructions check passed!");

  console.log("Checking student_limits table...");
  const { data: lim, error: lErr } = await supabase.from('student_limits').select('*').limit(1);
  if (lErr) console.error("Error with student_limits:", lErr.message);
  else console.log("student_limits check passed!");
}

main();
