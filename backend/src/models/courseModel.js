import { pool } from "../config/db.js";

export async function listPublishedCourses({ skillId, difficulty, search, page, limit }) {
  const values = []; const clauses = ["c.status = 'published'"];
  if (skillId) { values.push(skillId); clauses.push(`c.skill_id = $${values.length}`); }
  if (difficulty) { values.push(difficulty); clauses.push(`c.difficulty = $${values.length}`); }
  if (search) { values.push(`%${search}%`); clauses.push(`(c.title ILIKE $${values.length} OR c.description ILIKE $${values.length})`); }
  values.push(limit, (page - 1) * limit);
  const result = await pool.query(
    `SELECT c.*, s.name AS skill_name, COUNT(*) OVER()::int AS total,
      (SELECT COUNT(*)::int FROM course_modules cm WHERE cm.course_id = c.id) AS module_count,
      (SELECT COUNT(*)::int FROM course_lessons cl JOIN course_modules cm ON cm.id = cl.module_id WHERE cm.course_id = c.id AND cl.is_active = TRUE) AS lesson_count
     FROM courses c JOIN skills s ON s.id = c.skill_id WHERE ${clauses.join(" AND ")}
     ORDER BY c.created_at DESC, c.id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return result.rows;
}
export async function listAdminCourses({ page,limit }){const r=await pool.query(`SELECT c.*,s.name AS skill_name,COUNT(*) OVER()::int AS total,(SELECT COUNT(*)::int FROM course_modules cm WHERE cm.course_id=c.id) AS module_count,(SELECT COUNT(*)::int FROM course_lessons cl JOIN course_modules cm ON cm.id=cl.module_id WHERE cm.course_id=c.id AND cl.is_active=TRUE) AS lesson_count FROM courses c JOIN skills s ON s.id=c.skill_id ORDER BY c.updated_at DESC LIMIT $1 OFFSET $2`,[limit,(page-1)*limit]);return r.rows;}

export async function getCourse(courseId, { includeUnpublished = false, userId = null } = {}) {
  const result = await pool.query(
    `SELECT c.*, s.name AS skill_name,
      CASE WHEN $2::bigint IS NULL THEN FALSE ELSE EXISTS (SELECT 1 FROM course_enrollments ce WHERE ce.course_id=c.id AND ce.user_id=$2) END AS enrolled
     FROM courses c JOIN skills s ON s.id=c.skill_id WHERE c.id=$1 ${includeUnpublished ? "" : "AND c.status='published'"}`, [courseId, userId]);
  return result.rows[0] || null;
}

export async function getCourseStructure(courseId, userId = null) {
  const modules = await pool.query(
    `SELECT cm.id, cm.title, cm.description, cm.position,
      COALESCE(json_agg(json_build_object('id',cl.id,'title',cl.title,'summary',cl.summary,'content',cl.content,'sourceResourceId',cl.source_resource_id,'sourceUrl',COALESCE(lr.url,cl.source_url),'provider',COALESCE(lr.provider,cl.provider),'lessonType',cl.lesson_type,'estimatedMinutes',cl.estimated_minutes,'position',cl.position,'isPreview',cl.is_preview,'completed',lp.completed_at IS NOT NULL) ORDER BY cl.position) FILTER (WHERE cl.id IS NOT NULL), '[]') AS lessons
     FROM course_modules cm LEFT JOIN course_lessons cl ON cl.module_id=cm.id AND cl.is_active=TRUE
     LEFT JOIN learning_resources lr ON lr.id=cl.source_resource_id
     LEFT JOIN lesson_progress lp ON lp.lesson_id=cl.id AND lp.user_id=$2
     WHERE cm.course_id=$1 GROUP BY cm.id ORDER BY cm.position`, [courseId, userId]);
  return modules.rows;
}

export async function listPrerequisites(courseId) {
  const result = await pool.query(`SELECT c.id, c.title, c.slug FROM course_prerequisites cp JOIN courses c ON c.id=cp.prerequisite_course_id WHERE cp.course_id=$1 ORDER BY c.title`, [courseId]);
  return result.rows;
}

export async function enroll(userId, courseId, client = pool) {
  const result = await client.query(`INSERT INTO course_enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT (user_id,course_id) DO UPDATE SET updated_at=now() RETURNING *`, [userId, courseId]);
  return result.rows[0];
}

export async function focusEnrollment(userId,courseId){
  const result=await pool.query(`UPDATE course_enrollments SET updated_at=now() WHERE user_id=$1 AND course_id=$2 RETURNING course_id,status,updated_at`,[userId,courseId]);
  return result.rows[0]||null;
}

export async function incompletePrerequisites(userId, courseId) {
  const result = await pool.query(`SELECT c.id,c.title FROM course_prerequisites cp JOIN courses c ON c.id=cp.prerequisite_course_id LEFT JOIN course_enrollments ce ON ce.course_id=c.id AND ce.user_id=$1 AND ce.status='completed' WHERE cp.course_id=$2 AND ce.id IS NULL`, [userId, courseId]);
  return result.rows;
}

export async function completeLesson(userId, lessonId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const lesson = await client.query(`SELECT cl.id,cm.course_id FROM course_lessons cl JOIN course_modules cm ON cm.id=cl.module_id JOIN course_enrollments ce ON ce.course_id=cm.course_id AND ce.user_id=$2 WHERE cl.id=$1 AND cl.is_active=TRUE FOR UPDATE`, [lessonId,userId]);
    if (!lesson.rows[0]) { await client.query("ROLLBACK"); return null; }
    await client.query(`INSERT INTO lesson_progress (user_id,lesson_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [userId,lessonId]);
    const courseId=lesson.rows[0].course_id;
    const progress=await client.query(`SELECT COUNT(cl.id)::int AS total, COUNT(lp.lesson_id)::int AS completed FROM course_lessons cl JOIN course_modules cm ON cm.id=cl.module_id LEFT JOIN lesson_progress lp ON lp.lesson_id=cl.id AND lp.user_id=$1 WHERE cm.course_id=$2 AND cl.is_active=TRUE`, [userId,courseId]);
    const counts=progress.rows[0]; const done=counts.total>0 && counts.completed===counts.total;
    await client.query(`UPDATE course_enrollments SET status=$3::varchar,completed_at=CASE WHEN $3::varchar='completed'::varchar THEN COALESCE(completed_at,now()) ELSE NULL END WHERE user_id=$1 AND course_id=$2`, [userId,courseId,done?"completed":"in_progress"]);
    await client.query("COMMIT"); return { courseId, ...counts, status: done?"completed":"in_progress" };
  } catch(error){ await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function listUserCourses(userId) {
  const result=await pool.query(`SELECT ce.status,ce.started_at,ce.completed_at,c.id,c.title,c.slug,c.difficulty,c.estimated_hours,s.name AS skill_name,COUNT(cl.id)::int AS lesson_count,COUNT(lp.lesson_id)::int AS completed_lessons FROM course_enrollments ce JOIN courses c ON c.id=ce.course_id JOIN skills s ON s.id=c.skill_id LEFT JOIN course_modules cm ON cm.course_id=c.id LEFT JOIN course_lessons cl ON cl.module_id=cm.id AND cl.is_active=TRUE LEFT JOIN lesson_progress lp ON lp.lesson_id=cl.id AND lp.user_id=ce.user_id WHERE ce.user_id=$1 GROUP BY ce.id,c.id,s.name ORDER BY ce.updated_at DESC`,[userId]);
  return result.rows;
}

export async function createCourse(data, actorId){const r=await pool.query(`INSERT INTO courses(skill_id,title,slug,description,difficulty,estimated_hours,status,is_premium,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[data.skillId,data.title,data.slug,data.description,data.difficulty,data.estimatedHours,data.status,data.isPremium,actorId]);return r.rows[0];}
export async function updateCourse(id,data){const map={skillId:"skill_id",title:"title",slug:"slug",description:"description",difficulty:"difficulty",estimatedHours:"estimated_hours",status:"status",isPremium:"is_premium"};const entries=Object.entries(data);const values=entries.map(([,v])=>v);values.push(id);const r=await pool.query(`UPDATE courses SET ${entries.map(([k],i)=>`${map[k]}=$${i+1}`).join(",")} WHERE id=$${values.length} RETURNING *`,values);return r.rows[0]||null;}
export async function countActiveLessons(courseId){const r=await pool.query(`SELECT COUNT(*)::int AS count FROM course_lessons cl JOIN course_modules cm ON cm.id=cl.module_id WHERE cm.course_id=$1 AND cl.is_active=TRUE`,[courseId]);return r.rows[0].count;}
export async function addModule(courseId,data){const r=await pool.query(`INSERT INTO course_modules(course_id,title,description,position) VALUES($1,$2,$3,$4) RETURNING *`,[courseId,data.title,data.description??null,data.position]);return r.rows[0];}
export async function addLesson(moduleId,data){const r=await pool.query(`INSERT INTO course_lessons(module_id,title,summary,content,source_resource_id,source_url,provider,lesson_type,estimated_minutes,position,is_preview,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[moduleId,data.title,data.summary??null,data.content??null,data.sourceResourceId??null,data.sourceUrl??null,data.provider??null,data.lessonType,data.estimatedMinutes,data.position,data.isPreview,data.isActive]);return r.rows[0];}
export async function getModuleContext(id){const r=await pool.query(`SELECT cm.*,c.status AS course_status FROM course_modules cm JOIN courses c ON c.id=cm.course_id WHERE cm.id=$1`,[id]);return r.rows[0]||null;}
export async function getLessonContext(id){const r=await pool.query(`SELECT cl.*,cm.course_id,c.status AS course_status FROM course_lessons cl JOIN course_modules cm ON cm.id=cl.module_id JOIN courses c ON c.id=cm.course_id WHERE cl.id=$1`,[id]);return r.rows[0]||null;}
export async function updateModule(id,data){const map={title:"title",description:"description",position:"position"};const entries=Object.entries(data),values=entries.map(([,v])=>v);values.push(id);const r=await pool.query(`UPDATE course_modules SET ${entries.map(([k],i)=>`${map[k]}=$${i+1}`).join(",")} WHERE id=$${values.length} RETURNING *`,values);return r.rows[0]||null;}
export async function deleteModule(id){const r=await pool.query(`DELETE FROM course_modules WHERE id=$1 RETURNING id,course_id`,[id]);return r.rows[0]||null;}
export async function updateLesson(id,data){const map={title:"title",summary:"summary",content:"content",sourceResourceId:"source_resource_id",sourceUrl:"source_url",provider:"provider",lessonType:"lesson_type",estimatedMinutes:"estimated_minutes",position:"position",isPreview:"is_preview",isActive:"is_active"};const entries=Object.entries(data),values=entries.map(([,v])=>v);values.push(id);const r=await pool.query(`UPDATE course_lessons SET ${entries.map(([k],i)=>`${map[k]}=$${i+1}`).join(",")} WHERE id=$${values.length} RETURNING *`,values);return r.rows[0]||null;}
export async function deleteLesson(id){const r=await pool.query(`DELETE FROM course_lessons WHERE id=$1 RETURNING id,module_id`,[id]);return r.rows[0]||null;}
export async function replacePrerequisites(courseId,ids){const client=await pool.connect();try{await client.query("BEGIN");await client.query("DELETE FROM course_prerequisites WHERE course_id=$1",[courseId]);for(const id of ids)await client.query("INSERT INTO course_prerequisites(course_id,prerequisite_course_id) VALUES($1,$2)",[courseId,id]);await client.query("COMMIT");}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}}
export async function prerequisiteCycleExists(courseId,ids){if(!ids.length)return false;const r=await pool.query(`WITH RECURSIVE dependencies(id) AS (SELECT unnest($2::bigint[]) UNION SELECT cp.prerequisite_course_id FROM course_prerequisites cp JOIN dependencies d ON cp.course_id=d.id) SELECT EXISTS(SELECT 1 FROM dependencies WHERE id=$1) AS exists`,[courseId,ids]);return r.rows[0].exists;}
export async function audit(actorId,action,entityType,entityId,metadata={}){await pool.query(`INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5::jsonb)`,[actorId,action,entityType,entityId,JSON.stringify(metadata)]);}
