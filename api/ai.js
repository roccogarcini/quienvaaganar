// POST /api/ai?type=analizar|recomendar|marketeria
// GET  /api/ai?type=sync&secret=... — sincroniza puntos de todos los jugadores
// Unifica endpoints de IA en uno solo (límite 12 functions en Vercel Hobby)

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const MARKETERIA_ID = "1b3d7ee1-c448-426e-8f22-7d2724f713db";
const SALA_ID = "mundial2026";

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
Tu análisis combina dos fuentes: (1) datos FIFA oficiales de 1,248 jugadores de 48 selecciones, y (2) búsqueda web en tiempo real para verificar noticias, resultados, lesiones y cualquier dato actual.
Score = promedio top-11 + Diamantes×2.
Predicción: diff >5pts → gana el fuerte · diff 2-5pts → ligero favorito · diff <2pts → empate.
Categorías: Diamante (26, élite mundial), 3★ (106), 2★ (254), 1★ (862).
Responde máx 3 párrafos. Cuando uses la búsqueda web, menciona brevemente que verificaste la información en línea.

IMPORTANTE — lenguaje: No uses groserías ni palabras altisonantes (pedo, wey, chido, etc.). Si quieres expresar algo informal, usa emojis o sinónimos limpios. Mantén el tono divertido pero sin palabrotas.

IMPORTANTE — selecciones: Las 48 selecciones en el ranking son las que SÍ juegan el Mundial 2026. Para cualquier duda sobre clasificación, usa la búsqueda web para verificar. Noruega (NOR) SÍ está clasificada.

Ranking FIFA (fuente principal para fuerza de plantilla):\n${rankingText}`;
  const messages = [...historial.slice(-6), { role:"user", content: pregunta }];

  // Usar claude-sonnet con búsqueda web para respuestas verificadas
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "web-search-2025-03-05",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      messages,
    }),
  });
  if (!r.ok) throw new Error("Anthropic error: " + r.status);
  const data = await r.json();

  // Extraer solo el texto de la respuesta (ignorar bloques tool_use / tool_result)
  const respuesta = data.content
    ?.filter(b => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .trim() || "Sin respuesta.";

  return { ok: true, respuesta };
}

// ── Sync: calcular puntos de todos los jugadores ──────────────

const SYNC_ALIASES = {
  "united states":"usa","estados unidos":"usa","brazil":"bra","brasil":"bra",
  "germany":"ger","france":"fra","spain":"esp","españa":"esp","england":"eng",
  "mexico":"mex","méxico":"mex","netherlands":"ned","holland":"ned",
  "turkey":"tur","türkiye":"tur","south korea":"kor","korea republic":"kor",
  "ivory coast":"civ","côte d'ivoire":"civ","cote d'ivoire":"civ",
  "dr congo":"cod","iran":"irn","ir iran":"irn","saudi arabia":"ksa",
  "switzerland":"sui","canada":"can","canadá":"can","czechia":"cze","czech republic":"cze",
  "new zealand":"nzl","cabo verde":"cpv","cape verde":"cpv",
  "curaçao":"cuw","curacao":"cuw","senegal":"sen","norway":"nor","noruega":"nor",
  "south africa":"rsa","bosnia & herzegovina":"bih","bosnia and herzegovina":"bih",
  "bosnia-herzegovina":"bih",
};

function syncLookup(name) {
  const low = (name || "").toLowerCase().trim();
  const r = loadRanking();
  const alias = SYNC_ALIASES[low];
  return r.find(t => t.code.toLowerCase() === (alias || low) || t.name.toLowerCase() === (alias || low)) || null;
}

function syncPredict(homeName, awayName) {
  const home = syncLookup(homeName);
  const away = syncLookup(awayName);
  if (!home || !away) return null;
  const diff = home.finalScore - away.finalScore;
  if (diff > 2)  return "local";
  if (diff < -2) return "visitante";
  return "empate";
}

function parseMatchResult(event) {
  const comp = event.competitions?.[0];
  if (!comp?.status?.type?.completed) return null;
  const home = comp.competitors?.find(t => t.homeAway === "home");
  const away = comp.competitors?.find(t => t.homeAway === "away");
  if (!home || !away) return null;
  const h = parseInt(home.score || "0");
  const a = parseInt(away.score || "0");
  if (h > a) return "local";
  if (a > h) return "visitante";
  return "empate";
}

function etapaPts(dateStr) {
  const d = new Date(dateStr);
  const mes = d.getUTCMonth() + 1;
  const dia = d.getUTCDate();
  if (mes === 6) return 3;           // Grupos
  if (mes === 7 && dia <= 5)  return 2; // Octavos
  if (mes === 7 && dia <= 12) return 3; // Cuartos
  if (mes === 7 && dia <= 16) return 5; // Semis
  return 10;                         // Final
}

async function handleSync() {
  const r = await fetch("https://quienvaaganar.vercel.app/api/fotmob?endpoint=scoreboard&dates=20260611-20260720");
  const data = await r.json();
  const events = (data.events || []).filter(e => (e.competitions?.[0]?.competitors || []).length === 2);

  // Upsert predicciones MarketerIA
  const mkRows = [];
  for (const ev of events) {
    const comps = ev.competitions?.[0]?.competitors || [];
    const h = comps.find(c => c.homeAway === "home")?.team?.displayName || "";
    const a = comps.find(c => c.homeAway === "away")?.team?.displayName || "";
    const pred = syncPredict(h, a);
    if (!pred) continue;
    mkRows.push({ participante_id: MARKETERIA_ID, sala_id: SALA_ID, match_id: ev.id, prediccion: pred, usa_ia: true });
  }
  if (mkRows.length > 0) {
    await supabase.from("pronosticos_partidos").upsert(mkRows, { onConflict: "participante_id,match_id" });
  }

  // Partidos terminados
  const terminados = events.map(ev => {
    const resultado = parseMatchResult(ev);
    if (!resultado) return null;
    return { id: ev.id, resultado, pts: etapaPts(ev.date) };
  }).filter(Boolean);

  if (!terminados.length) return { ok: true, msg: "sin partidos terminados", mkUpserted: mkRows.length };

  const matchIds = terminados.map(m => m.id);
  const resultMap = Object.fromEntries(terminados.map(m => [m.id, m]));

  const { data: prons } = await supabase
    .from("pronosticos_partidos")
    .select("participante_id, match_id, prediccion")
    .in("match_id", matchIds)
    .eq("sala_id", SALA_ID);

  if (!prons?.length) return { ok: true, msg: "sin predicciones para partidos terminados", terminados: terminados.length };

  // Sumar puntos por jugador
  const puntosMap = {};
  for (const pron of prons) {
    const match = resultMap[pron.match_id];
    if (!match) continue;
    if (!puntosMap[pron.participante_id]) puntosMap[pron.participante_id] = 0;
    if (pron.prediccion === match.resultado) puntosMap[pron.participante_id] += match.pts;
  }

  // Actualizar puntos en DB
  const updates = [];
  for (const [pid, pts] of Object.entries(puntosMap)) {
    await supabase.from("participantes").update({ points: pts }).eq("id", pid);
    updates.push({ id: pid, pts });
  }

  return { ok: true, terminados: terminados.length, jugadores: updates.length, mkUpserted: mkRows.length, resumen: updates };
}

// ── Main handler ──────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const type = req.query.type;

  // Sync no requiere POST
  if (type === "sync") {
    const secret = req.query.secret || req.headers["x-cron-secret"];
    if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
    try {
      const result = await handleSync();
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ error: "método no permitido" });

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
