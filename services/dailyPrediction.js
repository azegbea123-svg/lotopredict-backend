// services/dailyPrediction.js
import { admin } from "../firebase.js";

const db = admin.firestore();

// -------------------------
// 🧮 Score déterministe équipe
// -------------------------
function teamScore(teamName, isHome) {
  let score = isHome ? 15 : 0;

  for (let i = 0; i < teamName.length; i++) {
    score += teamName.charCodeAt(i) % 7;
  }

  return score;
}

// -------------------------
// ⚽ Prédiction par match
// -------------------------
function predictMatch(match) {
  const home = teamScore(match.home, true);
  const away = teamScore(match.away, false);

  if (home > away + 5) return "1";
  if (away > home + 5) return "2";
  return "X";
}

// -------------------------
// 🔮 Prédiction globale du jour
// -------------------------
function buildDailyPrediction(matches) {
  const stats = { "1": 0, "X": 0, "2": 0 };

  matches.forEach(m => {
    const p = predictMatch(m);
    stats[p]++;
  });

  const [pick, count] = Object.entries(stats)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    pick,
    confidence: Math.min(95, 60 + count * 3),
    breakdown: stats
  };
}

// -------------------------
// 📅 Clé du jour
// -------------------------
function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// -------------------------
// 🚀 API PRINCIPALE
// -------------------------
export async function getDailyPrediction() {
  const today = todayKey();
  const ref = db.collection("daily_predictions").doc(today);

  // 🔁 Déjà calculée → stable
  const snap = await ref.get();
  if (snap.exists) {
    return { source: "firestore", data: snap.data() };
  }

  // 📦 On prend les matchs déjà en cache
  const cacheSnap = await db
    .collection("football_cache")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (cacheSnap.empty) {
    throw new Error("Aucun match disponible pour la prédiction");
  }

  const matches = cacheSnap.docs[0].data().matches;
  const prediction = buildDailyPrediction(matches);

  const data = {
    date: today,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    method: "deterministic-v1",
    globalPick: prediction.pick,
    confidence: prediction.confidence,
    details: prediction.breakdown
  };

  await ref.set(data);
  return { source: "calculated", data };
}
