// Firebase Configuration for Web
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDH1PyP0kT0GJae7A5NytYAX591QqIiNqM",
  authDomain: "coupletasks-569bf.firebaseapp.com",
  databaseURL: "https://coupletasks-569bf-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "coupletasks-569bf",
  storageBucket: "coupletasks-569bf.firebasestorage.app",
  messagingSenderId: "454424635796",
  appId: "1:454424635796:android:e8511499716c81d20fc781"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Firebase Realtime Database
const database = getDatabase(app);

export { app, auth, database };

