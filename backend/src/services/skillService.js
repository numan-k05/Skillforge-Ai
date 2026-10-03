import { listSkillsCatalog, getUserSkills, replaceUserSkills } from "../models/userSkillModel.js";

function toPublicSkill(row) {
  return {
    skillId: row.skill_id,
    name: row.name,
    category: row.category,
    level: row.proficiency_level,
  };
}

export async function getSkillsCatalog() {
  return listSkillsCatalog();
}

export async function getMySkills(userId) {
  const rows = await getUserSkills(userId);
  return rows.map(toPublicSkill);
}

export async function updateMySkills(userId, skills) {
  const cleaned = skills
    .map((s) => ({ name: s.name.trim(), level: s.level }))
    .filter((s) => s.name.length > 0);

  await replaceUserSkills(userId, cleaned);
  return getMySkills(userId);
}

export default { getSkillsCatalog, getMySkills, updateMySkills };
