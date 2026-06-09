import { useEffect, useState } from "react";
import { PLANT } from "../data/mock-plant";
import { fetchDashboardData } from "../api/dashboard";

const STATUS_CONFIG: Record<string, { color: string; border: string; bg: string; text: string }> = {
  Thriving: { color: "#2E7D52", border: "rgba(46,125,82,0.3)", bg: "rgba(46,125,82,0.08)", text: "#1A5C36" },
  "Mildly Stressed": { color: "#B8690A", border: "rgba(184,105,10,0.3)", bg: "rgba(184,105,10,0.08)", text: "#7A4500" },
  "Needs Attention": { color: "#C0442A", border: "rgba(192,68,42,0.3)", bg: "rgba(192,68,42,0.08)", text: "#7A2010" },
};

function HealthRing({ score }: { score: number }) {
  const [progress, setProgress] = useState(0);
  const radius = 72;
  const stroke = 8;
  const circ = 2 * Math.PI * radius;

  useEffect(() => {
    const id = setTimeout(() => setProgress(score), 200);
    return () => clearTimeout(id);
  }, [score]);

  const offset = circ - (progress / 100) * circ;
  const color = score >= 75 ? "#2E7D52" : score >= 50 ? "#B8690A" : "#C0442A";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 176, height: 176 }}>
      <svg width="176" height="176" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="88" cy="88" r={radius} fill="none" stroke="#E0EDE5" strokeWidth={stroke} />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1), stroke 0.5s" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "38px",
            color: color,
            lineHeight: 1,
            fontWeight: 700,
            transition: "color 0.5s",
          }}
        >
          {score}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6B8F76", letterSpacing: "0.08em" }}>
          / 100
        </span>
      </div>
    </div>
  );
}

export function HeroSection() {
  const cfg = STATUS_CONFIG[PLANT.status] ?? STATUS_CONFIG["Thriving"];
  const [data, setData] = useState(null);

  useEffect(() => {
    // function onFetchData(jsonData: unknown) {
    //   console.log(jsonData);
    // }
    // function onError(error: Error) {
    //   alert(error.message);
    // }
    // fetchDashboardData().then(onFetchData).catch(onError);
    (async () => {
      try {
        const {data: fetchedData} = await fetchDashboardData();
        console.log(fetchedData);
        setData(fetchedData);
      } catch (error: unknown) {
        alert(error instanceof Error ? error.message : error);
      }
    })();
  }, []);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #EDFAF2 0%, #F4F7F2 60%, #EFF5EE 100%)",
        border: "1px solid #D8E8DC",
        borderRadius: "16px",
        padding: "48px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(46,125,82,0.06), 0 4px 24px rgba(46,125,82,0.04)",
      }}
    >
      {/* Soft blob shapes */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.12, pointerEvents: "none" }}
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <ellipse cx="680" cy="80" rx="220" ry="180" fill="#4CAF82" />
        <ellipse cx="100" cy="320" rx="180" ry="140" fill="#A8D8B8" />
      </svg>

      {/* Leaf vein texture */}
      <svg
        style={{ position: "absolute", top: 0, right: 0, width: "380px", height: "380px", opacity: 0.08, pointerEvents: "none" }}
        viewBox="0 0 200 200"
      >
        <path d="M100 10 Q170 50 160 100 Q150 150 100 190 Q50 150 40 100 Q30 50 100 10Z" stroke="#2E7D52" strokeWidth="0.5" fill="none" />
        <path d="M100 10 L100 190" stroke="#2E7D52" strokeWidth="0.5" />
        <path d="M100 50 Q140 60 160 80" stroke="#2E7D52" strokeWidth="0.3" fill="none" />
        <path d="M100 70 Q130 80 150 100" stroke="#2E7D52" strokeWidth="0.3" fill="none" />
        <path d="M100 90 Q125 100 140 120" stroke="#2E7D52" strokeWidth="0.3" fill="none" />
        <path d="M100 50 Q60 60 40 80" stroke="#2E7D52" strokeWidth="0.3" fill="none" />
        <path d="M100 70 Q70 80 50 100" stroke="#2E7D52" strokeWidth="0.3" fill="none" />
        <path d="M100 90 Q75 100 60 120" stroke="#2E7D52" strokeWidth="0.3" fill="none" />
      </svg>

      <div className="relative flex flex-col md:flex-row items-center gap-10">
        <div className="flex-shrink-0">
          <HealthRing score={PLANT.healthScore} />
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6B8F76", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Primary Specimen
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(32px, 5vw, 56px)",
              color: "#1A2E22",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            {/* {PLANT.name} */}
            {/* TODO: 이름을 여기에 */}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: "8px",
                padding: "4px 12px",
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                color: cfg.text,
                letterSpacing: "0.05em",
              }}
            >
              {PLANT.status}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#6B8F76" }}>
              Health Score: {PLANT.healthScore}/100
            </span>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#6B8F76", marginTop: "4px", letterSpacing: "0.03em" }}>
            Last updated {PLANT.lastUpdated} · {PLANT.sensorNode}
          </div>
        </div>

        {/* Mini stats */}
        <div
          className="flex flex-col gap-4 flex-shrink-0"
          style={{
            background: "#FFFFFF",
            border: "1px solid #D8E8DC",
            borderRadius: "12px",
            padding: "20px 24px",
            minWidth: "160px",
            boxShadow: "0 1px 4px rgba(46,125,82,0.06)",
          }}
        >
          {[
            { label: "Days monitored", value: "47" },
            { label: "Watering events", value: "12" },
            { label: "Alerts this week", value: "3" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#6B8F76", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {item.label}
              </span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: "#2E7D52", lineHeight: 1, fontWeight: 600 }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
