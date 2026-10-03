import { asyncHandler } from "../utils/asyncHandler.js";import * as service from "../services/evidenceReadinessService.js";
export const overview=asyncHandler(async(req,res)=>res.json(await service.overview(req.user.id)));
export const history=asyncHandler(async(req,res)=>res.json(await service.history(req.user.id,req.query.limit)));
export const revoke=asyncHandler(async(req,res)=>res.json({revocation:await service.revoke(req.params.id,req.user.id,req.validated.reason)}));
