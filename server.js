import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import footballRoutes from "./routes/football.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/football", footballRoutes);

app.get("/", (req, res) => {
  res.send("LotoPredict backend actif");
});

app.get("/api/football/test", (req, res) => {
  res.json({ status: "Football module OK" });
});

app.get("/api/football/matches/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const response = await axios.get(
      `https://v3.football.api-sports.io/fixtures?date=${today}`,
      {
        headers: {
          "x-apisports-key": process.env.FOOTBALL_API_KEY
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur API Football" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend lancé sur le port", PORT);
});
