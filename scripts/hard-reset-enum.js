require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

async function hardResetEnum() {
    const connection = await pool.getConnection();
    try {
        console.log('🔄 Starting Hard Reset of "type" column...');

        // 1. Backup existing types
        console.log('📦 Backing up existing types...');
        const [rows] = await connection.query("SELECT id, type FROM products");
        const typeMap = new Map();
        rows.forEach(row => {
            // If type was 'api', map to 'account' or just let it default
            const newType = row.type === 'api' ? 'account' : row.type;
            typeMap.set(row.id, newType);
        });

        // 2. Drop Column
        console.log('🔥 Dropping column "type"...');
        await connection.query("ALTER TABLE products DROP COLUMN type");

        // 3. Add Column with Clean Enum
        console.log('✨ Re-creating column "type" with ENUM("account", "form")...');
        await connection.query("ALTER TABLE products ADD COLUMN type ENUM('account', 'form') NOT NULL DEFAULT 'account' AFTER description");

        // 4. Restore Data
        console.log('💾 Restoring data...');
        for (const [id, type] of typeMap) {
            await connection.query("UPDATE products SET type = ? WHERE id = ?", [type, id]);
        }

        console.log('✅ Hard reset complete.');

        const [columns] = await connection.query("SHOW COLUMNS FROM products WHERE Field = 'type'");
        console.log('🔍 Final Type Definition:', columns[0].Type);

    } catch (error) {
        console.error('❌ Reset failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

hardResetEnum();
