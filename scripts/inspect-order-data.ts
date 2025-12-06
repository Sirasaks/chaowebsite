
import mysql from 'mysql2/promise';
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

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

async function inspect() {
    try {
        const [rows] = await pool.query("SELECT id, shop_id, user_id, data FROM orders WHERE data LIKE '%password%' LIMIT 10");
        console.log("--- ORDERS WITH CREDENTIALS ---");
        (rows as any[]).forEach(r => {
            console.log(`Order ID: ${r.id}, Shop ID: ${r.shop_id}`);
            console.log(`Data: ${r.data}`);
            console.log("---");
        });
    } catch (e) {
        console.error(e);
    } process.exit();
}

inspect();
