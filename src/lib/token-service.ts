/**
 * Token Service
 * 
 * Implements token rotation with short-lived access tokens and long-lived refresh tokens.
 * - Access Token: 15 minutes (for API access)
 * - Refresh Token: 7 days (stored in database for revocation)
 */

import jwt from 'jsonwebtoken';
import pool from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getJwtSecret } from './env';
import crypto from 'crypto';

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

interface TokenPayload {
    userId: number;
    role?: string;
    tokenType: 'shop' | 'master';
    type: 'access' | 'refresh';
}

interface RefreshTokenRecord {
    id: number;
    token_hash: string;
    user_id: number;
    expires_at: Date;
    created_at: Date;
}

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a refresh token for secure storage
 */
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate access and refresh tokens
 */
export async function generateTokenPair(
    userId: number,
    role: string,
    tokenType: 'shop' | 'master',
    shopId?: number
): Promise<{ accessToken: string; refreshToken: string }> {
    const secret = getJwtSecret();

    // Generate access token (short-lived JWT)
    const accessToken = jwt.sign(
        { userId, role, tokenType, type: 'access' } as TokenPayload,
        secret,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Generate refresh token (random string, stored in DB)
    const refreshToken = generateSecureToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    // Store refresh token in database
    // Store refresh token in database
    const table = tokenType === 'master' ? 'master_refresh_tokens' : 'refresh_tokens';

    if (tokenType === 'master') {
        await pool.query<ResultSetHeader>(
            `INSERT INTO ${table} (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
            [userId, tokenHash, expiresAt]
        );
    } else {
        await pool.query<ResultSetHeader>(
            `INSERT INTO ${table} (user_id, token_hash, expires_at, shop_id) VALUES (?, ?, ?, ?)`,
            [userId, tokenHash, expiresAt, shopId || null]
        );
    }

    return { accessToken, refreshToken };
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
        if (decoded.type !== 'access') return null;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Refresh tokens - validate refresh token and issue new pair
 */
export async function refreshTokens(
    refreshToken: string,
    tokenType: 'shop' | 'master',
    shopId?: number
): Promise<{ accessToken: string; refreshToken: string } | null> {
    const tokenHash = hashToken(refreshToken);
    const table = tokenType === 'master' ? 'master_refresh_tokens' : 'refresh_tokens';
    const userTable = tokenType === 'master' ? 'master_users' : 'users';

    const connection = await pool.getConnection();
    try {
        // Find valid refresh token
        const [tokens] = await connection.query<RowDataPacket[]>(
            `SELECT rt.*, u.role FROM ${table} rt 
             JOIN ${userTable} u ON rt.user_id = u.id
             WHERE rt.token_hash = ? AND rt.expires_at > NOW() AND rt.revoked = FALSE`,
            [tokenHash]
        );

        if (tokens.length === 0) {
            return null;
        }

        const tokenRecord = tokens[0];
        const userId = tokenRecord.user_id;
        const role = tokenRecord.role;

        // Revoke old refresh token (token rotation)
        await connection.query(
            `UPDATE ${table} SET revoked = TRUE WHERE token_hash = ?`,
            [tokenHash]
        );

        // Generate new token pair
        const newTokens = await generateTokenPair(userId, role, tokenType, shopId);

        return newTokens;
    } finally {
        connection.release();
    }
}

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
export async function revokeAllUserTokens(
    userId: number,
    tokenType: 'shop' | 'master'
): Promise<void> {
    const table = tokenType === 'master' ? 'master_refresh_tokens' : 'refresh_tokens';
    await pool.query(
        `UPDATE ${table} SET revoked = TRUE WHERE user_id = ?`,
        [userId]
    );
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(
    refreshToken: string,
    tokenType: 'shop' | 'master'
): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const table = tokenType === 'master' ? 'master_refresh_tokens' : 'refresh_tokens';
    await pool.query(
        `UPDATE ${table} SET revoked = TRUE WHERE token_hash = ?`,
        [tokenHash]
    );
}

/**
 * Cleanup expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<void> {
    await pool.query(
        `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE`
    );
    await pool.query(
        `DELETE FROM master_refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE`
    );
}

/**
 * Get cookie options for tokens
 */
export function getAccessTokenCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 15 * 60, // 15 minutes
    };
}

export function getRefreshTokenCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/api/auth/refresh', // Only sent to refresh endpoint
        maxAge: 7 * 24 * 60 * 60, // 7 days
    };
}
