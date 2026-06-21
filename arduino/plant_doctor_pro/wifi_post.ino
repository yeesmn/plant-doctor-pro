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

WiFiClient wifi;
HttpClient client = HttpClient(wifi, SERVER_IP, SERVER_PORT);

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
  String plantStatus = calculatePlantStatus(
    filtered_moisture,
    filtered_lux,
    filtered_temp
  );

  String path = "/api/sensor-data";

  // device_id is REQUIRED by the backend — it links this reading to a plant.
  // Without it the server responds 400 "device_id is required".
  String jsonData = "{";
  jsonData += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonData += "\"moisture\":"    + String(filtered_moisture, 2) + ",";
  jsonData += "\"light\":"       + String(filtered_lux, 2) + ",";
  jsonData += "\"temperature\":" + String(filtered_temp, 2) + ",";
  jsonData += "\"humidity\":"    + String(filtered_hum, 2) + ",";
  jsonData += "\"roll\":"        + String(filtered_roll, 2) + ",";
  jsonData += "\"pitch\":"       + String(filtered_pitch, 2) + ",";
  jsonData += "\"plant_status\":\"" + plantStatus + "\"";
  jsonData += "}";

  Serial.println("\nSending POST request...");
  Serial.print("Path: ");
  Serial.println(path);

  Serial.print("JSON: ");
  Serial.println(jsonData);

  client.post(path, "application/json", jsonData);

  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  Serial.print("HTTP Status Code: ");
  Serial.println(statusCode);

  Serial.print("Server Response: ");
  Serial.println(response);

  if (statusCode == 200 || statusCode == 201) {
    Serial.println("Data sent successfully.");
  } else {
    Serial.println("Failed to send data.");
  }

  client.stop();

  Serial.println("--------------------");
}
