const fs = require('fs');
const https = require('https');

let url = '', key = '';
try {
  const env = fs.readFileSync('.env.local', 'utf8');
  url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/['"]/g, '');
  key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim().replace(/['"]/g, '');
} catch (e) {
  console.log("❌ Could not read configuration from .env.local");
  process.exit(1);
}

const reqOpts = (path) => ({
  hostname: url.replace('https://', ''),
  path: path,
  method: 'GET',
  headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
});

console.log("📡 Fetching accurate remote database blueprints...");

// Check events schema structure via PostgREST OpenAPI definitions
https.get(reqOpts('/rest/v1/?id=global'), (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const schema = JSON.parse(body);
      
      console.log("\n=================================");
      console.log("📊 ACTUAL 'EVENTS' TABLE COLUMNS:");
      console.log("=================================");
      if(schema.definitions && schema.definitions.events) {
        console.log(Object.keys(schema.definitions.events.properties).join('\n'));
      } else {
        console.log("❌ Events table structure hidden or not found.");
      }

      console.log("\n===================================");
      console.log("📊 ACTUAL 'PROFILES' TABLE COLUMNS:");
      console.log("===================================");
      if(schema.definitions && schema.definitions.profiles) {
        console.log(Object.keys(schema.definitions.profiles.properties).join('\n'));
      } else {
        console.log("❌ Profiles table structure hidden or not found.");
      }
    } catch(e) {
      console.log("❌ Failed parsing database metadata response.");
    }
  });
}).on('error', (e) => console.log("❌ Network connection failed:", e.message));
