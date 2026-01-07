// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ===============================
// ⚽ CONFIG FOOTBALL-DATA
// ===============================
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_URL = "https://api.football-data.org/v4/matches";

// ===============================
// 📁 CACHE LOCAL
// ===============================
const CACHE_DIR = path.join(process.cwd(), "cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function cacheFilePath() {
  return path.join(CACHE_DIR, `matches-${todayKey()}.json`);
}

// ===============================
// ⚽ ROUTE MATCHS DU JOUR
// ===============================
app.get("/api/football/matches", async (req, res) => {
  const filePath = cacheFilePath();

  // 1️⃣ Lire le cache si existant
  if (fs.existsSync(filePath)) {
    console.log("📦 Matchs chargés depuis le cache local");
    const cached = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return res.json({
      source: "cache",
      total: cached.length,
      matches: cached
    });
  }

  // 2️⃣ Sinon → appel API
  try {
    console.log("🌍 Appel football-data.org");

    const today = todayKey();
    const response = await axios.get(
      `${API_URL}?dateFrom=${today}&dateTo=${today}`,
      {
        headers: {
          "X-Auth-Token": API_KEY,
          "User-Agent": "LotoPredict/1.0"
        },
        timeout: 10000
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
        away: m.score?.fullTime?.away
      }
    }));

    // 3️⃣ Sauvegarde cache
    fs.writeFileSync(filePath, JSON.stringify(matches, null, 2));
    console.log("💾 Cache journalier créé");

    res.json({
      source: "football-data.org",
      total: matches.length,
      matches
    });

  } catch (err) {
    console.error("❌ Erreur football-data:", err.message);
    res.status(500).json({
      error: "Impossible de récupérer les matchs"
    });
  }
});

// ===============================
// 🚀 SERVER
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict Football API en ligne sur ${PORT}`);
});
