
import mysql from 'mysql2/promise';

// Create standalone pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'my_shop_v4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function getTestProduct() {
    try {
        const [rows] = await pool.query("SELECT p.slug, p.shop_id, s.subdomain, p.is_active FROM products p JOIN shops s ON p.shop_id = s.id LIMIT 1");
        console.log("Test Product:", rows);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

getTestProduct();
