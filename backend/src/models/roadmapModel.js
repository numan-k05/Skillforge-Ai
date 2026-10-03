import { pool } from "../config/db.js";

const ROADMAP_COLUMNS = `
  id, user_id, career_id, career_title, title, description, status,
  target_weeks, weekly_hours, version, generated_at, created_at, updated_at
`;

/**
 * Persist a freshly-generated roadmap (roadmap + phases + items) as one
 * transaction: archive any existing active roadmap for this user, then
 * insert the new roadmap tree. If the insert fails partway through,
 * nothing is committed — the previous active roadmap (if any) is left
 * untouched.
 *
 * `roadmap` = { careerId, careerTitle, title, description, targetWeeks, weeklyHours }
 * `phases`  = [{ title, description, estimatedWeeks, items: [
 *                { skillId, itemType, title, description, priority, estimatedHours, resourceNote }
 *              ] }]
 *
 * Returns the new roadmap's id.
 */
export async function saveGeneratedRoadmap(userId, roadmap, phases) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Only one 'active' roadmap per user at a time (see Phase 6A note in
    // roadmapService.js for why we archive-and-replace instead of
    // mutating the previous version in place).
    await client.query(
      `UPDATE roadmaps SET status = 'archived' WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    const versionResult = await client.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM roadmaps WHERE user_id = $1`,
      [userId]
    );
    const nextVersion = versionResult.rows[0].next_version;

    const roadmapResult = await client.query(
      `INSERT INTO roadmaps
         (user_id, career_id, career_title, title, description, status,
          target_weeks, weekly_hours, version)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8)
       RETURNING ${ROADMAP_COLUMNS}`,
      [
        userId,
        roadmap.careerId ?? null,
        roadmap.careerTitle,
        roadmap.title,
        roadmap.description ?? null,
        roadmap.targetWeeks ?? null,
        roadmap.weeklyHours ?? null,
        nextVersion,
      ]
    );
    const roadmapRow = roadmapResult.rows[0];

    let phaseOrder = 0;
    for (const phase of phases) {
      phaseOrder += 1;
      const phaseResult = await client.query(
        `INSERT INTO roadmap_phases (roadmap_id, phase_order, title, description, estimated_weeks)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [roadmapRow.id, phaseOrder, phase.title, phase.description ?? null, phase.estimatedWeeks ?? null]
      );
      const phaseId = phaseResult.rows[0].id;

      let itemOrder = 0;
      for (const item of phase.items) {
        itemOrder += 1;
        await client.query(
          `INSERT INTO roadmap_items
             (phase_id, skill_id, item_order, item_type, title, description,
              priority, estimated_hours, resource_note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            phaseId,
            item.skillId ?? null,
            itemOrder,
            item.itemType,
            item.title,
            item.description ?? null,
            item.priority ?? "medium",
            item.estimatedHours ?? null,
            item.resourceNote ?? null,
          ]
        );
      }
    }

    await client.query("COMMIT");
    return roadmapRow.id;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** The authenticated user's current active roadmap (summary row only), or null. */
export async function getActiveRoadmapForUser(userId) {
  const result = await pool.query(
    `SELECT ${ROADMAP_COLUMNS}
     FROM roadmaps
     WHERE user_id = $1 AND status = 'active'
     ORDER BY generated_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

/** A roadmap summary row by id, scoped to its owner. Returns null if missing or not owned. */
export async function getRoadmapSummary(roadmapId, userId) {
  const result = await pool.query(
    `SELECT ${ROADMAP_COLUMNS} FROM roadmaps WHERE id = $1 AND user_id = $2`,
    [roadmapId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Full roadmap tree (roadmap + ordered phases + ordered items, each item
 * joined to its skill's name/category when it has one), scoped to the
 * owning user. Returns null if the roadmap doesn't exist or isn't the
 * caller's — callers must never be able to distinguish those two cases.
 */
export async function getRoadmapWithDetails(roadmapId, userId) {
  const roadmap = await getRoadmapSummary(roadmapId, userId);
  if (!roadmap) return null;

  const phasesResult = await pool.query(
    `SELECT id, phase_order, title, description, estimated_weeks, created_at, updated_at
     FROM roadmap_phases
     WHERE roadmap_id = $1
     ORDER BY phase_order`,
    [roadmapId]
  );

  const phaseIds = phasesResult.rows.map((row) => row.id);
  let itemsByPhase = new Map();
  if (phaseIds.length > 0) {
    const itemsResult = await pool.query(
      `SELECT
          ri.id, ri.phase_id, ri.item_order, ri.item_type, ri.title, ri.description,
          ri.priority, ri.estimated_hours, ri.status, ri.resource_note,
          ri.created_at, ri.updated_at,
          s.id AS skill_id, s.name AS skill_name, s.category AS skill_category
       FROM roadmap_items ri
       LEFT JOIN skills s ON s.id = ri.skill_id
       WHERE ri.phase_id = ANY($1::bigint[])
       ORDER BY ri.phase_id, ri.item_order`,
      [phaseIds]
    );
    itemsByPhase = itemsResult.rows.reduce((map, row) => {
      const list = map.get(row.phase_id) || [];
      list.push(row);
      map.set(row.phase_id, list);
      return map;
    }, new Map());
  }

  const phases = phasesResult.rows.map((phase) => ({
    ...phase,
    items: itemsByPhase.get(phase.id) || [],
  }));

  return { roadmap, phases };
}

/** Every roadmap (any status) belonging to a user, newest first — for a future history view. */
export async function listRoadmapsForUser(userId) {
  const result = await pool.query(
    `SELECT ${ROADMAP_COLUMNS} FROM roadmaps WHERE user_id = $1 ORDER BY generated_at DESC`,
    [userId]
  );
  return result.rows;
}

/** Update a roadmap's status, scoped to its owner. Returns the updated row, or null if not found/owned. */
export async function updateRoadmapStatus(roadmapId, userId, status) {
  const result = await pool.query(
    `UPDATE roadmaps SET status = $3
     WHERE id = $1 AND user_id = $2
     RETURNING ${ROADMAP_COLUMNS}`,
    [roadmapId, userId, status]
  );
  return result.rows[0] || null;
}

/** Delete a roadmap (cascades to its phases/items), scoped to its owner. Returns true if a row was deleted. */
export async function deleteRoadmap(roadmapId, userId) {
  const result = await pool.query(`DELETE FROM roadmaps WHERE id = $1 AND user_id = $2 RETURNING id`, [
    roadmapId,
    userId,
  ]);
  return result.rowCount > 0;
}

export default {
  saveGeneratedRoadmap,
  getActiveRoadmapForUser,
  getRoadmapSummary,
  getRoadmapWithDetails,
  listRoadmapsForUser,
  updateRoadmapStatus,
  deleteRoadmap,
};
