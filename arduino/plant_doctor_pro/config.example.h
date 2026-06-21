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
// Use the LAN IP of the computer running the Express server — NOT
// "localhost" (the Arduino is a separate device on the network).
// Find it with `ipconfig` (Windows) / `ifconfig` (Mac/Linux). e.g. 192.168.0.25
#define SERVER_IP   "192.168.0.25"
#define SERVER_PORT 3000

// ---- Device UUID ----
// Copy the `id` of THIS plant's row from the Supabase `devices` table.
// The backend rejects any POST that is missing device_id (HTTP 400).
#define DEVICE_ID  "00000000-0000-0000-0000-000000000000"

#endif
