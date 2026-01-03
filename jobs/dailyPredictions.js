import { fetchTodayMatches } from "../services/footballData.js";
import { getCachedMatches, saveMatchesToCache } from "../services/cacheService.js";
import { computeForm, computeH2H } from "../services/statsService.js";
import { predict } from "../services/predictionService.js";

const FIREBASE_URL = process.env.FIREBASE_DB_URL;

export async function runDailyJob() {
  const date = new Date().toISOString().split("T")[0];

  let cached = await getCachedMatches(date);
  let matches;

  if (!cached?.data) {
    matches = await fetchTodayMatches();
    await saveMatchesToCache(date, matches);
  } else {
    matches = cached.data;
  }

  const predictions = {};

  for (const m of matches) {
    const homeForm = computeForm([]); // à enrichir
    const awayForm = computeForm([]);
    const h2h = computeH2H([]);

    const prono = predict(homeForm, awayForm, h2h);

    predictions[m.id] = {
      match: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
      prediction: prono.pick,
      confidence: prono.confidence
    };
  }

  await fetch(`${FIREBASE_URL}/predictions/${date}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(predictions)
  });
}
