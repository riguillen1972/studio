const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const teacher = users.users.find(u => u.email === 'you@richard.com');
  
  if (teacher) {
      await supabaseAdmin.auth.admin.updateUserById(teacher.id, { password: 'Password!123' });
      const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
          email: 'you@richard.com',
          password: 'Password!123'
      });
      
      if (auth.session) {
          console.log("Logged in as teacher successfully");
          const { data, error } = await supabase.from('profiles').select('*');
          console.log("Profiles output Data length:", data?.length);
          if (error) {
              console.log("RLS ERROR EXACT:", error);
          } else {
              console.log("Profiles returned:", data);
          }
      } else {
          console.log("Failed to login", authErr);
      }
  }
}
main();
