// import express from "express";
// import { pool } from "../config/db.js";
// import { protect, adminOnly } from "../middleware/authMiddleware.js";
// import { upload } from "../middleware/uploadMiddleware.js";

// const router = express.Router();

// // LIST HOTEL
// router.get("/", protect, adminOnly, async (req, res) => {
//   try {
//     const [rows] = await pool.query("SELECT * FROM hotels ORDER BY id DESC");
//     res.json(rows);
//   } catch (err) {
//     console.error("GET /admin/hotels error:", err);
//     res.status(500).json({ message: "Gagal mengambil data hotel" });
//   }
// });

// // TAMBAH HOTEL
// router.post(
//   "/",
//   protect,
//   adminOnly,
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const { name, address, city, description } = req.body;

//       // kalau tabel kamu BELUM punya address/city, kita tetap simpan name+description+image
//       const image_url = req.file ? `/uploads/${req.file.filename}` : null;

//       // 👉 PAKAI KOLOM YANG PASTI ADA di tabel kamu
//       // jika tabelmu hanya punya: id, name, description, image_url
//       const [result] = await pool.query(
//         "INSERT INTO hotels (name, description, image_url) VALUES (?,?,?)",
//         [name, description, image_url]
//       );

//       // kalau nanti kamu punya kolom address/city, ganti querynya jadi:
//       // const [result] = await pool.query(
//       //   'INSERT INTO hotels (name,address,city,description,image_url) VALUES (?,?,?,?,?)',
//       //   [name, address, city, description, image_url]
//       // );

//       res.status(201).json({ id: result.insertId });
//     } catch (err) {
//       console.error("POST /admin/hotels error:", err);
//       res
//         .status(500)
//         .json({
//           message:
//             err?.sqlMessage || err?.message || "Gagal menyimpan hotel",
//         });
//     }
//   }
// );

// // UPDATE HOTEL
// router.put(
//   "/:id",
//   protect,
//   adminOnly,
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const { name, address, city, description } = req.body;
//       const hotelId = req.params.id;

//       let sql = "UPDATE hotels SET name = ?, description = ?";
//       const params = [name, description];

//       // kalau tabelmu punya kolom address & city, bisa tambahkan:
//       // sql = "UPDATE hotels SET name=?, address=?, city=?, description=?";
//       // params.push(address, city);

//       if (req.file) {
//         sql += ", image_url = ?";
//         params.push(`/uploads/${req.file.filename}`);
//       }

//       sql += " WHERE id = ?";
//       params.push(hotelId);

//       await pool.query(sql, params);
//       res.json({ message: "Hotel diupdate" });
//     } catch (err) {
//       console.error("PUT /admin/hotels error:", err);
//       res
//         .status(500)
//         .json({
//           message:
//             err?.sqlMessage || err?.message || "Gagal mengupdate hotel",
//         });
//     }
//   }
// );

// // HAPUS HOTEL
// router.delete("/:id", protect, adminOnly, async (req, res) => {
//   try {
//     await pool.query("DELETE FROM hotels WHERE id = ?", [req.params.id]);
//     res.json({ message: "Hotel dihapus" });
//   } catch (err) {
//     console.error("DELETE /admin/hotels error:", err);
//     res.status(500).json({ message: "Gagal menghapus hotel" });
//   }
// });

// export default router;


import express from "express";
import { pool } from "../config/db.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// GET ALL HOTELS
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM hotels ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("GET /admin/hotels ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil data hotel" });
  }
});

// ADD HOTEL
router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),        // ⬅️ pastikan nama field="image"
  async (req, res) => {
    try {
      const { name, address, city, description } = req.body;

      const image_url = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const [result] = await pool.query(
        "INSERT INTO hotels (name,address,city,description,image_url) VALUES (?,?,?,?,?)",
        [name, address, city, description, image_url]
      );

      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error("POST /admin/hotels ERROR:", err);
      res.status(500).json({
        message: err.sqlMessage || "Gagal menyimpan hotel",
      });
    }
  }
);

// UPDATE HOTEL
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, address, city, description } = req.body;

      let sql =
        "UPDATE hotels SET name=?, address=?, city=?, description=?";
      const params = [name, address, city, description];

      if (req.file) {
        sql += ", image_url=?";
        params.push(`/uploads/${req.file.filename}`);
      }

      sql += " WHERE id=?";
      params.push(req.params.id);

      await pool.query(sql, params);

      res.json({ message: "Hotel diupdate" });
    } catch (err) {
      console.error("PUT /admin/hotels ERROR:", err);
      res.status(500).json({
        message: err.sqlMessage || "Gagal mengupdate hotel",
      });
    }
  }
);

// DELETE HOTEL
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await pool.query("DELETE FROM hotels WHERE id = ?", [req.params.id]);
    res.json({ message: "Hotel dihapus" });
  } catch (err) {
    console.error("DELETE /admin/hotels ERROR:", err);
    res.status(500).json({ message: "Gagal menghapus hotel" });
  }
});

export default router;
