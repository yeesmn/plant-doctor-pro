import type { Device, PlantReading, PlantType } from "./fetch-data";

// --------------------
// Local test data. Enabled by setting VITE_USE_MOCK=true in web/frontend/.env
// (see Dashboard.tsx). It feeds synthetic readings through the SAME
// buildDashboardView() transform + components as real Supabase data, so it
// verifies the whole frontend pipeline without needing a DB or login.
//
// It deliberately includes:
//   - 90 days of readings (4/day) so 7D/30D/90D charts all have data
//   - a slightly-too-hot LATEST temperature (31°C > max 30) so you can see a
//     "STRESSED" sensor card and a health score below 100
//   - an occasional light = -1 (failed read) to confirm the sentinel is hidden
// --------------------

const MOCK_PLANT_TYPE: PlantType = {
  id: "mock-type-monstera",
  plant_type: "Monstera deliciosa",
  min_temp: 18,
  max_temp: 30,
  min_humidity: 40,
  max_humidity: 70,
  min_light: 1000,
  max_light: 10000,
  min_moisture: 40,
  max_moisture: 70,
  max_abs_roll: 15,
  max_abs_pitch: 15,
  description: "Mock plant type for local UI testing.",
};

export function getMockData(): { device: Device; readings: PlantReading[] } {
  const deviceId = "mock-device-0001";

  const device: Device = {
    id: deviceId,
    user_id: "mock-user",
    plant_type_id: MOCK_PLANT_TYPE.id,
    plant_name: "Test Monstera",
    created_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
    plant_types: MOCK_PLANT_TYPE,
  };

  const readings: PlantReading[] = [];
  const total = 90 * 4; // 4 readings/day for 90 days

  for (let i = 0; i < total; i++) {
    const ageDays = (total - 1 - i) / 4;
    const ts = new Date(Date.now() - ageDays * 86_400_000).toISOString();
    const isLatest = i === total - 1;

    const moisture = +(58 + Math.sin(i * 0.15) * 8).toFixed(1);
    const light = i % 37 === 0 ? -1 : Math.round(3800 + Math.sin(i * 0.1) * 1200);
    const temperature = isLatest ? 31 : +(23 + Math.sin(i * 0.08) * 3).toFixed(1);
    const humidity = +(54 + Math.sin(i * 0.2) * 6).toFixed(1);
    const roll = +(2.5 + Math.sin(i * 0.3) * 1.5).toFixed(1);
    const pitch = +(-1.5 + Math.sin(i * 0.25) * 1.2).toFixed(1);

    readings.push({
      id: `mock-${i}`,
      device_id: deviceId,
      moisture,
      light,
      temperature,
      humidity,
      roll,
      pitch,
      plant_status: temperature > 30 ? "too hot" : "healthy",
      recorded_at: ts,
    });
  }

  return { device, readings };
}
