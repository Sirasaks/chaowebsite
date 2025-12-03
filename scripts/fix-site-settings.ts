import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("DB Config:", {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DATABASE
});

async function fixSiteSettings() {
    // Dynamic import to ensure env vars are loaded first
    const { default: pool } = await import("@/lib/db");
    const connection = await pool.getConnection();
    try {
        console.log("Fixing site_settings table...");

        // Check if the table exists and has the wrong schema
        // We'll just try to ALTER it. If it's already auto_increment, it might not hurt, 
        // but let's be careful.

        // First, drop the default value if it exists (MySQL might complain if we just modify)
        // Actually, MODIFY COLUMN can handle it.

        await connection.query("ALTER TABLE site_settings MODIFY id int(11) NOT NULL AUTO_INCREMENT");

        console.log("Successfully altered site_settings.id to AUTO_INCREMENT");

    } catch (error) {
        console.error("Error fixing site_settings:", error);
    } finally {
        connection.release();
        process.exit();
    }
}

fixSiteSettings();
