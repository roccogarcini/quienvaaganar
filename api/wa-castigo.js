// Manda un castigo divertido al último lugar de la tabla
// Seguridad: valida que sala_id existe y que el phone corresponde al último participante real en Supabase
import { sendWA } from "./wa-send.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const CASTIGOS = [
  "Tienes que publicar en tus historias de Instagram una foto con el jersey de algún equipo que no sea el tuyo 😂",
  "Eres el encargado de traer las botanas al siguiente convivio. Sin excusas. 🍕",
  "Tienes que cantar el himno de algún equipo del grupo eliminado en nota de voz al grupo. 🎵",
  "Cambias tu foto de perfil por la del equipo que te eliminó. Mínimo 48 horas. 😈",
  "Debes enviar un mensaje de voz de 30 segundos predicando las virtudes del mejor equipo del grupo (según nosotros). 📣",
  "Mandas una selfie con cara de 😭 en el grupo. No se acepta otra cara. 🤳",
  "Pagas la próxima ronda de bebidas. Los que están presentes, claro. 🍺",
  "Tienes que escribir 'Soy el peor pronosticador del grupo' en el chat. Sin emojis. Sin excusas. ✍️",
  "Cambias tu nombre de contacto en el grupo a 'Último Lugar 🏳️' por una semana. 😅",
  "Debes predecir el próximo partido en el chat. Si pierdes de nuevo... otro castigo. 🔮",
];

export default async function handler(req, res) {
  const { sala_id, participante_id } = req.query;

  if (!sala_id || !participante_id) {
    return res.status(400).json({ error: "Faltan sala_id y participante_id" });
  }

  // Verificar en Supabase que el participante_id realmente es el último lugar de esa sala
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/participantes?sala_id=eq.${sala_id}&eliminado=eq.false&order=points.asc&limit=1`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const rows = await r.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(404).json({ error: "Sala sin participantes" });
  }

  const ultimo = rows[0];

  // Validar que el participante_id coincide con el último lugar real
  if (ultimo.id !== participante_id) {
    return res.status(403).json({ error: "El participante_id no corresponde al último lugar actual" });
  }

  if (!ultimo.whatsapp) {
    return res.status(400).json({ error: "El último lugar no tiene WhatsApp registrado" });
  }

  const castigo = CASTIGOS[Math.floor(Math.random() * CASTIGOS.length)];
  const nombre = ultimo.nombre || "crack";

  const msg = [
    `😈 *¡ATENCIÓN ${nombre.toUpperCase()}!*`,
    ``,
    `La tabla habló y... vas en ÚLTIMO lugar. 💀`,
    ``,
    `Tu castigo de la semana:`,
    `👉 ${castigo}`,
    ``,
    `No te rajes. El que queda último tiene que cumplir 😂⚽`,
    `👉 Mira la tabla: https://quienvaaganar.vercel.app`,
  ].join("\n");

  const result = await sendWA(ultimo.whatsapp, msg);
  res.json({ ok: result.ok, nombre, castigo });
}
