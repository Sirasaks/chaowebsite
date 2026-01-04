import pool from "./db";
import { RowDataPacket } from "mysql2";

export interface Category {
    id: number;
    name: string;
    slug: string;
    image: string;
    is_active?: boolean | number;
    is_recommended?: boolean;
    display_order?: number;
    no_agent_discount?: boolean | number;
    created_at: Date;
}

export async function getAllCategories(shopId: number): Promise<Category[]> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, slug, image, is_active, created_at FROM categories WHERE shop_id = ? AND (is_active = 1 OR is_active IS NULL) ORDER BY created_at DESC",
            [shopId]
        );
        return rows as Category[];
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

export async function getCategoryBySlug(slug: string, shopId: number): Promise<Category | null> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, slug, image, is_active, created_at FROM categories WHERE slug = ? AND shop_id = ? AND (is_active = 1 OR is_active IS NULL)",
            [slug, shopId]
        );

        if (rows.length === 0) {
            return null;
        }

        return rows[0] as Category;
    } catch (error) {
        console.error(`Error fetching category with slug ${slug}:`, error);
        return null;
    }
}
