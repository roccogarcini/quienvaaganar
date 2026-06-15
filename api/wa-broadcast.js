// Broadcast diario — llama 2x/día via Vercel Cron
// Envía resumen de noticias + partidos del día a todos los participantes activos

import { sendWATemplate } from "./wa-send.js";

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = process.env.VITE_SUPABASE_ANON_KEY;

// ── Helpers ──────────────────────────────────────────

async function fetchSupabase(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  return r.json();
}

async function getParticipantes() {
  // Trae todos los participantes no eliminados con whatsapp
  return fetchSupabase("participantes?select=nombre,whatsapp,equipo,sala_id&eliminado=eq.false&whatsapp=not.is.null");
}

const EQUIPOS_ES = {
  "Argentina":"Argentina","Australia":"Australia","Austria":"Austria","Belgium":"Bélgica",
  "Brazil":"Brasil","Canada":"Canadá","Chile":"Chile","China PR":"China","Colombia":"Colombia",
  "Costa Rica":"Costa Rica","Croatia":"Croacia","Czech Republic":"Rep. Checa","Denmark":"Dinamarca",
  "Ecuador":"Ecuador","Egypt":"Egipto","England":"Inglaterra","France":"Francia",
  "Germany":"Alemania","Ghana":"Ghana","Greece":"Grecia","Honduras":"Honduras","Hungary":"Hungría",
  "Indonesia":"Indonesia","Iran":"Irán","Iraq":"Irak","Israel":"Israel","Italy":"Italia",
  "Jamaica":"Jamaica","Japan":"Japón","Jordan":"Jordania","Kenya":"Kenia","Mali":"Malí",
  "Mexico":"México","Morocco":"Marruecos","Netherlands":"Países Bajos","New Zealand":"Nueva Zelanda",
  "Nigeria":"Nigeria","Norway":"Noruega","Panama":"Panamá","Paraguay":"Paraguay","Peru":"Perú",
  "Poland":"Polonia","Portugal":"Portugal","Qatar":"Qatar","Romania":"Rumanía",
  "Saudi Arabia":"Arabia Saudita","Scotland":"Escocia","Senegal":"Senegal","Serbia":"Serbia",
  "Slovakia":"Eslovaquia","Slovenia":"Eslovenia","South Korea":"Corea del Sur","Spain":"España",
  "Sweden":"Suecia","Switzerland":"Suiza","Trinidad & Tobago":"Trinidad y Tobago",
  "Turkey":"Turquía","Ukraine":"Ucrania","United States":"Estados Unidos","Uruguay":"Uruguay",
  "Venezuela":"Venezuela","Cape Verde":"Cabo Verde","Cabo Verde":"Cabo Verde",
  "South Africa":"Sudáfrica","Algeria":"Argelia","Cameroon":"Camerún","Ivory Coast":"Costa de Marfil",
  "Burkina Faso":"Burkina Faso","Tanzania":"Tanzania","Zambia":"Zambia","Zimbabwe":"Zimbabue",
  "Cuba":"Cuba","Guatemala":"Guatemala","El Salvador":"El Salvador","Bolivia":"Bolivia",
  "Uzbekistan":"Uzbekistán","Thailand":"Tailandia","Vietnam":"Vietnam","Philippines":"Filipinas",
  "Bahrain":"Baréin","Kuwait":"Kuwait","Oman":"Omán","UAE":"EAU",
};

function tradEquipo(nombre) {
  return EQUIPOS_ES[nombre] || nombre;
}

async function getPartidosHoy() {
  const d = new Date();
  const fecha = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  try {
    const r = await fetch(`https://quienvaaganar.vercel.app/api/fotmob?endpoint=scoreboard&dates=${fecha}`);
    const data = await r.json();
    const events = data?.events || [];
    return events.slice(0, 6).map(e => {
      const home = e.competitions?.[0]?.competitors?.find(c => c.homeAway === "home");
      const away = e.competitions?.[0]?.competitors?.find(c => c.homeAway === "away");
      const hora = e.date ? new Date(e.date).toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit", timeZone:"America/Mexico_City" }) : "";
      const local = tradEquipo(home?.team?.displayName || home?.team?.shortDisplayName || "?");
      const visit = tradEquipo(away?.team?.displayName || away?.team?.shortDisplayName || "?");
      return `${local} vs ${visit} · ${hora}`;
    });
  } catch { return []; }
}

async function getNoticiasDestacadas() {
  try {
    const r = await fetch("https://quienvaaganar.vercel.app/api/noticias");
    const data = await r.json();
    // Solo fuentes en español (marca, juanfutbol)
    const enEs = (data.items || []).filter(n => n.source === "marca" || n.source === "juanfutbol");
    const pool = enEs.length >= 3 ? enEs : (data.items || []);
    return pool.slice(0, 3).map(n => `📰 ${n.title}`);
  } catch { return []; }
}

// ── Mensajes con tono divertido ──────────────────────

function mensajeManana(nombre, partidos, noticias, turno) {
  const saludos = [
    `☀️ ¡Buenos días, ${nombre}! El Mundial no se detiene y tu quiniela tampoco.`,
    `🌅 ¡Despierta, ${nombre}! El fútbol no espera ni el café.`,
    `⚽ ¡Arriba ${nombre}! Otro día, otra oportunidad de presumir tu quiniela.`,
  ];
  const saludo = saludos[turno % saludos.length];

  let msg = `${saludo}\n\n`;

  if (partidos.length > 0) {
    msg += `🗓️ *PARTIDOS DE HOY*\n`;
    partidos.forEach(p => { msg += `▸ ${p}\n`; });
    msg += `\n`;
  } else {
    msg += `😴 Hoy no hay partidos del Mundial. Descansa... o ponle drama de todas formas.\n\n`;
  }

  if (noticias.length > 0) {
    msg += `🔥 *LO QUE SE ESTÁ HABLANDO*\n`;
    noticias.forEach(n => { msg += `${n}\n`; });
    msg += `\n`;
  }

  msg += `👉 Checa tu sala: https://quienvaaganar.vercel.app\n`;
  msg += `_QuiénVaAGanar 🏆 · Powered by MarketerIA_`;
  return msg;
}

function mensajeNoche(nombre, partidos, noticias, turno) {
  const saludos = [
    `🌙 ¡Buenas noches, ${nombre}! Resumen del día mundialero:`,
    `⭐ ${nombre}, el día futbolero ya terminó. Aquí el recap:`,
    `🌛 Hora del resumen nocturno, ${nombre}. No te lo pierdas:`,
  ];
  const saludo = saludos[turno % saludos.length];

  let msg = `${saludo}\n\n`;

  if (partidos.length > 0) {
    msg += `⚽ *PARTIDOS DE HOY*\n`;
    partidos.forEach(p => { msg += `▸ ${p}\n`; });
    msg += `\n`;
  }

  if (noticias.length > 0) {
    msg += `📰 *TITULARES*\n`;
    noticias.forEach(n => { msg += `${n}\n`; });
    msg += `\n`;
  }

  msg += `Mañana más fútbol, más drama, más quiniela. 💪\n`;
  msg += `👉 https://quienvaaganar.vercel.app\n`;
  msg += `_QuiénVaAGanar 🏆 · Powered by MarketerIA_`;
  return msg;
}

// ── Handler principal ────────────────────────────────

export default async function handler(req, res) {
  // Seguridad: solo Vercel Cron o llamada manual con secret
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const hora = new Date().toLocaleString("es-MX", { timeZone:"America/Mexico_City", hour:"numeric", hour12:false });
  const esMañana = Number(hora) < 14; // antes de 2pm = turno mañana

  const [participantes, partidos, noticias] = await Promise.all([
    getParticipantes(),
    getPartidosHoy(),
    getNoticiasDestacadas(),
  ]);

  if (!Array.isArray(participantes) || participantes.length === 0) {
    return res.json({ ok: true, enviados: 0, msg: "sin participantes" });
  }

  // Deduplica por WhatsApp para no mandar doble si alguien está en 2 salas
  const vistos = new Set();
  const unicos = participantes.filter(p => {
    const key = (p.whatsapp || "").replace(/\D/g,"").slice(-10);
    if (!key || vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });

  const resultados = [];
  for (let i = 0; i < unicos.length; i++) {
    const p = unicos[i];
    const nombre = p.nombre || "crack";
    const partidosTxt = partidos.length > 0 ? partidos.join(" · ") : "Sin partidos hoy 😴";
    const noticiasTxt = noticias.length > 0 ? noticias.join(" · ") : "Sin noticias destacadas.";

    const r = await sendWATemplate(p.whatsapp, "resumen_diario", [nombre, partidosTxt, noticiasTxt]);
    resultados.push({ nombre: p.nombre, wa: p.whatsapp, ok: r.ok, error: r.ok ? undefined : r.data });

    // Pequeña pausa para no saturar la API (max 80 msg/seg en Meta)
    if (i % 10 === 9) await new Promise(ok => setTimeout(ok, 500));
  }

  const enviados = resultados.filter(r => r.ok).length;
  res.json({ ok: true, enviados, total: unicos.length, turno: esMañana ? "mañana" : "noche", resultados });
}
