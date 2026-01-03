// server.js
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

if (!API_KEY) {
  console.error("❌ FOOTBALL_DATA_API_KEY manquante");
}

// -------------------------
// 🔹 Récupérer les matchs du jour
// -------------------------
app.get("/api/football/matches/today", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.football-data.org/v4/matches",
      {
        headers: {
          "X-Auth-Token": API_KEY,
          "User-Agent": "LotoPredict/FootballPredict",
        },
        timeout: 10000,
      }
    );

    const matches = response.data.matches.map(match => ({
      id: match.id,
      competition: match.competition?.name || "N/A",
      date: match.utcDate,
      status: match.status,
      home: match.homeTeam?.name,
      away: match.awayTeam?.name,
      score: {
        home: match.score?.fullTime?.home,
        away: match.score?.fullTime?.away,
      },
    }));

    res.json({
      source: "football-data.org",
      count: matches.length,
      matches,
    });

  } catch (err) {
    console.error("❌ football-data.org error:", err.response?.status, err.message);

    res.status(503).json({
      error: "football-data.org indisponible",
      details: err.response?.data || null,
    });
  }
});

// -------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 FootballPredict backend en ligne sur port ${PORT}`);
});
