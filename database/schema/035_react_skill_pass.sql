BEGIN;

-- First launch-ready paid content package. The product remains in draft until
-- a production payment provider and merchant settlement account are configured.
UPDATE courses
SET title='React Skill Pass',
    description='Build reliable React interfaces with components, state, effects, routing, accessibility, testing, and two portfolio projects.',
    difficulty='intermediate', estimated_hours=24, is_premium=TRUE
WHERE slug='react-foundations';

UPDATE course_lessons cl SET is_preview=TRUE
FROM course_modules cm JOIN courses c ON c.id=cm.course_id
WHERE cl.module_id=cm.id AND c.slug='react-foundations' AND cm.position=1 AND cl.position=1;

INSERT INTO course_modules(course_id,title,description,position)
SELECT c.id,m.title,m.description,m.position FROM courses c CROSS JOIN (VALUES
  ('React foundations','Understand JSX, component boundaries, and predictable data flow.',2),
  ('State and application behavior','Build interactive interfaces with state, events, forms, effects, and remote data.',3),
  ('Production React','Structure, test, optimize, and ship an accessible React application.',4)
) AS m(title,description,position)
WHERE c.slug='react-foundations'
ON CONFLICT(course_id,position) DO NOTHING;

WITH lessons(module_position,position,title,summary,content,lesson_type,minutes) AS (VALUES
  (2,1,'JSX and rendering rules','Use JSX deliberately and keep render output predictable.',
$$JSX describes the interface for one render. Expressions inside braces should calculate values without changing external state. A component must return one renderable tree, which can be grouped with a fragment when an extra DOM element would be misleading.

Treat rendering as a pure calculation: the same props and state should produce the same output. Do not start network requests, update storage, or change state while React is rendering. Use array map operations to create repeated elements and give siblings stable keys derived from persistent identifiers rather than their position.

Practice: render a product list from an array, include an explicit empty state, and use a product ID as each key. Add conditional output for loading, failure, empty, and ready states. Inspect the DOM and confirm that the semantic elements still communicate the page structure without CSS.$$,'practice',75),
  (2,2,'Components, props, and composition','Design small component contracts and compose them into clear interfaces.',
$$A component should own one clear responsibility. Props are its public input contract and flow from parent to child. Keep props minimal, name them by meaning, and avoid copying a prop into state unless the component must intentionally maintain an independent editable value.

Composition is often simpler than adding many configuration flags. Accept children or focused renderable sections so a shared Card, Dialog, or PageHeader can provide structure while callers provide content. Lift state only to the nearest common owner that must coordinate it.

Practice: split a dashboard into PageHeader, FilterBar, ResultList, ResultCard, EmptyState, and ErrorState. Write down the props for each component before implementation. Confirm that no child reaches into a parent or global object to discover data that should have been passed explicitly.$$,'practice',90),
  (2,3,'Lists, identity, and reusable UI','Preserve component identity and build consistent reusable primitives.',
$$React uses element type and key to decide whether UI represents the same component between renders. A stable key preserves the correct local state when a list is filtered, reordered, or updated. Array indexes are acceptable only for static lists that never change order and never contain item-specific state.

Reusable primitives should encode accessibility and design defaults. A Button can centralize type, disabled behavior, focus style, and variants. A Field can connect labels, hints, and validation messages. Keep domain decisions outside primitives so they remain useful across the application.

Practice: build a reorderable task list with stable database-style IDs. Add an editable input inside every row, reorder the rows, and verify that each input remains attached to the correct task.$$,'practice',75),
  (3,1,'State, events, and derived values','Model the smallest state needed for an interactive feature.',
$$State stores information that changes over time and affects rendering. Prefer one authoritative value over duplicated state. Values that can be calculated from props or state should be derived during rendering instead of synchronized with another state variable.

Event handlers describe user actions. Pass a function to an event prop rather than calling it during render. When the next value depends on the previous value, use the functional state form. Treat objects and arrays as immutable and create updated copies.

Practice: create a searchable catalog. Store only the search text, selected category, and source records. Derive the filtered records and result count. Add a clear button and verify keyboard operation and focus behavior.$$,'practice',90),
  (3,2,'Forms and validation','Build controlled forms with useful validation and submission states.',
$$A controlled field receives its value from React state and reports changes through an event handler. Group related fields when that makes updates clearer, but keep server data and temporary form edits separate. Validate important rules on both client and server; client validation improves feedback, while server validation protects the system.

During submission, prevent duplicate actions, clear stale messages, show progress, and preserve safe user input after a recoverable error. Associate every label and error with its input and move focus only when it helps the user recover.

Practice: build a profile form with required name and email fields, bounded text, an explicit submit button, field-level errors, a submitting state, and a simulated server failure.$$,'practice',90),
  (3,3,'Effects and remote data','Synchronize with external systems without creating dependency bugs.',
$$An effect is for synchronization with something outside React: a network request, browser API, timer, or third-party widget. It is not a general place for calculations. Include every reactive value used by the effect, and restructure code instead of suppressing dependency warnings.

Async work must handle races. Use an AbortController or an active flag so an earlier response cannot overwrite newer state after inputs change or the component unmounts. Model loading, success, empty, and failure explicitly.

Practice: load records for a selected category. Cancel the previous request when the category changes, show a retry control on failure, and confirm that rapid switching cannot display results for the wrong category.$$,'practice',105),
  (3,4,'Context, reducers, and shared state','Choose local state, context, or a reducer according to the problem.',
$$Keep state local until multiple distant components truly need it. Context distributes a value through a subtree, but every changing context value can cause consumers to render. Split unrelated contexts and memoize provider values when measurement shows a benefit.

A reducer is useful when many events change related state or when transitions deserve names. The reducer should be pure: it receives current state and an action, then returns the next state without network calls or mutation.

Practice: implement a shopping cart reducer with add, remove, change quantity, and clear actions. Provide state and dispatch through focused contexts, calculate totals as derived values, and test every transition.$$,'practice',105),
  (4,1,'Routing and application boundaries','Design routes, layouts, parameters, and protected areas.',
$$Routes turn URLs into application state users can bookmark, share, and navigate with browser controls. Use nested layouts for shared navigation, validate route parameters before requesting data, and provide useful not-found and error states.

Protected routes improve the experience but do not secure backend data. Every private API endpoint must still verify authentication and ownership. Preserve the intended destination during login so a user can continue safely afterward.

Practice: create catalog, detail, settings, and not-found routes. Add a protected dashboard route and test direct URL entry, refresh, invalid identifiers, back navigation, and sign-out.$$,'practice',90),
  (4,2,'Accessibility and resilient interfaces','Make interaction understandable by keyboard, screen reader, and sight.',
$$Start with semantic HTML. Use buttons for actions, links for navigation, headings in a meaningful hierarchy, and native form controls whenever possible. Every interactive element needs an accessible name, visible focus, and a usable keyboard path.

Loading and error messages should use appropriate live-region behavior without repeatedly interrupting users. Do not rely on color alone. Respect reduced-motion preferences and ensure layouts work with zoom and narrow screens.

Practice: audit a dialog, navigation menu, data table, and form. Test using only the keyboard, inspect accessible names, verify focus entry and return, and correct contrast or error-identification problems.$$,'practice',105),
  (4,3,'Testing and debugging React','Test behavior that protects important user outcomes.',
$$Prefer tests that interact with the interface as a user would. Query controls by role and accessible name, perform actions, and assert the visible result. Unit-test pure reducers and formatting functions; use integration tests for forms, routing, authentication, and remote-data states.

Avoid tests that merely reproduce implementation details. A useful test should fail when meaningful behavior breaks. Debug by reducing the problem, reading the first relevant error, inspecting network requests and state transitions, and confirming assumptions with a minimal reproduction.

Practice: cover successful and failed form submission, protected navigation, loading and empty states, and a reducer boundary case. Explain what regression each test prevents.$$,'practice',105),
  (4,4,'Performance and delivery','Measure rendering, split expensive work, and prepare a production build.',
$$Performance work begins with measurement. Use browser tools and the React profiler to identify slow rendering or excessive work. Memoization has a cost and should protect a measured expensive calculation or stabilize a value required by a memoized boundary.

Lazy-load large route groups, keep assets appropriately sized, and avoid placing rapidly changing state high in the tree. Production delivery also requires safe environment configuration, error handling, caching decisions, and verification of the built application.

Practice: profile a slow filtered list, document the cause, apply one measured improvement, and compare results. Produce a production build and test its main routes, authentication behavior, responsive layout, and error states.$$,'practice',90)
)
INSERT INTO course_lessons(module_id,title,summary,content,lesson_type,estimated_minutes,position,is_preview,is_active)
SELECT cm.id,l.title,l.summary,l.content,l.lesson_type,l.minutes,l.position,FALSE,TRUE
FROM lessons l JOIN courses c ON c.slug='react-foundations'
JOIN course_modules cm ON cm.course_id=c.id AND cm.position=l.module_position
ON CONFLICT(module_id,position) DO NOTHING;

-- Replace the one-question starter check with a stable twelve-question version.
UPDATE quiz_versions SET status='retired'
WHERE quiz_id=(SELECT q.id FROM quizzes q JOIN courses c ON c.id=q.course_id WHERE c.slug='react-foundations')
  AND status='published';

INSERT INTO quiz_versions(quiz_id,version,description,pass_percent,max_attempts,cooldown_minutes,status,published_at)
SELECT q.id,2,'React Skill Pass final assessment covering rendering, state, effects, routing, accessibility, testing, and performance.',75,5,30,'published',now()
FROM quizzes q JOIN courses c ON c.id=q.course_id
WHERE c.slug='react-foundations'
ON CONFLICT(quiz_id,version) DO UPDATE SET status='published',published_at=COALESCE(quiz_versions.published_at,now());

WITH questions(position,prompt,explanation,correct,wrong1,wrong2,wrong3) AS (VALUES
 (1,'Why should a list item use a stable data identifier as its React key?','Stable keys preserve the correct component identity when a list changes.','It preserves item identity across insertions and reordering','It automatically sorts the list','It encrypts the item data','It prevents every network request'),
 (2,'Which value should usually be stored in state?','Store the smallest authoritative value and derive what can be calculated.','A user-edited search query','A filtered list that can be calculated from records and the query','A constant configuration value','The number of components on the page'),
 (3,'When is the functional state update form most useful?','The function receives the latest prior state.','When the next value depends on the previous value','When state never changes','Only inside an effect cleanup','Only for string values'),
 (4,'What is an appropriate use of useEffect?','Effects synchronize React with external systems.','Subscribing to a browser event and cleaning it up','Calculating a total from props','Sorting a small array during render','Formatting a date for display'),
 (5,'How should an effect handle a request when its input changes quickly?','Cancellation or an active guard prevents stale results winning a race.','Cancel or ignore the obsolete request','Remove the dependency array','Store the response in a global variable','Reload the page after every change'),
 (6,'What is the best first choice for a clickable form submission action?','Native controls provide correct semantics and keyboard behavior.','A button with type submit','A div with an onClick handler','A styled paragraph','An anchor without an href'),
 (7,'Which statement about protected React routes is correct?','Client routing is a user-interface boundary; the API remains the security boundary.','The backend must still verify authentication and ownership','A protected route makes every API endpoint secure','Hiding a link prevents unauthorized requests','Route parameters never need validation'),
 (8,'What makes a reducer suitable for state management?','Reducers make related transitions explicit and testable.','Several named events update related state','The page contains one static heading','A value can be calculated directly from props','The application needs a CSS animation'),
 (9,'Which test most directly protects user behavior?','Role-based interaction tests exercise the public interface.','Find the Save button by role, click it, and assert the success state','Assert an internal hook variable name','Snapshot every generated class name','Call the component function directly'),
 (10,'What should happen to focus when an accessible modal closes?','Returning focus preserves the keyboard user context.','Focus returns to the control that opened it','Focus is permanently removed','Focus always moves to the page footer','The page must reload'),
 (11,'When should useMemo normally be introduced?','Memoization should address measured work or a required stable dependency.','After measurement shows an expensive recalculation matters','For every string concatenation','Around every component prop','Before checking whether rendering is slow'),
 (12,'What should be verified after creating a production build?','A successful compile does not prove runtime flows work.','Main routes, authentication, responsive behavior, and error states','Only the output directory name','Only the development server port','Only the source file count')
), target AS (
 SELECT qv.id FROM quiz_versions qv JOIN quizzes q ON q.id=qv.quiz_id JOIN courses c ON c.id=q.course_id
 WHERE c.slug='react-foundations' AND qv.version=2
)
INSERT INTO quiz_questions(quiz_version_id,prompt,explanation,position,points)
SELECT target.id,q.prompt,q.explanation,q.position,1 FROM questions q CROSS JOIN target
ON CONFLICT(quiz_version_id,position) DO NOTHING;

WITH questions(position,correct,wrong1,wrong2,wrong3) AS (VALUES
 (1,'It preserves item identity across insertions and reordering','It automatically sorts the list','It encrypts the item data','It prevents every network request'),
 (2,'A user-edited search query','A filtered list that can be calculated from records and the query','A constant configuration value','The number of components on the page'),
 (3,'When the next value depends on the previous value','When state never changes','Only inside an effect cleanup','Only for string values'),
 (4,'Subscribing to a browser event and cleaning it up','Calculating a total from props','Sorting a small array during render','Formatting a date for display'),
 (5,'Cancel or ignore the obsolete request','Remove the dependency array','Store the response in a global variable','Reload the page after every change'),
 (6,'A button with type submit','A div with an onClick handler','A styled paragraph','An anchor without an href'),
 (7,'The backend must still verify authentication and ownership','A protected route makes every API endpoint secure','Hiding a link prevents unauthorized requests','Route parameters never need validation'),
 (8,'Several named events update related state','The page contains one static heading','A value can be calculated directly from props','The application needs a CSS animation'),
 (9,'Find the Save button by role, click it, and assert the success state','Assert an internal hook variable name','Snapshot every generated class name','Call the component function directly'),
 (10,'Focus returns to the control that opened it','Focus is permanently removed','Focus always moves to the page footer','The page must reload'),
 (11,'After measurement shows an expensive recalculation matters','For every string concatenation','Around every component prop','Before checking whether rendering is slow'),
 (12,'Main routes, authentication, responsive behavior, and error states','Only the output directory name','Only the development server port','Only the source file count')
), target AS (
 SELECT qq.id,qq.position FROM quiz_questions qq JOIN quiz_versions qv ON qv.id=qq.quiz_version_id
 JOIN quizzes q ON q.id=qv.quiz_id JOIN courses c ON c.id=q.course_id
 WHERE c.slug='react-foundations' AND qv.version=2
)
INSERT INTO quiz_options(question_id,option_text,is_correct,position)
SELECT target.id,o.text,o.correct,o.position FROM questions q JOIN target ON target.position=q.position
CROSS JOIN LATERAL (VALUES(q.correct,TRUE,1),(q.wrong1,FALSE,2),(q.wrong2,FALSE,3),(q.wrong3,FALSE,4)) o(text,correct,position)
ON CONFLICT(question_id,position) DO NOTHING;

INSERT INTO projects(title,slug,short_description,description,difficulty,estimated_hours,project_type,is_active)
VALUES('React Productivity Dashboard','react-productivity-dashboard','Build an accessible productivity dashboard with reliable state and data flows.','Create a responsive React dashboard with routing, filtered task data, forms, remote-data states, accessible navigation, automated tests, and a documented production build.','intermediate',24,'portfolio',TRUE)
ON CONFLICT(slug) DO NOTHING;

INSERT INTO project_skills(project_id,skill_id,importance)
SELECT p.id,s.id,x.importance FROM (VALUES('React',3),('JavaScript',3),('Git',2)) x(skill_name,importance)
JOIN projects p ON p.slug='react-productivity-dashboard' JOIN skills s ON s.name=x.skill_name
ON CONFLICT(project_id,skill_id) DO NOTHING;

INSERT INTO career_projects(career_id,project_id,relevance)
SELECT c.id,p.id,3 FROM careers c JOIN projects p ON p.slug='react-productivity-dashboard'
WHERE c.title IN('React Developer','Frontend Developer','Full Stack Developer')
ON CONFLICT(career_id,project_id) DO NOTHING;

INSERT INTO project_milestones(project_id,milestone_order,title,description,estimated_hours)
SELECT p.id,m.position,m.title,m.description,m.hours FROM projects p CROSS JOIN (VALUES
 (1,'Plan the component and route structure','Define user flows, routes, data shapes, component boundaries, and accessibility requirements.',4),
 (2,'Build dashboard behavior','Implement navigation, task filters, forms, state transitions, and remote-data states.',10),
 (3,'Add accessibility and tests','Verify keyboard behavior and add meaningful reducer, form, route, and error-state tests.',6),
 (4,'Optimize and document delivery','Profile one important flow, create a production build, and document setup and decisions.',4)
) m(position,title,description,hours)
WHERE p.slug='react-productivity-dashboard'
ON CONFLICT(project_id,milestone_order) DO NOTHING;

INSERT INTO certificate_definitions(title,slug,description,required_readiness_score,is_active)
VALUES('React Skill Pass Completion','react-skill-pass-completion','Verified completion of the React Skill Pass lessons, assessment, and two reviewer-approved projects.',45,TRUE)
ON CONFLICT(slug) DO UPDATE SET description=EXCLUDED.description,required_readiness_score=EXCLUDED.required_readiness_score,is_active=EXCLUDED.is_active;

INSERT INTO certificate_required_lessons(definition_id,lesson_id)
SELECT d.id,cl.id FROM certificate_definitions d JOIN courses c ON c.slug='react-foundations'
JOIN course_modules cm ON cm.course_id=c.id JOIN course_lessons cl ON cl.module_id=cm.id AND cl.is_active=TRUE
WHERE d.slug='react-skill-pass-completion' ON CONFLICT DO NOTHING;

INSERT INTO certificate_required_quizzes(definition_id,quiz_id)
SELECT d.id,q.id FROM certificate_definitions d JOIN courses c ON c.slug='react-foundations'
JOIN quizzes q ON q.course_id=c.id WHERE d.slug='react-skill-pass-completion' ON CONFLICT DO NOTHING;

INSERT INTO certificate_required_projects(definition_id,project_id)
SELECT d.id,p.id FROM certificate_definitions d JOIN projects p ON p.slug IN('react-ecommerce-store','react-productivity-dashboard')
WHERE d.slug='react-skill-pass-completion' ON CONFLICT DO NOTHING;

INSERT INTO products(name,slug,description,status)
VALUES('React Skill Pass','react-skill-pass','Permanent access to the complete React course, final assessment, two portfolio projects, and completion certificate.','draft')
ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,status='draft';

INSERT INTO product_skills(product_id,skill_id)
SELECT p.id,s.id FROM products p JOIN skills s ON s.name='React' WHERE p.slug='react-skill-pass'
ON CONFLICT DO NOTHING;

INSERT INTO product_prices(product_id,currency,amount_minor,is_active)
SELECT id,'USD',2499,TRUE FROM products WHERE slug='react-skill-pass'
ON CONFLICT(product_id,currency) DO UPDATE SET amount_minor=EXCLUDED.amount_minor,is_active=TRUE;

INSERT INTO premium_content_rules(entity_type,entity_id,product_id)
SELECT x.entity_type,x.entity_id,p.id FROM products p CROSS JOIN LATERAL (
 SELECT 'course'::varchar AS entity_type,c.id AS entity_id FROM courses c WHERE c.slug='react-foundations'
 UNION ALL SELECT 'quiz',q.id FROM quizzes q JOIN courses c ON c.id=q.course_id WHERE c.slug='react-foundations'
 UNION ALL SELECT 'project',pr.id FROM projects pr WHERE pr.slug IN('react-ecommerce-store','react-productivity-dashboard')
 UNION ALL SELECT 'certificate',d.id FROM certificate_definitions d WHERE d.slug='react-skill-pass-completion'
) x WHERE p.slug='react-skill-pass'
ON CONFLICT(entity_type,entity_id,product_id) DO NOTHING;

COMMIT;
