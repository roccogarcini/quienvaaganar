// Pre-match — corre cada 30 min via cron-job.org, avisa 30 min antes del partido

import { sendWA, sendWAImage } from "./wa-send.js";
import { datoIdx } from "./data/datos-curiosos.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const EQUIPOS_ES = {
  "Argentina":"Argentina","Australia":"Australia","Austria":"Austria","Belgium":"Bélgica",
  "Brazil":"Brasil","Canada":"Canadá","Chile":"Chile","Colombia":"Colombia",
  "Costa Rica":"Costa Rica","Croatia":"Croacia","Czech Republic":"Rep. Checa","Czechia":"Rep. Checa",
  "Denmark":"Dinamarca","Ecuador":"Ecuador","Egypt":"Egipto","England":"Inglaterra",
  "France":"Francia","Germany":"Alemania","Ghana":"Ghana","Greece":"Grecia",
  "Honduras":"Honduras","Indonesia":"Indonesia","Iran":"Irán","Iraq":"Irak",
  "Israel":"Israel","Italy":"Italia","Jamaica":"Jamaica","Japan":"Japón",
  "Jordan":"Jordania","Mali":"Malí","Mexico":"México","Morocco":"Marruecos",
  "Netherlands":"Países Bajos","New Zealand":"Nueva Zelanda","Nigeria":"Nigeria",
  "Norway":"Noruega","Panama":"Panamá","Paraguay":"Paraguay","Peru":"Perú",
  "Poland":"Polonia","Portugal":"Portugal","Qatar":"Qatar","Romania":"Rumanía",
  "Saudi Arabia":"Arabia Saudita","Scotland":"Escocia","Senegal":"Senegal",
  "Serbia":"Serbia","Slovakia":"Eslovaquia","Slovenia":"Eslovenia",
  "South Korea":"Corea del Sur","Korea Republic":"Corea del Sur","Spain":"España",
  "Sweden":"Suecia","Switzerland":"Suiza","Turkey":"Turquía","Türkiye":"Turquía",
  "Ukraine":"Ucrania","United States":"Estados Unidos","Uruguay":"Uruguay",
  "Venezuela":"Venezuela","Cape Verde":"Cabo Verde","South Africa":"Sudáfrica",
  "Algeria":"Argelia","Cameroon":"Camerún","Ivory Coast":"Costa de Marfil",
  "Burkina Faso":"Burkina Faso","Haiti":"Haití","Cuba":"Cuba",
  "Bolivia":"Bolivia","Uzbekistan":"Uzbekistán","Thailand":"Tailandia",
  "Bosnia-Herzegovina":"Bosnia Herzegovina","Bosnia & Herzegovina":"Bosnia Herzegovina",
  "Curaçao":"Curaçao","Curacao":"Curaçao",
};

function tradEquipo(n) { return EQUIPOS_ES[n] || n; }

async function getParticipantes() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/participantes?select=nombre,whatsapp&eliminado=eq.false&whatsapp=not.is.null`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return r.json();
}

async function getPartidosHoy() {
  // Pide hoy Y ayer en UTC para cubrir partidos nocturnos CDMX (que cruzan medianoche UTC)
  const toStr = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const hoy = new Date();
  const ayer = new Date(hoy - 86400000);
  try {
    const [r1, r2] = await Promise.all([
      fetch(`https://quienvaaganar.vercel.app/api/fotmob?endpoint=scoreboard&dates=${toStr(hoy)}`),
      fetch(`https://quienvaaganar.vercel.app/api/fotmob?endpoint=scoreboard&dates=${toStr(ayer)}`),
    ]);
    const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
    const vistos = new Set();
    const eventos = [...(d1?.events||[]), ...(d2?.events||[])].filter(e => {
      if (vistos.has(e.id)) return false;
      vistos.add(e.id); return true;
    });
    return eventos;
  } catch { return []; }
}

export default async function handler(req, res) {
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) return res.status(401).json({ error: "unauthorized" });

  const ahora = Date.now();
  const en20min = ahora + 20 * 60 * 1000;
  const en50min = ahora + 50 * 60 * 1000;

  const [eventos, participantes] = await Promise.all([getPartidosHoy(), getParticipantes()]);

  // Partidos que arrancan en los próximos 20-50 min
  const proximos = eventos.filter(e => {
    const t = new Date(e.date).getTime();
    return t >= en20min && t <= en50min;
  });

  if (!proximos.length) return res.json({ ok: true, msg: "sin partidos en ventana 20-50 min", revisados: eventos.length });
  if (!Array.isArray(participantes) || !participantes.length) return res.json({ ok: true, msg: "sin participantes" });

  const vistos = new Set();
  const unicos = participantes.filter(p => {
    const key = (p.whatsapp || "").replace(/\D/g,"").slice(-10);
    if (!key || vistos.has(key)) return false;
    vistos.add(key); return true;
  });

  const resultados = [];
  const idx = datoIdx();
  const datoImgUrl = `https://quienvaaganar.vercel.app/datos/v6_story_${String(idx + 1).padStart(2, "0")}.png`;

  for (const ev of proximos) {
    const comps = ev.competitions?.[0]?.competitors || [];
    const homeRaw = comps.find(c => c.homeAway === "home")?.team?.displayName || "Local";
    const awayRaw = comps.find(c => c.homeAway === "away")?.team?.displayName || "Visitante";
    const local = tradEquipo(homeRaw);
    const visit = tradEquipo(awayRaw);
    const hora = ev.date ? new Date(ev.date).toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit", timeZone:"America/Mexico_City", hour12:true }) : "";

    const msg = `⚽ *${local} vs ${visit}*\n🕐 Hoy a las *${hora}* (hora CDMX)\n\n✏️ Recuerda que aún puedes editar tu quiniela para este partido y aumentar tus probabilidades de ganar:\n👉 quienvaaganar.vercel.app\n\n¡Mucha suerte! 🏆`;

    // Paso 1: texto a todos en paralelo
    const envios = await Promise.all(unicos.map(p => sendWA(p.whatsapp, msg)));
    envios.forEach((r, i) => resultados.push({ nombre: unicos[i].nombre, partido: `${local} vs ${visit}`, ok: r.ok }));

    // Paso 2: imagen a todos en paralelo (250ms entre cada una para no saturar Meta)
    for (let i = 0; i < unicos.length; i++) {
      await sendWAImage(unicos[i].whatsapp, datoImgUrl, "📌 Dato curioso del día · #Mundial2026");
      if (i < unicos.length - 1) await new Promise(ok => setTimeout(ok, 250));
    }
  }

  res.json({ ok: true, enviados: resultados.filter(r => r.ok).length, partidos: proximos.length, resultados });
}
