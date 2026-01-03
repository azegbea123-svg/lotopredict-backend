// server.js
import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// 🔍 Log de sécurité (clé masquée)
console.log(
  "🔑 FOOTBALL DATA KEY:",
  API_KEY ? API_KEY.slice(0, 4) + "****" : "ABSENTE"
);

// -------------------------
// ⚽ Matchs du jour
// -------------------------
app.get("/api/football/matches/today", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.football-data.org/v4/matches",
      {
        headers: {
          "X-Auth-Token": API_KEY,
          "User-Agent": "LotoPredict-FootballPredict",
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
    console.error(
      "❌ football-data.org error:",
      error.response?.status,
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      error: "football-data.org error",
      details: error.response?.data || error.message,
    });
  }
});

// -------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 FootballPredict API en ligne sur port ${PORT}`);
});
