// lib/api-utils.ts
// Utility functions for API routes

import { NextResponse } from "next/server";

/**
 * Cache duration presets (in seconds)
 */
export const CACHE_DURATION = {
    /** ไม่เปลี่ยน: 1 ชั่วโมง */
    STATIC: 3600,
    /** เปลี่ยนน้อย: 5 นาที */
    SEMI_STATIC: 300,
    /** เปลี่ยนปานกลาง: 1 นาที */
    DYNAMIC: 60,
    /** real-time: 30 วินาที */
    REALTIME: 30,
    /** ไม่ cache เลย */
    NONE: 0,
} as const;

/**
 * สร้าง Cache-Control headers สำหรับ API responses
 * 
 * @param maxAge - Cache duration in seconds
 * @param staleWhileRevalidate - Allow stale content while revalidating (default: maxAge * 2)
 * @returns Headers object
 * 
 * @example
 * ```ts
 * return NextResponse.json(data, {
 *     headers: getCacheHeaders(CACHE_DURATION.DYNAMIC)
 * });
 * ```
 */
export function getCacheHeaders(
    maxAge: number,
    staleWhileRevalidate?: number
): HeadersInit {
    if (maxAge === 0) {
        return {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        };
    }

    const swr = staleWhileRevalidate ?? maxAge * 2;
    return {
        'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
        'Vary': 'Accept-Encoding',
    };
}

/**
 * สร้าง success response พร้อม caching
 */
export function jsonWithCache<T>(
    data: T,
    maxAge: number = CACHE_DURATION.DYNAMIC
): NextResponse<T> {
    return NextResponse.json(data, {
        headers: getCacheHeaders(maxAge),
    });
}

/**
 * สร้าง no-cache response สำหรับข้อมูล real-time
 */
export function jsonNoCache<T>(data: T): NextResponse<T> {
    return NextResponse.json(data, {
        headers: getCacheHeaders(CACHE_DURATION.NONE),
    });
}

/**
 * สร้าง error response
 */
export function jsonError(
    message: string,
    status: number = 500
): NextResponse<{ error: string }> {
    return NextResponse.json(
        { error: message },
        { status }
    );
}
