BEGIN;

WITH definitions(course_slug, title, prompt, explanation, correct_option, wrong_option) AS (
  VALUES
    ('javascript-foundations', 'JavaScript Foundations Check', 'Which JavaScript operator compares both value and type?', 'The strict equality operator (===) compares value and type without coercion.', '===', '=='),
    ('python-foundations', 'Python Foundations Check', 'Which expression creates a Python list?', 'Square brackets create a Python list.', '[1, 2, 3]', '(1, 2, 3)'),
    ('sql-foundations', 'SQL Foundations Check', 'Which SQL keyword reads rows from a table?', 'SELECT reads columns and rows from a table or query expression.', 'SELECT', 'UPDATE'),
    ('react-foundations', 'React Foundations Check', 'Which React Hook stores local component state?', 'useState creates and updates local component state.', 'useState', 'useEffect'),
    ('nodejs-foundations', 'Node.js Foundations Check', 'What is Node.js primarily used for?', 'Node.js runs JavaScript outside the browser, including on servers.', 'Running JavaScript outside the browser', 'Styling HTML pages'),
    ('git-foundations', 'Git Foundations Check', 'Which Git command records staged changes as a snapshot?', 'git commit records the currently staged changes in repository history.', 'git commit', 'git status'),
    ('data-structures-algorithms-foundations', 'Data Structures and Algorithms Check', 'Which order does a queue normally follow?', 'A queue normally removes the earliest inserted item first.', 'First in, first out', 'Last in, first out'),
    ('html-css-foundations', 'HTML and CSS Foundations Check', 'Which HTML element identifies the page’s primary content?', 'The main element identifies the dominant content of the document body.', '<main>', '<span>')
)
INSERT INTO quizzes (title, course_id)
SELECT d.title, c.id FROM definitions d JOIN courses c ON c.slug=d.course_slug
WHERE NOT EXISTS (SELECT 1 FROM quizzes q WHERE q.course_id=c.id AND q.title=d.title);

INSERT INTO quiz_versions (quiz_id, version, description, pass_percent, max_attempts, cooldown_minutes, status, published_at)
SELECT q.id, 1, 'A short knowledge check for the linked starter course.', 70, 3, 0, 'published', now()
FROM quizzes q JOIN courses c ON c.id=q.course_id
WHERE c.slug IN ('javascript-foundations','python-foundations','sql-foundations','react-foundations','nodejs-foundations','git-foundations','data-structures-algorithms-foundations','html-css-foundations')
AND NOT EXISTS (SELECT 1 FROM quiz_versions qv WHERE qv.quiz_id=q.id);

WITH definitions(course_slug, prompt, explanation) AS (
  VALUES
    ('javascript-foundations', 'Which JavaScript operator compares both value and type?', 'The strict equality operator (===) compares value and type without coercion.'),
    ('python-foundations', 'Which expression creates a Python list?', 'Square brackets create a Python list.'),
    ('sql-foundations', 'Which SQL keyword reads rows from a table?', 'SELECT reads columns and rows from a table or query expression.'),
    ('react-foundations', 'Which React Hook stores local component state?', 'useState creates and updates local component state.'),
    ('nodejs-foundations', 'What is Node.js primarily used for?', 'Node.js runs JavaScript outside the browser, including on servers.'),
    ('git-foundations', 'Which Git command records staged changes as a snapshot?', 'git commit records the currently staged changes in repository history.'),
    ('data-structures-algorithms-foundations', 'Which order does a queue normally follow?', 'A queue normally removes the earliest inserted item first.'),
    ('html-css-foundations', 'Which HTML element identifies the page’s primary content?', 'The main element identifies the dominant content of the document body.')
)
INSERT INTO quiz_questions (quiz_version_id, prompt, explanation, position, points)
SELECT qv.id, d.prompt, d.explanation, 1, 1
FROM definitions d JOIN courses c ON c.slug=d.course_slug JOIN quizzes q ON q.course_id=c.id
JOIN quiz_versions qv ON qv.quiz_id=q.id AND qv.version=1
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions qq WHERE qq.quiz_version_id=qv.id AND qq.position=1);

WITH answers(course_slug, correct_option, wrong_option) AS (
  VALUES
    ('javascript-foundations', '===', '=='), ('python-foundations', '[1, 2, 3]', '(1, 2, 3)'),
    ('sql-foundations', 'SELECT', 'UPDATE'), ('react-foundations', 'useState', 'useEffect'),
    ('nodejs-foundations', 'Running JavaScript outside the browser', 'Styling HTML pages'),
    ('git-foundations', 'git commit', 'git status'),
    ('data-structures-algorithms-foundations', 'First in, first out', 'Last in, first out'),
    ('html-css-foundations', '<main>', '<span>')
)
INSERT INTO quiz_options (question_id, option_text, is_correct, position)
SELECT qq.id, choice.option_text, choice.is_correct, choice.position
FROM answers a JOIN courses c ON c.slug=a.course_slug JOIN quizzes q ON q.course_id=c.id
JOIN quiz_versions qv ON qv.quiz_id=q.id AND qv.version=1
JOIN quiz_questions qq ON qq.quiz_version_id=qv.id AND qq.position=1
CROSS JOIN LATERAL (VALUES (a.correct_option, TRUE, 1), (a.wrong_option, FALSE, 2)) choice(option_text,is_correct,position)
ON CONFLICT (question_id, position) DO NOTHING;

COMMIT;
