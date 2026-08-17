import { timingSafeEqual } from 'node:crypto'

// ─── Device authentication ───────────────────────────────────────────
// The POST endpoint writes into the database with the service-role key, so
// "knows a device UUID" must not be enough to call it. The Arduino sends a
// shared secret in an X-Device-Secret header (see config.h) and we compare
// it against DEVICE_SECRET from the environment.
//
// This is the stopgap version of Phase 5.5: one secret for the whole fleet,
// which is fine while the fleet is one board. The real fix is a per-device
// secret issued by a pairing flow.
// ─────────────────────────────────────────────────────────────────────

// Constant-time compare so the response time cannot be used to guess the
// secret one character at a time. Lengths must match before comparing, and
// leaking "wrong length" is harmless.
function secretsMatch(provided, expected) {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function requireDeviceSecret(req, res, next) {
  const expected = process.env.DEVICE_SECRET

  // Fail CLOSED. A missing env var must never silently disable the check —
  // that is exactly how an endpoint ends up open in production.
  if (!expected) {
    console.error('DEVICE_SECRET is not set — refusing every write')
    return res.status(503).json({ error: 'Server not configured' })
  }

  const provided = req.get('X-Device-Secret')

  if (!provided || !secretsMatch(provided, expected)) {
    console.warn(`Rejected write from ${req.ip}: bad or missing X-Device-Secret`)
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}

// ─── Rate limiting ───────────────────────────────────────────────────
// Fixed window, in memory, no dependency — enough for a single device that
// posts once every 5 minutes. It exists to stop an open endpoint from being
// used to fill the Supabase free tier, not to survive a real flood.
//
// In memory means the counters reset on every restart and are per-instance.
// If this ever scales past one instance, move to a shared store.
// ─────────────────────────────────────────────────────────────────────

const WINDOW_MS = 60_000    // one minute
const MAX_HITS = 20         // generous: the device needs 1 per 5 minutes
const MAX_TRACKED_IPS = 1000

const hits = new Map()      // ip → { count, resetAt }

export function rateLimit(req, res, next) {
  const now = Date.now()

  // Keep the map from growing without bound: sweep expired entries once it
  // gets large. Cheap because it only runs when the map is already big.
  if (hits.size > MAX_TRACKED_IPS) {
    for (const [ip, entry] of hits) {
      if (now > entry.resetAt) hits.delete(ip)
    }
  }

  const entry = hits.get(req.ip)

  // First request, or the previous window has expired → start a new window
  if (!entry || now > entry.resetAt) {
    hits.set(req.ip, { count: 1, resetAt: now + WINDOW_MS })
    return next()
  }

  if (entry.count >= MAX_HITS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    res.set('Retry-After', String(retryAfter))
    console.warn(`Rate limited ${req.ip}`)
    return res.status(429).json({ error: 'Too many requests' })
  }

  entry.count++
  next()
}
