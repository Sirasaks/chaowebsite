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
});

if (process.env.NODE_ENV !== "production") {
  globalThis.mysqlPool = pool;
}

export default pool;
