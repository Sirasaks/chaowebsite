import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromContext } from "@/lib/shop-helper";
import { RowDataPacket } from "mysql2";

export interface ServerUser {
    id: number;
    username: string;
    role: string;
    credit: number;
    agent_discount?: number;
}

export async function getServerUser(): Promise<ServerUser | null> {
    try {
        const shopId = await getShopIdFromContext();
        if (!shopId) return null;

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) return null;

        const secret = getJwtSecret();
        const decoded = jwt.verify(token, secret) as { userId: number };

        // Fetch User with agent_discount
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, username, role, credit, IFNULL(agent_discount, 0) as agent_discount FROM users WHERE id = ? AND shop_id = ?",
            [decoded.userId, shopId]
        );

        if (rows.length === 0) return null;

        const user = rows[0];
        return {
            id: user.id,
            username: user.username,
            role: user.role,
            credit: Number(user.credit),
            agent_discount: Number(user.agent_discount)
        };
    } catch (error) {
        return null; // Token invalid or other error
    }
}
