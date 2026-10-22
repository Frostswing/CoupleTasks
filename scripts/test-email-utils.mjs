import {
  normalizeEmail,
  sameEmail,
  userEmailSet,
  emailMatchesUser,
} from "../src/utils/email.js";
import { displayFirstName } from "../src/utils/displayName.js";
import { isAssignedToMe, taskBelongsToHousehold, buildHouseholdEmailSet } from "../src/utils/taskFilters.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(normalizeEmail("Eden.Ah@gmail.com") === "eden.ah@gmail.com", "normalize lowercases");
assert(sameEmail("Eden.Ah@gmail.com", "eden.ah@gmail.com"), "sameEmail");
assert(!sameEmail("a@b.com", "c@d.com"), "different emails");

const set = userEmailSet("Eden.Ah@gmail.com", "partner@x.com");
assert(emailMatchesUser("eden.ah@gmail.com", set), "set match lower");
assert(emailMatchesUser("Eden.Ah@gmail.com", set), "set match mixed case");
assert(!emailMatchesUser("together", set), "together not email");

assert(
  displayFirstName({ full_name: "Eden.Ah@gmail.com" }, "eden.ah@gmail.com") === "Eden",
  "name field that is email"
);

assert(
  isAssignedToMe({ assigned_to: "Eden.Ah@gmail.com" }, "eden.ah@gmail.com"),
  "isAssignedToMe case insensitive"
);
const householdSet = buildHouseholdEmailSet("Eden.Ah@gmail.com", "Partner@x.com");
assert(
  taskBelongsToHousehold({ assigned_to: "eden.ah@gmail.com", created_by: "" }, householdSet),
  "taskBelongsToHousehold assigned_to"
);
assert(
  taskBelongsToHousehold(
    { assigned_to: "other@y.com", created_by: "Partner@x.com" },
    householdSet
  ),
  "taskBelongsToHousehold created_by partner"
);

console.log("✓ email utils and display name email cases");
