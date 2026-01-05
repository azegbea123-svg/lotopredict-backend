import express from "express";
import cors from "cors";
import footballRoutes from "./routes/football.routes.js";
import { initFirebase } from "./firebase.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({ origin: "*" }));

// 🔐 Initialiser Firebase AVANT les routes
initFirebase();

/* ===============================
   🎰 LOTOPREDICT
================================ */
app.get("/api/loto/predict", (req, res) => {
  res.json({ message: "LotoPredict OK" });
});

/* ===============================
   ⚽ FOOTBALL
================================ */
app.use("/api/football", footballRoutes);

// Lancer serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict backend actif sur port ${PORT}`);
});
