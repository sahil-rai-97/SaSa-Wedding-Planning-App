import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

function getAdminApp(): App {
  if (app) return app;

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      app = initializeApp({ credential: cert(serviceAccount), projectId });
    } else {
      app = initializeApp({ projectId });
    }
  } else if (projectId && projectId !== "demo-project") {
    app = initializeApp({ projectId });
  } else {
    app = initializeApp({ projectId: projectId || "demo-project" });
  }

  return app;
}

export function getAdminFirestore(): Firestore {
  if (db) return db;
  db = getFirestore(getAdminApp());
  return db;
}
