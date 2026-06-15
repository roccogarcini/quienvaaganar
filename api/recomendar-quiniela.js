// POST /api/recomendar-quiniela
// Body: { partidos: [{ id, local, away }] }
// Devuelve: { predicciones: [{ id, pred, razon }] }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") return res.status(405).json({ error: "método no permitido" });

  const { partidos } = req.body || {};
  if (!partidos?.length) return res.status(400).json({ error: "faltan partidos" });

  const lista = partidos.map((p, i) => `${i + 1}. ${p.local} vs ${p.away}`).join("\n");

  const prompt = `Eres un experto analista de fútbol del Mundial 2026.
Analiza estos partidos y predice el resultado más probable para cada uno.
Considera ranking FIFA, forma reciente, historial de enfrentamientos y contexto del torneo.

Partidos:
${lista}

Responde SOLO con un JSON array, sin texto extra, con este formato exacto:
[
  { "idx": 1, "pred": "local", "razon": "razón breve en español" },
  { "idx": 2, "pred": "empate", "razon": "razón breve en español" }
]

"pred" solo puede ser: "local" (gana el primero), "empate", o "visitante" (gana el segundo).
La razón debe ser máximo 8 palabras.`;

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
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) return res.status(500).json({ error: "Error Anthropic: " + r.status });

    const data = await r.json();
    const text = data.content?.[0]?.text || "[]";

    // Extraer JSON del texto (puede tener markdown)
    const match = text.match(/\[[\s\S]*\]/);
    const preds = match ? JSON.parse(match[0]) : [];

    const predicciones = preds.map(p => ({
      id: partidos[p.idx - 1]?.id,
      pred: p.pred,
      razon: p.razon,
    })).filter(p => p.id && ["local","empate","visitante"].includes(p.pred));

    res.json({ ok: true, predicciones });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
