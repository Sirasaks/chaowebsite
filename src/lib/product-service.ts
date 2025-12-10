import pool from "./db";
import { RowDataPacket } from "mysql2";

export interface Product {
    id: number;
    name: string;
    price: string;
    description: string;
    image: string;
    account: string;
    created_at: Date;
    slug: string;
    type: 'account' | 'form';
    // category_id removed as we use Many-to-Many
    stock?: number; // Stock is now optional/virtual
    is_active?: boolean | number; // Database returns 0/1 as number, but can be boolean
    sold?: number;
}

export async function getProductsByCategoryId(categoryId: number): Promise<Product[]> {
    try {
        // ดึง product_ids จาก category
        const [categoryRows] = await pool.query<RowDataPacket[]>(
            "SELECT product_ids FROM categories WHERE id = ?",
            [categoryId]
        );

        if (categoryRows.length === 0 || !categoryRows[0].product_ids) {
            return [];
        }

        const productIds = JSON.parse(categoryRows[0].product_ids);

        if (productIds.length === 0) {
            return [];
        }

        // ดึงสินค้าที่อยู่ใน product_ids และเปิดใช้งาน
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT p.*,
             (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE product_id = p.id AND status = 'completed') as sold
             FROM products p
             WHERE p.id IN (?) AND p.is_active = 1
             ORDER BY p.created_at ASC`,
            [productIds]
        );

        // Initialize stock to 0 as it's no longer in DB
        return rows.map(row => ({ ...row, stock: 0 })) as Product[];
    } catch (error) {
        console.error(`Error fetching products for category ${categoryId}:`, error);
        return [];
    }
}

export async function getProductBySlug(slug: string, shopId?: number): Promise<Product | null> {
    try {
        let query = "SELECT * FROM products WHERE slug = ? AND is_active = 1";
        const params: any[] = [slug];

        if (shopId) {
            query += " AND shop_id = ?";
            params.push(shopId);
        }

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        if (rows.length === 0) {
            return null;
        }

        // Initialize stock to 0
        return { ...rows[0], stock: 0 } as Product;
    } catch (error) {
        console.error(`Error fetching product with slug ${slug}:`, error);
        return null;
    }
}


