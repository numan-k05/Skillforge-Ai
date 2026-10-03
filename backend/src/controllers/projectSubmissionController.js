import { asyncHandler } from "../utils/asyncHandler.js";import * as s from "../services/projectSubmissionService.js";
export const saveDraft=asyncHandler(async(req,res)=>res.status(201).json(await s.saveDraft(req.user.id,req.params.id,req.validated)));
export const submit=asyncHandler(async(req,res)=>res.json(await s.submit(req.user.id,req.params.id)));
export const mine=asyncHandler(async(req,res)=>res.json(await s.getMine(req.user.id)));
export const mineDetail=asyncHandler(async(req,res)=>res.json(await s.getMineDetail(req.user.id,req.params.id)));
export const queue=asyncHandler(async(req,res)=>res.json(await s.queue(req.validatedQuery)));
export const reviewerDetail=asyncHandler(async(req,res)=>res.json(await s.reviewerDetail(req.params.id)));
export const claim=asyncHandler(async(req,res)=>res.json(await s.claim(req.user.id,req.params.id)));
export const decide=asyncHandler(async(req,res)=>res.json(await s.decide(req.user.id,req.params.id,req.validated)));
