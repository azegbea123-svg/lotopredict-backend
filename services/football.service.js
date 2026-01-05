import admin from "firebase-admin";

const db = admin.firestore();

/**
 * Enregistre les matchs par date dans Firestore
 */
export async function saveFootballMatchesByDate(date, matches) {
  const ref = db.collection("football_matches").doc(date);

  await ref.set(
    {
      date,
      matches,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

/**
 * Récupère les matchs d'une date précise
 */
export async function getFootballMatchesByDate(date) {
  const ref = db.collection("football_matches").doc(date);
  const snap = await ref.get();

  if (!snap.exists) {
    return { date, matches: [] };
  }

  return snap.data();
}
