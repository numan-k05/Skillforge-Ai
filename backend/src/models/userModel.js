import { pool } from "../config/db.js";

export async function createUser({ name, email, passwordHash }, client = pool) {
  const result = await client.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, name, email, role, password_hash, created_at
     FROM users
     WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateUserName(id, name) {
  const result = await pool.query(
    `UPDATE users
     SET name = $2
     WHERE id = $1
     RETURNING id, name, email, created_at`,
    [id, name]
  );
  return result.rows[0] || null;
}

export async function updateUserPassword(id, passwordHash, client = pool) {
  await client.query(
    `UPDATE users
     SET password_hash = $2
     WHERE id = $1`,
    [id, passwordHash]
  );
}

export default { createUser, findUserByEmail, findUserById, updateUserName, updateUserPassword };
