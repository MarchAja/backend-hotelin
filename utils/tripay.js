// server/utils/tripay.js
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const {
  TRIPAY_API_KEY,
  TRIPAY_PRIVATE_KEY,
  TRIPAY_MERCHANT_CODE,
  TRIPAY_MODE,
  TRIPAY_CALLBACK_URL,
  TRIPAY_RETURN_URL
} = process.env;

const BASE_URL =
  TRIPAY_MODE === 'production'
    ? 'https://tripay.co.id/api'
    : 'https://tripay.co.id/api-sandbox';

/**
 * Create closed transaction on Tripay
 * @param {Object} payload
 *  - amount
 *  - method (ex: 'BRIVA', 'QRIS', dll, harus aktif di akun Tripay-mu)
 *  - merchantRef (string unik)
 *  - customer { name, email, phone }
 *  - bookingId (untuk informasi saja)
 */
export async function createTripayTransaction({
  amount,
  method,
  merchantRef,
  customer,
  bookingId
}) {
  const data = {
    method, // contoh: 'BRIVA', 'BCAVA', 'QRIS'
    merchant_ref: merchantRef,
    amount,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone || '080000000000',
    order_items: [
      {
        sku: `BOOKING-${bookingId}`,
        name: 'Pemesanan kamar hotel',
        price: amount,
        quantity: 1
      }
    ],
    callback_url: TRIPAY_CALLBACK_URL,
    return_url: TRIPAY_RETURN_URL,
    expired_time: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 jam
  };

  // signature = HMAC_SHA256(merchant_code + merchant_ref + amount, private_key)
  // sesuai panduan Tripay :contentReference[oaicite:1]{index=1}
  const signature = crypto
    .createHmac('sha256', TRIPAY_PRIVATE_KEY)
    .update(TRIPAY_MERCHANT_CODE + data.merchant_ref + data.amount)
    .digest('hex');

  const payload = { ...data, signature };

  const url = `${BASE_URL}/transaction/create`;

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${TRIPAY_API_KEY}`
    },
    validateStatus: (s) => s < 999
  });

  if (!res.data?.success) {
    console.error('Tripay error:', res.data);
    throw new Error(res.data?.message || 'Gagal membuat transaksi Tripay');
  }

  return res.data.data; // isi: reference, pay_code, amount, payment_url, dll
}
