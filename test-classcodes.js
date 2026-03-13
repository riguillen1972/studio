const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: profiles, error } = await supabase.from('profiles').select('email, role, class_code, display_name');
  if (error) {
    console.error('Error fetching profiles:', error.message);
  } else {
    console.log("Found", profiles.length, "profiles");
    profiles.forEach(p => console.log(JSON.stringify(p)));
  }
}
main();
