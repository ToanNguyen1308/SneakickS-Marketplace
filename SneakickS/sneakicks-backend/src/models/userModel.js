import { query } from "../config/db.js";

export const findByEmail = async (email) => {
  const { rows } = await query(
    `SELECT id, username, email, password_hash, role, avatar_url, created_at
     FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
};

export const findById = async (id) => {
  const { rows } = await query(
    `SELECT id, username, email, role, avatar_url, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

export const existsByEmail = async (email) => {
  const { rows } = await query(`SELECT 1 FROM users WHERE email = $1`, [email]);
  return rows.length > 0;
};

export const existsByUsername = async (username) => {
  const { rows } = await query(`SELECT 1 FROM users WHERE username = $1`, [
    username,
  ]);
  return rows.length > 0;
};

export const create = async ({ username, email, password_hash, role = "user" }) => {
  const { rows } = await query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, role, avatar_url, created_at`,
    [username, email, password_hash, role]
  );
  return rows[0];
};
