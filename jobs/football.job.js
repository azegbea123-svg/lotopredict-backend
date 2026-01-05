import { fetchAndStoreTodaysMatches } from "../services/football.service.js";

export async function runDailyFootballPipeline() {
  try {
    console.log("⚽ Football pipeline : démarrage");

    const result = await fetchAndStoreTodaysMatches();

    console.log(
      `✅ Matchs du ${result.date} récupérés et stockés (${result.matches.length})`
    );
  } catch (error) {
    console.error("❌ Football pipeline error:", error.message);
  }
}
