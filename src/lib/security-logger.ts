/**
 * Security Logger
 * 
 * Structured security logging for authentication events, rate limiting,
 * and suspicious activities. In production, integrate with SIEM or log aggregator.
 */

type SecurityEventType =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'REGISTER_SUCCESS'
    | 'REGISTER_FAILED'
    | 'PASSWORD_RESET_REQUESTED'
    | 'PASSWORD_RESET_SUCCESS'
    | 'PASSWORD_CHANGE'
    | 'PASSWORD_CHANGE_SUCCESS'
    | 'PASSWORD_CHANGE_FAILED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INVALID_TOKEN'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_REFRESHED'
    | 'UNAUTHORIZED_ACCESS'
    | 'SUSPICIOUS_ACTIVITY';

interface SecurityEventDetails {
    ip?: string;
    userId?: number;
    username?: string;
    shopId?: number;
    endpoint?: string;
    reason?: string;
    userAgent?: string;
    [key: string]: any;
}

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Log a security event with structured data
 */
export function logSecurityEvent(
    event: SecurityEventType,
    details: SecurityEventDetails
) {
    const log = {
        timestamp: new Date().toISOString(),
        level: getEventLevel(event),
        event,
        ...details,
    };

    // In development, use colorful console output
    if (isDev) {
        const color = getEventColor(event);
        console.log(
            `%c[SECURITY] ${event}`,
            `color: ${color}; font-weight: bold`,
            log
        );
    } else {
        // In production, output JSON for log aggregators
        console.log(JSON.stringify(log));
    }

    // TODO: In production, send to external service
    // sendToSIEM(log);
    // sendToSlack(log); // For critical events
}

/**
 * Get event severity level
 */
function getEventLevel(event: SecurityEventType): 'info' | 'warn' | 'error' {
    const warnEvents: SecurityEventType[] = [
        'LOGIN_FAILED',
        'REGISTER_FAILED',
        'RATE_LIMIT_EXCEEDED',
        'INVALID_TOKEN',
        'TOKEN_EXPIRED',
    ];

    const errorEvents: SecurityEventType[] = [
        'UNAUTHORIZED_ACCESS',
        'SUSPICIOUS_ACTIVITY',
    ];

    if (errorEvents.includes(event)) return 'error';
    if (warnEvents.includes(event)) return 'warn';
    return 'info';
}

/**
 * Get color for console output
 */
function getEventColor(event: SecurityEventType): string {
    const colors: Record<string, string> = {
        LOGIN_SUCCESS: '#22c55e',
        LOGIN_FAILED: '#f59e0b',
        LOGOUT: '#64748b',
        REGISTER_SUCCESS: '#22c55e',
        REGISTER_FAILED: '#f59e0b',
        RATE_LIMIT_EXCEEDED: '#f59e0b',
        INVALID_TOKEN: '#ef4444',
        TOKEN_EXPIRED: '#f59e0b',
        TOKEN_REFRESHED: '#3b82f6',
        UNAUTHORIZED_ACCESS: '#ef4444',
        SUSPICIOUS_ACTIVITY: '#ef4444',
    };
    return colors[event] || '#64748b';
}

/**
 * Extract client info from request headers
 */
export function getClientInfo(request: Request): {
    ip: string;
    userAgent: string;
} {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return { ip, userAgent };
}

/**
 * Log failed login attempt with rate limit info
 */
export function logFailedLogin(
    request: Request,
    username: string,
    reason: string,
    shopId?: number
) {
    const { ip, userAgent } = getClientInfo(request);
    logSecurityEvent('LOGIN_FAILED', {
        ip,
        username,
        reason,
        shopId,
        userAgent,
        endpoint: '/api/auth/login',
    });
}

/**
 * Log successful login
 */
export function logSuccessfulLogin(
    request: Request,
    userId: number,
    username: string,
    shopId?: number
) {
    const { ip, userAgent } = getClientInfo(request);
    logSecurityEvent('LOGIN_SUCCESS', {
        ip,
        userId,
        username,
        shopId,
        userAgent,
    });
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(
    request: Request,
    endpoint: string,
    shopId?: number
) {
    const { ip, userAgent } = getClientInfo(request);
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip,
        endpoint,
        shopId,
        userAgent,
    });
}
