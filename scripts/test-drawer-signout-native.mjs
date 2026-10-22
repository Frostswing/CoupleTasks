/**
 * Guard: drawer must call logoutUser (exported) — signOut was undefined on native.
 */
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src/navigation/DrawerNavigator.js");
const src = readFileSync(file, "utf8");

if (src.includes("signOut(") || src.includes("import { getCurrentUser, signOut }")) {
  console.error("DrawerNavigator must use logoutUser, not signOut");
  process.exit(1);
}
if (!src.includes("logoutUser")) {
  console.error("DrawerNavigator must import and call logoutUser");
  process.exit(1);
}

console.log("✓ DrawerNavigator uses logoutUser for sign out");
