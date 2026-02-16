import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Lazily initialise Firebase only on the client side.
 * Returns null during SSR / static generation.
 */
function initFirebase() {
  if (typeof window === "undefined") return;

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }

  if (!auth && app) {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {
      // ignore – persistence may already be set
    });
  }

  if (!db && app) {
    db = getFirestore(app);
  }
}

export function getFirebaseAuth(): Auth | null {
  initFirebase();
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  initFirebase();
  return db;
}

export { app, auth, db };
