-- =========================================================
-- 2026-11-17_demo_account.sql
-- A public, read-only demo login for the live dashboard.
--
-- Run ONCE in the Supabase SQL editor, AFTER creating the demo user:
--   Authentication → Users → Add user → Create new user
--     email:    demo@example.com     (or change v_demo_email below)
--     password: whatever you will publish in the README
--     ☑ Auto Confirm User
--
-- What this script does
--   1. Marks that user as the demo account (app_metadata.demo = true).
--      app_metadata is writable only with the service-role key, so a visitor
--      logged in as demo cannot remove the flag from their own session.
--   2. Makes the demo account read-only with RESTRICTIVE policies. They are
--      AND-ed with the existing per-user policies in policy.sql, so nothing
--      changes for real accounts.
--   3. Stops anyone logged in as demo from changing its password or email,
--      which would lock everyone else out.
--   4. Gives it three demo plants and 90 days of simulated history, then
--      keeps the history moving with a pg_cron job every 5 minutes, so the
--      dashboard looks like a live device rather than a frozen snapshot.
--
-- Safe to re-run: every step is idempotent.
-- =========================================================


-- ---------------------------------------------------------
-- 0. Which account is the demo one
-- ---------------------------------------------------------
DO $$
DECLARE
    v_demo_email TEXT := 'demo@example.com';   -- ← must match the user you created
    v_count      INT;
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"demo": true}'::jsonb
    WHERE email = v_demo_email;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'No auth user with email %. Create it under Authentication → Users first.', v_demo_email;
    END IF;
END;
$$;


-- ---------------------------------------------------------
-- 1. Is the current request coming from the demo account?
-- ---------------------------------------------------------
-- Reads the JWT, not a table: no lookup per row, and the claim comes from
-- app_metadata, which the user cannot edit.
CREATE OR REPLACE FUNCTION public.is_demo_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'demo')::BOOLEAN, FALSE);
$$;


-- ---------------------------------------------------------
-- 2. Read-only: block every write policy.sql allows
-- ---------------------------------------------------------
-- RESTRICTIVE policies must ALL pass in addition to at least one permissive
-- policy, so these only ever take access away, and only from the demo account.

DROP POLICY IF EXISTS "Demo account cannot update profile" ON public.profiles;
CREATE POLICY "Demo account cannot update profile"
ON public.profiles AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (NOT public.is_demo_user())
WITH CHECK (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Demo account cannot create devices" ON public.devices;
CREATE POLICY "Demo account cannot create devices"
ON public.devices AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Demo account cannot update devices" ON public.devices;
CREATE POLICY "Demo account cannot update devices"
ON public.devices AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (NOT public.is_demo_user())
WITH CHECK (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Demo account cannot delete devices" ON public.devices;
CREATE POLICY "Demo account cannot delete devices"
ON public.devices AS RESTRICTIVE
FOR DELETE TO authenticated
USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Demo account cannot insert plant data" ON public.plant_data;
CREATE POLICY "Demo account cannot insert plant data"
ON public.plant_data AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Demo account cannot delete plant data" ON public.plant_data;
CREATE POLICY "Demo account cannot delete plant data"
ON public.plant_data AS RESTRICTIVE
FOR DELETE TO authenticated
USING (NOT public.is_demo_user());

DROP POLICY IF EXISTS "Demo account cannot insert suggestions" ON public.care_suggestions;
CREATE POLICY "Demo account cannot insert suggestions"
ON public.care_suggestions AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (NOT public.is_demo_user());


-- ---------------------------------------------------------
-- 3. Lock the demo credentials
-- ---------------------------------------------------------
-- The password is public, so anyone can log in and call
-- supabase.auth.updateUser({ password }) — Supabase has no per-user switch
-- for that. This trigger quietly keeps the old password and email whenever
-- the Auth server (role supabase_auth_admin) tries to change them for the
-- demo user. The call "succeeds", nothing changes.
--
-- You can still change them yourself: the SQL editor runs as `postgres`, not
-- supabase_auth_admin, so a direct UPDATE goes through, e.g.
--   UPDATE auth.users
--   SET encrypted_password = extensions.crypt('new-pass', extensions.gen_salt('bf'))
--   WHERE email = 'demo@example.com';
CREATE OR REPLACE FUNCTION public.protect_demo_credentials()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF current_user = 'supabase_auth_admin'
       AND COALESCE((OLD.raw_app_meta_data ->> 'demo')::BOOLEAN, FALSE) THEN
        NEW.encrypted_password := OLD.encrypted_password;
        NEW.email              := OLD.email;
        NEW.phone              := OLD.phone;
        NEW.raw_app_meta_data  := OLD.raw_app_meta_data;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_demo_credentials ON auth.users;
CREATE TRIGGER protect_demo_credentials
BEFORE UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_demo_credentials();


-- ---------------------------------------------------------
-- 4. Simulated readings
-- ---------------------------------------------------------
-- One reading for one device at one instant, shaped by that plant's species
-- ranges in plant_types so the health score behaves realistically:
--   light        — daylight curve in KST, near zero at night
--   temperature  — follows the light with a lag, ±3 °C
--   humidity     — moves opposite to temperature
--   moisture     — 5-day watering cycle: watered to above max, dries to
--                  below min, watered again; offset per device so the
--                  three plants are not in lockstep
--   roll / pitch — a pot sitting slightly off level
-- plant_status uses the same rules as arduino/plant_status.ino.
CREATE OR REPLACE FUNCTION public.demo_insert_reading(p_device_id UUID, p_at TIMESTAMPTZ)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    pt         public.plant_types%ROWTYPE;
    v_hour     NUMERIC;
    v_daylight NUMERIC;
    v_cycle    NUMERIC;
    v_moisture NUMERIC;
    v_light    NUMERIC;
    v_temp     NUMERIC;
    v_hum      NUMERIC;
    v_status   TEXT;
BEGIN
    SELECT t.* INTO pt
    FROM public.devices d
    JOIN public.plant_types t ON t.id = d.plant_type_id
    WHERE d.id = p_device_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    v_hour := EXTRACT(HOUR FROM p_at AT TIME ZONE 'Asia/Seoul')
            + EXTRACT(MINUTE FROM p_at AT TIME ZONE 'Asia/Seoul') / 60.0;

    -- 0 before 06:00 and after 20:00, peaks at 1.0 around 13:00
    v_daylight := GREATEST(0, SIN(PI() * (v_hour - 6) / 14));

    -- 0 → 1 over five days; per-device offset from the UUID
    v_cycle := MOD(EXTRACT(EPOCH FROM p_at) / 86400.0
                   + (ABS(HASHTEXT(p_device_id::TEXT)::BIGINT) % 5), 5) / 5.0;

    v_moisture := pt.max_moisture + 6
                - v_cycle * (pt.max_moisture - pt.min_moisture + 14)
                + (RANDOM() - 0.5) * 2;
    v_moisture := LEAST(100, GREATEST(0, v_moisture));

    v_light := CASE
        WHEN v_daylight > 0
            THEN pt.min_light * 0.5 + v_daylight * (pt.max_light * 0.85 - pt.min_light * 0.5)
        ELSE 5
    END * (0.9 + RANDOM() * 0.2);

    v_temp := (pt.min_temp + pt.max_temp) / 2.0 - 1.5
            + 3 * SIN(PI() * (v_hour - 9) / 12)
            + (RANDOM() - 0.5) * 0.6;

    v_hum := (pt.min_humidity + pt.max_humidity) / 2.0
           - 6 * SIN(PI() * (v_hour - 9) / 12)
           + (RANDOM() - 0.5) * 2;

    v_status := CASE
        WHEN v_moisture < 30    THEN 'needs water'
        WHEN v_moisture > 80    THEN 'too wet'
        WHEN v_light    < 200   THEN 'needs more light'
        WHEN v_light    > 20000 THEN 'too much direct light'
        WHEN v_temp     < 15    THEN 'too cold'
        WHEN v_temp     > 32    THEN 'too hot'
        ELSE 'healthy'
    END;

    INSERT INTO public.plant_data
        (device_id, moisture, light, temperature, humidity, roll, pitch, plant_status, recorded_at)
    VALUES (
        p_device_id,
        ROUND(v_moisture, 1),
        ROUND(v_light, 0),
        ROUND(v_temp, 1),
        ROUND(v_hum, 1),
        ROUND((2.0 + SIN(EXTRACT(EPOCH FROM p_at) / 7200.0) * 0.8 + (RANDOM() - 0.5) * 0.4)::NUMERIC, 1),
        ROUND((-1.2 + COS(EXTRACT(EPOCH FROM p_at) / 9000.0) * 0.6 + (RANDOM() - 0.5) * 0.4)::NUMERIC, 1),
        v_status,
        p_at
    );
END;
$$;


-- Every 5 minutes: one new reading per demo device, and drop anything older
-- than 90 days (the longest range the dashboard shows) so the table stays
-- bounded on the free tier.
CREATE OR REPLACE FUNCTION public.demo_tick()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_device UUID;
BEGIN
    FOR v_device IN
        SELECT d.id
        FROM public.devices d
        JOIN auth.users u ON u.id = d.user_id
        WHERE COALESCE((u.raw_app_meta_data ->> 'demo')::BOOLEAN, FALSE)
    LOOP
        PERFORM public.demo_insert_reading(v_device, NOW());

        DELETE FROM public.plant_data
        WHERE device_id = v_device
          AND recorded_at < NOW() - INTERVAL '90 days';
    END LOOP;
END;
$$;

-- Functions in `public` are callable through the REST API (/rpc/...) by
-- default. These write data with SECURITY DEFINER, so nobody but the
-- database itself (pg_cron runs as postgres) may call them.
REVOKE EXECUTE ON FUNCTION public.demo_insert_reading(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.demo_tick() FROM PUBLIC, anon, authenticated;
-- (protect_demo_credentials is a trigger function — the REST API cannot call
-- those directly, and revoking EXECUTE could stop it firing for the Auth role.)


-- ---------------------------------------------------------
-- 5. Demo plants + 90 days of history
-- ---------------------------------------------------------
-- Names say "Demo" so nobody mistakes a simulated feed for a real board.
-- History is every 30 minutes (≈4,300 rows per plant); the cron job then
-- adds one row every 5 minutes going forward.
DO $$
DECLARE
    v_user_id UUID;
    v_device  UUID;
    v_at      TIMESTAMPTZ;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE COALESCE((raw_app_meta_data ->> 'demo')::BOOLEAN, FALSE)
    LIMIT 1;

    -- handle_new_user() normally creates this; make sure it exists anyway.
    INSERT INTO public.profiles (id, display_name)
    VALUES (v_user_id, 'Demo')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.devices (user_id, plant_type_id, plant_name)
    SELECT v_user_id, t.id, v.plant_name
    FROM (VALUES
        ('Demo Monstera',    'Monstera deliciosa'),
        ('Demo Basil',       'Basil'),
        ('Demo Snake Plant', 'Snake Plant')
    ) AS v(plant_name, plant_type)
    JOIN public.plant_types t ON t.plant_type = v.plant_type
    ON CONFLICT (user_id, plant_name) DO NOTHING;

    -- Rebuild the history from scratch so a re-run does not double it.
    DELETE FROM public.plant_data
    WHERE device_id IN (SELECT id FROM public.devices WHERE user_id = v_user_id);

    FOR v_device IN SELECT id FROM public.devices WHERE user_id = v_user_id LOOP
        FOR v_at IN
            SELECT generate_series(NOW() - INTERVAL '90 days', NOW(), INTERVAL '30 minutes')
        LOOP
            PERFORM public.demo_insert_reading(v_device, v_at);
        END LOOP;
    END LOOP;
END;
$$;


-- ---------------------------------------------------------
-- 6. Keep it live
-- ---------------------------------------------------------
-- pg_cron ships with Supabase (Database → Extensions). cron.schedule() with
-- an existing job name replaces that job, so re-running is safe.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'demo-tick',
    '*/5 * * * *',
    $$SELECT public.demo_tick();$$
);


-- ---------------------------------------------------------
-- Checks (run by hand afterwards)
-- ---------------------------------------------------------
-- SELECT plant_name, COUNT(*), MAX(recorded_at)
-- FROM devices d JOIN plant_data p ON p.device_id = d.id
-- WHERE d.plant_name LIKE 'Demo %' GROUP BY plant_name;
--
-- SELECT * FROM cron.job_run_details WHERE jobid =
--   (SELECT jobid FROM cron.job WHERE jobname = 'demo-tick')
-- ORDER BY start_time DESC LIMIT 5;
--
-- To remove the demo entirely:
--   SELECT cron.unschedule('demo-tick');
--   DELETE FROM auth.users WHERE email = 'demo@example.com';  -- cascades to devices/data
