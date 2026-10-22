/**
 * Email normalization and case-insensitive comparison.
 */

export function normalizeEmail(email) {
  if (email == null || typeof email !== "string") return "";
  const trimmed = email.trim();
  if (!trimmed) return "";
  return trimmed.toLowerCase();
}

export function sameEmail(a, b) {
  const na = normalizeEmail(a);
  const nb = normalizeEmail(b);
  if (!na || !nb) return false;
  return na === nb;
}

/** Set of normalized emails for membership checks. */
export function userEmailSet(...emails) {
  const set = new Set();
  for (const email of emails) {
    const n = normalizeEmail(email);
    if (n) set.add(n);
  }
  return set;
}

export function emailMatchesUser(value, emailSet) {
  if (value == null || value === "" || value === "together") return false;
  if (typeof value !== "string") return false;
  const n = normalizeEmail(value);
  return n && emailSet.has(n);
}

export function anyEmailMatchesUser(values, emailSet) {
  if (!values) return false;
  const list = Array.isArray(values) ? values : [values];
  return list.some((v) => emailMatchesUser(v, emailSet));
}

/** Persist email fields lowercased; leave uids and sentinel values unchanged. */
export function normalizeStoredEmail(value) {
  if (value == null || value === "") return value;
  if (typeof value !== "string") return value;
  if (value === "together" || value === "separately") return value;
  if (!value.includes("@")) return value;
  return normalizeEmail(value);
}
