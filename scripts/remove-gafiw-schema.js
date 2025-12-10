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
        console.log('Starting migration: Remove Gafiw columns from products');

        // 1. Delete related orders first (Foreign Key Constraint)
        console.log('Deleting orders related to API products...');
        await connection.query("DELETE FROM orders WHERE product_id IN (SELECT id FROM products WHERE type = 'api')");
        console.log('✅ Deleted related orders');

        // 2. Delete products with type = 'api'
        console.log('Deleting products with type="api"...');
        await connection.query("DELETE FROM products WHERE type = 'api'");
        console.log('✅ Deleted API products');

        // 3. Drop columns
        const columnsToDrop = ['api_provider', 'is_auto_price', 'api_type_id'];

        // Check columns before dropping
        const [existingColumns] = await connection.query("SHOW COLUMNS FROM products");
        const existingColumnNames = existingColumns.map(c => c.Field);

        for (const col of columnsToDrop) {
            if (existingColumnNames.includes(col)) {
                await connection.query(`ALTER TABLE products DROP COLUMN ${col}`);
                console.log(`✅ Dropped column: ${col}`);
            } else {
                console.log(`ℹ️ Column ${col} does not exist`);
            }
        }

        // 3. Update Enum
        console.log('Updating type ENUM...');
        // Note: modify column needs the full definition. Assuming type cannot be null and default is 'account' based on typcal usage, 
        // but let's check current def from the describe we did earlier or just be safe. 
        // Safer to just set it.
        await connection.query("ALTER TABLE products MODIFY COLUMN type ENUM('account', 'form') NOT NULL DEFAULT 'account'");
        console.log('✅ Updated type ENUM to account, form');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
