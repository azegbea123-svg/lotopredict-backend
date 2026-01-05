import express from "express";
import admin from "firebase-admin";
import { generateFootballPredictions } from "../services/football.service.js";
import { footballDoc } from "../models/football.model.js";

const router = express.Router();
const db = admin.firestore();

/* =====================================
   Générer + stocker prédictions
===================================== */
router.get("/predict", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("❌ Football store error:", err);
    res.status(500).json({ error: "Impossible de générer les prédictions" });
  }
});

export default router;
