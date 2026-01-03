export function computeForm(lastMatches) {
  let points = 0;
  let gf = 0;
  let ga = 0;

  lastMatches.forEach(m => {
    gf += m.goalsFor;
    ga += m.goalsAgainst;
    if (m.goalsFor > m.goalsAgainst) points += 3;
    else if (m.goalsFor === m.goalsAgainst) points += 1;
  });

  return {
    points,
    avgGF: gf / lastMatches.length,
    avgGA: ga / lastMatches.length
  };
}

export function computeH2H(h2h) {
  let home = 0, away = 0, draw = 0;
  h2h.forEach(m => {
    if (m.homeGoals > m.awayGoals) home++;
    else if (m.homeGoals < m.awayGoals) away++;
    else draw++;
  });
  return { home, away, draw };
}
