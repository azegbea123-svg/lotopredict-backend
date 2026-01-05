import fetch from "node-fetch"; // si Node 22+, tu peux utiliser fetch global
import { admin, initFirebase } from "../firebase.js";

initFirebase();

const db = admin.firestore();

export async function fetchAndStoreTodaysMatches() {
  const today = new Date().toISOString().slice(0, 10);

  const response = await fetch("https://api.football-data.org/v4/matches", {
    headers: {
      "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY,
    },
  });

    if (!response.ok) {
      throw new Error(`API Football Data error: ${response.status}`);
    }

  const data = await response.json();
  const matches = data.matches || [];

  for (const match of matches) {
    await db
      .collection("football_matches")
      .doc(String(match.id))
      .set(
        {
          ...match,
          fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }

  return {
    success: true,
    date: today,
    matches,
  };
}

/**
 * Enregistre les matchs dans Firestore par date
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
 * Génère + stocke automatiquement les matchs du jour depuis Football Data
 */
export async function fetchAndStoreTodaysMatches() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const matches = await fetchTodaysMatchesFromAPI(dateStr);
  await saveFootballMatchesByDate(dateStr, matches);

  return { date: dateStr, matches };
}

/**
 * Récupère les matchs d'une date
 */
export async function getFootballMatchesByDate(date) {
  const ref = db.collection("football_matches").doc(date);
  const snap = await ref.get();

  if (!snap.exists) return { date, matches: [] };
  return snap.data();
}
