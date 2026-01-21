// ===============================
// 🌍 Imports
// ===============================
import express from "express";
import axios from "axios";
import cors from "cors";
import footballRoutes from "./routes/football.js";
import { admin, initFirebase } from "./firebase.js";

// ===============================
// 🔐 Initialisation Firebase
// ===============================
initFirebase(); // S'assure que Firebase est initialisé
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
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function tomorrowKey() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().slice(0, 10);
}

// ===============================
// ⚽ MATCHS FOOT (AUJOURD’HUI + DEMAIN) avec cache Firestore
// ===============================
app.get("/api/football/matches", async (req, res) => {
  try {
    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "Clé API football manquante" });

    const cacheId = `${todayKey()}-${tomorrowKey()}`;
    const cacheRef = db.collection("football_cache").doc(cacheId);

    // 🔹 Vérifie le cache Firestore
    const cached = await cacheRef.get();
    if (cached.exists) {
      console.log("📦 Matchs chargés depuis Firestore");
      return res.json({
        source: "firestore-cache",
        from: todayKey(),
        to: tomorrowKey(),
        total: cached.data().matches.length,
        matches: cached.data().matches
      });
    }

    // 🔹 Sinon appel Football-Data.org
    console.log("🌐 Requête football-data.org");
    const dateFrom = todayKey();
    const dateTo = tomorrowKey();

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

    // 🔹 Sauvegarde dans Firestore pour la journée
    await cacheRef.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      matches
    });
    console.log("💾 Matchs sauvegardés dans Firestore");

    res.json({
      source: "football-data.org",
      from: dateFrom,
      to: dateTo,
      total: matches.length,
      matches
    });

  } catch (error) {
    console.error("❌ Football API error:", error.response?.status || error.message);
    res.status(500).json({
      error: "Impossible de récupérer les matchs",
      details: error.response?.data || error.message
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
