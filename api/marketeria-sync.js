// GET /api/marketeria-sync?secret=...
// 1. Llena predicciones de MarketerIA para todos los partidos del Mundial
// 2. Calcula puntos basado en resultados reales de ESPN
// Corre via cron-job.org cada hora

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MARKETERIA_ID = "1b3d7ee1-c448-426e-8f22-7d2724f713db";
const SALA_ID = "mundial2026";
const PTS_ACIERTO = 3;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// ── Ranking FIFA (mismo algoritmo que ai.js) ──────────────────
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

// Aliases ESPN → código FIFA
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
  "south africa":"rsa","corea del sur":"kor","bosnia & herzegovina":"bih","bosnia and herzegovina":"bih",
};

function lookup(name) {
  if (!name) return null;
  const low = name.toLowerCase().trim();
  const teams = loadTeams();
  const alias = ALIASES[low];
  return teams[alias || low] || null;
}

function predict(homeName, awayName) {
  const home = lookup(homeName);
  const away = lookup(awayName);
  if (!home || !away) return null;
  const diff = home.score - away.score;
  if (diff > 2)  return "local";
  if (diff < -2) return "visitante";
  return "empate";
}

// Interpreta resultado ESPN → "local" | "empate" | "visitante"
function parseResult(event) {
  const comp = event.competitions?.[0];
  const status = comp?.status?.type?.completed;
  if (!status) return null; // partido no terminado
  const teams = comp?.competitors || [];
  const home = teams.find(t => t.homeAway === "home");
  const away = teams.find(t => t.homeAway === "away");
  if (!home || !away) return null;
  const hScore = parseInt(home.score || "0");
  const aScore = parseInt(away.score || "0");
  if (hScore > aScore) return "local";
  if (aScore > hScore) return "visitante";
  return "empate";
}

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "unauthorized" });

  try {
    // 1. Cargar todos los partidos fase de grupos
    const r = await fetch("https://quienvaaganar.vercel.app/api/fotmob?endpoint=scoreboard&dates=20260611-20260720");
    const data = await r.json();
    const events = (data.events || []).filter(e => {
      const comps = e.competitions?.[0]?.competitors || [];
      return comps.length === 2;
    });

    // 2. Upsert predicciones de MarketerIA
    const rows = [];
    for (const ev of events) {
      const comps = ev.competitions?.[0]?.competitors || [];
      const home = comps.find(c => c.homeAway === "home")?.team?.displayName || "";
      const away = comps.find(c => c.homeAway === "away")?.team?.displayName || "";
      const pred = predict(home, away);
      if (!pred) continue;
      rows.push({ participante_id: MARKETERIA_ID, sala_id: SALA_ID, match_id: ev.id, prediccion: pred, usa_ia: true });
    }

    if (rows.length > 0) {
      await supabase.from("pronosticos_partidos").upsert(rows, { onConflict: "participante_id,match_id" });
    }

    // 3. Calcular puntos: comparar predicciones vs resultados reales
    let puntos = 0;
    let aciertos = 0;
    let revisados = 0;

    for (const ev of events) {
      const resultado = parseResult(ev);
      if (!resultado) continue; // no terminado aún
      revisados++;

      const comps = ev.competitions?.[0]?.competitors || [];
      const home = comps.find(c => c.homeAway === "home")?.team?.displayName || "";
      const away = comps.find(c => c.homeAway === "away")?.team?.displayName || "";
      const pred = predict(home, away);
      if (!pred) continue;

      if (pred === resultado) {
        puntos += PTS_ACIERTO;
        aciertos++;
      }
    }

    // 4. Actualizar puntos en DB
    await supabase.from("participantes").update({ points: puntos }).eq("id", MARKETERIA_ID);

    res.json({ ok: true, predicciones: rows.length, revisados, aciertos, puntos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
