// POST /api/ai?type=analizar|recomendar|marketeria
// Unifica los tres endpoints de IA en uno solo (límite 12 functions en Vercel Hobby)

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedRanking = null;

function loadRanking() {
  if (cachedRanking) return cachedRanking;
  const raw = readFileSync(join(__dirname, "data/wc2026_players.json"), "utf-8");
  const players = JSON.parse(raw);
  const teams = {};
  for (const p of players) {
    if (!teams[p.team_code]) teams[p.team_code] = { name: p.team_name, players: [] };
    teams[p.team_code].players.push(p);
  }
  cachedRanking = Object.entries(teams).map(([code, t]) => {
    const sorted = [...t.players].sort((a, b) => b.player_score - a.player_score);
    const top11 = sorted.slice(0, 11);
    const avg = top11.reduce((s, p) => s + p.player_score, 0) / top11.length;
    const diamonds = t.players.filter(p => p.category === "Diamante");
    const finalScore = avg + diamonds.length * 2;
    return { code, name: t.name, finalScore: Math.round(finalScore*10)/10, avgTop11: Math.round(avg*10)/10, diamonds: diamonds.map(p => p.name) };
  }).sort((a, b) => b.finalScore - a.finalScore).map((t, i) => ({ rank: i+1, ...t }));
  return cachedRanking;
}

async function callClaude(body) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Anthropic error: " + r.status);
  return r.json();
}

// ── Handlers ──────────────────────────────────

async function handleAnalizar(body) {
  const { nombre, predicciones } = body;
  if (!predicciones?.length) throw { status: 400, msg: "faltan predicciones" };
  const conteo = { local: 0, empate: 0, visitante: 0 };
  const favTeams = {};
  for (const p of predicciones) {
    conteo[p.pred] = (conteo[p.pred] || 0) + 1;
    const ganador = p.pred === "local" ? p.local : p.pred === "visitante" ? p.away : null;
    if (ganador) favTeams[ganador] = (favTeams[ganador] || 0) + 1;
  }
  const topEquipos = Object.entries(favTeams).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([e,w])=>`${e} (${w} victorias)`).join(", ");
  const resumen = predicciones.slice(0,40).map(p=>`${p.local} vs ${p.away}: ${p.pred==="local"?p.local:p.pred==="visitante"?p.away:"Empate"}`).join("\n");
  const prompt = `Eres el comentarista más divertido de la quiniela del Mundial 2026.
Analiza la quiniela de ${nombre||"este jugador"} en 3-4 oraciones en español mexicano, conversacional y divertido.
Menciona patrones: ¿arriesgado? ¿conservador? ¿fiel a favoritos? Termina con predicción graciosa. Sin bullet points.

Pronósticos (${predicciones.length} partidos):\n${resumen}
Stats: ${conteo.local||0} locales, ${conteo.empate||0} empates, ${conteo.visitante||0} visitantes. Favoritos: ${topEquipos||"ninguno claro"}`;
  const data = await callClaude({ model:"claude-haiku-4-5-20251001", max_tokens:300, messages:[{role:"user",content:prompt}] });
  return { ok:true, analisis: data.content?.[0]?.text || "No se pudo generar." };
}

async function handleRecomendar(body) {
  const { partidos } = body;
  if (!partidos?.length) throw { status: 400, msg: "faltan partidos" };
  const lista = partidos.map((p,i) => `${i+1}. ${p.local} vs ${p.away}`).join("\n");
  const prompt = `Eres un experto analista de fútbol del Mundial 2026.
Predice el resultado más probable de cada partido. Responde SOLO con un JSON array sin texto extra:
[{ "idx": 1, "pred": "local", "razon": "razón breve en español máx 8 palabras" }]
"pred" solo puede ser: "local", "empate", o "visitante".

Partidos:\n${lista}`;
  const data = await callClaude({ model:"claude-haiku-4-5-20251001", max_tokens:2000, messages:[{role:"user",content:prompt}] });
  const text = data.content?.[0]?.text || "[]";
  const match = text.match(/\[[\s\S]*\]/);
  const preds = match ? JSON.parse(match[0]) : [];
  const predicciones = preds.map(p => ({ id: partidos[p.idx-1]?.id, pred: p.pred, razon: p.razon }))
    .filter(p => p.id && ["local","empate","visitante"].includes(p.pred));
  return { ok:true, predicciones };
}

async function handleMarketeria(body) {
  const { pregunta, historial = [] } = body;
  if (!pregunta?.trim()) throw { status: 400, msg: "falta pregunta" };
  const ranking = loadRanking();
  const rankingText = ranking.map(t =>
    `${t.rank}. ${t.name} (${t.code}): ${t.finalScore}pts | avg: ${t.avgTop11} | Diamantes: ${t.diamonds.length > 0 ? t.diamonds.join(", ") : "ninguno"}`
  ).join("\n");
  const system = `Eres MarketerIA, analista de datos del Mundial 2026. Hablas español mexicano casual, directo y con humor seco.
Tu análisis usa datos FIFA oficiales: 1,248 jugadores de 48 selecciones convocadas al Mundial 2026.
Score = promedio top-11 + Diamantes×2.
Predicción: diff >5pts → gana el fuerte · diff 2-5pts → ligero favorito · diff <2pts → empate.
Categorías: Diamante (26, élite mundial), 3★ (106), 2★ (254), 1★ (862).
Responde máx 3 párrafos. Usa datos concretos. No inventes resultados reales ni lesiones recientes.

IMPORTANTE — lenguaje: No uses groserías ni palabras altisonantes (pedo, wey, chido, etc.). Si quieres expresar algo informal, usa emojis o sinónimos limpios. Mantén el tono divertido pero sin palabrotas.

IMPORTANTE — selecciones: Las 48 selecciones en el ranking son las que SÍ juegan el Mundial 2026. Si alguien pregunta si un equipo juega, confía en este ranking como fuente definitiva. Noruega (NOR) SÍ está clasificada al Mundial 2026 con un score de 36.3.

Ranking:\n${rankingText}`;
  const messages = [...historial.slice(-6), { role:"user", content: pregunta }];
  const data = await callClaude({ model:"claude-haiku-4-5-20251001", max_tokens:500, system, messages });
  return { ok:true, respuesta: data.content?.[0]?.text || "Sin respuesta." };
}

// ── Main handler ──────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") return res.status(405).json({ error: "método no permitido" });

  const type = req.query.type;
  try {
    let result;
    if      (type === "analizar")    result = await handleAnalizar(req.body || {});
    else if (type === "recomendar")  result = await handleRecomendar(req.body || {});
    else if (type === "marketeria")  result = await handleMarketeria(req.body || {});
    else return res.status(400).json({ error: "type inválido" });
    res.json(result);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.msg });
    res.status(500).json({ error: e.message });
  }
}
