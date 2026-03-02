
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env manually since we don't want to rely on dotenv package being installed
const envPath = path.resolve(process.cwd(), '.env');
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error("Could not read .env file. Make sure it exists in the root.");
    process.exit(1);
}

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB_ID = process.env.NOTION_DB_ID;

if (!NOTION_TOKEN || !NOTION_DB_ID) {
    console.error("Missing NOTION_TOKEN or NOTION_DB_ID in .env");
    process.exit(1);
}

const options = {
    hostname: 'api.notion.com',
    path: `/v1/databases/${NOTION_DB_ID}`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
    }
};

console.log(`Connecting to Notion Database: ${NOTION_DB_ID}...`);

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            const db = JSON.parse(data);
            console.log("\n✅ SUCCESS: Connected to Database!");
            console.log(`Database Name: ${db.title[0]?.plain_text || 'Untitled'}`);
            console.log("\n=== COLUMN SCHEMA (Expected vs Actual) ===");
            console.log("Your Code expects: Name, Email, Company, Service, Budget, Phone");
            console.log("ACTUAL COLUMNS FOUND:");
            
            Object.keys(db.properties).forEach(prop => {
                const type = db.properties[prop].type;
                console.log(`- "${prop}" (${type})`);
                if (type === 'select' || type === 'multi_select' || type === 'status') {
                    const options = db.properties[prop][type].options.map(o => o.name);
                    console.log(`   Options: [${options.join(', ')}]`);
                }
            });
            
            console.log("\nIf these don't match exactly (case-sensitive), the form will fail.");
        } else {
            console.error(`\n❌ ERROR: Notion responded with Status ${res.statusCode}`);
            try {
                const err = JSON.parse(data);
                console.error("Message:", err.message);
                if (res.statusCode === 404) {
                    console.error("--> This usually means the 'New Leaf Website' integration has not been added to the database via the '...' menu.");
                }
            } catch (e) {
                console.error(data);
            }
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
