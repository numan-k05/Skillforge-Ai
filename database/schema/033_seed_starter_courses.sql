BEGIN;

WITH starter(skill_name, title, slug, description) AS (
  VALUES
    ('JavaScript', 'JavaScript Foundations', 'javascript-foundations', 'Build a practical foundation in JavaScript syntax, data, functions, and browser programming using the attributed learning source.'),
    ('Python', 'Python Foundations', 'python-foundations', 'Learn core Python syntax and problem-solving patterns through a structured, source-attributed learning path.'),
    ('SQL', 'SQL Foundations', 'sql-foundations', 'Practice querying and organizing relational data with a structured introduction linked to the existing SQL resource.'),
    ('React', 'React Foundations', 'react-foundations', 'Learn components, state, and interface composition through the existing attributed React learning resource.'),
    ('Node.js', 'Node.js Foundations', 'nodejs-foundations', 'Understand server-side JavaScript and Node.js fundamentals using the existing source catalog.'),
    ('Git', 'Git Foundations', 'git-foundations', 'Build a dependable version-control workflow with the existing attributed Git learning resource.'),
    ('Data Structures & Algorithms', 'Data Structures and Algorithms Foundations', 'data-structures-algorithms-foundations', 'Strengthen problem-solving with foundational data structures and algorithms from the existing learning catalog.'),
    ('HTML/CSS', 'HTML and CSS Foundations', 'html-css-foundations', 'Create accessible, responsive web pages with semantic HTML and modern CSS using the attributed source material.')
)
INSERT INTO courses (skill_id, title, slug, description, difficulty, estimated_hours, status, is_premium)
SELECT s.id, starter.title, starter.slug, starter.description,
       COALESCE(lr.difficulty, 'beginner'), COALESCE(lr.estimated_hours, 4), 'published', FALSE
FROM starter
JOIN skills s ON LOWER(s.name)=LOWER(starter.skill_name)
LEFT JOIN LATERAL (
  SELECT difficulty, estimated_hours FROM learning_resources
  WHERE skill_id=s.id AND is_active=TRUE ORDER BY id LIMIT 1
) lr ON TRUE
ON CONFLICT (slug) DO NOTHING;

INSERT INTO course_modules (course_id, title, description, position)
SELECT c.id, 'Core learning path', 'Complete the attributed lesson and mark it finished to record course progress.', 1
FROM courses c
WHERE c.slug IN ('javascript-foundations','python-foundations','sql-foundations','react-foundations','nodejs-foundations','git-foundations','data-structures-algorithms-foundations','html-css-foundations')
ON CONFLICT (course_id, position) DO NOTHING;

INSERT INTO course_lessons
  (module_id, title, summary, content, source_resource_id, lesson_type, estimated_minutes, position, is_preview, is_active)
SELECT cm.id, lr.title, COALESCE(lr.description, 'Complete this attributed learning resource.'),
       'Open the original source, work through its material, and return to SkillForge to mark this lesson complete. The source provider retains authorship of the linked material.',
       lr.id,
       CASE WHEN lr.resource_type IN ('documentation','video','tutorial','practice','project') THEN lr.resource_type ELSE 'reading' END,
       LEAST(COALESCE(lr.estimated_hours, 1) * 60, 1440), 1, FALSE, TRUE
FROM courses c
JOIN course_modules cm ON cm.course_id=c.id AND cm.position=1
JOIN LATERAL (
  SELECT * FROM learning_resources WHERE skill_id=c.skill_id AND is_active=TRUE ORDER BY id LIMIT 1
) lr ON TRUE
WHERE c.slug IN ('javascript-foundations','python-foundations','sql-foundations','react-foundations','nodejs-foundations','git-foundations','data-structures-algorithms-foundations','html-css-foundations')
ON CONFLICT (module_id, position) DO NOTHING;

COMMIT;
