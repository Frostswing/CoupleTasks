import { normalizeLocaleCode } from "../src/localization/localeUtils.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(normalizeLocaleCode("he-IL") === "he", "he-IL");
assert(normalizeLocaleCode("en-US") === "en", "en-US");
assert(normalizeLocaleCode("he") === "he", "he");
assert(normalizeLocaleCode("fr-FR") === "en", "fallback fr");

console.log("✓ normalizeLocaleCode");
