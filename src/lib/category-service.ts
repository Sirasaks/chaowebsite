import pool from "./db";
import { RowDataPacket } from "mysql2";

export interface Category {
    id: number;
    name: string;
    slug: string;
    image: string;
    is_active?: boolean | number;
    created_at: Date;
}

export async function getAllCategories(): Promise<Category[]> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, slug, image, is_active, created_at FROM categories WHERE is_active = 1 OR is_active IS NULL ORDER BY created_at DESC"
        );
        return rows as Category[];
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, slug, image, is_active, created_at FROM categories WHERE slug = ? AND (is_active = 1 OR is_active IS NULL)",
            [slug]
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
