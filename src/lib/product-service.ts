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
        // Optimized: Select specific columns instead of p.*
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT p.id, p.name, p.price, p.description, p.image, p.account, p.created_at, p.slug, p.type, 
             p.is_active, p.display_order,
             c.no_agent_discount,
             COALESCE(SUM(o.quantity), 0) as sold
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN orders o ON o.product_id = p.id AND o.status = 'completed'
             WHERE p.category_id = ? AND p.shop_id = ? AND p.is_active = 1
             GROUP BY p.id, p.name, p.price, p.description, p.image, p.account, p.created_at, p.slug, p.type, p.is_active, p.display_order, c.no_agent_discount
             ORDER BY p.display_order ASC, p.created_at DESC`,
            [categoryId, shopId]
        );

        // Calculate stock for account type products
        return rows.map(row => {
            let stock = 0;
            if (row.type === 'account' && row.account) {
                stock = row.account.split('\n').filter((line: string) => line.trim() !== '').length;
            }
            // Ensure price is a number
            return {
                id: row.id,
                name: row.name,
                price: Number(row.price),
                description: row.description,
                image: row.image,
                account: row.account, // We might need this for stock calc, but frontend might not need the full list if it's huge. 
                // However, the interface requires it.
                created_at: row.created_at,
                slug: row.slug,
                type: row.type,
                stock,
                is_active: Boolean(row.is_active),
                sold: Number(row.sold),
                no_agent_discount: row.no_agent_discount,
                // category_name is not in this query, but that's fine as per interface optionality
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
            SELECT p.id, p.name, p.price, p.description, p.image, p.account, p.created_at, p.slug, p.type, 
                   p.is_active, p.category_id,
                   c.no_agent_discount, c.name as category_name, c.slug as category_slug 
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

        // Calculate stock if needed (single product view might need specific stock count)
        let stock = 0;
        if (row.type === 'account' && row.account) {
            stock = row.account.split('\n').filter((line: string) => line.trim() !== '').length;
        }

        return {
            id: row.id,
            name: row.name,
            price: Number(row.price),
            description: row.description,
            image: row.image,
            account: row.account,
            created_at: row.created_at,
            slug: row.slug,
            type: row.type,
            stock: stock,
            is_active: Boolean(row.is_active),
            sold: 0, // Individual product fetch might not need total sold unless specified, kept 0 for now as per original
            no_agent_discount: row.no_agent_discount,
            category_name: row.category_name,
            category_slug: row.category_slug
        } as Product;
    } catch (error) {
        console.error(`Error fetching product with slug ${slug}:`, error);
        return null;
    }
}


