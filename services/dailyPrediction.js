import { getDB } from "../firebase.js";

/**
 * Génère une clé unique par jour
 * ex: 2026-01-07
 */
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Algo simple (améliorable plus tard avec stats réelles)
 */
function predictMatch(match) {
  const outcomes = ["1", "N", "2"];
  const choice = outcomes[Math.floor(Math.random() * outcomes.length)];

  return {
    home: match.home,
    away: match.away,
    prediction: choice,
    confidence: Math.floor(60 + Math.random() * 30), // 60–90%
  };
}

export async function getDailyPrediction(matches) {
  const db = getDB();
  const todayKey = getTodayKey();

  const ref = db.collection("daily_predictions").doc(todayKey);
  const snap = await ref.get();

  // ✅ Cache journalier
  if (snap.exists) {
    return {
      source: "cache",
      date: todayKey,
      predictions: snap.data().predictions,
    };
  }

  // 🔮 Génération unique pour la journée
  const predictions = matches.map(predictMatch);

  await ref.set({
    date: todayKey,
    predictions,
    createdAt: new Date(),
  });

  return {
    source: "generated",
    date: todayKey,
    predictions,
  };
}
