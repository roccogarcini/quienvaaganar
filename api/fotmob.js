export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

  const { endpoint, dates } = req.query;
  const base = {
    scoreboard: "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard",
    standings:  "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings",
    schedule:   "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard",
  };

  if (!base[endpoint]) { res.status(400).json({ error: "unknown endpoint" }); return; }

  let url = base[endpoint];
  if (endpoint === "scoreboard" && dates) url += `?dates=${dates}`;
  // schedule: fetch a date range to get all upcoming matches
  if (endpoint === "schedule" && dates) url += `?dates=${dates}`;

  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) { res.status(r.status).json({ error: "upstream " + r.status }); return; }
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
