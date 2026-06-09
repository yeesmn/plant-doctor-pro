## 🌿 Plant Doctor Pro — Figma Main Page Prompt

---

### **Project Overview**
Design the main landing/dashboard page for **Plant Doctor Pro**, a smart IoT plant care system that monitors soil moisture, light, temperature, and growth. The UI should feel like a fusion of **botanical science** and **modern environmental tech** — think field journal meets precision instrument.

---

### **Visual Identity & Tone**
- **Aesthetic direction**: Organic-technical — natural textures grounded by clean data UI. Not a generic "eco app." More like a scientist's greenhouse control panel with editorial polish.
- **Mood**: Calm authority. The plant is being cared for by something intelligent.
- **Theme**: **Dark green base** — deep forest tones, not bright lime. Think `#0D1F17` (near-black green) as the canvas, with accent layers of `#1A3828`, `#2D5A3D`, and glowing `#4CAF82` for active/healthy states.
- **Accent**: Warm amber `#E8A84C` for warnings/stress indicators. Soft white `#F0EDE6` (parchment) for text to avoid harsh contrast.

---

### **Typography**
- **Display / Hero**: *Playfair Display* or *Libre Baskerville* — editorial serif for the plant name and health headline. Gives a botanical journal feeling.
- **Data labels & UI**: *DM Mono* or *IBM Plex Mono* — monospaced for sensor readouts, timestamps, and values. Feels like instrumentation.
- **Body / descriptions**: *Lora* — warm, readable serif for care suggestion text.

---

### **Layout Structure (Top to Bottom)**

#### 1. **Top Navigation Bar**
- Left: Logo mark (stylized leaf + circuit trace icon) + "Plant Doctor Pro" wordmark in serif
- Center: Nav links — Dashboard / History / Devices / Suggestions
- Right: Device status pill (green pulsing dot + "Arduino Connected") + user avatar

#### 2. **Hero Section — Plant Health Status Card**
Full-width card with a **subtle leaf-vein texture overlay** on the dark green background.
- Large plant name: *"Monstera Deliciosa"* in display serif, oversized
- Below it: A **health score ring** (circular progress, e.g. 82/100) with color-coded arc (green → amber → red)
- Health label: `"Mildly Stressed"` or `"Thriving"` in a status badge
- Subtext in mono font: `Last updated 2 min ago · Sensor Node 01`
- Background: faint organic blob shapes in slightly lighter green — depth without noise

#### 3. **Sensor Readings Row — 4 Cards**
Horizontal row of 4 equal cards, each with an icon, label, current value, and a small inline sparkline trend:

| Card | Icon | Value | Trend |
|---|---|---|---|
| Soil Moisture | 💧 drop | `62%` | Sparkline |
| Light Level | ☀️ | `3,400 lux` | Sparkline |
| Temperature | 🌡️ | `22.4°C` | Sparkline |
| Tilt / Growth | 📐 | `4.2°` | Sparkline |

- Cards: `#1A3828` background, `1px` border in `#2D5A3D`, rounded corners (`16px`)
- Value text: large mono font in `#4CAF82` (healthy) or `#E8A84C` (stressed)
- Trend sparkline: thin glowing line chart, 7-day mini history

#### 4. **Care Suggestions Panel**
- Left column (2/3 width): **Suggestion feed** — vertically stacked cards, each with:
  - Icon (water drop, sun, thermometer)
  - Bold suggestion title: *"Increase watering frequency"*
  - Short explanation in body serif
  - Confidence badge: `High · AI-generated`
  - Timestamp in mono
- Right column (1/3 width): **Stress Factor Breakdown** — a radar/spider chart showing the 4 factors, color-filled based on current stress levels

#### 5. **Historical Trends Section**
- Section header: `"Environmental History"` with a 7D / 30D / 90D toggle
- Full-width multi-line chart showing all 4 sensor readings over time, each as a distinct colored line
- Annotated events: small vertical marker lines where care actions were logged (e.g. "Watered")
- Chart background: very dark, almost black — `#090F0C` — to make the glowing lines pop

#### 6. **Device Status Footer Bar**
- Compact strip: Arduino board name, WiFi signal strength, last sync time, firmware version
- Mono font, muted text color `#5A7A68`

---

### **Key Design Details**
- **Micro-interactions**: Hover on sensor cards → subtle lift + glow border. Health ring animates on load (arc draws in).
- **Spacing system**: 8px base unit. Cards use `24px` internal padding.
- **Corner radius**: `16px` cards, `8px` badges, `999px` pills
- **Shadows**: Dark inner glow on cards (not drop shadows) — `inset 0 1px 0 rgba(255,255,255,0.05)`
- **Icons**: Phosphor Icons or custom thin-line botanical icons — avoid Material/Bootstrap icons
- **No white backgrounds anywhere** — the entire UI lives in the dark green world

---

### **Figma-Specific Notes**
- Set up a **color styles library** with all named tokens (bg-primary, bg-card, accent-green, accent-amber, text-primary, text-muted, text-data)
- Use **Auto Layout** on all cards and rows for responsive resizing
- Create **components** for: SensorCard, SuggestionCard, StatusBadge, NavBar
- Use **Figma Variables** for the 7D/30D/90D toggle state
- Frame size: **1440×900** desktop primary; design a **390×844** mobile variant as a secondary frame
