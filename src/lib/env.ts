export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    if (secret.length < 32) {
        // In production, this should probably throw, but for now we'll warn
        if (process.env.NODE_ENV === 'production') {
            console.warn("WARNING: JWT_SECRET is too short. It should be at least 32 characters for security.");
        }
    }
    return secret;
}

export function getAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS;
    if (!origins) return [];
    return origins.split(',').map(o => o.trim());
}
