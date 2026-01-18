// lib/db.ts
import mysql from "mysql2/promise";

declare global {
  var mysqlPool: mysql.Pool | undefined;
}



const pool = globalThis.mysqlPool || mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Performance optimizations
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds
  connectTimeout: 10000, // 10 seconds
  maxIdle: 5, // Max idle connections
  idleTimeout: 60000, // 60 seconds
});

if (process.env.NODE_ENV !== "production") {
  globalThis.mysqlPool = pool;
}

export default pool;
