/** User-facing first name or email-local fallback (never empty if email exists). */
export function displayFirstName(profile, authEmail) {
  const full = profile?.full_name?.trim() || profile?.name?.trim();
  if (full) {
    return full.split(/\s+/)[0];
  }
  const email = (profile?.email || authEmail || "").trim();
  if (!email || !email.includes("@")) return "";
  const local = email.split("@")[0];
  const token = local.replace(/[._-]+/g, " ").split(/\s+/).filter(Boolean).pop() || local;
  if (!token) return "";
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function initialsFromIdentity({ email, fullName }) {
  const full = fullName?.trim();
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
    if (parts[0]) return parts[0][0].toUpperCase();
  }
  if (!email) return "?";
  const local = email.split("@")[0] || "";
  const parts = local.replace(/[._-]/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return local.slice(0, 1).toUpperCase() || "?";
}

/** Two equal columns for home-style grids (390 / 360 safe). */
export function twoColumnCardWidth(windowWidth, horizontalPadding, gap) {
  const inner = Math.max(0, windowWidth - horizontalPadding * 2 - gap);
  return Math.floor(inner / 2);
}
