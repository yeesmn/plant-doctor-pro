#ifndef CONFIG_H
#define CONFIG_H

// --------------------
// config.example.h  →  copy this file to config.h and fill in real values.
//
//   cp config.example.h config.h     (then edit config.h)
//
// config.h is gitignored so your WiFi password and device id never get
// committed. config.example.h stays in git as a template for others.
// --------------------

// ---- WiFi credentials ----
#define WIFI_SSID  "YOUR_WIFI_NAME"
#define WIFI_PASS  "YOUR_WIFI_PASSWORD"

// ---- Backend server ----
// Two setups, switched with USE_TLS:
//
//   Local LAN (USE_TLS 0)
//     SERVER_HOST = the LAN IP of the computer running Express — NOT
//     "localhost", since the Arduino is a separate device. Find it with
//     `ipconfig` (Windows) / `ifconfig` (Mac/Linux).
//     SERVER_PORT = 3000
//
//   Deployed (USE_TLS 1)
//     SERVER_HOST = the host name only, no scheme and no trailing slash,
//     e.g. "plant-doctor-pro.onrender.com"
//     SERVER_PORT = 443
//
// Use TLS for anything off your own network. The POST carries DEVICE_SECRET in
// a header, and over plain HTTP that header is readable by anything on the path.
// Hosting platforms also redirect HTTP→HTTPS, and ArduinoHttpClient does not
// follow redirects — a plain request to a PaaS host simply fails.
//
// If TLS handshakes fail, the radio module's certificate bundle is probably
// out of date: update the UNO R4 WiFi firmware from the Arduino IDE
// (Tools → Firmware Updater).
#define USE_TLS     0

#define SERVER_HOST "192.168.0.25"
#define SERVER_PORT 3000

// ---- Device UUID ----
// Copy the `id` of THIS plant's row from the Supabase `devices` table.
// The backend rejects any POST that is missing device_id (HTTP 400).
#define DEVICE_ID  "00000000-0000-0000-0000-000000000000"

// ---- Shared secret sent as the X-Device-Secret header on every POST ----
// The backend refuses writes that do not carry it (401), so that knowing a
// device UUID is not enough to inject readings. Must match DEVICE_SECRET in
// web/backend/.env — and in the hosting platform's environment variables once
// the backend is deployed.
//
// Generate one with:
//   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
#define DEVICE_SECRET  "YOUR_DEVICE_SECRET"

// ---- Soil moisture calibration ----
// The sketch converts the raw ADC reading (0-1023) into a PERCENTAGE before
// sending it, because the database (`plant_types.min_moisture` /
// `max_moisture`) and the dashboard both work in percent.
//
// Measure YOUR sensor once — the values below are only typical numbers:
//   1. Upload the sketch and open the Serial Monitor.
//   2. Hold the probe in open air, dry and clean → note "Moisture:" (raw).
//      That is MOISTURE_RAW_DRY.
//   3. Submerge it in water up to the marked line (never past it) → note the
//      raw value again. That is MOISTURE_RAW_WET.
//   4. Put both numbers here and re-upload.
//
// Capacitive sensors read HIGHER when dry, so DRY must be greater than WET.
// (If your probe is the resistive kind it behaves the opposite way and the
// #error below will fire — swap the two readings and invert the formula in
// moistureToPercent().)
#define MOISTURE_RAW_DRY  620   // raw value in open air     →   0 %
#define MOISTURE_RAW_WET  300   // raw value submerged       → 100 %

#endif
