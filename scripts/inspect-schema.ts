
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
        console.log("Fetching columns...");
        const [cols] = await pool.query("SHOW COLUMNS FROM master_orders");
        console.log("--- MASTER ORDERS COLUMNS ---");
        (cols as any[]).forEach(c => console.log(`${c.Field} (${c.Type})`));

    } catch (e) {
        console.error(e);
    } process.exit();
}

inspect();
