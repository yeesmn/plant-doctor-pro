export function NavBar() {
  const links = ["Dashboard", "History", "Devices", "Suggestions"];

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
        {/* Arduino Connected pill */}
        <div
          style={{
            background: "rgba(46,125,82,0.08)",
            border: "1px solid rgba(46,125,82,0.25)",
            borderRadius: "999px",
            padding: "5px 12px",
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
              background: "#2E7D52",
              boxShadow: "0 0 0 0 rgba(46,125,82,0.4)",
              animation: "arduinoPulse 2s infinite",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "12px",
              color: "#2E7D52",
              letterSpacing: "0.03em",
            }}
          >
            Arduino Connected
          </span>
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
            DR
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
