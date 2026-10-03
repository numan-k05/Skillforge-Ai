BEGIN;

-- Every Skill Pass lesson receives a reviewed HTTPS learning resource. The
-- existing attributed first lesson keeps its direct resource relationship;
-- authored lessons link to the active track resource and retain their built-in
-- explanation and practice task.
UPDATE course_lessons cl
SET source_url=resource.url,
    provider=resource.provider
FROM course_modules cm
JOIN courses c ON c.id=cm.course_id
JOIN LATERAL (
  SELECT lr.url,lr.provider
  FROM learning_resources lr
  WHERE lr.skill_id=c.skill_id AND lr.is_active=TRUE
  ORDER BY lr.is_free DESC,lr.id
  LIMIT 1
) resource ON TRUE
WHERE cl.module_id=cm.id
  AND c.slug IN(
    'javascript-foundations','python-foundations','sql-foundations','react-foundations',
    'nodejs-foundations','git-foundations','data-structures-algorithms-foundations','html-css-foundations'
  )
  AND cl.is_active=TRUE
  AND cl.source_resource_id IS NULL
  AND cl.source_url IS NULL;

COMMIT;
