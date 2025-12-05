// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

// const uploadDir = 'uploads';
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename(req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) cb(null, true);
//   else cb(new Error('Hanya file gambar yang diperbolehkan'), false);
// };

// export const upload = multer({ storage, fileFilter });

import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

export const upload = multer({ storage });
