import express from "express";
import axios from "axios";   // 👈 OBLIGATOIRE
import cors from "cors";
import fs from "fs";
import path from "path";

// 🔥 Initialise Firebase UNE FOIS
import "./firebase.js";

import { runDailyFootballPipeline } from "./jobs/football.job.js";
import footballRoutes from "./routes/football.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

/* ===============================
   ⚽ FOOTBALL (dépendant de LotoPredict)
================================ */
app.use("/api/football", footballRoutes);


// 🔥 AUTO : récupération + stockage des matchs
runDailyFootballPipeline();

/* ===============================
   🎰 LOTOPREDICT
================================ */
app.get("/api/loto/predict", (req, res) => {
  res.json({ message: "LotoPredict OK" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne sur le port ${PORT}`);
});
