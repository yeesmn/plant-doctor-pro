import { Wifi, Cpu, Clock, GitBranch, Activity } from "lucide-react";
import { DEVICE } from "../data/mock-plant";

export function DeviceFooter() {
  return (
    <div
      style={{
        background: "#EDFAF2",
        borderTop: "1px solid #D8E8DC",
        padding: "14px 32px",
        display: "flex",
        alignItems: "center",
        gap: "32px",
        flexWrap: "wrap",
      }}
    >
      {[
        { icon: <Cpu size={13} />, label: "Board", value: DEVICE.board },
        { icon: <Wifi size={13} />, label: "Signal", value: DEVICE.wifi },
        { icon: <Clock size={13} />, label: "Last Sync", value: DEVICE.lastSync },
        { icon: <GitBranch size={13} />, label: "Firmware", value: DEVICE.firmware },
        { icon: <Activity size={13} />, label: "Uptime", value: DEVICE.uptime },
      ].map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#6B8F76" }}>{item.icon}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6B8F76", letterSpacing: "0.04em" }}>
            {item.label}:
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#2E7D52", letterSpacing: "0.02em" }}>
            {item.value}
          </span>
        </div>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2E7D52", display: "inline-block" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#6B8F76" }}>
          All systems nominal
        </span>
      </div>
    </div>
  );
}
