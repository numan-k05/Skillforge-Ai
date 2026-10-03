const apiOrigin = String(process.env.LIVE_API_ORIGIN || "").replace(/\/$/, "");
const appOrigin = String(process.env.LIVE_APP_ORIGIN || "").replace(/\/$/, "");

for (const [name, value] of [["LIVE_API_ORIGIN", apiOrigin], ["LIVE_APP_ORIGIN", appOrigin]]) {
  if (!value) throw new Error(`${name} is required.`);
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`${name} must use HTTPS.`);
}

async function response(url, expectedType) {
  const result = await fetch(url, { redirect: "follow" });
  if (!result.ok) throw new Error(`${url} returned HTTP ${result.status}.`);
  const type = result.headers.get("content-type") || "";
  if (!type.includes(expectedType)) throw new Error(`${url} returned unexpected content type ${type || "unknown"}.`);
  return result;
}

const health = await (await response(`${apiOrigin}/api/health`, "application/json")).json();
if (health.status !== "ok") throw new Error("Backend health response is invalid.");
const ready = await (await response(`${apiOrigin}/api/ready`, "application/json")).json();
if (ready.status !== "ready") throw new Error("Backend database is not ready.");
const skills = await (await response(`${apiOrigin}/api/skills`, "application/json")).json();
if (!Array.isArray(skills.skills) || skills.skills.length < 49) throw new Error("Public skill catalog is incomplete.");
const courses = await (await response(`${apiOrigin}/api/courses`, "application/json")).json();
if (!Array.isArray(courses.courses) || courses.courses.length < 8) throw new Error("Public course catalog is incomplete.");

for (const path of ["/", "/skills", "/dashboard", "/robots.txt", "/sitemap.xml"]) {
  await response(`${appOrigin}${path}`, path.endsWith(".xml") ? "xml" : path.endsWith(".txt") ? "text/plain" : "text/html");
}

console.log(JSON.stringify({
  status: "ok",
  backend: apiOrigin,
  frontend: appOrigin,
  skills: skills.skills.length,
  courses: courses.courses.length,
}));
