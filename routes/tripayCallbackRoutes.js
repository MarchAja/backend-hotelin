// server/routes/tripayCallbackRoutes.js
import express from "express";
import crypto from "crypto";
import { pool } from "../config/db.js";

const router = express.Router();

router.post("/callback", express.json(), async (req, res) => {
  try {
    const payload = req.body;
    const { status, reference, merchant_ref, signature } = payload;

    // (opsional tapi sebaiknya ada) verifikasi signature Tripay
    if (process.env.TRIPAY_PRIVATE_KEY) {
      const json = JSON.stringify({ ...payload, signature: undefined });
      const calcSign = crypto
        .createHmac("sha256", process.env.TRIPAY_PRIVATE_KEY)
        .update(json)
        .digest("hex");

      if (signature && signature !== calcSign) {
        console.error("Signature Tripay tidak valid");
        return res.status(403).json({ success: false, message: "Invalid signature" });
      }
    }

    // cari payment berdasarkan reference Tripay
    const [[payment]] = await pool.query(
      "SELECT * FROM payments WHERE reference = ?",
      [reference]
    );

    if (!payment) {
      console.error("Payment tidak ditemukan untuk reference:", reference);
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const isPaid = status === "PAID";

    // update payments
    await pool.query(
      `UPDATE payments
         SET status = ?,
             paid_at = CASE WHEN ? THEN NOW() ELSE paid_at END
       WHERE id = ?`,
      [isPaid ? "success" : "pending", isPaid, payment.id]
    );

    // kalau sudah dibayar, update booking
    if (isPaid) {
      await pool.query(
        "UPDATE bookings SET status = 'paid' WHERE id = ?",
        [payment.booking_id]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Error di Tripay callback:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;
