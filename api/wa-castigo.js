// Manda un castigo divertido al último lugar de la tabla
import { sendWA } from "./wa-send.js";

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
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { phone, nombre, sala } = req.query;
  if (!phone || !nombre) {
    return res.status(400).json({ error: "faltan phone y nombre" });
  }

  const castigo = CASTIGOS[Math.floor(Math.random() * CASTIGOS.length)];

  const msg = [
    `😈 *¡ATENCIÓN ${nombre.toUpperCase()}!*`,
    ``,
    `La tabla habló y... vas en ÚLTIMO lugar en *${sala || "la sala"}*. 💀`,
    ``,
    `Tu castigo de la semana:`,
    `👉 ${castigo}`,
    ``,
    `No te rajes. El que queda último tiene que cumplir 😂⚽`,
    `👉 Mira la tabla: https://quienvaaganar.vercel.app`,
  ].join("\n");

  const r = await sendWA(phone, msg);
  res.json({ ok: r.ok, nombre, castigo });
}
