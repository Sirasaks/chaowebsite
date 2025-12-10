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

async function migrate() {
    const connection = await pool.getConnection();
    try {
        console.log('Starting migration: Add announcement_text to site_settings');

        // Check if column exists
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM site_settings LIKE 'announcement_text'"
        );

        if (columns.length === 0) {
            // Add column
            await connection.query(
                "ALTER TABLE site_settings ADD COLUMN announcement_text TEXT DEFAULT NULL"
            );
            console.log('✅ Added announcement_text column');
        } else {
            console.log('ℹ️ Column announcement_text already exists');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
