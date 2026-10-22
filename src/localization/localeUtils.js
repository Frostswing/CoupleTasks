/** i18n-js only has `he` / `en` catalogs; normalize `he-IL`, `en-US`, etc. */
export function normalizeLocaleCode(locale) {
  if (!locale || typeof locale !== "string") return "en";
  const base = locale.split("-")[0].toLowerCase();
  return base === "he" || base === "en" ? base : "en";
}
