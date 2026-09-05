import { useEffect, useRef, useState } from "react";
import type { Device } from "../api/fetch-data";

// Relative time for the "last seen" line. Deliberately coarse: the point is
// "is this plant reporting or not", not the exact minute.
function sinceLabel(iso: string | undefined): string {
  if (!iso) return "no readings yet";

  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  return `${Math.round(hours / 24)} d ago`;
}

// A device counts as connected if it reported within the last 15 minutes —
// three missed cycles at the firmware's 5-minute interval.
export function isOnline(iso: string | undefined): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 15 * 60 * 1000;
}

type Props = {
  devices: Device[];
  selectedId: string | null;
  lastSeen: Record<string, string>;
  onSelect: (deviceId: string) => void;
};

export function DevicePicker({ devices, selectedId, lastSeen, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape — a dropdown that traps the page is
  // worse than no dropdown.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (devices.length === 0) return null;

  const selected = devices.find((d) => d.id === selectedId) ?? devices[0];

  // One plant: a label, not a menu. Nothing to choose between.
  if (devices.length === 1) {
    return (
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "13px",
          color: "#2E7D52",
          letterSpacing: "0.03em",
        }}
      >
        {selected.plant_name}
      </span>
    );
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          height: "36px",
          padding: "0 14px",
          borderRadius: "999px",
          border: "1px solid #C9DDCE",
          background: "rgba(255,255,255,0.78)",
          color: "#2F6F49",
          fontFamily: "'DM Mono', monospace",
          fontSize: "13px",
          letterSpacing: "0.03em",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isOnline(lastSeen[selected.id]) ? "#2E7D52" : "#A8B8AC",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        {selected.plant_name}
        <span style={{ fontSize: "10px", opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "44px",
            left: 0,
            minWidth: "260px",
            background: "#FFFFFF",
            border: "1px solid #D8E8DC",
            borderRadius: "12px",
            boxShadow: "0 12px 28px rgba(47,111,73,0.14)",
            padding: "6px",
            margin: 0,
            listStyle: "none",
            zIndex: 60,
          }}
        >
          {devices.map((device) => {
            const active = device.id === selected.id;
            return (
              <li key={device.id}>
                <button
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onSelect(device.id);
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: active ? "rgba(46,125,82,0.08)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: isOnline(lastSeen[device.id]) ? "#2E7D52" : "#A8B8AC",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span
                      style={{
                        fontFamily: "'Lora', serif",
                        fontSize: "14px",
                        color: "#1A2E22",
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {device.plant_name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "11px",
                        color: "#6B8F76",
                      }}
                    >
                      {device.plant_types?.plant_type ?? "Unknown species"} ·{" "}
                      {sinceLabel(lastSeen[device.id])}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export { sinceLabel };
