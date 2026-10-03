import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyDocumentTheme, normalizeTheme, resolveTheme } from "../src/utils/theme.js";

test("theme preference accepts only supported values and otherwise follows the system", () => {
  assert.equal(normalizeTheme("light"), "light");
  assert.equal(normalizeTheme("dark"), "dark");
  assert.equal(normalizeTheme("auto"), null);
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme(null, false), "light");
});

test("applying a theme updates the document and browser theme color", () => {
  const meta = { value: "", setAttribute(name, value) { if (name === "content") this.value = value; } };
  const documentObject = { documentElement: { dataset: {}, style: {} }, querySelector: () => meta };
  assert.equal(applyDocumentTheme("light", documentObject), "light");
  assert.equal(documentObject.documentElement.dataset.theme, "light");
  assert.equal(documentObject.documentElement.style.colorScheme, "light");
  assert.equal(meta.value, "#F5F7FB");
  applyDocumentTheme("dark", documentObject);
  assert.equal(meta.value, "#07111F");
});

test("light theme body text keeps accessible contrast on its main surfaces", () => {
  const luminance = hex => {
    const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const contrast = (first, second) => {
    const values = [luminance(first), luminance(second)];
    return (Math.max(...values) + .05) / (Math.min(...values) + .05);
  };
  for (const surface of ["#F5F7FB", "#FFFFFF", "#EEF2F7"]) {
    assert.ok(contrast("#172033", surface) >= 4.5);
    assert.ok(contrast("#475569", surface) >= 4.5);
  }
  const tokens = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
  assert.match(tokens, /:root\[data-theme="light"\]/);
});
