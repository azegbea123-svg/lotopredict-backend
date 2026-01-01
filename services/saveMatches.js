import admin from "../firebase/firebaseAdmin.js";

const db = admin.firestore();

export async function saveMatches(matches) {
  const batch = db.batch();

  matches.forEach(match => {
    const ref = db
      .collection("football_matches")
      .doc(match.fixture.id.toString());

    batch.set(
      ref,
      {
        fixtureId: match.fixture.id,
        league: match.league.name,
        country: match.league.country,
        home: match.teams.home.name,
        away: match.teams.away.name,
        date: match.fixture.date,
        status: match.fixture.status.long,
        goalsHome: match.goals.home,
        goalsAway: match.goals.away,
        timestamp: admin.firestore.Timestamp.fromDate(
          new Date(match.fixture.date)
        ),
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();
}
