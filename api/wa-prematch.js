// Pre-match hype — Vercel Cron cada hora, detecta partidos en ~90 min
// Envía mensaje divertido antes de cada partido del Mundial

import { sendWA } from "./wa-send.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function getParticipantes() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/participantes?select=nombre,whatsapp,equipo,sala_id&eliminado=eq.false&whatsapp=not.is.null`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return r.json();
}

async function getPartidosProximos() {
  const d = new Date();
  const fecha = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  try {
    const r = await fetch(`https://quienvaaganar.vercel.app/api/fotmob?endpoint=scoreboard&dates=${fecha}`);
    const data = await r.json();
    return data?.events || [];
  } catch { return []; }
}

// Mensajes pre-partido con tono de albur futbolero 😄
function mensajePrePartido(nombre, local, visitante, horaStr) {
  const opciones = [
    `🔥 ¡ATENCIÓN ${nombre.toUpperCase()}! En menos de 90 minutos arranca *${local} vs ${visitante}* (${horaStr} CDMX) ⚽\n\nEste es el momento. La gloria o el drama. No hay términos medios en el fútbol. 😤\n\n¿Ya tienes tu pronóstico listo? 👉 https://quienvaaganar.vercel.app`,

    `⚽ ¡Ya mero, ${nombre}! Faltan menos de 90 minutos para *${local} vs ${visitante}* a las ${horaStr} CDMX.\n\n¿Nervios? ¿Emoción? ¿Las dos? Normal. Así es el Mundial. 🌍🏆\n\nRevisa tu sala antes del pitazo: https://quienvaaganar.vercel.app`,

    `🏆 *${local} VS ${visitante}* — HOY ${horaStr} CDMX\n\n${nombre}, este partido puede cambiar todo en tu quiniela. O confirmarte que eres un genio. O que no. 😂\n\nCualquiera de las dos es válida. Vamos con todo. 💪\n👉 https://quienvaaganar.vercel.app`,

    `🎺 *¡PARTIDO EN MENOS DE 90 MINUTOS!*\n\n${local} 🆚 ${visitante}\n🕐 ${horaStr} hora CDMX\n\n${nombre}, ya saben lo que dicen: "El que no apuesta, no gana." Y el que sí apuesta... bueno, tampoco garantiza nada, pero es más divertido. 😂⚽\n\n👉 https://quienvaaganar.vercel.app`,
  ];

  return opciones[Math.floor(Math.random() * opciones.length)];
}

export default async function handler(req, res) {
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const ahora = Date.now();
  const en90min = ahora + 90 * 60 * 1000;
  const en60min = ahora + 60 * 60 * 1000;

  const [eventos, participantes] = await Promise.all([
    getPartidosProximos(),
    getParticipantes(),
  ]);

  // Filtra partidos que arrancan en la ventana 60-90 min
  const proximos = eventos.filter(e => {
    const t = new Date(e.date).getTime();
    return t >= en60min && t <= en90min;
  });

  if (proximos.length === 0) {
    return res.json({ ok: true, msg: "sin partidos próximos en ventana 60-90 min", revisados: eventos.length });
  }

  if (!Array.isArray(participantes) || participantes.length === 0) {
    return res.json({ ok: true, msg: "sin participantes activos" });
  }

  // Deduplica participantes por WA
  const vistos = new Set();
  const unicos = participantes.filter(p => {
    const key = (p.whatsapp || "").replace(/\D/g,"").slice(-10);
    if (!key || vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });

  const resultados = [];

  for (const evento of proximos) {
    const comps = evento.competitions?.[0]?.competitors || [];
    const homeTeam = comps.find(c => c.homeAway === "home")?.team?.displayName || "Local";
    const awayTeam = comps.find(c => c.homeAway === "away")?.team?.displayName || "Visitante";
    const horaStr = new Date(evento.date).toLocaleTimeString("es-MX", {
      hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City"
    });

    for (let i = 0; i < unicos.length; i++) {
      const p = unicos[i];
      const msg = mensajePrePartido(p.nombre || "crack", homeTeam, awayTeam, horaStr);
      const r = await sendWA(p.whatsapp, msg);
      resultados.push({ nombre: p.nombre, partido: `${homeTeam} vs ${awayTeam}`, ok: r.ok });

      if (i % 10 === 9) await new Promise(ok => setTimeout(ok, 500));
    }
  }

  const enviados = resultados.filter(r => r.ok).length;
  res.json({ ok: true, enviados, partidos: proximos.length, resultados });
}
