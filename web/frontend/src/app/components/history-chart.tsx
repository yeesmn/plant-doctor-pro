import { useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { HistoryPoint } from "../api/dashboard-view";

type Range = "7D" | "30D" | "90D";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #D8E8DC",
        borderRadius: "10px",
        padding: "12px 16px",
        fontFamily: "'DM Mono', monospace",
        fontSize: "12px",
        color: "#1A2E22",
        boxShadow: "0 4px 20px rgba(46,125,82,0.12)",
      }}
    >
      <div style={{ color: "#6B8F76", marginBottom: "6px", fontSize: "11px" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: "2px" }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }: { payload?: { color: string; value: string }[] }) => (
  <div style={{ display: "flex", gap: "24px", justifyContent: "center", paddingTop: "12px" }}>
    {payload?.map((p) => (
      <div key={p.value} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: 20, height: 2, background: p.color, borderRadius: "999px" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6B8F76" }}>{p.value}</span>
      </div>
    ))}
  </div>
);

export function HistoryChart({
  history,
  loading,
}: {
  history?: Record<Range, HistoryPoint[]>;
  loading?: boolean;
}) {
  const [range, setRange] = useState<Range>("30D");
  const data = history?.[range] ?? [];
  // Watering events aren't recorded in the database, so there are no markers.
  const wateredPoints: string[] = [];

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #D8E8DC",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 1px 4px rgba(46,125,82,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#1A2E22", fontWeight: 600, marginBottom: "4px" }}>
            Environmental History
          </h2>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6B8F76" }}>
            Soil moisture & temperature over time · daily averages
          </p>
        </div>
        {/* Range toggle */}
        <div
          style={{
            background: "#F4F7F2",
            border: "1px solid #D8E8DC",
            borderRadius: "10px",
            padding: "4px",
            display: "flex",
            gap: "2px",
          }}
        >
          {(["7D", "30D", "90D"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                padding: "6px 14px",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                background: range === r ? "#2E7D52" : "transparent",
                color: range === r ? "#FFFFFF" : "#6B8F76",
                fontWeight: range === r ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 280 }}>
        {data.length === 0 ? (
          <div
            className="flex items-center justify-center"
            style={{
              height: "100%",
              fontFamily: "'DM Mono', monospace",
              fontSize: "12px",
              color: "#6B8F76",
            }}
          >
            {loading ? "Loading history…" : "No history for this range yet."}
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid key="grid" stroke="#EAF2ED" strokeDasharray="3 3" vertical={false} />
            <XAxis
              key="xaxis"
              dataKey="date"
              tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: "#6B8F76" }}
              tickLine={false}
              axisLine={{ stroke: "#D8E8DC" }}
              interval={range === "7D" ? 0 : range === "30D" ? 4 : 11}
            />
            <YAxis
              key="yaxis-moisture"
              yAxisId="moisture"
              tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: "#6B8F76" }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              width={32}
            />
            <YAxis
              key="yaxis-temp"
              yAxisId="temp"
              orientation="right"
              tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: "#6B8F76" }}
              tickLine={false}
              axisLine={false}
              domain={[15, 30]}
              width={32}
            />
            <Tooltip key="tooltip" content={<CustomTooltip />} />
            <Legend key="legend" content={<CustomLegend />} />

            {wateredPoints.map((date, idx) => (
              <ReferenceLine
                key={`water-${idx}`}
                x={date}
                yAxisId="moisture"
                stroke="rgba(46,125,82,0.3)"
                strokeDasharray="4 3"
                label={{ value: "💧", position: "top", style: { fontSize: "10px" } }}
              />
            ))}

            <Line
              key="line-moisture"
              yAxisId="moisture"
              type="monotone"
              dataKey="moisture"
              stroke="#2E7D52"
              strokeWidth={2}
              dot={false}
              name="Soil Moisture (%)"
              strokeOpacity={0.85}
            />
            <Line
              key="line-temp"
              yAxisId="temp"
              type="monotone"
              dataKey="temperature"
              stroke="#B8690A"
              strokeWidth={2}
              dot={false}
              name="Temperature (°C)"
              strokeOpacity={0.85}
            />
          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
