import { apiRequest } from "./apiClient.js";
export async function getChallenges(filters={}) { const q=new URLSearchParams(); if(filters.difficulty) q.set("difficulty",filters.difficulty); if(filters.category) q.set("category",filters.category); if(filters.skillId) q.set("skillId",filters.skillId); const suffix=q.toString()?`?${q}`:""; return apiRequest(`/challenges${suffix}`,{auth:true}); }
export async function getRecommendedChallenges(limit=8){return apiRequest(`/challenges/recommended?limit=${limit}`,{auth:true});}
export async function getChallenge(id){return apiRequest(`/challenges/${id}`,{auth:true});}
export async function submitChallenge(id,answer){return apiRequest(`/challenges/${id}/submit`,{method:"POST",auth:true,body:{answer}});}
export default {getChallenges,getRecommendedChallenges,getChallenge,submitChallenge};
