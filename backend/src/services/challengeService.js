import { ApiError } from "../middleware/errorHandler.js";
import * as model from "../models/challengeModel.js";
import { getProfileByUserId } from "../models/profileModel.js";
import { getRequirementsForCareer } from "../models/careerSkillModel.js";
import { getUserSkills } from "../models/userSkillModel.js";
import { resolveCareerTitle } from "../utils/careerMatcher.js";

function normalize(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").replace(/;\s*$/, "").toLowerCase();
}
function mapChallenge(row, skills = [], progress = null, includeHints = true) {
  return { challengeId: row.id, title: row.title, slug: row.slug, description: row.description, instructions: row.instructions, difficulty: row.difficulty, category: row.category, language: row.language, starterCode: row.starter_code, examples: row.examples, hints: includeHints ? row.hints : [], estimatedMinutes: row.estimated_minutes, skills: skills.map(s => ({ skillId:s.skill_id, name:s.name, category:s.category, importance:s.importance })), progress: progress ? { status:progress.status, attemptsCount:progress.attempts_count, completedAt:progress.completed_at } : { status:"not_started", attemptsCount:0, completedAt:null } };
}

export async function listChallenges(filters = {}) {
  const rows = await model.listChallenges(filters);
  const withSkills = await Promise.all(rows.map(async row => mapChallenge(row, await model.getChallengeSkills(row.id))));
  return withSkills;
}

export async function getChallenge(userId, id) {
  const challengeId = Number(id);
  if (!Number.isInteger(challengeId) || challengeId <= 0) throw new ApiError(400, "Challenge id must be a positive integer.");
  const row = await model.getChallengeById(challengeId);
  if (!row) throw new ApiError(404, "Challenge not found.");
  return mapChallenge(row, await model.getChallengeSkills(challengeId), await model.getUserProgress(userId, challengeId));
}

export async function getRecommendedChallenges(userId, limit = 8) {
  const profile = await getProfileByUserId(userId);
  const rows = await model.listChallenges({});
  if (!profile?.career_goal_title) return { challenges: rows.slice(0, limit).map(r => mapChallenge(r)), engine:"catalog" };
  const career = await resolveCareerTitle(profile.career_goal_title);
  if (!career) return { challenges: rows.slice(0, limit).map(r => mapChallenge(r)), engine:"catalog" };
  const [requirements, userSkills, progress] = await Promise.all([getRequirementsForCareer(career), getUserSkills(userId), model.listUserProgress(userId)]);
  const levels = new Map(userSkills.map(s => [s.skill_id, s.proficiency_level]));
  const done = new Set(progress.filter(p => p.status === "completed").map(p => p.challenge_id));
  const gapSkills = new Map(requirements.map(r => [r.skill_id, Math.max(0, r.required_level - (levels.get(r.skill_id) ?? 0))]));
  const scored = await Promise.all(rows.map(async row => {
    const skills = await model.getChallengeSkills(row.id);
    const score = skills.reduce((sum,s) => sum + (gapSkills.get(s.skill_id) || 0) * s.importance, 0) + (done.has(row.id) ? -20 : 0);
    return { row, skills, score };
  }));
  scored.sort((a,b)=>b.score-a.score || a.row.title.localeCompare(b.row.title));
  return { challenges: scored.slice(0, Math.max(1, Math.min(20, Number(limit)||8))).map(x => ({ ...mapChallenge(x.row, x.skills, progress.find(p=>p.challenge_id===x.row.id)), recommendationScore:x.score })), engine:"personalized" };
}

export async function submitChallenge(userId, id, answer) {
  const challengeId = Number(id);
  if (!Number.isInteger(challengeId) || challengeId <= 0) throw new ApiError(400, "Challenge id must be a positive integer.");
  if (typeof answer !== "string" || !answer.trim()) throw new ApiError(400, "Submit an answer before checking it.");
  const row = await model.getChallengeById(challengeId);
  if (!row) throw new ApiError(404, "Challenge not found.");
  const isCorrect = row.validation_type === "exact" ? answer.trim() === row.expected_answer.trim() : normalize(answer) === normalize(row.expected_answer);
  const progress = await model.recordAttempt(userId, challengeId, answer.trim(), isCorrect);
  return { correct:isCorrect, feedback:isCorrect ? "Correct — challenge completed." : "Not quite. Review the prompt and try again.", progress:{ status:progress.status, attemptsCount:progress.attempts_count, completedAt:progress.completed_at } };
}
