
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

// ─── POST /api/sensor-data ───────────────────────────────────────────
// The Arduino calls this to SAVE a new sensor reading.
router.post('/sensor-data', async (req, res) => {

  const { device_id, moisture, light, temperature, humidity, roll, pitch, plant_status } = req.body

  // device_id is required — it links the reading to a plant
  if (!device_id) {
    return res.status(400).json({ error: 'device_id is required' })
  }

  // Verify the device exists before inserting
  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('id')
    .eq('id', device_id)
    .single()

  if (deviceError) {
    return res.status(500).json({ error: deviceError.message })
  }

  if (!device) {
    return res.status(404).json({ error: 'Device not found' })
  }

  // Insert the new reading row
  const { data, error } = await supabase
    .from('plant_data')
    .insert({ device_id, moisture, light, temperature, humidity, roll, pitch, plant_status })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json({ message: 'Sensor data saved', data })
})

export default router
