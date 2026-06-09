# Plan: Plant Doctor Pro — IoT Plant Care Dashboard

## Context
The user wants a full-page smart IoT plant dashboard with a deep forest green aesthetic (#0D1F17 base), editorial botanical science feel, live sensor readouts, care suggestions, a radar stress chart, and a historical multi-line chart. The app must feel like a precision greenhouse control panel. No make-kits are installed; Recharts is already installed for charts and Lucide React for icons (Phosphor is not available, Lucide is the fallback per project instructions).

## Implementation Plan

### Fonts
- Add Google Fonts imports to `/src/styles/fonts.css`: Playfair Display, Lora, DM Mono.

### Theme / CSS Variables
- Add custom CSS variables to `/src/styles/theme.css` for the botanical palette:
  - `--plant-bg: #0D1F17`, `--plant-card: #1A3828`, `--plant-card-2: #2D5A3D`
  - `--plant-accent: #4CAF82`, `--plant-amber: #E8A84C`, `--plant-text: #F0EDE6`, `--plant-muted: #5A7A68`, `--plant-chart-bg: #090F0C`

### Components (in `src/app/components/`)

1. **`nav-bar.tsx`** — Top nav with leaf+circuit SVG logo, "Plant Doctor Pro" serif wordmark, center nav links (Dashboard / History / Devices / Suggestions), right: pulsing "Arduino Connected" pill + avatar circle.

2. **`hero-section.tsx`** — Full-width card with:
   - "Monstera Deliciosa" in Playfair Display XL
   - Animated SVG health ring (82/100) drawn with `stroke-dasharray` animation on mount
   - "Thriving" status badge in glowing green
   - Subtext in DM Mono: "Last updated 2 min ago · Sensor Node 01"
   - Faint blob shapes as background depth

3. **`sensor-card.tsx`** — Reusable card with icon, label, large monospaced value, and a Recharts `ResponsiveContainer > LineChart` sparkline. Four instances: Soil Moisture (62%), Light (3,400 lux), Temperature (22.4°C), Tilt (4.2°).

4. **`care-suggestions.tsx`** — Left 2/3: stacked suggestion cards (icon + title + body in Lora + confidence badge + timestamp). Right 1/3: Recharts `RadarChart` for stress factor breakdown (Moisture, Light, Temp, Tilt axes).

5. **`history-chart.tsx`** — Full-width `ComposedChart` from Recharts on `#090F0C` background, 4 colored lines (moisture=teal, light=yellow, temp=orange, tilt=purple), 7D/30D/90D toggle buttons, `ReferenceLine` annotations for watering events.

6. **`device-footer.tsx`** — Compact strip in muted mono: Arduino Uno R3, WiFi -62dBm, last sync, firmware version.

### App Assembly
- `src/app/App.tsx`: wrap everything in a `div` with `bg-[#0D1F17]` full-height scroll, render all components top to bottom. Apply `font-[Lora]` as base body font, `overflow-y-auto`.

### Mock Data
All sensor values, sparkline history, radar data, and chart history are static mock arrays defined inline or in a `src/app/data/mock-plant.ts` file — no API calls needed.

### Card Styling Pattern
- `background: #1A3828`, `border: 1px solid #2D5A3D`, `border-radius: 16px`, `padding: 24px`
- Inner glow: `box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)`
- Hover: `border-color: #4CAF82` with glow via `box-shadow: 0 0 16px rgba(76,175,130,0.2)`

## Critical Files Modified
- `/src/styles/fonts.css` — add Google Font imports
- `/src/styles/theme.css` — add botanical CSS variables
- `/src/app/App.tsx` — assemble all sections
- `/src/app/components/nav-bar.tsx` (new)
- `/src/app/components/hero-section.tsx` (new)
- `/src/app/components/sensor-card.tsx` (new)
- `/src/app/components/care-suggestions.tsx` (new)
- `/src/app/components/history-chart.tsx` (new)
- `/src/app/components/device-footer.tsx` (new)

## Verification
- Preview loads with dark green `#0D1F17` background across full viewport
- Health ring animates on page load
- All 4 sensor cards render with sparklines
- Radar chart and suggestion cards appear side by side
- History chart tab toggle (7D/30D/90D) switches visible data
- Device footer strip visible at bottom
- No white backgrounds anywhere
