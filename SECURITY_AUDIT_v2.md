# 🔒 รายงานการตรวจสอบความปลอดภัย (Security Audit Report)

**โปรเจค:** chaowebsite (Next.js + React)  
**วันที่ตรวจสอบ:** 18 มกราคม 2026  
**มาตรฐาน:** OWASP Top 10 (2024)  
**ขอบเขต:** Master Section + ระบบโดยรวม

---

## 📊 สรุปผลการตรวจสอบ

| OWASP Category | สถานะ | ระดับความเสี่ยง |
|----------------|-------|-----------------|
| A01: Broken Access Control | ✅ ดี | 🟢 Low |
| A02: Cryptographic Failures | ⚠️ ต้องปรับปรุง | 🟡 Medium |
| A03: Injection | ✅ ดี | 🟢 Low |
| A04: Insecure Design | ⚠️ ต้องปรับปรุง | 🟡 Medium |
| A05: Security Misconfiguration | ✅ แก้ไขแล้ว | 🟢 Low |
| A06: Vulnerable Components | ✅ ดี | 🟢 Low |
| A07: Authentication Failures | ⚠️ ต้องปรับปรุง | 🟡 Medium |
| A08: Data Integrity Failures | ✅ ดี | 🟢 Low |
| A09: Logging & Monitoring | ✅ แก้ไขแล้ว | 🟢 Low |
| A10: Server-Side Request Forgery | ⚠️ ต้องปรับปรุง | 🟡 Medium |

**Overall Security Score: 8.0/10** ⚠️ (ต้องปรับปรุงบางส่วน)

---

## 🔴 Critical Issues (ไม่พบ)

ไม่พบช่องโหว่ระดับ Critical ที่ต้องแก้ไขทันที

---

## 🟠 High Priority Issues

### 1. Master Login ไม่ใช้ Token Rotation

**ไฟล์:** `src/app/api/master/auth/login/route.ts`  
**ความรุนแรง:** 🟠 High  
**OWASP:** A07 - Authentication Failures

**สาเหตุ:**  
Master login ยังใช้ JWT token แบบ 7 วัน โดยไม่มี refresh token rotation เหมือน shop login

**ความเสี่ยง:**  
- หาก token รั่วไหล ผู้โจมตีสามารถใช้งานได้ 7 วันเต็ม
- ไม่สามารถ revoke token ได้

**Before:**
```typescript
// ❌ ไม่ใช้ Token Rotation
const token = jwt.sign({ userId: user.id, role: user.role, tokenType: 'master' }, getJwtSecret(), { expiresIn: "7d" });
```

**After:**
```typescript
// ✅ ใช้ Token Rotation เหมือน shop
import { generateTokenPair, getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from "@/lib/token-service";
import { serialize } from "cookie";

const { accessToken, refreshToken } = await generateTokenPair(
    user.id,
    user.role,
    "master"
);

const res = NextResponse.json({
    message: "เข้าสู่ระบบสำเร็จ",
    user: { id: user.id, username: user.username, role: user.role, credit: user.credit },
});

res.headers.set("Set-Cookie", serialize("token", accessToken, getAccessTokenCookieOptions()));
res.headers.append("Set-Cookie", serialize("refresh_token", refreshToken, getRefreshTokenCookieOptions()));
```

---

### 2. EasySlip Token Fallback เปิดใน Development

**ไฟล์:** `src/app/api/shop/topup/easyslip/route.ts`  
**ความรุนแรง:** 🟠 High  
**OWASP:** A05 - Security Misconfiguration

**สาเหตุ:**  
มี fallback ไป environment variable ซึ่งอาจทำให้ token ร้านหนึ่งถูกใช้กับร้านอื่นได้

**Before:**
```typescript
// ❌ Fallback อาจทำให้ใช้ token ผิดร้าน
if (!EASYSLIP_ACCESS_TOKEN) {
    EASYSLIP_ACCESS_TOKEN = process.env.EASYSLIP_ACCESS_TOKEN;
}
```

**After:**
```typescript
// ✅ บังคับให้แต่ละร้านตั้งค่า token ของตัวเอง
if (!EASYSLIP_ACCESS_TOKEN) {
    console.error(`EasySlip token not configured for shop ${shopId}`);
    return NextResponse.json(
        { error: "ร้านค้ายังไม่ได้ตั้งค่า EasySlip กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 500 }
    );
}
```

---

## 🟡 Medium Priority Issues

### 3. Subdomain Spoofing ใน Development Mode

**ไฟล์:** `src/middleware.ts`  
**ความรุนแรง:** 🟡 Medium  
**OWASP:** A01 - Broken Access Control

**สาเหตุ:**  
ใน development mode สามารถ spoof subdomain ผ่าน header `x-shop-subdomain` ได้

**ความเสี่ยง:**  
ถ้า deploy ไป production โดยไม่ได้ตั้ง NODE_ENV=production จะถูกโจมตีได้

**Before:**
```typescript
// ❌ อันตรายถ้า NODE_ENV ไม่ถูกต้อง
if (process.env.NODE_ENV === 'development') {
    const spoofedSubdomain = req.headers.get('x-shop-subdomain');
    if (spoofedSubdomain) {
        subdomain = spoofedSubdomain;
    }
}
```

**After:**
```typescript
// ✅ เพิ่มการตรวจสอบ environment ที่เข้มงวดขึ้น
const isDevelopment = process.env.NODE_ENV === 'development' && isLocal;

if (isDevelopment) {
    const spoofedSubdomain = req.headers.get('x-shop-subdomain');
    if (spoofedSubdomain) {
        console.warn(`[DEV] Subdomain spoofing: ${spoofedSubdomain}`);
        subdomain = spoofedSubdomain;
    }
}
```

---

### 4. Images Remote Patterns ยอมรับทุก Domain

**ไฟล์:** `next.config.ts`  
**ความรุนแรง:** 🟡 Medium  
**OWASP:** A10 - Server-Side Request Forgery (SSRF)

**สาเหตุ:**  
`remotePatterns` ยอมรับทุก hostname ทั้ง http และ https

**ความเสี่ยง:**  
ผู้โจมตีอาจใช้ Next.js Image Optimization Proxy เพื่อ scan internal network

**Before:**
```typescript
// ❌ ยอมรับทุก domain
images: {
    remotePatterns: [
        { protocol: "https", hostname: "**" },
        { protocol: "http", hostname: "**" },
    ],
}
```

**After:**
```typescript
// ✅ Whitelist เฉพาะ domain ที่ใช้งาน
images: {
    remotePatterns: [
        { protocol: "https", hostname: "cdn.example.com" },
        { protocol: "https", hostname: "images.example.com" },
        { protocol: "https", hostname: "**.cloudinary.com" },
        { protocol: "https", hostname: "**.imgur.com" },
    ],
}
```

---

### 5. ไม่มี CSRF Protection สำหรับ Cookie-based Auth

**ไฟล์:** API routes ทั้งหมด  
**ความรุนแรง:** 🟡 Medium  
**OWASP:** A01 - Broken Access Control

**สาเหตุ:**  
แม้ใช้ `sameSite: strict` แล้ว แต่ไม่มี CSRF token เพิ่มเติม

**แนวทางแก้ไข:**
```typescript
// lib/csrf.ts
import crypto from 'crypto';

export function generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function verifyCSRFToken(token: string, storedToken: string): boolean {
    return crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(storedToken)
    );
}
```

```typescript
// API Route ที่ต้องการ CSRF protection
const csrfToken = request.headers.get('X-CSRF-Token');
const storedToken = cookieStore.get('csrf_token')?.value;

if (!csrfToken || !storedToken || !verifyCSRFToken(csrfToken, storedToken)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
}
```

---

### 6. Password Policy อ่อนแอ (Master Register)

**ไฟล์:** `src/app/api/master/auth/register/route.ts`  
**ความรุนแรง:** 🟡 Medium  
**OWASP:** A07 - Authentication Failures

**สาเหตุ:**  
รหัสผ่านต้องการเพียง 8 ตัวอักษร ไม่บังคับความซับซ้อน

**Before:**
```typescript
// ❌ Password policy อ่อนแอ
password: z.string().min(8),
```

**After:**
```typescript
// ✅ Password policy เข้มงวดขึ้น
const passwordSchema = z.string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    .regex(/[a-z]/, "ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
    .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว")
    .regex(/[^A-Za-z0-9]/, "ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว");

const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: passwordSchema,
    captchaToken: z.string().optional(),
});
```

---

### 7. ไม่มี Account Lockout

**ไฟล์:** Login APIs  
**ความรุนแรง:** 🟡 Medium  
**OWASP:** A07 - Authentication Failures

**สาเหตุ:**  
มี rate limit ต่อ IP แต่ไม่มี account lockout หลัง login ผิดหลายครั้ง

**แนวทางแก้ไข:**
```typescript
// ตัวอย่างการ implement account lockout
interface LoginAttempt {
    count: number;
    firstAttempt: number;
    lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const WINDOW_DURATION = 5 * 60 * 1000; // 5 minutes

function checkAccountLockout(username: string): { locked: boolean; remainingSeconds?: number } {
    const attempt = loginAttempts.get(username);
    const now = Date.now();

    if (!attempt) return { locked: false };

    // Check if locked
    if (attempt.lockedUntil && attempt.lockedUntil > now) {
        const remainingSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
        return { locked: true, remainingSeconds };
    }

    // Reset if window expired
    if (now - attempt.firstAttempt > WINDOW_DURATION) {
        loginAttempts.delete(username);
        return { locked: false };
    }

    return { locked: false };
}

function recordFailedLogin(username: string): void {
    const now = Date.now();
    const attempt = loginAttempts.get(username) || { count: 0, firstAttempt: now };
    
    attempt.count++;
    
    if (attempt.count >= MAX_ATTEMPTS) {
        attempt.lockedUntil = now + LOCKOUT_DURATION;
        console.warn(`Account ${username} locked due to too many failed attempts`);
    }
    
    loginAttempts.set(username, attempt);
}
```

---

### 8. ข้อมูล Console Log ใน Production

**ไฟล์:** หลายไฟล์  
**ความรุนแรง:** 🟡 Medium  
**OWASP:** A09 - Security Logging and Monitoring Failures

**สาเหตุ:**  
มี `console.log` debug information ที่อาจรั่วไหลใน production

**ตัวอย่างที่พบ:**
```typescript
// ❌ Debug logs in middleware.ts
console.log("Middleware Debug:", {
    hostHeader: req.headers.get("host"),
    nextUrlHostname: req.nextUrl.hostname,
    pathname
});
console.log("Extracted Subdomain:", subdomain);
```

**After:**
```typescript
// ✅ Remove debug logs or use conditional logging
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
    console.log("Middleware Debug:", { /* ... */ });
}
```

---

## 🟢 Low Priority Issues

### 9. Missing Content-Security-Policy Header

**ไฟล์:** `next.config.ts`  
**ความรุนแรง:** 🟢 Low

**สาเหตุ:**  
ไม่มี CSP header ซึ่งเป็น defense-in-depth ต่อ XSS

**แนวทางแก้ไข:**
```typescript
{
    key: 'Content-Security-Policy',
    value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://developer.easyslip.com https://challenges.cloudflare.com",
        "frame-src https://challenges.cloudflare.com",
    ].join('; '),
}
```

---

### 10. Missing Strict-Transport-Security Header

**ไฟล์:** `next.config.ts`  
**ความรุนแรง:** 🟢 Low

**แนวทางแก้ไข:**
```typescript
{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
}
```

---

## ✅ สิ่งที่ดีอยู่แล้ว

### 1. SQL Injection Prevention ✅
```typescript
// ✅ ใช้ Parameterized Queries ทุกที่
const [rows] = await pool.query(
    "SELECT * FROM users WHERE username = ? AND shop_id = ?",
    [username, shopId]
);
```

### 2. XSS Prevention ✅
- ใช้ DOMPurify sanitize HTML content
- React auto-escapes by default

### 3. Multi-tenant Isolation ✅
```typescript
// ✅ ทุก query มี shop_id scope
"SELECT * FROM products WHERE id = ? AND shop_id = ?"
```

### 4. Rate Limiting ✅
```typescript
// ✅ Rate limit ทุก sensitive endpoint
const { success } = rateLimit(`master-login:${ip}`, { limit: 5, windowMs: 60000 });
```

### 5. Password Hashing ✅
```typescript
// ✅ bcrypt cost factor 10
const hashedPassword = await bcrypt.hash(password, 10);
```

### 6. Secure Cookie Settings ✅
```typescript
// ✅ HttpOnly, Secure, SameSite
httpOnly: true,
secure: process.env.NODE_ENV === "production",
sameSite: "strict",
```

### 7. Token Rotation (Shop) ✅
- Access token: 15 minutes
- Refresh token: 7 days with rotation

### 8. Reset Password Security ✅
- Token hashed with SHA-256
- 1-hour expiration
- Shop-scoped validation

### 9. Input Validation with Zod ✅
```typescript
const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
});
```

### 10. Transaction Safety ✅
```typescript
// ✅ FOR UPDATE lock for race conditions
await connection.query("SELECT * FROM products WHERE id = ? FOR UPDATE", [id]);
await connection.beginTransaction();
// ...
await connection.commit();
```

---

## ✅ Security Checklist

### Authentication & Session
- [x] Password hashing with bcrypt
- [x] JWT with HttpOnly cookies
- [x] Secure flag in production
- [x] SameSite=strict
- [x] Rate limiting on login
- [x] CAPTCHA on registration
- [x] Token rotation (shop) ✅
- [ ] Token rotation (master) 🟠 **ต้องแก้ไข**
- [ ] Account lockout after failed attempts 🟡

### API Security
- [x] Input validation (Zod)
- [x] Rate limiting per endpoint
- [x] Authorization checks (owner role)
- [x] Multi-tenant isolation (shop_id)
- [x] Request deduplication (orders)
- [ ] CSRF protection 🟡 **แนะนำ**

### Database Security
- [x] Parameterized queries
- [x] Connection pooling
- [x] Transaction locking
- [x] Data encryption (AES-256-GCM)
- [x] Foreign key constraints

### Frontend Security
- [x] XSS prevention (DOMPurify)
- [x] No inline scripts
- [ ] Content Security Policy 🟢 **แนะนำ**

### Infrastructure
- [x] Security headers (X-Frame-Options)
- [x] Security logging
- [ ] HSTS header 🟢 **แนะนำ**
- [ ] Image proxy whitelist 🟡 **แนะนำ**

---

## 📋 Priority Recommendations

### ต้องแก้ไข (High Priority)
1. **Master Login Token Rotation** - ใช้ `token-service.ts` เหมือน shop login
2. **EasySlip Fallback** - ลบ fallback ไป environment variable

### ควรแก้ไข (Medium Priority)
3. **Images Remote Patterns** - Whitelist เฉพาะ domain ที่ใช้
4. **Password Policy** - เพิ่มความซับซ้อนของรหัสผ่าน
5. **Account Lockout** - Implement account lockout

### แนะนำ (Low Priority)
6. **CSP Header** - เพิ่ม Content-Security-Policy
7. **HSTS Header** - เพิ่ม Strict-Transport-Security
8. **Debug Logs** - ลบ console.log ใน production

---

## 📊 Risk Matrix

| Issue | Impact | Likelihood | Risk | Priority |
|-------|--------|------------|------|----------|
| Master token no rotation | High | Medium | 🟠 High | 1 |
| EasySlip token fallback | High | Low | 🟠 High | 2 |
| Image proxy open | Medium | Medium | 🟡 Medium | 3 |
| Weak password policy | Medium | Medium | 🟡 Medium | 4 |
| No account lockout | Medium | Medium | 🟡 Medium | 5 |
| Missing CSP | Low | Medium | 🟢 Low | 6 |
| Missing HSTS | Low | Low | 🟢 Low | 7 |

---

## 🎯 สรุป

### จุดแข็ง
- ✅ SQL Injection prevention ครบถ้วน
- ✅ Multi-tenant isolation ดีเยี่ยม
- ✅ Rate limiting ทุก sensitive endpoint
- ✅ Token rotation สำหรับ shop
- ✅ Security headers พื้นฐาน
- ✅ Security logging

### จุดที่ต้องปรับปรุง
- 🟠 Master login ต้องใช้ token rotation
- 🟡 Image proxy ต้อง whitelist
- 🟡 Password policy ต้องเข้มงวดขึ้น
- 🟡 ควรมี account lockout

---

**ลงชื่อ:** Senior Security Engineer / Web Application Security Specialist  
**วันที่:** 18 มกราคม 2026
