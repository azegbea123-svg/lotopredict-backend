import admin from "firebase-admin";

let db = null;

export function initFirebase() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT && !admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    console.log("✅ Firebase initialisé");
  } else {
    console.warn("⚠️ Firebase non initialisé (variable absente ou déjà actif)");
  }

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Firebase non initialisé. Appelle initFirebase() d'abord.");
  }
  return db;
}
