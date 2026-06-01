#include <WiFiS3.h>

// Change these to your WiFi name and password
char ssid[] = "Your wifi name";
char pass[] = "Your wifi password";

int status = WL_IDLE_STATUS;

void setup() {
  Serial.begin(9600);

  while (!Serial) {
    ; // wait for Serial Monitor
  }

  Serial.println("=== Arduino UNO R4 WiFi Connection Test ===");

  // Check if WiFi module exists
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("ERROR: WiFi module not detected.");
    while (true);
  }

  Serial.print("WiFi firmware version: ");
  Serial.println(WiFi.firmwareVersion());

  // Scan nearby WiFi networks
  Serial.println("\nScanning WiFi networks...");
  int numNetworks = WiFi.scanNetworks();

  if (numNetworks == -1) {
    Serial.println("Could not scan networks.");
  } else {
    Serial.print("Found ");
    Serial.print(numNetworks);
    Serial.println(" networks:");

    for (int i = 0; i < numNetworks; i++) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" | Signal: ");
      Serial.print(WiFi.RSSI(i));
      Serial.println(" dBm");
    }
  }

  // Try to connect
  Serial.print("\nConnecting to: ");
  Serial.println(ssid);

  while (status != WL_CONNECTED) {
    status = WiFi.begin(ssid, pass);

    Serial.print(".");
    delay(3000);
  }

  Serial.println("\nConnected to WiFi!");
  printWiFiInfo();
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected.");

    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("WiFi disconnected.");
  }

  Serial.println("--------------------");
  delay(5000);
}

void printWiFiInfo() {
  Serial.println("\n=== WiFi Info ===");

  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  long rssi = WiFi.RSSI();
  Serial.print("Signal strength: ");
  Serial.print(rssi);
  Serial.println(" dBm");
}