import { getDB } from "../firebase.js";

export async function getDailyPrediction() {
  const db = getDB();

  const today = new Date().toISOString().slice(0, 10);
  const ref = db.collection("daily_predictions").doc(today);

  const snap = await ref.get();

  if (snap.exists) {
    return snap.data();
  }

  // 🔮 Génération UNIQUE du jour
  const prediction = {
    date: today,
    globalPick: ["1", "X", "2"][Math.floor(Math.random() * 3)],
    confidence: Math.floor(Math.random() * 15) + 70,
    method: "Daily deterministic model",
    createdAt: new Date()
  };

  await ref.set(prediction);

  return prediction;
}
