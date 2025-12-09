type RateLimitStore = Map<string, { count: number; expiresAt: number; firstRequestAt: number }>;

// Using a global store with LRU-like cleanup
const store: RateLimitStore = new Map();
const MAX_STORE_SIZE = 10000; // Limit memory usage

// Clean up expired entries every minute
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
        if (value.expiresAt < now) {
            store.delete(key);
        }
    }

    // LRU-like cleanup if store is too large
    if (store.size > MAX_STORE_SIZE) {
        const entries = Array.from(store.entries());
        // Sort by firstRequestAt (oldest first)
        entries.sort((a, b) => a[1].firstRequestAt - b[1].firstRequestAt);
        // Delete oldest 20%
        const toDelete = Math.floor(entries.length * 0.2);
        for (let i = 0; i < toDelete; i++) {
            store.delete(entries[i][0]);
        }
    }
}, 60000);

interface RateLimitConfig {
    limit: number;      // Max requests
    windowMs: number;   // Time window in milliseconds
}

/**
 * Simple in-memory rate limiter with fixed window
 * @param key - Unique identifier (e.g., "master-login:192.168.1.1")
 * @param config - Rate limit configuration
 * @returns Object with success status and remaining requests
 */
export function rateLimit(key: string, config: RateLimitConfig): { success: boolean; remaining: number; resetAt?: number } {
    const now = Date.now();
    const record = store.get(key);

    if (!record) {
        store.set(key, {
            count: 1,
            expiresAt: now + config.windowMs,
            firstRequestAt: now
        });
        return { success: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
    }

    if (record.expiresAt < now) {
        // Expired, reset
        store.set(key, {
            count: 1,
            expiresAt: now + config.windowMs,
            firstRequestAt: now
        });
        return { success: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
    }

    if (record.count >= config.limit) {
        return { success: false, remaining: 0, resetAt: record.expiresAt };
    }

    record.count++;
    return { success: true, remaining: config.limit - record.count, resetAt: record.expiresAt };
}

/**
 * Reset rate limit for a specific key (useful for testing or admin functions)
 */
export function resetRateLimit(key: string): void {
    store.delete(key);
}

/**
 * Get current rate limit status for a key (useful for debugging)
 */
export function getRateLimitStatus(key: string): { count: number; remaining: number; resetAt: number } | null {
    const record = store.get(key);
    if (!record) return null;

    const now = Date.now();
    if (record.expiresAt < now) return null;

    return {
        count: record.count,
        remaining: Math.max(0, 10 - record.count), // Assuming default limit of 10
        resetAt: record.expiresAt
    };
}
