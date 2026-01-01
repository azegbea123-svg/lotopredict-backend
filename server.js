import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   CACHE JOURNALIER (ANTI-BAN)
================================ */

let dailyCache = {
  date: null,
  matches: null,
  source: null,
};

/* ===============================
   CONFIG APIs (PRIORITÉ + FALLBACK)
================================ */

const FOOTBALL_APIS = [
  {
    name: "rapidapi-football",
   url: () =>
  `https://free-api-live-football-data.p.rapidapi.com/football-players-search?search=m`,

    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      "User-Agent": "LotoPredict/1.0 (contact: support@lotopredict.app)",
    },
    parse: (json) => json?.response || [],
  },
  {
    name: "api-football-direct",
    url: (date) =>
      `https://v3.football.api-sports.io/fixtures?date=${date}`,
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY,
      "User-Agent": "LotoPredict/1.0 (contact: support@lotopredict.app)",
    },
    parse: (json) => json?.response || [],
  },
];

/* ===============================
   FETCH AVEC FALLBACK + CACHE
================================ */

async function getMatchesWithFallback(date) {
  // 🧠 Cache journalier
  if (dailyCache.date === date && dailyCache.matches) {
    console.log("📦 Données servies depuis le cache");
    return {
      source: "cache",
      matches: dailyCache.matches,
    };
  }

  for (const api of FOOTBALL_APIS) {
    try {
      console.log(`🔄 Tentative API : ${api.name}`);

      const res = await fetch(api.url(date), {
        headers: api.headers,
        timeout: 8000,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      const matches = api.parse(json);

      if (matches.length > 0) {
        console.log(`✅ Succès via ${api.name}`);

        // 🧠 Sauvegarde cache
        dailyCache = {
          date,
          matches,
          source: api.name,
        };

        return {
          source: api.name,
          matches,
        };
      }
    } catch (err) {
      console.warn(`❌ ${api.name} indisponible → ${err.message}`);
    }
  }

  throw new Error("Aucune API football disponible");
}

/* ===============================
   ROUTE : MATCHS DU JOUR
================================ */

app.get("/api/football/matches/today", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  console.log("📅 Date demandée :", today);

  try {
    const data = await getMatchesWithFallback(today);
    console.log("📊 Nombre de matchs :", data.matches.length);
    res.json(data);
  } catch (err) {
    console.error("🔥 ERREUR FOOTBALL :", err.message);
    res.status(503).json({
      error: err.message,
    });
  }
});


/* ===============================
   ROUTE TEST
================================ */

app.get("/", (req, res) => {
  res.send("✅ FootballPredict backend actif");
});

/* ===============================
   LANCEMENT SERVEUR
================================ */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur FootballPredict lancé sur le port ${PORT}`);
});
