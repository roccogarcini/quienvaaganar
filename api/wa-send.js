// Envía un mensaje de texto libre a un número via Meta WhatsApp API
// POST /api/wa-send  { to: "5214431234567", message: "Hola!" }
// También usado internamente por wa-broadcast y wa-prematch

const PHONE_ID  = process.env.WA_PHONE_NUMBER_ID;
const TOKEN     = process.env.WA_ACCESS_TOKEN;
const WA_URL    = `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`;

export async function sendWA(to, message) {
  // Normaliza número → formato internacional sin +
  const phone = normalizePhone(to);
  if (!phone) return { ok: false, error: "número inválido: " + to };

  const body = {
    messaging_product: "whatsapp",
    to: phone,
    type: "text",
    text: { body: message, preview_url: false },
  };

  const r = await fetch(WA_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await r.json();
  return { ok: r.ok, status: r.status, data };
}

function normalizePhone(raw) {
  // Acepta: 4431234567, 524431234567, +52 443 123 4567, etc.
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return "52" + digits;          // local MX sin lada país
  if (digits.length === 12 && digits.startsWith("52")) return digits;
  if (digits.length === 13 && digits.startsWith("521")) return digits;
  if (digits.length >= 10) return digits.slice(-12);       // best-effort
  return null;
}

export async function sendWATemplate(to, templateName, params = []) {
  const phone = normalizePhone(to);
  if (!phone) return { ok: false, error: "número inválido: " + to };

  const components = params.length > 0 ? [{
    type: "body",
    parameters: params.map(p => ({ type: "text", text: String(p) })),
  }] : [];

  const body = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "es_MX" },
      ...(components.length > 0 && { components }),
    },
  };

  const r = await fetch(WA_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await r.json();
  return { ok: r.ok, status: r.status, data };
}

export async function sendWAImage(to, imageUrl, caption = "") {
  const phone = normalizePhone(to);
  if (!phone) return { ok: false, error: "número inválido: " + to };

  const body = {
    messaging_product: "whatsapp",
    to: phone,
    type: "image",
    image: { link: imageUrl, ...(caption && { caption }) },
  };

  const r = await fetch(WA_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await r.json();
  return { ok: r.ok, status: r.status, data };
}

// Handler HTTP directo (para pruebas manuales)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { to, message } = req.method === "POST" ? req.body : req.query;
  if (!to || !message) return res.status(400).json({ error: "faltan to y message" });

  const result = await sendWA(to, message);
  res.status(result.ok ? 200 : 400).json(result);
}
