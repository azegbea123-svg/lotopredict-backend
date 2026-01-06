import express from "express";
const router = express.Router();

 router.get("/matches/today", (req, res) => {
  res.json({
   matches: [
    {
     competition: "Serie A",
     home: "Juventus",
     away: "Inter",
     date: new Date().toISOString(),
     status: "À venir"
    }
   ]
  });
 });
 export default router;