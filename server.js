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
// 📅 Utilitaires dates
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
// 💾 CACHE LOCAL (fichier)
// ===============================
const CACHE_DIR = path.resolve("cache");
const LOCAL_CACHE_FILE = path.join(CACHE_DIR, "football_matches.json");

function readLocalCache(cacheId) {
  if (!fs.existsSync(LOCAL_CACHE_FILE)) return null;

  const data = JSON.parse(fs.readFileSync(LOCAL_CACHE_FILE, "utf8"));
  if (data.cacheId !== cacheId) return null;

  return data.matches;
}

function writeLocalCache(cacheId, matches) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
  }

  fs.writeFileSync(
    LOCAL_CACHE_FILE,
    JSON.stringify(
      {
        cacheId,
        savedAt: new Date().toISOString(),
        matches
      },
      null,
      2
    )
  );
}

// ===============================
// ⚽ MATCHS FOOT (AUJOURD’HUI + DEMAIN)
// cache : LOCAL → FIRESTORE → API
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
      console.log("📦 Matchs depuis cache LOCAL");
      return res.json({
        source: "local-cache",
        from: dateFrom,
        to: dateTo,
        total: localMatches.length,
        matches: localMatches
      });
    }

    // ===============================
    // 2️⃣ CACHE FIRESTORE
    // ===============================
    const cacheRef = db.collection("football_cache").doc(cacheId);
    const cached = await cacheRef.get();

    if (cached.exists) {
      console.log("📦 Matchs depuis Firestore");

      const matches = cached.data().matches || [];
      writeLocalCache(cacheId, matches); // synchro local

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

    // ===============================
    // 💾 SAUVEGARDES
    // ===============================
    await cacheRef.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      matches
    });

    writeLocalCache(cacheId, matches);

    console.log("💾 Matchs sauvegardés (Firestore + Local)");

    res.json({
      source: "football-data.org",
      from: dateFrom,
      to: dateTo,
      total: matches.length,
      matches
    });

  } catch (error) {
    console.error("❌ Football error:", error.message);

    res.status(503).json({
      error: "Données indisponibles",
      message: error.message
    });
  }
});

// ===============================
// 🚀 LANCEMENT SERVEUR
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict Football API en ligne sur port ${PORT}`);
});
