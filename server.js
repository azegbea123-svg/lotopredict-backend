// ===============================
// 🌍 Imports
// ===============================
import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import path from "path";
import { admin, initFirebase } from "./firebase.js";

// ===============================
// 🔐 Firebase
// ===============================
initFirebase();
const db = admin.firestore();

// ===============================
// 🚀 App Express
// ===============================
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ===============================
// 📁 CACHE LOCAL (PC)
// ===============================
const CACHE_DIR = "D:/lotopredict-backend/cache";
const LOCAL_CACHE_FILE = path.join(CACHE_DIR, "football-matches.json");
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 heures

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readLocalCache(cacheId) {
  try {
    if (!fs.existsSync(LOCAL_CACHE_FILE)) return null;

    const raw = fs.readFileSync(LOCAL_CACHE_FILE, "utf-8");
    const data = JSON.parse(raw);

    if (data.cacheId !== cacheId) return null;

    const age = Date.now() - data.timestamp;
    if (age > CACHE_TTL) {
      console.log("🕒 Cache local expiré");
      return null;
    }

    console.log("💾 Matchs chargés depuis le cache LOCAL (PC)");
    return data.matches;
  } catch (e) {
    console.error("❌ Erreur lecture cache local :", e.message);
    return null;
  }
}

function writeLocalCache(cacheId, matches) {
  try {
    ensureCacheDir();
    fs.writeFileSync(
      LOCAL_CACHE_FILE,
      JSON.stringify(
        {
          cacheId,
          timestamp: Date.now(),
          matches
        },
        null,
        2
      )
    );
    console.log("💽 Cache local sauvegardé sur le PC");
  } catch (e) {
    console.error("❌ Erreur écriture cache local :", e.message);
  }
}

// ===============================
// 📅 Dates
// ===============================
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowKey() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().slice(0, 10);
}

// ===============================
// ⚽ MATCHS FOOTBALL
// LOCAL → FIRESTORE → API
// ===============================
app.get("/api/football/matches", async (req, res) => {
  const dateFrom = todayKey();
  const dateTo = tomorrowKey();
  const cacheId = `${dateFrom}-${dateTo}`;

  try {
    // ===============================
    // 1️⃣ CACHE LOCAL
    // ===============================
    const localMatches = readLocalCache(cacheId);
    if (localMatches) {
      return res.json({
        source: "local-cache",
        from: dateFrom,
        to: dateTo,
        total: localMatches.length,
        matches: localMatches
      });
    }

    // ===============================
    // 2️⃣ FIRESTORE
    // ===============================
    const cacheRef = db.collection("football_cache").doc(cacheId);
    const cached = await cacheRef.get();

    if (cached.exists) {
      console.log("📦 Matchs depuis Firestore");
      const matches = cached.data().matches || [];

      writeLocalCache(cacheId, matches);

      return res.json({
        source: "firestore-cache",
        from: dateFrom,
        to: dateTo,
        total: matches.length,
        matches
      });
    }

    // ===============================
    // 3️⃣ API FOOTBALL-DATA
    // ===============================
    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "Clé API football manquante" });
    }

    console.log("🌐 Requête football-data.org");

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

    await cacheRef.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      matches
    });

    writeLocalCache(cacheId, matches);

    return res.json({
      source: "football-data.org",
      from: dateFrom,
      to: dateTo,
      total: matches.length,
      matches
    });

  } catch (error) {
    console.error("❌ Erreur Football :", error.message);

    // ===============================
    // 🆘 FALLBACK LOCAL
    // ===============================
    const fallback = readLocalCache(cacheId);
    if (fallback) {
      return res.json({
        source: "local-cache-fallback",
        from: dateFrom,
        to: dateTo,
        total: fallback.length,
        matches: fallback
      });
    }

    res.status(503).json({
      error: "Toutes les sources sont indisponibles",
      details: error.message
    });
  }
});

// ===============================
// 🚀 Serveur
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict Football API en ligne sur port ${PORT}`);
});
