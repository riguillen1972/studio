const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) console.error(error);
  else {
    users.users.slice(0, 5).forEach(u => {
      console.log('Email:', u.email, '| Meta:', u.user_metadata);
    });
  }
}
main();
