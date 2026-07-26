-- =========================================================
-- 2026-07-25_moisture_to_percent.sql
--
-- Phase 5.1 — soil moisture calibration.
--
-- Until now the firmware POSTed the RAW ADC reading (0-1023) into
-- plant_data.moisture, while plant_types.min_moisture / max_moisture and the
-- dashboard both work in PERCENT. From the calibrated firmware onward the
-- device sends percent, so the rows already in the table are in a different
-- unit than everything written after the upload.
--
-- This script rewrites those older rows into percent using the same two
-- calibration points as config.h, so the history chart stays continuous.
--
-- BEFORE RUNNING
--   1. Set the three values in the `params` CTE below:
--      - raw_dry / raw_wet : must match MOISTURE_RAW_DRY / MOISTURE_RAW_WET
--                            in arduino/plant_doctor_pro/config.h
--      - cutoff            : the moment you uploaded the calibrated sketch.
--                            Rows recorded BEFORE this are treated as raw.
--   2. Run the SELECT (step 1) first and sanity-check the preview.
--   3. Then run the UPDATE (step 2).
--
-- Rows with moisture = -1 (failed read) are left untouched.
-- =========================================================


-- ---------------------------------------------------------
-- Step 1 — PREVIEW. Run this alone first; nothing is modified.
-- ---------------------------------------------------------
WITH params AS (
    SELECT
        620::numeric              AS raw_dry,
        300::numeric              AS raw_wet,
        TIMESTAMP '2026-07-25 00:00:00' AS cutoff
)
SELECT
    p.id,
    p.recorded_at,
    p.moisture AS raw_value,
    GREATEST(0, LEAST(100,
        (params.raw_dry - p.moisture) * 100.0 / (params.raw_dry - params.raw_wet)
    )) AS percent_value
FROM plant_data p, params
WHERE p.recorded_at < params.cutoff
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
--         620::numeric              AS raw_dry,
--         300::numeric              AS raw_wet,
--         TIMESTAMP '2026-07-25 00:00:00' AS cutoff
-- )
-- UPDATE plant_data p
-- SET moisture = GREATEST(0, LEAST(100,
--         (params.raw_dry - p.moisture) * 100.0 / (params.raw_dry - params.raw_wet)
--     ))
-- FROM params
-- WHERE p.recorded_at < params.cutoff
--   AND p.moisture IS NOT NULL
--   AND p.moisture <> -1;

-- COMMIT;


-- ---------------------------------------------------------
-- Alternative — if the old rows are throwaway test data, just drop them
-- instead of converting. Simpler, and avoids trusting a calibration that
-- was measured after the fact.
-- ---------------------------------------------------------
-- DELETE FROM plant_data WHERE recorded_at < TIMESTAMP '2026-07-25 00:00:00';


-- ---------------------------------------------------------
-- Verify — after either path, every moisture value should sit in 0-100
-- (or be exactly -1). This should return zero rows.
-- ---------------------------------------------------------
-- SELECT id, recorded_at, moisture
-- FROM plant_data
-- WHERE moisture IS NOT NULL
--   AND moisture <> -1
--   AND (moisture < 0 OR moisture > 100);
