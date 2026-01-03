// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import path from "path";
import admin from "firebase-admin";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// 🔹 Init Firebase Admin (optionnel)
if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.apps.length ? admin.firestore() : null;

// -------------------------
// Helper : lire ou écrire cache local
// -------------------------
const getCachePath = () => {
  const today = new Date().toISOString().slice(0, 10);
  const cacheDir = path.join('.', 'cache');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  return path.join(cacheDir, `matches-${today}.json`);
};

const readCache = () => {
  const cacheFile = getCachePath();
  if (fs.existsSync(cacheFile)) {
    const content = fs.readFileSync(cacheFile, "utf-8");
    return JSON.parse(content);
  }
  return null;
};

const writeCache = (matches) => {
  const cacheFile = getCachePath();
  fs.writeFileSync(cacheFile, JSON.stringify(matches, null, 2));
  console.log(`💾 Cache créé : ${cacheFile}`);
};

// -------------------------
// Route : matchs du jour
// -------------------------
app.get("/api/football/matches/today", async (req, res) => {
  try {
    // 1️⃣ Vérifie le cache
    const cached = readCache();
    if (cached) {
      return res.json({ source: "cache", total: cached.length, matches: cached });
    }

    // 2️⃣ Sinon, fetch depuis football-data.org
    const response = await axios.get(
      "https://api.football-data.org/v4/matches",
      {
        headers: {
          "X-Auth-Token": API_KEY,
          "User-Agent": "LotoPredict-FootballPredict",
        },
        timeout: 10000,
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
        away: m.score?.fullTime?.away,
      },
    }));

    // 3️⃣ Stocke en cache local
    writeCache(matches);

    // 4️⃣ Stocke dans Firestore si activé
    if (db) {
      const batch = db.batch();
      matches.forEach(match => {
        const docRef = db.collection("football_matches").doc(match.id.toString());
        batch.set(docRef, match);
      });
      await batch.commit();
      console.log("💾 Matchs stockés dans Firestore");
    }

    // 5️⃣ Retour au frontend
    res.json({ source: "football-data.org", total: matches.length, matches });

  } catch (error) {
    console.error("❌ football-data.org error:", error.response?.status, error.message);
    res.status(error.response?.status || 500).json({
      error: "football-data.org error",
      details: error.response?.data || error.message,
    });
  }
});

// -------------------------
// Lancer le serveur
// -------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 FootballPredict backend en ligne sur port ${PORT}`);
});
