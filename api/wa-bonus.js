import { sendWA } from "./wa-send.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { pregunta, pts } = req.body || {};
  if (!pregunta) return res.status(400).json({ error: "Falta pregunta" });

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/participantes?select=nombre,whatsapp&eliminado=eq.false&whatsapp=not.is.null`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const participantes = await r.json();
  if (!Array.isArray(participantes) || !participantes.length) return res.json({ ok: true, enviados: 0 });

  const vistos = new Set();
  const unicos = participantes.filter(p => {
    const key = (p.whatsapp || "").replace(/\D/g, "").slice(-10);
    if (!key || vistos.has(key)) return false;
    vistos.add(key); return true;
  });

  const msg = `⭐ *¡Nueva pregunta bonus!*\n\n${pregunta}\n\n💰 Vale *+${pts || 3} pts* si aciertas\n\n👉 Entra a responder:\n${process.env.APP_URL || "https://quienvaaganar.vercel.app"}`;

  const resultados = await Promise.all(unicos.map(p => sendWA(p.whatsapp, msg)));

  res.json({ ok: true, enviados: resultados.filter(r => r.ok).length });
}
