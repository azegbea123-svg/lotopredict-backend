// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import footballRoutes from "./routes/football.js";
import db from "./firebase.js"; // 🔹 Chemin correct selon ton projet

// ===============================
// 🔐 Firebase
// ===============================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseApp)
  });
}

// ===============================
// 🚀 Express
// ===============================
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/football", footballRoutes);

// ===============================
// 📅 Utilitaire date du jour
// ===============================
function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ===============================
// ⚽ MATCHS FOOT (AUJOURD’HUI + DEMAIN) AVEC CACHE FIRESTORE
// ===============================
app.get("/api/football/matches", async (req, res) => {
  try {
    const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "Clé API football manquante" });
    }

    const cacheId = todayKey();
    const cacheRef = db.collection("football_cache").doc(cacheId);

    // 🔹 1️⃣ Vérifier cache Firebase
    const cached = await cacheRef.get();
    if (cached.exists) {
      console.log("📦 Matchs chargés depuis Firebase");
      return res.json({
        source: "firebase-cache",
        matches: cached.data().matches
      });
    }

    // 🔹 2️⃣ Dates du jour → demain
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 1);

    const dateFrom = from.toISOString().split("T")[0];
    const dateTo = to.toISOString().split("T")[0];

    console.log(`🌐 Requête football-data.org du ${dateFrom} au ${dateTo}`);

    // 🔹 3️⃣ Appel API football-data.org
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

    // 🔹 4️⃣ Sauvegarde dans Firebase
    await cacheRef.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      matches
    });
    console.log("💾 Matchs sauvegardés dans Firebase");

    return res.json({
      source: "football-data.org",
      from: dateFrom,
      to: dateTo,
      total: matches.length,
      matches
    });

  } catch (error) {
    console.error("❌ Football API error:", error.response?.status || error.message);
    res.status(500).json({ error: "Impossible de récupérer les matchs" });
  }
});

// ===============================
// 🚀 Lancement serveur
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict Football API en ligne sur ${PORT}`);
});
