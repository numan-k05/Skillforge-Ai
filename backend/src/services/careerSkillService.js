import { ApiError } from "../middleware/errorHandler.js";
import { listSupportedCareers, getRequirementsForCareer } from "../models/careerSkillModel.js";
import { resolveCareerTitle } from "../utils/careerMatcher.js";

function toPublicRequirement(row) {
  return {
    skillId: row.skill_id,
    skillName: row.skill_name,
    category: row.skill_category,
    requiredLevel: row.required_level,
    importance: row.importance,
  };
}

/**
 * Returns the full career -> required-skills map, or just one career's
 * requirements if `careerQuery` is given (resolved via careerMatcher).
 */
export async function getCareerSkillMap(careerQuery) {
  if (careerQuery) {
    const resolved = await resolveCareerTitle(careerQuery);
    if (!resolved) {
      const supportedCareers = await listSupportedCareers();
      throw new ApiError(404, `"${careerQuery}" isn't in the supported career list yet.`, {
        code: "CAREER_NOT_SUPPORTED",
        supportedCareers,
      });
    }

    const requirements = await getRequirementsForCareer(resolved);
    return { careers: [{ career: resolved, requirements: requirements.map(toPublicRequirement) }] };
  }

  const supportedCareers = await listSupportedCareers();
  const careers = await Promise.all(
    supportedCareers.map(async (title) => ({
      career: title,
      requirements: (await getRequirementsForCareer(title)).map(toPublicRequirement),
    }))
  );
  return { careers };
}

export default { getCareerSkillMap };
