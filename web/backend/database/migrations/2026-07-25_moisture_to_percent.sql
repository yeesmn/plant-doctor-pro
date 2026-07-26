-- =========================================================
-- 2026-07-25_moisture_to_percent.sql
--
-- Phase 5.1 — soil moisture calibration.
--
-- Until now the firmware POSTed the RAW ADC reading (0-1023) into
-- plant_data.moisture, while plant_types.min_moisture / max_moisture and the
-- dashboard both work in PERCENT. From the calibrated firmware onward the
-- device sends percent, so rows written before the upload are in a different
-- unit than everything after it.
--
-- This script rewrites those older rows into percent using the same two
-- calibration points as config.h, so the history chart stays continuous.
--
-- ⚠ SCOPED BY DEVICE ON PURPOSE.
-- The seed script (mock_data.sql) inserts demo rows whose moisture is ALREADY
-- in percent (e.g. 62.0 for the Monstera). Converting those would push them
-- through the formula a second time and clamp them to 100. So the WHERE clause
-- targets one device — the real Arduino — not "every row before a date".
--
-- BEFORE RUNNING
--   1. Fill in the `params` CTE below:
--      - device       : the `devices.id` your Arduino POSTs as DEVICE_ID
--                       (config.h). Run step 0 to find it.
--      - raw_dry/wet  : must match MOISTURE_RAW_DRY / MOISTURE_RAW_WET in
--                       arduino/plant_doctor_pro/config.h
--      - cutoff       : the moment you uploaded the calibrated sketch. Rows
--                       recorded BEFORE this are treated as raw.
--   2. Run step 1 (preview) and sanity-check the numbers.
--   3. Then run step 2.
--
-- Rows with moisture = -1 (failed read) are left untouched.
-- =========================================================


-- ---------------------------------------------------------
-- Step 0 — which device is the real one, and what does its data look like?
-- Raw rows sit in the hundreds; percent rows sit in 0-100.
-- ---------------------------------------------------------
SELECT
    d.plant_name,
    p.device_id,
    COUNT(*)             AS rows,
    MIN(p.moisture)      AS min_moisture,
    MAX(p.moisture)      AS max_moisture,
    MIN(p.recorded_at)   AS first_seen,
    MAX(p.recorded_at)   AS last_seen
FROM plant_data p
JOIN devices d ON d.id = p.device_id
GROUP BY d.plant_name, p.device_id
ORDER BY last_seen DESC;


-- ---------------------------------------------------------
-- Step 1 — PREVIEW. Run this alone first; nothing is modified.
-- ---------------------------------------------------------
WITH params AS (
    SELECT
        '00000000-0000-0000-0000-000000000000'::uuid AS device,
        620::numeric                                 AS raw_dry,
        300::numeric                                 AS raw_wet,
        TIMESTAMPTZ '2026-07-25 00:00:00+00'         AS cutoff
)
SELECT
    p.id,
    p.recorded_at,
    p.moisture AS raw_value,
    GREATEST(0, LEAST(100,
        (params.raw_dry - p.moisture) * 100.0 / (params.raw_dry - params.raw_wet)
    )) AS percent_value
FROM plant_data p, params
WHERE p.device_id = params.device
  AND p.recorded_at < params.cutoff
  AND p.moisture IS NOT NULL
  AND p.moisture <> -1
ORDER BY p.recorded_at
LIMIT 50;


-- ---------------------------------------------------------
-- Step 2 — CONVERT. Run after the preview looks right.
-- ---------------------------------------------------------
-- BEGIN;

-- WITH params AS (
--     SELECT
--         '00000000-0000-0000-0000-000000000000'::uuid AS device,
--         620::numeric                                 AS raw_dry,
--         300::numeric                                 AS raw_wet,
--         TIMESTAMPTZ '2026-07-25 00:00:00+00'         AS cutoff
-- )
-- UPDATE plant_data p
-- SET moisture = GREATEST(0, LEAST(100,
--         (params.raw_dry - p.moisture) * 100.0 / (params.raw_dry - params.raw_wet)
--     ))
-- FROM params
-- WHERE p.device_id = params.device
--   AND p.recorded_at < params.cutoff
--   AND p.moisture IS NOT NULL
--   AND p.moisture <> -1;

-- COMMIT;


-- ---------------------------------------------------------
-- Alternative — the raw rows are a single throwaway LAN test, so deleting
-- them is cleaner than converting: they were recorded before the sensor was
-- calibrated, which means the conversion would be guesswork applied to data
-- nobody needs. Scoped to the one device so the demo rows survive.
-- ---------------------------------------------------------
-- DELETE FROM plant_data
-- WHERE device_id = '00000000-0000-0000-0000-000000000000'::uuid
--   AND recorded_at < TIMESTAMPTZ '2026-07-25 00:00:00+00';


-- ---------------------------------------------------------
-- Verify — after either path every moisture value should sit in 0-100
-- (or be exactly -1). This should return zero rows.
-- ---------------------------------------------------------
-- SELECT id, device_id, recorded_at, moisture
-- FROM plant_data
-- WHERE moisture IS NOT NULL
--   AND moisture <> -1
--   AND (moisture < 0 OR moisture > 100);
