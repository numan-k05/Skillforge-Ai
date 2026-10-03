BEGIN;

-- Complete the seven remaining starter tracks to the same commercial content
-- shape as React. Products remain drafts until production payments are ready.
CREATE TEMP TABLE sf_tracks (
  skill_name text, course_slug text PRIMARY KEY, course_title text, course_description text,
  difficulty text, estimated_hours integer, module_two text, module_three text, module_four text,
  quiz_description text, existing_project_slug text, new_project_title text,
  new_project_slug text, new_project_summary text, new_project_description text,
  certificate_title text, certificate_slug text, product_name text, product_slug text
) ON COMMIT DROP;

INSERT INTO sf_tracks VALUES
('JavaScript','javascript-foundations','JavaScript Skill Pass','Build dependable browser applications with modern JavaScript, asynchronous data, testing, security, and production delivery.','intermediate',24,'JavaScript language foundations','Browser applications and asynchronous data','Production JavaScript','JavaScript Skill Pass final assessment covering language behavior, browser APIs, async work, testing, security, and delivery.','interactive-javascript-dashboard','JavaScript Service Monitor','javascript-service-monitor','Build a resilient browser dashboard for monitoring service health.','Create a modular service monitor with remote-data states, accessible filters, safe rendering, retry behavior, tests, and a documented production build.','JavaScript Skill Pass Completion','javascript-skill-pass-completion','JavaScript Skill Pass','javascript-skill-pass'),
('Python','python-foundations','Python Skill Pass','Build maintainable Python programs for automation, data exchange, testing, command-line workflows, and reliable delivery.','intermediate',24,'Python language foundations','Files, APIs, and application design','Production Python','Python Skill Pass final assessment covering language behavior, files, APIs, design, tests, automation, and packaging.','python-automation-toolkit','Python Data Intake Pipeline','python-data-intake-pipeline','Build a validated pipeline that imports, cleans, and reports structured data.','Create a command-line pipeline with configuration, CSV and JSON input, validation, useful errors, logging, tests, and reproducible setup.','Python Skill Pass Completion','python-skill-pass-completion','Python Skill Pass','python-skill-pass'),
('SQL','sql-foundations','SQL Skill Pass','Design trustworthy relational data and write safe, explainable queries for applications, reporting, and analytics.','intermediate',24,'Querying relational data','Modeling, integrity, and transactions','Production SQL','SQL Skill Pass final assessment covering querying, modeling, transactions, indexes, analytics, security, and migrations.','sql-analytics-database','SQL Operations Reporting System','sql-operations-reporting-system','Design an operational database with reliable management reports.','Model a realistic workflow, enforce integrity, load sample data, write transactional changes and analytical reports, examine indexes, and document recovery decisions.','SQL Skill Pass Completion','sql-skill-pass-completion','SQL Skill Pass','sql-skill-pass'),
('Node.js','nodejs-foundations','Node.js Skill Pass','Build secure Node.js services with asynchronous workflows, validation, databases, testing, observability, and production controls.','intermediate',26,'Node.js runtime foundations','HTTP services and persistent data','Production Node.js','Node.js Skill Pass final assessment covering the runtime, HTTP APIs, validation, authentication, databases, testing, and operations.','student-platform-rest-api','Node.js Booking API','nodejs-booking-api','Build a secure booking API with transactional capacity control.','Create a versioned HTTP API with authentication, validation, ownership checks, database transactions, structured errors, tests, logging, and graceful shutdown.','Node.js Skill Pass Completion','nodejs-skill-pass-completion','Node.js Skill Pass','nodejs-skill-pass'),
('Git','git-foundations','Git Skill Pass','Use Git confidently for focused commits, collaboration, conflict resolution, safe history changes, releases, and recovery.','intermediate',18,'Git object and history foundations','Collaboration and controlled history changes','Production Git workflows','Git Skill Pass final assessment covering staging, history, branches, remotes, conflict resolution, recovery, reviews, and releases.','react-ecommerce-store','Git Collaboration Lab','git-collaboration-lab','Demonstrate a reviewable team workflow through a realistic repository history.','Create a repository with feature branches, focused commits, a documented conflict resolution, reviewed changes, a tagged release, and recovery evidence.','Git Skill Pass Completion','git-skill-pass-completion','Git Skill Pass','git-skill-pass'),
('Data Structures & Algorithms','data-structures-algorithms-foundations','Data Structures and Algorithms Skill Pass','Select, implement, analyze, and test core data structures and algorithms for practical software problems.','intermediate',28,'Complexity and linear structures','Trees, heaps, and graphs','Algorithm design and verification','Data Structures and Algorithms Skill Pass final assessment covering complexity, linear structures, trees, heaps, graphs, searching, sorting, and dynamic programming.','game-development-mini-game','Algorithm Route Planner','algorithm-route-planner','Build and compare route-search algorithms on weighted graphs.','Implement graph representations, breadth-first and weighted search, unreachable-state handling, complexity notes, deterministic tests, and a small results interface.','Data Structures and Algorithms Skill Pass Completion','data-structures-algorithms-skill-pass-completion','Data Structures and Algorithms Skill Pass','data-structures-algorithms-skill-pass'),
('HTML/CSS','html-css-foundations','HTML and CSS Skill Pass','Create semantic, accessible, responsive interfaces with resilient layouts, usable forms, tested states, and efficient delivery.','intermediate',22,'Semantic and accessible HTML','CSS layout and responsive design','Production interface quality','HTML and CSS Skill Pass final assessment covering semantics, forms, accessibility, cascade, layout, responsiveness, motion, testing, and performance.','responsive-portfolio-website','Accessible Product Landing Site','accessible-product-landing-site','Build a responsive product site that works across input modes and screen sizes.','Create semantic pages, accessible navigation and forms, reusable layout styles, responsive media, clear interaction states, reduced-motion support, and a performance report.','HTML and CSS Skill Pass Completion','html-css-skill-pass-completion','HTML and CSS Skill Pass','html-css-skill-pass');

UPDATE courses c SET title=t.course_title,description=t.course_description,difficulty=t.difficulty,
  estimated_hours=t.estimated_hours,is_premium=TRUE
FROM sf_tracks t WHERE c.slug=t.course_slug;

UPDATE course_lessons cl SET is_preview=TRUE
FROM course_modules cm JOIN courses c ON c.id=cm.course_id JOIN sf_tracks t ON t.course_slug=c.slug
WHERE cl.module_id=cm.id AND cm.position=1 AND cl.position=1;

INSERT INTO course_modules(course_id,title,description,position)
SELECT c.id,m.title,m.description,m.position FROM courses c JOIN sf_tracks t ON t.course_slug=c.slug
CROSS JOIN LATERAL (VALUES
  (t.module_two,'Learn the core concepts and practice them deliberately.',2),
  (t.module_three,'Apply the skill to realistic data, interfaces, and workflows.',3),
  (t.module_four,'Test, secure, optimize, document, and deliver production-quality work.',4)
) m(title,description,position)
ON CONFLICT(course_id,position) DO NOTHING;

CREATE TEMP TABLE sf_lessons (
  course_slug text, module_position integer, position integer, title text,
  summary text, concepts text, practice text
) ON COMMIT DROP;

INSERT INTO sf_lessons VALUES
('javascript-foundations',2,1,'Values, types, and coercion','Reason about JavaScript values without relying on surprising conversions.','Distinguish primitives from references, prefer strict equality, and convert external strings explicitly before arithmetic or comparison.','Build a small input normalizer and test empty, numeric, boolean, null, and invalid values.'),
('javascript-foundations',2,2,'Functions, scope, and closures','Create focused functions and understand how lexical scope preserves values.','Use parameters and return values as contracts, keep mutation visible, and use closures only when retained state has a clear owner.','Implement configurable validators and explain which variables each returned function captures.'),
('javascript-foundations',2,3,'Arrays, objects, and immutable updates','Transform collections while preserving predictable data ownership.','Use map, filter, reduce, destructuring, and spread deliberately; avoid accidental shared-reference mutation.','Create an inventory update module that never changes its input records and cover boundary cases.'),
('javascript-foundations',3,1,'DOM structure and accessible events','Connect behavior to semantic browser controls.','Query stable elements, use event delegation where appropriate, and preserve native keyboard and form behavior.','Build a filterable list using a form, buttons, status message, and keyboard-accessible controls.'),
('javascript-foundations',3,2,'Promises, async functions, and fetch','Coordinate asynchronous work and model every remote-data state.','Await promises inside controlled error boundaries, check HTTP status, parse expected data, and cancel obsolete requests.','Load paged data with loading, empty, failure, retry, and request-cancellation behavior.'),
('javascript-foundations',3,3,'Validation and error boundaries','Reject invalid data early and return useful failures.','Validate untrusted input at boundaries, separate expected errors from defects, and avoid exposing sensitive internals.','Parse an API response through a validator and present field errors without discarding safe input.'),
('javascript-foundations',3,4,'Modules and build tooling','Organize code into explicit modules and understand the build boundary.','Keep modules cohesive, avoid circular dependencies, separate public configuration from secrets, and inspect generated output.','Split an application into data, domain, and interface modules, then produce and inspect a production build.'),
('javascript-foundations',4,1,'Testing observable behavior','Protect important outcomes with focused automated tests.','Test pure functions at boundaries and exercise interfaces through public behavior instead of private implementation details.','Cover collection transforms, failed requests, form validation, and one end-to-end user flow.'),
('javascript-foundations',4,2,'Debugging and browser performance','Use evidence to locate faults and expensive work.','Read the first relevant stack frame, inspect network and performance tools, reduce reproductions, and measure before optimizing.','Profile a slow interaction, document the cause, apply one improvement, and compare measurements.'),
('javascript-foundations',4,3,'Browser security boundaries','Treat rendered content, storage, and network data as untrusted boundaries.','Avoid unsafe HTML injection, keep secrets off the client, use secure server authorization, and constrain external URLs.','Audit a dashboard for injection, insecure storage, missing ownership checks, and unsafe external links.'),
('javascript-foundations',4,4,'Production delivery and resilience','Ship a build that handles real runtime conditions.','Use environment-specific public configuration, cache intentionally, provide error states, and verify routes on the deployed host.','Create a deployment checklist and test refresh, offline failure, narrow screens, and stale API responses.'),

('python-foundations',2,1,'Values, expressions, and Python style','Write readable expressions with predictable types and names.','Understand truth values, numeric behavior, strings, None, and the difference between identity and equality; follow consistent formatting.','Implement a configuration parser and test missing, malformed, and valid values.'),
('python-foundations',2,2,'Functions, scope, and contracts','Design small functions with clear inputs and outputs.','Use default arguments safely, return explicit results, apply type hints as communication, and avoid hidden global mutation.','Build a set of typed pricing functions with validation and boundary tests.'),
('python-foundations',2,3,'Collections and comprehensions','Choose the right collection and transform it clearly.','Use lists for order, tuples for fixed records, sets for membership, and dictionaries for keyed lookup; keep comprehensions readable.','Aggregate duplicate records, retain stable ordering, and report rejected entries.'),
('python-foundations',3,1,'Files, paths, and context managers','Handle local resources safely across platforms.','Use pathlib, explicit encodings, context managers, and atomic replacement when partial writes would corrupt data.','Import a UTF-8 CSV file and write a validated JSON summary without leaking open handles.'),
('python-foundations',3,2,'Exceptions and validation','Turn expected failures into precise, recoverable messages.','Catch only exceptions you can handle, preserve causes, validate at system boundaries, and use finally for necessary cleanup.','Create a loader that distinguishes missing files, invalid data, and unexpected defects.'),
('python-foundations',3,3,'Modules, environments, and dependencies','Make execution and dependencies reproducible.','Separate packages by responsibility, use virtual environments, pin direct dependencies appropriately, and keep secrets outside source.','Create a package layout with a clean entry point, environment template, and reproducible install instructions.'),
('python-foundations',3,4,'HTTP and JSON integrations','Consume remote APIs defensively.','Set timeouts, check status codes, validate response shapes, limit retries, and avoid logging credentials or personal data.','Build an API client with pagination, timeout handling, bounded retry, and fixture-based tests.'),
('python-foundations',4,1,'Classes, dataclasses, and composition','Use objects when they clarify state and behavior.','Prefer simple functions and data first, use dataclasses for records, and compose focused collaborators instead of deep inheritance.','Model a processing job with immutable configuration and replaceable input and output adapters.'),
('python-foundations',4,2,'Testing and debugging Python','Create deterministic tests that explain failures.','Test public behavior, isolate network and clock boundaries, use temporary directories, and read tracebacks from the failure origin.','Cover a command-line workflow, invalid input, an API timeout, and file cleanup.'),
('python-foundations',4,3,'Command-line automation and logging','Build automation that can be operated safely.','Use explicit arguments, meaningful exit codes, idempotent operations, structured logging, and dry-run behavior for risky changes.','Create a batch-processing command with help text, dry run, progress logs, and a failure report.'),
('python-foundations',4,4,'Packaging and delivery','Deliver a Python tool with repeatable configuration and verification.','Define package metadata, expose a console entry point, document supported versions, and verify installation in a clean environment.','Build the package, install it into a fresh environment, run smoke tests, and document release steps.'),

('sql-foundations',2,1,'Selecting, filtering, and ordering rows','Write deterministic queries that return only needed data.','Select explicit columns, handle NULL with three-valued logic, combine predicates carefully, and order results when order matters.','Query a customer dataset with date, status, and text filters plus stable pagination ordering.'),
('sql-foundations',2,2,'Joins and relational relationships','Combine tables without losing or multiplying rows unexpectedly.','Choose inner or outer joins by the required result, join on keys, and check relationship cardinality before aggregation.','Produce an order report that includes customers with no orders and verifies row counts.'),
('sql-foundations',2,3,'Aggregation and grouping','Summarize data at an explicit grain.','Define one output row grain, use WHERE before grouping and HAVING after grouping, and avoid selecting columns outside that grain.','Build monthly revenue and customer-count reports with correct zero and NULL handling.'),
('sql-foundations',3,1,'Subqueries and common table expressions','Break complex data logic into testable relational steps.','Use EXISTS for membership, correlated subqueries deliberately, and CTEs to name meaningful transformations without assuming optimization behavior.','Find customers above their regional average and validate each intermediate relation.'),
('sql-foundations',3,2,'Data modeling and normalization','Represent entities and relationships with minimal duplication.','Choose stable keys, separate repeating groups, model many-to-many relationships explicitly, and denormalize only for measured reasons.','Design an event-registration schema through third normal form and state every cardinality.'),
('sql-foundations',3,3,'Constraints and transactions','Let the database protect important invariants.','Use NOT NULL, UNIQUE, CHECK, and foreign keys; group dependent writes in a transaction with appropriate locking.','Implement a capacity-limited booking transaction that cannot oversell under concurrency.'),
('sql-foundations',3,4,'Safe data modification','Change data precisely and verify the affected set.','Preview predicates with SELECT, use transactions, parameterize values, and prefer migrations over untracked manual edits.','Write reversible insert, update, and delete operations for a controlled data-cleanup task.'),
('sql-foundations',4,1,'Indexes and query plans','Improve measured queries while understanding write costs.','Read explain plans, index selective access and join patterns, understand composite-column order, and remove redundant indexes.','Compare a report before and after one justified index using representative data.'),
('sql-foundations',4,2,'Window functions and analytics','Calculate rankings and running measures without collapsing detail rows.','Use partitions and ordering explicitly, distinguish row and range frames, and select ranking functions according to tie behavior.','Create customer rankings, running totals, and previous-period comparisons.'),
('sql-foundations',4,3,'SQL security and permissions','Keep untrusted input and excessive privilege away from data.','Use parameters instead of string-built SQL, grant minimum privileges, protect backups, and separate application and migration roles.','Audit an application query path for injection and design least-privilege role grants.'),
('sql-foundations',4,4,'Migrations, backup, and delivery','Evolve schemas without losing recoverability.','Make migrations ordered and reviewable, plan compatibility during deployment, test restoration, and monitor long-running changes.','Prepare a migration with rollback or forward recovery, rehearse it on a clean database, and document restore evidence.'),

('nodejs-foundations',2,1,'Runtime, modules, and configuration','Understand the Node.js process and keep configuration explicit.','Use modern modules consistently, validate environment values at startup, and distinguish public settings from server secrets.','Create a service entry point that rejects invalid configuration before opening a port.'),
('nodejs-foundations',2,2,'The event loop and asynchronous work','Keep concurrent work responsive and bounded.','Await I/O, avoid blocking CPU work on the request path, handle rejected promises, and limit uncontrolled parallel operations.','Compare sequential, bounded-parallel, and blocking work with measured response behavior.'),
('nodejs-foundations',2,3,'Files, buffers, and streams','Process data without loading unbounded input into memory.','Use streams with backpressure, constrain upload sizes, normalize paths, and close resources on failure.','Build a streamed CSV import with size limits, row validation, and cleanup.'),
('nodejs-foundations',3,1,'HTTP routing and API contracts','Design stable resources, methods, statuses, and response shapes.','Separate routing from domain work, validate parameters and bodies, use accurate status codes, and return consistent JSON errors.','Implement versioned CRUD endpoints with pagination and a documented error contract.'),
('nodejs-foundations',3,2,'Validation and centralized errors','Reject bad requests consistently without leaking internals.','Parse all external input with schemas, distinguish operational errors from defects, and centralize safe error translation.','Add field validation, not-found handling, conflict responses, and a generic server-error test.'),
('nodejs-foundations',3,3,'Authentication and authorization','Enforce identity, roles, and ownership on the server.','Verify signed tokens with fixed algorithms, read current roles from trusted storage, scope records by owner, and rate-limit sensitive routes.','Protect account and project routes against missing, expired, altered, cross-user, and wrong-role requests.'),
('nodejs-foundations',3,4,'Database transactions and concurrency','Keep related writes consistent under failure and retries.','Use parameterized queries, transactions, row locks or constraints for contention, idempotency for repeated events, and reliable client release.','Implement a booking write that survives duplicate requests and concurrent capacity claims.'),
('nodejs-foundations',4,1,'API testing strategy','Test the behavior at security and persistence boundaries.','Cover success, validation, authentication, authorization, ownership, rollback, and redacted unexpected errors with isolated data.','Build integration tests for registration and one protected transactional resource.'),
('nodejs-foundations',4,2,'Logging and observability','Produce useful operational evidence without exposing secrets.','Use structured logs, request correlation, redaction, bounded metadata, health checks, and metrics tied to user outcomes.','Add request logs and demonstrate that passwords, tokens, and payout destinations are absent.'),
('nodejs-foundations',4,3,'Performance and capacity','Measure bottlenecks and protect finite resources.','Inspect latency percentiles, database plans, connection pools, payload size, caching, and backpressure before scaling.','Load-test one endpoint, identify its limit, change one bottleneck, and compare results.'),
('nodejs-foundations',4,4,'Production lifecycle','Start, serve, and stop a service predictably.','Use security headers and exact CORS origins, trust proxies explicitly, handle termination signals, stop accepting work, and close resources.','Run a production-mode smoke test and verify graceful shutdown during an active request.'),

('git-foundations',2,1,'Working tree, staging, and commits','Understand where changes live before they become history.','Distinguish working-tree, index, and committed content; stage intentionally and create focused commits with useful messages.','Split a mixed change into two reviewable commits and verify each staged diff.'),
('git-foundations',2,2,'Inspecting diffs and history','Use repository evidence to understand what changed and why.','Read unstaged and staged diffs, filter log history, inspect a commit, and use blame as a starting point rather than proof.','Trace a behavior across three commits and write a short evidence-based explanation.'),
('git-foundations',2,3,'Branches and merges','Develop isolated work and combine it with explicit history.','Create short-lived branches, understand fast-forward and merge commits, and update from the target branch before review when required.','Build two independent features and merge them while preserving a clear history.'),
('git-foundations',3,1,'Remotes, fetch, pull, and push','Synchronize repositories without confusing local and remote state.','Fetch before inspecting remote work, understand tracking branches, review before pull, and avoid force-updating shared branches.','Clone a repository, track a feature branch, inspect remote changes, and push safely.'),
('git-foundations',3,2,'Conflict resolution','Resolve content conflicts by understanding both intended changes.','Read conflict markers, compare base and sides, run validation after editing, and commit a resolution that preserves required behavior.','Create and resolve a realistic conflict, then document the decision and test evidence.'),
('git-foundations',3,3,'Rebase and cherry-pick','Move selected history only when the collaboration policy allows it.','Rebase private branches to clarify history, cherry-pick isolated commits carefully, and never rewrite shared work without coordination.','Rebase a local feature, resolve a conflict, and compare commit identities before and after.'),
('git-foundations',3,4,'Safe undo operations','Choose an undo tool according to whether history is shared.','Use restore for files, reset for local pointers and index state, revert for published commits, and inspect before destructive modes.','Recover from staged changes, an unwanted local commit, and a published defect using the appropriate command.'),
('git-foundations',4,1,'Ignore rules, attributes, and line endings','Keep generated files and platform differences out of review noise.','Write scoped ignore rules, track example configuration rather than secrets, and use attributes for stable text handling.','Clean a repository containing build output, local configuration, and mixed line endings.'),
('git-foundations',4,2,'Pull requests and review workflow','Present changes so another person can assess them efficiently.','Keep scope focused, explain behavior and validation, respond with new commits, and resolve feedback without hiding discussion.','Prepare a pull request with a concrete description, tests, and a small review correction.'),
('git-foundations',4,3,'Tags and releases','Mark meaningful versions with traceable release evidence.','Prefer annotated tags for releases, build from reviewed commits, publish notes, and avoid silently moving released tags.','Create a semantic version tag and release notes from a verified commit.'),
('git-foundations',4,4,'Recovery, reflog, and secret response','Recover reachable work and respond correctly to exposed credentials.','Use reflog to locate moved references, create a rescue branch before experimentation, and rotate exposed secrets because history deletion alone is insufficient.','Recover a discarded commit in a sandbox and document a complete credential-rotation response.'),

('data-structures-algorithms-foundations',2,1,'Complexity and growth rates','Compare solutions by how time and memory grow with input.','Use Big O for upper-bound growth, define the input size, distinguish average and worst cases, and include auxiliary space.','Analyze two duplicate-detection approaches and confirm the prediction with increasing input sizes.'),
('data-structures-algorithms-foundations',2,2,'Arrays and strings','Use contiguous indexed data and recognize its operation costs.','Index access is constant time, while middle insertion often shifts elements; two-pointer and sliding-window patterns can avoid nested work.','Implement a longest-valid-window problem with explicit invariants and boundary tests.'),
('data-structures-algorithms-foundations',2,3,'Linked lists','Manage ordered nodes when local insertion matters more than random access.','Track head and tail invariants, handle empty and single-node cases, and use slow and fast pointers for cycle reasoning.','Implement insertion, removal, reversal, and cycle detection with structural tests.'),
('data-structures-algorithms-foundations',3,1,'Stacks and queues','Model last-in-first-out and first-in-first-out workflows.','Use stacks for nested structure and undo, queues for fair processing and breadth-first exploration, and deques for both ends.','Build a balanced-delimiter validator and a bounded task queue.'),
('data-structures-algorithms-foundations',3,2,'Hash tables and sets','Trade extra memory for expected constant-time keyed access.','Choose stable keys, handle collisions through the implementation, and remember that worst-case behavior and ordering guarantees vary.','Implement frequency counting and a cache lookup, then test duplicate and collision-like cases.'),
('data-structures-algorithms-foundations',3,3,'Recursion and backtracking','Explore recursive structure with a clear base case and reversible choices.','Define progress toward termination, track stack depth, prune impossible branches, and undo mutable choices before returning.','Generate constrained combinations and verify that pruning preserves every valid solution.'),
('data-structures-algorithms-foundations',3,4,'Trees and binary search trees','Traverse hierarchical data and preserve ordering invariants.','Use depth-first or breadth-first traversal according to the goal; BST operations depend on balance and duplicate policy.','Implement traversals, search, insertion, and height calculation for empty and skewed trees.'),
('data-structures-algorithms-foundations',4,1,'Heaps and priority queues','Retrieve the next highest-priority item efficiently.','A heap maintains a partial order with logarithmic insertion and removal; it does not keep every element fully sorted.','Build a scheduler and solve a top-k problem without sorting the complete input.'),
('data-structures-algorithms-foundations',4,2,'Graphs and traversal','Represent networks and explore reachable vertices safely.','Choose adjacency lists for sparse graphs, track visited state, use BFS for unweighted shortest paths, and DFS for structural exploration.','Find connected components and reconstruct an unweighted shortest route.'),
('data-structures-algorithms-foundations',4,3,'Searching and sorting','Match algorithm guarantees to data properties and stability needs.','Binary search requires a monotonic condition, comparison sorting has common lower bounds, and stable ordering can matter for multi-key data.','Implement binary search and compare two sorting strategies on varied input shapes.'),
('data-structures-algorithms-foundations',4,4,'Dynamic programming and verification','Reuse overlapping subproblem results after defining the state precisely.','Specify state, transition, base cases, and evaluation order; choose memoization or tabulation and prove coverage.','Solve a minimum-cost path problem, reconstruct the solution, and test unreachable states.'),

('html-css-foundations',2,1,'Semantic document structure','Choose HTML elements by meaning and navigation structure.','Use landmarks, one descriptive page heading, logical subsections, lists for lists, and links for destinations instead of styling generic containers.','Build an article page and verify its heading and landmark outline without CSS.'),
('html-css-foundations',2,2,'Accessible forms and validation','Connect every control to clear instructions and recoverable errors.','Use labels, fieldsets, correct input types, autocomplete, described hints, and server-backed validation; preserve native keyboard behavior.','Create a signup form with field errors, a summary, focus guidance, and disabled-state restraint.'),
('html-css-foundations',2,3,'Keyboard, focus, and media alternatives','Make content and controls usable across input and perception modes.','Maintain logical DOM order, visible focus, meaningful alternative text, captions where needed, and skip navigation for repeated regions.','Audit navigation, a dialog, images, and a data table using keyboard and accessibility tools.'),
('html-css-foundations',3,1,'Cascade, inheritance, and specificity','Predict which declaration wins and keep overrides manageable.','Understand origin, importance, layers, specificity, and source order; use low-specificity component rules and intentional design tokens.','Refactor a conflicting stylesheet so states and themes work without important flags.'),
('html-css-foundations',3,2,'Box model, flow, and positioning','Use normal flow as the stable base for layout.','Account for content, padding, border, and margin; understand block and inline flow, containing blocks, overflow, and positioned elements.','Build a card and sticky header that remain usable with long text and zoom.'),
('html-css-foundations',3,3,'Flexible one-dimensional layouts','Use flexbox for aligned rows or columns with resilient wrapping.','Set growth, shrink, basis, gaps, alignment, and wrapping deliberately; allow children to shrink when content demands it.','Create a responsive toolbar and card row that handle translations and narrow widths.'),
('html-css-foundations',3,4,'Grid and two-dimensional layouts','Define page and component grids without coupling content to device assumptions.','Use explicit and implicit tracks, minmax, auto-fit, named areas, and intrinsic sizing while preserving source order.','Build a dashboard grid that adapts from one column to a wide layout without hiding content.'),
('html-css-foundations',4,1,'Responsive and container-aware design','Adapt to available space, content, user settings, and input capabilities.','Start from a small layout, add content-driven breakpoints, constrain readable lines, size media fluidly, and use container queries when components need local context.','Test a product page at zoom, narrow widths, landscape, and long translated content.'),
('html-css-foundations',4,2,'Typography, color, and visual states','Create readable hierarchy and communicate states beyond color.','Use a consistent type scale, comfortable line height, sufficient contrast, visible hover and focus states, and icons or text alongside color.','Create a token-based theme and verify body text, controls, errors, and disabled states.'),
('html-css-foundations',4,3,'Motion and interaction resilience','Add motion only when it supports understanding.','Animate composite-friendly properties, avoid layout-triggering effects, honor reduced-motion preferences, and never make essential actions hover-only.','Build an expandable panel and notification transition with reduced-motion behavior.'),
('html-css-foundations',4,4,'Testing, performance, and delivery','Verify interface quality in production conditions.','Test semantics, keyboard flow, contrast, responsive overflow, print or zoom needs, asset size, font loading, and critical rendering behavior.','Run an accessibility and performance audit, fix the highest-impact findings, and document before-and-after evidence.');

INSERT INTO course_lessons(module_id,title,summary,content,lesson_type,estimated_minutes,position,is_preview,is_active)
SELECT cm.id,l.title,l.summary,
  l.summary||E'\n\nCore ideas: '||l.concepts||E'\n\nPractice: '||l.practice,
  'practice',90,l.position,FALSE,TRUE
FROM sf_lessons l JOIN courses c ON c.slug=l.course_slug
JOIN course_modules cm ON cm.course_id=c.id AND cm.position=l.module_position
ON CONFLICT(module_id,position) DO NOTHING;

-- Publish a stable twelve-question final for every completed track.
UPDATE quiz_versions qv SET status='retired'
FROM quizzes q JOIN courses c ON c.id=q.course_id JOIN sf_tracks t ON t.course_slug=c.slug
WHERE qv.quiz_id=q.id AND qv.status='published';

INSERT INTO quiz_versions(quiz_id,version,description,pass_percent,max_attempts,cooldown_minutes,status,published_at)
SELECT q.id,2,t.quiz_description,75,5,30,'published',now()
FROM sf_tracks t JOIN courses c ON c.slug=t.course_slug JOIN quizzes q ON q.course_id=c.id
ON CONFLICT(quiz_id,version) DO UPDATE SET description=EXCLUDED.description,pass_percent=75,
  max_attempts=5,cooldown_minutes=30,status='published',published_at=COALESCE(quiz_versions.published_at,now());

CREATE TEMP TABLE sf_questions (
  course_slug text, position integer, prompt text, explanation text,
  correct text, wrong_one text, wrong_two text, wrong_three text
) ON COMMIT DROP;

INSERT INTO sf_questions VALUES
('javascript-foundations',1,'Why is strict equality normally preferred for application comparisons?','It avoids implicit type conversion during comparison.','It compares without coercing the operands','It converts both operands to strings','It compares only object property names','It makes every object equal'),
('javascript-foundations',2,'What does a closure allow a function to do?','Lexical scope remains available to the returned function.','Retain access to variables from its creation scope','Bypass all module boundaries','Change a constant binding directly','Run without being called'),
('javascript-foundations',3,'Which operation creates a transformed array without changing the source array?','Map returns a new array from the callback results.','Calling map and returning each transformed item','Assigning new values directly to every source index','Calling sort on the source array','Changing objects through a shared reference'),
('javascript-foundations',4,'Which element should trigger a form submission?','Native controls provide built-in semantics and keyboard behavior.','A button with type submit','A div with a click handler','A paragraph with tabindex','An anchor without href'),
('javascript-foundations',5,'What must a fetch client check before treating an HTTP response as successful?','Fetch can resolve even when the server returns an error status.','The response status or ok value','Only that JSON parsing completed','Only the request URL length','Whether the response arrived within one second'),
('javascript-foundations',6,'How can rapidly changing requests avoid displaying stale results?','Cancellation or an active request guard prevents an older response from winning.','Abort or ignore the obsolete request','Remove all effect dependencies','Store every response in localStorage','Reload after each selection'),
('javascript-foundations',7,'Where should data from an API be validated?','Network data is untrusted at the boundary where it enters the application.','Before domain code relies on its shape','Only after it has been rendered','Only when the server status is 500','Inside CSS selectors'),
('javascript-foundations',8,'Where should a private API credential be stored?','Browser bundles can be inspected and must not contain private credentials.','On a trusted server outside the frontend bundle','In a client variable with a long name','In browser localStorage','Inside a source map'),
('javascript-foundations',9,'Which test best protects a user outcome?','Public interaction tests remain useful after internal refactoring.','Submit the form and assert the visible success state','Assert the name of an internal variable','Snapshot every generated class','Call a component helper indirectly'),
('javascript-foundations',10,'What is the first step in JavaScript performance work?','Measurement identifies whether and where optimization matters.','Measure the slow user interaction','Memoize every function','Remove all error handling','Replace every loop with recursion'),
('javascript-foundations',11,'How should untrusted plain text normally be inserted into the DOM?','Text insertion avoids interpreting the value as markup.','Use textContent or an equivalent text binding','Concatenate it into innerHTML','Evaluate it as JavaScript','Put it in a script element'),
('javascript-foundations',12,'What should be checked after a successful production build?','Compilation alone does not verify runtime behavior.','Routes, data states, accessibility, and deployed configuration','Only the build directory name','Only the source file count','Only the development port'),

('python-foundations',1,'When should Python identity comparison be used?','Identity asks whether two references point to the same object.','For singleton checks such as value is None','For comparing the contents of two user strings','For every numeric comparison','For sorting a list'),
('python-foundations',2,'Why should a mutable list usually not be a function default value?','The same default object is reused across calls.','Later calls can observe mutations from earlier calls','Lists cannot be passed to functions','Default values are always strings','Python deletes it after the first call'),
('python-foundations',3,'Which collection is suited to fast membership checks with unique values?','A set models unique membership with expected constant-time lookup.','A set','A formatted string','A file handle','A generator already exhausted'),
('python-foundations',4,'Why use a context manager when opening a file?','The resource is closed reliably when the block exits.','It guarantees cleanup on success or failure','It converts every file to JSON','It disables file permissions','It stores the file in memory forever'),
('python-foundations',5,'Which exception-handling approach is most maintainable?','Narrow handlers avoid hiding unrelated defects.','Catch the specific failure that can be handled','Catch every exception and ignore it','Use exceptions for normal loop control everywhere','Replace errors with empty output'),
('python-foundations',6,'What does a virtual environment primarily provide?','It isolates installed project dependencies from other environments.','A project-specific dependency environment','Automatic database backups','A public hosting account','A replacement for source control'),
('python-foundations',7,'What should every outbound HTTP request normally include?','A timeout prevents indefinite waiting on an unavailable dependency.','A bounded timeout','A hard-coded production password','An unlimited retry loop','A disabled status check'),
('python-foundations',8,'When is a dataclass a useful choice?','It reduces boilerplate for a record with named fields.','Representing structured data with clear fields','Executing arbitrary downloaded code','Replacing every standalone function','Managing an open network socket automatically'),
('python-foundations',9,'How should tests handle filesystem output?','Temporary directories isolate files and are cleaned after the test.','Write into a test-owned temporary directory','Write into the user home directory','Depend on files from a previous run','Skip assertions when a file exists'),
('python-foundations',10,'What should a command-line tool return after invalid input?','A nonzero exit status lets automation detect failure.','A documented nonzero exit code and useful message','A success code with no output','The input credentials in a traceback','An endless interactive prompt'),
('python-foundations',11,'What must application logs omit?','Logs often leave the process and require deliberate redaction.','Passwords, tokens, and private destinations','Operation names','Safe record counts','A request correlation identifier'),
('python-foundations',12,'How can packaging be verified most reliably?','A clean environment exposes undeclared dependencies and setup assumptions.','Install and test the artifact in a fresh environment','Run only from the source checkout','Import dependencies from a global environment','Rename the package file'),

('sql-foundations',1,'How should a query test whether a column has no value?','NULL participates in three-valued logic and is tested explicitly.','Use IS NULL','Use equals NULL','Compare it with an empty string only','Sort the table first'),
('sql-foundations',2,'Which join retains every row from the left table?','A left join supplies NULL values where no right-side match exists.','LEFT JOIN','INNER JOIN','CROSS JOIN','A self join without a condition'),
('sql-foundations',3,'When should HAVING be used?','HAVING filters groups after aggregation.','To filter grouped aggregate results','To rename a selected column','To create a foreign key','To begin a transaction'),
('sql-foundations',4,'Which construct clearly tests whether a related row exists?','EXISTS expresses membership without multiplying result rows.','EXISTS with a correlated condition','A cross join followed by no predicate','A random ordering expression','A string concatenation'),
('sql-foundations',5,'How should a many-to-many relationship be modeled?','A junction table stores one row for each relationship pair.','With a junction table containing both foreign keys','With comma-separated identifiers in one column','By duplicating both tables','With one nullable text field'),
('sql-foundations',6,'Why wrap dependent writes in one transaction?','They should commit together or roll back together.','To preserve atomicity when any step fails','To make constraints optional','To expose partial results immediately','To convert all values to text'),
('sql-foundations',7,'How should application values be included in SQL?','Parameters separate data from the SQL command structure.','Through parameterized queries','By concatenating raw user input','By accepting only short strings','By hiding the query in frontend code'),
('sql-foundations',8,'What affects whether a composite index supports a query?','Column order must match useful filtering and ordering patterns.','The indexed column order and query pattern','The table name length','The number of SELECT keywords','The client screen size'),
('sql-foundations',9,'What do window functions preserve that GROUP BY normally does not?','They calculate across related rows while retaining row detail.','Individual detail rows','Only table constraints','Database user passwords','Migration file names'),
('sql-foundations',10,'What is least-privilege database access?','Each role receives only permissions required for its work.','Granting only the necessary operations and objects','Giving every application an owner role','Sharing the migration password with clients','Disabling authentication for read queries'),
('sql-foundations',11,'What should a production schema migration consider?','Mixed application versions may run during rollout.','Compatibility, locking, recovery, and deployment order','Only how short the SQL file is','Only the local sample data','Only the editor used to write it'),
('sql-foundations',12,'What proves that a backup is usable?','A successful restore rehearsal verifies recovery behavior.','Restoring it and validating the recovered data','The backup command printed no warning','The filename contains a date','The compressed file is small'),

('nodejs-foundations',1,'When should required environment configuration be validated?','Startup validation fails early before the service accepts work.','Before opening the server port','After the first customer request','Only during frontend compilation','Only when an error is logged'),
('nodejs-foundations',2,'Why is CPU-heavy synchronous work risky in a request handler?','It blocks the event loop and delays unrelated requests.','It can block all requests handled by that process','It always improves throughput','It automatically moves to another thread','It closes the database safely'),
('nodejs-foundations',3,'Why use streams for large files?','Backpressure allows bounded memory processing.','They process chunks without loading the complete file','They remove the need for size limits','They make every file trusted','They encrypt content automatically'),
('nodejs-foundations',4,'Which status is appropriate after creating a new resource?','HTTP 201 communicates successful creation.','201 Created','200 for every response','404 Not Found','500 Internal Server Error'),
('nodejs-foundations',5,'What should a centralized error handler do with unexpected errors?','It should log safe context while returning a generic public response.','Return a generic error without leaking internals','Return the database stack to the client','Include environment secrets for debugging','Change the response to HTML randomly'),
('nodejs-foundations',6,'Where must ownership authorization be enforced?','Client controls are bypassable, so the server must scope access.','In the backend query or service boundary','Only by hiding the frontend button','Only in browser storage','Only in marketing navigation'),
('nodejs-foundations',7,'What protects a group of dependent database writes?','A transaction preserves all-or-nothing behavior.','A transaction with reliable rollback','A longer URL','A client-side animation','A global array'),
('nodejs-foundations',8,'What is the purpose of an idempotency control?','A repeated request should not repeat the business effect.','Prevent duplicate effects from safe retries','Allow every request to bypass validation','Make passwords reversible','Disable database constraints'),
('nodejs-foundations',9,'Which API test is security-relevant?','Protected resources must reject invalid identity and cross-user access.','Verify missing tokens and another users identifier are rejected','Assert a private function name','Snapshot only whitespace','Skip database failure behavior'),
('nodejs-foundations',10,'Which values require log redaction?','Credentials and private destinations must not enter durable logs.','Tokens, passwords, and payout destinations','Public route names','HTTP method names','Bounded response timings'),
('nodejs-foundations',11,'What can happen when a connection pool is exhausted?','Requests wait or fail because no database connection is available.','Database-dependent latency rises and requests may time out','Every query becomes a cache hit','The event loop stops using memory','The browser fixes the pool automatically'),
('nodejs-foundations',12,'What is part of graceful shutdown?','The process stops new work and lets active operations finish within a bound.','Stop accepting requests and close resources safely','Terminate in the middle of every write','Delete application data','Ignore termination signals'),

('git-foundations',1,'What is the Git index?','The index holds the exact content planned for the next commit.','The staging area for the next commit','A list of remote hosting providers','A deleted branch archive','A production deployment server'),
('git-foundations',2,'Which command conceptually inspects staged changes?','The cached diff compares the index with the current commit.','A diff of the index against HEAD','A network fetch','A branch deletion','A tag signature only'),
('git-foundations',3,'Why use a short-lived feature branch?','It isolates focused work for integration and review.','To develop a scoped change away from the target branch','To replace every commit with one file','To avoid testing before merge','To store unencrypted secrets'),
('git-foundations',4,'What does fetch do?','Fetch updates remote-tracking data without merging into the current branch.','Downloads remote objects and references without integrating them','Deletes every local branch','Pushes local commits automatically','Rewrites published tags'),
('git-foundations',5,'What should guide conflict resolution?','The resolver must understand both intended behaviors and validate the result.','The required combined behavior and its tests','Always choosing the current side','Always choosing the incoming side','Removing every conflicted file'),
('git-foundations',6,'Where is rebasing normally safest?','Private unpublished history can be rewritten without disrupting collaborators.','On a local branch that others do not depend on','On a shared protected branch without coordination','On every released tag','On an unrelated remote repository'),
('git-foundations',7,'How should an unwanted published commit usually be undone?','Revert adds a new commit that reverses the old change without rewriting shared history.','Create a revert commit','Delete the remote repository','Reset every collaborators branch','Move the release tag silently'),
('git-foundations',8,'What happens when a tracked file is added to gitignore?','Ignore rules do not automatically remove files already tracked.','It remains tracked until explicitly removed from the index','Its history is encrypted','It is deleted from every clone','It becomes a remote branch'),
('git-foundations',9,'What makes a change easier to review?','Focused scope and explicit validation reduce reviewer uncertainty.','Small coherent commits with behavior and test evidence','Generated files mixed with source changes','An empty description','Many unrelated formatting changes'),
('git-foundations',10,'Which tag is suited to a documented release marker?','An annotated tag records tag metadata and a message.','An annotated tag','An ignored file','A temporary stash only','A remote-tracking branch'),
('git-foundations',11,'What can reflog help recover?','Reflog records recent local reference movements.','A commit made unreachable by a local reference move','A credential that was never stored','A repository deleted from every backup','A file never saved or committed'),
('git-foundations',12,'What is required after a secret is committed?','Copies may persist, so the credential must be revoked or rotated.','Rotate the secret and then clean history as needed','Only add the file to gitignore','Rename the branch','Create a new commit message'),

('data-structures-algorithms-foundations',1,'What does O(n) describe?','Work grows proportionally with the chosen input size.','Linear growth in operations as input grows','A fixed number of operations','Quadratic memory in every case','A guarantee about exact runtime seconds'),
('data-structures-algorithms-foundations',2,'Why can inserting in the middle of an array be linear time?','Later elements may need to shift to new indexes.','Elements after the insertion may be shifted','Array access requires a tree traversal','The array must be sent over a network','Every value must be encrypted'),
('data-structures-algorithms-foundations',3,'What is a linked-list strength?','Known-node insertion can update a small number of links.','Local insertion without shifting contiguous elements','Constant-time random access by index','Automatic sorted order','Zero memory overhead'),
('data-structures-algorithms-foundations',4,'Which structure supports breadth-first graph traversal?','A queue processes vertices in discovery order.','A queue','A call stack only','A sorted array with no updates','A single scalar variable'),
('data-structures-algorithms-foundations',5,'When is a set useful?','A set represents unique membership.','Checking whether a value has been seen','Preserving duplicate entries by position','Random access by numeric index','Maintaining a parent-child tree alone'),
('data-structures-algorithms-foundations',6,'What must every recursive solution define?','A base case stops recursion and progress moves toward it.','A terminating base case and progress toward it','An infinite branch','A global mutable result only','A database transaction'),
('data-structures-algorithms-foundations',7,'Why does balance matter in a binary search tree?','A balanced height keeps search near logarithmic growth.','It prevents the tree from degrading into a linear chain','It makes every node contain two values','It removes the ordering invariant','It turns the tree into a hash table'),
('data-structures-algorithms-foundations',8,'What guarantee does a min-heap provide?','The minimum is at the root while the rest is only partially ordered.','The smallest item is available at the root','Every item is stored in fully sorted order','Lookup of any value is constant time','Duplicate values are impossible'),
('data-structures-algorithms-foundations',9,'Which algorithm finds shortest paths in an unweighted graph?','BFS explores by increasing edge count from the source.','Breadth-first search','Depth-first search without distance tracking','Comparison sorting','Binary search over unsorted vertices'),
('data-structures-algorithms-foundations',10,'What condition does binary search require?','The decision predicate must be monotonic, commonly through sorted data.','A sorted or otherwise monotonic search space','A linked list with no order','Randomly shuffled answers','A graph with negative cycles'),
('data-structures-algorithms-foundations',11,'What does stable sorting preserve?','Equal-key records retain their prior relative order.','The relative order of items with equal keys','Constant memory for every algorithm','Linear runtime for every input','Only unique values'),
('data-structures-algorithms-foundations',12,'When is dynamic programming a strong candidate?','Overlapping subproblems can reuse stored results.','The problem has overlapping subproblems and useful optimal substructure','Every choice must be random','No state can be defined','The input is always empty'),

('html-css-foundations',1,'Which element should perform an in-page action?','A button carries native action semantics and keyboard behavior.','A button','A div with only a click handler','A heading','A link without a destination'),
('html-css-foundations',2,'How should a visible form label be associated with its control?','The for and id relationship gives the control an accessible name.','Match the label for value to the control id','Place the label only in a CSS background','Use placeholder text as the only label','Put the label after a hidden image'),
('html-css-foundations',3,'What alt value is appropriate for a purely decorative image?','An empty alternative lets assistive technology ignore decoration.','An empty alt attribute','The filename repeated','A description of unrelated content','No image element closing bracket'),
('html-css-foundations',4,'What is considered after origin, importance, and cascade layer?','Specificity helps choose among declarations still competing in the cascade.','Selector specificity','The monitor width only','The HTML filename','The network response status'),
('html-css-foundations',5,'What does border-box sizing include in the declared width?','Padding and border are counted inside the specified width.','Content, padding, and border','Margin and viewport width','Only the content box','Only the border color'),
('html-css-foundations',6,'Which layout model is designed primarily for one dimension?','Flexbox arranges items along a main axis with cross-axis alignment.','Flexbox','CSS Grid only','Table markup for every page','Absolute positioning for all content'),
('html-css-foundations',7,'Which layout model directly controls rows and columns together?','Grid provides two-dimensional track control.','CSS Grid','Inline text flow only','A single margin rule','A background image'),
('html-css-foundations',8,'What makes a breakpoint resilient?','It responds when content needs a different arrangement.','It is chosen from content and layout behavior','It matches one specific phone model','It hides overflowing text','It disables zoom'),
('html-css-foundations',9,'Why must status information use more than color?','Some users cannot perceive or distinguish the color difference.','Text, shape, or icons also communicate the meaning','Color values are not supported in CSS','Every status must be an animation','Screen readers announce hex codes'),
('html-css-foundations',10,'What should happen when a user prefers reduced motion?','Nonessential movement should be removed or substantially reduced.','Respect the preference with reduced transitions and animation','Increase every animation speed','Disable all page content','Replace focus indicators with motion'),
('html-css-foundations',11,'Why should visual reordering preserve logical source order?','Keyboard and reading order generally follow the DOM.','Focus and reading order remain understandable','It reduces every image file size','It prevents HTTP errors','It makes all selectors equal'),
('html-css-foundations',12,'What should a production interface audit include?','Quality includes accessibility, responsive behavior, and loading cost.','Keyboard flow, semantics, contrast, overflow, and performance','Only the desktop screenshot','Only the CSS line count','Only the chosen font name');

INSERT INTO quiz_questions(quiz_version_id,prompt,explanation,position,points)
SELECT qv.id,s.prompt,s.explanation,s.position,1
FROM sf_questions s JOIN courses c ON c.slug=s.course_slug JOIN quizzes q ON q.course_id=c.id
JOIN quiz_versions qv ON qv.quiz_id=q.id AND qv.version=2
ON CONFLICT(quiz_version_id,position) DO NOTHING;

INSERT INTO quiz_options(question_id,option_text,is_correct,position)
SELECT qq.id,o.option_text,o.is_correct,o.position
FROM sf_questions s JOIN courses c ON c.slug=s.course_slug JOIN quizzes q ON q.course_id=c.id
JOIN quiz_versions qv ON qv.quiz_id=q.id AND qv.version=2
JOIN quiz_questions qq ON qq.quiz_version_id=qv.id AND qq.position=s.position
CROSS JOIN LATERAL (VALUES(s.correct,TRUE,1),(s.wrong_one,FALSE,2),(s.wrong_two,FALSE,3),(s.wrong_three,FALSE,4)) o(option_text,is_correct,position)
ON CONFLICT(question_id,position) DO NOTHING;

-- Add a second substantial project to each track; the other required project
-- is reused from the existing project catalog and retains its original data.
INSERT INTO projects(title,slug,short_description,description,difficulty,estimated_hours,project_type,is_active)
SELECT new_project_title,new_project_slug,new_project_summary,new_project_description,'intermediate',24,'portfolio',TRUE
FROM sf_tracks ON CONFLICT(slug) DO UPDATE SET short_description=EXCLUDED.short_description,
  description=EXCLUDED.description,difficulty=EXCLUDED.difficulty,estimated_hours=EXCLUDED.estimated_hours,
  project_type=EXCLUDED.project_type,is_active=TRUE;

INSERT INTO project_skills(project_id,skill_id,importance)
SELECT p.id,s.id,3 FROM sf_tracks t JOIN projects p ON p.slug=t.new_project_slug
JOIN skills s ON s.name=t.skill_name
ON CONFLICT(project_id,skill_id) DO UPDATE SET importance=EXCLUDED.importance;

-- Map new portfolio projects to careers that require or recommend the track skill.
INSERT INTO career_projects(career_id,project_id,relevance)
SELECT DISTINCT cs.career_id,p.id,LEAST(3,GREATEST(1,cs.importance))
FROM sf_tracks t JOIN skills s ON s.name=t.skill_name
JOIN career_skills cs ON cs.skill_id=s.id
JOIN projects p ON p.slug=t.new_project_slug
ON CONFLICT(career_id,project_id) DO UPDATE SET relevance=EXCLUDED.relevance;

INSERT INTO project_milestones(project_id,milestone_order,title,description,estimated_hours)
SELECT p.id,m.position,m.title,m.description,m.hours
FROM sf_tracks t JOIN projects p ON p.slug=t.new_project_slug
CROSS JOIN (VALUES
 (1,'Define scope and acceptance criteria','Describe the users, core problem, data or content boundaries, success criteria, and important failure cases.',4),
 (2,'Implement the core solution','Build the primary workflow in focused, reviewable increments and preserve evidence of decisions.',10),
 (3,'Validate correctness and resilience','Test expected behavior, invalid input, edge cases, accessibility or operational risks, and recovery paths.',6),
 (4,'Document and present the result','Provide setup steps, architecture or design decisions, verification evidence, limitations, and a concise demonstration.',4)
) m(position,title,description,hours)
ON CONFLICT(project_id,milestone_order) DO UPDATE SET title=EXCLUDED.title,
  description=EXCLUDED.description,estimated_hours=EXCLUDED.estimated_hours;

INSERT INTO certificate_definitions(title,slug,description,required_readiness_score,is_active)
SELECT certificate_title,certificate_slug,
  'Verified completion of the '||product_name||' lessons, final assessment, and two reviewer-approved projects.',45,TRUE
FROM sf_tracks
ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,
  required_readiness_score=EXCLUDED.required_readiness_score,is_active=TRUE;

INSERT INTO certificate_required_lessons(definition_id,lesson_id)
SELECT d.id,cl.id FROM sf_tracks t JOIN certificate_definitions d ON d.slug=t.certificate_slug
JOIN courses c ON c.slug=t.course_slug JOIN course_modules cm ON cm.course_id=c.id
JOIN course_lessons cl ON cl.module_id=cm.id AND cl.is_active=TRUE
ON CONFLICT DO NOTHING;

INSERT INTO certificate_required_quizzes(definition_id,quiz_id)
SELECT d.id,q.id FROM sf_tracks t JOIN certificate_definitions d ON d.slug=t.certificate_slug
JOIN courses c ON c.slug=t.course_slug JOIN quizzes q ON q.course_id=c.id
ON CONFLICT DO NOTHING;

INSERT INTO certificate_required_projects(definition_id,project_id)
SELECT d.id,p.id FROM sf_tracks t JOIN certificate_definitions d ON d.slug=t.certificate_slug
JOIN projects p ON p.slug IN(t.existing_project_slug,t.new_project_slug)
ON CONFLICT DO NOTHING;

INSERT INTO products(name,slug,description,status)
SELECT product_name,product_slug,
  'Permanent access to the complete '||course_title||' course, final assessment, two portfolio projects, and completion certificate.','draft'
FROM sf_tracks
ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,status='draft';

INSERT INTO product_skills(product_id,skill_id)
SELECT p.id,s.id FROM sf_tracks t JOIN products p ON p.slug=t.product_slug JOIN skills s ON s.name=t.skill_name
ON CONFLICT DO NOTHING;

INSERT INTO product_prices(product_id,currency,amount_minor,is_active)
SELECT p.id,'USD',1899,TRUE FROM sf_tracks t JOIN products p ON p.slug=t.product_slug
ON CONFLICT(product_id,currency) DO UPDATE SET amount_minor=EXCLUDED.amount_minor,is_active=TRUE;

INSERT INTO premium_content_rules(entity_type,entity_id,product_id)
SELECT x.entity_type,x.entity_id,p.id FROM sf_tracks t JOIN products p ON p.slug=t.product_slug
CROSS JOIN LATERAL (
 SELECT 'course'::varchar AS entity_type,c.id AS entity_id FROM courses c WHERE c.slug=t.course_slug
 UNION ALL SELECT 'quiz',q.id FROM quizzes q JOIN courses c ON c.id=q.course_id WHERE c.slug=t.course_slug
 UNION ALL SELECT 'project',pr.id FROM projects pr WHERE pr.slug IN(t.existing_project_slug,t.new_project_slug)
 UNION ALL SELECT 'certificate',d.id FROM certificate_definitions d WHERE d.slug=t.certificate_slug
) x
ON CONFLICT(entity_type,entity_id,product_id) DO NOTHING;

-- Preserve current learner access when a formerly free starter course or
-- project becomes part of a Skill Pass.
INSERT INTO access_grants(user_id,product_id,source)
SELECT DISTINCT existing.user_id,p.id,'legacy'
FROM sf_tracks t JOIN products p ON p.slug=t.product_slug
JOIN LATERAL (
 SELECT ce.user_id FROM course_enrollments ce JOIN courses c ON c.id=ce.course_id WHERE c.slug=t.course_slug
 UNION
 SELECT up.user_id FROM user_projects up JOIN projects pr ON pr.id=up.project_id
 WHERE pr.slug IN(t.existing_project_slug,t.new_project_slug)
) existing ON TRUE
ON CONFLICT(user_id,product_id) DO NOTHING;

COMMIT;
