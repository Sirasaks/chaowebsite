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
    type: 'account' | 'form' | 'api';
    // category_id removed as we use Many-to-Many
    stock?: number; // Stock is now optional/virtual
    api_type_id?: string;
    is_auto_price?: boolean;
    cost_price?: string;
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
            `SELECT p.*, p.api_type_id,
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

export async function getProductBySlug(slug: string): Promise<Product | null> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT *, api_type_id FROM products WHERE slug = ? AND is_active = 1",
            [slug]
        );

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

import { getGafiwProducts } from "./gafiw-service";

export async function mergeRealTimeStock(products: Product[]): Promise<Product[]> {
    try {
        // 1. Check if we have any API products in the list
        const apiProducts = products.filter(p => p.type === 'api');
        if (apiProducts.length === 0) {
            return products;
        }

        // 2. Identify which providers we need to fetch from
        // We cast to any because api_provider might not be in the interface yet if not updated, 
        // but at runtime it will be there from the DB query "SELECT *, api_type_id FROM products"
        // Wait, the SELECT query in getProductsByCategoryId needs to include api_provider if it's not *
        // The query is "SELECT *, api_type_id FROM products", so it includes all columns.
        const hasGafiw = apiProducts.some(p => (p as any).api_provider === 'gafiw' || !(p as any).api_provider);

        let gafiwMap = new Map();

        // 3. Fetch fresh data from APIs in parallel if needed
        const promises = [];
        if (hasGafiw) promises.push(getGafiwProducts().then(data => ({ provider: 'gafiw', data })));

        const results = await Promise.all(promises);

        for (const res of results) {
            if (res.provider === 'gafiw') {
                gafiwMap = new Map(res.data.map((g: any) => [g.type_id, g]));
            }
        }

        // 4. Merge data
        return products.map(p => {
            const provider = (p as any).api_provider || 'gafiw';

            if (p.type === 'api' && (p as any).api_type_id) {
                if (provider === 'gafiw') {
                    const apiProduct = gafiwMap.get((p as any).api_type_id);
                    if (apiProduct) {
                        return {
                            ...p,
                            stock: parseInt(apiProduct.stock) || 0,
                            cost_price: apiProduct.pricevip,
                            price: p.is_auto_price ? apiProduct.price : p.price,
                        };
                    }
                }
            }
            return p;
        });

    } catch (error) {
        console.error("Error merging real-time stock:", error);
        return products;
    }
}
