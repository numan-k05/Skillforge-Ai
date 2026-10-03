import { apiRequest } from "./apiClient.js";
export const getCourses = (filters = {}) => { const query=new URLSearchParams(Object.entries(filters).filter(([,v])=>v!==""&&v!=null)); return apiRequest(`/courses${query.size?`?${query}`:""}`,{auth:true}); };
export async function getCourse(id) {
  try {
    return await apiRequest(`/courses/${id}`, { auth: true });
  } catch (error) {
    // Course detail is public. If a stale tab token is rejected, the API client
    // clears it and this retry still lets the learner see the public preview.
    if (error?.status === 401) return apiRequest(`/courses/${id}`);
    throw error;
  }
}
export const getMyCourses = () => apiRequest("/courses/mine", { auth: true });
export const startCourse = (id) => apiRequest(`/courses/${id}/start`, { method: "POST", auth: true });
export const focusCourse = (id) => apiRequest(`/courses/${id}/focus`, { method: "POST", auth: true });
export const completeLesson = (id) => apiRequest(`/courses/lessons/${id}/complete`, { method: "POST", auth: true });
export const createCourse = (body) => apiRequest("/courses/admin", { method: "POST", body, auth: true });
export const updateCourse = (courseId, body) => apiRequest(`/courses/admin/${courseId}`, { method: "PATCH", body, auth: true });
export const addCourseModule = (courseId, body) => apiRequest(`/courses/admin/${courseId}/modules`, { method: "POST", body, auth: true });
export const addCourseLesson = (moduleId, body) => apiRequest(`/courses/admin/modules/${moduleId}/lessons`, { method: "POST", body, auth: true });
export const getAdminCourses = () => apiRequest("/courses/admin", { auth: true });
export const getAdminCourse = (courseId) => apiRequest(`/courses/admin/${courseId}`, { auth: true });
