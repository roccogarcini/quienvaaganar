// Genera un archivo .ics del Mundial 2026, opcionalmente filtrado por equipos
export default async function handler(req, res) {
  const teamsParam = req.query.teams || ""; // "México,Argentina" — vacío = todos
  const filterTeams = teamsParam ? teamsParam.split(",").map(t => t.trim().toLowerCase()) : [];

  // ESPN league schedule — rango completo del Mundial 2026
  const url = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200";
  let events = [];
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    events = d.events || [];
  } catch(e) {
    return res.status(502).json({ error: "No se pudo obtener el calendario" });
  }

  // Filtrar por equipos si se especificaron
  if (filterTeams.length > 0) {
    events = events.filter(ev => {
      const comps = ev.competitions?.[0]?.competitors || [];
      return comps.some(c => {
        const name = (c.team?.displayName || c.team?.name || "").toLowerCase();
        const loc  = (c.team?.location || "").toLowerCase();
        return filterTeams.some(f => name.includes(f) || loc.includes(f) || f.includes(name));
      });
    });
  }

  // Nombre amigable para el calendario
  const calName = filterTeams.length
    ? `Mundial 2026 · ${teamsParam}`
    : "Mundial 2026 · Todos los partidos";

  // Generar ICS
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//quienvaaganar//Mundial2026//ES",
    `X-WR-CALNAME:${calName}`,
    "X-WR-TIMEZONE:America/Mexico_City",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;
    const competitors = comp.competitors || [];
    const home = competitors.find(c => c.homeAway === "home");
    const away = competitors.find(c => c.homeAway === "away");
    if (!home || !away) continue;

    const homeTeam = home.team?.displayName || "?";
    const awayTeam = away.team?.displayName || "?";
    const venue = comp.venue?.fullName || "";
    const city  = comp.venue?.address?.city || "";
    const round = comp.notes?.[0]?.headline || comp.altGameNote || "FIFA World Cup 2026";

    // Fecha/hora UTC → formato ICS (YYYYMMDDTHHmmssZ)
    const startDate = new Date(comp.date || ev.date);
    const endDate   = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 hrs
    const fmt = (d) => d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");

    const uid = `wc2026-${ev.id}@quienvaaganar`;
    const summary = `⚽ ${homeTeam} vs ${awayTeam}`;
    const description = `${round}\\n${venue}${city ? ", " + city : ""}\\n\\nQuiniela: https://quienvaaganar.vercel.app`;
    const location = venue + (city ? `, ${city}` : "");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART:${fmt(startDate)}`,
      `DTEND:${fmt(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  const ics = lines.join("\r\n");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="mundial2026.ics"`);
  res.setHeader("Cache-Control", "s-maxage=3600");
  res.send(ics);
}
