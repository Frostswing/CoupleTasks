import { normalizeEmail } from "./email.js";

function capitalizeToken(token) {
  if (!token) return "";
  const lower = token.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function looksLikeEmail(value) {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  return v.includes("@") && /\.[a-z]{2,}$/i.test(v.split("@")[1] || "");
}

function firstNameFromEmailAddress(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) return "";
  const local = normalized.split("@")[0];
  const beforeDot = local.split(".")[0].split(/[_-]/)[0];
  if (beforeDot) return capitalizeToken(beforeDot);
  return capitalizeToken(local);
}

/** User-facing first name: profile/display name, then email local part before first dot. */
export function displayFirstName(profile, authEmail, authDisplayName) {
  const rawProfileName = profile?.full_name?.trim() || profile?.name?.trim();
  if (rawProfileName && looksLikeEmail(rawProfileName)) {
    return firstNameFromEmailAddress(rawProfileName);
  }

  const fromProfile = rawProfileName || authDisplayName?.trim();
  if (fromProfile && !looksLikeEmail(fromProfile)) {
    const firstWord = fromProfile.split(/\s+/).filter(Boolean)[0];
    if (firstWord) return capitalizeToken(firstWord);
  }

  if (authDisplayName?.trim() && !looksLikeEmail(authDisplayName)) {
    const firstWord = authDisplayName.trim().split(/\s+/).filter(Boolean)[0];
    if (firstWord) return capitalizeToken(firstWord);
  }

  const email = normalizeEmail(profile?.email || authEmail);
  if (!email) return "";

  return firstNameFromEmailAddress(email);
}

export function initialsFromIdentity({ email, fullName }) {
  const full = fullName?.trim();
  if (full && !looksLikeEmail(full)) {
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
    if (parts[0]) return parts[0][0].toUpperCase();
  }
  if (!email) return "?";
  const local = normalizeEmail(email).split("@")[0] || "";
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
