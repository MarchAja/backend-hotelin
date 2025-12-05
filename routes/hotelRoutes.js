import express from 'express';
import { pool } from '../config/db.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get semua hotel
router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM hotels ORDER BY created_at DESC');
  res.json(rows);
});

// Detail hotel + rooms
router.get('/:id', async (req, res) => {
  const hotelId = req.params.id;
  const [[hotel]] = await pool.query('SELECT * FROM hotels WHERE id = ?', [hotelId]);
  if (!hotel) return res.status(404).json({ message: 'Hotel tidak ditemukan' });
  const [rooms] = await pool.query('SELECT * FROM rooms WHERE hotel_id = ?', [hotelId]);
  res.json({ hotel, rooms });
});

// Admin: tambah hotel
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  const { name, address, city, description } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await pool.query(
    'INSERT INTO hotels (name,address,city,description,image_url) VALUES (?,?,?,?,?)',
    [name, address, city, description, image_url]
  );
  res.status(201).json({ id: result.insertId });
});

export default router;
