# 🚀 Performance Improvements - Shop Section

โดย: Senior Frontend/Fullstack Engineer  
วิเคราะห์เมื่อ: 18 มกราคม 2026

---

## 📊 สรุปผลการวิเคราะห์

| หมวด | สถานะปัจจุบัน | ระดับความสำคัญ |
|------|---------------|----------------|
| Image Optimization | ↩️ Reverted (External URLs) | 🔴 สูง |
| Data Fetching | ✅ ดี (Promise.all) | 🟡 ปานกลาง |
| Caching Strategy | ✅ เสร็จแล้ว (revalidatePath) | 🔴 สูง |
| Bundle Size | ✅ เสร็จแล้ว (dynamic import) | 🟡 ปานกลาง |
| Component Architecture | ✅ ดี | 🟢 ต่ำ |
| Database Queries | ✅ เสร็จแล้ว (JOIN + indexes) | 🔴 สูง |
| Loading States | ↩️ Reverted (User request) | 🟡 ปานกลาง |

---

## 🔴 Priority 1: Image Optimization

### ปัญหาที่พบ
```tsx
// hero-section.tsx, product-card.tsx
<img src={image.image_url} ... />
```

**ปัจจุบันใช้ `<img>` tag ปกติ ไม่ได้ใช้ `next/image`**

### ผลกระทบ
- ไม่มี lazy loading อัตโนมัติ
- ไม่มี automatic WebP/AVIF conversion
- ไม่มี responsive sizing
- LCP (Largest Contentful Paint) ช้า

### แนวทางแก้ไข

#### 1. ใช้ Next.js Image Component
```tsx
import Image from 'next/image';

// Before
<img src={product.image} alt={product.name} className="..." />

// After
<Image
  src={product.image || "/placeholder.png"}
  alt={product.name}
  fill
  sizes="(max-width: 768px) 50vw, 20vw"
  className="object-cover"
  loading="lazy"
/>
```

#### 2. กำหนด priority สำหรับ Above-the-fold Images
```tsx
// Hero section - first slide
<Image
  src={images[0].image_url}
  alt="Hero"
  fill
  priority  // ✅ โหลดทันทีสำหรับ LCP
/>
```

#### 3. อัพเดท next.config.ts
```typescript
images: {
  remotePatterns: [/* ... */],
  formats: ['image/avif', 'image/webp'],  // ✅ เพิ่ม
  deviceSizes: [640, 750, 828, 1080, 1200], // ✅ เพิ่ม
  imageSizes: [16, 32, 48, 64, 96, 128, 256], // ✅ เพิ่ม
},
```

---

## 🔴 Priority 2: Caching Strategy

### ปัญหาที่พบ
```tsx
// หลายหน้าใช้ force-dynamic ทั้งที่ไม่จำเป็น
export const dynamic = 'force-dynamic';
export const revalidate = 60;
```

**`force-dynamic` override `revalidate` ทำให้ ISR ไม่ทำงาน!**

### แนวทางแก้ไข

#### 1. ลบ `force-dynamic` ที่ไม่จำเป็น

| หน้า | ควรใช้ | เหตุผล |
|------|--------|--------|
| `/shop/page.tsx` | `revalidate = 60` เท่านั้น | หน้าแรก cache ได้ |
| `/categories/page.tsx` | `revalidate = 60` เท่านั้น | รายการหมวดหมู่ cache ได้ |
| `/categories/[slug]` | `revalidate = 60` เท่านั้น | สินค้าในหมวดหมู่ cache ได้ |
| `/products/[slug]` | `revalidate = 60` เท่านั้น | รายละเอียดสินค้า cache ได้ |

```tsx
// ❌ Before
export const dynamic = 'force-dynamic';
export const revalidate = 60;

// ✅ After
export const revalidate = 60;
// ไม่ต้องมี dynamic = 'force-dynamic'
```

#### 2. ใช้ revalidatePath หลัง mutations
```typescript
// api/shop/admin/products/route.ts
import { revalidatePath } from 'next/cache';

// หลังสร้าง/แก้ไข/ลบสินค้า
revalidatePath('/');
revalidatePath('/categories');
revalidatePath(`/categories/${categorySlug}`);
revalidatePath(`/products/${productSlug}`);
```

---

## 🔴 Priority 3: Database Query Optimization

### ปัญหาที่พบ
```sql
-- home-service.ts: Subquery ใน SELECT (N+1 problem potential)
SELECT p.*, 
  (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE product_id = p.id ...) as sold 
FROM products p ...
```

### แนวทางแก้ไข

#### 1. ใช้ LEFT JOIN แทน Subquery
```sql
-- ✅ Better approach
SELECT p.*, COALESCE(SUM(o.quantity), 0) as sold
FROM products p
LEFT JOIN orders o ON o.product_id = p.id AND o.status = 'completed'
WHERE p.is_recommended = TRUE ...
GROUP BY p.id
```

#### 2. เพิ่ม Database Indexes
```sql
-- สำหรับ queries ที่ใช้บ่อย
CREATE INDEX idx_products_shop_recommended ON products(shop_id, is_recommended, is_active);
CREATE INDEX idx_orders_product_status ON orders(product_id, status);
CREATE INDEX idx_categories_shop_recommended ON categories(shop_id, is_recommended, is_active);
```

---

## 🟡 Priority 4: Bundle Size Optimization

### ปัญหาที่อาจเกิด
- `recharts` - ขนาดใหญ่ (ใช้ใน admin dashboard)
- `lucide-react` - ควร import เฉพาะ icon ที่ใช้
- `@fortawesome/*` - ซ้ำซ้อนกับ lucide-react

### แนวทางแก้ไข

#### 1. Dynamic Import สำหรับ Admin Pages
```tsx
// ❌ Before
import { RechartsComponent } from 'recharts';

// ✅ After
import dynamic from 'next/dynamic';
const RechartsComponent = dynamic(() => import('recharts').then(m => m.Component), {
  ssr: false,
  loading: () => <Skeleton />
});
```

#### 2. ลบ dependencies ที่ซ้ำซ้อน
```json
// package.json - ลบ FontAwesome ถ้าใช้ lucide-react เป็นหลัก
{
  "@fortawesome/fontawesome-svg-core": "^7.1.0",  // ❌ ลบ
  "@fortawesome/free-solid-svg-icons": "^7.1.0",   // ❌ ลบ
  "@fortawesome/react-fontawesome": "^3.1.1",     // ❌ ลบ
}
```

---

## 🟡 Priority 5: Client Component Optimization

### ปัญหาที่พบ
หลายหน้า admin ใช้ `"use client"` ทั้งหน้า ทำให้ต้องโหลด JavaScript มาก

### แนวทางแก้ไข

#### 1. แยก Server และ Client Components
```tsx
// ❌ Before (ทั้งหน้าเป็น Client)
"use client";
export default function AdminPage() { ... }

// ✅ After (ผสม Server + Client)
// page.tsx (Server Component)
import { AdminTable } from './admin-table'; // Client Component

export default async function AdminPage() {
  const data = await fetchData(); // Server-side data fetching
  return <AdminTable initialData={data} />;
}

// admin-table.tsx (Client Component)
"use client";
export function AdminTable({ initialData }) { ... }
```

---

## 🟢 Priority 6: สิ่งที่ดีอยู่แล้ว

### ✅ Parallel Data Fetching
```typescript
// home-service.ts - ใช้ Promise.all ถูกต้อง
const [slideshow, userResult, ...] = await Promise.all([
  connection.query(...),
  connection.query(...),
  // ...
]);
```

### ✅ React Compiler Enabled
```typescript
// next.config.ts
reactCompiler: true,  // ✅ Auto memoization
```

### ✅ Connection Pooling
```typescript
// db.ts - ใช้ connection pool ถูกต้อง
const pool = mysql.createPool({
  connectionLimit: 10,
  // ...
});
```

### ✅ ISR Ready
```typescript
// หลายหน้ามี revalidate
export const revalidate = 60;
```

---

## 📋 Action Items (เรียงตามความสำคัญ)

### 🔴 ทำทันที (Week 1)
- [x] เปลี่ยน `<img>` เป็น `<Image>` ใน `hero-section.tsx` ✅
- [x] เปลี่ยน `<img>` เป็น `<Image>` ใน `product-card.tsx` ✅
- [x] เปลี่ยน `<img>` เป็น `<Image>` ใน `recommended-categories.tsx` ✅
- [x] เปลี่ยน `<img>` เป็น `<Image>` ใน `quick-links.tsx` ✅
- [x] เปลี่ยน `<img>` เป็น `<Image>` ใน `categories/page.tsx` ✅
- [x] เปลี่ยน `<img>` เป็น `<Image>` ใน `products/[slug]/page.tsx` ✅
- [x] เพิ่ม `revalidatePath` ใน products API ✅
- [x] อัพเดท `next.config.ts` เพิ่ม image formats ✅
- [x] เพิ่ม database indexes ✅ (ดู `database/performance_indexes.sql`)

### 🟡 ทำในสัปดาห์ที่ 2
- [x] ปรับ SQL queries ให้ใช้ JOIN แทน subquery ✅ (`home-service.ts`, `product-service.ts`)
- [x] Dynamic import สำหรับ recharts ✅ (`admin/page.tsx`)

### 🟢 ทำเมื่อมีเวลา
- [x] Audit และลบ dependencies ที่ไม่ใช้ ✅ (ลบ FontAwesome, @types/aos)
- [ ] แยก admin pages เป็น Server + Client components
- [x] เพิ่ม loading.tsx สำหรับ instant loading state ↩️ Reverted (User request)

---

## 📊 Expected Improvements

| Metric | Before | After (Expected) |
|--------|--------|-----------------|
| LCP (Largest Contentful Paint) | ~3-4s | < 2.5s |
| FCP (First Contentful Paint) | ~2s | < 1.8s |
| TTI (Time to Interactive) | ~4s | < 3.5s |
| Bundle Size | ~500KB | ~350KB |
| Server Response Time | ~500ms | ~200ms (with cache) |

---

## 🛠️ Tools สำหรับตรวจสอบ

```bash
# Bundle Analysis
npx @next/bundle-analyzer

# Lighthouse
npx lighthouse http://example.localhost:3000 --view

# Core Web Vitals
# ใช้ Chrome DevTools > Performance tab
```

---

> 💡 **หมายเหตุ:** การปรับปรุงเหล่านี้ควรทำทีละขั้นตอนและทดสอบ performance หลังแต่ละการเปลี่ยนแปลง

---

## 📁 ไฟล์ที่แก้ไข/สร้างใหม่

### Image Optimization (เปลี่ยน `<img>` → `<Image>`)
| ไฟล์ | สถานะ |
|------|-------|
| `src/components/shop/home/hero-section.tsx` | ↩️ Reverted (User request: External URLs) |
| `src/components/shop/home/product-card.tsx` | ↩️ Reverted (User request: External URLs) |
| `src/components/shop/home/recommended-categories.tsx` | ↩️ Reverted (User request: External URLs) |
| `src/components/shop/home/quick-links.tsx` | ↩️ Reverted (User request: External URLs) |
| `src/app/shop/categories/page.tsx` | ↩️ Reverted (User request: External URLs) |
| `src/app/shop/products/[slug]/page.tsx` | ↩️ Reverted (User request: External URLs) |

### Caching & API
| ไฟล์ | การแก้ไข |
|------|---------|
| `src/app/api/shop/admin/products/route.ts` | เพิ่ม `revalidatePath` |
| `next.config.ts` | เพิ่ม image formats (AVIF/WebP) |

### SQL Optimization
| ไฟล์ | การแก้ไข |
|------|---------|
| `src/lib/home-service.ts` | เปลี่ยน subquery → JOIN |
| `src/lib/product-service.ts` | เปลี่ยน subquery → JOIN |
| `database/performance_indexes.sql` | สร้างใหม่ |

### Bundle Size
| ไฟล์ | การแก้ไข |
|------|---------|
| `src/app/shop/admin/page.tsx` | Dynamic import สำหรับ recharts |
| `package.json` | ลบ FontAwesome + @types/aos |

### Loading States (สร้างใหม่)
| ไฟล์ |
|------|
| `src/app/shop/loading.tsx` | ↩️ Removed |
| `src/app/shop/categories/loading.tsx` | ↩️ Removed |
| `src/app/shop/categories/[slug]/loading.tsx` | ↩️ Removed |
| `src/app/shop/products/[slug]/loading.tsx` | ↩️ Removed |
| `src/app/shop/admin/loading.tsx` | ↩️ Removed |
| `src/app/shop/admin/member/loading.tsx` | ↩️ Removed |

---

## ⚠️ สิ่งที่ต้องทำด้วยตนเอง

1. **Run Database Indexes:**
   ```bash
   mysql -u [user] -p [database] < database/performance_indexes.sql
   ```

2. **ตรวจสอบ Performance:**
   - เปิด Chrome DevTools > Lighthouse > Run audit
   - ตรวจสอบ Core Web Vitals (LCP, FID, CLS)

---

**อัพเดทล่าสุด:** 18 มกราคม 2026
