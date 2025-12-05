import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Tidak ada token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Hanya admin yang boleh mengakses' });
  }
  next();
};
