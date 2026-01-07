import admin from "firebase-admin";

let firebaseApp;
let db;

export function initFirebase() {
  if (!firebaseApp) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("❌ FIREBASE_SERVICE_ACCOUNT non défini !");
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    firebaseApp = admin;

    console.log("🔥 Firebase initialisé");
  }
  return firebaseApp;
}

export function getDB() {
  if (!db) {
    throw new Error("❌ Firestore non initialisé. Appelle initFirebase() avant.");
  }
  return db;
}

export { admin };
