import { ApiError } from "../middleware/errorHandler.js";
import * as model from "../models/evidenceReadinessModel.js";

export const ALGORITHM_VERSION="evidence-v1";
export const METHODOLOGY={
  learning:{max:30,unit:10,cap:3,description:"Completed SkillForge courses"},
  projects:{max:30,unit:15,cap:2,description:"Approved, non-revoked project submissions"},
  assessments:{max:20,unit:5,cap:4,description:"Unique passed quizzes or completed challenges"},
  portfolio:{max:10,description:"Public profile (4), biography (2), selected project (2), external link (2)"},
  consistency:{max:10,unit:1,cap:10,windowDays:28,description:"Distinct active days during the last 28 days"},
};
const points=(count,unit,max)=>Math.min(count*unit,max);
export function bandFor(score){if(score>=80)return"Strong Candidate";if(score>=60)return"Job Ready";if(score>=40)return"Developing";return"Beginner";}
export function calculateReadiness(raw){
  const learning=points(new Set(raw.courses.map(x=>String(x.id))).size,10,30);
  const projects=points(new Set(raw.projects.map(x=>String(x.id))).size,15,30);
  const assessmentIds=new Set([...raw.quizzes.map(x=>`quiz:${x.id}`),...raw.challenges.map(x=>`challenge:${x.id}`)]);
  const assessments=points(assessmentIds.size,5,20);const p=raw.portfolio||{};
  const portfolio=(p.is_public?4:0)+(p.has_biography?2:0)+(p.has_project?2:0)+(p.has_link?2:0);
  const consistency=Math.min(new Set(raw.activeDays).size,10);const score=learning+projects+assessments+portfolio+consistency;
  const components={learning:{score:learning,max:30,count:new Set(raw.courses.map(x=>String(x.id))).size},projects:{score:projects,max:30,count:new Set(raw.projects.map(x=>String(x.id))).size},assessments:{score:assessments,max:20,count:assessmentIds.size},portfolio:{score:portfolio,max:10},consistency:{score:consistency,max:10,count:new Set(raw.activeDays).size}};
  const actions=[];if(learning<30)actions.push({action:"Complete a SkillForge course",points:Math.min(10,30-learning),path:"/courses"});if(projects<30)actions.push({action:"Submit a project and earn reviewer approval",points:Math.min(15,30-projects),path:"/projects"});if(assessments<20)actions.push({action:"Pass a quiz or complete a challenge",points:Math.min(5,20-assessments),path:"/assessments"});if(portfolio<10)actions.push({action:"Complete the next missing portfolio signal",points:Math.min(4,10-portfolio),path:"/portfolio"});if(consistency<10)actions.push({action:"Record activity on another day",points:1,path:"/dashboard"});
  return{algorithmVersion:ALGORITHM_VERSION,score,band:bandFor(score),components,evidence:raw,nextActions:actions,strengths:Object.entries(components).filter(([,v])=>v.score===v.max).map(([key])=>key),gaps:Object.entries(components).filter(([,v])=>v.score<v.max).map(([key])=>key)};
}
export async function overview(userId){const calculated=calculateReadiness(await model.getEvidence(userId));const recorded=await model.recordSnapshotIfChanged(userId,calculated);return{...calculated,snapshotId:recorded.snapshot.id,methodology:METHODOLOGY,historyRecorded:recorded.created,generatedAt:new Date().toISOString(),disclaimer:"This evidence score explains recorded progress. It does not guarantee employment or independently verify external work."};}
export const history=(userId,limit)=>model.history(userId,limit);
export async function revoke(submissionId,userId,reason){const result=await model.revokeSubmission(submissionId,userId,reason);if(!result)throw new ApiError(404,"Project submission not found.");if(result.invalidStatus)throw new ApiError(409,"Only approved project evidence can be revoked.");return result;}
export default{overview,history,revoke,calculateReadiness};
