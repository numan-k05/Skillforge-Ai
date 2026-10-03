import{asyncHandler}from"../utils/asyncHandler.js";import*as service from"../services/careerMatchService.js";
export const list=asyncHandler(async(req,res)=>res.json(await service.listMatches(req.user.id,req.validated)));
