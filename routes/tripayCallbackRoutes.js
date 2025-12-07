// server/routes/tripayCallbackRoutes.js
import express from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const { TRIPAY_PRIVATE_KEY } = process.env;

// Tripay akan mengirim POST ke /api/tripay/callback
router.post('/callback', express.json(), async (req, res) => {
  try {
    const json = JSON.stringify(req.body);

    // Signature yang kita hitung
    const signature = crypto
      .createHmac('sha256', TRIPAY_PRIVATE_KEY)
      .update(json)
      .digest('hex');

    const callbackSignature = req.headers['x-callback-signature'];

    if (callbackSignature !== signature) {
      console.log('Invalid callback signature');
      return res.status(403).send('Invalid signature');
    }

    const event = req.headers['x-callback-event'];
    const data = req.body;

    if (event === 'payment_status') {
      const { reference, status } = data; // status: PAID, UNPAID, EXPIRED, dll

      // Cari payment berdasarkan reference Tripay
      const [payments] = await pool.query(
        'SELECT * FROM payments WHERE reference = ?',
        [reference]
      );

      if (!payments.length) {
        console.log('Payment tidak ditemukan untuk reference:', reference);
      } else {
        const payment = payments[0];

        // update status payment
const isPaid = status === "PAID";

// update payments
await pool.query(
  `UPDATE payments
     SET status = ?,
         paid_at = CASE WHEN ? THEN NOW() ELSE paid_at END
   WHERE id = ?`,
  [isPaid ? "success" : "pending", isPaid, payment.id]
);

// kalau sudah dibayar, update booking jadi "paid"
if (isPaid) {
  await pool.query(
    "UPDATE bookings SET status = 'paid' WHERE id = ?",
    [payment.booking_id]
  );
}

      }
    }

    // Tripay cuma butuh respons 200 agar callback dianggap berhasil
    res.json({ success: true });
  } catch (err) {
    console.error('Error di Tripay callback:', err);
    res.status(500).json({ success: false });
  }
});

export default router;
