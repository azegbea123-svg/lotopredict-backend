import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ⚽ API Football
const FOOTBALL_API_URL = "https://v3.football.api-sports.io/fixtures";
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;

function today() {
  return new Date().toISOString().split("T")[0];
}

// 📥 Matchs du jour
app.get("/football/matches-today", async (req, res) => {
  try {
    const response = await axios.get(FOOTBALL_API_URL, {
      params: { date: today() },
      headers: { "x-apisports-key": FOOTBALL_API_KEY },
    });

    res.json({
      date: today(),
      matches: response.data.response,
    });
  } catch (err) {
    console.error("Erreur matchs:", err.message);
    res.status(500).json({ error: "Impossible de récupérer les matchs" });
  }
});

// 🔮 Prédictions simples
app.get("/football/predictions-today", async (req, res) => {
  try {
    const response = await axios.get(FOOTBALL_API_URL, {
      params: { date: today() },
      headers: { "x-apisports-key": FOOTBALL_API_KEY },
    });

    const predictions = response.data.response.map(m => ({
      fixtureId: m.fixture.id,
      match: `${m.teams.home.name} vs ${m.teams.away.name}`,
      prediction: "Plus de 1.5 buts", // logique à enrichir
      league: m.league.name,
    }));

    res.json({
      date: today(),
      total: predictions.length,
      predictions,
    });
  } catch (err) {
    console.error("Erreur prédictions:", err.message);
    res.status(500).json({ error: "Impossible de générer les prédictions" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 FootballPredict sans Firebase Admin");
});
