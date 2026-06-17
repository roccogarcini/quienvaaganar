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

  // Partidos terminados — construir mapa por ID y por clave home-away
  const terminados = [];
  for (const ev of events) {
    const resultado = parseMatchResult(ev);
    if (!resultado) continue;
    const comps = ev.competitions?.[0]?.competitors || [];
    const h = (comps.find(c => c.homeAway === "home")?.team?.displayName || "").toLowerCase();
    const a = (comps.find(c => c.homeAway === "away")?.team?.displayName || "").toLowerCase();
    terminados.push({ id: ev.id, resultado, pts: etapaPts(ev.date), key: `${h}|${a}` });
  }

  if (!terminados.length) return { ok: true, msg: "sin partidos terminados", mkUpserted: mkRows.length };

  // Mapa por ESPN id Y por clave de equipos (para match IDs alternativos)
  const resultById = Object.fromEntries(terminados.map(m => [m.id, m]));
  const resultByKey = Object.fromEntries(terminados.map(m => [m.key, m]));

  // Cargar TODAS las predicciones de la sala (sin filtrar por match_id)
  const { data: prons } = await supabase
    .from("pronosticos_partidos")
    .select("id, participante_id, match_id, prediccion")
    .eq("sala_id", SALA_ID);

  if (!prons?.length) return { ok: true, msg: "sin predicciones registradas", terminados: terminados.length };

  // Construir mapa de match_id → partido terminado (incluyendo IDs alternativos)
  // Para IDs que no están en resultById, buscar por posición relativa al rango conocido
  const allDbIds = [...new Set(prons.map(p => p.match_id))].sort();
  const espnIds = terminados.map(m => m.id).sort();

  // Intentar mapear IDs de DB a IDs de ESPN por posición si los rangos difieren
  const idRemap = {};
  // Solo remapear si hay desface claro y mismo número de partidos
  const dbOnlyIds = allDbIds.filter(id => !resultById[id]);
  if (dbOnlyIds.length > 0 && dbOnlyIds.length <= espnIds.length) {
    // Alinear por offset: buscar el offset más común
    const offsets = {};
    for (let i = 0; i < Math.min(dbOnlyIds.length, espnIds.length); i++) {
      const off = parseInt(espnIds[i]) - parseInt(dbOnlyIds[i]);
      offsets[off] = (offsets[off] || 0) + 1;
    }
    const bestOffset = Object.entries(offsets).sort((a,b) => b[1]-a[1])[0]?.[0];
    if (bestOffset !== undefined) {
      for (const dbId of dbOnlyIds) {
        const espnId = String(parseInt(dbId) + parseInt(bestOffset));
        if (resultById[espnId]) idRemap[dbId] = espnId;
      }
    }
  }

  // Sumar puntos por jugador y actualizar pts_obtenidos por pronóstico
  const puntosMap = {};
  const pronUpdates = [];
  for (const pron of prons) {
    const espnId = idRemap[pron.match_id] || pron.match_id;
    const match = resultById[espnId];
    if (!match) continue;
    const pts = pron.prediccion === match.resultado ? match.pts : 0;
    pronUpdates.push({ id: pron.id, resultado: match.resultado, pts_obtenidos: pts });
    if (!puntosMap[pron.participante_id]) puntosMap[pron.participante_id] = 0;
    puntosMap[pron.participante_id] += pts;
  }

  // Actualizar pts_obtenidos y resultado en cada pronóstico (batch de 50)
  for (let i = 0; i < pronUpdates.length; i += 50) {
    const batch = pronUpdates.slice(i, i + 50);
    await Promise.all(batch.map(u =>
      supabase.from("pronosticos_partidos")
        .update({ resultado: u.resultado, pts_obtenidos: u.pts_obtenidos })
        .eq("id", u.id)
    ));
  }

  // Cargar todos los participantes para incluir bono quiniela y jugadores con 0 aciertos
  const { data: todos } = await supabase
    .from("participantes")
    .select("id, quiniela_publicada")
    .eq("sala_id", SALA_ID)
    .eq("eliminado", false);

  // Puntos totales = aciertos en partidos + 5 por quiniela publicada
  const updates = [];
  for (const p of (todos || [])) {
    const matchPts = puntosMap[p.id] || 0;
    const quinielaPts = p.quiniela_publicada ? 5 : 0;
    const total = matchPts + quinielaPts;
    await supabase.from("participantes").update({ points: total }).eq("id", p.id);
    updates.push({ id: p.id, pts: total, matchPts, quinielaPts });
  }

  return { ok: true, terminados: terminados.length, jugadores: updates.length, mkUpserted: mkRows.length, idRemapCount: Object.keys(idRemap).length, resumen: updates };
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
    const expected = process.env.CRON_SECRET;
    if (!expected || secret !== expected) return res.status(401).json({ error: "unauthorized" });
    try {
      const result = await handleSync();
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ error: "método no permitido" });

  // analizar y recomendar solo desde la misma app (Origin check)
  const origin = req.headers.origin || "";
  const allowed = ["https://quienvaaganar.vercel.app", "http://localhost:5173"];
  if ((type === "analizar" || type === "recomendar") && !allowed.includes(origin)) {
    return res.status(403).json({ error: "forbidden" });
  }

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
