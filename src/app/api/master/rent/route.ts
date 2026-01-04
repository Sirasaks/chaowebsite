import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

// Reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = [
    'admin', 'api', 'www', 'master', 'shop', 'app', 'mail', 'email',
    'ftp', 'ssh', 'static', 'cdn', 'assets', 'img', 'images', 'media',
    'help', 'support', 'docs', 'blog', 'status', 'test', 'dev', 'staging',
    'demo', 'beta', 'alpha', 'login', 'register', 'signup', 'auth',
    'dashboard', 'panel', 'console', 'root', 'system', 'null', 'undefined'
];

// Validate subdomain format and reserved words
function validateSubdomain(subdomain: string): { valid: boolean; error?: string } {
    // Check minimum length
    if (subdomain.length < 3) {
        return { valid: false, error: "Subdomain ต้องมีความยาวอย่างน้อย 3 ตัวอักษร" };
    }

    // Check maximum length
    if (subdomain.length > 50) {
        return { valid: false, error: "Subdomain ต้องมีความยาวไม่เกิน 50 ตัวอักษร" };
    }

    // Check format (only lowercase letters and numbers)
    if (!/^[a-z0-9]+$/.test(subdomain)) {
        return { valid: false, error: "Subdomain ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์เล็กและตัวเลขเท่านั้น" };
    }

    // Check reserved words
    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        return { valid: false, error: "ไม่สามารถใช้ชื่อเว็บไซต์นี้ได้ (Reserved)" };
    }

    return { valid: true };
}

export async function POST(request: Request) {
    // Rate limiting: 10 rent operations per minute per IP
    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
    const { success: rateLimitSuccess } = rateLimit(`master-rent:${ip}`, { limit: 10, windowMs: 60000 });

    if (!rateLimitSuccess) {
        return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอ 1 นาที" }, { status: 429 });
    }

    const connection = await pool.getConnection();
    try {
        // 1. Authenticate Master User
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
        }

        let masterUserId: number;
        try {
            const decoded = jwt.verify(token, getJwtSecret()) as { userId: number; tokenType?: string };

            // Verify token scope (backward compatible: allow legacy tokens without tokenType)
            // Only reject if tokenType exists AND is not 'master'
            if (decoded.tokenType && decoded.tokenType !== 'master') {
                return NextResponse.json({ error: "Token ไม่ถูกต้อง (Invalid scope)" }, { status: 401 });
            }

            masterUserId = decoded.userId;
        } catch (err) {
            return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { shopName, subdomain, username, password, operationType, packagePrice } = body;

        if (!subdomain || !packagePrice) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน (Subdomain, PackagePrice)" }, { status: 400 });
        }

        // 3. Validate Subdomain Format
        const subdomainValidation = validateSubdomain(subdomain);
        if (!subdomainValidation.valid) {
            return NextResponse.json({ error: subdomainValidation.error }, { status: 400 });
        }

        if (operationType === "new") {
            if (!shopName || !username || !password) {
                return NextResponse.json({ error: "กรุณากรอกข้อมูลร้านค้าให้ครบถ้วน" }, { status: 400 });
            }
        }

        // 3. Check Credit
        const [userRows] = await connection.query<RowDataPacket[]>(
            "SELECT credit FROM master_users WHERE id = ?",
            [masterUserId]
        );

        if (userRows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentCredit = parseFloat(userRows[0].credit);
        const price = parseFloat(packagePrice);

        if (currentCredit < price) {
            return NextResponse.json({ error: "เครดิตไม่เพียงพอ" }, { status: 400 });
        }

        // 4. Validate Subdomain (Check if exists)
        if (operationType === "new") {
            const [existingShop] = await connection.query<RowDataPacket[]>(
                "SELECT id FROM shops WHERE subdomain = ?",
                [subdomain]
            );
            if (existingShop.length > 0) {
                return NextResponse.json({ error: "ชื่อเว็บไซต์นี้ถูกใช้งานแล้ว" }, { status: 400 });
            }
        } else {
            // Renew logic (Check if shop exists and belongs to user)
            // For now, simple implementation focusing on "New"
            const [existingShop] = await connection.query<RowDataPacket[]>(
                "SELECT id FROM shops WHERE subdomain = ? AND owner_id = ?",
                [subdomain, masterUserId]
            );
            if (existingShop.length === 0) {
                return NextResponse.json({ error: "ไม่พบเว็บไซต์ที่ต้องการต่ออายุ หรือคุณไม่ใช่เจ้าของ" }, { status: 404 });
            }
        }

        // 5. Process Transaction
        await connection.beginTransaction();

        // Deduct Credit
        await connection.query(
            "UPDATE master_users SET credit = credit - ? WHERE id = ?",
            [price, masterUserId]
        );

        let shopId: number;

        if (operationType === "new") {
            // Create Shop
            const [shopResult] = await connection.query(
                "INSERT INTO shops (subdomain, name, owner_id, expire_date) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))",
                [subdomain, shopName, masterUserId]
            );
            shopId = (shopResult as any).insertId;

            // Create Shop Admin User
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.query(
                "INSERT INTO users (shop_id, username, email, password, role) VALUES (?, ?, ?, ?, 'owner')",
                [shopId, username, `${username}@${subdomain}.com`, hashedPassword] // Dummy email
            );

            // Initialize Shop Settings (Optional)
            await connection.query(
                "INSERT INTO site_settings (shop_id, site_title, announcement_text, site_logo) VALUES (?, ?, ?, ?)",
                [shopId, shopName, "ยินดีต้อนรับสู่ร้านค้าของเรา! ติดต่อสอบถามได้ตลอด 24 ชม.", "https://placehold.co/200x60/95a5a6/ffffff?text=Logo+200x60"]
            );

            // Initialize Default Topup Settings (Disabled by default)
            await connection.query(
                "INSERT INTO settings (shop_id, setting_key, setting_value) VALUES (?, 'bank_transfer_enabled', 'false'), (?, 'truemoney_angpao_enabled', 'false')",
                [shopId, shopId]
            );

            // --- Seed Default Content ---

            // 1. Default Slideshow (Recommended: 1200x300 or 1600x400)
            const slideshows = [
                "https://placehold.co/1200x300/95a5a6/ffffff?text=1200x300",
                "https://placehold.co/1200x300/95a5a6/ffffff?text=1200x300",
                "https://placehold.co/1200x300/95a5a6/ffffff?text=1200x300",
                "https://placehold.co/1200x300/95a5a6/ffffff?text=1200x300"
            ];
            for (let i = 0; i < slideshows.length; i++) {
                await connection.query("INSERT INTO slideshow_images (shop_id, image_url, display_order) VALUES (?, ?, ?)", [shopId, slideshows[i], i + 1]);
            }

            // 2. Default Quick Links (Recommended: 400x200 or 600x300)
            const quickLinks = [
                { title: "เติมเงิน", url: "/topup", img: "https://placehold.co/400x200/95a5a6/ffffff?text=400x200" },
                { title: "สินค้าทั้งหมด", url: "/products", img: "https://placehold.co/400x200/95a5a6/ffffff?text=400x200" },
                { title: "โปรโมชั่น", url: "/promotions", img: "https://placehold.co/400x200/95a5a6/ffffff?text=400x200" },
                { title: "ติดต่อเรา", url: "/contact", img: "https://placehold.co/400x200/95a5a6/ffffff?text=400x200" }
            ];
            for (let i = 0; i < quickLinks.length; i++) {
                await connection.query(
                    "INSERT INTO quick_links (shop_id, title, image_url, link_url, is_external, display_order) VALUES (?, ?, ?, ?, ?, ?)",
                    [shopId, quickLinks[i].title, quickLinks[i].img, quickLinks[i].url, false, i + 1]
                );
            }

            // 3. Default Categories (Recommended: 800x400 - Horizontal)
            const categories = [
                { name: "สินค้าขายดี", slug: "best-seller", img: "https://placehold.co/800x400/95a5a6/ffffff?text=800x400" },
                { name: "สินค้าใหม่", slug: "new-arrival", img: "https://placehold.co/800x400/95a5a6/ffffff?text=800x400" },
                { name: "หมวดหมู่ 1", slug: "category-1", img: "https://placehold.co/800x400/95a5a6/ffffff?text=800x400" },
                { name: "หมวดหมู่ 2", slug: "category-2", img: "https://placehold.co/800x400/95a5a6/ffffff?text=800x400" }
            ];
            for (let i = 0; i < categories.length; i++) {
                await connection.query(
                    "INSERT INTO categories (shop_id, name, slug, image, is_recommended, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [shopId, categories[i].name, categories[i].slug, categories[i].img, true, i + 1, 1]
                );
            }

            // 4. Default Products (Recommended: 500x500 or 800x800 - Square)
            const products = [
                { name: "สินค้าตัวอย่าง 1", price: 100, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" },
                { name: "สินค้าตัวอย่าง 2", price: 200, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" },
                { name: "สินค้าตัวอย่าง 3", price: 300, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" },
                { name: "สินค้าตัวอย่าง 4", price: 400, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" },
                { name: "สินค้าตัวอย่าง 5", price: 500, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" }
            ];

            for (let i = 0; i < products.length; i++) {
                const p = products[i];
                const slug = `product-${shopId}-${i + 1}`;
                await connection.query(
                    "INSERT INTO products (shop_id, name, slug, price, image, description, type, is_recommended, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [shopId, p.name, slug, p.price, p.img, "รายละเอียดสินค้าตัวอย่าง...", "account", true, i + 1, 1]
                );
            }

        } else {
            // Renew: Extend expire_date
            const [shopResult] = await connection.query<RowDataPacket[]>(
                "SELECT id FROM shops WHERE subdomain = ?",
                [subdomain]
            );
            shopId = shopResult[0].id;

            await connection.query(
                "UPDATE shops SET expire_date = DATE_ADD(expire_date, INTERVAL 30 DAY) WHERE id = ?",
                [shopId]
            );
        }

        // Create Master Order Record
        // Assuming product_id 1 is standard package for now, or we can pass it
        // Create Master Order Record
        // Save order info (DO NOT STORE PASSWORD - security risk)
        const orderData = operationType === 'new'
            ? JSON.stringify({ username, hasCredentials: true, createdAt: new Date() })
            : JSON.stringify({ operation: 'renew', renewed_at: new Date() });

        await connection.query(
            "INSERT INTO master_orders (user_id, shop_id, product_id, amount, status, data) VALUES (?, ?, ?, ?, 'completed', ?)",
            [masterUserId, shopId!, 1, price, orderData]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "ดำเนินการสำเร็จ",
            shopId: shopId
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("Rent Error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
    } finally {
        connection.release();
    }
}
