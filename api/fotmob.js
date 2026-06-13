export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { path, ...params } = req.query;
  const qs = new URLSearchParams(params).toString();
  const url = `https://www.fotmob.com/api/${path}${qs ? "?" + qs : ""}`;
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://www.fotmob.com/",
      },
    });
    if (!r.ok) { res.status(r.status).json({ error: "upstream error" }); return; }
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
