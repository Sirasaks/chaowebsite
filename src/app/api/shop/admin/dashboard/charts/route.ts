import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function GET(request: Request) {
    try {
        const shopId = await getShopIdFromRequest(request);
        if (!shopId) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || 'week';

        // 1. Authenticate Admin
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, getJwtSecret());
        } catch (err) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        const connection = await pool.getConnection();

        try {
            // Verify admin/owner role
            const [users] = await connection.query<RowDataPacket[]>(
                "SELECT role FROM users WHERE id = ? AND shop_id = ?",
                [decoded.userId, shopId]
            );

            if (users.length === 0 || users[0].role !== 'owner') {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            let topupQuery = "";
            let salesQuery = "";
            let userQuery = "";
            let formatData: (data: any[], key: string) => any[] = () => [];

            if (range === 'year') {
                // Yearly data (Current Year: Jan - Dec)
                const commonWhere = `YEAR(created_at) = YEAR(CURDATE()) AND shop_id = ?`;

                topupQuery = `SELECT DATE_FORMAT(created_at, '%Y-%m') as label, SUM(amount) as total FROM topup_history WHERE ${commonWhere} AND status = 'completed' GROUP BY label ORDER BY label ASC`;
                salesQuery = `SELECT DATE_FORMAT(created_at, '%Y-%m') as label, SUM(price * quantity) as total FROM orders WHERE ${commonWhere} AND status = 'completed' GROUP BY label ORDER BY label ASC`;
                userQuery = `SELECT DATE_FORMAT(created_at, '%Y-%m') as label, COUNT(*) as count FROM users WHERE ${commonWhere} GROUP BY label ORDER BY label ASC`;

                formatData = (data: any[], key: string) => {
                    const result = [];
                    const today = new Date();
                    const year = today.getFullYear();

                    for (let i = 0; i < 12; i++) {
                        const month = String(i + 1).padStart(2, '0');
                        const label = `${year}-${month}`;

                        const found = data.find(item => item.label === label);
                        result.push({
                            date: label,
                            [key]: found ? parseFloat(found[key] || found.total || 0) : 0
                        });
                    }
                    return result;
                };

            } else if (range === 'month') {
                // Monthly data (Current Month: Aggregated by Week)
                const commonWhere = `YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND shop_id = ?`;

                topupQuery = `SELECT DATE(created_at) as label, SUM(amount) as total FROM topup_history WHERE ${commonWhere} AND status = 'completed' GROUP BY label ORDER BY label ASC`;
                salesQuery = `SELECT DATE(created_at) as label, SUM(price * quantity) as total FROM orders WHERE ${commonWhere} AND status = 'completed' GROUP BY label ORDER BY label ASC`;
                userQuery = `SELECT DATE(created_at) as label, COUNT(*) as count FROM users WHERE ${commonWhere} GROUP BY label ORDER BY label ASC`;

                formatData = (data: any[], key: string) => {
                    const result = [];

                    // Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-End
                    for (let i = 1; i <= 5; i++) {
                        const startDay = (i - 1) * 7 + 1;
                        const endDay = i === 5 ? 31 : i * 7;

                        const weeklyTotal = data.reduce((sum, d) => {
                            const dDate = d.label instanceof Date ? d.label : new Date(d.label);
                            const day = dDate.getDate();

                            if (day >= startDay && day <= endDay) {
                                return sum + parseFloat(d[key] || d.total || 0);
                            }
                            return sum;
                        }, 0);

                        result.push({
                            date: `Week ${i}`,
                            [key]: weeklyTotal
                        });
                    }
                    return result;
                };

            } else {
                // Default: Weekly (Current Week: Mon - Sun)
                const commonWhere = `YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) AND shop_id = ?`;

                topupQuery = `SELECT DATE(created_at) as label, SUM(amount) as total FROM topup_history WHERE ${commonWhere} AND status = 'completed' GROUP BY label ORDER BY label ASC`;
                salesQuery = `SELECT DATE(created_at) as label, SUM(price * quantity) as total FROM orders WHERE ${commonWhere} AND status = 'completed' GROUP BY label ORDER BY label ASC`;
                userQuery = `SELECT DATE(created_at) as label, COUNT(*) as count FROM users WHERE ${commonWhere} GROUP BY label ORDER BY label ASC`;

                formatData = (data: any[], key: string) => {
                    const result = [];
                    const today = new Date();
                    const day = today.getDay(); // 0 (Sun) - 6 (Sat)
                    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
                    const monday = new Date(today.setDate(diff));

                    for (let i = 0; i < 7; i++) {
                        const date = new Date(monday);
                        date.setDate(monday.getDate() + i);

                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const dayStr = String(date.getDate()).padStart(2, '0');
                        const label = `${year}-${month}-${dayStr}`;

                        const found = data.find(d => {
                            const dDate = d.label instanceof Date ? d.label.toISOString().split('T')[0] : d.label;
                            return dDate === label;
                        });

                        result.push({
                            date: label,
                            [key]: found ? parseFloat(found[key] || found.total || 0) : 0
                        });
                    }
                    return result;
                };
            }

            const [topupData] = await connection.query<RowDataPacket[]>(topupQuery, [shopId]);
            const [salesData] = await connection.query<RowDataPacket[]>(salesQuery, [shopId]);
            const [userData] = await connection.query<RowDataPacket[]>(userQuery, [shopId]);

            return NextResponse.json({
                topup: formatData(topupData, 'total'),
                sales: formatData(salesData, 'total'),
                users: formatData(userData, 'count')
            });

        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error("Dashboard Charts Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
