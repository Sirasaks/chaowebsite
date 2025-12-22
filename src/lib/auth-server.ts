import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";

export async function checkShopAdmin(shopId: number): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return false;

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number, tokenType?: string };

        // Ensure token is for shop, not master (though verifying against shop user table implicitly checks this)
        // But explicit check is safer if token structure changes
        if (decoded.tokenType && decoded.tokenType !== 'shop') return false;

        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ? AND shop_id = ?",
            [decoded.userId, shopId]
        );
        return users.length > 0 && users[0].role === 'owner';
    } catch (error) {
        return false;
    }
}

export async function verifyShopSession(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return false;

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number; tokenType?: string };

        // Ensure it's a shop token
        if (decoded.tokenType && decoded.tokenType !== 'shop') return false;

        // Verify user still exists in database
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE id = ?",
            [decoded.userId]
        );

        return users.length > 0;
    } catch (error) {
        return false;
    }
}

export async function verifyMasterSession(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return false;

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number; tokenType?: string };

        // Ensure it's a master token
        if (decoded.tokenType !== 'master') return false;

        // Verify user still exists in database
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM master_users WHERE id = ?",
            [decoded.userId]
        );

        return users.length > 0;
    } catch (error) {
        return false;
    }
}
