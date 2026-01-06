import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_API_URL = "https://api.football-data.org/v4/matches";

// ===============================
// ⚽ TOUS LES MATCHS DU JOUR
// ===============================
app.get("/api/football/matches", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const response = await axios.get(
      `${FOOTBALL_API_URL}?dateFrom=${today}&dateTo=${today}`,
      {
        headers: {
          "X-Auth-Token": API_KEY,
          "User-Agent": "LotoPredict-Football",
        },
        timeout: 10000,
      }
    );

    const matches = (response.data.matches || []).map(m => ({
      id: m.id,
      competition: m.competition?.name || "Inconnu",
      date: m.utcDate,
      status: m.status,
      home: m.homeTeam?.name,
      away: m.awayTeam?.name,
      score: {
        home: m.score?.fullTime?.home,
        away: m.score?.fullTime?.away,
      },
    }));

    res.json({
      source: "football-data.org",
      total: matches.length,
      matches,
    });

  } catch (error) {
    console.error("❌ Football API error:", error.message);

    res.status(500).json({
      error: "Impossible de récupérer les matchs",
    });
  }
});

// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 FootballPredict API en ligne sur port ${PORT}`);
});
