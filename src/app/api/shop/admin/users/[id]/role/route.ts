import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { z } from "zod";

// Helper to check admin role with shop scope and get admin info
async function checkAdmin(shopId: number): Promise<{ isAdmin: boolean; adminId?: number; adminRole?: string }> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return { isAdmin: false };

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT id, role FROM users WHERE id = ? AND shop_id = ?",
            [decoded.userId, shopId]
        );
        if (users.length > 0 && users[0].role === 'owner') {
            return { isAdmin: true, adminId: users[0].id, adminRole: users[0].role };
        }
        return { isAdmin: false };
    } catch (error) {
        return { isAdmin: false };
    }
}

const updateSchema = z.object({
    role: z.enum(["user", "agent", "owner"]).optional(),
    agent_discount: z.number().min(0).max(100).optional(),
});

// PUT: Update user role and/or agent_discount
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const { isAdmin, adminId } = await checkAdmin(shopId);
    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    // Can't edit yourself
    if (userId === adminId) {
        return NextResponse.json({ error: "ไม่สามารถแก้ไขบัญชีตัวเองได้" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { role, agent_discount } = updateSchema.parse(body);

        // Check user exists
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ? AND shop_id = ? AND IFNULL(is_deleted, 0) = 0",
            [userId, shopId]
        );

        if (users.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentRole = users[0].role;

        // Count current owners
        const [owners] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as count FROM users WHERE shop_id = ? AND role = 'owner' AND IFNULL(is_deleted, 0) = 0",
            [shopId]
        );

        // Prevent removing the last owner
        if (currentRole === 'owner' && role && role !== 'owner' && owners[0].count <= 1) {
            return NextResponse.json({ error: "ไม่สามารถเปลี่ยน role ของเจ้าของร้านคนสุดท้ายได้" }, { status: 400 });
        }

        // Build update query
        const updates: string[] = [];
        const params: any[] = [];

        if (role !== undefined) {
            updates.push("role = ?");
            params.push(role);
        }

        if (agent_discount !== undefined) {
            updates.push("agent_discount = ?");
            params.push(agent_discount);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: "ไม่มีข้อมูลที่ต้องอัปเดต" }, { status: 400 });
        }

        params.push(userId, shopId);

        await pool.query<ResultSetHeader>(
            `UPDATE users SET ${updates.join(", ")} WHERE id = ? AND shop_id = ?`,
            params
        );

        const roleNames: Record<string, string> = {
            owner: "เจ้าของร้าน",
            agent: "นายหน้า",
            user: "ผู้ใช้ทั่วไป"
        };

        let message = "อัปเดตสำเร็จ";
        if (role) {
            message = `เปลี่ยน role เป็น ${roleNames[role] || role} สำเร็จ`;
        }
        if (agent_discount !== undefined) {
            message = `ตั้งค่าส่วนลดนายหน้า ${agent_discount}% สำเร็จ`;
        }
        if (role && agent_discount !== undefined) {
            message = `อัปเดต role และส่วนลดสำเร็จ`;
        }

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        console.error("Update User Error:", error);
        if (error.name === "ZodError") {
            return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
