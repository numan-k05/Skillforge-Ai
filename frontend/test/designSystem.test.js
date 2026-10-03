import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { CATEGORY_STYLES, filterSkills, skillGroup, skillPresentation } from "../src/utils/skillPresentation.js";

let vite;
before(async () => { vite = await createServer({ configFile: false, envDir: false, plugins: [react()], server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" }); });
after(async () => { await vite?.close(); });
async function render(path, name, props) {
  const module = await vite.ssrLoadModule(`/src/components/ui/${path}.jsx`);
  return renderToStaticMarkup(createElement(module[name], props));
}

test("every category and unknown skill gets a stable Lucide icon and color", () => {
  for (const [name, group] of [["React", "development"], ["Python Data Analysis", "data"], ["UI Design", "design"], ["SEO", "marketing"], ["Business Management", "business"], ["Cybersecurity", "security"], ["React Native", "mobile"], ["An unknown future skill", "development"]]) {
    assert.equal(skillGroup({ name }), group);
    assert.equal(skillPresentation({ name }), CATEGORY_STYLES[group]);
  }
});

test("catalog filters retain every entry by default, preserve IDs, and combine search/category", () => {
  const skills = [{ skillId: 1, name: "React", category: "Frontend" }, { skillId: 2, name: "React Native", category: "Mobile" }, { skillId: 3, name: "Figma", category: "Design" }];
  assert.deepEqual(filterSkills(skills), skills);
  assert.deepEqual(filterSkills(skills, " REACT ", "mobile").map((skill) => skill.skillId), [2]);
  assert.equal(filterSkills(skills, "missing").length, 0);
  assert.equal(skills.length, 3);
});

test("fields associate labels, validation errors and hints with their control", async () => {
  const html = await render("Field", "Field", { id: "email", label: "Email", hint: "Use your email", error: "Invalid email", type: "email", required: true });
  assert.match(html, /for="email"/);
  assert.match(html, /aria-describedby="email-hint email-error"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /role="alert"/);
});

test("buttons default to non-submit and preserve explicit submit behavior", async () => {
  assert.match(await render("Button", "default", { children: "Cancel" }), /type="button"/);
  assert.match(await render("Button", "default", { children: "Save", type: "submit" }), /type="submit"/);
});

test("progress and score indicators clamp invalid data and expose accessible values", async () => {
  assert.match(await render("Indicators", "ProgressBar", { value: 150, label: "Learning" }), /aria-valuenow="100"/);
  assert.match(await render("Indicators", "ScoreIndicator", { value: Number.NaN, label: "Readiness" }), /Readiness: 0 out of 100/);
});

test("tabs use selected state and roving keyboard focus; tables expose headers and captions", async () => {
  const tabs = await render("Tabs", "default", { tabs: [{ value: "one", label: "One" }, { value: "two", label: "Two" }], value: "one", onChange() {}, children: "Content" });
  assert.match(tabs, /role="tablist"/);
  assert.match(tabs, /aria-selected="true" tabindex="0"/);
  assert.match(tabs, /aria-selected="false" tabindex="-1"/);
  assert.match(tabs, /role="tabpanel"/);
  const table = await render("DataTable", "default", { caption: "Learning history", columns: [{ key: "name", label: "Skill" }], rows: [{ id: 1, name: "React" }] });
  assert.match(table, /<caption>Learning history<\/caption>/);
  assert.match(table, /scope="col"/);
});

test("error and loading states have live-region semantics", async () => {
  assert.match(await render("Feedback", "ErrorState", { message: "Offline" }), /role="alert"/);
  assert.match(await render("Feedback", "Skeleton", { label: "Loading skills" }), /role="status" aria-label="Loading skills"/);
});

test("the new design uses AA-readable body and primary-button colors", () => {
  function luminance(hex) {
    const values = hex.match(/[a-f\d]{2}/gi).map((value) => parseInt(value, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  }
  function contrast(a, b) { const first = luminance(a), second = luminance(b); return (Math.max(first, second) + .05) / (Math.min(first, second) + .05); }
  for (const background of ["#07111F", "#101D2F", "#17263B"]) {
    assert.ok(contrast("#94A3B8", background) >= 4.5);
    assert.ok(contrast("#F8FAFC", background) >= 4.5);
  }
  assert.ok(contrast("#F8FAFC", "#7C3AED") >= 4.5);
  const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
  for (const color of ["#07111F", "#101D2F", "#17263B", "#7C3AED", "#06B6D4", "#10B981", "#F59E0B", "#F43F5E"]) assert.ok(css.includes(color));
});
