// server.js
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// -------------------------
// ⚽ MATCHS DU JOUR – DIRECT
// -------------------------
app.get("/api/football/matches/today", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.football-data.org/v4/matches",
      {
        headers: {
          "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY,
          "User-Agent": "LotoPredict-Football",
        },
        timeout: 10000,
      }
    );

    const matches = response.data.matches.map(m => ({
      id: m.id,
      competition: m.competition?.name,
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
    console.error("❌ Football API error:", error.response?.status);

    res.status(500).json({
      error: "Impossible de récupérer les matchs",
    });
  }
});

// -------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 FootballPredict API en ligne sur port ${PORT}`);
});
