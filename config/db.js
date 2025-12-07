// config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// baca CA certificate Aiven
const ca = fs.readFileSync(path.join(__dirname, "ca.pem"));

export const pool = mysql.createPool({
  host: process.env.DB_HOST,     // mysql-3319...aivencloud.com
  user: process.env.DB_USER,     // avnadmin
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // defaultdb
  port: process.env.DB_PORT || 3306,
  ssl: {
    ca,                          // penting buat Aiven
  },
});

// Test koneksi (boleh dibiarkan untuk sementara)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✔ Connected to Aiven MySQL");
    conn.release();
  } catch (err) {
    console.error("❌ Aiven MySQL ERROR:", err);
  }
})();
