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

async function fixEnum() {
    const connection = await pool.getConnection();
    try {
        console.log('Checking current schema...');
        const [columns] = await connection.query("SHOW COLUMNS FROM products WHERE Field = 'type'");
        console.log('Current Type Definition:', columns[0].Type);

        console.log('Attempting to update Enum...');
        // Force update just to be sure
        await connection.query("ALTER TABLE products MODIFY COLUMN type ENUM('account', 'form') NOT NULL DEFAULT 'account'");

        console.log('✅ Updated Enum');

        const [columnsAfter] = await connection.query("SHOW COLUMNS FROM products WHERE Field = 'type'");
        console.log('New Type Definition:', columnsAfter[0].Type);

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

fixEnum();
