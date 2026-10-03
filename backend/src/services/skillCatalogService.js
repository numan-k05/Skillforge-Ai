import { ApiError } from "../middleware/errorHandler.js";
import { listSkills, getSkillById } from "../models/skillCatalogModel.js";
import { listSkillCategories } from "../models/skillCategoryModel.js";

function toPublicSkill(row) {
  return {
    skillId: row.id,
    name: row.name,
    description: row.description,
    category: row.skill_category_name || row.category,
    skillType: row.skill_type,
    difficulty: row.difficulty,
    isActive: row.is_active,
  };
}

export async function getSkillCatalog({ skillCategoryId } = {}) {
  const rows = await listSkills({ skillCategoryId });
  return rows.map(toPublicSkill);
}

export async function getSkillDetail(skillId) {
  const row = await getSkillById(skillId);
  if (!row) throw new ApiError(404, "Skill not found.");
  return toPublicSkill(row);
}

export async function getSkillCategories() {
  return listSkillCategories();
}

export default { getSkillCatalog, getSkillDetail, getSkillCategories };
