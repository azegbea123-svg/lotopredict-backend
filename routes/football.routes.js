import express from "express";
import {
  fetchAndStoreTodaysMatches,
  getFootballMatchesByDate
} from "../services/football.service.js";

const router = express.Router();

/**
 * Récupérer les matchs du jour depuis Football Data et stocker
 */
router.post("/fetch-today", async (req, res) => {
  try {
    const data = await fetchAndStoreTodaysMatches();

    res.json({
      success: true,
      message: "Matchs du jour récupérés et stockés depuis Football Data",
      ...data
    });
  } catch (error) {
    console.error("Football fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Impossible de récupérer les matchs du jour"
    });
  }
});

/**
 * Lire les matchs d’une date
 */
router.get("/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const data = await getFootballMatchesByDate(date);

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error("Football read error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur football"
    });
  }
});

export default router;
