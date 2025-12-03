type RateLimitStore = Map<string, { count: number; expiresAt: number }>;

const store: RateLimitStore = new Map();

// Clean up expired entries every minute
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
        if (value.expiresAt < now) {
            store.delete(key);
        }
    }
}, 60000);

interface RateLimitConfig {
    limit: number;      // Max requests
    windowMs: number;   // Time window in milliseconds
}

export function rateLimit(ip: string, config: RateLimitConfig): { success: boolean; remaining: number } {
    const now = Date.now();
    const record = store.get(ip);

    if (!record) {
        store.set(ip, {
            count: 1,
            expiresAt: now + config.windowMs
        });
        return { success: true, remaining: config.limit - 1 };
    }

    if (record.expiresAt < now) {
        // Expired, reset
        store.set(ip, {
            count: 1,
            expiresAt: now + config.windowMs
        });
        return { success: true, remaining: config.limit - 1 };
    }

    if (record.count >= config.limit) {
        return { success: false, remaining: 0 };
    }

    record.count++;
    return { success: true, remaining: config.limit - record.count };
}
