/**
 * Deduplicate shopping_list_items for cursor E2E test accounts only.
 * Keeps one active row per (name, is_purchased=false) — newest by updated_date.
 */
import { readFileSync } from "fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, get, remove } from "firebase/database";

const envPath = new URL("../.env.local", import.meta.url);
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const PRIMARY_EMAIL = "cursor-coupletasks-e2e-primary@test.invalid";
const PASSWORD = "CursorE2E_CoupleTasks_2026!";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

async function run() {
  const cred = await signInWithEmailAndPassword(auth, PRIMARY_EMAIL, PASSWORD);
  const profileSnap = await get(ref(db, `users/${cred.user.uid}/profile`));
  const sharedId = profileSnap.val()?.shared_space_id || profileSnap.val()?.sharedSpaceId;
  if (!sharedId) {
    console.log("No shared space for test user — nothing to clean.");
    return;
  }

  const listRef = ref(db, `shared/${sharedId}/shopping_list_items`);
  const snap = await get(listRef);
  if (!snap.exists()) {
    console.log("No shopping items.");
    return;
  }

  const items = Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }));
  const keep = new Map();
  const toDelete = [];

  for (const item of items) {
    if (item.is_archived) continue;
    const key = `${(item.name || "").toLowerCase().trim()}::${item.is_purchased ? "1" : "0"}`;
    const existing = keep.get(key);
    if (!existing) {
      keep.set(key, item);
      continue;
    }
    const existingTs = new Date(existing.updated_date || existing.created_date || 0).getTime();
    const itemTs = new Date(item.updated_date || item.created_date || 0).getTime();
    if (itemTs >= existingTs) {
      toDelete.push(existing.id);
      keep.set(key, item);
    } else {
      toDelete.push(item.id);
    }
  }

  for (const id of toDelete) {
    await remove(ref(db, `shared/${sharedId}/shopping_list_items/${id}`));
  }

  console.log(`Removed ${toDelete.length} duplicate shopping items (kept ${keep.size} unique).`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
