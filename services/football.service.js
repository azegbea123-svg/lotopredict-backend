import fetch from "node-fetch"; // si Node 22+, tu peux utiliser fetch global
import { admin, initFirebase } from "../firebase.js";

initFirebase();

const db = admin.firestore();

/**
 * Récupère les matchs du jour depuis l'API Football Data
 * et les stocke dans Firestore sous football_matches/{date}
 */
export async function fetchAndStoreTodaysMatches() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Appel API Football Data
  const response = await fetch(
    `https://api.football-data.org/v4/matches`,
    {
      headers: {
        "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Football API error: ${response.status}`);
  }

  const data = await response.json();
  const matches = data.matches || [];

  // Stockage Firestore par date
  const ref = db.collection("football_matches").doc(dateStr);
  await ref.set(
    {
      date: dateStr,
      matches,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

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
