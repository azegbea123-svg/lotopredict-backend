import express from "express";
import axios from "axios";
import cors from "cors";
import footballRoutes from "./routes/football.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/football", footballRoutes);

// -------------------------
// ⚽ MATCHS FOOT (AUJOURD’HUI + DEMAIN)
// -------------------------
app.get("/api/football/matches", async (req, res) => {
  try {
    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "Clé API football manquante" });
    }

    // Période : aujourd’hui → +1 jour (UTC-safe)
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 1);

    const dateFrom = from.toISOString().split("T")[0];
    const dateTo = to.toISOString().split("T")[0];

    const response = await axios.get(
      `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      {
        headers: {
          "X-Auth-Token": API_KEY,
          "User-Agent": "LotoPredict/1.0"
        },
        timeout: 10000
      }
    );

    const matches = (response.data.matches || []).map(m => ({
      id: m.id,
      competition: m.competition?.name || "Inconnu",
      date: m.utcDate,
      status: m.status,
      home: m.homeTeam?.name || "-",
      away: m.awayTeam?.name || "-",
      score: {
        home: m.score?.fullTime?.home,
        away: m.score?.fullTime?.away
      }
    }));

    res.json({
      source: "football-data.org",
      from: dateFrom,
      to: dateTo,
      total: matches.length,
      matches
    });

  } catch (error) {
    console.error("❌ Football API error:", error.message);

    res.status(500).json({
      error: "Impossible de récupérer les matchs"
    });
  }
});


const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict Football API en ligne sur ${PORT}`);
});
