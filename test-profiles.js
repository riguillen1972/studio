const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: profiles, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error('Error fetching profiles:', error.message);
  } else {
    console.log('Profiles table size:', profiles.length);
    if (profiles.length > 0) {
      console.log('Sample profile:', profiles[0]);
    }
  }
}
main();
