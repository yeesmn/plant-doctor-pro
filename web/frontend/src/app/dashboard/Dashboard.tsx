import { NavBar } from "../components/nav-bar";
import { HeroSection } from "../components/hero-section";
import { SensorRow } from "../components/sensor-card";
import { CareSuggestions } from "../components/care-suggestions";
import { HistoryChart } from "../components/history-chart";
import { DeviceFooter } from "../components/device-footer";
import { getCurrentUser } from "../data/auth";
import { fetchNewestDevice, fetchReadings } from "../api/fetch-data";
import { buildDashboardView, type DashboardView } from "../api/dashboard-view";
import { getMockData } from "../api/mock-readings";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

// Set VITE_USE_MOCK=true in web/frontend/.env to render synthetic sensor data
// (no Supabase / login needed) — useful for checking the dashboard works.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<DashboardView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCK) return;
    getCurrentUser().then(setUser).catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);

      // Local mock mode — skip Supabase entirely
      if (USE_MOCK) {
        const { device, readings } = getMockData();
        if (active) {
          setView(buildDashboardView(device, readings));
          setLoading(false);
        }
        return;
      }

      try {
        const device = await fetchNewestDevice();
        if (!device) {
          if (active) setView(null);
          return;
        }
        const readings = await fetchReadings(device.id, 90);
        if (active) setView(buildDashboardView(device, readings));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      style={{
        background: "#F4F7F2",
        minHeight: "100vh",
        color: "#1A2E22",
        fontFamily: "'Lora', serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <NavBar user={user} />

      <main
        style={{
          flex: 1,
          padding: "32px",
          maxWidth: "1440px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {error && (
          <div
            style={{
              background: "rgba(192,68,42,0.08)",
              border: "1px solid rgba(192,68,42,0.3)",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "13px",
              color: "#7A2010",
            }}
          >
            Could not load live data: {error}
          </div>
        )}

        {!loading && !error && !view && (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #D8E8DC",
              borderRadius: "16px",
              padding: "48px",
              textAlign: "center",
              fontFamily: "'DM Mono', monospace",
              fontSize: "14px",
              color: "#6B8F76",
            }}
          >
            No device found for your account yet. Add a device and wait for its
            first sensor reading.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <HeroSection hero={view?.hero} loading={loading} />
          <SensorRow sensors={view?.sensors} loading={loading} />
          <CareSuggestions />
          <HistoryChart history={view?.history} loading={loading} />
        </div>
      </main>

      <DeviceFooter />
    </div>
  );
}
