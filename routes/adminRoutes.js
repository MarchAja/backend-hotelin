import express from "express";
import { pool } from "../config/db.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/reports/bookings", protect, adminOnly, async (req, res) => {
  const { startDate, endDate, status } = req.query;

  let where = "WHERE 1=1";
  const params = [];

  if (startDate) {
    where += " AND DATE(b.created_at) >= ?";
    params.push(startDate);
  }
  if (endDate) {
    where += " AND DATE(b.created_at) <= ?";
    params.push(endDate);
  }
  if (status && status !== "all") {
    where += " AND b.status = ?";
    params.push(status);
  }

  try {
    const [rows] = await pool.query(
      `SELECT b.id, u.name AS user_name, h.name AS hotel_name, r.name AS room_name,
              b.checkin_date, b.checkout_date, b.total_price, b.status, b.created_at
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN hotels h ON b.hotel_id = h.id
       JOIN rooms r ON b.room_id = r.id
       ${where}
       ORDER BY b.created_at DESC`,
      params
    );

    const totalBookings = rows.length;
    const totalPaid = rows
      .filter((r) => r.status === "paid")
      .reduce((sum, r) => sum + Number(r.total_price), 0);

    res.json({ rows, totalBookings, totalPaid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil laporan" });
  }
});

export default router;
