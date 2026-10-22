import { emailMatchesUser, sameEmail, userEmailSet } from "./email.js";

export function isAssignedToMe(task, userEmail) {
  if (!task || !userEmail) return false;
  return sameEmail(task.assigned_to, userEmail);
}

export function buildHouseholdEmailSet(...emails) {
  return userEmailSet(...emails);
}

export function taskBelongsToHousehold(task, emailSet, { isPartnered = false, userUids = [] } = {}) {
  if (!task) return false;
  if (emailMatchesUser(task.assigned_to, emailSet)) return true;
  if (task.assigned_to === "together") return true;
  if (!task.assigned_to) return true;
  if (emailMatchesUser(task.created_by, emailSet)) return true;
  if (userUids.length && userUids.includes(task.created_by)) return true;
  return false;
}

export function shoppingItemBelongsToHousehold(item, emailSet, { userUids = [] } = {}) {
  if (!item) return false;
  if (userUids.length && userUids.includes(item.created_by)) return true;
  return (
    emailMatchesUser(item.created_by, emailSet) || emailMatchesUser(item.added_by, emailSet)
  );
}
