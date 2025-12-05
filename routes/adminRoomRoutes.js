// server/routes/adminRoomRoutes.js
import express from "express";
import { pool } from "../config/db.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// 👉 GET daftar hotel (untuk dropdown di Tambah Kamar)
router.get("/hotels", protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM hotels ORDER BY name ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /admin/rooms/hotels ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil data hotel" });
  }
});

// 👉 GET semua kamar + nama hotel
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, h.name AS hotel_name
       FROM rooms r
       JOIN hotels h ON r.hotel_id = h.id
       ORDER BY r.id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /admin/rooms ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil data kamar" });
  }
});

// 👉 TAMBAH kamar
router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),
  async (req, res) => {
    try {
      const { hotel_id, name, description, price_per_night, stock } = req.body;
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;

      const [result] = await pool.query(
        `INSERT INTO rooms 
         (hotel_id, name, description, price_per_night, stock, image_url)
         VALUES (?,?,?,?,?,?)`,
        [hotel_id, name, description, price_per_night, stock, image_url]
      );

      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error("POST /admin/rooms ERROR:", err);
      res.status(500).json({
        message: err.sqlMessage || err.message || "Gagal menyimpan kamar",
      });
    }
  }
);

// 👉 UPDATE kamar
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("image"),
  async (req, res) => {
    try {
      const { hotel_id, name, description, price_per_night, stock } = req.body;
      const roomId = req.params.id;

      let sql =
        "UPDATE rooms SET hotel_id=?, name=?, description=?, price_per_night=?, stock=?";
      const params = [hotel_id, name, description, price_per_night, stock];

      if (req.file) {
        sql += ", image_url=?";
        params.push(`/uploads/${req.file.filename}`);
      }

      sql += " WHERE id=?";
      params.push(roomId);

      await pool.query(sql, params);
      res.json({ message: "Kamar diupdate" });
    } catch (err) {
      console.error("PUT /admin/rooms ERROR:", err);
      res.status(500).json({
        message: err.sqlMessage || err.message || "Gagal mengupdate kamar",
      });
    }
  }
);

// 👉 HAPUS kamar
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await pool.query("DELETE FROM rooms WHERE id = ?", [req.params.id]);
    res.json({ message: "Kamar dihapus" });
  } catch (err) {
    console.error("DELETE /admin/rooms ERROR:", err);
    res.status(500).json({ message: "Gagal menghapus kamar" });
  }
});

export default router;
