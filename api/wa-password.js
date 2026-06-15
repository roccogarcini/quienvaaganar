import { sendWA } from "./wa-send.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.APP_URL || "https://quienvaaganar.vercel.app";

// Envía WA a todos los participantes sin contraseña para que la creen
// GET /api/wa-password?secret=qvag_cron_2026
export default async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "No autorizado" });
  }

  // Traer participantes sin contraseña y con WA
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/participantes?sala_id=eq.mundial2026&password=is.null&whatsapp=not.is.null&select=id,nombre,flag,equipo,whatsapp`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const participantes = await r.json();
  if (!Array.isArray(participantes)) return res.status(500).json({ error: "Error al obtener participantes" });

  const resultados = [];
  for (const p of participantes) {
    const msg = [
      `🔒 *${p.nombre}, protege tu cuenta de la quiniela*`,
      ``,
      `Para que nadie más pueda entrar con tu número, ahora la quiniela tiene contraseña 🛡️`,
      ``,
      `👉 Entra a la app y crea la tuya:`,
      APP_URL,
      ``,
      `Solo te toma 10 segundos. ¡Ya casi empieza el Mundial! ⚽🏆`,
    ].join("\n");

    const result = await sendWA(p.whatsapp, msg);
    resultados.push({ nombre: p.nombre, ok: result.ok });

    // Pausa entre mensajes para no saturar la API
    await new Promise(r => setTimeout(r, 500));
  }

  res.json({ ok: true, enviados: resultados.length, resultados });
}
