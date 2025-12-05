import { pool } from '../config/db.js';

export const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

export const createUser = async (data) => {
  const { name, email, hashedPassword, phone, emergency_contact, role } = data;
  const [result] = await pool.query(
    'INSERT INTO users (name,email,password,phone,emergency_contact,role) VALUES (?,?,?,?,?,?)',
    [name, email, hashedPassword, phone, emergency_contact, role || 'user']
  );
  return result.insertId;
};
