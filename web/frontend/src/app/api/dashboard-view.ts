import type { Device, PlantReading, PlantType } from "./fetch-data";

// ─── View-model types the components consume ─────────────────────────
export type PlantStatus = "Thriving" | "Mildly Stressed" | "Needs Attention";

export type HeroView = {
  name: string;
  species: string;
  healthScore: number;
  status: PlantStatus;
  lastUpdated: string;
  sensorNode: string;
  daysMonitored: number;
};

export type SensorView = {
  id: "moisture" | "light" | "temperature" | "tilt";
  label: string;
  value: string;
  unit: string;
  state: "healthy" | "stressed";
  sparkline: { t: number; v: number }[];
};

export type HistoryPoint = { date: string; moisture: number; temperature: number };

export type DashboardView = {
  hero: HeroView;
  sensors: SensorView[];
  history: { "7D": HistoryPoint[]; "30D": HistoryPoint[]; "90D": HistoryPoint[] };
};

// Firmware writes -1 when an environmental sensor read fails. Treat that
// (and null) as "no reading" for moisture/light/temp/humidity.
function clean(v: number | null): number | null {
  return v == null || v === -1 ? null : v;
}

function inRange(v: number | null, min: number | null, max: number | null): boolean {
  if (v == null) return true; // no data → don't flag as stressed
  if (min != null && v < min) return false;
  if (max != null && v > max) return false;
  return true;
}

// 100 when in range, scaled down by how far outside relative to the span.
function factorScore(v: number | null, min: number | null, max: number | null): number | null {
  if (v == null || (min == null && max == null)) return null;
  if (inRange(v, min, max)) return 100;
  const span = Math.abs((max ?? min!) - (min ?? max!)) || 1;
  const dist = min != null && v < min ? min - v : v - (max ?? v);
  return Math.max(0, Math.round(100 - (dist / span) * 100));
}

function statusFromScore(score: number): PlantStatus {
  if (score >= 75) return "Thriving";
  if (score >= 50) return "Mildly Stressed";
  return "Needs Attention";
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// The calendar day a reading belongs to *in the viewer's time zone*.
// Slicing the ISO string instead would group by the UTC day while shortDate()
// labels in local time, so an evening reading in KST would be filed under the
// previous day and two chart points could end up carrying the same label.
function localDayKey(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// Health score averaged over every factor we have a range for: moisture,
// temperature, humidity, light, and tilt. Factors with no reading (-1/null)
// or no configured range drop out instead of counting as zero.
function computeHealth(latest: PlantReading, pt: PlantType | null): number {
  if (!pt) return 100;
  const tilt = maxTilt(latest);
  const scores = [
    factorScore(clean(latest.moisture), pt.min_moisture, pt.max_moisture),
    factorScore(clean(latest.temperature), pt.min_temp, pt.max_temp),
    factorScore(clean(latest.humidity), pt.min_humidity, pt.max_humidity),
    factorScore(clean(latest.light), pt.min_light, pt.max_light),
    factorScore(tilt, 0, pt.max_abs_roll ?? pt.max_abs_pitch),
  ].filter((s): s is number => s != null);

  if (scores.length === 0) return 100;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function maxTilt(r: PlantReading): number | null {
  const roll = r.roll == null ? null : Math.abs(r.roll);
  const pitch = r.pitch == null ? null : Math.abs(r.pitch);
  if (roll == null && pitch == null) return null;
  return Math.max(roll ?? 0, pitch ?? 0);
}

function sparkline(readings: PlantReading[], pick: (r: PlantReading) => number | null) {
  return readings
    .slice(-14)
    .map((r, i) => ({ t: i, v: pick(r) }))
    .filter((p): p is { t: number; v: number } => p.v != null);
}

function fmt(v: number | null, suffix: string, digits = 0): string {
  if (v == null) return "—";
  return `${digits ? v.toFixed(digits) : Math.round(v).toLocaleString()}${suffix}`;
}

function buildSensors(latest: PlantReading, readings: PlantReading[], pt: PlantType | null): SensorView[] {
  const tilt = maxTilt(latest);
  const maxAbs = pt?.max_abs_roll ?? pt?.max_abs_pitch ?? null;

  return [
    {
      id: "moisture",
      label: "Soil Moisture",
      value: fmt(clean(latest.moisture), "%"),
      unit: "%",
      state: inRange(clean(latest.moisture), pt?.min_moisture ?? null, pt?.max_moisture ?? null)
        ? "healthy"
        : "stressed",
      sparkline: sparkline(readings, (r) => clean(r.moisture)),
    },
    {
      id: "light",
      label: "Light Level",
      value: fmt(clean(latest.light), " lux"),
      unit: " lux",
      state: inRange(clean(latest.light), pt?.min_light ?? null, pt?.max_light ?? null) ? "healthy" : "stressed",
      sparkline: sparkline(readings, (r) => clean(r.light)),
    },
    {
      id: "temperature",
      label: "Temperature",
      value: fmt(clean(latest.temperature), "°C", 1),
      unit: "°C",
      state: inRange(clean(latest.temperature), pt?.min_temp ?? null, pt?.max_temp ?? null) ? "healthy" : "stressed",
      sparkline: sparkline(readings, (r) => clean(r.temperature)),
    },
    {
      id: "tilt",
      label: "Tilt / Growth",
      value: fmt(tilt, "°", 1),
      unit: "°",
      state: tilt != null && maxAbs != null && tilt > maxAbs ? "stressed" : "healthy",
      sparkline: sparkline(readings, (r) => maxTilt(r)),
    },
  ];
}

// Average readings per local calendar day → one chart point per day.
function buildHistory(readings: PlantReading[]): HistoryPoint[] {
  const byDay = new Map<string, { m: number[]; t: number[]; iso: string }>();

  for (const r of readings) {
    const key = localDayKey(r.recorded_at);
    if (!byDay.has(key)) byDay.set(key, { m: [], t: [], iso: r.recorded_at });
    const bucket = byDay.get(key)!;
    const m = clean(r.moisture);
    const t = clean(r.temperature);
    if (m != null) bucket.m.push(m);
    if (t != null) bucket.t.push(t);
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, b]) => ({
      date: shortDate(b.iso),
      moisture: +avg(b.m).toFixed(1),
      temperature: +avg(b.t).toFixed(1),
    }));
}

// Slice the trailing N days from a full daily series.
function lastDays(points: HistoryPoint[], n: number): HistoryPoint[] {
  return points.slice(-n);
}

export function buildDashboardView(
  device: Device,
  readings: PlantReading[]
): DashboardView {
  const pt = device.plant_types;
  const latest = readings[readings.length - 1] ?? null;

  const healthScore = latest ? computeHealth(latest, pt) : 0;
  const daysMonitored = Math.max(
    0,
    Math.round((Date.now() - new Date(device.created_at).getTime()) / 86_400_000)
  );

  const hero: HeroView = {
    name: device.plant_name,
    species: pt?.plant_type ?? "Unknown species",
    healthScore,
    status: latest ? statusFromScore(healthScore) : "Mildly Stressed",
    lastUpdated: latest ? relativeTime(latest.recorded_at) : "no readings yet",
    sensorNode: `Device ${device.id.slice(0, 8)}`,
    daysMonitored,
  };

  const sensors = latest
    ? buildSensors(latest, readings, pt)
    : [];

  const daily = buildHistory(readings);

  return {
    hero,
    sensors,
    history: {
      "7D": lastDays(daily, 7),
      "30D": lastDays(daily, 30),
      "90D": lastDays(daily, 90),
    },
  };
}
