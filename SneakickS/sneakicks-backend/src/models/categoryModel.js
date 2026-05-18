import { query } from "../config/db.js";

export const findAll = async () => {
  const { rows } = await query(
    `SELECT id, name, description, image_url
     FROM categories
     ORDER BY id ASC`
  );
  return rows;
};

export const findById = async (id) => {
  const { rows } = await query(
    `SELECT id, name, description, image_url
     FROM categories WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};
