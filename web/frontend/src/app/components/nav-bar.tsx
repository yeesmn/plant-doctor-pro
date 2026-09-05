import { signOutUser } from "../data/auth";
import { DevicePicker, isOnline, sinceLabel } from "./device-picker";
import type { Device } from "../api/fetch-data";
import type { User } from "@supabase/supabase-js";

type NavBarProps = {
  user: User | null;
  devices: Device[];
  selectedId: string | null;
  lastSeen: Record<string, string>;
  onSelectDevice: (deviceId: string) => void;
};

export function NavBar({ user, devices, selectedId, lastSeen, onSelectDevice }: NavBarProps) {
  const links = ["Dashboard", "History", "Devices", "Suggestions"];

  // Connection state of the device currently being viewed. This used to be a
  // hardcoded "Arduino Connected" pill, which claimed the board was online even
  // when it had not reported for two months.
  const selectedLastSeen = selectedId ? lastSeen[selectedId] : undefined;
  const online = isOnline(selectedLastSeen);

    async function handleLogout() {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <nav
      style={{
        background: "rgba(244,247,242,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #D8E8DC",
      }}
      className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4C10 4 5 9 5 15c0 4 2.5 7.5 6 9.5V28h2v-3.2c1 .2 2 .3 3 .3s2-.1 3-.3V28h2v-3.5c3.5-2 6-5.5 6-9.5 0-6-5-11-11-11z"
            fill="#2E7D52"
            opacity="0.9"
          />
          <path d="M16 14v8M12 18h8M10 12l4 2M22 12l-4 2" stroke="#F4F7F2" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="14" r="2" fill="#F4F7F2" />
          <path d="M8 20h2M22 20h2M16 26v2" stroke="#2E7D52" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </svg>
        <span
          style={{ fontFamily: "'Playfair Display', serif", color: "#1A2E22" }}
          className="text-lg font-semibold tracking-tight"
        >
          Plant Doctor Pro
        </span>
      </div>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8">
        {links.map((link, i) => (
          <button
            key={link}
            style={{
              fontFamily: "'DM Mono', monospace",
              color: i === 0 ? "#2E7D52" : "#6B8F76",
              fontSize: "13px",
              letterSpacing: "0.04em",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {link}
          </button>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Which plant is being viewed */}
        <DevicePicker
          devices={devices}
          selectedId={selectedId}
          lastSeen={lastSeen}
          onSelect={onSelectDevice}
        />

        {/* Connection state of that plant — derived, not decorative */}
        {devices.length > 0 && (
          <div
            style={{
              background: online ? "rgba(46,125,82,0.08)" : "rgba(107,143,118,0.08)",
              border: `1px solid ${online ? "rgba(46,125,82,0.25)" : "rgba(107,143,118,0.25)"}`,
              borderRadius: "999px",
              padding: "5px 14px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: online ? "#2E7D52" : "#A8B8AC",
                boxShadow: online ? "0 0 0 0 rgba(46,125,82,0.4)" : "none",
                animation: online ? "arduinoPulse 2s infinite" : "none",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                color: online ? "#2E7D52" : "#6B8F76",
                letterSpacing: "0.03em",
              }}
            >
              {online ? "Arduino connected" : `Last seen ${sinceLabel(selectedLastSeen)}`}
            </span>
          </div>
        )}

        <div>
          <button
            onClick={handleLogout}
            style={{
              height: "36px",
              padding: "0 16px",
              borderRadius: "999px",
              border: "1px solid #C9DDCE",
              background: "rgba(255, 255, 255, 0.78)",
              color: "#2F6F49",

              fontFamily: "'Lora', serif",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",

              display: "inline-flex",
              alignItems: "center",
              gap: "8px",

              cursor: "pointer",
              boxShadow: "0 8px 22px rgba(47, 111, 73, 0.1)",
              backdropFilter: "blur(10px)",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2F7D4F";
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.borderColor = "#2F7D4F";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 12px 28px rgba(47, 125, 79, 0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.78)";
              e.currentTarget.style.color = "#2F6F49";
              e.currentTarget.style.borderColor = "#C9DDCE";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 22px rgba(47, 111, 73, 0.1)";
            }}
          >
            <span style={{ fontSize: "13px" }}>↪</span>
            Logout
          </button>
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4A9E6A, #2E7D52)",
            border: "2px solid #D8E8DC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#fff", fontWeight: 600 }}>
            {user?.email?.substring(0, 2).toUpperCase() ?? "..."}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes arduinoPulse {
          0% { box-shadow: 0 0 0 0 rgba(46,125,82,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(46,125,82,0); }
          100% { box-shadow: 0 0 0 0 rgba(46,125,82,0); }
        }
      `}</style>
    </nav>
  );
}
