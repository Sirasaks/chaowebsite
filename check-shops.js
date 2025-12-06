
const pool = require('./src/lib/db').default;

async function checkShops() {
    try {
        const [rows] = await pool.query("SELECT id, subdomain, name FROM shops");
        console.log("Existing Shops:", rows);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

checkShops();
