// GET /api/marketeria-sync?secret=...
// 1. Llena predicciones de MarketerIA para todos los partidos del Mundial
// 2. Calcula puntos de TODOS los jugadores basado en resultados reales de ESPN
// Corre cada 30 min via cron-job.org

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MARKETERIA_ID = "1b3d7ee1-c448-426e-8f22-7d2724f713db";
const SALA_ID = "mundial2026";

// Puntos por etapa (igual que STAGES en App.jsx)
const PTS_ETAPA = { grupos: 3, octavos: 2, cuartos: 3, semis: 5, final: 10 };

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// ── Ranking FIFA ──────────────────────────────────────────────
let cachedTeams = null;
function loadTeams() {
  if (cachedTeams) return cachedTeams;
  const raw = readFileSync(join(__dirname, "data/wc2026_players.json"), "utf-8");
  const players = JSON.parse(raw);
  const map = {};
  for (const p of players) {
    if (!map[p.team_code]) map[p.team_code] = { name: p.team_name, code: p.team_code, players: [] };
    map[p.team_code].players.push(p);
  }
  cachedTeams = {};
  for (const [code, t] of Object.entries(map)) {
    const sorted = [...t.players].sort((a, b) => b.player_score - a.player_score);
    const top11 = sorted.slice(0, 11);
    const avg = top11.reduce((s, p) => s + p.player_score, 0) / top11.length;
    const diamonds = t.players.filter(p => p.category === "Diamante").length;
    const score = Math.round((avg + diamonds * 2) * 10) / 10;
    cachedTeams[code.toLowerCase()] = { code, name: t.name, score };
    cachedTeams[t.name.toLowerCase()] = { code, name: t.name, score };
  }
  return cachedTeams;
}

const ALIASES = {
  "united states":"usa","estados unidos":"usa","brazil":"bra","brasil":"bra",
  "germany":"ger","alemania":"ger","france":"fra","francia":"fra",
  "spain":"esp","españa":"esp","england":"eng","inglaterra":"eng",
  "mexico":"mex","méxico":"mex","netherlands":"ned","países bajos":"ned","holland":"ned",
  "turkey":"tur","türkiye":"tur","south korea":"kor","korea republic":"kor",
  "ivory coast":"civ","côte d'ivoire":"civ","cote d'ivoire":"civ",
  "dr congo":"cod","congo dr":"cod","iran":"irn","ir iran":"irn",
  "saudi arabia":"ksa","switzerland":"sui","suiza":"sui","canada":"can","canadá":"can",
  "czechia":"cze","czech republic":"cze","new zealand":"nzl","cabo verde":"cpv","cape verde":"cpv",
  "curaçao":"cuw","curacao":"cuw","senegal":"sen","norway":"nor","noruega":"nor",
  "south africa":"rsa","bosnia & herzegovina":"bih","bosnia and herzegovina":"bih",
};

function lookup(name) {
  if (!name) return null;
  const low = name.toLowerCase().trim();
  const teams = loadTeams();
  return teams[ALIASES[low] || low] || null;
}

function mkteriaPredict(homeName, awayName) {
  const home = lookup(homeName);
  const away = lookup(awayName);
  if (!home || !away) return null;
  const diff = home.score - away.score;
  if (diff > 2)  return "local";
  if (diff < -2) return "visitante";
  return "empate";
}

// Determina etapa del partido por fecha (aprox)
function etapaPts(dateStr) {
  const d = new Date(dateStr);
  const mes = d.getUTCMonth() + 1;
  const dia = d.getUTCDate();
  if (mes === 6 && dia <= 30) return PTS_ETAPA.grupos;
  if (mes === 7 && dia <= 5)  return PTS_ETAPA.octavos;
  if (mes === 7 && dia <= 12) return PTS_ETAPA.cuartos;
  if (mes === 7 && dia <= 16) return PTS_ETAPA.semis;
  return PTS_ETAPA.final;
}

// Resultado real del evento ESPN
function parseResult(event) {
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

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "unauthorized" });

  try {
    // 1. Cargar todos los partidos
    const r = await fetch("https://quienvaaganar.vercel.app/api/fotmob?endpoint=scoreboard&dates=20260611-20260720");
    const data = await r.json();
    const events = (data.events || []).filter(e => (e.competitions?.[0]?.competitors || []).length === 2);

    // 2. Upsert predicciones de MarketerIA
    const mkRows = [];
    for (const ev of events) {
      const comps = ev.competitions?.[0]?.competitors || [];
      const homeName = comps.find(c => c.homeAway === "home")?.team?.displayName || "";
      const awayName = comps.find(c => c.homeAway === "away")?.team?.displayName || "";
      const pred = mkteriaPredict(homeName, awayName);
      if (!pred) continue;
      mkRows.push({ participante_id: MARKETERIA_ID, sala_id: SALA_ID, match_id: ev.id, prediccion: pred, usa_ia: true });
    }
    if (mkRows.length > 0) {
      await supabase.from("pronosticos_partidos").upsert(mkRows, { onConflict: "participante_id,match_id" });
    }

    // 3. Partidos terminados con resultado
    const terminados = events
      .map(ev => {
        const resultado = parseResult(ev);
        if (!resultado) return null;
        return { id: ev.id, resultado, pts: etapaPts(ev.date) };
      })
      .filter(Boolean);

    if (terminados.length === 0) {
      return res.json({ ok: true, msg: "sin partidos terminados aún", mkPrediccionesUpserted: mkRows.length });
    }

    const matchIds = terminados.map(m => m.id);
    const resultMap = Object.fromEntries(terminados.map(m => [m.id, m]));

    // 4. Cargar predicciones de todos los jugadores para esos partidos
    const { data: prons } = await supabase
      .from("pronosticos_partidos")
      .select("participante_id, match_id, prediccion")
      .in("match_id", matchIds)
      .eq("sala_id", SALA_ID);

    if (!prons?.length) {
      return res.json({ ok: true, msg: "nadie tiene predicciones para partidos terminados", terminados: terminados.length });
    }

    // 5. Agrupar puntos por jugador
    const puntosMap = {};
    for (const pron of prons) {
      const match = resultMap[pron.match_id];
      if (!match) continue;
      if (!puntosMap[pron.participante_id]) puntosMap[pron.participante_id] = 0;
      if (pron.prediccion === match.resultado) {
        puntosMap[pron.participante_id] += match.pts;
      }
    }

    // 6. Actualizar puntos en DB para todos los jugadores
    const updates = [];
    for (const [pid, pts] of Object.entries(puntosMap)) {
      const { error } = await supabase.from("participantes").update({ points: pts }).eq("id", pid);
      updates.push({ id: pid, pts, error: error?.message });
    }

    res.json({
      ok: true,
      terminados: terminados.length,
      jugadoresActualizados: updates.length,
      mkPrediccionesUpserted: mkRows.length,
      resumen: updates,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
