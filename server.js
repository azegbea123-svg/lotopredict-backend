// server.js
import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// --------------------------
// 🔹 Scraping Functions
// --------------------------

async function scrapeSite({ url, matchSelector, homeSelector, awaySelector, timeSelector }) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "LotoPredict/1.0 (+https://lotopredict.app)",
      },
      timeout: 10000, // 10 secondes max
    });

    const $ = cheerio.load(htmlString);
    const matches = [];

    $(matchSelector).each((i, el) => {
      const home = $(el).find(homeSelector).text().trim();
      const away = $(el).find(awaySelector).text().trim();
      const time = $(el).find(timeSelector).text().trim();

      if (home && away) matches.push({ home, away, time });
    });

    return matches;
  } catch (err) {
    console.error(`❌ Erreur scraping ${url}:`, err.message);
    return [];
  }
}

async function getMatchesToday() {
  const sites = [
    {
      name: "SofaScore",
      url: "https://www.sofascore.com/today",
      matchSelector: ".event-row",
      homeSelector: ".home .team-name",
      awaySelector: ".away .team-name",
      timeSelector: ".event-time",
    },
    {
      name: "Flashscore",
      url: "https://www.flashscore.com/football/",
      matchSelector: ".event__match",
      homeSelector: ".event__participant--home",
      awaySelector: ".event__participant--away",
      timeSelector: ".event__time",
    },
    {
      name: "BeSoccer",
      url: "https://www.besoccer.com/matchday",
      matchSelector: ".match-item",
      homeSelector: ".home-name",
      awaySelector: ".away-name",
      timeSelector: ".match-time",
    },
  ];

  let allMatches = [];
  for (const site of sites) {
    console.log(`🔄 Tentative scraping : ${site.name}`);
    const matches = await scrapeSite(site);
    if (matches.length) {
      console.log(`✅ ${matches.length} matchs récupérés depuis ${site.name}`);
      allMatches = allMatches.concat(matches);
      break; // Premier site avec résultats → on stop
    } else {
      console.warn(`⚠️ ${site.name} indisponible ou aucun match`);
    }
  }

  if (!allMatches.length) {
    console.warn("⚠️ Aucun site n'a retourné de matchs, fallback avec JSON vide");
  }

  return allMatches;
}

// --------------------------
// 🔹 Stockage local
// --------------------------
function saveMatchesToFile(matches) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filePath = `./matches-${today}.json`;
  fs.writeFileSync(filePath, JSON.stringify(matches, null, 2));
  console.log(`💾 Matchs sauvegardés dans ${filePath}`);
}

// --------------------------
// 🔹 Routes
// --------------------------
app.get("/api/football/matches/today", async (req, res) => {
  try {
    const matches = await getMatchesToday();
    saveMatchesToFile(matches);
    res.json({ source: "scraping", matches });
  } catch (err) {
    console.error("❌ Erreur /matches/today:", err);
    res.status(500).json({ error: "Impossible de récupérer les matchs" });
  }
});

// --------------------------
// 🔹 Lancer le serveur
// --------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FootballPredict server en ligne sur port ${PORT}`);
});
