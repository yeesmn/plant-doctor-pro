
import express from 'express'
import { supabase } from '../js/supabase.js'

// ─── Why this file only has ONE route ────────────────────────────────
// It used to expose GET / GET :id / GET device/:device_id / PUT / DELETE
// as well. They were deleted before deploying (Phase 5.8 step 2) because:
//
//   1. Nothing called them. The dashboard reads Supabase directly through
//      the JS client (web/frontend/src/app/api/fetch-data.ts), where RLS
//      restricts every query to the logged-in user.
//   2. This server holds the SERVICE-ROLE key, which bypasses RLS. An
//      unauthenticated GET here returned every reading of every user, and
//      PUT/DELETE let anyone rewrite or erase any row.
//
// The Arduino only ever needs to write, so write is all that is exposed.
// If an admin endpoint is needed later, put it behind auth — do not
// restore these as they were.
// ─────────────────────────────────────────────────────────────────────

const router = express.Router()

// ─── Input validation ────────────────────────────────────────────────
// Without this, a malformed body becomes a 500: a non-UUID device_id trips
// Postgres error 22P02, and moisture: "abc" fails at insert time. Both are
// the client's fault and should say so with a 400.
//
// The ranges also pin down the contract the firmware is expected to honour.
// Note MOISTURE and HUMIDITY are PERCENT — the firmware converts raw ADC
// values before sending (see moistureToPercent() in sensor.ino). A raw
// reading like 318 is now rejected on purpose rather than stored in the
// wrong unit.
// ─────────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// -1 is the firmware's "this sensor failed" sentinel and is always allowed.
const FAILED_READ = -1

const RANGES = {
  moisture:    [0, 100],        // percent
  humidity:    [0, 100],        // percent
  light:       [0, 100000],     // lux
  temperature: [-40, 85],       // SHT31's own operating range
  roll:        [-180, 180],
  pitch:       [-180, 180],
}

// Returns an error message, or null when the body is acceptable.
function validateReading(body) {
  const { device_id, plant_status } = body

  if (!device_id) return 'device_id is required'
  if (typeof device_id !== 'string' || !UUID_RE.test(device_id)) {
    return 'device_id must be a UUID'
  }

  for (const [field, [min, max]] of Object.entries(RANGES)) {
    const value = body[field]

    // Every measurement is optional — a device without a light sensor simply
    // omits it. Only reject values that are present and wrong.
    if (value === undefined || value === null) continue

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return `${field} must be a number`
    }

    if (value !== FAILED_READ && (value < min || value > max)) {
      return `${field} must be between ${min} and ${max} (or ${FAILED_READ} for a failed read)`
    }
  }

  if (plant_status !== undefined && plant_status !== null) {
    if (typeof plant_status !== 'string') return 'plant_status must be a string'
    if (plant_status.length > 64) return 'plant_status must be 64 characters or fewer'
  }

  return null
}

// ─── POST /api/sensor-data ───────────────────────────────────────────
// The Arduino calls this to SAVE a new sensor reading.
router.post('/sensor-data', async (req, res) => {

  const validationError = validateReading(req.body ?? {})
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  const { device_id, moisture, light, temperature, humidity, roll, pitch, plant_status } = req.body

  // Verify the device exists before inserting.
  // maybeSingle(), not single(): single() treats "no rows" as an error, which
  // made the 404 below unreachable — an unknown device_id answered 500.
  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('id')
    .eq('id', device_id)
    .maybeSingle()

  // Log the real reason server-side; tell the client nothing about the schema.
  // PostgREST messages name tables, columns and constraints.
  if (deviceError) {
    console.error('POST /sensor-data — device lookup failed:', deviceError)
    return res.status(500).json({ error: 'Internal server error' })
  }

  if (!device) {
    return res.status(404).json({ error: 'Device not found' })
  }

  // Insert the new reading row
  const { data, error } = await supabase
    .from('plant_data')
    .insert({ device_id, moisture, light, temperature, humidity, roll, pitch, plant_status })

  if (error) {
    console.error('POST /sensor-data — insert failed:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }

  res.status(201).json({ message: 'Sensor data saved', data })
})

export default router
