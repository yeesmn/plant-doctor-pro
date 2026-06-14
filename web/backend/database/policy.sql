-- =========================================================
-- policy.sql
-- Plant Doctor Pro Supabase Auth + RLS Policies
-- Run after schema.sql
-- =========================================================


-- =========================================================
-- 1. Automatically create a profile when a user signs up
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- =========================================================
-- 2. Enable Row Level Security
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_suggestions ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- 3. Profiles policies
-- Users can only read/update their own profile
-- =========================================================

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;

CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() IS NOT NULL
    AND id = auth.uid()
);


DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    auth.uid() IS NOT NULL
    AND id = auth.uid()
)
WITH CHECK (
    auth.uid() IS NOT NULL
    AND id = auth.uid()
);


-- =========================================================
-- 4. Plant type policies
-- Plant types are shared reference data
-- =========================================================

DROP POLICY IF EXISTS "Authenticated users can read plant types" ON public.plant_types;

CREATE POLICY "Authenticated users can read plant types"
ON public.plant_types
FOR SELECT
TO authenticated
USING (true);


-- =========================================================
-- 5. Device policies
-- Users can only access their own devices
-- =========================================================

DROP POLICY IF EXISTS "Users can read their own devices" ON public.devices;

CREATE POLICY "Users can read their own devices"
ON public.devices
FOR SELECT
TO authenticated
USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
);


DROP POLICY IF EXISTS "Users can create their own devices" ON public.devices;

CREATE POLICY "Users can create their own devices"
ON public.devices
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
);


DROP POLICY IF EXISTS "Users can update their own devices" ON public.devices;

CREATE POLICY "Users can update their own devices"
ON public.devices
FOR UPDATE
TO authenticated
USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
)
WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
);


DROP POLICY IF EXISTS "Users can delete their own devices" ON public.devices;

CREATE POLICY "Users can delete their own devices"
ON public.devices
FOR DELETE
TO authenticated
USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
);


-- =========================================================
-- 6. Plant data policies
-- Users can access plant_data only through their own devices
-- =========================================================

DROP POLICY IF EXISTS "Users can read plant data from their own devices" ON public.plant_data;

CREATE POLICY "Users can read plant data from their own devices"
ON public.plant_data
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.devices d
        WHERE d.id = plant_data.device_id
        AND d.user_id = auth.uid()
    )
);


-- Optional for dashboard testing.
-- Later, Arduino should insert through backend/Edge Function instead.
DROP POLICY IF EXISTS "Users can insert plant data for their own devices" ON public.plant_data;

CREATE POLICY "Users can insert plant data for their own devices"
ON public.plant_data
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.devices d
        WHERE d.id = plant_data.device_id
        AND d.user_id = auth.uid()
    )
);


-- Optional: allow users to delete their own plant_data during testing.
-- You can remove this later if only backend should manage sensor records.
DROP POLICY IF EXISTS "Users can delete plant data from their own devices" ON public.plant_data;

CREATE POLICY "Users can delete plant data from their own devices"
ON public.plant_data
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.devices d
        WHERE d.id = plant_data.device_id
        AND d.user_id = auth.uid()
    )
);


-- =========================================================
-- 7. Care suggestion policies
-- Users can read suggestions only for their own devices
-- =========================================================

DROP POLICY IF EXISTS "Users can read suggestions for their own devices" ON public.care_suggestions;

CREATE POLICY "Users can read suggestions for their own devices"
ON public.care_suggestions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.devices d
        WHERE d.id = care_suggestions.device_id
        AND d.user_id = auth.uid()
    )
);


-- Optional for dashboard/backend testing.
-- Later, care suggestions should probably be generated by backend logic.
DROP POLICY IF EXISTS "Users can insert suggestions for their own devices" ON public.care_suggestions;

CREATE POLICY "Users can insert suggestions for their own devices"
ON public.care_suggestions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.devices d
        WHERE d.id = care_suggestions.device_id
        AND d.user_id = auth.uid()
    )
);