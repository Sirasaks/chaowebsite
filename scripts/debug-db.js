require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

async function debug() {
    const connection = await pool.getConnection();
    try {
        console.log('--- DB DIAGNOSTIC ---');
        console.log('Connected to Host:', process.env.MYSQL_HOST);
        console.log('Target Database:', process.env.MYSQL_DATABASE);

        const [rows] = await connection.query("SELECT DATABASE() as current_db");
        console.log('Actual Connected DB:', rows[0].current_db);

        console.log('\n--- TABLE: products ---');
        const [createTable] = await connection.query("SHOW CREATE TABLE products");
        console.log(createTable[0]['Create Table']);

        console.log('\n--- COLUMNS ---');
        const [columns] = await connection.query("SHOW FULL COLUMNS FROM products");
        columns.forEach(col => {
            console.log(`${col.Field}: ${col.Type} (Collation: ${col.Collation}, Null: ${col.Null})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

debug();
