import express from "express";
import { getTodayMatches } from "../services/footballApi.js";
import { saveMatches } from "../services/saveMatches.js";

const router = express.Router();

router.get("/matches/today", async (req, res) => {
  try {
    const matches = await getTodayMatches();

    await saveMatches(matches);

    res.json({ matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur football API" });
  }
});

export default router;
