import express from 'express';
import { pool } from '../config/db.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Admin: list semua room
router.get('/', protect, adminOnly, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT rooms.*, hotels.name AS hotel_name FROM rooms JOIN hotels ON rooms.hotel_id = hotels.id'
  );
  res.json(rows);
});

// Admin: tambah room
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  const { hotel_id, name, description, price_per_night, stock } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await pool.query(
    'INSERT INTO rooms (hotel_id,name,description,price_per_night,stock,image_url) VALUES (?,?,?,?,?,?)',
    [hotel_id, name, description, price_per_night, stock, image_url]
  );
  res.status(201).json({ id: result.insertId });
});

// Admin: update room
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  const { name, description, price_per_night, stock } = req.body;
  let image_sql = '';
  const params = [name, description, price_per_night, stock];

  if (req.file) {
    image_sql = ', image_url = ?';
    params.push(`/uploads/${req.file.filename}`);
  }
  params.push(req.params.id);

  await pool.query(
    `UPDATE rooms SET name = ?, description = ?, price_per_night = ?, stock = ? ${image_sql} WHERE id = ?`,
    params
  );
  res.json({ message: 'Room diupdate' });
});

export default router;
