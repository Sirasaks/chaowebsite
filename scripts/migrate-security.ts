import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

async function migrateSecurity() {
    console.log('🔌 Connecting to database...');

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        multipleStatements: true
    });

    try {
        console.log('📂 Reading migration file...');
        const sqlPath = path.join(process.cwd(), 'database', 'migrations', '004_refresh_tokens.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Applying migration...');

        const statements = sql
            .split(';')
            .map(s => {
                // Remove comment lines and trim
                return s.split('\n')
                    .map(line => line.trim())
                    .filter(line => !line.startsWith('--') && line.length > 0)
                    .join(' ');
            })
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            try {
                await connection.query(statement);
            } catch (err: any) {
                // Ignore "table exists" errors
                if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`  ⚠ Table already exists (Skipping)`);
                } else {
                    console.error(`  ❌ Error: ${err.message}`);
                }
            }
        }

        console.log('✅ Security migration applied successfully!');

        // Verification
        console.log('🔍 Verifying tables...');
        const [tables] = await connection.query('SHOW TABLES LIKE "%refresh_tokens%"');
        console.log('Found tables:', (tables as any[]).map(t => Object.values(t)[0]));

    } catch (error) {
        console.error('❌ Fatal Error:', error);
    } finally {
        await connection.end();
    }
}

migrateSecurity();
