import admin from "firebase-admin";

let firebaseApp;
let db = null; // pas const ici, pour pouvoir initialiser conditionnellement

export function initFirebase() {
  if (!firebaseApp) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("❌ FIREBASE_SERVICE_ACCOUNT non défini !");
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // projectId sera automatiquement détecté depuis serviceAccount
    });

    db = admin.firestore();
    firebaseApp = admin;
    console.log("🔥 Firebase initialisé");
  }
  return firebaseApp;
}

export { admin };
