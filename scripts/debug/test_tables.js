const { createClient } = require('@supabase/supabase-js');
require('dotenv').config; // reading raw variables from .env.local manually
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/['"]/g, '');
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim().replace(/['"]/g, '');

const supabase = createClient(url, key);

async function test() {
  console.log("尝试读取 Events...");
  const { data: eData, error: eErr } = await supabase.from('events').select('*').limit(1);
  if (eErr) {
    console.log("❌ Events Error Details:", eErr);
  } else {
    console.log("✅ Events Connection Open! First row:", eData);
  }

  console.log("\n尝试读取 Profiles...");
  const { data: pData, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  if (pErr) {
    console.log("❌ Profiles Error Details:", pErr);
  } else {
    console.log("✅ Profiles Connection Open! First row:", pData);
  }
}
test();
