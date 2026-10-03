import { Router } from "express";
import { optionalAuth, requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { validate, validateParams, validateQuery } from "../middleware/validate.js";
import { positiveIdParamSchema, courseCatalogQuerySchema, courseSchema, courseUpdateSchema, courseModuleSchema, courseModuleUpdateSchema, courseLessonSchema, courseLessonUpdateSchema, coursePrerequisitesSchema } from "../utils/validation.js";
import * as controller from "../controllers/courseController.js";

const router=Router();
router.get("/",optionalAuth,validateQuery(courseCatalogQuerySchema),controller.listCourses);
router.get("/mine",requireAuth,controller.getMyCourses);
router.post("/lessons/:id/complete",requireAuth,validateParams(positiveIdParamSchema),controller.completeLesson);
router.get("/admin/:id",requireAuth,requireRole("content_admin","admin"),validateParams(positiveIdParamSchema),controller.adminGetCourse);
router.get("/admin",requireAuth,requireRole("content_admin","admin"),validateQuery(courseCatalogQuerySchema),controller.adminListCourses);
router.post("/admin",requireAuth,requireRole("content_admin","admin"),validate(courseSchema),controller.adminCreateCourse);
router.patch("/admin/:id",requireAuth,requireRole("content_admin","admin"),validateParams(positiveIdParamSchema),validate(courseUpdateSchema),controller.adminUpdateCourse);
router.post("/admin/:id/modules",requireAuth,requireRole("content_admin","admin"),validateParams(positiveIdParamSchema),validate(courseModuleSchema),controller.adminAddModule);
router.post("/admin/modules/:id/lessons",requireAuth,requireRole("content_admin","admin"),validateParams(positiveIdParamSchema),validate(courseLessonSchema),controller.adminAddLesson);
router.patch("/admin/modules/:id",requireAuth,requireRole("content_admin","admin"),validateParams(positiveIdParamSchema),validate(courseModuleUpdateSchema),controller.adminUpdateModule);
router.delete("/admin/modules/:id",requireAuth,requireRole("content_admin","admin"),validateParams(positiveIdParamSchema),controller.adminDeleteModule);
router.patch("/admin/lessons/:id",requireAuth,requireRole("content_admin","admin"),validateParams(positiveIdParamSchema),validate(courseLessonUpdateSchema),controller.adminUpdateLesson);
router.delete("/admin/lessons/:id",requireAuth,requireRole("content_admin","admin"),validateParams(positiveIdParamSchema),controller.adminDeleteLesson);
router.put("/admin/:id/prerequisites",requireAuth,requireRole("content_admin","admin"),validateParams(positiveIdParamSchema),validate(coursePrerequisitesSchema),controller.adminSetPrerequisites);
router.post("/:id/start",requireAuth,validateParams(positiveIdParamSchema),controller.startCourse);
router.post("/:id/focus",requireAuth,validateParams(positiveIdParamSchema),controller.focusCourse);
router.get("/:id",validateParams(positiveIdParamSchema),(req,res,next)=>{
  // Optional authentication lets enrolled learners see full lesson content without making catalog detail private.
  if(!req.headers.authorization)return controller.getCourse(req,res,next);
  return requireAuth(req,res,(error)=>error?next(error):controller.getCourse(req,res,next));
});
export default router;
