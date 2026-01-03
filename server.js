// server.js
import express from "express";
import axios from "axios";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const CACHE_DIR = "./cache";

// Crée le dossier cache s’il n’existe pas
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

// 🔑 Log de sécurité (clé masquée)
console.log(
  "🔑 FOOTBALL DATA KEY:",
  API_KEY ? API_KEY.slice(0, 4) + "****" : "ABSENTE"
);

// Fonction pour récupérer les matchs depuis le cache local
function getCachedMatches() {
  const today = new Date().toISOString().slice(0, 10);
  const filePath = `${CACHE_DIR}/matches-${today}.json`;

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.error("❌ Erreur lecture cache :", err.message);
    }
  }
  return null;
}

// Fonction pour sauvegarder les matchs dans le cache
function saveMatchesToCache(matches) {
  const today = new Date().toISOString().slice(0, 10);
  const filePath = `${CACHE_DIR}/matches-${today}.json`;
  fs.writeFileSync(filePath, JSON.stringify(matches, null, 2));
  console.log(`💾 Matchs sauvegardés dans ${filePath}`);
}

// Route pour récupérer les matchs du jour
app.get("/api/football/matches/today", async (req, res) => {
  // 🔹 Vérifie le cache
  const cached = getCachedMatches();
  if (cached) {
    return res.json({ source: "cache", total: cached.length, matches: cached });
  }

  // 🔹 Sinon, fetch depuis football-data.org
  try {
    const response = await axios.get("https://api.football-data.org/v4/matches", {
      headers: {
        "X-Auth-Token": API_KEY,
        "User-Agent": "LotoPredict-FootballPredict",
      },
      timeout: 10000,
    });

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

    // 🔹 Sauvegarde dans le cache
    saveMatchesToCache(matches);

    res.json({ source: "football-data.org", total: matches.length, matches });
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
