const UNIT_LABELS = {
  pieces: { one: "piece", other: "pieces" },
  pcs: { one: "piece", other: "pieces" },
  kg: { one: "kg", other: "kg" },
  g: { one: "g", other: "g" },
  l: { one: "L", other: "L" },
  ml: { one: "ml", other: "ml" },
  pack: { one: "pack", other: "packs" },
  bottle: { one: "bottle", other: "bottles" },
};

/**
 * Human-readable quantity + unit with simple English pluralization.
 * Hebrew uses the unit as-is (no plural suffix in UI copy).
 */
export function formatQuantity(quantity, unit = "pieces", locale = "en") {
  const q = Number(quantity) || 0;
  const key = (unit || "pieces").toLowerCase();
  const labels = UNIT_LABELS[key] || { one: unit, other: unit };

  if (locale === "he" || locale?.startsWith?.("he")) {
    return `${q} ${labels.one}`;
  }

  const label = q === 1 ? labels.one : labels.other;
  return `${q} ${label}`;
}
