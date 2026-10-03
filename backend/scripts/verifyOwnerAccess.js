import { pool } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { grants } from "../src/models/commerceModel.js";

try {
  if (!env.ownerAdminEmail) throw new Error("OWNER_ADMIN_EMAIL is not configured.");
  const result = await pool.query(
    "SELECT id,email,role FROM users WHERE lower(email)=lower($1) AND deleted_at IS NULL",
    [env.ownerAdminEmail],
  );
  const owner = result.rows[0];
  if (!owner) throw new Error("The configured owner account was not found.");
  if (owner.role !== "admin") throw new Error("The configured owner account does not have the admin role.");
  const access = await grants(owner.id);
  if (!access.length || !access.every((item) => item.source === "owner_admin" && item.expires_at === null)) {
    throw new Error("The owner does not have complete non-expiring product access.");
  }
  console.log(`Owner access verified: ${owner.email} can open all ${access.length} active products.`);
} finally {
  await pool.end();
}
