// ===============================
// 🌍 Imports
// ===============================
import express from "express";
import axios from "axios";
import cors from "cors";
import admin from "firebase-admin";

// ===============================
// 🔐 Firebase Admin (UNE SEULE FOIS)
// ===============================
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ===============================
// 🚀 App Express
// ===============================
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ===============================
// ⚽ FOOTBALL-DATA.ORG CONFIG
// ===============================
const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const FOOTBALL_API_URL = "https://api.football-data.org/v4/matches";

// ===============================
// 📅 Utilitaire date du jour
// ===============================
function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ===============================
// ⚽ MATCHS DU JOUR (CACHE FIRESTORE)
// ===============================
app.get("/api/football/matches/today", async (req, res) => {
  const cacheId = todayKey();
  const cacheRef = db.collection("football_cache").doc(cacheId);

  try {
    // 🔹 1️⃣ Vérifier le cache Firestore
    const cached = await cacheRef.get();
    if (cached.exists) {
      console.log("📦 Matchs chargés depuis Firestore");
      return res.json({
        source: "firestore-cache",
        matches: cached.data().matches,
      });
    }

    // 🔹 2️⃣ Appel API football-data.org
    console.log("🌐 Requête football-data.org");
    const response = await axios.get(FOOTBALL_API_URL, {
      headers: {
        "X-Auth-Token": FOOTBALL_API_KEY,
        "User-Agent": "LotoPredict-FootballPredict",
      },
      timeout: 10000,
    });

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

    // 🔹 3️⃣ Sauvegarde Firestore
    await cacheRef.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      matches,
    });

    console.log("💾 Matchs sauvegardés dans Firestore");

    res.json({
      source: "football-data.org",
      matches,
    });

  } catch (error) {
    console.error(
      "❌ Erreur football:",
      error.response?.status,
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      error: "Football API error",
      details: error.response?.data || error.message,
    });
  }
});

// ===============================
// 🚀 LANCEMENT SERVEUR
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict Backend en ligne sur port ${PORT}`);
});
