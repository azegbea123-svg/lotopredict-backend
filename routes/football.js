import express from "express";
import { getDailyPrediction } from "../services/dailyPrediction.js";

const router = express.Router();

router.get("/prediction", async (req, res) => {
  try {
    const prediction = await getDailyPrediction();
    res.json({ data: prediction });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Prediction error" });
  }
});

export default router;
