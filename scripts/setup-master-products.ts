import pool from '../src/lib/db';
import dotenv from 'dotenv';

dotenv.config();

async function setupMasterProducts() {
    console.log("Setting up Master Products...");

    try {
        // Create master_orders table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS master_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES master_users(id),
                FOREIGN KEY (product_id) REFERENCES master_products(id)
            )
        `);
        console.log("Created master_orders table.");

        const products = [
            {
                name: 'Starter Package',
                price: 150.00,
                duration_days: 30,
                description: 'เหมาะสำหรับผู้เริ่มต้น ร้านค้าขนาดเล็ก'
            },
            {
                name: 'Pro Package',
                price: 300.00,
                duration_days: 30,
                description: 'สำหรับร้านค้าที่ต้องการฟีเจอร์ครบครัน'
            },
            {
                name: 'Enterprise Package',
                price: 900.00,
                duration_days: 30,
                description: 'รองรับการใช้งานระดับสูง ไม่จำกัด'
            }
        ];

        for (const product of products) {
            await pool.query(
                `INSERT INTO master_products (name, price, duration_days, description) 
                 VALUES (?, ?, ?, ?)`,
                [product.name, product.price, product.duration_days, product.description]
            );
            console.log(`Inserted product: ${product.name}`);
        }

        console.log("Master Products setup complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error setting up master products:", error);
        process.exit(1);
    }
}

setupMasterProducts();
