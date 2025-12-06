import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,      // contoh: auth-db1158.hstgr.io
  user: process.env.DB_USER,      // contoh: u663413022_hotelin
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

// TEST KONEKSI (tidak akan bikin crash, cuma log hasilnya)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL Connected!");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL Connection ERROR:", err.message);
  }
})();
