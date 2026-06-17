// Valida secret contra CRON_SECRET. Falla si el env var no está definido.
export function checkSecret(req) {
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  const expected = process.env.CRON_SECRET;
  return expected && secret === expected;
}
