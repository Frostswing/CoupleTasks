/**
 * Print Web OAuth client ID from android/app/google-services.json (client_type 3).
 * Usage: node scripts/print-google-web-client-id.mjs [path/to/google-services.json]
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [
  process.argv[2],
  path.join(root, "android", "app", "google-services.json"),
  path.join(root, "google-services.json"),
].filter(Boolean);

const file = candidates.find((p) => existsSync(p));
if (!file) {
  console.error("google-services.json not found. Pass path or place at android/app/google-services.json");
  process.exit(1);
}

const json = JSON.parse(readFileSync(file, "utf8"));
const clients = json.client?.flatMap((c) => c.oauth_client || []) || [];
const web = clients.find((c) => c.client_type === 3);
if (!web?.client_id) {
  console.error("No Web client (client_type 3) in", file);
  process.exit(1);
}
console.log(web.client_id);
console.log("\nSet in .env.local:");
console.log(`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=${web.client_id}`);
