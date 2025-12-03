import { getSiteSettings, SiteSettings } from './settings-service';

// In-memory cache for settings
let settingsCache: SiteSettings | null = null;
let cacheTime = 0;

// Cache duration: 5 minutes in production, 30 seconds in development
const CACHE_DURATION = process.env.NODE_ENV === 'production' ? 300000 : 30000;

/**
 * Get cached site settings to avoid repeated database calls
 * This significantly improves performance by reducing database queries
 */
export async function getCachedSettings(shopId?: number): Promise<SiteSettings> {
    // Always fetch fresh settings from database to ensure updates are immediate
    // Caching caused issues with color updates not reflecting immediately
    return await getSiteSettings(shopId);
}

/**
 * Invalidate the cache (useful when settings are updated)
 */
export function invalidateSettingsCache(): void {
    settingsCache = null;
    cacheTime = 0;
}
