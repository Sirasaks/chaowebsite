import axios from 'axios';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const GAFIW_API_URL = 'https://gafiwshop.xyz/api';

async function getGafiwApiKey(shopId: number): Promise<string> {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT setting_value FROM settings WHERE shop_id = ? AND setting_key = 'gafiw_api_key'",
            [shopId]
        );
        if (rows.length > 0 && rows[0].setting_value) {
            return rows[0].setting_value;
        }
    } catch (error) {
        console.error("Error fetching Gafiw API Key from DB:", error);
    }
    return "";
}

export interface GafiwProduct {
    name: string;
    imageapi: string;
    details: string;
    price: string;
    pricevip: string;
    stock: string;
    type_menu: string;
    type_id: string;
}

export interface GafiwBuyResponse {
    ok: boolean;
    status?: string;
    message?: string;
    data?: {
        uid: number;
        name: string;
        imageapi: string;
        textdb: string;
        point: number;
        date: string;
    };
    error?: string;
}

export async function getGafiwBalance(shopId: number): Promise<string> {
    try {
        const apiKey = await getGafiwApiKey(shopId);
        const params = new URLSearchParams();
        params.append('keyapi', apiKey);

        const response = await axios.post(`${GAFIW_API_URL}/api_money`, params);

        // Check for user documentation format
        if (response.data.ok && response.data.balance) {
            return response.data.balance;
        }

        // Check for actual API format seen in verification
        if (response.data.status === 'success' && response.data.msg) {
            return response.data.msg.replace(' บาท', '');
        }

        throw new Error('Failed to fetch balance: ' + JSON.stringify(response.data));
    } catch (error) {
        console.error('Error fetching Gafiw balance:', error);
        throw error;
    }
}

export async function getGafiwProducts(): Promise<GafiwProduct[]> {
    try {
        const response = await axios.get(`${GAFIW_API_URL}/api_product`);
        if (response.data.ok) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching Gafiw products:', error);
        return [];
    }
}

export async function buyGafiwProduct(shopId: number, typeId: string, usernameBuy?: string): Promise<GafiwBuyResponse> {
    try {
        const apiKey = await getGafiwApiKey(shopId);
        const params = new URLSearchParams();
        params.append('keyapi', apiKey);
        params.append('type_id', typeId);
        if (usernameBuy) {
            params.append('username_buy', usernameBuy);
        }

        const response = await axios.post(`${GAFIW_API_URL}/api_buy`, params);
        return response.data;
    } catch (error: any) {
        console.error('Error buying Gafiw product:', error);

        if (axios.isAxiosError(error) && error.response) {
            const data = error.response.data;
            console.error("Gafiw API Error Response:", JSON.stringify(data, null, 2));
            const msg = data?.message || data?.msg || data?.error || error.message;
            return {
                ok: false,
                message: msg,
                error: msg
            };
        }

        return {
            ok: false,
            message: error.message || "Unknown error occurred",
            error: error.message
        };
    }
}

export async function getGafiwHistory(shopId: number, limit: number | 'all' = 1000): Promise<any[]> {
    try {
        const apiKey = await getGafiwApiKey(shopId);
        const params = new URLSearchParams();
        params.append('keyapi', apiKey);
        params.append('limit', limit.toString());

        const response = await axios.post(`${GAFIW_API_URL}/api_history`, params);
        if (response.data.ok) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching Gafiw history:', error);
        return [];
    }
}
