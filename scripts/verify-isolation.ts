// Load env vars
import fs from 'fs';
import path from 'path';

try {
    const envPath = path.resolve(__dirname, '../.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error("Error loading .env:", e);
}

import mysql from 'mysql2/promise';

// Create standalone pool
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

import { RowDataPacket } from 'mysql2';

async function verifyIsolation() {
    console.log("🔒 Starting Security Isolation Probe...\n");

    try {
        // 1. Get Active Shops
        const [shops] = await pool.query<RowDataPacket[]>("SELECT id, subdomain, name FROM shops LIMIT 2");

        if (shops.length < 2) {
            console.log("⚠️  Not enough shops to test isolation. Need at least 2 shops.");
            console.log("Current shops:", shops);
            return;
        }

        const shop1 = shops[0];
        const shop2 = shops[1];

        console.log(`🎯 Target Shop 1: ${shop1.name} (${shop1.subdomain})`);
        console.log(`🎯 Target Shop 2: ${shop2.name} (${shop2.subdomain})`);
        console.log("---------------------------------------------------");

        // 2. Test Public API Isolation
        console.log("\n🧪 Test 1: Public API Isolation (Recommended Products)");

        const fetchShopData = async (subdomain: string) => {
            try {
                const res = await fetch('http://127.0.0.1:3000/api/shop/home/recommended', {
                    headers: {
                        'Host': `${subdomain}.localhost:3000`,
                        'x-shop-subdomain': subdomain // Explicitly set for testing API logic directly
                    }
                });
                if (!res.ok) {
                    const text = await res.text();
                    console.log(`   ❌ Error Body (${subdomain}):`, text.substring(0, 100));
                    return { status: res.status, data: null };
                }
                return { status: res.status, data: await res.json() };
            } catch (e) {
                return { status: 500, error: e };
            }
        };

        const result1 = await fetchShopData(shop1.subdomain);
        const result2 = await fetchShopData(shop2.subdomain);

        console.log(`   Shop 1 Request (${shop1.subdomain}): Status ${result1.status}`);
        console.log(`   Shop 2 Request (${shop2.subdomain}): Status ${result2.status}`);

        // Compare Data
        const products1 = result1.data?.products || [];
        const products2 = result2.data?.products || [];

        console.log(`   Shop 1 Products Found: ${products1.length}`);
        console.log(`   Shop 2 Products Found: ${products2.length}`);

        if (JSON.stringify(products1) !== JSON.stringify(products2)) {
            console.log("✅ PASS: Data returned for Shop 1 and Shop 2 is DIFFERENT.");
        } else {
            if (products1.length === 0 && products2.length === 0) {
                console.log("⚠️  WARNING: Both shops have 0 products. Hard to verify isolation.");
            } else {
                console.log("❌ FAIL: Data appears identical. Check if shops share data.");
            }
        }

        // 3. Test Global Scope Leak
        console.log("\n🧪 Test 2: Global Scope Leak (No Subdomain)");
        const globalRes = await fetch('http://127.0.0.1:3000/api/shop/home/recommended', {
            headers: {
                'Host': `localhost:3000`
            }
        });

        console.log(`   Global Request Status: ${globalRes.status}`);
        if (globalRes.status === 404) {
            console.log("✅ PASS: Global request was rejected (404 Not Found).");
        } else {
            console.log(`❌ FAIL: Global request was accepted (Status ${globalRes.status}). Data leak possible.`);
        }

        // 4. Test Specific Product Isolation
        console.log("\n🧪 Test 3: Specific Product Isolation");
        const targetSlug = 'blox-fruit--1764868704827';
        const ownerShop = 'shop9';
        const otherShop = 'shop10';

        console.log(`   Target Product: ${targetSlug} (Owner: ${ownerShop})`);

        // Try accessing from Owner Shop
        const ownerRes = await fetch(`http://127.0.0.1:3000/products/${targetSlug}`, {
            headers: {
                'Host': `${ownerShop}.localhost:3000`,
                'x-shop-subdomain': ownerShop
            }
        });
        console.log(`   Owner Shop (${ownerShop}) Access: Status ${ownerRes.status}`);

        // Try accessing from Other Shop
        const otherRes = await fetch(`http://127.0.0.1:3000/products/${targetSlug}`, {
            headers: {
                'Host': `${otherShop}.localhost:3000`,
                'x-shop-subdomain': otherShop
            }
        });
        console.log(`   Other Shop (${otherShop}) Access: Status ${otherRes.status}`);

        if (ownerRes.status === 200 && otherRes.status === 404) {
            console.log("✅ PASS: Product is accessible ONLY by owner shop.");
        } else {
            console.log("❌ FAIL: Isolation failed. Check status codes.");
        }

    } catch (error) {
        console.error("❌ Error running probe:", error);
    } finally {
        process.exit();
    }
}

verifyIsolation();
