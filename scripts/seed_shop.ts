import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const [, , shopIdArg] = process.argv;

if (!shopIdArg) {
    console.error("Usage: npx tsx scripts/seed_shop.ts <SHOP_ID>");
    process.exit(1);
}

const shopId = parseInt(shopIdArg);

async function main() {
    console.log(`Seeding shop ID: ${shopId}...`);

    // Check if env vars are loaded
    if (!process.env.MYSQL_HOST) {
        console.error("Error: Environment variables not loaded. Make sure .env exists in project root.");
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });

    try {
        // 1. Slideshow
        const slideshows = [
            "https://placehold.co/1200x300/3498db/ffffff?text=1200x300",
            "https://placehold.co/1200x300/e74c3c/ffffff?text=1200x300",
            "https://placehold.co/1200x300/2ecc71/ffffff?text=1200x300",
            "https://placehold.co/1200x300/9b59b6/ffffff?text=1200x300"
        ];
        console.log("Seeding Slideshows...");
        for (let i = 0; i < slideshows.length; i++) {
            await connection.query("INSERT INTO slideshow_images (shop_id, image_url, display_order) VALUES (?, ?, ?)", [shopId, slideshows[i], i + 1]);
        }

        // 2. Quick Links
        const quickLinks = [
            { title: "เติมเงิน", url: "/topup", img: "https://placehold.co/400x200/f1c40f/ffffff?text=400x200" },
            { title: "สินค้าทั้งหมด", url: "/products", img: "https://placehold.co/400x200/e67e22/ffffff?text=400x200" },
            { title: "โปรโมชั่น", url: "/promotions", img: "https://placehold.co/400x200/e74c3c/ffffff?text=400x200" },
            { title: "ติดต่อเรา", url: "/contact", img: "https://placehold.co/400x200/34495e/ffffff?text=400x200" }
        ];
        console.log("Seeding Quick Links...");
        for (let i = 0; i < quickLinks.length; i++) {
            await connection.query(
                "INSERT INTO quick_links (shop_id, title, image_url, link_url, is_external, display_order) VALUES (?, ?, ?, ?, ?, ?)",
                [shopId, quickLinks[i].title, quickLinks[i].img, quickLinks[i].url, false, i + 1]
            );
        }

        // 3. Categories
        const categories = [
            { name: "สินค้าขายดี", slug: "best-seller", img: "https://placehold.co/800x400/e74c3c/ffffff?text=800x400" },
            { name: "สินค้าใหม่", slug: "new-arrival", img: "https://placehold.co/800x400/3498db/ffffff?text=800x400" },
            { name: "หมวดหมู่ 1", slug: "category-1", img: "https://placehold.co/800x400/2ecc71/ffffff?text=800x400" },
            { name: "หมวดหมู่ 2", slug: "category-2", img: "https://placehold.co/800x400/9b59b6/ffffff?text=800x400" }
        ];
        console.log("Seeding Categories...");
        for (let i = 0; i < categories.length; i++) {
            await connection.query(
                "INSERT INTO categories (shop_id, name, slug, image, is_recommended, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [shopId, categories[i].name, categories[i].slug, categories[i].img, true, i + 1, 1]
            );
        }

        // 4. Products
        const products = [
            { name: "สินค้าตัวอย่าง 1", price: 100, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" },
            { name: "สินค้าตัวอย่าง 2", price: 200, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" },
            { name: "สินค้าตัวอย่าง 3", price: 300, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" },
            { name: "สินค้าตัวอย่าง 4", price: 400, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" },
            { name: "สินค้าตัวอย่าง 5", price: 500, img: "https://placehold.co/500x500/95a5a6/ffffff?text=500x500" }
        ];
        console.log("Seeding Products...");
        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            const slug = `product-${shopId}-${Date.now()}-${i + 1}`;
            await connection.query(
                "INSERT INTO products (shop_id, name, slug, price, image, description, type, is_recommended, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [shopId, p.name, slug, p.price, p.img, "รายละเอียดสินค้าตัวอย่าง...", "account", true, i + 1, 1]
            );
        }

        // 5. Announcement
        console.log("Seeding Announcement...");
        // Check if settings exist, if not create, if yes update
        const [settings] = await connection.query<any[]>("SELECT id FROM site_settings WHERE shop_id = ?", [shopId]);
        if (settings.length === 0) {
            await connection.query("INSERT INTO site_settings (shop_id, site_title, announcement_text, site_logo) VALUES (?, ?, ?, ?)", [shopId, "Shop " + shopId, "ยินดีต้อนรับสู่ร้านค้าของเรา! ติดต่อสอบถามได้ตลอด 24 ชม.", "https://placehold.co/200x60/3498db/ffffff?text=Logo+200x60"]);
        } else {
            await connection.query("UPDATE site_settings SET announcement_text = ?, site_logo = ? WHERE shop_id = ?", ["ยินดีต้อนรับสู่ร้านค้าของเรา! ติดต่อสอบถามได้ตลอด 24 ชม.", "https://placehold.co/200x60/3498db/ffffff?text=Logo+200x60", shopId]);
        }


        console.log("Done!");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

main();
