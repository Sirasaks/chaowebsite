
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Load env
try {
    const envPath = path.resolve(__dirname, '../.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) { console.error(e); }

async function verifyHistoryFull() {
    console.log("🔒 Verifying Master History API (Full)...\n");

    const userId = 1; // zotangx2
    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ userId, role: 'user' }, secret, { expiresIn: '1h' });

    const url = `http://127.0.0.1:3000/api/master/history`;

    console.log(`🎯 Target: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'Cookie': `token=${token}`,
                'Host': 'localhost:3000'
            }
        });

        console.log(`   Status: ${res.status}`);

        if (res.status === 200) {
            const data = await res.json();
            console.log("✅ PASS: API returned 200 OK.");
            console.log(`   Found ${data.shops?.length || 0} shops.`);

            if (data.shops && data.shops.length > 0) {
                console.log("\n--- All Shops ---");
                data.shops.forEach((shop: any) => {
                    console.log(`[${shop.id}] ${shop.name} (${shop.subdomain})`);
                    console.log(`   Order Data: ${shop.order_data ? 'Found' : 'NULL'}`);
                    if (shop.order_data) {
                        try {
                            const parsed = JSON.parse(shop.order_data);
                            console.log(`   Creds: ${parsed.username} / ${parsed.password}`);
                        } catch (e) { console.log("   Invalid JSON"); }
                    }
                });
            }
        } else {
            console.log(`❌ FAIL: Status ${res.status}.`);
            const text = await res.text();
            console.log("   Response:", text);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

verifyHistoryFull();
