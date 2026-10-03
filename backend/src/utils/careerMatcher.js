// Phase 5A: career-goal resolution is now DB-driven (see
// database/schema/007_universal_careers.sql / 008_migrate_existing_careers.sql),
// so adding a career or an alias for it is a database seed, not a code
// change. This file only keeps a normalization + a thin lookup wrapper
// so callers don't need to know how the alias table is queried.
import { pool } from "../config/db.js";

function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Resolves a free-text career goal (as entered by a student during
 * onboarding, or passed as a ?career= query param) to a career row from
 * the `careers` catalog, via the `career_aliases` table (which includes
 * every career's own title as an alias, so an exact-title match always
 * works too). Returns null if nothing matches.
 */
export async function resolveCareer(rawTitle) {
  if (!rawTitle || typeof rawTitle !== "string") return null;

  const norm = normalize(rawTitle);
  const result = await pool.query(
    `SELECT c.id, c.title, c.slug, c.category_id, c.short_description
     FROM careers c
     LEFT JOIN career_aliases ca ON ca.career_id = c.id
     -- Normalize stored aliases as well as input. Older seed data contains
     -- aliases such as "AI / Machine Learning Engineer", while normalize()
     -- deliberately converts slashes to spaces before lookup.
     WHERE c.is_active = TRUE
       AND (
         regexp_replace(
           regexp_replace(lower(btrim(c.title)), '[_/]+', ' ', 'g'),
           '[[:space:]]+', ' ', 'g'
         ) = $1
         OR
         regexp_replace(
           regexp_replace(lower(btrim(ca.alias)), '[_/]+', ' ', 'g'),
           '[[:space:]]+', ' ', 'g'
         ) = $1
       )
     ORDER BY CASE WHEN regexp_replace(
       regexp_replace(lower(btrim(c.title)), '[_/]+', ' ', 'g'),
       '[[:space:]]+', ' ', 'g'
     ) = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [norm]
  );
  return result.rows[0] || null;
}

/**
 * Back-compat convenience: resolves straight to the canonical career
 * title (string), or null. Existing callers that only need the title
 * (not the full row) can keep using this.
 */
export async function resolveCareerTitle(rawTitle) {
  const career = await resolveCareer(rawTitle);
  return career ? career.title : null;
}

export default { resolveCareer, resolveCareerTitle };
