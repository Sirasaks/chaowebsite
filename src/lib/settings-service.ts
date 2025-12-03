import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface SiteSettings {
    site_title: string;
    site_description: string;
    site_icon: string;
    site_logo: string;
    site_background: string;
    primary_color: string;
    secondary_color: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM site_settings WHERE id = 1"
        );

        if (rows.length === 0) {
            return {
                site_title: 'My Shop V4',
                site_description: 'ร้านค้าออนไลน์ของคุณ',
                site_icon: '',
                site_logo: '',
                site_background: '',
                primary_color: '#ea580c',
                secondary_color: '#8b5cf6'
            };
        }

        return rows[0] as SiteSettings;
    } catch (error) {
        console.error("Fetch Settings Error:", error);
        return {
            site_title: 'My Shop V4',
            site_description: 'ร้านค้าออนไลน์ของคุณ',
            site_icon: '',
            site_logo: '',
            site_background: '',
            primary_color: '#ea580c',
            secondary_color: '#8b5cf6'
        };
    } finally {
        connection.release();
    }
}
