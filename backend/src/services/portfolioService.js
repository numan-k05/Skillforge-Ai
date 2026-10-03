import { ApiError } from "../middleware/errorHandler.js";
import { findUserById } from "../models/userModel.js";
import { getProfileByUserId } from "../models/profileModel.js";
import * as portfolioModel from "../models/portfolioModel.js";
import { getPreferences, recordConsent } from "../models/accountModel.js";

function defaultSlug(name, userId) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 68);
  return `${base || "student"}-${userId}`;
}

function toManagedPortfolio(portfolio, content, profile) {
  return {
    slug: portfolio.slug,
    isPublic: portfolio.is_public,
    biography: portfolio.biography,
    education: portfolio.education,
    showCareerGoal: portfolio.show_career_goal,
    template: portfolio.template_key,
    publishConsentAt: portfolio.publish_consent_at,
    careerGoal: profile?.career_goal_title ?? null,
    projects: content.projects.map((project) => ({
      projectId: project.project_id, title: project.title, slug: project.slug,
      shortDescription: project.short_description, description: project.description,
      difficulty: project.difficulty, projectType: project.project_type,
    })),
    skills: content.skills.map((skill) => ({
      skillId: skill.skill_id, name: skill.name, category: skill.category,
      proficiencyLevel: skill.proficiency_level,
    })),
    links: content.links.map((link) => ({ linkId: link.id, label: link.label, url: link.url })),
    achievements: content.achievements.map((achievement) => ({
      achievementId: achievement.id, title: achievement.title, description: achievement.description,
      achievedOn: achievement.achieved_on,
    })),
    evidenceEntries: content.evidenceEntries.map((entry)=>({entryId:entry.id,submissionId:entry.submission_id,isVisible:entry.is_visible,showEvidenceLinks:entry.show_evidence_links,displayOrder:entry.display_order,headline:entry.headline,description:entry.description,title:entry.title,slug:entry.slug,shortDescription:entry.short_description,difficulty:entry.difficulty,projectType:entry.project_type,reviewedSummary:entry.summary,repositoryUrl:entry.repository_url,demoUrl:entry.demo_url,evidenceUrl:entry.evidence_url,approvedAt:entry.approved_at,revoked:entry.revoked})),
    createdAt: portfolio.created_at,
    updatedAt: portfolio.updated_at,
  };
}

async function getOrCreatePortfolio(userId) {
  let portfolio = await portfolioModel.getPortfolioByUserId(userId);
  if (portfolio) return portfolio;
  const user = await findUserById(userId);
  if (!user) throw new ApiError(404, "User not found.");
  return portfolioModel.createPortfolioForUser(userId, defaultSlug(user.name, userId));
}

export async function getMyPortfolio(userId) {
  const portfolio = await getOrCreatePortfolio(userId);
  const [content, profile] = await Promise.all([
    portfolioModel.getPortfolioContent(portfolio.id), getProfileByUserId(userId),
  ]);
  return toManagedPortfolio(portfolio, content, profile);
}

export async function updateMyPortfolio(userId, changes) {
  const current=await getOrCreatePortfolio(userId);
  validatePublishingTransition(current.is_public,changes);
  if(changes.isPublic===true&&!current.is_public){
    const preferences=await getPreferences(userId);
    if(!preferences.public_profile_visible)throw new ApiError(400,"Allow a public portfolio in Account settings before publishing.");
  }
  const portfolio = await portfolioModel.updatePortfolio(userId, changes);
  if (!portfolio) throw new ApiError(404, "Portfolio not found.");
  if(changes.isPublic===true&&!current.is_public)await recordConsent(userId,{type:"privacy",documentVersion:"public-profile-v1",granted:true});
  return getMyPortfolio(userId);
}
export function validatePublishingTransition(isCurrentlyPublic,changes){if(changes.isPublic===true&&!isCurrentlyPublic&&changes.publishConsent!==true)throw new ApiError(400,"Confirm that you want to publish this portfolio.");}

export async function updateMyEvidenceEntries(userId,entries){await getOrCreatePortfolio(userId);const result=await portfolioModel.updateEvidenceEntries(userId,entries);if(result?.notOwned)throw new ApiError(404,"Portfolio evidence entry not found.");if(!result)throw new ApiError(404,"Portfolio not found.");return getMyPortfolio(userId);}

function ensureOwnedSelections(selected, eligible, label) {
  const eligibleSet = new Set(eligible);
  if (selected.some((id) => !eligibleSet.has(id))) {
    throw new ApiError(400, `${label} must belong to you${label === "Selected projects" ? " and be completed" : ""}.`);
  }
}

export async function replaceMyPortfolioContent(userId, changes) {
  await getOrCreatePortfolio(userId);
  if (changes.projectIds !== undefined) {
    ensureOwnedSelections(changes.projectIds,
      await portfolioModel.getEligibleProjectIds(userId, changes.projectIds), "Selected projects");
  }
  if (changes.skillIds !== undefined) {
    ensureOwnedSelections(changes.skillIds,
      await portfolioModel.getEligibleSkillIds(userId, changes.skillIds), "Selected skills");
  }
  await portfolioModel.replacePortfolioContent(userId, changes);
  return getMyPortfolio(userId);
}

export async function getPublicPortfolio(slug) {
  const portfolio = await portfolioModel.getPublicPortfolioBySlug(slug);
  if (!portfolio) throw new ApiError(404, "Portfolio unavailable.");
  const content = await portfolioModel.getPortfolioContent(portfolio.id);
  // Deliberately map only approved public fields. Never return user IDs,
  // profile IDs, emails, JWT claims, or raw progress records from here.
  return toPublicPortfolio(portfolio,content);
}
export function toPublicPortfolio(portfolio,content){return {
    slug: portfolio.slug,
    name: portfolio.name,
    biography: portfolio.biography,
    education: portfolio.education,
    careerGoal: portfolio.show_career_goal ? portfolio.career_goal : null,
    template: portfolio.template_key,
    projects: content.projects.map((project) => ({
      title: project.title, slug: project.slug, shortDescription: project.short_description,
      description: project.description, difficulty: project.difficulty, projectType: project.project_type,
    })),
    skills: content.skills.map((skill) => ({
      name: skill.name, category: skill.category, proficiencyLevel: skill.proficiency_level,
    })),
    links: content.links.map((link) => ({ label: link.label, url: link.url })),
    achievements: content.achievements.map((achievement) => ({
      title: achievement.title, description: achievement.description, achievedOn: achievement.achieved_on,
    })),
    evidenceProjects: content.evidenceEntries.filter((entry)=>entry.is_visible&&!entry.revoked).map((entry)=>({title:entry.headline||entry.title,slug:entry.slug,description:entry.description||entry.summary,difficulty:entry.difficulty,projectType:entry.project_type,approvedAt:entry.approved_at,...(entry.show_evidence_links?{repositoryUrl:entry.repository_url,demoUrl:entry.demo_url,evidenceUrl:entry.evidence_url}:{})})),
  };}

export default { getMyPortfolio, updateMyPortfolio, updateMyEvidenceEntries, replaceMyPortfolioContent, getPublicPortfolio };
