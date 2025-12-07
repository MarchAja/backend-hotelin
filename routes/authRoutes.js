// server/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { pool } from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

/* ============================================================
   Helper: generate JWT token
============================================================ */
const genToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

/* ============================================================
   REGISTER
============================================================ */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, emergency_contact } = req.body;

    // cek email / username sudah dipakai atau belum
    const [exists] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR name = ? LIMIT 1",
      [email, name]
    );
    if (exists.length) {
      return res
        .status(400)
        .json({ message: "Email atau username sudah terdaftar" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, phone, emergency_contact, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashed, phone, emergency_contact, "user"]
    );

    const user = { id: result.insertId, name, role: "user" };
    const token = genToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error("🚨 REGISTER ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

/* ============================================================
   LOGIN  (bisa email ATAU username)
============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // "email" di body boleh berisi email ATAU username
    const identifier = String(email ?? "").trim();
    console.log("🔑 LOGIN identifier:", identifier);

    // PENTING: query pakai tanda tanya (parameterized), BUKAN ${}
    const sql = `
      SELECT * FROM users
      WHERE email = ? OR name = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [identifier, identifier]);

    const user = rows[0];

    if (!user) {
      return res
        .status(400)
        .json({ message: "Email/username atau password salah" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(400)
        .json({ message: "Email/username atau password salah" });
    }

    const token = genToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("🚨 LOGIN ERROR:", err);
    console.error("🔍 DETAIL LOGIN ERROR:", {
      code: err.code,
      errno: err.errno,
      sql: err.sql,
    });
    res.status(500).json({ message: "Terjadi kesalahan server saat login" });
  }
});

/* ============================================================
   GET PROFILE
============================================================ */
router.get("/me", protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, emergency_contact, role
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("🚨 GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

/* ============================================================
   UPDATE PROFILE
============================================================ */
router.put("/me", protect, async (req, res) => {
  try {
    const { name, phone, emergency_contact } = req.body;

    await pool.query(
      `UPDATE users
       SET name = ?, phone = ?, emergency_contact = ?
       WHERE id = ?`,
      [name, phone, emergency_contact, req.user.id]
    );

    res.json({ message: "Profil berhasil diperbarui" });
  } catch (err) {
    console.error("🚨 UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Gagal memperbarui profil" });
  }
});

export default router;
