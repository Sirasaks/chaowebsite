import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import jwt from "jsonwebtoken"
import pool from "@/lib/db"
import { getJwtSecret } from "@/lib/env"
import { MasterHistoryClient } from "./components/MasterHistoryClient"

// Force dynamic since we read cookies
export const dynamic = 'force-dynamic'

async function getHistory() {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) return null

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number; role?: string; tokenType?: string }

        // Verify this is a master token
        if (decoded.tokenType && decoded.tokenType !== 'master') {
            return null
        }

        const [rows] = await pool.query(
            `SELECT 
                s.id, 
                s.name, 
                s.subdomain, 
                s.expire_date, 
                s.created_at,
                COALESCE(mo.data, o.data) as order_data
            FROM shops s
            LEFT JOIN (
                SELECT shop_id, data,
                       ROW_NUMBER() OVER (PARTITION BY shop_id ORDER BY id ASC) as rn
                FROM master_orders 
                WHERE data LIKE '%"username":%'
            ) mo ON mo.shop_id = s.id AND mo.rn = 1
            LEFT JOIN (
                SELECT shop_id, data,
                       ROW_NUMBER() OVER (PARTITION BY shop_id ORDER BY id ASC) as rn  
                FROM orders
                WHERE data LIKE '%"username":%'
            ) o ON o.shop_id = s.id AND o.rn = 1 AND mo.data IS NULL
            WHERE s.owner_id = ?
            ORDER BY s.created_at DESC`,
            [decoded.userId]
        )

        // Serialize data (dates need to be strings for consistency if passing to client, 
        // typically mysql2 returns Date objects for datetime columns, but JSON.stringify/Next.js might handle it or we should be explicit)
        // Ideally we map it to match the interface of the client component
        return (rows as any[]).map(row => ({
            ...row,
            created_at: row.created_at.toISOString(),
            expire_date: row.expire_date.toISOString(), // Assuming these are Date objects from DB
        }))

    } catch (err) {
        console.error("Error fetching history:", err)
        return null
    }
}

export default async function MasterHistoryPage() {
    const shops = await getHistory()

    if (shops === null) {
        redirect("/login")
    }

    return <MasterHistoryClient initialShops={shops} />
}

