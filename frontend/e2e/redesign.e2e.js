import { test, expect } from "@playwright/test";

// Synthetic browser fixtures only. All API traffic is intercepted; no real account or DB is used.
const user = { id: "1", name: "Ada Learner", email: "ada@example.test", onboardingCompleted: true };
const skills = [
  { skillId: 1, name: "React", category: "Frontend", description: "Build component-based web interfaces.", difficulty: "intermediate", skillType: "technical" },
  { skillId: 2, name: "Python", category: "Data & AI", description: "Explore data analysis and automation.", difficulty: "beginner", skillType: "technical" },
  { skillId: 3, name: "Figma", category: "Design", description: "Design clear interfaces and prototypes.", difficulty: "beginner", skillType: "technical" },
  { skillId: 4, name: "Cybersecurity", category: "Security", description: "Understand secure systems.", difficulty: "beginner", skillType: "technical" },
];
const initialProfile = { ...user, university: "Example University", degree: "Computer Science", country: "Pakistan", weeklyHoursAvailable: 8, learningGoals: "Build accessible interfaces", interests: [] };
const course = { id: 10, skillId: 1, skillName: "React", title: "React foundations", slug: "react-foundations", description: "Learn components and accessible interface foundations.", difficulty: "beginner", estimatedHours: 8, lessonCount: 1, moduleCount: 1, isPremium: false, hasAccess: true };
const quiz = { id: 40, title: "React foundations check", description: "Check your component knowledge.", skillId: 1, version: 1, passPercent: 70, maxAttempts: 3, cooldownMinutes: 0, questionCount: 2, hasAccess: true };

async function fixtures(page, { authenticated = false, failCatalog = false } = {}) {
  let profile = { ...initialProfile };
  let accountPrivacy = { preferences: { productUpdates: false, learningReminders: true, publicProfileVisible: false, updatedAt: "2026-09-26T00:00:00.000Z" }, consents: [] };
  let projectSubmission = null;
  let portfolio = { slug: "ada-1", isPublic: false, biography: "", education: "", showCareerGoal: true, careerGoal: "Frontend Developer", template: "classic", projects: [], skills: [], links: [], achievements: [], evidenceEntries: [{ entryId: 91, submissionId: 80, isVisible: false, showEvidenceLinks: false, displayOrder: 1, headline: "", description: "", title: "Responsive Portfolio Website", slug: "responsive-portfolio-website", reviewedSummary: "A complete accessible portfolio implementation.", repositoryUrl: "https://github.com/example/portfolio", approvedAt: "2026-09-23T00:00:00.000Z", revoked: false }] };
  const saved = [];
  if (authenticated) await page.addInitScript(() => sessionStorage.setItem("skillforge_token", "isolated-browser-test-token"));
  await page.route("**/api/**", async (route) => {
    const request = route.request(), path = new URL(request.url()).pathname.replace(/^\/api/, "");
    const corsHeaders = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: corsHeaders });
    const respond = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: corsHeaders, body: JSON.stringify(body) });
    if (path === "/auth/me") return respond({ user });
    if (path === "/auth/login") return respond({ token: "isolated-browser-test-token", user });
    if (path === "/auth/logout") return respond({ message: "Logged out" });
    if (path === "/profile") {
      if (request.method() === "PUT") { saved.push(request.postDataJSON()); profile = { ...profile, ...request.postDataJSON() }; }
      return respond({ profile });
    }
    if (path === "/account/privacy") return respond(accountPrivacy);
    if (path === "/account/preferences") {
      accountPrivacy = { ...accountPrivacy, preferences: { ...accountPrivacy.preferences, ...request.postDataJSON() } };
      return respond({ preferences: accountPrivacy.preferences });
    }
    if (path === "/account/export") return respond({ exportedAt: "2026-09-26T00:00:00.000Z", formatVersion: "1", account: user, profile, preferences: accountPrivacy.preferences });
    if (path === "/account" && request.method() === "DELETE") return route.fulfill({ status: 204, headers: corsHeaders });
    if (path === "/skills") return failCatalog ? respond({ error: { message: "Catalog is temporarily unavailable." } }, 503) : respond({ skills });
    if (/^\/skills\/\d+$/.test(path)) {
      const skill = skills.find((item) => String(item.skillId) === path.split("/").at(-1));
      return skill ? respond({ skill }) : respond({ error: { message: "Skill not found." } }, 404);
    }
    if (path.startsWith("/learning-resources/skills/")) return respond({ resources: [{ id: 1, title: "Learn React", provider: "React documentation", resourceType: "documentation", url: "https://react.dev/learn", difficulty: "beginner", estimatedHours: 4, isFree: true }], pagination: { page: 1, totalPages: 1 } });
    if (path === "/courses") return respond({ courses: [course], pagination: { page: 1, totalPages: 1, total: 1 } });
    if (path === "/courses/10") { const enrolled = request.headers().authorization; return respond({ course: { ...course, status: "published", enrolled: Boolean(enrolled), prerequisites: [], modules: [{ id: 20, title: "Start here", position: 1, lessons: [{ id: 30, title: "Components", summary: "Understand reusable UI.", content: enrolled ? "Build one component at a time." : null, sourceUrl: enrolled ? "https://react.dev/learn" : null, provider: "React documentation", lessonType: "reading", estimatedMinutes: 20, position: 1, isPreview: false, completed: false, ...(!enrolled ? { locked: true } : {}) }] }] } }); }
    if (path === "/courses/10/start") return respond({ enrollment: { courseId: 10, status: "in_progress" } }, 201);
    if (path === "/courses/mine") return respond({ courses: [{ ...course, status: "in_progress", completedLessons: 0, percentage: 0 }] });
    if (path === "/courses/lessons/30/complete") return respond({ progress: { courseId: 10, completedLessons: 1, totalLessons: 1, percentage: 100, status: "completed" } });
    if (path === "/assessments") return respond({ quizzes: [quiz], pagination: { page: 1, totalPages: 1, total: 1 } });
    if (path === "/assessments/40" && request.method() === "GET") return respond({ quiz: { ...quiz, hasAccess: true } });
    if (path === "/assessments/40/attempts") return respond({ attempt: { id: 50, quizId: 40, title: quiz.title, attemptNumber: 1, status: "in_progress", generationMode: "ai", generatedByAI: true, questions: [{ id: 60, prompt: "Which API creates local component state?", points: 1, options: [{ id: 70, text: "useState" }, { id: 71, text: "fetch" }] }, { id: 61, prompt: "Which value updates React state?", points: 1, options: [{ id: 72, text: "The state setter" }, { id: 73, text: "A CSS selector" }] }] }, reused: false }, 201);
    if (path === "/assessments/attempts/50/submit") return respond({ attempt: { id: 50, quizId: 40, title: quiz.title, attemptNumber: 1, status: "submitted", scorePercent: 100, passed: true, generationMode: "ai", generatedByAI: true, questions: [{ id: 60, prompt: "Which API creates local component state?", points: 1, explanation: "useState stores local component state.", correctOptionIds: [70], options: [{ id: 70, text: "useState" }, { id: 71, text: "fetch" }] }, { id: 61, prompt: "Which value updates React state?", points: 1, explanation: "The setter schedules a state update.", correctOptionIds: [72], options: [{ id: 72, text: "The state setter" }, { id: 73, text: "A CSS selector" }] }] }, answers: [{ questionId: 60, selectedOptionIds: [70], isCorrect: true, earnedPoints: 1 }, { questionId: 61, selectedOptionIds: [72], isCorrect: true, earnedPoints: 1 }], reused: false });
    if (path === "/assessments/history") return respond({ attempts: [] });
    if (path === "/projects/7") return respond({ project: { projectId: 7, title: "Responsive Portfolio Website", description: "Build an accessible responsive portfolio.", difficulty: "beginner", projectType: "portfolio", estimatedHours: 12, skills: [], careers: [], userProject: { status: "completed" }, milestones: [{ milestoneId: 501, title: "Build interface", description: "Create the responsive interface.", estimatedHours: 4 }] } });
    if (path === "/projects/mine") return respond({ projects: [{ projectId: 7, title: "Responsive Portfolio Website", status: "completed", projectType: "portfolio", difficulty: "beginner" }] });
    if (path === "/skills/me") return respond({ skills: [{ skillId: 1, name: "React", category: "Frontend", level: 3 }] });
    if (path === "/portfolios/me") { if (request.method() === "PUT") portfolio = { ...portfolio, ...request.postDataJSON(), publishConsentAt: request.postDataJSON().publishConsent ? new Date().toISOString() : portfolio.publishConsentAt }; return respond({ portfolio }); }
    if (path === "/portfolios/me/content") return respond({ portfolio });
    if (path === "/portfolios/me/evidence") { const updates = new Map(request.postDataJSON().entries.map((entry) => [entry.entryId, entry])); portfolio = { ...portfolio, evidenceEntries: portfolio.evidenceEntries.map((entry) => ({ ...entry, ...updates.get(entry.entryId) })) }; return respond({ portfolio }); }
    if (path === "/portfolios/public/ada-1") return portfolio.isPublic ? respond({ portfolio: { slug: portfolio.slug, name: "Ada Learner", biography: portfolio.biography, careerGoal: "Frontend Developer", template: portfolio.template, projects: [], skills: [], links: [], achievements: [], evidenceProjects: portfolio.evidenceEntries.filter((entry) => entry.isVisible && !entry.revoked).map((entry) => ({ title: entry.headline || entry.title, slug: entry.slug, description: entry.description || entry.reviewedSummary, projectType: "portfolio", difficulty: "beginner", ...(entry.showEvidenceLinks ? { repositoryUrl: entry.repositoryUrl } : {}) })) } }) : respond({ error: { message: "Portfolio unavailable." } }, 404);
    if (path === "/project-submissions/mine") return respond({ submissions: projectSubmission ? [projectSubmission] : [] });
    if (path === "/project-submissions/mine/80") return respond({ submission: { ...projectSubmission, milestones: projectSubmission?.milestones || [], history: [] } });
    if (path === "/project-submissions/projects/7/draft") { projectSubmission = { id: 80, projectId: 7, projectTitle: "Responsive Portfolio Website", status: "draft", version: { id: 81, number: 1, summary: request.postDataJSON().summary, repositoryUrl: request.postDataJSON().repositoryUrl }, milestones: [], history: [] }; return respond({ submission: projectSubmission }, 201); }
    if (path === "/project-submissions/80/submit") { projectSubmission = { ...projectSubmission, status: "submitted", version: { ...projectSubmission.version, submittedAt: new Date().toISOString() } }; return respond({ submission: projectSubmission }); }
    if (path === "/evidence-readiness/overview") return respond({ algorithmVersion: "evidence-v1", score: 55, band: "Developing", disclaimer: "This evidence score does not guarantee employment.", components: { learning: { score: 20, max: 30, count: 2 }, projects: { score: 15, max: 30, count: 1 }, assessments: { score: 10, max: 20, count: 2 }, portfolio: { score: 8, max: 10 }, consistency: { score: 2, max: 10, count: 2 } }, methodology: { learning: { description: "Completed SkillForge courses" }, projects: { description: "Approved, non-revoked project submissions" }, assessments: { description: "Unique passed quizzes or completed challenges" }, portfolio: { description: "Explicit portfolio signals" }, consistency: { description: "Distinct active days during the last 28 days" } }, nextActions: [{ action: "Complete a SkillForge course", points: 10, path: "/courses" }] });
    if (path.startsWith("/career-match")) return respond({ matches: [{ careerId: "5", title: "Frontend Developer", slug: "frontend-developer", shortDescription: "Build accessible web interfaces.", category: "Technology", experienceLevel: "intermediate", matchPercent: 54, components: { verifiedSkills: { score: 25, max: 40, met: 2, total: 3 }, assessments: { score: 5, max: 20, count: 1 }, projects: { score: 10, max: 20, count: 1 }, readiness: { score: 6, max: 10 }, portfolio: { score: 8, max: 10 } }, metRequirements: [{ skillId: "1", name: "HTML/CSS" }, { skillId: "3", name: "React" }], missingRequirements: [{ skillId: "2", name: "JavaScript" }], explanation: "5 of 8 weighted requirement points have recorded evidence.", nextActions: [{ type: "course", title: "JavaScript foundations", path: "/courses/10", forSkill: "JavaScript" }] }], pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }, methodology: { version: "career-match-v1", weights: { verifiedSkills: 40, assessments: 20, approvedProjects: 20, evidenceReadiness: 10, portfolio: 10 } }, disclaimer: "Career Match does not guarantee employment." });
    return respond({ error: { message: "This endpoint is not part of the isolated browser fixture." } }, 503);
  });
  return { saved };
}

async function noHorizontalOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test("public routes render with the new theme, a main landmark, and no horizontal overflow", async ({ page }, testInfo) => {
  await fixtures(page);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/", "/explore", "/platform", "/how-it-works", "/skill-intelligence", "/roadmaps", "/pricing", "/privacy", "/terms", "/refunds", "/login", "/signup", "/forgot-password", "/not-a-real-route"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#main-content")).toBeVisible();
    await noHorizontalOverflow(page);
  }
  expect(errors).toEqual([]);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Build skills. Shape your future." })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("landing.png"), fullPage: true });
});

test("catalog filters, real detail navigation, and resource attribution work", async ({ page }, testInfo) => {
  await fixtures(page, { authenticated: true });
  await page.goto("/skills");
  await expect(page.getByRole("heading", { name: "React", exact: true })).toBeVisible();
  await page.getByLabel("Search skills").fill("React");
  await expect(page.getByRole("heading", { name: "Python", exact: true })).toHaveCount(0);
  await page.getByLabel("Category", { exact: true }).selectOption("design");
  await expect(page.getByRole("heading", { name: "No matching skills" })).toBeVisible();
  await page.getByLabel("Search skills").fill("");
  await expect(page.getByRole("heading", { name: "Figma", exact: true })).toBeVisible();
  await page.getByLabel("Category", { exact: true }).selectOption("all");
  await page.screenshot({ path: testInfo.outputPath("catalog.png"), fullPage: true });
  await page.getByRole("link").filter({ has: page.getByRole("heading", { name: "React", exact: true }) }).click();
  await expect(page.getByRole("heading", { name: "Learning resources" })).toBeVisible();
  const resource = page.getByRole("link", { name: /Open original source/ });
  await expect(resource).toHaveAttribute("href", "https://react.dev/learn");
  await expect(resource).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByText("Source: React documentation")).toBeVisible();
  await noHorizontalOverflow(page);
});

test("settings save through the existing profile API and show dismissible feedback", async ({ page }, testInfo) => {
  const { saved } = await fixtures(page, { authenticated: true });
  await page.goto("/settings");
  await expect(page.getByLabel("Full name")).toHaveValue("Ada Learner");
  await page.getByLabel("Full name").fill("Ada Updated");
  await page.getByLabel("Learning hours per week").fill("12");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Your profile settings have been saved.");
  expect(saved[0]).toMatchObject({ name: "Ada Updated", weeklyHoursAvailable: 12 });
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(page.getByText("Your profile settings have been saved.")).toHaveCount(0);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("settings.png"), fullPage: true });
});

test("account privacy preferences, export, and confirmed deletion are usable", async ({ page }) => {
  test.setTimeout(45000);
  await fixtures(page, { authenticated: true });
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Privacy and communication" })).toBeVisible();
  await page.getByText("Allow a public portfolio", { exact: true }).click();
  await page.getByRole("button", { name: "Save privacy preferences" }).click();
  await expect(page.getByRole("status")).toContainText("Privacy preferences saved");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data" }).click();
  await download;
  while (await page.getByRole("button", { name: "Dismiss notification" }).count()) {
    await page.getByRole("button", { name: "Dismiss notification" }).first().click();
  }
  await page.getByLabel("Current password").fill("test-password");
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Permanently delete account" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("protected redirect returns to settings after login using the existing auth flow", async ({ page }) => {
  await fixtures(page);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("ada@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Make this space yours." })).toBeVisible();
});

test("mobile navigation traps focus, supports Escape, and restores the menu trigger", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "Desktop uses a persistent sidebar.");
  await fixtures(page, { authenticated: true });
  await page.goto("/settings");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Your workspace" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "Explore skills" }).click();
  await expect(page.getByRole("heading", { name: "Your next chapter starts here." })).toBeVisible();
});

test("catalog API failures display a usable error and retry action", async ({ page }) => {
  await fixtures(page, { failCatalog: true });
  await page.goto("/skills");
  await expect(page.getByRole("alert")).toContainText("Catalog is temporarily unavailable.");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("course catalog and locked lesson detail use real course routes", async ({ page }) => {
  await fixtures(page);
  await page.goto("/courses");
  await expect(page.getByRole("heading", { name: "React foundations" })).toBeVisible();
  await page.getByRole("link", { name: "Open course" }).click();
  await expect(page.getByText("Start this course to unlock the lesson guide and completion button.")).toBeVisible();
  await expect(page.getByText("Build one component at a time.")).toHaveCount(0);
  await noHorizontalOverflow(page);
});

test("assessment answers stay hidden until an authenticated attempt is submitted", async ({ page }) => {
  await fixtures(page, { authenticated: true });
  await page.goto("/assessments");
  await page.getByRole("link", { name: "Open assessment" }).click();
  await page.getByRole("button", { name: "Start assessment" }).click();
  await expect(page.getByText("useState stores local component state.")).toHaveCount(0);
  await expect(page.getByText("Which value updates React state?")).toHaveCount(0);
  await expect(page.getByText("Question 1 of 2")).toBeVisible();
  await page.getByLabel("useState").check();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 2")).toBeVisible();
  await page.getByLabel("The state setter").check();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(page.getByRole("heading", { name: "Assessment passed" })).toBeVisible();
  await expect(page.getByText("useState stores local component state.")).toBeVisible();
  await noHorizontalOverflow(page);
});

test("project evidence preserves legacy completion and submits a locked version", async ({ page }) => {
  await fixtures(page, { authenticated: true });
  await page.goto("/projects/7/evidence");
  await expect(page.getByText("Existing completion is self-reported.")).toBeVisible();
  await page.getByLabel("What you built").fill("I implemented the accessible responsive portfolio interface.");
  await page.getByLabel("GitHub repository").fill("https://github.com/example/portfolio");
  await page.getByRole("button", { name: "Save evidence version" }).click();
  await expect(page.getByRole("button", { name: "Submit for review" })).toBeVisible();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Submitted", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Submitted evidence · version 1" })).toBeVisible();
  await noHorizontalOverflow(page);
});

test("evidence readiness explains score components and attainable points", async ({ page }) => {
  await fixtures(page, { authenticated: true });
  await page.goto("/readiness");
  await expect(page.getByRole("heading", { name: "Your recorded proof, explained" })).toBeVisible();
  await expect(page.getByText("55", { exact: true })).toBeVisible();
  await expect(page.getByText("Developing", { exact: true })).toBeVisible();
  await expect(page.getByText("Approved projects", { exact: true })).toBeVisible();
  await expect(page.getByText("Up to +10 points")).toBeVisible();
  await noHorizontalOverflow(page);
});

test("career match explains ranked evidence, gaps, and concrete actions", async ({ page }) => {
  await fixtures(page, { authenticated: true });
  await page.goto("/career-match");
  await expect(page.getByRole("heading", { name: "Roles that fit your recorded evidence" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Frontend Developer" })).toBeVisible();
  await expect(page.getByText("54%", { exact: true })).toBeVisible();
  await expect(page.getByText("HTML/CSS", { exact: true })).toBeVisible();
  await expect(page.getByText("JavaScript", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /JavaScript foundations/ })).toHaveAttribute("href", "/courses/10");
  await noHorizontalOverflow(page);
});

test("approved evidence stays private until explicit portfolio consent and selection", async ({ page }) => {
  await fixtures(page, { authenticated: true });
  await page.goto("/portfolio");
  await expect(page.getByText("Reviewer approved", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Show this approved project")).not.toBeChecked();
  await page.getByText("Show this approved project", { exact: true }).click();
  await page.getByText("Show reviewed evidence links", { exact: true }).click();
  await page.getByLabel("Public headline").fill("Accessible portfolio case study");
  await page.getByText("Publish my portfolio", { exact: true }).click();
  await page.getByText("I consent to publishing the selected information", { exact: true }).click();
  await page.getByLabel("Template").selectOption("showcase");
  await page.getByRole("button", { name: "Save portfolio" }).click();
  await expect(page.getByRole("status")).toContainText("Portfolio saved");
  await page.goto("/u/ada-1");
  await expect(page.getByRole("heading", { name: "Verified project evidence" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Accessible portfolio case study" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Repository/ })).toHaveAttribute("href", "https://github.com/example/portfolio");
  await expect(page.getByRole("button", { name: "Print portfolio" })).toBeVisible();
  await noHorizontalOverflow(page);
});
