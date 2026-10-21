#!/usr/bin/env node
/**
 * Fail if hardcoded hex colors exist outside theme palette files.
 */
import { execSync } from "child_process";

const ALLOWED = [
  "src/constants/theme.js",
  "src/constants/categories.js",
  "src/firebase/database-schema.js",
];

let out = "";
try {
  out = execSync(
    "rg '#[0-9A-Fa-f]{3,8}' src -g '*.js' -g '!**/theme.js' --no-heading",
    { encoding: "utf8", cwd: new URL("..", import.meta.url).pathname }
  );
} catch (e) {
  if (e.status === 1) {
    console.log("✓ No hardcoded hex colors outside theme palette files.");
    process.exit(0);
  }
  throw e;
}

const violations = out
  .trim()
  .split("\n")
  .filter(Boolean)
  .filter((line) => {
    const file = line.split(":")[0];
    return !ALLOWED.some((a) => file.endsWith(a.replace("src/", "")) || file.includes(a));
  });

if (violations.length === 0) {
  console.log("✓ No hardcoded hex colors outside theme palette files.");
  console.log("  Allowed catalog metadata: categories.js, database-schema.js");
  process.exit(0);
}

console.error("Hardcoded hex colors found:\n");
console.error(violations.join("\n"));
process.exit(1);
