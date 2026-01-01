import axios from "axios";

export async function getTodayMatches(db) {
  const today = new Date().toISOString().slice(0, 10);

  const response = await axios.get("https://v3.football.api-sports.io/fixtures", {
    params: { date: today },
    headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY },
  });

  const matches = response.data.response;

  // Stocker ou mettre à jour les matchs dans Firestore
  for (const match of matches) {
    await db.collection("football_matches").doc(match.fixture.id.toString()).set(match, { merge: true });
  }

  return matches;
}
