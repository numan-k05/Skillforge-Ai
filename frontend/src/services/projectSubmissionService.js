import{apiRequest}from"./apiClient.js";
export const getMySubmissions=()=>apiRequest("/project-submissions/mine",{auth:true}).then(data=>data.submissions||[]);
export const getMySubmission=id=>apiRequest(`/project-submissions/mine/${id}`,{auth:true}).then(data=>data.submission);
export const saveEvidenceDraft=(projectId,body)=>apiRequest(`/project-submissions/projects/${projectId}/draft`,{method:"POST",body,auth:true});
export const submitEvidence=id=>apiRequest(`/project-submissions/${id}/submit`,{method:"POST",auth:true});
export const getReviewQueue=(status="")=>apiRequest(`/project-submissions/review/queue${status?`?status=${status}`:""}`,{auth:true});
export const getReviewSubmission=id=>apiRequest(`/project-submissions/review/${id}`,{auth:true});
export const claimSubmission=id=>apiRequest(`/project-submissions/review/${id}/claim`,{method:"POST",auth:true});
export const decideSubmission=(id,body)=>apiRequest(`/project-submissions/review/${id}/decision`,{method:"POST",body,auth:true});
