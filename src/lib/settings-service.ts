import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getShopIdFromContext } from "@/lib/shop-helper";

export interface SiteSettings {
    site_title: string;
    site_description: string;
    site_icon: string;
    site_logo: string;
    site_background: string;
    primary_color: string;
    secondary_color: string;
    contact_link?: string;
    site_font?: string;
}

export async function getSiteSettings(shopIdOverride?: number): Promise<SiteSettings> {
    const connection = await pool.getConnection();
    try {
        let shopId = shopIdOverride;

        if (shopId === undefined) {
            shopId = await getShopIdFromContext() || 0;
        }

        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM site_settings WHERE shop_id = ?",
            [shopId]
        );

        if (rows.length === 0) {
            return {
                site_title: 'My Shop',
                site_description: 'ร้านค้าออนไลน์ของคุณ',
                site_icon: '',
                site_logo: '',
                site_background: '',
                primary_color: '#ea580c',
                secondary_color: '#8b5cf6',
                contact_link: ''
            };
        }

        return rows[0] as SiteSettings;
    } catch (error) {
        console.error("Fetch Settings Error:", error);
        return {
            site_title: 'My Shop',
            site_description: 'ร้านค้าออนไลน์ของคุณ',
            site_icon: '',
            site_logo: '',
            site_background: '',
            primary_color: '#ea580c',
            secondary_color: '#8b5cf6',
            contact_link: ''
        };
    } finally {
        connection.release();
    }
}
