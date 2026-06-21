
import express from 'express'
import { supabase } from '../js/supabase.js'

const router = express.Router()

// ─── POST /api/sensor-data ───────────────────────────────────────────
// Arduino calls this to SAVE a new sensor reading
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

// ─── GET /api/sensor-data ─────────────────────────────────────────────
// Get ALL sensor readings, newest first
router.get('/sensor-data', async (req, res) => {

  // .select('*') means fetch all columns
  // .order() sorts by recorded_at descending — newest reading comes first
  const { data, error } = await supabase
    .from('plant_data')
    .select('*')
    .order('recorded_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // 200 = OK — successfully retrieved data
  res.status(200).json({ data })
})

// ─── GET /api/sensor-data/:id ─────────────────────────────────────────
// Get ONE specific reading by its id
// :id is a URL parameter — e.g. /api/sensor-data/abc-123
router.get('/sensor-data/:id', async (req, res) => {

  // req.params.id captures whatever is in the :id part of the URL
  const { id } = req.params

  const { data, error } = await supabase
    .from('plant_data')
    .select('*')
    .eq('id', id)    // WHERE id = the uuid from the URL
    .single()        // expect one row — returns object not array

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // If no row found with that id, return 404
  if (!data) {
    return res.status(404).json({ error: 'Record not found' })
  }

  res.status(200).json({ data })
})

// ─── GET /api/sensor-data/device/:device_id ───────────────────────────
// Get ALL readings for a specific device/plant
// Useful for showing history for one plant on the dashboard
router.get('/sensor-data/device/:device_id', async (req, res) => {

  const { device_id } = req.params

  const { data, error } = await supabase
    .from('plant_data')
    .select('*')
    .eq('device_id', device_id)                  // filter by device
    .order('recorded_at', { ascending: false })  // newest first

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ data })
})

// ─── PUT /api/sensor-data/:id ─────────────────────────────────────────
// UPDATE an existing reading by its id
// Useful if Arduino sends a correction or you need to fix a value
router.put('/sensor-data/:id', async (req, res) => {

  const { id } = req.params

  // Only pull the fields that are allowed to be updated
  // device_id and recorded_at should NOT be changeable after creation
  const { moisture, light, temperature, humidity, roll, pitch, plant_status } = req.body

  // Build the update object — only include fields that were actually sent
  // This prevents overwriting existing values with undefined
  const updates = {}
  if (moisture    !== undefined) updates.moisture     = moisture
  if (light       !== undefined) updates.light        = light
  if (temperature !== undefined) updates.temperature  = temperature
  if (humidity    !== undefined) updates.humidity     = humidity
  if (roll        !== undefined) updates.roll         = roll
  if (pitch       !== undefined) updates.pitch        = pitch
  if (plant_status !== undefined) updates.plant_status = plant_status

  // If the request body was empty, there's nothing to update
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided to update' })
  }

  // .update() changes the row, .eq() targets the specific row by id
  const { data, error } = await supabase
    .from('plant_data')
    .update(updates)
    .eq('id', id)
    .select()   // .select() returns the updated row so we can send it back

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // If .select() returned empty array, that id didn't exist
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Record not found' })
  }

  res.status(200).json({ message: 'Record updated', data: data[0] })
})

// ─── DELETE /api/sensor-data/:id ──────────────────────────────────────
// DELETE one specific reading by its id
router.delete('/sensor-data/:id', async (req, res) => {

  const { id } = req.params

  // .delete() removes the row, .eq() targets it by id
  // .select() returns the deleted row so we can confirm what was removed
  const { data, error } = await supabase
    .from('plant_data')
    .delete()
    .eq('id', id)
    .select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // If nothing was deleted, that id didn't exist
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Record not found' })
  }

  res.status(200).json({ message: 'Record deleted', data: data[0] })
})

export default router