export const PLANT = {
  name: "Junyoung",
  species: "Monstera deliciosa",
  healthScore: 82,
  status: "Thriving" as const,
  lastUpdated: "2 min ago",
  sensorNode: "Sensor Node 01",
};

function generateSparkline(base: number, variance: number, points = 14) {
  return Array.from({ length: points }, (_, i) => ({
    t: i,
    v: +(base + (Math.sin(i * 0.7) * variance + (Math.random() - 0.5) * variance * 0.4)).toFixed(1),
  }));
}

export const SENSORS = [
  {
    id: "moisture",
    label: "Soil Moisture",
    value: "62%",
    numericValue: 62,
    unit: "%",
    state: "healthy" as const,
    sparkline: generateSparkline(62, 8),
  },
  {
    id: "light",
    label: "Light Level",
    value: "3,400 lux",
    numericValue: 3400,
    unit: "lux",
    state: "healthy" as const,
    sparkline: generateSparkline(3400, 600),
  },
  {
    id: "temperature",
    label: "Temperature",
    value: "22.4°C",
    numericValue: 22.4,
    unit: "°C",
    state: "stressed" as const,
    sparkline: generateSparkline(22.4, 2),
  },
  {
    id: "tilt",
    label: "Tilt / Growth",
    value: "4.2°",
    numericValue: 4.2,
    unit: "°",
    state: "healthy" as const,
    sparkline: generateSparkline(4.2, 0.8),
  },
];

export const SUGGESTIONS = [
  {
    id: 1,
    icon: "droplets",
    title: "Increase watering frequency",
    description:
      "Soil moisture has trended below optimal range for 3 consecutive days. Consider watering every 4 days instead of weekly.",
    confidence: "High",
    source: "AI-generated",
    timestamp: "Today, 08:14",
  },
  {
    id: 2,
    icon: "sun",
    title: "Rotate plant 90° clockwise",
    description:
      "Light distribution is uneven — eastern exposure is 40% stronger. Rotating will encourage symmetric leaf development.",
    confidence: "Medium",
    source: "AI-generated",
    timestamp: "Yesterday, 19:32",
  },
  {
    id: 3,
    icon: "thermometer",
    title: "Move away from window at night",
    description:
      "Night-time temperatures drop below 18°C near the window. Monstera prefers a stable 20–27°C range.",
    confidence: "High",
    source: "AI-generated",
    timestamp: "Jun 5, 11:07",
  },
];

export const RADAR_DATA = [
  { factor: "Moisture", value: 72, fullMark: 100 },
  { factor: "Light", value: 88, fullMark: 100 },
  { factor: "Temperature", value: 61, fullMark: 100 },
  { factor: "Tilt", value: 90, fullMark: 100 },
];

function generateHistory(days: number) {
  const now = Date.now();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * 86400000);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      moisture: +(55 + Math.sin(i * 0.4) * 15 + (Math.random() - 0.5) * 6).toFixed(1),
      light: +(3200 + Math.sin(i * 0.3 + 1) * 800 + (Math.random() - 0.5) * 300).toFixed(0),
      temperature: +(21 + Math.sin(i * 0.2) * 3 + (Math.random() - 0.5) * 1).toFixed(1),
      tilt: +(3.5 + i * 0.05 + (Math.random() - 0.5) * 0.3).toFixed(2),
      watered: i === 2 || i === 9 || i === 16 || i === 23 || i === 60 || i === 75,
    };
  });
}

export const HISTORY = {
  "7D": generateHistory(7),
  "30D": generateHistory(30),
  "90D": generateHistory(90),
};

export const DEVICE = {
  board: "Arduino Uno R4 WiFi",
  wifi: "-62 dBm",
  lastSync: "2026-06-07 · 09:41:22 UTC",
  firmware: "v2.3.1",
  uptime: "14d 6h 22m",
};
