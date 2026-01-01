import { saveMatches } from "../services/saveMatches.js";

router.get("/matches/today", async (req, res) => {
  try {
    const response = await axios.get(FOOTBALL_API_URL, {
      headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY }
    });

    const matches = response.data.response;

    // 🔥 Sauvegarde Firestore
    await saveMatches(matches);

    res.json({ response: matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur football" });
  }
});
