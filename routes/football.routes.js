import express from "express";
import { generateFootballPredictions } from "../services/football.service.js";
import { footballDoc } from "../models/football.model.js";
import { getDb } from "../firebase.js";

const router = express.Router();

/* =====================================
   ⚽ Générer + stocker prédictions
===================================== */
router.get("/predict", async (req, res) => {
  try {
    const db = getDb(); // 🔐 Firebase garanti initialisé
    const predictions = generateFootballPredictions();

    const batch = db.batch();

    predictions.forEach(match => {
      const ref = db.collection("football_matches").doc(match.matchId);
      batch.set(ref, footballDoc(match), { merge: true });
    });

    await batch.commit();

    res.json({
      module: "football",
      stored: predictions.length,
      predictions,
    });
  } catch (error) {
    console.error("❌ Football error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
