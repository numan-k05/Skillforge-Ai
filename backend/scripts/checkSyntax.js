import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

let count = 0;
for (const directory of ["src", "scripts", "test"]) {
  for (const file of readdirSync(directory, { recursive: true }).filter((name) => name.endsWith(".js"))) {
    const result = spawnSync(process.execPath, ["--check", resolve(directory, file)], { stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status || 1);
    count += 1;
  }
}
console.log(`Syntax OK: ${count} JavaScript files.`);
