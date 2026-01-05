export function footballDoc(match) {
  return {
    matchId: match.matchId,
    competition: match.competition,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    prediction: match.prediction,
    odds: match.odds,
    confidence: match.confidence,
    kickoffAt: match.kickoffAt,
    createdAt: new Date(),
    status: "predicted", // predicted | finished
    result: null,        // à remplir plus tard
  };
}
