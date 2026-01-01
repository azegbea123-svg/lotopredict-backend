import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   CONFIG APIs (ordre de priorité)
================================ */

const APIS = [
  {
    name: "api-football",
    url: (date) =>
      `https://v3.football.api-sports.io/fixtures?date=${date}`,
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY,
    },
    parse: (data) => data?.response || [],
  },
  {
    name: "rapidapi-football",
    url: (date) =>
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${date}`,
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
    },
    parse: (data) => data?.response || [],
  },
];

/* ===============================
   FONCTION FALLBACK AUTOMATIQUE
================================ */

async function fetchFootballMatches(date) {
  for (const api of APIS) {
    try {
      console.log(`🔄 Tentative via ${api.name}`);

      const res = await fetch(api.url(date), {
        headers: api.headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      const matches = api.parse(json);

      if (matches.length > 0) {
        console.log(`✅ Données reçues depuis ${api.name}`);
        return {
          source: api.name,
          matches,
        };
      }
    } catch (err) {
      console.warn(`❌ ${api.name} indisponible →`, err.message);
    }
  }

  throw new Error("Aucune API football disponible");
}

/* ===============================
   ROUTE MATCHS DU JOUR
================================ */

app.get("/api/football/matches/today", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  try {
    const data = await fetchFootballMatches(today);
    res.json(data);
  } catch (err) {
    res.status(503).json({
      error: "Services football indisponibles",
    });
  }
});

/* ===============================
   TEST SERVEUR
================================ */

app.get("/", (req, res) => {
  res.send("✅ Football API Server actif");
});

/* ===============================
   LANCEMENT SERVEUR
================================ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur football lancé sur le port ${PORT}`);
});
