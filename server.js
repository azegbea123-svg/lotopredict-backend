import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

/**
 * ⚽ Matchs du jour – vraie API
 */
app.get("/api/football/matches/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await axios.get(
      `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}`,
      {
        headers: {
          "X-Auth-Token": API_KEY,
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
    console.error("❌ Football API error:", error.response?.status || error.message);

    res.status(500).json({
      error: "Impossible de récupérer les matchs aujourd’hui",
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict Football API en ligne sur ${PORT}`);
});
