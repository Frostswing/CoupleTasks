// Copy to config.js and fill with your Firebase project values (config.js is gitignored).
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { createAuth } from "./authBootstrap";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = createAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

const checkFirebaseStatus = () => ({
  appInitialized: !!app,
  appName: app?.name || null,
  authInitialized: !!auth,
  databaseInitialized: !!database,
  firestoreInitialized: !!firestore,
  storageInitialized: !!storage,
});

export { app, auth, database, firestore, storage, checkFirebaseStatus };
