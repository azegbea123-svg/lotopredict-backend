import { getTodayMatches } from "../services/footballService.js";

export default function initFootballRoutes(app, db) {
  app.get("/api/football/matches/today", async (req, res) => {
    try {
      const matches = await getTodayMatches(db);
      res.json({ matches });
    } catch (err) {
      console.error("Erreur /football/matches/today:", err);
      res.status(500).json({ error: "Impossible de récupérer les matchs" });
    }
  });

  // tu peux ajouter d'autres routes : /predictions, /results, etc.
}
