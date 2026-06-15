// Avisa a participantes que no han llenado su quiniela
// GET /api/wa-quiniela?secret=qvag_cron_2026
// Usa template "quiniela_invitacion" si está aprobado, fallback a free-form

import { sendWA, sendWATemplate } from "./wa-send.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.APP_URL || "https://quienvaaganar.vercel.app";

export default async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "No autorizado" });
  }

  // Participantes con WA
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/participantes?sala_id=eq.mundial2026&eliminado=eq.false&whatsapp=not.is.null&select=id,nombre,flag,equipo,whatsapp`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const participantes = await r.json();
  if (!Array.isArray(participantes)) return res.status(500).json({ error: "Error al obtener participantes" });

  // IDs que ya tienen al menos un pronóstico
  const r2 = await fetch(
    `${SUPABASE_URL}/rest/v1/pronosticos_partidos?sala_id=eq.mundial2026&select=participante_id`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const prons = await r2.json();
  const conPron = new Set(Array.isArray(prons) ? prons.map(p => p.participante_id) : []);

  const sinQuiniela = participantes.filter(p => !conPron.has(p.id));

  const resultados = [];
  for (const p of sinQuiniela) {
    // Intenta template aprobado primero; si falla, manda free-form
    let result = await sendWATemplate(p.whatsapp, "quiniela_invitacion", [p.nombre]);
    if (!result.ok) {
      const msg = [
        `⚽ *${p.nombre}, ¡ya puedes llenar tu quiniela!*`,
        ``,
        `Pronostica todos los partidos del Mundial 2026 y gana puntos con cada acierto 🎯`,
        ``,
        `➤ Gana = 2 pts  |  Empate = 1 pt  |  Pierde = 0 pts`,
        ``,
        `Además hay *preguntas bonus* que se abren en días especiales para sumar puntos extra 🔥`,
        ``,
        `👉 Entra ahora y llena tus pronósticos:`,
        APP_URL,
      ].join("\n");
      result = await sendWA(p.whatsapp, msg);
    }
    resultados.push({ nombre: p.nombre, ok: result.ok });
    await new Promise(r => setTimeout(r, 500));
  }

  res.json({ ok: true, total: participantes.length, sinQuiniela: sinQuiniela.length, enviados: resultados.length, resultados });
}
