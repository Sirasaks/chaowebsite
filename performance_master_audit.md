# Performance Optimization Guide: Master Section 🚀

เอกสารนี้รวบรวมแนวทางการปรับปรุงประสิทธิภาพ (Performance Optimization) สำหรับส่วน **Master (Admin/Dashboard)** โดยเฉพาะ โดยอ้างอิงจาก Codebase ปัจจุบัน (`src/app/master/*` และ `src/app/api/master/*`) เน้นสิ่งที่ทำได้จริงและเห็นผลทันที

---

## 1. Request Waterfalls (Async-Parallel) & 2. Data Fetching Strategy

### 🔴 ปัญหา (Before)
ใน `src/app/master/history/page.tsx` ปัจจุบันใช้รูปแบบ **Client-Side Fetching** ที่ทำให้เกิด Request Waterfall:

1. โหลด HTML/JS ของหน้าเว็บ
2. รอ `useAuth()` ตรวจสอบ Session (เสียเวลา Roundtrip)
3. เมื่อ User มีค่า จึงเริ่ม `fetch("/api/master/history")`
4. รอ API ตอบกลับ -> Render หน้าเว็บ

ทำให้ **FCP (First Contentful Paint)** เร็ว แต่ **LCP (Largest Contentful Paint)** ช้า เพราะ User ต้องรอ JS ทำงานหลายขั้นตอน

```tsx
// src/app/master/history/page.tsx (Current - Client Component)
"use client"
export default function MasterHistoryPage() {
    const { user } = useAuth() // ⚠️ Wait 1: Auth Check
    const [shops, setShops] = useState([])

    useEffect(() => {
        if (user) {
            fetch("/api/master/history")... // ⚠️ Wait 2: Data Fetch (Waterfall)
        }
    }, [user])
    
    if (!user || loading) return <Loader /> // User sees spinner for a long time
}
```

### 🟢 วิธีแก้ (After): Server Components (RSC)
เปลี่ยนมาใช้ **Next.js Server Components** เพื่อดึงข้อมูลตั้งแต่ Server โดยไม่ต้องรอ Client JS โหลดเสร็จ และไม่ต้องรอ `useAuth` เพราะเราเช็ค Cookie ได้ทันที

**ข้อดี:**
- **Zero Request Waterfall**: เริ่มดึงข้อมูลทันทีที่ Request เข้ามา
- **Faster LCP**: ส่ง HTML ที่มีข้อมูลพร้อมแสดงผลไปหา User เลย
- **Smaller Bundle Size**: ไม่ต้องส่ง Code logic การ map หรือคำนวณวันหมดอายุไปที่ Client (ทำที่ Server จบ)

```tsx
// src/app/master/history/page.tsx (New - Server Component)
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import pool from "@/lib/db"
import { redirect } from "next/navigation"
import { MasterHistoryClient } from "./components/MasterHistoryClient" // แยก Interactive UI ไป Client Component

async function getHistory() {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) return null

    // Direct DB Access (No API fetch overhead)
    const [rows] = await pool.query(`...SQL Query...`, [...])
    return rows
}

export default async function MasterHistoryPage() {
    const shops = await getHistory()
    if (!shops) redirect("/login")

    // ส่ง Data เข้าไป Render ทันที
    return <MasterHistoryClient initialShops={shops} />
}
```

**ผลลัพธ์:**
- **LCP:** เร็วขึ้น ~30-50% (ลดเวลา Network Roundtrip)
- **Cumulative Layout Shift (CLS):** 0 (ไม่มี Loading Skeleton กระพริบ)

---

## 3. API & Database Optimization

### 🔴 ปัญหา (Before): N+1 Query Problem
สมมติโค้ดเดิมอาจจะมีการ Loop Query เพื่อหา Order ล่าสุดของแต่ละร้านค้า:

```typescript
// ❌ Bad Practice (N+1)
const [shops] = await pool.query("SELECT * FROM shops WHERE owner_id = ?");
for (const shop of shops) {
    const [order] = await pool.query("SELECT data FROM orders WHERE shop_id = ?", [shop.id]);
    shop.order_data = order?.data;
}
```
*ถ้ามี 50 ร้านค้า = 1 Query (shops) + 50 Queries (orders) = 51 Connects DB!*

### 🟢 วิธีแก้ (After): Optimized SQL JOIN
ใน `src/app/api/master/history/route.ts` ปัจจุบันทำได้ดีแล้วโดยใช้ **LEFT JOIN** และ **ROW_NUMBER()** เพื่อดึงข้อมูลจบใน Query เดียว

แต่สิ่งที่ขาดคือ **Database Indexing**:
การ Query ใช้ `WHERE s.owner_id = ?` และการ Join ใช้ `shop_id`

**SQL Command เพื่อ Tune DB:**
```sql
-- เพิ่ม Index เพื่อให้ค้นหาเจ้าของร้านเร็วขึ้น (O(log n))
CREATE INDEX idx_shops_owner ON shops(owner_id);

-- เพิ่ม Index เพื่อให้การ JOIN orders เร็วขึ้น
CREATE INDEX idx_master_orders_shop ON master_orders(shop_id);
CREATE INDEX idx_orders_shop ON orders(shop_id);
```

**ผลลัพธ์:**
- **Query Time:** ลดลงจาก O(N) เหลือ O(1) (สำหรับ Master 1 คน)
- **Scalability:** รองรับร้านค้าหลักหมื่นได้โดยที่หน้าเว็บไม่หน่วง

---

## 4. Image & Asset Optimization & 8. Monitoring (LCP)

### 🔴 ปัญหา (Before): Client-Side Fade-In
ใน `src/app/master/components/HeroSection.tsx` มีการใช้ Logic ซ่อน Text (`opacity-0`) แล้วค่อยโชว์ด้วย JS (`useEffect` -> `setMounted`):

```tsx
// HeroSection.tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []); // รอ Hydration

return <h1 className={mounted ? "opacity-100" : "opacity-0"}>...</h1>
```
สิ่งนี้ทำร้าย **LCP (Largest Contentful Paint)** อย่างมาก เพราะ User เห็นหน้าจอว่างเปล่าจนกว่า JS จะทำงานเสร็จ

### 🟢 วิธีแก้ (After): CSS Keyframes / Server-First
ใช้ CSS Animation ธรรมดาที่ไม่ต้องรอ React Hydration

```tsx
// HeroSection.tsx (Simplified)
// ไม่ต้องใช้ useState/useEffect เพื่อ Animation พื้นฐาน
return (
  <h1 className="animate-fade-in-up opacity-0 fill-mode-forwards">
    สร้างร้านค้าออนไลน์...
  </h1>
)
```

```css
/* globals.css */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.7s ease-out forwards;
}
```

**ผลลัพธ์:**
- **LCP:** User เห็นข้อความทันทีที่ HTML โหลดเสร็จ (เร็วกว่าเดิม 100-300ms)

---

## 5. Bundle Size Reduction

### 🔴 ปัญหา
การ Import Library ใหญ่ๆ ทั้งก้อน เช่น หากมีการใช้ `import { Database } from 'lucide-react'` (สมมติ)

### 🟢 วิธีแก้
Next.js ฉลาดเรื่อง Tree-Shaking อยู่แล้ว แต่เราควรระวังการ import components ใหญ่ๆ ที่ Client Side.
- ใช้ `dynamic import` สำหรับ Component หนักๆ ที่อยู่ด้านล่างของจอ (เช่น `TestimonialsSection` หรือ `Charts`)

```tsx
import dynamic from 'next/dynamic'
const Charts = dynamic(() => import('./Charts'), { 
    loading: () => <Skeleton />,
    ssr: false // ถ้ากราฟใช้ window object
})
```

---

## 6. Caching Strategy

### Master Data (Private)
ข้อมูล Master เป็นข้อมูลส่วนตัว (Private Data) ไม่ควร Cache แบบ Public (CDN) แต่ Cache แบบ Private Browser ได้ระยะสั้นๆ หรือใช้ `stale-while-revalidate` ไม่เหมาะถ้าต้องการความ Realtime สูง

**Recommendation:**
ใช้ `revalidatePath` เมื่อมีการกระทำที่เปลี่ยนข้อมูล (เช่น สร้างร้านค้าใหม่) เพื่อเคลียร์ Cache ของ Server Component

```typescript
// Server Action หรือ API Route เมื่อสร้างร้านเสร็จ
import { revalidatePath } from "next/cache"

export async function createShop() {
    // ... insert logic ...
    revalidatePath("/master/history") // สั่งให้หน้า History โหลดข้อมูลใหม่ในครั้งถัดไปทันที
    revalidatePath("/master/dashboard") 
}
```

---

## 7. React Rendering Performance

### List Virtualization
หาก User มีร้านค้าจำนวนมาก (เช่น 100+ ร้าน) การ Render `<Card>` ทั้งหมดพร้อมกันจะทำให้ DOM ใหญ่และหน่วง

**วิธีแก้:**
- ใช้ **Pagination** (แนะนำสำหรับ Web App ทั่วไป)
- หรือใช้ **Windowing** (เช่น `react-window`) ถ้าต้องการ Infinite Scroll

สำหรับเคสนี้ แนะนำ **Server-Side Pagination**:
```typescript
// api/master/history/route.ts
const page = searchParams.get('page') || 1
const LIMIT = 10
const OFFSET = (page - 1) * LIMIT

// SQL LIMIT OFFSET
`... LIMIT ${LIMIT} OFFSET ${OFFSET}`
```
(ตรงนี้ช่วยลด Memory Usage ของ Server และ Client อย่างมหาศาล)

---

## สรุป Action Plan ที่แนะนำให้ทำทันที ✅

1. **Refactor `HistoryPage` เป็น Server Component** (Priority: High) - แก้ Waterfall, เพิ่ม Speed
2. **แก้ `HeroSection` เอา `useState` ออก** (Priority: Medium) - แก้ LCP
3. **เพิ่ม Database Index (`owner_id`)** (Priority: High) - ป้องกันเว็บล่มเมื่อ User เยอะ
