import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from './errorHandler.js';

export const isOwnerAdmin = user => Boolean(env.ownerAdminEmail && user?.role === 'admin' && user.email?.toLowerCase() === env.ownerAdminEmail);
export async function requireOwnerAdmin(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT email,role FROM users WHERE id=$1 AND deleted_at IS NULL', [req.user.id]);
    if (!isOwnerAdmin(rows[0])) throw new ApiError(403, 'Only the site owner can access administration.');
    next();
  } catch (error) { next(error); }
}
