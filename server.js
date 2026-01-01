import express from "express";
import cors from "cors";
import axios from "axios";
import admin from "firebase-admin";

// =======================
// 🔐 Firebase Admin
// =======================
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// =======================
// ⚙️ Express
// =======================
const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// =======================
// ⚽ CONFIG FOOTBALL API
// =======================
const FOOTBALL_API_URL = "https://v3.football.api-sports.io/fixtures";
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;

// =======================
// 📅 Récupérer la date du jour
// =======================
function getToday() {
  return new Date().toISOString().split("T")[0];
}

// =======================
// 📥 STOCKER TOUS LES MATCHS DU JOUR
// =======================
async function storeTodayMatches() {
  const today = getToday();

  const response = await axios.get(FOOTBALL_API_URL, {
    params: { date: today },
    headers: { "x-apisports-key": FOOTBALL_API_KEY },
  });

  const matches = response.data.response;

  for (const match of matches) {
    const matchId = match.fixture.id.toString();

    await db.collection("football_matches").doc(matchId).set({
      fixtureId: match.fixture.id,
      date: match.fixture.date,
      league: match.league,
      teams: match.teams,
      goals: match.goals,
      status: match.fixture.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  console.log(`✅ ${matches.length} matchs stockés pour ${today}`);
  return matches.length;
}

// =======================
// 🔮 PRÉDICTIONS JOURNALIÈRES (LOGIQUE SIMPLE)
// =======================
async function generateDailyPredictions() {
  const snapshot = await db.collection("football_matches").get();

  const predictions = [];

  snapshot.forEach(doc => {
    const match = doc.data();

    if (!match.teams || !match.goals) return;

    // 🔹 Logique de base (à améliorer plus tard)
    const prediction =
      match.goals.home > match.goals.away
        ? `${match.teams.home.name} gagne`
        : match.goals.home < match.goals.away
        ? `${match.teams.away.name} gagne`
        : "Match nul";

    predictions.push({
      fixtureId: match.fixtureId,
      prediction,
      league: match.league.name,
      date: match.date,
    });
  });

  // 🔹 Sauvegarde des prédictions du jour
  const today = getToday();
  await db.collection("football_predictions").doc(today).set({
    date: today,
    totalMatches: predictions.length,
    predictions,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`🔮 ${predictions.length} prédictions générées`);
  return predictions;
}

// =======================
// 🚀 ROUTE UNIQUE (MANUELLE)
// =======================
app.get("/run-daily-job", async (req, res) => {
  try {
    const stored = await storeTodayMatches();
    const predictions = await generateDailyPredictions();

    res.json({
      success: true,
      matchesStored: stored,
      predictionsGenerated: predictions.length,
    });
  } catch (err) {
    console.error("❌ Erreur daily job:", err);
    res.status(500).json({ error: "Erreur traitement journalier" });
  }
});

// =======================
// 🚀 SERVER START
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FootballPredict server lancé sur le port ${PORT}`);
});
