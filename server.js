// ===============================
// 🌍 Imports
// ===============================
import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import path from "path";
import footballRoutes from "./routes/football.js";
import { admin, initFirebase } from "./firebase.js";

// ===============================
// 🔐 Initialisation Firebase
// ===============================
initFirebase();
const db = admin.firestore();

// ===============================
// 🚀 App Express
// ===============================
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/api/football", footballRoutes);

// ===============================
// 📅 Utilitaire date
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
// 💾 Cache local PC
// ===============================
const CACHE_DIR = "D:/lotopredict-backend/cache";
const LOCAL_CACHE_FILE = path.join(CACHE_DIR, "football-matches.json");
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12h

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
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
    console.log("💽 Cache local sauvegardé");
  } catch (e) {
    console.error("❌ Cache local write error");
  }
}

function readLocalCache(cacheId) {
  try {
    if (!fs.existsSync(LOCAL_CACHE_FILE)) return null;

    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE_FILE, "utf-8"));
    if (data.cacheId !== cacheId) return null;

    const age = Date.now() - data.timestamp;
    if (age > CACHE_TTL) return null;

    console.log("💾 Cache local utilisé");
    return data.matches;
  } catch {
    return null;
  }
}

// ===============================
// ⚽ MATCHS FOOT (API → FIRESTORE → LOCAL)
// ===============================
app.get("/api/football/matches", async (req, res) => {
  const dateFrom = todayKey();
  const dateTo = tomorrowKey();
  const cacheId = `${dateFrom}-${dateTo}`;
  const cacheRef = db.collection("football_cache").doc(cacheId);

  // ===============================
  // 1️⃣ API FOOTBALL-DATA
  // ===============================
  try {
    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    if (!API_KEY) throw new Error("Clé API manquante");

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

    // 🔒 Sauvegardes
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

  } catch (apiError) {
    console.warn("⚠️ API indisponible :", apiError.response?.status || apiError.message);
  }

  // ===============================
  // 2️⃣ CACHE FIRESTORE
  // ===============================
  try {
    const cached = await cacheRef.get();
    if (cached.exists) {
      console.log("📦 Matchs chargés depuis Firestore");

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
  } catch {
    console.warn("⚠️ Firestore indisponible");
  }

  // ===============================
  // 3️⃣ CACHE LOCAL (PC)
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
  // ❌ ÉCHEC TOTAL
  // ===============================
  res.status(503).json({
    error: "API, Firestore et cache local indisponibles"
  });
});

// ===============================
// 🚀 LANCEMENT SERVEUR
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict Football API en ligne sur port ${PORT}`);
});
