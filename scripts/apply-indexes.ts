import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

async function applyIndexes() {
    console.log('🔌 Connecting to database...');

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        multipleStatements: true // Allow executing multiple statements from the file
    });

    try {
        console.log('📂 Reading indexes SQL file...');
        const sqlPath = path.join(process.cwd(), 'database', 'performance_indexes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to execute individually if needed, or just run as one block since multipleStatements is on
        console.log('🚀 Applying indexes...');

        // Remove "SHOW INDEX" commands from execution as they return result sets we don't handle nicely in batch
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.toLowerCase().startsWith('show index'));

        for (const statement of statements) {
            console.log(`Executable: ${statement.substring(0, 50)}...`);
            try {
                await connection.query(statement);
            } catch (err: any) {
                // Ignore "duplicate key name" errors, meaning index exists
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log(`  ⚠ Index already exists (Skipping)`);
                } else {
                    console.error(`  ❌ Error: ${err.message}`);
                }
            }
        }

        console.log('✅ Indexes applied successfully!');
    } catch (error) {
        console.error('❌ Fatal Error:', error);
    } finally {
        await connection.end();
    }
}

applyIndexes();
