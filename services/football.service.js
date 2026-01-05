export function generateFootballPredictions() {
  const now = new Date();

  return [
    {
      matchId: "RM-BAR-2026-01-04",
      competition: "Liga",
      homeTeam: "Real Madrid",
      awayTeam: "FC Barcelona",
      prediction: "1X",
      odds: 1.65,
      confidence: 78,
      kickoffAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    },
    {
      matchId: "PSG-OM-2026-01-04",
      competition: "Ligue 1",
      homeTeam: "PSG",
      awayTeam: "Marseille",
      prediction: "1",
      odds: 1.48,
      confidence: 82,
      kickoffAt: new Date(now.getTime() + 5 * 60 * 60 * 1000),
    },
  ];
}
