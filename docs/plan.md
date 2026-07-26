# Implementation Plan: Plant Doctor Pro

This document maps out the roadmap for fully integrating the Arduino hardware layer, the Supabase PostgreSQL database, the Node.js/Express API gateway, and the React front-end dashboard.

---

## Roadmap Overview

```mermaid
graph TD
    A[Arduino Sensors] -->|HTTP POST| B[Express API Gateway]
    B -->|Insert Data| C[(Supabase DB)]
    C -->|Fetch API| B
    B -->|JSON Response| D[React Frontend Dashboard]
```

---

## Current Status (2026-07-25)

Phases 1–4 are **done**. The full path *Arduino → Express → Supabase* was verified over
the LAN on **2026-07-09** (see [test-lan-2026-07-01.md](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/docs/test-lan-2026-07-01.md)):
readings landed in `plant_data` every 5 minutes (10 samples × 30 s, averaged), and the
dashboard runs on live data (`VITE_USE_MOCK=false`).

That single session is **all the data there is** — the device has not been powered since,
so the newest reading is from 2026-07-09. Nothing is broken; the soak test (5.4) simply
has not started.

What remains is **Phase 5** below — data-quality and reliability problems that the
happy-path test did not cover.

> ⚠ **5.1 is written but unproven on hardware** — the moisture-to-percent firmware has
> not been compiled or uploaded, and its calibration constants are still placeholders. The
> checklist is in
> [worklog-2026-07-25.md](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/docs/worklog-2026-07-25.md).
> 5.2 is done.

---

## Step-by-Step Execution Plan

### Phase 1: Database Provisioning (Supabase)
Prepare the database tables and reference nodes for the devices.
1.  Log in to your **Supabase Dashboard** and create a new project.
2.  Navigate to the **SQL Editor** tab.
3.  Execute the script in [schema.sql](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/database/schema.sql) to generate the tables (`devices`, `plant_data`, `care_suggestions`).
4.  Execute the seed script in [mock_data.sql](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/database/mock_data.sql) to set up test devices and preliminary entries.
5.  Retrieve your **Supabase API URL** and **Service Role API Key** from the project settings.

### Phase 2: Express Backend Environment Configuration
Configure and start the middleware API.
1.  Navigate to [web/backend](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend).
2.  Create a `.env` file containing:
    ```env
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_OR_ANON_KEY
    ```
3.  Open a terminal inside [web/backend](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend) and run:
    ```bash
    npm install
    npm run server
    ```
4.  Verify that the server launches successfully on `http://localhost:3000` and displays:
    `Server running on http://localhost:3000`
5.  *(Optional)* Test the REST endpoint using curl, Postman, or a browser:
    `GET http://localhost:3000/api/sensor-data`

### Phase 3: Firmware & Arduino Sensor Integration
Complete the micro-controller logic to connect to WiFi and transmit actual metrics.
1.  Open the [arduino](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino) folder.
2.  Configure your local wireless SSID credentials in [wifi_post.ino](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino/plant_doctor_pro/wifi_post.ino).
3.  Complete [plant_doctor_pro.ino](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino/plant_doctor_pro/plant_doctor_pro.ino):
    *   Integrate library inclusions for your sensors (e.g. DHT11 temperature/humidity, soil moisture pin reads, light sensor, tilt switch).
    *   In `setup()`, call the WiFi initialization routine.
    *   In `loop()`, poll sensor values every $N$ seconds.
    *   Formulate a JSON string matching the expected backend input format:
        ```json
        {
          "device_id": "YOUR_DEVICE_UUID_FROM_SUPABASE",
          "moisture": 62.0,
          "light": 3400.0,
          "temperature": 22.4,
          "plant_status": "Thriving"
        }
        ```
    *   Execute an HTTP `POST` request to `http://<YOUR_BACKEND_IP>:3000/api/sensor-data` to submit the payload.

### Phase 4: Frontend Live Integration
Shift the dashboard from static mock data to dynamically fetching database logs.
1.  Update the fetch client configuration in [fetch-data.ts](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/frontend/src/app/api/fetch-data.ts):
    *   Dynamically load the `device_id` relative to the selected plant/device.
2.  Update the components to ingest dynamic state instead of loading static mock data from [mock-plant.ts](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/frontend/src/app/data/mock-plant.ts):
    *   Implement loading states and try/catch blocks for error boundaries.
    *   Configure dynamic ranges (7D/30D/90D) to request corresponding historical date-truncations from the backend.
3.  Integrate the visual dark botanical theme. In [App.tsx](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/frontend/src/app/App.tsx), change:
    *   `background: "#F4F7F2"` $\rightarrow$ `background: "var(--plant-bg)"` (`#0D1F17`)
    *   `color: "#1A2E22"` $\rightarrow$ `color: "var(--plant-text)"` (`#F0EDE6`)
    *   Update card backgrounds from `#FFFFFF` to `var(--plant-card)` (`#1A3828`) and borders to `var(--plant-border)` (`#2D5A3D`) to fulfill the forest green theme guidelines.
4.  Navigate to [web/frontend](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/frontend) and run:
    ```bash
    npm install
    npm run dev
    ```
5.  View the live dashboard at the URL provided by Vite.

---

## Phase 5: Open Issues (current work)

Problems found after live data started flowing, ordered by priority — quick wins first
within each tier.

| # | Issue | Priority |
|---|---|---|
| [5.1](#51--soil-moisture-is-uncalibrated-blocks-health-scoring--p1-code-done--needs-measuring) | Soil moisture is uncalibrated | P1 — code done, needs measuring |
| [5.2](#52--recorded_at-has-no-time-zone--p1-done-migration-run-2026-07-25) | `recorded_at` has no time zone | ✅ done |
| [5.3](#53--service_role-key-sits-in-the-frontend-env--done-2026-07-25) | `service_role` key sits in the frontend `.env` | ✅ done |
| [5.4](#54--no-long-run-reliability-data--p2-scheduled) | No long-run reliability data | P2 — scheduled with the hardware team |
| [5.5](#55--device-identity--pairing--p2) | Device identity & pairing | P2 |
| [5.6](#56--dashboard-sections-still-on-mock-data--p3) | Dashboard sections still on mock data | P3 |
| [5.7](#57--the-pipeline-depends-on-the-pc-being-awake--p3) | The pipeline depends on the PC being awake | P3 |

### 5.1 — Soil moisture is uncalibrated (blocks health scoring) — **P1, code done / needs measuring**

The firmware sent **raw analog** values (0-1023) while `plant_types.min_moisture` /
`max_moisture` and the UI both assume **percent**, so moisture was worked around in
three places instead of being used.

**Code changes (done):** the conversion lives in the firmware — `plant_data.moisture`
now only ever receives percent.

| File | Change |
|---|---|
| [config.h](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino/plant_doctor_pro/config.h) / [config.example.h](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino/plant_doctor_pro/config.example.h) | new `MOISTURE_RAW_DRY` / `MOISTURE_RAW_WET` calibration points |
| [sensor.ino](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino/plant_doctor_pro/sensor.ino) | `moistureToPercent()` — linear map, clamped to 0-100, `-1` passes through; `#error` if DRY <= WET |
| [datafiltering.ino](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino/plant_doctor_pro/datafiltering.ino) | averages raw, then converts once → `filtered_moisture_pct` |
| [plant_status.ino](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino/plant_doctor_pro/plant_status.ino) | thresholds are now `MOISTURE_PCT_DRY 30` / `MOISTURE_PCT_WET 80`, with a `-1` guard |
| [wifi_post.ino](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino/plant_doctor_pro/wifi_post.ino) | POSTs `filtered_moisture_pct` |
| [dashboard-view.ts](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/frontend/src/app/api/dashboard-view.ts) | moisture is back in `computeHealth()`; card renders `%` via `inRange()` |

`plant_types.min_moisture` / `max_moisture` needed no change — all eight seeded species
in [mock_data.sql](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/database/mock_data.sql)
were already in percent.

**Remaining (hardware in the loop):**
1.  Read the two reference values off the Serial Monitor (`moisture(raw)=` line):
    probe **dry in open air**, then **submerged to the marked line**.
2.  Put them in `config.h` as `MOISTURE_RAW_DRY` / `MOISTURE_RAW_WET` and re-upload.
    The committed defaults (620 / 300) are typical capacitive values, not measured ones.
3.  Confirm the Serial Monitor prints a sane `Moisture: xx % (raw yyy)` and that a
    watered pot moves the number the right way.
4.  Deal with the raw rows from the 2026-07-09 LAN test — see
    [migrations/2026-07-25_moisture_to_percent.sql](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/database/migrations/2026-07-25_moisture_to_percent.sql).
    **The script is scoped to one `device_id` on purpose:** the demo rows seeded by
    `mock_data.sql` are already in percent (62.0, 52.0, …), and a blanket "convert
    everything before date X" would push them through the formula a second time and clamp
    them to 100. Deleting the test rows is the cleaner option here — they predate the
    calibration, so converting them is guesswork over data nobody needs.
5.  Re-check `MOISTURE_PCT_DRY` / `MOISTURE_PCT_WET` against how the plant actually
    behaves; 30/80 is a starting guess.

> The firmware was never compiled here (no `arduino-cli` on this machine) — verify it
> builds in the Arduino IDE before trusting the upload.

### 5.2 — `recorded_at` has no time zone — **P1, DONE (migration run 2026-07-25)**

[schema.sql](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/database/schema.sql)
declared `recorded_at TIMESTAMP DEFAULT NOW()` — *without* time zone. Postgres stores
UTC, PostgREST returned it with no offset (`2026-07-25T01:00:00`), and JavaScript's
`new Date()` parses an offset-less ISO string as **local time**. In KST that shifted every
reading by 9 hours: "last updated 9 hr ago" for a row that had just landed, and
`fetchReadings()`'s `.gte("recorded_at", since)` window off by the same amount.

**Code changes (done):**

| File | Change |
|---|---|
| [schema.sql](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/database/schema.sql) | all five `TIMESTAMP DEFAULT NOW()` columns are now `TIMESTAMPTZ` |
| [migrations/2026-07-25_timestamptz.sql](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/database/migrations/2026-07-25_timestamptz.sql) | converts the existing columns, reinterpreting stored values as UTC |
| [dashboard-view.ts](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/frontend/src/app/api/dashboard-view.ts) | `buildHistory()` groups by `localDayKey()` instead of slicing the ISO string |

That last one is a second, independent bug: the chart bucketed by the **UTC** day while
`shortDate()` labelled in **local** time, so an evening KST reading was filed under the
previous day and two points could carry the same label. Bucketing now matches labelling.

Once the column carries an offset, no client-side date maths is needed — `new Date()`
parses it correctly on its own.

**Done:** the migration ran on 2026-07-25 — `plant_data.recorded_at` now returns with a
`+00` offset. Worth one more look at the dashboard the next time the device is sending, to
confirm "last updated" tracks minutes rather than hours.

### 5.3 — `service_role` key sits in the frontend `.env` — **DONE 2026-07-25**

`web/frontend/.env` carried `SUPABASE_KEY` (the **service role** secret) alongside the
`VITE_*` values. Vite only bundles `VITE_`-prefixed variables, so it never reached the
browser — but a secret with no reason to be in a client project is one rename away from
shipping.

**Done:**
- Removed `SUPABASE_URL` / `SUPABASE_KEY` from `web/frontend/.env`; it now holds only
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_USE_MOCK`. The backend
  copy in `web/backend/.env` is untouched and is the only place the secret lives.
- Added committed `.env.example` templates for
  [frontend](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/frontend/.env.example)
  and [backend](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/.env.example),
  each stating which side the key belongs on.
- Verified: `git log --all -- "*.env"` is empty, so **no `.env` was ever committed** and the
  key was never exposed through the repository — no rotation needed. The rebuilt bundle
  contains the publishable key and zero occurrences of the service-role JWT.

### 5.4 — No long-run reliability data — **P2, scheduled**

Planned as a 24 h run with the hardware team. A few successful cycles is not the same as
a stable pipeline — count rows against the expected rate. Run a **24–48 h soak test**
and count rows: 5-minute intervals should produce **288 rows/day** per device. The gap
between that and reality is the drop rate.

Things to verify while it runs:
- WiFi reconnect actually recovers (the `WiFi.status()` check in `loop()`).
- What the sketch does when the backend is **down** or returns 5xx — currently the
  averaged sample is simply lost, with no retry or buffering.
- PC sleep / reboot: the Express server stops, and so does the whole pipeline (see 5.7).
- Sensor failures over time — `-1` sentinels appearing in `plant_data`.

### 5.5 — Device identity & pairing — **P2 (unblocks 5.6 and 5.7)**

#### How a plant is picked today

```
login → auth.uid() → devices (filtered by RLS) → newest row → plant_data (by device_id)
```

[fetch-data.ts](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/frontend/src/app/api/fetch-data.ts)
`fetchNewestDevice()` carries **no `user_id` filter** — it just takes the newest row by
`created_at`. Other users' plants stay hidden only because the RLS policy in
[policy.sql](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/database/policy.sql)
(`devices.user_id = auth.uid()`) filters them server-side. The same holds for
`plant_data`. That works, but it means the *client* has no notion of ownership.

#### The gap

The only thing tying a physical board to a `devices` row is the **`DEVICE_ID` UUID
hand-copied into `config.h`**, sent on every POST
([wifi_post.ino](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/arduino/plant_doctor_pro/wifi_post.ino)).
The database stores no hardware identity at all, so these questions are unanswerable:

- Which physical board is attached to this plant? (no MAC / serial)
- Is the device alive right now? (no `last_seen_at` — only inferable from the newest
  `recorded_at`)
- What IP, signal strength, or firmware version? (printed to Serial, never transmitted)

**Security:** [sensor.js](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/backend/database/sensor.js)
only checks that the `device_id` *exists*, and the backend uses the service-role key, which
bypasses RLS. **Anyone who knows a device UUID can write readings into someone else's
plant.** Low risk on a LAN; a blocker before 5.7 exposes the endpoint publicly.

**Multi-device:** with two plants, the older one is invisible — nothing in the UI can
switch devices. `fetchNewestDevice()` needs a `fetchDevices()` sibling plus a selector.

#### Fix

1.  Extend the schema with hardware identity:
    ```sql
    ALTER TABLE devices
      ADD COLUMN mac_address      TEXT UNIQUE,   -- hardware identity
      ADD COLUMN device_secret    TEXT,          -- store a hash, not the raw value
      ADD COLUMN last_seen_at     TIMESTAMPTZ,
      ADD COLUMN board_model      TEXT,
      ADD COLUMN firmware_version TEXT;
    ```
2.  Have the firmware send `WiFi.macAddress()` in the POST body and a secret in an
    `X-Device-Secret` header; the backend rejects the insert unless both match the
    `devices` row for that `device_id`.
3.  Touch `last_seen_at = now()` on every successful insert → online/offline badge, and
    real data for `DeviceFooter` (5.6).
4.  Add a device selector to the dashboard once more than one device exists.
5.  **Eventually, a pairing flow:** the web app issues a short code for a new device, the
    Arduino registers itself with that code and receives its `device_id`. This removes the
    hardcoded UUID entirely — swapping boards would no longer require reflashing.

### 5.6 — Dashboard sections still on mock data — **P3**

- **`CareSuggestions`** — imports `SUGGESTIONS` / `RADAR_DATA` from
  [mock-plant.ts](file:///c:/Users/yeesm/Work/arduino/plant-doctor-pro/web/frontend/src/app/data/mock-plant.ts).
  The `care_suggestions` table exists but nothing writes to it; the radar scores can be
  derived from the same per-factor scores `computeHealth()` already calculates.
- **`DeviceFooter`** — board / firmware / uptime / signal strength have **no columns in
  the schema**. Needs the schema addition described in **5.5** before it can show
  anything real.
- **Watering events** — no table, so watering markers were removed from the history
  chart. Add one if the feature is wanted.

### 5.7 — The pipeline depends on the PC being awake — **P3**

Today the Arduino POSTs to the developer PC's LAN IP, so nothing is recorded when the PC
is off, asleep, or on another network. Two options:

- **A** — host the Express backend somewhere always-on (small VPS / container host) and
  point `SERVER_IP` at it. Keeps the validation layer in `sensor.js`.
- **B** — have the Arduino POST directly to the Supabase REST endpoint, dropping the
  middleware. Fewer moving parts, but the device then holds a Supabase key and the
  server-side validation is lost.

Either way, **device authentication (5.5) must land first** — the endpoint currently
accepts any reading for any known device UUID.
