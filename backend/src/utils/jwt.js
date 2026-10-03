import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Issues a signed JWT for an authenticated user.
 * `sub` (subject) holds the user id, per JWT convention.
 */
export function signAccessToken({ id, email }) {
  return jwt.sign({ sub: String(id), email }, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws if the token is missing, malformed, expired, or has a bad signature.
 */
export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
  if (typeof payload !== "object" || !/^[1-9]\d*$/.test(payload.sub) ||
      typeof payload.email !== "string" || !Number.isFinite(payload.exp)) {
    throw new Error("Invalid access token claims.");
  }
  return payload;
}

export default { signAccessToken, verifyAccessToken };
