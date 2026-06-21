-- =========================================================
-- seed.sql
-- Plant Doctor Pro test/reference data
-- Matches schema with:
-- max_abs_roll, max_abs_pitch, roll, pitch
-- =========================================================


-- =========================================================
-- 1. Seed plant type reference data
-- =========================================================

INSERT INTO public.plant_types (
    plant_type,
    min_temp,
    max_temp,
    min_humidity,
    max_humidity,
    min_light,
    max_light,
    min_moisture,
    max_moisture,
    max_abs_roll,
    max_abs_pitch,
    description
)
VALUES
    (
        'Monstera deliciosa',
        18, 30, -- temp
        40, 70, -- humidity
        1000, 10000, -- light
        40, 70, -- moisture
        15, 15, -- roll, pitch
        'Tropical indoor plant that prefers bright indirect light, moderate moisture, and stable humidity.'
    ),
    (
        'Snake Plant',
        15, 30,
        30, 60,
        500, 8000,
        15, 45,
        20, 20,
        'Hardy indoor plant that tolerates low light and dry soil. Overwatering is a common issue.'
    ),
    (
        'Basil',
        18, 32,
        40, 70,
        5000, 20000,
        50, 80,
        12, 12,
        'Fast-growing herb that needs strong light and consistently moist soil.'
    ),
    (
        'Pothos',
        18, 30,
        40, 70,
        800, 10000,
        35, 70,
        18, 18,
        'Easy indoor vine plant that tolerates lower light but grows best in bright indirect light.'
    ),
    (
        'Bean Plant',
        18, 30,
        40, 70,
        5000, 20000,
        45, 75,
        10, 10,
        'Fast-growing test plant suitable for early Plant Doctor Pro experiments and tilt tracking.'
    ),
    (
        'Peace Lily',
        18, 29,
        45, 75,
        800, 8000,
        45, 75,
        15, 15,
        'Indoor flowering plant that prefers moist soil, moderate humidity, and indirect light.'
    ),
    (
        'Spider Plant',
        16, 27,
        35, 65,
        1000, 12000,
        35, 65,
        18, 18,
        'Resilient houseplant that handles a range of indoor conditions and shows visible stress when neglected.'
    ),
    (
        'Aloe Vera',
        18, 30,
        30, 55,
        3000, 15000,
        10, 35,
        20, 20,
        'Succulent that prefers bright light and dry soil. It is sensitive to overwatering.'
    )
ON CONFLICT (plant_type) DO UPDATE SET
    min_temp = EXCLUDED.min_temp,
    max_temp = EXCLUDED.max_temp,
    min_humidity = EXCLUDED.min_humidity,
    max_humidity = EXCLUDED.max_humidity,
    min_light = EXCLUDED.min_light,
    max_light = EXCLUDED.max_light,
    min_moisture = EXCLUDED.min_moisture,
    max_moisture = EXCLUDED.max_moisture,
    max_abs_roll = EXCLUDED.max_abs_roll,
    max_abs_pitch = EXCLUDED.max_abs_pitch,
    description = EXCLUDED.description;


-- =========================================================
-- 2. Seed mock devices, sensor data, and care suggestions
-- =========================================================
-- Requires at least one user in auth.users.
-- If no Auth user exists, this block skips mock device/data creation.
-- =========================================================

DO $$
DECLARE
    v_user_id UUID;

    v_monstera_type_id UUID;
    v_basil_type_id UUID;
    v_snake_type_id UUID;

    v_monstera_device_id UUID;
    v_basil_device_id UUID;
    v_snake_device_id UUID;
BEGIN
    -- Get the first Supabase Auth user
    SELECT id
    INTO v_user_id
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No auth user found. Plant types were seeded, but mock devices/data were skipped.';
        RETURN;
    END IF;

    -- Make sure profile exists for the selected auth user
    INSERT INTO public.profiles (id, display_name)
    SELECT
        id,
        COALESCE(raw_user_meta_data ->> 'display_name', email, 'Test User')
    FROM auth.users
    WHERE id = v_user_id
    ON CONFLICT (id) DO NOTHING;


    -- Get plant type IDs
    SELECT id INTO v_monstera_type_id
    FROM public.plant_types
    WHERE plant_type = 'Monstera deliciosa';

    SELECT id INTO v_basil_type_id
    FROM public.plant_types
    WHERE plant_type = 'Basil';

    SELECT id INTO v_snake_type_id
    FROM public.plant_types
    WHERE plant_type = 'Snake Plant';


    -- =====================================================
    -- Create mock devices
    -- =====================================================

    INSERT INTO public.devices (
        user_id,
        plant_type_id,
        plant_name
    )
    VALUES (
        v_user_id,
        v_monstera_type_id,
        'Junyoung Monstera'
    )
    ON CONFLICT (user_id, plant_name) DO UPDATE SET
        plant_type_id = EXCLUDED.plant_type_id
    RETURNING id INTO v_monstera_device_id;


    INSERT INTO public.devices (
        user_id,
        plant_type_id,
        plant_name
    )
    VALUES (
        v_user_id,
        v_basil_type_id,
        'Kitchen Basil'
    )
    ON CONFLICT (user_id, plant_name) DO UPDATE SET
        plant_type_id = EXCLUDED.plant_type_id
    RETURNING id INTO v_basil_device_id;


    INSERT INTO public.devices (
        user_id,
        plant_type_id,
        plant_name
    )
    VALUES (
        v_user_id,
        v_snake_type_id,
        'Bedroom Snake Plant'
    )
    ON CONFLICT (user_id, plant_name) DO UPDATE SET
        plant_type_id = EXCLUDED.plant_type_id
    RETURNING id INTO v_snake_device_id;


    -- =====================================================
    -- Clear old seed sensor/suggestion data for these devices
    -- so rerunning seed.sql does not duplicate chart data
    -- =====================================================

    DELETE FROM public.care_suggestions
    WHERE device_id IN (
        v_monstera_device_id,
        v_basil_device_id,
        v_snake_device_id
    );

    DELETE FROM public.plant_data
    WHERE device_id IN (
        v_monstera_device_id,
        v_basil_device_id,
        v_snake_device_id
    );


    -- =====================================================
    -- Monstera: healthy, stable, slight natural tilt
    -- =====================================================

    INSERT INTO public.plant_data (
        device_id,
        moisture,
        light,
        temperature,
        humidity,
        roll,
        pitch,
        plant_status,
        recorded_at
    )
    SELECT
        v_monstera_device_id,
        ROUND((62 + SIN(gs * 0.7) * 5)::NUMERIC, 1),
        ROUND((3400 + SIN(gs * 0.5) * 400)::NUMERIC, 0),
        ROUND((23.5 + SIN(gs * 0.3) * 1.2)::NUMERIC, 1),
        ROUND((55 + SIN(gs * 0.4) * 4)::NUMERIC, 1),
        ROUND((2.5 + SIN(gs * 0.5) * 1.2)::NUMERIC, 1),
        ROUND((-1.5 + SIN(gs * 0.4) * 1.0)::NUMERIC, 1),
        'Thriving',
        NOW() - ((13 - gs) * INTERVAL '2 hours')
    FROM generate_series(0, 13) AS gs;


    -- =====================================================
    -- Basil: moisture trending low, still strong light
    -- =====================================================

    INSERT INTO public.plant_data (
        device_id,
        moisture,
        light,
        temperature,
        humidity,
        roll,
        pitch,
        plant_status,
        recorded_at
    )
    SELECT
        v_basil_device_id,
        ROUND((52 - gs * 1.2 + SIN(gs * 0.6) * 2)::NUMERIC, 1),
        ROUND((8500 + SIN(gs * 0.5) * 900)::NUMERIC, 0),
        ROUND((24.8 + SIN(gs * 0.4) * 1.4)::NUMERIC, 1),
        ROUND((48 + SIN(gs * 0.3) * 3)::NUMERIC, 1),
        ROUND((4.0 + SIN(gs * 0.7) * 2.0)::NUMERIC, 1),
        ROUND((3.0 + SIN(gs * 0.5) * 1.5)::NUMERIC, 1),
        CASE
            WHEN gs >= 10 THEN 'Needs Water Soon'
            ELSE 'Stable'
        END,
        NOW() - ((13 - gs) * INTERVAL '2 hours')
    FROM generate_series(0, 13) AS gs;


    -- =====================================================
    -- Snake Plant: dry but acceptable, low light stable
    -- =====================================================

    INSERT INTO public.plant_data (
        device_id,
        moisture,
        light,
        temperature,
        humidity,
        roll,
        pitch,
        plant_status,
        recorded_at
    )
    SELECT
        v_snake_device_id,
        ROUND((28 + SIN(gs * 0.8) * 3)::NUMERIC, 1),
        ROUND((1800 + SIN(gs * 0.5) * 300)::NUMERIC, 0),
        ROUND((22.2 + SIN(gs * 0.3) * 1.0)::NUMERIC, 1),
        ROUND((40 + SIN(gs * 0.4) * 3)::NUMERIC, 1),
        ROUND((-3.0 + SIN(gs * 0.6) * 1.5)::NUMERIC, 1),
        ROUND((2.0 + SIN(gs * 0.4) * 1.2)::NUMERIC, 1),
        'Stable',
        NOW() - ((13 - gs) * INTERVAL '2 hours')
    FROM generate_series(0, 13) AS gs;


    -- =====================================================
    -- Care suggestions
    -- =====================================================

    INSERT INTO public.care_suggestions (
        device_id,
        suggestion
    )
    VALUES
        (
            v_monstera_device_id,
            'Your Monstera is in a healthy range. Keep the current watering and light routine.'
        ),
        (
            v_monstera_device_id,
            'Tilt readings are stable. No major leaning or growth imbalance detected.'
        ),
        (
            v_basil_device_id,
            'Soil moisture is trending down. Water soon if the top soil feels dry.'
        ),
        (
            v_basil_device_id,
            'Basil light level looks good. Keep it near a bright window or grow light.'
        ),
        (
            v_snake_device_id,
            'Snake Plant moisture is low, but still acceptable. Avoid overwatering.'
        ),
        (
            v_snake_device_id,
            'This plant is stable in lower light, but moderate indirect light may improve growth.'
        );

    RAISE NOTICE 'Seed data created for user %', v_user_id;
END $$;