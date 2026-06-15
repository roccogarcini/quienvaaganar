// POST /api/analizar-quiniela
// Body: { nombre, predicciones: [{ local, away, pred }] }
// Devuelve: { analisis: "texto generado por Claude" }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") return res.status(405).json({ error: "método no permitido" });

  const { nombre, predicciones } = req.body || {};
  if (!predicciones?.length) return res.status(400).json({ error: "faltan predicciones" });

  const conteo = { local: 0, empate: 0, visitante: 0 };
  const favTeams = {};

  for (const p of predicciones) {
    conteo[p.pred] = (conteo[p.pred] || 0) + 1;
    const ganador = p.pred === "local" ? p.local : p.pred === "visitante" ? p.away : null;
    if (ganador) favTeams[ganador] = (favTeams[ganador] || 0) + 1;
  }

  const topEquipos = Object.entries(favTeams)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([equipo, wins]) => `${equipo} (${wins} victorias pronosticadas)`)
    .join(", ");

  const resumen = predicciones.slice(0, 40).map(p =>
    `${p.local} vs ${p.away}: ${p.pred === "local" ? p.local : p.pred === "visitante" ? p.away : "Empate"}`
  ).join("\n");

  const prompt = `Eres el comentarista más divertido y apasionado de la quiniela del Mundial 2026 entre amigos.
Analiza la quiniela de ${nombre || "este jugador"} y dales un análisis personalizado, honesto y con humor.

Sus pronósticos (${predicciones.length} partidos):
${resumen}

Estadísticas:
- Pronostica ${conteo.local || 0} victorias del local, ${conteo.empate || 0} empates, ${conteo.visitante || 0} victorias del visitante
- Sus equipos favoritos según sus pronósticos: ${topEquipos || "ninguno claro aún"}

Escribe un análisis de 3-4 oraciones en español mexicano, conversacional y divertido.
Menciona patrones interesantes (¿es muy arriesgado? ¿muy conservador? ¿fiel a los favoritos? ¿apuesta por sorpresas?).
Menciona a qué equipos les está yendo bien según su quiniela.
Termina con una predicción graciosa sobre cómo le irá en la quiniela.
Sin bullet points, solo texto corrido.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: "Error Anthropic: " + err });
    }

    const data = await r.json();
    const analisis = data.content?.[0]?.text || "No se pudo generar el análisis.";
    res.json({ ok: true, analisis });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
