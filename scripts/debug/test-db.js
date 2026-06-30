const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Missing Supabase Env Variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("🔄 Testing Events Fetch...");
  const { data: events, error: eErr } = await supabase.from('events').select('*').limit(1);
  if (eErr) console.log("❌ Events Error:", eErr.message);
  else console.log("✅ Events Table Columns:", Object.keys(events[0] || { msg: "Table empty, but columns accessible" }));

  console.log("\n🔄 Testing Profiles Fetch...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  if (pErr) console.log("❌ Profiles Error:", pErr.message);
  else console.log("✅ Profiles Table Columns:", Object.keys(profiles[0] || { msg: "Table empty, but columns accessible" }));
}

checkSchema();
