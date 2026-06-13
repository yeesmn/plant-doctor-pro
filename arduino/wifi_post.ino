#include <WiFiS3.h>
#include <ArduinoHttpClient.h>

// --------------------
// WiFi info
// --------------------
char ssid[] = "YOUR_WIFI_NAME";
char pass[] = "YOUR_WIFI_PASSWORD";

// --------------------
// Server info
// Use your Mac's LAN IP, not localhost
// Example: 192.168.0.25
// --------------------
char serverAddress[] = "192.168.0.25";
int port = 3000;

// This must match plant_name in your devices table
String plantName = "basil_001";

WiFiClient wifi;
HttpClient client = HttpClient(wifi, serverAddress, port);

void setup() {
  Serial.begin(9600);

  while (!Serial) {
    ;
  }

  Serial.println("=== Plant Doctor Arduino POST Test ===");

  // Initialize all sensors
  sensorsInit();

  pinMode(MOISTURE_PIN, INPUT);

  connectToWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }

  // datafiltering.ino handles 30-second sampling internally
  collectSample();

  // When 10 samples are averaged, send to backend
  if (dataReady) {
    sendSensorData();
    dataReady = false;
  }
}

void connectToWiFi() {
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("ERROR: WiFi module not detected.");
    while (true);
  }

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  while (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(ssid, pass);
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

  String path = "/api/sensor-data/";

  String jsonData = "{";
  jsonData += "\"moisture\":" + String(filtered_moisture, 2) + ",";
  jsonData += "\"light\":" + String(filtered_lux, 2) + ",";
  jsonData += "\"temperature\":" + String(filtered_temp, 2) + ",";
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

