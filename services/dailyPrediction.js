import { getDB } from "../firebase.js";

/**
 * Clé unique par jour (ex: 2026-01-07)
 */
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

/**
 * 1X2
 */
function predict1X2() {
  const outcomes = ["1", "N", "2"];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

/**
 * Over / Under
 * (logique simple, améliorable plus tard)
 */
function predictOverUnder() {
  const avgGoals = Math.random() * 4; // simulation
  if (avgGoals >= 2.6) return "OVER 2.5";
  if (avgGoals >= 1.6) return "OVER 1.5";
  return "UNDER 2.5";
}

/**
 * BTTS – Both Teams To Score
 */
function predictBTTS() {
  return Math.random() > 0.45 ? "YES" : "NO";
}

/**
 * Score probable
 */
function predictScore(result) {
  if (result === "1") return "2-1";
  if (result === "2") return "1-2";
  return "1-1";
}

/**
 * Prédiction complète d’un match
 */
function predictMatch(match) {
  const result = predict1X2();

  return {
    home: match.home,
    away: match.away,

    markets: {
      result,                 // 1X2
      overUnder: predictOverUnder(),
      btts: predictBTTS(),
      score: predictScore(result),
    },

    confidence: Math.floor(65 + Math.random() * 25), // 65–90%
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
