import { Droplets, Sun, Thermometer, Move } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { SENSORS } from "../data/mock-plant";

const ICON_MAP: Record<string, React.ReactNode> = {
  moisture: <Droplets size={20} />,
  light: <Sun size={20} />,
  temperature: <Thermometer size={20} />,
  tilt: <Move size={20} />,
};

function SensorCard({ sensor }: { sensor: (typeof SENSORS)[0] }) {
  const isStressed = sensor.state === "stressed";
  const valueColor = isStressed ? "#B8690A" : "#2E7D52";
  const borderHover = isStressed ? "#B8690A" : "#2E7D52";
  const shadowHover = isStressed ? "rgba(184,105,10,0.12)" : "rgba(46,125,82,0.12)";

  return (
    <div
      className="flex flex-col gap-4 flex-1 transition-all duration-200 cursor-default"
      style={{
        background: "#FFFFFF",
        border: "1px solid #D8E8DC",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 1px 4px rgba(46,125,82,0.05)",
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = borderHover;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${shadowHover}`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#D8E8DC";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(46,125,82,0.05)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div style={{ color: "#6B8F76" }}>{ICON_MAP[sensor.id]}</div>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            color: isStressed ? "#B8690A" : "#2E7D52",
            background: isStressed ? "rgba(184,105,10,0.08)" : "rgba(46,125,82,0.08)",
            border: `1px solid ${isStressed ? "rgba(184,105,10,0.2)" : "rgba(46,125,82,0.2)"}`,
            borderRadius: "999px",
            padding: "2px 8px",
            letterSpacing: "0.06em",
          }}
        >
          {isStressed ? "STRESSED" : "OPTIMAL"}
        </span>
      </div>

      {/* Label + Value */}
      <div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "#6B8F76",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          {sensor.label}
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "32px",
            color: valueColor,
            lineHeight: 1,
            fontWeight: 400,
          }}
        >
          {sensor.value}
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ height: 48 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sensor.sparkline}>
            <Line type="monotone" dataKey="v" stroke={valueColor} strokeWidth={1.5} dot={false} strokeOpacity={0.7} />
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
              formatter={(v: number) => [`${v}${sensor.unit}`, sensor.label]}
              labelFormatter={() => ""}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#6B8F76" }}>7-day trend</div>
    </div>
  );
}

export function SensorRow() {
  return (
    <div className="flex gap-4 flex-wrap md:flex-nowrap">
      {SENSORS.map((s) => (
        <SensorCard key={s.id} sensor={s} />
      ))}
    </div>
  );
}
