-- =========================================================
-- 2026-07-25_timestamptz.sql
--
-- Phase 5.2 — give every timestamp column a time zone.
--
-- The tables were created with `TIMESTAMP` (no time zone). Postgres stores
-- whatever NOW() produced (UTC on Supabase) but records no offset, so
-- PostgREST returns e.g. "2026-07-25T01:00:00" with nothing on the end. The
-- JavaScript `new Date()` in the dashboard parses an offset-less ISO string as
-- LOCAL time, so in KST every reading appeared 9 hours in the past
-- ("9 hr ago" for a row that had just arrived).
--
-- Converting to TIMESTAMPTZ makes PostgREST emit "...+00:00" and the whole
-- problem disappears — no client-side date maths required.
--
-- The USING clause below reinterprets the stored naked values as UTC, which is
-- what they always were (Supabase's Postgres runs in UTC). Verify that with
-- step 0 before converting: if `now_local` and `now_utc` differ, this database
-- is NOT on UTC and the USING clause must name the real zone instead.
--
-- Safe to run once. Re-running is a no-op: altering a TIMESTAMPTZ column to
-- TIMESTAMPTZ does nothing.
-- =========================================================


-- ---------------------------------------------------------
-- Step 0 — confirm the server's time zone is UTC.
-- Expect the two columns to be identical and TimeZone to be 'UTC'.
-- ---------------------------------------------------------
SELECT
    current_setting('TIMEZONE') AS server_timezone,
    LOCALTIMESTAMP              AS now_local,
    (NOW() AT TIME ZONE 'UTC')  AS now_utc;


-- ---------------------------------------------------------
-- Step 1 — convert. Run as one transaction.
-- ---------------------------------------------------------
BEGIN;

ALTER TABLE public.plant_data
    ALTER COLUMN recorded_at TYPE TIMESTAMPTZ
    USING recorded_at AT TIME ZONE 'UTC';

ALTER TABLE public.devices
    ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.profiles
    ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.plant_types
    ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.care_suggestions
    ALTER COLUMN created_at TYPE TIMESTAMPTZ
    USING created_at AT TIME ZONE 'UTC';

COMMIT;


-- ---------------------------------------------------------
-- Step 2 — verify. Every row should now report timestamp with time zone,
-- and the newest reading should be minutes old, not hours.
-- ---------------------------------------------------------
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('recorded_at', 'created_at')
ORDER BY table_name;

SELECT
    recorded_at,
    NOW() - recorded_at AS age
FROM plant_data
ORDER BY recorded_at DESC
LIMIT 3;
