import * as progressModel from "../models/progressModel.js";

export async function getOverview(userId) {
  const [overall, roadmap, projects, missions, challenges, skills] = await Promise.all([
    progressModel.getOverallProgress(userId),
    progressModel.getRoadmapProgress(userId),
    progressModel.getProjectProgress(userId),
    progressModel.getMissionProgress(userId),
    progressModel.getChallengeProgress(userId),
    progressModel.getSkillProgress(userId),
  ]);
  return { generatedAt: new Date().toISOString(), overall, roadmap, projects, missions, challenges, skills };
}

export const getHistory = (userId, limit) => progressModel.getProgressHistory(userId, limit);
export const getRoadmap = (userId) => progressModel.getRoadmapProgress(userId);
export const getProjects = (userId) => progressModel.getProjectProgress(userId);
export const getMissions = (userId) => progressModel.getMissionProgress(userId);
export const getChallenges = (userId) => progressModel.getChallengeProgress(userId);
export const getSkills = (userId) => progressModel.getSkillProgress(userId);

export default { getOverview, getHistory, getRoadmap, getProjects, getMissions, getChallenges, getSkills };
