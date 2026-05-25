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

const hostname = url.replace('https://', '');

const makeRequest = (path, name) => {
  const options = {
    hostname: hostname,
    path: path,
    method: 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Range': '0-0' // Just get 1 item to inspect structure
    }
  };

  console.log(`📡 Sending request to live ${name} endpoint...`);
  
  https.get(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`\n--- ${name.toUpperCase()} RESPONSE ---`);
      console.log(`Status Code: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(body);
        console.log("Data Payload:", JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log("Raw Payload Output:", body || "[Empty Response]");
      }
    });
  }).on('error', (e) => console.log(`❌ ${name} Connection failed:`, e.message));
};

makeRequest('/rest/v1/events', 'Events');
setTimeout(() => makeRequest('/rest/v1/profiles', 'Profiles'), 1500);
