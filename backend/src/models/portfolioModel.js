import { pool } from "../config/db.js";

const PORTFOLIO_COLUMNS = `
  id, user_id, slug, is_public, biography, education, show_career_goal, template_key, publish_consent_at,
  created_at, updated_at
`;

export async function getPortfolioByUserId(userId) {
  const result = await pool.query(
    `SELECT ${PORTFOLIO_COLUMNS} FROM portfolio_profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function getPublicPortfolioBySlug(slug) {
  const result = await pool.query(
    `SELECT pp.id, pp.user_id, pp.slug, pp.biography, pp.education, pp.show_career_goal,
            pp.template_key, u.name, cg.title AS career_goal
     FROM portfolio_profiles pp
     JOIN users u ON u.id = pp.user_id
     LEFT JOIN profiles p ON p.user_id = pp.user_id
     LEFT JOIN career_goals cg ON cg.id = p.career_goal_id
     WHERE LOWER(pp.slug) = LOWER($1) AND pp.is_public = TRUE`,
    [slug]
  );
  return result.rows[0] || null;
}

export async function createPortfolioForUser(userId, slug) {
  const result = await pool.query(
    `INSERT INTO portfolio_profiles (user_id, slug)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING ${PORTFOLIO_COLUMNS}`,
    [userId, slug]
  );
  return result.rows[0] || getPortfolioByUserId(userId);
}

export async function updatePortfolio(userId, fields) {
  const result = await pool.query(
    `UPDATE portfolio_profiles
     SET slug = CASE WHEN $2::boolean THEN $3 ELSE slug END,
         is_public = CASE WHEN $4::boolean THEN $5 ELSE is_public END,
         biography = CASE WHEN $6::boolean THEN $7 ELSE biography END,
         education = CASE WHEN $8::boolean THEN $9 ELSE education END,
         show_career_goal = CASE WHEN $10::boolean THEN $11 ELSE show_career_goal END
        ,template_key = CASE WHEN $12::boolean THEN $13 ELSE template_key END
        ,publish_consent_at = CASE WHEN $14::boolean THEN COALESCE(publish_consent_at,now()) ELSE publish_consent_at END
     WHERE user_id = $1
     RETURNING ${PORTFOLIO_COLUMNS}`,
    [userId, fields.slug !== undefined, fields.slug ?? null, fields.isPublic !== undefined,
      fields.isPublic ?? null, fields.biography !== undefined, fields.biography ?? null,
      fields.education !== undefined, fields.education ?? null,
      fields.showCareerGoal !== undefined, fields.showCareerGoal ?? null,
      fields.template !== undefined, fields.template ?? null, fields.publishConsent === true]
  );
  return result.rows[0] || null;
}

export async function getPortfolioContent(portfolioId) {
  const [projects, skills, links, achievements, evidenceEntries] = await Promise.all([
    pool.query(`SELECT pp.project_id, pp.display_order, p.title, p.slug, p.short_description,
                       p.description, p.difficulty, p.project_type
                FROM portfolio_projects pp JOIN projects p ON p.id = pp.project_id
                WHERE pp.portfolio_id = $1 ORDER BY pp.display_order`, [portfolioId]),
    pool.query(`SELECT ps.skill_id, ps.display_order, s.name, s.category, us.proficiency_level
                FROM portfolio_skills ps JOIN skills s ON s.id = ps.skill_id
                JOIN portfolio_profiles pp ON pp.id = ps.portfolio_id
                JOIN user_skills us ON us.user_id = pp.user_id AND us.skill_id = ps.skill_id
                WHERE ps.portfolio_id = $1 ORDER BY ps.display_order`, [portfolioId]),
    pool.query(`SELECT id, label, url, display_order FROM portfolio_links
                WHERE portfolio_id = $1 ORDER BY display_order`, [portfolioId]),
    pool.query(`SELECT id, title, description, achieved_on, display_order FROM portfolio_achievements
                WHERE portfolio_id = $1 ORDER BY display_order`, [portfolioId]),
    pool.query(`SELECT e.id,e.submission_id,e.submission_version_id,e.is_visible,e.show_evidence_links,e.display_order,e.headline,e.description,p.title,p.slug,p.short_description,p.difficulty,p.project_type,psv.summary,psv.repository_url,psv.demo_url,psv.evidence_url,psr.created_at AS approved_at,(rv.id IS NOT NULL) AS revoked FROM portfolio_evidence_entries e JOIN project_submissions ps ON ps.id=e.submission_id JOIN project_submission_versions psv ON psv.id=e.submission_version_id JOIN projects p ON p.id=ps.project_id JOIN project_submission_reviews psr ON psr.submission_version_id=e.submission_version_id AND psr.decision='approved' LEFT JOIN project_submission_revocations rv ON rv.submission_id=ps.id WHERE e.portfolio_id=$1 ORDER BY e.display_order,e.id`,[portfolioId]),
  ]);
  return { projects: projects.rows, skills: skills.rows, links: links.rows, achievements: achievements.rows, evidenceEntries:evidenceEntries.rows };
}

export async function updateEvidenceEntries(userId,entries){const client=await pool.connect();try{await client.query("BEGIN");const portfolio=await client.query(`SELECT id FROM portfolio_profiles WHERE user_id=$1 FOR UPDATE`,[userId]);if(!portfolio.rows[0]){await client.query("ROLLBACK");return null;}for(const entry of entries){const updated=await client.query(`UPDATE portfolio_evidence_entries SET is_visible=$3,show_evidence_links=$4,display_order=$5,headline=$6,description=$7 WHERE id=$2 AND portfolio_id=$1 RETURNING id`,[portfolio.rows[0].id,entry.entryId,entry.isVisible,entry.showEvidenceLinks,entry.displayOrder,entry.headline??null,entry.description??null]);if(!updated.rows[0]){await client.query("ROLLBACK");return{notOwned:entry.entryId};}}await client.query("COMMIT");return{updated:entries.length};}catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}}

export async function getEligibleProjectIds(userId, projectIds) {
  if (!projectIds.length) return [];
  const result = await pool.query(
    `SELECT project_id FROM user_projects
     WHERE user_id = $1 AND status = 'completed' AND project_id = ANY($2::bigint[])`,
    [userId, projectIds]
  );
  return result.rows.map((row) => Number(row.project_id));
}

export async function getEligibleSkillIds(userId, skillIds) {
  if (!skillIds.length) return [];
  const result = await pool.query(
    `SELECT skill_id FROM user_skills
     WHERE user_id = $1 AND skill_id = ANY($2::bigint[])`,
    [userId, skillIds]
  );
  return result.rows.map((row) => Number(row.skill_id));
}

async function replaceRows(client, portfolioId, table, columns, rows) {
  await client.query(`DELETE FROM ${table} WHERE portfolio_id = $1`, [portfolioId]);
  for (const row of rows) {
    const placeholders = columns.map((_, index) => `$${index + 2}`).join(", ");
    await client.query(
      `INSERT INTO ${table} (portfolio_id, ${columns.join(", ")}) VALUES ($1, ${placeholders})`,
      [portfolioId, ...row]
    );
  }
}

export async function replacePortfolioContent(userId, { projectIds, skillIds, links, achievements }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const portfolioResult = await client.query(
      `SELECT id FROM portfolio_profiles WHERE user_id = $1 FOR UPDATE`, [userId]
    );
    const portfolio = portfolioResult.rows[0];
    if (!portfolio) return null;
    const portfolioId = portfolio.id;

    if (projectIds !== undefined) {
      await replaceRows(client, portfolioId, "portfolio_projects", ["project_id", "display_order"],
        projectIds.map((id, index) => [id, index + 1]));
    }
    if (skillIds !== undefined) {
      await replaceRows(client, portfolioId, "portfolio_skills", ["skill_id", "display_order"],
        skillIds.map((id, index) => [id, index + 1]));
    }
    if (links !== undefined) {
      await replaceRows(client, portfolioId, "portfolio_links", ["label", "url", "display_order"],
        links.map((link, index) => [link.label, link.url, index + 1]));
    }
    if (achievements !== undefined) {
      await replaceRows(client, portfolioId, "portfolio_achievements", ["title", "description", "achieved_on", "display_order"],
        achievements.map((achievement, index) => [achievement.title, achievement.description ?? null, achievement.achievedOn ?? null, index + 1]));
    }
    await client.query("COMMIT");
    return portfolioId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default { getPortfolioByUserId, getPublicPortfolioBySlug, createPortfolioForUser, updatePortfolio, getPortfolioContent, updateEvidenceEntries, getEligibleProjectIds, getEligibleSkillIds, replacePortfolioContent };
