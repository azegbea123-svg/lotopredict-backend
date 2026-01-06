import express from "express";
import axios from "axios";

const router = express.Router();

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_API_URL = "https://api.football-data.org/v4/matches";

router.get("/matches", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

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
      total: matches.length,
      matches,
    });

  } catch (error) {
    console.error("❌ Football API error:", error.message);
    res.status(500).json({ error: "Erreur récupération matchs" });
  }
});

export default router;
