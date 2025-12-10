require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true // Enable multiple statements
});

async function runSqlFile() {
    const connection = await pool.getConnection();
    try {
        const sqlPath = path.join(__dirname, 'clean-db.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running SQL from:', sqlPath);
        await connection.query(sql);
        console.log('✅ SQL Executed Successfully');

    } catch (error) {
        console.error('❌ Execution failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

runSqlFile();
