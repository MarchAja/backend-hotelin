// // server/server.js (atau index.js, sesuaikan punya kamu)
// import express from 'express';
// import cors from "cors";
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import adminHotelRoutes from "./routes/adminHotelRoutes.js";
// import authRoutes from './routes/authRoutes.js';
// import hotelRoutes from './routes/hotelRoutes.js';
// import roomRoutes from './routes/roomRoutes.js';
// import bookingRoutes from './routes/bookingRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';
// import tripayCallbackRoutes from './routes/tripayCallbackRoutes.js'; // <— tambahkan ini
// import adminRoomRoutes from "./routes/adminRoomRoutes.js";


// dotenv.config();
// const app = express();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.use('/api/admin/hotels', adminHotelRoutes);

// app.use(
//   cors({
//     origin: "http://localhost:5173",         // alamat frontend-mu
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// // optional (kadang bantu untuk preflight OPTIONS)
// app.options("*", cors());

// app.use(express.json());
// // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use("/uploads", express.static("uploads"));


// app.use("/api/admin/rooms", adminRoomRoutes);

// // routes API utama
// app.use('/api/auth', authRoutes);
// app.use('/api/hotels', hotelRoutes);
// app.use('/api/rooms', roomRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/admin', adminRoutes);

// // Tripay callback (TANPA auth)
// app.use('/api/tripay', tripayCallbackRoutes);

// app.get('/', (req, res) => {
//   res.send('API hotel booking berjalan');
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminHotelRoutes from "./routes/adminHotelRoutes.js";
import adminRoomRoutes from "./routes/adminRoomRoutes.js";
import adminReportRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⬇⬇⬇ CORS di sini
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

// middleware lain
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin/hotels", adminHotelRoutes);
app.use("/api/admin/rooms", adminRoomRoutes);
app.use("/api/admin", adminReportRoutes);

app.get("/", (req, res) => {
  res.send("API hotel booking berjalan");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
