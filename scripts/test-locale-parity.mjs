import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
function loadLocaleJson(filename) {
  const filePath = path.join(root, "src/localization/translations", filename);
  const raw = readFileSync(filePath, "utf8");
  const duplicateTopLevel = [...raw.matchAll(/^\s{4}"([^"]+)":\s*\{/gm)].map((m) => m[1]);
  const dupes = duplicateTopLevel.filter((k, i, arr) => arr.indexOf(k) !== i);
  if (dupes.length) {
    throw new Error(`${filename} has duplicate top-level keys: ${[...new Set(dupes)].join(", ")}`);
  }
  return JSON.parse(raw);
}

const en = loadLocaleJson("en.json");
const he = loadLocaleJson("he.json");

function flattenKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, pathKey));
    } else {
      keys.push(pathKey);
    }
  }
  return keys;
}

function walkDir(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "translations") continue;
      walkDir(full, files);
    } else if (/\.(js|jsx|tsx)$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

const enKeys = new Set(flattenKeys(en));
const heKeys = new Set(flattenKeys(he));

const missingInHe = [...enKeys].filter((k) => !heKeys.has(k));
const missingInEn = [...heKeys].filter((k) => !enKeys.has(k));

if (missingInHe.length) {
  console.error("Keys in en.json missing from he.json:", missingInHe.join(", "));
  process.exit(1);
}
if (missingInEn.length) {
  console.error("Keys in he.json missing from en.json:", missingInEn.join(", "));
  process.exit(1);
}

const usedKeys = new Set();
const keyPattern = /i18n\.t\(\s*["']([^"']+)["']/g;
const srcDir = path.join(root, "src");
for (const file of walkDir(srcDir)) {
  const text = readFileSync(file, "utf8");
  let match;
  while ((match = keyPattern.exec(text)) !== null) {
    usedKeys.add(match[1]);
  }
}

const missingTranslations = [...usedKeys].filter((k) => !enKeys.has(k));
if (missingTranslations.length) {
  console.error("i18n.t keys used in src but missing from en.json:", missingTranslations.sort().join(", "));
  process.exit(1);
}

console.log(`✓ locale parity (${enKeys.size} keys) and ${usedKeys.size} i18n.t references in src`);
