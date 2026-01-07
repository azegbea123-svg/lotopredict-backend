
import express from "express";
import { getDailyPrediction } from "../services/dailyPrediction.js";

const router = express.Router();

router.get("/prediction", async (req, res) => {
  try {
    const result = await getDailyPrediction();
    res.json(result);
  } catch (err) {
    console.error("❌ Prediction error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
