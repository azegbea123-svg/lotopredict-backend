import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import footballRoutes from "./routes/football.routes.js";

// 🔐 Firebase Admin (une seule fois)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const app = express();

// ✅ Middlewares
app.use(express.json());
app.use(cors({ origin: "*" }));

/* =====================================
   🎰 LOTOPREDICT (tes routes loto ici)
===================================== */
// Exemple placeholder
app.get("/api/loto/predict", (req, res) => {
  res.json({ message: "LotoPredict OK" });
});

/* =====================================
   ⚽ FOOTBALL (MODULE INTERNE)
===================================== */
app.use("/api/football", footballRoutes);

// 🚀 Lancer serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 LotoPredict backend actif sur port ${PORT}`);
});
