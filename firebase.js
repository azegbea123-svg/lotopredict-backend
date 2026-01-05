import admin from "firebase-admin";

let firebaseApp;

export function initFirebase() {
  if (!firebaseApp) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    firebaseApp = admin;
    console.log("🔥 Firebase initialisé");
  }
  return firebaseApp;
}

// ✅ Export de l'instance admin pour l'utiliser ailleurs
export { admin };
