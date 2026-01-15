import { getDB } from "../firebase.js";

/**
 * Clé unique par jour (ex: 2026-01-07)
 */
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

/* ================================
   OUTILS
================================ */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/* ================================
   1X2 LOGIQUE (plus stable)
================================ */
function predict1X2(match) {
  const homePower =
    match.homeGoalsAvg - match.homeConcedeAvg;
  const awayPower =
    match.awayGoalsAvg - match.awayConcedeAvg;

  if (homePower > awayPower + 0.3) return "1";
  if (awayPower > homePower + 0.3) return "2";
  return "N";
}

/* ================================
   BTTS & OVER COHÉRENTS
================================ */
function predictMarkets(match) {
  const totalAvg =
    match.homeGoalsAvg + match.awayGoalsAvg;

  const btts =
    match.homeGoalsAvg >= 1 &&
    match.awayGoalsAvg >= 1;

  const over25 = totalAvg >= 2.6;
  const over15 = totalAvg >= 1.6;

  let overUnder = "UNDER 2.5";
  if (over25) overUnder = "OVER 2.5";
  else if (over15) overUnder = "OVER 1.5";

  return { btts, overUnder, over25 };
}

/* ================================
   SCORE EXACT COHÉRENT
================================ */
function predictScore(result, btts, over25) {
  if (result === "1") {
    if (!btts) return "2-0";
    return over25 ? "3-1" : "2-1";
  }

  if (result === "2") {
    if (!btts) return "0-2";
    return over25 ? "1-3" : "1-2";
  }

  // Match nul
  if (!btts) return "0-0";
  return over25 ? "2-2" : "1-1";
}

/* ================================
   VALIDATEUR FINAL
================================ */
function validatePrediction(markets) {
  const [h, a] = markets.score.split("-").map(Number);
  const total = h + a;

  if (markets.btts && (h === 0 || a === 0)) return false;
  if (!markets.btts && h > 0 && a > 0) return false;

  if (markets.overUnder === "OVER 2.5" && total < 3) return false;
  if (markets.overUnder === "UNDER 2.5" && total > 2) return false;

  if (markets.result === "1" && h <= a) return false;
  if (markets.result === "2" && a <= h) return false;
  if (markets.result === "N" && h !== a) return false;

  return true;
}

/* ================================
   PRÉDICTION MATCH COMPLÈTE
================================ */
function predictMatch(match) {
  const result = predict1X2(match);
  const marketsBase = predictMarkets(match);

  let markets = {
    result,
    btts: marketsBase.btts ? "YES" : "NO",
    overUnder: marketsBase.overUnder,
    score: predictScore(
      result,
      marketsBase.btts,
      marketsBase.over25
    ),
  };

  // 🔒 Sécurité anti-incohérence
  if (!validatePrediction(markets)) {
    markets.score =
      result === "N" ? "1-1" :
      result === "1" ? "2-0" : "0-2";
    markets.btts =
      markets.score.includes("0") ? "NO" : "YES";
  }

  return {
    home: match.home,
    away: match.away,

    markets,

    confidence: clamp(
      60 +
        Math.abs(
          match.homeGoalsAvg -
          match.awayGoalsAvg
        ) * 20,
      65,
      90
    ),
  };
}

/* ================================
   DAILY PREDICTION (CACHE)
================================ */
export async function getDailyPrediction(matches) {
  const db = getDB();
  const todayKey = getTodayKey();

  const ref = db.collection("daily_predictions").doc(todayKey);
  const snap = await ref.get();

  // ✅ Cache journalier
  if (snap.exists) {
    return {
      source: "cache",
      date: todayKey,
      predictions: snap.data().predictions,
    };
  }

  // 🔮 Génération unique pour la journée
  const predictions = matches.map(predictMatch);

  await ref.set({
    date: todayKey,
    predictions,
    createdAt: new Date(),
  });

  return {
    source: "generated",
    date: todayKey,
    predictions,
  };
}
