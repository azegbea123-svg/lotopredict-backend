import { fetchAndStoreTodaysMatches } from "../services/football.service.js";
import express from "express";
import axios from "axios";   // 👈 OBLIGATOIRE
import cors from "cors";
import fs from "fs";
import path from "path";

export async function runDailyFootballPipeline() {
  try {
    console.log("⚽ Football pipeline : démarrage");

    const result = await fetchAndStoreTodaysMatches();

    console.log(
      `✅ Matchs du ${result.date} récupérés et stockés (${result.matches.length})`
    );
  } catch (error) {
    console.error("❌ Football pipeline error:", error.message);
  }
}
