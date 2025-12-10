require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

async function listTables() {
    const connection = await pool.getConnection();
    try {
        console.log('Current Database:', process.env.MYSQL_DATABASE);
        const [rows] = await connection.query("SHOW TABLES");
        console.log('Tables:', rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

listTables();
