import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import initFootballRoutes from "./routes/football.routes.js";

dotenv.config();

// 🔹 Firebase Admin (réutilisation de PayGate)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore(); // utilisé partout dans ce serveur

// 🔹 Express setup
const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// 🔹 FootballPredict routes
initFootballRoutes(app, db);

// 🚀 Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FootballPredict API en ligne sur port ${PORT}`);
});
