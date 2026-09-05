import { supabase } from "../../supabase/supabase";

// ─── Database row types ──────────────────────────────────────────────
export type PlantType = {
  id: string;
  plant_type: string;
  min_temp: number | null;
  max_temp: number | null;
  min_humidity: number | null;
  max_humidity: number | null;
  min_light: number | null;
  max_light: number | null;
  min_moisture: number | null;
  max_moisture: number | null;
  max_abs_roll: number | null;
  max_abs_pitch: number | null;
  description: string | null;
};

export type Device = {
  id: string;
  user_id: string;
  plant_type_id: string | null;
  plant_name: string;
  created_at: string;
  plant_types: PlantType | null; // joined row
};

export type PlantReading = {
  id: string;
  device_id: string;
  moisture: number | null;
  light: number | null;
  temperature: number | null;
  humidity: number | null;
  roll: number | null;
  pitch: number | null;
  plant_status: string | null;
  recorded_at: string;
};

// ─── Queries (RLS restricts every result to the logged-in user) ──────

// Every device the logged-in user owns, with its plant_type joined.
// No user_id filter is needed: the RLS policy on `devices` already restricts
// this to auth.uid()'s own rows.
export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("*, plant_types(*)")
    .order("plant_name");

  if (error) throw error;
  return (data as Device[]) ?? [];
}

// Newest recorded_at per device, as a { deviceId: iso } map.
//
// Used for two things: showing "last seen" next to each device in the picker,
// and choosing which device to open by default. Ordering by devices.created_at
// cannot do that job — the seeded rows all share one timestamp, so the "newest"
// device was whichever Postgres happened to return first.
//
// One small query per device. Fine for a handful of plants; if this ever grows,
// replace it with a view that does the grouping in Postgres.
export async function fetchLastSeen(deviceIds: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    deviceIds.map(async (id) => {
      const { data, error } = await supabase
        .from("plant_data")
        .select("recorded_at")
        .eq("device_id", id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return [id, data?.recorded_at ?? null] as const;
    })
  );

  return Object.fromEntries(
    entries.filter((entry): entry is readonly [string, string] => entry[1] !== null)
  );
}

// All readings for a device within the last `days`, oldest-first (chart order).
export async function fetchReadings(
  deviceId: string,
  days = 90
): Promise<PlantReading[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("plant_data")
    .select("*")
    .eq("device_id", deviceId)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  if (error) throw error;
  return (data as PlantReading[]) ?? [];
}
