// --------------------
// wifi_post.ino
// --------------------
// WiFi connection + HTTP POST helpers.
// setup()/loop() now live in plant_doctor_pro.ino (the main sketch).
// Secrets (WiFi creds, server IP, device id) come from config.h.
// --------------------

#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include "globals.h"
#include "config.h"

// Plain or TLS, chosen in config.h. WiFiSSLClient verifies the server against
// the certificate bundle baked into the radio module's firmware, so no
// certificate needs to live in the sketch.
#if USE_TLS
  WiFiSSLClient wifi;
#else
  WiFiClient wifi;
#endif

HttpClient client = HttpClient(wifi, SERVER_HOST, SERVER_PORT);

void connectToWiFi() {
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("ERROR: WiFi module not detected.");
    while (true);
  }

  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print(".");
    delay(3000);
  }

  Serial.println("\nConnected to WiFi!");

  Serial.print("Arduino IP Address: ");
  Serial.println(WiFi.localIP());

  Serial.print("Signal strength: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

void sendSensorData() {
  // Moisture goes out as a PERCENTAGE, never the raw ADC value — the
  // database and the dashboard both expect percent (see config.h calibration).
  String plantStatus = calculatePlantStatus(
    filtered_moisture_pct,
    filtered_lux,
    filtered_temp
  );

  String path = "/api/sensor-data";

  // device_id is REQUIRED by the backend — it links this reading to a plant.
  // Without it the server responds 400 "device_id is required".
  String jsonData = "{";
  jsonData += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonData += "\"moisture\":"    + String(filtered_moisture_pct, 2) + ",";
  jsonData += "\"light\":"       + String(filtered_lux, 2) + ",";
  jsonData += "\"temperature\":" + String(filtered_temp, 2) + ",";
  jsonData += "\"humidity\":"    + String(filtered_hum, 2) + ",";
  jsonData += "\"roll\":"        + String(filtered_roll, 2) + ",";
  jsonData += "\"pitch\":"       + String(filtered_pitch, 2) + ",";
  jsonData += "\"plant_status\":\"" + plantStatus + "\"";
  jsonData += "}";

  Serial.println("\nSending POST request...");
  Serial.print("To: ");
  Serial.print(USE_TLS ? "https://" : "http://");
  Serial.print(SERVER_HOST);
  Serial.print(":");
  Serial.print(SERVER_PORT);
  Serial.println(path);

  Serial.print("JSON: ");
  Serial.println(jsonData);

  // Sending a custom header means building the request the long way:
  // client.post(path, contentType, body) has no way to add headers.
  // Order matters — headers first, then beginBody(), then the payload.
  client.beginRequest();
  client.post(path);
  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("Content-Length", jsonData.length());
  client.sendHeader("X-Device-Secret", DEVICE_SECRET);   // config.h
  client.beginBody();
  client.print(jsonData);
  client.endRequest();

  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  Serial.print("HTTP Status Code: ");
  Serial.println(statusCode);

  Serial.print("Server Response: ");
  Serial.println(response);

  if (statusCode == 200 || statusCode == 201) {
    Serial.println("Data sent successfully.");
  } else if (statusCode == 401) {
    Serial.println("Rejected: DEVICE_SECRET does not match the backend.");
  } else if (statusCode == 429) {
    Serial.println("Rejected: rate limited. Backing off until the next cycle.");
  } else if (statusCode == 503) {
    Serial.println("Rejected: backend has no DEVICE_SECRET configured.");
  } else {
    Serial.println("Failed to send data.");
  }

  client.stop();

  Serial.println("--------------------");
}
