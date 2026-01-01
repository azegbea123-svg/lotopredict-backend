import express from "express";
import cors from "cors";
import fs from "fs";
import axios from "axios";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = "./data";
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// ------------------
// UTILS
// ------------------
const todayFile = () => {
  const d = new Date().toISOString().slice(0,10);
  return `${DATA_DIR}/matches-${d}.json`;
};

// ------------------
// METHOD 2 : PUPPETEER
// ------------------
async function fetchWithBrowser() {
  console.log("🌐 Puppeteer: récupération des matchs...");
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();

  await page.goto("https://www.flashscore.com/football/", { waitUntil: "networkidle2" });

  const matches = await page.evaluate(() => {
    const rows = document.querySelectorAll(".event__match");
    return Array.from(rows).map(row => ({
      home: row.querySelector(".event__participant--home")?.innerText,
      away: row.querySelector(".event__participant--away")?.innerText,
      time: row.querySelector(".event__time")?.innerText
    })).filter(m => m.home && m.away);
  });

  await browser.close();
  return matches;
}

// ------------------
// METHOD 3 : OPEN DATA FALLBACK
// ------------------
async function fetchFromOpenData() {
  console.log("📦 OpenData fallback...");
  const url = "https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/en.1.json";
  const { data } = await axios.get(url);

  const today = new Date().toISOString().slice(0,10);
  const matches = data.matches.filter(m => m.date === today);

  return matches.map(m => ({
    home: m.team1,
    away: m.team2,
    time: m.time || "?"
  }));
}

// ------------------
// MAIN PROVIDER
// ------------------
async function getMatchesToday() {
  try {
    const matches = await fetchWithBrowser();
    if (matches.length) return matches;
  } catch (e) {
    console.warn("⚠️ Puppeteer échoué");
  }

  return await fetchFromOpenData();
}

// ------------------
// ROUTE
// ------------------
app.get("/api/football/matches/today", async (req, res) => {
  const file = todayFile();

  if (fs.existsSync(file)) {
    return res.json(JSON.parse(fs.readFileSync(file)));
  }

  const matches = await getMatchesToday();
  fs.writeFileSync(file, JSON.stringify(matches, null, 2));

  res.json(matches);
});

// ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 FootballPredict en ligne sur ${PORT}`));
