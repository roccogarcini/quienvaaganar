// POST /api/marketeria-chat
// Body: { pregunta: string, historial?: [{role, content}] }
// Devuelve: { respuesta: string }

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadTeamStrength() {
  const raw = readFileSync(join(__dirname, "data/wc2026_players.json"), "utf-8");
  const players = JSON.parse(raw);

  const teams = {};
  for (const p of players) {
    if (!teams[p.team_code]) {
      teams[p.team_code] = { name: p.team_name, players: [] };
    }
    teams[p.team_code].players.push(p);
  }

  const strength = {};
  for (const [code, t] of Object.entries(teams)) {
    const sorted = [...t.players].sort((a, b) => b.player_score - a.player_score);
    const top11 = sorted.slice(0, 11);
    const avg = top11.reduce((s, p) => s + p.player_score, 0) / top11.length;
    const diamonds = t.players.filter(p => p.category === "Diamante");
    const stars3 = t.players.filter(p => p.category === "3 Estrellas");
    const finalScore = avg + diamonds.length * 2;
    strength[code] = {
      name: t.name,
      finalScore: Math.round(finalScore * 10) / 10,
      avgTop11: Math.round(avg * 10) / 10,
      diamonds: diamonds.map(p => p.name),
      stars3Count: stars3.length,
      totalPlayers: t.players.length,
    };
  }

  return Object.entries(strength)
    .sort((a, b) => b[1].finalScore - a[1].finalScore)
    .map(([code, s], i) => ({ rank: i + 1, code, ...s }));
}

const SYSTEM_PROMPT = (rankingText) => `Eres MarketerIA, un analista de datos del Mundial 2026 con personalidad directa, con humor seco y datos reales. Hablas en español mexicano casual.

Tu análisis está basado en los datos oficiales de FIFA: 1,248 jugadores de las 48 selecciones convocadas al Mundial 2026.

Tu metodología:
- Calculas el promedio de score de los 11 mejores jugadores de cada equipo (top-11)
- Añades bonus de 2 puntos por cada jugador categoría "Diamante" (élite mundial)
- Con esa puntuación final comparas equipos partido a partido
- Diferencia > 5pts → el más fuerte gana · Diferencia 2-5pts → ligero favorito · Diferencia < 2pts → empate

Categorías de jugadores:
- Diamante (26 jugadores): élite mundial — Messi, Cristiano, Mbappé, Haaland, Kane, Salah, Modric, Neuer, Benzema, De Bruyne, etc.
- 3 Estrellas (106): jugadores top de clubes grandes
- 2 Estrellas (254): titulares sólidos de ligas europeas
- 1 Estrella (862): plantilla y jugadores en desarrollo

Ranking de selecciones (score final = top-11 avg + diamantes×2):
${rankingText}

Reglas de respuesta:
- Sé conciso (máx 3 párrafos)
- Usa datos concretos del ranking cuando puedas
- Si preguntan por un partido específico, calcula la diferencia y da tu predicción con razón
- No inventes datos que no tienes (resultados reales, lesiones recientes)
- Si no sabes algo, dilo directo
- Usa emojis con moderación (1-2 por respuesta máx)`;

let cachedRanking = null;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") return res.status(405).json({ error: "método no permitido" });

  const { pregunta, historial = [] } = req.body || {};
  if (!pregunta?.trim()) return res.status(400).json({ error: "falta pregunta" });

  try {
    if (!cachedRanking) {
      cachedRanking = loadTeamStrength();
    }

    const rankingText = cachedRanking
      .map(t => `${t.rank}. ${t.name} (${t.code}): ${t.finalScore}pts | top-11 avg: ${t.avgTop11} | Diamantes: ${t.diamonds.length > 0 ? t.diamonds.join(", ") : "ninguno"}`)
      .join("\n");

    const messages = [
      ...historial.slice(-6),
      { role: "user", content: pregunta },
    ];

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT(rankingText),
        messages,
      }),
    });

    if (!r.ok) return res.status(500).json({ error: "Error Anthropic: " + r.status });

    const data = await r.json();
    const respuesta = data.content?.[0]?.text || "No pude generar respuesta.";

    res.json({ ok: true, respuesta });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
