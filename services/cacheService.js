import fetch from "node-fetch";

const FIREBASE_URL = process.env.FIREBASE_DB_URL;

export async function getCachedMatches(date) {
  const res = await fetch(`${FIREBASE_URL}/matches/${date}.json`);
  return await res.json();
}

export async function saveMatchesToCache(date, matches) {
  await fetch(`${FIREBASE_URL}/matches/${date}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      updatedAt: Date.now(),
      data: matches
    })
  });
}
