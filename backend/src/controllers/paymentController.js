import{asyncHandler}from"../utils/asyncHandler.js";import*as s from"../services/paymentService.js";
export const initiate=asyncHandler(async(req,res)=>res.status(201).json(await s.initiate(req.user.id,req.params.id)));
export const webhook=asyncHandler(async(req,res)=>res.json(await s.webhook(req.rawBody,req.get("x-skillforge-timestamp"),req.get("x-skillforge-signature"))));
export const simulate=asyncHandler(async(req,res)=>res.json(await s.simulate(req.user.id,req.params.id,req.validated.type)));
export const receipt=asyncHandler(async(req,res)=>res.json(await s.receipt(req.user.id,req.params.id)));
