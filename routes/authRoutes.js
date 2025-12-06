import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

dotenv.config();
const router = express.Router();

const genToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

// REGISTER
// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, emergency_contact } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ message: 'Email sudah terdaftar' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name,email,password,phone,emergency_contact) VALUES (?,?,?,?,?)',
      [name, email, hashed, phone, emergency_contact]
    );
    const user = { id: result.insertId, name, role: 'user' };
    const token = genToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error("🚨 REGISTER ERROR:", err);   // ⬅️ BUKAN err.message
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(400).json({ message: 'Email atau password salah' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Email atau password salah' });

    const token = genToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('🚨 LOGIN ERROR:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET PROFILE
router.get('/me', protect, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id,name,email,phone,emergency_contact,role FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json(rows[0]);
});

// UPDATE PROFILE
router.put('/me', protect, async (req, res) => {
  try {
    const { name, phone, emergency_contact } = req.body;
    await pool.query(
      'UPDATE users SET name = ?, phone = ?, emergency_contact = ? WHERE id = ?',
      [name, phone, emergency_contact, req.user.id]
    );
    res.json({ message: 'Profil berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui profil' });
  }
});

// GANTI PASSWORD
router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [
      req.user.id
    ]);

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Password lama salah' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [
      hashed,
      req.user.id
    ]);

    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah password' });
  }
});

export default router;
