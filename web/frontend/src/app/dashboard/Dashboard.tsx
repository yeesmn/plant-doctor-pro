import { NavBar } from "../components/nav-bar";
import { HeroSection } from "../components/hero-section";
import { SensorRow } from "../components/sensor-card";
import { CareSuggestions } from "../components/care-suggestions";
import { HistoryChart } from "../components/history-chart";
import { DeviceFooter } from "../components/device-footer";
import { getCurrentUser } from "../data/auth";
import { fetchDevices, fetchLastSeen, fetchReadings, type Device } from "../api/fetch-data";
import { buildDashboardView, type DashboardView } from "../api/dashboard-view";
import { getMockData } from "../api/mock-readings";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

// Set VITE_USE_MOCK=true in web/frontend/.env to render synthetic sensor data
// (no Supabase / login needed) — useful for checking the dashboard works.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// Remember the chosen plant per user, so a reload does not bounce back to a
// different one. Keyed by user id: switching accounts must not inherit a
// selection the new account cannot even see.
function storageKey(userId: string) {
  return `pdp.selectedDevice.${userId}`;
}

function readStoredSelection(userId: string): string | null {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch {
    return null; // private mode / storage disabled — not worth failing over
  }
}

function storeSelection(userId: string, deviceId: string) {
  try {
    localStorage.setItem(storageKey(userId), deviceId);
  } catch {
    /* ignore */
  }
}

// Which plant to open when nothing has been chosen yet: the one that reported
// most recently. devices.created_at cannot decide this — the seeded rows share
// a single timestamp, so "newest device" was really "whatever Postgres
// returned first".
function pickDefaultDevice(devices: Device[], lastSeen: Record<string, string>): string {
  const withReadings = devices
    .filter((d) => lastSeen[d.id])
    .sort((a, b) => lastSeen[b.id].localeCompare(lastSeen[a.id]));

  return withReadings[0]?.id ?? devices[0].id;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<DashboardView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── 1. Who is logged in, and which plants do they own? ───────────────
  useEffect(() => {
    let active = true;

    (async () => {
      setError(null);

      if (USE_MOCK) {
        const { device, readings } = getMockData();
        if (!active) return;
        setDevices([device]);
        setSelectedId(device.id);
        setLastSeen({ [device.id]: readings[readings.length - 1].recorded_at });
        setView(buildDashboardView(device, readings));
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (!active) return;
        setUser(currentUser);

        // RLS scopes this to the logged-in user's own devices.
        const owned = await fetchDevices();
        if (!active) return;
        setDevices(owned);

        if (owned.length === 0) {
          setLoading(false);
          return;
        }

        const seen = await fetchLastSeen(owned.map((d) => d.id));
        if (!active) return;
        setLastSeen(seen);

        const stored = currentUser ? readStoredSelection(currentUser.id) : null;
        const storedStillExists = stored && owned.some((d) => d.id === stored);

        setSelectedId(storedStillExists ? stored : pickDefaultDevice(owned, seen));
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load your devices");
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // ─── 2. Readings for whichever plant is selected ──────────────────────
  useEffect(() => {
    if (USE_MOCK || !selectedId) return;

    const device = devices.find((d) => d.id === selectedId);
    if (!device) return;

    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const readings = await fetchReadings(device.id, 90);
        if (active) setView(buildDashboardView(device, readings));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load readings");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedId, devices]);

  // Set server-side in app_metadata (not user-editable) by the demo migration.
  const isDemo = user?.app_metadata?.demo === true;

  const handleSelectDevice = useCallback(
    (deviceId: string) => {
      setSelectedId(deviceId);
      if (user) storeSelection(user.id, deviceId);
    },
    [user]
  );

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
      <NavBar
        user={user}
        devices={devices}
        selectedId={selectedId}
        lastSeen={lastSeen}
        onSelectDevice={handleSelectDevice}
        isDemo={isDemo}
      />

      <main
        style={{
          flex: 1,
          padding: "32px",
          maxWidth: "1440px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {isDemo && (
          <div
            style={{
              background: "rgba(46,125,82,0.07)",
              border: "1px solid rgba(46,125,82,0.25)",
              borderRadius: "12px",
              padding: "14px 20px",
              marginBottom: "24px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#2F6F49",
            }}
          >
            You are signed in to the read-only demo account. These plants are not
            real boards: the database generates a reading for each one every 5
            minutes, in the same format the Arduino posts.
          </div>
        )}

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

        {!loading && !error && devices.length === 0 && (
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
            No plants registered to this account yet. Add a device in Supabase
            with your user id, then point the Arduino at it.
          </div>
        )}

        {devices.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <HeroSection hero={view?.hero} loading={loading} />
          <SensorRow sensors={view?.sensors} loading={loading} />
          <CareSuggestions />
          <HistoryChart history={view?.history} loading={loading} />
        </div>
        )}
      </main>

      <DeviceFooter />
    </div>
  );
}
