export function predict(home, away, h2h) {
  let score = 0;

  score += home.points - away.points;
  score += (home.avgGF - away.avgGF) * 2;
  score += h2h.home - h2h.away;

  if (score > 2) return { pick: "1", confidence: 70 };
  if (score < -2) return { pick: "2", confidence: 70 };
  return { pick: "X", confidence: 55 };
}
