const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.rpc('get_policies', {});
  // We can query pg_policies via REST if exposed, or just run SQL.
  const { data: policies, error: polErr } = await supabase.from('pg_policies').select('*').limit(50);
  console.log(polErr ? "Can't query pg_policies directly via REST" : "Can query pg_policies");
}
main();
