import pool from "./db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Query Performance Logger
 * 
 * Utility functions for logging and monitoring database query performance.
 * Helps identify slow queries during development.
 */

const SLOW_QUERY_THRESHOLD = 100; // milliseconds
const isDev = process.env.NODE_ENV !== 'production';

export interface QueryResult<T> {
    data: T;
    duration: number;
    isSlowQuery: boolean;
}

/**
 * Execute a query with performance logging
 * Logs slow queries (>100ms) with warning in development
 */
export async function queryWithLogging<T extends RowDataPacket[] | ResultSetHeader>(
    sql: string,
    params: any[],
    label: string = 'Query'
): Promise<QueryResult<T>> {
    const start = performance.now();

    try {
        const [result] = await pool.query<T>(sql, params);
        const duration = performance.now() - start;
        const isSlowQuery = duration > SLOW_QUERY_THRESHOLD;

        if (isDev && isSlowQuery) {
            console.warn(
                `%c[SLOW QUERY] ${label}: ${duration.toFixed(2)}ms`,
                'color: #f59e0b; font-weight: bold'
            );
            console.log(`SQL: ${sql.substring(0, 200)}...`);
        }

        return {
            data: result,
            duration,
            isSlowQuery,
        };
    } catch (error) {
        const duration = performance.now() - start;
        console.error(`[QUERY ERROR] ${label}: ${duration.toFixed(2)}ms`, error);
        throw error;
    }
}

/**
 * Execute multiple queries in parallel with combined logging
 */
export async function queryParallelWithLogging<T extends RowDataPacket[]>(
    queries: Array<{ sql: string; params: any[]; label: string }>
): Promise<{ results: T[]; totalDuration: number; slowQueries: string[] }> {
    const start = performance.now();
    const slowQueries: string[] = [];

    const results = await Promise.all(
        queries.map(async ({ sql, params, label }) => {
            const result = await queryWithLogging<T>(sql, params, label);
            if (result.isSlowQuery) {
                slowQueries.push(`${label}: ${result.duration.toFixed(2)}ms`);
            }
            return result.data;
        })
    );

    const totalDuration = performance.now() - start;

    if (isDev && slowQueries.length > 0) {
        console.warn(
            `%c[PARALLEL QUERIES] Total: ${totalDuration.toFixed(2)}ms, Slow queries: ${slowQueries.length}`,
            'color: #f59e0b'
        );
    }

    return { results, totalDuration, slowQueries };
}

/**
 * Log query statistics for debugging
 */
export function logQueryStats(label: string, duration: number, rowCount?: number) {
    if (!isDev) return;

    const status = duration > SLOW_QUERY_THRESHOLD ? '⚠️' : '✅';
    console.log(
        `%c${status} [${label}] ${duration.toFixed(2)}ms${rowCount !== undefined ? ` (${rowCount} rows)` : ''}`,
        duration > SLOW_QUERY_THRESHOLD ? 'color: #f59e0b' : 'color: #22c55e'
    );
}
