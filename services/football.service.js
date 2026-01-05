import fetch from "node-fetch"; // si Node 22+, tu peux utiliser fetch global
import { db } from "../config/firebase.js";

/**
 * Appelle l'API Football Data pour récupérer les matchs du jour
 * @param {string} dateStr - format "YYYY-MM-DD"
 */
export async function fetchTodaysMatchesFromAPI(dateStr) {
  try {
    const response = await fetch(
      `https://api.football-data.com/matches?date=${dateStr}`,
      {
        headers: {
          "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API Football Data error: ${response.status}`);
    }

    const data = await response.json();

    // Adapter la structure pour Firestore
    const matches = data.matches.map(match => ({
      matchId: match.id.toString(),
      league: match.competition.name,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      kickoff: match.utcDate, // format ISO
      prediction: null // plus tard, on appliquera ton algo
    }));

    return matches;
  } catch (error) {
    console.error("❌ fetchTodaysMatchesFromAPI error:", error);
    throw error;
  }
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
