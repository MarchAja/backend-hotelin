import express from 'express';
import { pool } from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
import { createTripayTransaction } from '../utils/tripay.js';

const router = express.Router();

// ====================
// 1. BUAT BOOKING BARU
// ====================
router.post('/', protect, async (req, res) => {
  try {
    const { hotel_id, room_id, checkin_date, checkout_date } = req.body;

    // hitung malam
    const start = new Date(checkin_date);
    const end = new Date(checkout_date);
    const diffTime = end - start;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return res
        .status(400)
        .json({ message: 'Tanggal check-in / check-out tidak valid' });
    }

    // ambil harga dan stok
    const [[room]] = await pool.query('SELECT * FROM rooms WHERE id = ?', [
      room_id
    ]);
    if (!room) return res.status(404).json({ message: 'Kamar tidak ditemukan' });
    if (room.stock <= 0)
      return res.status(400).json({ message: 'Stok kamar habis' });

    const total_price = nights * Number(room.price_per_night);

    // kurangi stok global 1
    await pool.query('UPDATE rooms SET stock = stock - 1 WHERE id = ?', [
      room_id
    ]);

    // buat booking
    const [result] = await pool.query(
      `INSERT INTO bookings 
        (user_id, hotel_id, room_id, checkin_date, checkout_date, nights, total_price, status)
       VALUES (?,?,?,?,?,?,?,'waiting_payment')`,
      [req.user.id, hotel_id, room_id, checkin_date, checkout_date, nights, total_price]
    );

    res.status(201).json({ id: result.insertId, nights, total_price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat booking' });
  }
});

// =========================
// 2. RIWAYAT BOOKING USER
// =========================
router.get('/my', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
  b.*, 
  h.name AS hotel_name, 
  r.name AS room_name,
  p.reference AS payment_reference
FROM bookings b
JOIN hotels h ON b.hotel_id = h.id
JOIN rooms r ON b.room_id = r.id
LEFT JOIN payments p ON p.booking_id = b.id
WHERE b.user_id = ?
ORDER BY b.created_at DESC
`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil riwayat booking' });
  }
});

// ==================================================
// 3. PEMBAYARAN VIA TRIPAY UNTUK BOOKING TERTENTU
// ==================================================
router.post('/:id/tripay', protect, async (req, res) => {
  const bookingId = req.params.id;
  const { method = 'BRIVA' } = req.body; // default BRIVA

  try {
    // Ambil data booking + user
    const [rows] = await pool.query(
      `SELECT b.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.id = ? AND b.user_id = ?`,
      [bookingId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }

    const booking = rows[0];

    if (booking.status === 'paid') {
      return res
        .status(400)
        .json({ message: 'Booking ini sudah dibayar sebelumnya' });
    }

    const merchantRef = `INV-${booking.id}-${Date.now()}`;

    // Panggil Tripay
    const tripayData = await createTripayTransaction({
      amount: Number(booking.total_price),
      method,
      merchantRef,
      customer: {
        name: booking.customer_name,
        email: booking.customer_email,
        phone: booking.customer_phone
      },
      bookingId: booking.id
    });

    // Simpan data payment ke DB
    await pool.query(
      `INSERT INTO payments (booking_id, method, status, provider, reference, pay_code, pay_url)
       VALUES (?, ?, ?, 'tripay', ?, ?, ?)`,
      [
        booking.id,
        method,
        'pending',
        tripayData.reference,
        tripayData.pay_code || null,
        tripayData.payment_url || null
      ]
    );

    // Pastikan status booking waiting_payment
    await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [
      'waiting_payment',
      booking.id
    ]);

        res.json({
      bookingId: booking.id,
      tripay: {
        reference: tripayData.reference,
        amount: tripayData.amount,
        pay_code: tripayData.pay_code,
        payment_url: tripayData.payment_url,
        payment_name: tripayData.payment_name,
        expired_time: tripayData.expired_time,
        qr_url: tripayData.qr_url || null,
        qr_string: tripayData.qr_string || null
      }
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ message: 'Gagal membuat transaksi Tripay' });
  }
});

// OPSIONAL: route lama simulasi bayar manual, kalau masih mau dipakai
router.post('/:id/pay', protect, async (req, res) => {
  const bookingId = req.params.id;

  try { 
    const [[booking]] = await pool.query(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [bookingId, req.user.id]
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }

    await pool.query('UPDATE bookings SET status = "paid" WHERE id = ?', [
      bookingId
    ]);
    await pool.query(
      'INSERT INTO payments (booking_id, method, status, provider) VALUES (?, "manual", "success", "manual")',
      [bookingId]
    );

    res.json({ message: 'Pembayaran manual berhasil (simulasi)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memproses pembayaran' });
  }
});

// DETAIL BOOKING BY ID
router.get('/:id', protect, async (req, res) => {
  const bookingId = req.params.id;

  try {
    const [[booking]] = await pool.query(
      `SELECT 
         b.*, 
         h.name AS hotel_name,
         h.city,
         h.address,
         r.name AS room_name,
         p.reference AS payment_reference,
         p.method AS payment_method,
         p.status AS payment_status
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.id = ? AND b.user_id = ?`,
      [bookingId, req.user.id]
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil detail booking' });
  }
});


export default router;
