import { displayFirstName } from "../src/utils/displayName.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(displayFirstName({ full_name: "Eden Cohen" }, "") === "Eden", "full name first word");
assert(
  displayFirstName(null, "eden.ah@example.com", "Eden Ah") === "Eden",
  "auth displayName first word"
);
assert(displayFirstName(null, "eden.ah@example.com") === "Eden", "email before dot");
assert(displayFirstName(null, "cursor-user@test.invalid") === "Cursor", "email local capitalize");
assert(
  displayFirstName({}, "eden@gmail.com", "Eden Smith") === "Eden",
  "firebase displayName first word"
);

console.log("✓ displayFirstName");
