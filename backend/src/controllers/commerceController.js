import{asyncHandler}from"../utils/asyncHandler.js";import*as s from"../services/commerceService.js";
export const catalog=asyncHandler(async(req,res)=>res.json(await s.catalog(req.validatedQuery.currency,req.user?.id||null)));
export const quote=asyncHandler(async(req,res)=>res.json(await s.quote(req.validated)));
export const createOrder=asyncHandler(async(req,res)=>res.status(201).json(await s.createOrder(req.user.id,req.validated)));
export const account=asyncHandler(async(req,res)=>res.json(await s.account(req.user.id)));
export const adminProducts=asyncHandler(async(req,res)=>res.json(await s.adminProducts()));
export const createProduct=asyncHandler(async(req,res)=>res.status(201).json(await s.createProduct(req.user.id,req.validated)));
export const updateProduct=asyncHandler(async(req,res)=>res.json(await s.updateProduct(req.user.id,req.params.id,req.validated)));
