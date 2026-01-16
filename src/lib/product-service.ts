import pool from "./db";
import { RowDataPacket } from "mysql2";

export interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    image: string;
    account: string;
    created_at: Date;
    slug: string;
    type: 'account' | 'form' | 'api';
    // category_id removed as we use Many-to-Many
    stock?: number; // Stock is now optional/virtual
    is_active?: boolean | number; // Database returns 0/1 as number, but can be boolean
    sold?: number;
    no_agent_discount?: boolean | number;
    category_name?: string;
    category_slug?: string;
}

export async function getProductsByCategoryId(categoryId: number, shopId: number): Promise<Product[]> {
    try {
        // Fetch products that have this category_id AND belong to this shop
        // Join with categories to get no_agent_discount
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT p.*, c.no_agent_discount,
             (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE product_id = p.id AND status = 'completed') as sold
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.category_id = ? AND p.shop_id = ? AND p.is_active = 1
             ORDER BY p.display_order ASC, p.created_at DESC`,
            [categoryId, shopId]
        );

        // Calculate stock for account type products
        return rows.map(row => {
            let stock = 0;
            if (row.type === 'account' && row.account) {
                stock = row.account.split('\\n').filter((line: string) => line.trim() !== '').length;
            }
            // Ensure price is a number
            return {
                ...row,
                price: Number(row.price),
                stock
            } as Product;
        });
    } catch (error) {
        console.error(`Error fetching products for category ${categoryId}:`, error);
        return [];
    }
}

export async function getProductBySlug(slug: string, shopId?: number): Promise<Product | null> {
    try {
        let query = `
            SELECT p.*, c.no_agent_discount, c.name as category_name, c.slug as category_slug 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ? AND p.is_active = 1
        `;
        const params: any[] = [slug];

        if (shopId) {
            query += " AND p.shop_id = ?";
            params.push(shopId);
        }

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];
        // Initialize stock to 0 and ensure price is number
        return {
            ...row,
            price: Number(row.price),
            stock: 0
        } as Product;
    } catch (error) {
        console.error(`Error fetching product with slug ${slug}:`, error);
        return null;
    }
}


