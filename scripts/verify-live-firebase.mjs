/**
 * Live Firebase smoke tests (uses .env.local + gitignored config values).
 * Only touches dedicated cursor-e2e test accounts.
 */
import { readFileSync } from "fs";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getDatabase, ref, push, set, get, update } from "firebase/database";

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
const PARTNER_EMAIL = "cursor-coupletasks-e2e-partner@test.invalid";
const PASSWORD = "CursorE2E_CoupleTasks_2026!";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

async function ensureUser(email, name) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD);
    return cred.user;
  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, email, PASSWORD);
      return cred.user;
    }
    throw e;
  }
}

async function ensureProfile(user, name) {
  const profileRef = ref(db, `users/${user.uid}/profile`);
  const snap = await get(profileRef);
  if (!snap.exists()) {
    await set(profileRef, {
      email: user.email,
      full_name: name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      language_preference: "en",
      timezone: "UTC",
      partner_email: null,
      shared_space_id: null,
      sharing_with: null,
    });
  }
}

async function mergeProfile(userId, fields) {
  const profileRef = ref(db, `users/${userId}/profile`);
  const snap = await get(profileRef);
  const existing = snap.exists() ? snap.val() : {};
  await set(profileRef, {
    ...existing,
    ...fields,
    updated_at: new Date().toISOString(),
  });
}

async function createAndJoinSharedSpace(primaryUser, partnerUser) {
  const [userId1, userId2] = [primaryUser.uid, partnerUser.uid].sort();
  const sharedId = `${userId1}_${userId2}`;
  await signInWithEmailAndPassword(auth, primaryUser.email, PASSWORD);
  await set(ref(db, `shared/${sharedId}/members`), {
    [userId1]: true,
    [userId2]: true,
  });
  await mergeProfile(primaryUser.uid, {
    sharingWith: partnerUser.uid,
    sharedSpaceId: sharedId,
    sharing_with: partnerUser.uid,
    shared_space_id: sharedId,
  });
  await signInWithEmailAndPassword(auth, partnerUser.email, PASSWORD);
  await mergeProfile(partnerUser.uid, {
    sharingWith: primaryUser.uid,
    sharedSpaceId: sharedId,
    sharing_with: primaryUser.uid,
    shared_space_id: sharedId,
  });
  return sharedId;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const results = [];

async function run() {
  console.log("Ensuring primary test user…");
  const primary = await ensureUser(PRIMARY_EMAIL, "Cursor E2E Primary");
  await ensureProfile(primary, "Cursor E2E Primary");
  results.push(["auth primary", true]);

  console.log("Ensuring partner test user (no global user scan)…");
  const partner = await ensureUser(PARTNER_EMAIL, "Cursor E2E Partner");
  await ensureProfile(partner, "Cursor E2E Partner");
  results.push(["auth partner", true]);

  const sharedId = await createAndJoinSharedSpace(primary, partner);
  const dataRoot = `shared/${sharedId}`;

  const taskRef = push(ref(db, `${dataRoot}/tasks`));
  const taskId = taskRef.key;
  const today = new Date().toISOString().slice(0, 10);
  const taskPayload = {
    title: "Cursor E2E daily task",
    status: "pending",
    priority: "medium",
    category: "household",
    created_by: PRIMARY_EMAIL,
    assigned_to: PRIMARY_EMAIL,
    due_date: today,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    is_archived: false,
  };
  await set(taskRef, taskPayload);
  const taskSnap = await get(ref(db, `${dataRoot}/tasks/${taskId}`));
  assert(taskSnap.exists(), "task write failed");
  results.push(["daily task CRUD path", true]);

  const shopRef = push(ref(db, `${dataRoot}/shopping_list_items`));
  await set(shopRef, {
    name: "חלב",
    category: "dairy",
    store_department: "dairy",
    quantity: 1,
    unit: "pieces",
    is_purchased: false,
    added_by: PRIMARY_EMAIL,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
  });
  const shopRef2 = push(ref(db, `${dataRoot}/shopping_list_items`));
  await set(shopRef2, {
    name: "Bread",
    category: "bakery",
    store_department: "bakery",
    quantity: 1,
    unit: "pieces",
    is_purchased: false,
    added_by: PRIMARY_EMAIL,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
  });
  assert((await get(shopRef)).exists(), "shopping item write failed");
  results.push(["shopping item + store_department", true]);

  const eventRef = push(ref(db, `${dataRoot}/events`));
  await set(eventRef, {
    title: "Cursor E2E event",
    event_date: new Date().toISOString().slice(0, 10),
    event_type: "personal",
    status: "confirmed",
    created_by: primary.uid,
    created_date: new Date().toISOString(),
  });
  results.push(["events path", true]);
  await signInWithEmailAndPassword(auth, PRIMARY_EMAIL, PASSWORD);
  const profileSnap = await get(ref(db, `users/${primary.uid}/profile`));
  const p = profileSnap.val();
  assert(
    (p.sharing_with || p.sharingWith) === partner.uid,
    "sharing profile not set"
  );
  assert(
    (p.shared_space_id || p.sharedSpaceId) === sharedId,
    "shared space id mismatch"
  );
  results.push(["couple link (direct UIDs)", true]);

  console.log("\nAll live Firebase checks passed:");
  for (const [name] of results) console.log("  ✓", name);
}

run().catch((err) => {
  console.error("\nLive Firebase verification failed:", err.message || err);
  process.exit(1);
});
