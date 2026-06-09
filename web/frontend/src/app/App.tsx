import "../styles/fonts.css";
import { NavBar } from "./components/nav-bar";
import { HeroSection } from "./components/hero-section";
import { SensorRow } from "./components/sensor-card";
import { CareSuggestions } from "./components/care-suggestions";
import { HistoryChart } from "./components/history-chart";
import { DeviceFooter } from "./components/device-footer";
import { fetchDashboardData } from "./api/dashboard";

export default function App() {
  return (
    <div
      style={{
        background: "#F4F7F2",
        minHeight: "100vh",
        color: "#1A2E22",
        fontFamily: "'Lora', serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar />

      <main style={{ flex: 1, padding: "32px", maxWidth: "1440px", width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <HeroSection />
          <SensorRow />
          <CareSuggestions />
          <HistoryChart />
        </div>
      </main>

      <DeviceFooter />
    </div>
  );
}
