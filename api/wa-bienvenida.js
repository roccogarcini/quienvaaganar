import { sendWA } from "./wa-send.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const { participante_id } = req.query;
  if (!participante_id) return res.status(400).json({ error: "Falta participante_id" });

  // Obtener datos del participante
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/participantes?id=eq.${participante_id}&limit=1`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const rows = await r.json();
  if (!Array.isArray(rows) || !rows[0]) return res.status(404).json({ error: "Participante no encontrado" });

  const p = rows[0];
  if (!p.whatsapp) return res.status(400).json({ error: "Sin WhatsApp" });

  const msg = [
    `🎉 *¡Bienvenido al Mundial 2026, ${p.nombre}!*`,
    ``,
    `${p.flag} Tu equipo: *${p.equipo}*`,
    ``,
    `Ya estás en la quiniela. Sigue los partidos, mira la tabla y compite con tus amigos durante todo el torneo 🏆`,
    ``,
    `👉 Entra cuando quieras aquí:`,
    `${process.env.APP_URL || "https://quienvaaganar.vercel.app"}`,
    ``,
    `¡Buena suerte! ⚽`,
  ].join("\n");

  const result = await sendWA(p.whatsapp, msg);
  res.json({ ok: result.ok, nombre: p.nombre });
}
