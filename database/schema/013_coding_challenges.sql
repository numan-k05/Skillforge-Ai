-- SkillForge AI — Phase 7D: Coding Challenges
-- Catalog + skill mappings + user attempts/completion tracking.
BEGIN;

CREATE TABLE IF NOT EXISTS coding_challenges (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL UNIQUE,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  category VARCHAR(40) NOT NULL DEFAULT 'coding',
  language VARCHAR(40),
  starter_code TEXT,
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  hints JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_answer TEXT NOT NULL,
  validation_type VARCHAR(20) NOT NULL DEFAULT 'normalized_text' CHECK (validation_type IN ('normalized_text','exact')),
  estimated_minutes SMALLINT NOT NULL DEFAULT 20 CHECK (estimated_minutes BETWEEN 5 AND 180),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON coding_challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON coding_challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON coding_challenges(is_active);

CREATE TABLE IF NOT EXISTS challenge_skills (
  id BIGSERIAL PRIMARY KEY,
  challenge_id BIGINT NOT NULL REFERENCES coding_challenges(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance SMALLINT NOT NULL DEFAULT 2 CHECK (importance BETWEEN 1 AND 3),
  CONSTRAINT uq_challenge_skills UNIQUE (challenge_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_challenge_skills_challenge ON challenge_skills(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_skills_skill ON challenge_skills(skill_id);

CREATE TABLE IF NOT EXISTS user_challenge_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id BIGINT NOT NULL REFERENCES coding_challenges(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_challenge_attempts_user ON user_challenge_attempts(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_challenge_attempts_challenge ON user_challenge_attempts(challenge_id);

CREATE TABLE IF NOT EXISTS user_challenge_progress (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id BIGINT NOT NULL REFERENCES coding_challenges(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user ON user_challenge_progress(user_id, status);

DROP TRIGGER IF EXISTS trg_coding_challenges_updated_at ON coding_challenges;
CREATE TRIGGER trg_coding_challenges_updated_at BEFORE UPDATE ON coding_challenges
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Initial challenge catalog. Answers are intentionally simple and deterministic;
-- the API never returns expected_answer to clients.
INSERT INTO coding_challenges
(title, slug, description, instructions, difficulty, category, language, starter_code, examples, hints, expected_answer, estimated_minutes)
VALUES
('Reverse a String', 'reverse-a-string', 'Reverse a string without changing its characters.', 'Given a string, return the characters in reverse order.', 'beginner','strings','JavaScript','function reverseString(value) {\n  // return the reversed string\n}', '[{"input":"hello","output":"olleh"},{"input":"SkillForge","output":"egrofllikS"}]','["Think about turning the string into an array.","Array methods can help rebuild the result."]','olleh',15),
('Find the Largest Number', 'find-largest-number', 'Find the largest value in an array of numbers.', 'Return the largest number in the provided array.', 'beginner','arrays','JavaScript','function findLargest(numbers) {\n  // return the largest number\n}', '[{"input":"[3, 9, 2, 7]","output":"9"},{"input":"[-4, -1, -8]","output":"-1"}]','["Start with the first value as the current maximum.","Compare each remaining value with the current maximum."]','9',15),
('Count Vowels', 'count-vowels', 'Count the vowels in a string.', 'Return how many a, e, i, o, and u characters occur in the string. Treat uppercase and lowercase as equivalent.', 'beginner','strings','JavaScript','function countVowels(value) {\n  // return the vowel count\n}', '[{"input":"education","output":"5"},{"input":"SkillForge","output":"2"}]','["Normalize the case first.","Check each character against the five vowels."]','5',15),
('FizzBuzz', 'fizzbuzz', 'Practice conditionals with a classic programming exercise.', 'For a number n, return a sequence from 1 to n where multiples of 3 become Fizz, multiples of 5 become Buzz, and multiples of both become FizzBuzz. For this challenge, return the sequence as comma-separated values for n = 15.', 'beginner','logic','JavaScript','function fizzBuzz15() {\n  // return the comma-separated sequence\n}', '[{"input":"15","output":"1,2,Fizz,4,Buzz,Fizz,7,8,Fizz,Buzz,11,Fizz,13,14,FizzBuzz"}]','["Check divisibility by both 3 and 5 before checking either one alone.","Build an array, then join it with commas."]','1,2,Fizz,4,Buzz,Fizz,7,8,Fizz,Buzz,11,Fizz,13,14,FizzBuzz',20),
('Sum a List in Python', 'sum-a-list-python', 'Practice iteration and accumulation in Python.', 'Return the sum of all numbers in the list [4, 7, 2, 9].', 'beginner','python','Python','def total(values):\n    # return the sum\n    pass','[{"input":"[4,7,2,9]","output":"22"}]','["Use an accumulator or Python’s built-in sum."]','22',10),
('Filter Active Records', 'filter-active-records', 'Practice array filtering with objects.', 'Given records [{"name":"A","active":true},{"name":"B","active":false},{"name":"C","active":true}], return the names of active records in order, comma-separated.', 'intermediate','arrays','JavaScript','function activeNames(records) {\n  // return active names\n}', '[{"input":"records","output":"A,C"}]','["filter keeps matching objects.","Map the filtered objects to their names."]','A,C',20),
('SQL Active Students', 'sql-active-students', 'Practice filtering rows in SQL.', 'Write the core SQL query that selects name and email from students where active is true.', 'beginner','sql','SQL','SELECT ...','[{"input":"students(name,email,active)","output":"SELECT name, email FROM students WHERE active = TRUE;"}]','["Select only the two requested columns.","Use WHERE for the condition."]','SELECT name, email FROM students WHERE active = TRUE;',15),
('SQL Group Totals', 'sql-group-totals', 'Practice GROUP BY and aggregation.', 'Write a query that returns each category and the total amount from orders(category, amount).', 'intermediate','sql','SQL','SELECT ...','[{"input":"orders(category,amount)","output":"SELECT category, SUM(amount) AS total_amount FROM orders GROUP BY category;"}]','["SUM calculates the total.","Every non-aggregated selected column belongs in GROUP BY."]','SELECT category, SUM(amount) AS total_amount FROM orders GROUP BY category;',20),
('React Props Concept', 'react-props-concept', 'Check your understanding of component data flow.', 'In one short phrase, name the React mechanism used to pass data from a parent component to a child component.', 'beginner','react','React',null,'[{"input":"parent to child","output":"props"}]','["It is not state.","The word is commonly used as a short form for properties."]','props',10),
('REST Status Code', 'rest-status-code', 'Practice API fundamentals.', 'Which HTTP status code is commonly returned when a new resource has been successfully created?', 'beginner','api','REST API Design',null,'[{"input":"resource created","output":"201"}]','["It is in the 2xx success range.","It is more specific than 200 for creation."]','201',5),
('Git Feature Branch', 'git-feature-branch', 'Practice a common Git workflow.', 'Give the Git command that creates and switches to a new branch named feature/dashboard.', 'beginner','git','Git',null,'[{"input":"new branch","output":"git switch -c feature/dashboard"}]','["switch can create a branch with the -c option."]','git switch -c feature/dashboard',5),
('Array Frequency Counter', 'array-frequency-counter', 'Build a frequency map for repeated values.', 'For the array ["js","css","js","html","css","js"], return the frequency of js as a single number.', 'intermediate','arrays','JavaScript','function countJs(values) {\n  // return the count\n}', '[{"input":"js,css,js,html,css,js","output":"3"}]','["Iterate through the values.","Increment a counter whenever the value equals js."]','3',15)
ON CONFLICT (slug) DO NOTHING;

-- Map challenges to the existing skill catalog by skill name.
INSERT INTO challenge_skills (challenge_id, skill_id, importance)
SELECT c.id, s.id, 3
FROM coding_challenges c JOIN skills s ON s.name = CASE c.slug
  WHEN 'reverse-a-string' THEN 'JavaScript'
  WHEN 'find-largest-number' THEN 'JavaScript'
  WHEN 'count-vowels' THEN 'JavaScript'
  WHEN 'fizzbuzz' THEN 'JavaScript'
  WHEN 'sum-a-list-python' THEN 'Python'
  WHEN 'filter-active-records' THEN 'JavaScript'
  WHEN 'sql-active-students' THEN 'SQL'
  WHEN 'sql-group-totals' THEN 'SQL'
  WHEN 'react-props-concept' THEN 'React'
  WHEN 'rest-status-code' THEN 'REST API Design'
  WHEN 'git-feature-branch' THEN 'Git'
  WHEN 'array-frequency-counter' THEN 'JavaScript'
END
ON CONFLICT (challenge_id, skill_id) DO NOTHING;

COMMIT;
