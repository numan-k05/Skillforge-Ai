import { withContentAccess } from "./contentAccessService.js";
import { ApiError } from "../middleware/errorHandler.js";
import * as courseModel from "../models/courseModel.js";
import { accessProducts,hasEntityAccess,requireEntityAccess,requireLessonAccess } from "./commerceService.js";

function courseSummary(row) {
  return { id: row.id, skillId: row.skill_id, skillName: row.skill_name, title: row.title, slug: row.slug,
    description: row.description, difficulty: row.difficulty, estimatedHours: row.estimated_hours,
    isPremium: row.is_premium, moduleCount: row.module_count, lessonCount: row.lesson_count };
}

export async function listCourses(filters,userId=null) {
  const rows = await courseModel.listPublishedCourses(filters);
  const total = rows[0]?.total || 0;
  return { courses: await withContentAccess(rows.map(courseSummary),userId,"course"), pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}
export async function listAdminCourses(filters){const rows=await courseModel.listAdminCourses(filters);const total=rows[0]?.total||0;return{courses:rows.map(row=>({...courseSummary(row),status:row.status})),pagination:{page:filters.page,limit:filters.limit,total,totalPages:Math.ceil(total/filters.limit)}};}

export async function getCourseDetail(courseId, userId = null, includeUnpublished = false) {
  const course = await courseModel.getCourse(courseId, { userId, includeUnpublished });
  if (!course) throw new ApiError(404, "Course not found.");
  const [modules, prerequisites] = await Promise.all([courseModel.getCourseStructure(courseId, userId), courseModel.listPrerequisites(courseId)]);
  const hasPremiumAccess = !course.is_premium || Boolean(userId && await hasEntityAccess(userId,"course",courseId));
  const canReadAll = Boolean(includeUnpublished || (course.enrolled && hasPremiumAccess));
  return { course: { ...courseSummary(course), status: course.status, enrolled: Boolean(course.enrolled), hasAccess: hasPremiumAccess, requiredProducts:await accessProducts("course",courseId),
    prerequisites: prerequisites.map((item) => ({ id: item.id, title: item.title, slug: item.slug })),
    modules: modules.map((module) => ({ id: module.id, title: module.title, description: module.description, position: module.position,
      lessons: module.lessons.map((lesson) => canReadAll || lesson.isPreview ? lesson : { ...lesson, content: null, sourceUrl: null, locked: true }) })) } };
}

export async function startCourse(userId, courseId) {
  const course = await courseModel.getCourse(courseId);
  if (!course) throw new ApiError(404, "Course not found.");
  if (course.is_premium) await requireEntityAccess(userId,"course",courseId);
  const missing = await courseModel.incompletePrerequisites(userId, courseId);
  if (missing.length) throw new ApiError(409, "Complete the required courses before starting this course.", missing.map((item) => ({ field: "prerequisite", message: item.title })));
  const enrollment = await courseModel.enroll(userId, courseId);
  return { enrollment: { courseId: enrollment.course_id, status: enrollment.status, startedAt: enrollment.started_at } };
}

export async function focusCourse(userId,courseId){
  const course=await courseModel.getCourse(courseId);
  if(!course)throw new ApiError(404,"Course not found.");
  if(course.is_premium)await requireEntityAccess(userId,"course",courseId);
  const enrollment=await courseModel.focusEnrollment(userId,courseId);
  if(!enrollment)throw new ApiError(409,"Start this course before selecting it as your dashboard focus.");
  return{focus:{courseId:enrollment.course_id,status:enrollment.status,selectedAt:enrollment.updated_at}};
}

export async function completeLesson(userId, lessonId) {
  await requireLessonAccess(userId,lessonId);
  const result = await courseModel.completeLesson(userId, lessonId);
  if (!result) throw new ApiError(404, "Lesson not found in one of your enrolled courses.");
  return { progress: { courseId: result.courseId, completedLessons: result.completed, totalLessons: result.total, percentage: result.total ? Math.round(result.completed / result.total * 100) : 0, status: result.status } };
}

export async function getMyCourses(userId) {
  const rows = await courseModel.listUserCourses(userId);
  return { courses: await withContentAccess(rows.map((row) => ({ id: row.id, title: row.title, slug: row.slug, skillName: row.skill_name, difficulty: row.difficulty,
    estimatedHours: row.estimated_hours, status: row.status, startedAt: row.started_at, completedAt: row.completed_at,
    completedLessons: row.completed_lessons, lessonCount: row.lesson_count, percentage: row.lesson_count ? Math.round(row.completed_lessons / row.lesson_count * 100) : 0 })),userId,"course") };
}

async function ensureExists(courseId) { const course=await courseModel.getCourse(courseId,{includeUnpublished:true}); if(!course) throw new ApiError(404,"Course not found."); return course; }
export async function createCourse(actorId,data){if(data.status==="published")throw new ApiError(409,"Create the draft and add at least one active lesson before publishing.");const row=await courseModel.createCourse(data,actorId);await courseModel.audit(actorId,"course.create","course",row.id,{status:row.status});return {course:row};}
export async function updateCourse(actorId,id,data){await ensureExists(id);if(data.status==="published"&&await courseModel.countActiveLessons(id)<1)throw new ApiError(409,"Add at least one active lesson before publishing.");const row=await courseModel.updateCourse(id,data);await courseModel.audit(actorId,"course.update","course",id,{fields:Object.keys(data)});return {course:row};}
async function requireDraftContext(item,label){if(!item)throw new ApiError(404,`${label} not found.`);if(item.course_status!=="draft")throw new ApiError(409,"Archive or return the course to draft before changing its structure.");}
export async function addModule(actorId,courseId,data){const course=await ensureExists(courseId);if(course.status!=="draft")throw new ApiError(409,"Return the course to draft before changing its structure.");const row=await courseModel.addModule(courseId,data);await courseModel.audit(actorId,"course_module.create","course_module",row.id,{courseId});return {module:row};}
export async function addLesson(actorId,moduleId,data){const item=await courseModel.getModuleContext(moduleId);await requireDraftContext(item,"Module");const row=await courseModel.addLesson(moduleId,data);await courseModel.audit(actorId,"course_lesson.create","course_lesson",row.id,{moduleId});return {lesson:row};}
export async function updateModule(actorId,id,data){const item=await courseModel.getModuleContext(id);await requireDraftContext(item,"Module");const row=await courseModel.updateModule(id,data);await courseModel.audit(actorId,"course_module.update","course_module",id,{fields:Object.keys(data)});return {module:row};}
export async function deleteModule(actorId,id){const item=await courseModel.getModuleContext(id);await requireDraftContext(item,"Module");await courseModel.deleteModule(id);await courseModel.audit(actorId,"course_module.delete","course_module",id,{courseId:item.course_id});}
export async function updateLesson(actorId,id,data){const item=await courseModel.getLessonContext(id);await requireDraftContext(item,"Lesson");const row=await courseModel.updateLesson(id,data);await courseModel.audit(actorId,"course_lesson.update","course_lesson",id,{fields:Object.keys(data)});return {lesson:row};}
export async function deleteLesson(actorId,id){const item=await courseModel.getLessonContext(id);await requireDraftContext(item,"Lesson");await courseModel.deleteLesson(id);await courseModel.audit(actorId,"course_lesson.delete","course_lesson",id,{courseId:item.course_id});}
export async function setPrerequisites(actorId,courseId,ids){const course=await ensureExists(courseId);if(course.status!=="draft")throw new ApiError(409,"Return the course to draft before changing prerequisites.");if(ids.includes(courseId))throw new ApiError(400,"A course cannot require itself.");for(const id of ids)await ensureExists(id);if(await courseModel.prerequisiteCycleExists(courseId,ids))throw new ApiError(409,"Those prerequisites would create a course cycle.");await courseModel.replacePrerequisites(courseId,ids);await courseModel.audit(actorId,"course.prerequisites.update","course",courseId,{courseIds:ids});return getCourseDetail(courseId,actorId,true);}
