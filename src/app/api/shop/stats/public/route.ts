import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        // 1. Total Users
        const [userResult] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as total_users FROM users"
        );
        const totalUsers = userResult[0].total_users || 0;

        // 2. Total Products
        const [productResult] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as total_products FROM products"
        );
        const totalProducts = productResult[0].total_products || 0;

        // 3. Total Top-up Amount (Replacing Stock)
        // Ensure table exists first (just in case)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS topup_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                trans_ref VARCHAR(255) NOT NULL UNIQUE,
                amount DECIMAL(10, 2) NOT NULL,
                sender_name VARCHAR(255),
                receiver_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        const [topupResult] = await pool.query<RowDataPacket[]>(
            "SELECT SUM(amount) as total_topup FROM topup_history WHERE status = 'completed'"
        );
        const totalTopup = topupResult[0].total_topup || 0;

        // 4. Total Sold (Optional: using orders count or sum of quantity)
        // For now, let's count total orders as "Sold"
        // Ensure table exists first
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                data TEXT,
                status VARCHAR(50) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        const [soldResult] = await pool.query<RowDataPacket[]>(
            "SELECT SUM(quantity) as total_sold FROM orders WHERE status = 'completed'"
        );
        const totalSold = soldResult[0].total_sold || 0;

        return NextResponse.json({
            totalUsers,
            totalProducts,
            totalTopup,
            totalSold
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });

    } catch (error: any) {
        console.error("Fetch Public Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
