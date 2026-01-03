// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const PORT = process.env.PORT || 10000;
const CACHE_FILE = "./cache-matches-today.json";

// 🔹 Helper : lecture du cache
function readCache() {
  if (fs.existsSync(CACHE_FILE)) {
    const data = fs.readFileSync(CACHE_FILE, "utf-8");
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

// 🔹 Helper : écriture du cache
function writeCache(matches) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(matches, null, 2));
  console.log("💾 Cache journalier mis à jour");
}

// -------------------------
// ⚽ Route : matchs du jour
// -------------------------
app.get("/api/football/matches/today", async (req, res) => {
  try {
    // ✅ Si cache existant et valide (aujourd'hui)
    const cached = readCache();
    if (cached && cached.date === new Date().toISOString().slice(0, 10)) {
      console.log("🔹 Retour cache local");
      return res.json({ source: "cache", matches: cached.matches });
    }

    // ✅ Sinon, requête vers football-data.org
    console.log("🔄 Récupération depuis football-data.org...");
    const response = await axios.get("https://api.football-data.org/v4/matches", {
      headers: {
        "X-Auth-Token": API_KEY,
        "User-Agent": "LotoPredict-FootballPredict",
      },
      timeout: 10000,
    });

    const matches = response.data.matches.map((m) => ({
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

    // 🔹 Écriture du cache
    writeCache({
      date: new Date().toISOString().slice(0, 10),
      matches,
    });

    res.json({ source: "football-data.org", matches });
  } catch (error) {
    console.error("❌ football-data.org error:", error.response?.status, error.response?.data || error.message);

    res.status(500).json({
      error: "Impossible de récupérer les matchs",
      details: error.response?.data || error.message,
    });
  }
});

// -------------------------
// 🚀 Lancement du serveur
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 FootballPredict API en ligne sur port ${PORT}`);
});
