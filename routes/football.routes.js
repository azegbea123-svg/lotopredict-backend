import express from "express";
import {
  saveFootballMatchesByDate,
  getFootballMatchesByDate
} from "../services/football.service.js";

const router = express.Router();

/**
 * Enregistrer les matchs d’une date
 */
router.post("/store", async (req, res) => {
  try {
    const { date, matches } = req.body;

    if (!date || !matches || !Array.isArray(matches)) {
      return res.status(400).json({
        success: false,
        message: "date et matches sont requis"
      });
    }

    await saveFootballMatchesByDate(date, matches);

    res.json({
      success: true,
      message: "Matchs enregistrés avec succès"
    });
  } catch (error) {
    console.error("Football store error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur football"
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
