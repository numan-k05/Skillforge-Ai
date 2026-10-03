import { asyncHandler } from "../utils/asyncHandler.js";
import * as progressService from "../services/progressService.js";

export const getOverviewController = asyncHandler(async (req, res) => res.json(await progressService.getOverview(req.user.id)));
export const getHistoryController = asyncHandler(async (req, res) => res.json(await progressService.getHistory(req.user.id, req.query.limit)));
export const getRoadmapController = asyncHandler(async (req, res) => res.json(await progressService.getRoadmap(req.user.id)));
export const getProjectsController = asyncHandler(async (req, res) => res.json(await progressService.getProjects(req.user.id)));
export const getMissionsController = asyncHandler(async (req, res) => res.json(await progressService.getMissions(req.user.id)));
export const getChallengesController = asyncHandler(async (req, res) => res.json(await progressService.getChallenges(req.user.id)));
export const getSkillsController = asyncHandler(async (req, res) => res.json(await progressService.getSkills(req.user.id)));

export default { getOverviewController, getHistoryController, getRoadmapController, getProjectsController, getMissionsController, getChallengesController, getSkillsController };
