import { ApiError } from "./errorHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { pool } from "../config/db.js";

/**
 * Protects a route: requires a valid `Authorization: Bearer <token>`
 * header. Attaches `req.user = { id, email }` on success.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  const token = match?.[1];

  if (!token) {
    return next(new ApiError(401, "Authentication required. Please log in."));
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(new ApiError(401, "Your session has expired. Please log in again."));
  }
  try {
    const result = await pool.query("SELECT deleted_at FROM users WHERE id = $1", [payload.sub]);
    if (!result.rows[0] || result.rows[0].deleted_at) return next(new ApiError(401, "Your session has expired. Please log in again."));
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (error) { return next(error); }
}

/** Attach the current user when a bearer token is present while keeping public catalog routes public. */
export function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return requireAuth(req, res, next);
}

/** Reads the current database role so stale or client-controlled JWT claims can never grant access. */
export function requireRole(...allowedRoles) {
  return async function roleMiddleware(req, res, next) {
    try {
      const result = await pool.query("SELECT role FROM users WHERE id = $1", [req.user.id]);
      const role = result.rows[0]?.role;
      if (!role) return next(new ApiError(401, "Authentication required. Please log in."));
      if (!allowedRoles.includes(role)) return next(new ApiError(403, "You do not have permission to perform this action."));
      req.user.role = role;
      return next();
    } catch (error) { return next(error); }
  };
}

export default requireAuth;
