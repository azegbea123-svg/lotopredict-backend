import express from "express";
import { generateFootballPredictions } from "../services/football.service.js";

const router = express.Router();

router.get("/predict", (req, res) => {
  try {
    const predictions = generateFootballPredictions();
    res.json({
      module: "football",
      predictions,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur football" });
  }
});

export default router;
