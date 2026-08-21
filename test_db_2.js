export VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
export VITE_SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)

node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('get_schema_columns', { table_name: 'bookings' });
  console.log(data, error);
}
run();
"
