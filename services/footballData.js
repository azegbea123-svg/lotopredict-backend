import fetch from "node-fetch";

const API_URL = "https://api.football-data.org/v4";
const TOKEN = process.env.FOOTBALL_DATA_KEY;

export async function fetchTodayMatches() {
  const today = new Date().toISOString().split("T")[0];

  const res = await fetch(
    `${API_URL}/matches?dateFrom=${today}&dateTo=${today}`,
    {
      headers: { "X-Auth-Token": TOKEN }
    }
  );

  if (!res.ok) throw new Error("football-data.org indisponible");

  const data = await res.json();
  return data.matches;
}
