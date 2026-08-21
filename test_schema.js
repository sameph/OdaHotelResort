async function run() {
  const url = process.env.VITE_SUPABASE_URL + '/rest/v1/';
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(url + '?apikey=' + key);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
