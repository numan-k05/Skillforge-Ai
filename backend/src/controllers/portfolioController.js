import { asyncHandler } from "../utils/asyncHandler.js";
import * as portfolioService from "../services/portfolioService.js";

export const getMyPortfolioController = asyncHandler(async (req, res) => {
  res.status(200).json({ portfolio: await portfolioService.getMyPortfolio(req.user.id) });
});

export const updateMyPortfolioController = asyncHandler(async (req, res) => {
  res.status(200).json({ portfolio: await portfolioService.updateMyPortfolio(req.user.id, req.validated) });
});

export const replaceMyPortfolioContentController = asyncHandler(async (req, res) => {
  res.status(200).json({ portfolio: await portfolioService.replaceMyPortfolioContent(req.user.id, req.validated) });
});
export const updateMyEvidenceEntriesController=asyncHandler(async(req,res)=>res.status(200).json({portfolio:await portfolioService.updateMyEvidenceEntries(req.user.id,req.validated.entries)}));

export const getPublicPortfolioController = asyncHandler(async (req, res) => {
  res.status(200).json({ portfolio: await portfolioService.getPublicPortfolio(req.params.slug) });
});

export default { getMyPortfolioController, updateMyPortfolioController, updateMyEvidenceEntriesController, replaceMyPortfolioContentController, getPublicPortfolioController };
