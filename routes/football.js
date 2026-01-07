import express from "express";
import { getDailyPrediction } from "./services/dailyPrediction.js";

const router = express.Router();

router.get("/predictions/today", async (req, res) => {
  const matches = [
    { home: "Juventus", away: "Inter" },
    { home: "Real Madrid", away: "Barcelona" },
    { home: "Arsenal", away: "Chelsea" },
  ];

  const result = await getDailyPrediction(matches);
  res.json(result);
});

export default router;
