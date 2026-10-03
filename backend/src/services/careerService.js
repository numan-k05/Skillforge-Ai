import { ApiError } from "../middleware/errorHandler.js";
import { listCareers, getCareerById } from "../models/careerModel.js";
import { getCareerSkillsDetailed } from "../models/careerSkillModel.js";

function toPublicCareer(row) {
  return {
    careerId: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    isActive: row.is_active,
    category: { categoryId: row.category_id, name: row.category_name, slug: row.category_slug },
  };
}

function toPublicCareerSkill(row) {
  return {
    skillId: row.skill_id,
    name: row.skill_name,
    description: row.skill_description,
    category: row.skill_category_name || row.skill_category,
    kind: row.skill_kind,
    difficulty: row.difficulty,
    requirement: {
      skillType: row.skill_type, // required | recommended | optional
      minLevel: row.min_level,
      targetLevel: row.target_level,
      importance: row.importance,
      priority: row.priority,
    },
  };
}

export async function getCareers({ categoryId } = {}) {
  const rows = await listCareers({ categoryId });
  return rows.map(toPublicCareer);
}

export async function getCareerDetail(careerId) {
  const row = await getCareerById(careerId);
  if (!row) throw new ApiError(404, "Career not found.");
  return toPublicCareer(row);
}

export async function getSkillsForCareer(careerId) {
  const career = await getCareerById(careerId);
  if (!career) throw new ApiError(404, "Career not found.");

  const rows = await getCareerSkillsDetailed(careerId);
  const skills = rows.map(toPublicCareerSkill);

  return {
    career: toPublicCareer(career),
    required: skills.filter((s) => s.requirement.skillType === "required"),
    recommended: skills.filter((s) => s.requirement.skillType === "recommended"),
    optional: skills.filter((s) => s.requirement.skillType === "optional"),
  };
}

export default { getCareers, getCareerDetail, getSkillsForCareer };
