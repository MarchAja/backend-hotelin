import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// import semua routes
import authRoutes from "./routes/authRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminHotelRoutes from "./routes/adminHotelRoutes.js";
import adminRoomRoutes from "./routes/adminRoomRoutes.js";
import adminReportRoutes from "./routes/adminRoutes.js";
import tripayCallbackRoutes from "./routes/tripayCallbackRoutes.js";   // WAJIB

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================== CORS ============================
const allowedOrigins = [
  "http://localhost:5173",      // frontend development
  process.env.CLIENT_URL        // frontend production (Hostinger)
];

// =============== CORS ===============
app.use(
  cors({
    origin: [
      "http://localhost:5173",      // untuk development
      "https://marchaja.dev",       // domain frontend di Hostinger
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// optional, bantu preflight
app.options("*", cors());


// middleware
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ====================== ROUTES ==========================
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin/hotels", adminHotelRoutes);
app.use("/api/admin/rooms", adminRoomRoutes);
app.use("/api/admin", adminReportRoutes);

// Tripay callback
app.use("/api/tripay", tripayCallbackRoutes);

// test route
app.get("/", (req, res) => {
  res.send("API hotel booking berjalan");
});

// PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
