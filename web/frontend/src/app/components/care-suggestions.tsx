import { Droplets, Sun, Thermometer } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { SUGGESTIONS, RADAR_DATA } from "../data/mock-plant";

const ICON_MAP: Record<string, React.ReactNode> = {
  droplets: <Droplets size={18} />,
  sun: <Sun size={18} />,
  thermometer: <Thermometer size={18} />,
};

function SuggestionCard({ s }: { s: (typeof SUGGESTIONS)[0] }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #D8E8DC",
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "0 1px 4px rgba(46,125,82,0.05)",
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: "10px",
          background: "rgba(46,125,82,0.08)",
          border: "1px solid rgba(46,125,82,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#2E7D52",
        }}
      >
        {ICON_MAP[s.icon]}
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div style={{ fontFamily: "'Lora', serif", fontSize: "15px", color: "#1A2E22", fontWeight: 600, lineHeight: 1.3 }}>
          {s.title}
        </div>
        <div style={{ fontFamily: "'Lora', serif", fontSize: "13px", color: "#4A6855", lineHeight: 1.6 }}>
          {s.description}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              color: "#2E7D52",
              background: "rgba(46,125,82,0.08)",
              border: "1px solid rgba(46,125,82,0.18)",
              borderRadius: "999px",
              padding: "2px 8px",
              letterSpacing: "0.05em",
            }}
          >
            {s.confidence} · {s.source}
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#6B8F76" }}>
            {s.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
}

const CustomRadarLabel = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    dominantBaseline="middle"
    style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", fill: "#6B8F76", letterSpacing: "0.05em" }}
  >
    {payload?.value}
  </text>
);

export function CareSuggestions() {
  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      {/* Left: Suggestion feed */}
      <div className="flex flex-col gap-4" style={{ flex: "2" }}>
        <div className="flex items-center justify-between mb-1">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#1A2E22", fontWeight: 600 }}>
            Care Suggestions
          </h2>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6B8F76" }}>
            {SUGGESTIONS.length} recommendations
          </span>
        </div>
        {SUGGESTIONS.map((s) => (
          <SuggestionCard key={s.id} s={s} />
        ))}
      </div>

      {/* Right: Radar chart */}
      <div
        style={{
          flex: "1",
          background: "#FFFFFF",
          border: "1px solid #D8E8DC",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 1px 4px rgba(46,125,82,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          minWidth: "240px",
        }}
      >
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#1A2E22", fontWeight: 600, marginBottom: "4px" }}>
            Stress Breakdown
          </h2>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6B8F76" }}>
            Current factor health scores
          </p>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={RADAR_DATA} outerRadius={90}>
              <PolarGrid key="pg" stroke="#D8E8DC" strokeOpacity={0.9} />
              <PolarAngleAxis key="paa" dataKey="factor" tick={<CustomRadarLabel />} />
              <Radar
                key="radar"
                name="Health"
                dataKey="value"
                stroke="#2E7D52"
                fill="#2E7D52"
                fillOpacity={0.12}
                strokeWidth={1.5}
              />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #D8E8DC",
                  borderRadius: "8px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  color: "#1A2E22",
                  boxShadow: "0 2px 12px rgba(46,125,82,0.1)",
                }}
                formatter={(v: number) => [`${v}/100`, "Health"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {RADAR_DATA.map((d) => (
            <div key={d.factor} className="flex items-center justify-between">
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6B8F76" }}>
                {d.factor}
              </span>
              <div className="flex items-center gap-2">
                <div
                  style={{
                    height: "3px",
                    width: `${(d.value / 100) * 60}px`,
                    background: d.value >= 75 ? "#2E7D52" : "#B8690A",
                    borderRadius: "999px",
                  }}
                />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: d.value >= 75 ? "#2E7D52" : "#B8690A" }}>
                  {d.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
