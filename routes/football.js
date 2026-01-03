import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const FIREBASE_URL = process.env.FIREBASE_DB_URL;

router.get("/matches/today", async (req, res) => {
  const date = new Date().toISOString().split("T")[0];
  const r = await fetch(`${FIREBASE_URL}/matches/${date}/data.json`);
  res.json(await r.json());
});

router.get("/predictions/today", async (req, res) => {
  const date = new Date().toISOString().split("T")[0];
  const r = await fetch(`${FIREBASE_URL}/predictions/${date}.json`);
  res.json(await r.json());
});

export default router;
