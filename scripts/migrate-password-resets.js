
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    console.log("Starting migration for password_resets...");

    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0,
    });

    const connection = await pool.getConnection();

    try {
        // Check if column exists
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM password_resets LIKE 'shop_id'"
        );

        if (columns.length === 0) {
            console.log("Adding shop_id column to password_resets...");
            await connection.query(
                "ALTER TABLE password_resets ADD COLUMN shop_id INT NOT NULL DEFAULT 0"
            );
            console.log("shop_id column added.");
        } else {
            console.log("shop_id column already exists.");
        }

        // Check if index exists
        const [indices] = await connection.query(
            "SHOW INDEX FROM password_resets WHERE Key_name = 'idx_token_shop'"
        );

        if (indices.length === 0) {
            console.log("Adding index idx_token_shop...");
            await connection.query(
                "ALTER TABLE password_resets ADD INDEX idx_token_shop (token, shop_id)"
            );
            console.log("Index added.");
        } else {
            console.log("Index already exists.");
        }

        console.log("Migration complete.");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        connection.release();
        await pool.end();
        process.exit();
    }
}

migrate();
