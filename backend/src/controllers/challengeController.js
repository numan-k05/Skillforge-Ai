import { asyncHandler } from "../utils/asyncHandler.js";
import * as service from "../services/challengeService.js";

export const listChallengesController = asyncHandler(async (req,res)=>res.json(await service.listChallenges(req.validatedQuery)));
export const getChallengeController = asyncHandler(async (req,res)=>res.json(await service.getChallenge(req.user.id, req.params.id)));
export const recommendedChallengesController = asyncHandler(async (req,res)=>res.json(await service.getRecommendedChallenges(req.user.id, req.validatedQuery.limit)));
export const submitChallengeController = asyncHandler(async (req,res)=>res.json(await service.submitChallenge(req.user.id, req.params.id, req.validated.answer)));
