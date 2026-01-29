import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { unstable_cache } from "next/cache";

export interface MasterProduct {
    id: number;
    name: string;
    price: string;
    duration_days: number;
    description: string;
    is_active: boolean;
}

export interface MasterPaymentSettings {
    bank_transfer_enabled: boolean;
    truemoney_angpao_enabled: boolean;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
}

async function fetchMasterProducts(): Promise<MasterProduct[]> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, price, duration_days, description, is_active FROM master_products WHERE is_active = 1 ORDER BY price ASC"
        );
        return rows as MasterProduct[];
    } catch (error) {
        console.error("Error fetching master products:", error);
        return [];
    }
}

async function fetchMasterPaymentSettings(): Promise<MasterPaymentSettings> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT setting_key, setting_value FROM master_settings WHERE setting_key IN ('bank_name', 'bank_account_number', 'bank_account_name', 'bank_transfer_enabled', 'truemoney_angpao_enabled')"
        );

        const settings: Record<string, string> = {};
        rows.forEach((row) => {
            settings[row.setting_key] = row.setting_value;
        });

        return {
            bank_transfer_enabled: settings.bank_transfer_enabled !== 'false' && settings.bank_transfer_enabled !== '0',
            truemoney_angpao_enabled: settings.truemoney_angpao_enabled !== 'false' && settings.truemoney_angpao_enabled !== '0',
            bank_name: settings.bank_name,
            bank_account_number: settings.bank_account_number,
            bank_account_name: settings.bank_account_name,
        };
    } catch (error) {
        console.error("Error fetching master payment settings:", error);
        return {
            bank_transfer_enabled: true,
            truemoney_angpao_enabled: true,
        };
    }
}

// --- Cached Exports ---

export const getMasterProducts = unstable_cache(
    async () => fetchMasterProducts(),
    ['master-products'],
    { revalidate: false, tags: ['master-products'] }
);

export const getMasterPaymentSettings = unstable_cache(
    async () => fetchMasterPaymentSettings(),
    ['master-payment-settings'],
    { revalidate: false, tags: ['master-settings'] }
);
