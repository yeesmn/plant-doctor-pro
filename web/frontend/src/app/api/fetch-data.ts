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

// The user's most-recently-created device, with its plant_type joined.
export async function fetchNewestDevice(): Promise<Device | null> {
  const { data, error } = await supabase
    .from("devices")
    .select("*, plant_types(*)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as Device | null) ?? null;
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
