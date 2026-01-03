// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const CACHE_DIR = "./cache";
const TODAY = new Date().toISOString().slice(0, 10);
const CACHE_FILE = path.join(CACHE_DIR, `matches-${TODAY}.json`);

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

// --------------------
// 🔹 Utils
// --------------------
function readCache() {
  if (fs.existsSync(CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  }
  return null;
}

function writeCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

// --------------------
// 🔹 Stats & Prediction
// --------------------
function formScore(form) {
  const map = { W: 3, D: 1, L: 0 };
  return form.split("").reduce((s, r) => s + map[r], 0);
}

function generatePrediction(home, away) {
  let score = 0;
  score += home.formScore - away.formScore;
  score += home.h2h.homeWin - away.h2h.awayWin;
  score += home.avgGoals > away.avgGoals ? 1 : 0;

  let result = "X";
  if (score > 2) result = "1";
  if (score < -2) result = "2";

  const confidence = Math.min(90, Math.max(55, Math.abs(score) * 10 + 50));
  return { result, confidence };
}

// --------------------
// 🔹 Fetch & Build Matches
// --------------------
async function fetchMatchesToday() {
  const response = await axios.get(
    "https://api.football-data.org/v4/matches?dateFrom=" + TODAY + "&dateTo=" + TODAY,
    {
      headers: {
        "X-Auth-Token": API_TOKEN,
        "User-Agent": "LotoPredict/1.0"
      },
      timeout: 30000
    }
  );

  return response.data.matches || [];
}

// --------------------
// 🔹 Route principale
// --------------------
app.get("/api/football/matches/today", async (req, res) => {
  try {
    const cached = readCache();
    if (cached) {
      return res.json({ source: "cache", matches: cached });
    }

    const rawMatches = await fetchMatchesToday();

    const enriched = rawMatches.map(m => {
      const homeForm = "WWDLW"; // placeholder stable
      const awayForm = "LDWLW";

      const homeData = {
        form: homeForm,
        formScore: formScore(homeForm),
        avgGoals: 1.8,
        h2h: { homeWin: 55, draw: 20, awayWin: 25 }
      };

      const awayData = {
        form: awayForm,
        formScore: formScore(awayForm),
        avgGoals: 1.4,
        h2h: { homeWin: 25, draw: 20, awayWin: 55 }
      };

      const prediction = generatePrediction(homeData, awayData);

      return {
        id: m.id,
        date: m.utcDate,
        league: {
          name: m.competition.name,
          country: m.area.name
        },
        teams: {
          home: m.homeTeam.name,
          away: m.awayTeam.name
        },
        prediction
      };
    });

    writeCache(enriched);
    res.json({ source: "api", matches: enriched });

  } catch (err) {
    console.error("❌ Erreur football:", err.message);
    res.status(500).json({ error: "Football service unavailable" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 FootballPredict API running on port ${PORT}`);
});
