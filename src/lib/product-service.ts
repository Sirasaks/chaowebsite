import pool from "./db";
import { RowDataPacket } from "mysql2";
import { unstable_cache } from "next/cache";

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
    stock?: number;
    is_active?: boolean | number;
    sold?: number;
    no_agent_discount?: boolean | number;
    category_name?: string;
    category_slug?: string;
}

async function fetchProductsByCategoryId(categoryId: number, shopId: number): Promise<Product[]> {
    try {
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

        return rows.map(row => {
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
                stock,
                is_active: Boolean(row.is_active),
                sold: Number(row.sold),
                no_agent_discount: row.no_agent_discount,
            } as Product;
        });
    } catch (error) {
        console.error(`Error fetching products for category ${categoryId}:`, error);
        return [];
    }
}

async function fetchProductBySlug(slug: string, shopId?: number): Promise<Product | null> {
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
            sold: 0,
            no_agent_discount: row.no_agent_discount,
            category_name: row.category_name,
            category_slug: row.category_slug
        } as Product;
    } catch (error) {
        console.error(`Error fetching product with slug ${slug}:`, error);
        return null;
    }
}

// --- Cached Exports ---

export const getProductsByCategoryId = unstable_cache(
    async (categoryId: number, shopId: number) => fetchProductsByCategoryId(categoryId, shopId),
    ['category-products'],
    { revalidate: false, tags: ['products'] }
);

export const getProductBySlug = unstable_cache(
    async (slug: string, shopId?: number) => fetchProductBySlug(slug, shopId),
    ['product-detail'],
    { revalidate: false, tags: ['products'] }
);



