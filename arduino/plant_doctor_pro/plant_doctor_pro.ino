// --------------------
// plant_doctor_pro.ino  —  MAIN SKETCH (entry point)
// --------------------
// The Arduino IDE concatenates every .ino file in this folder into one
// program. setup() and loop() live here and act as the "conductor":
//
//   setup() : start Serial, initialize sensors, connect to WiFi
//   loop()  : collect one sample every 30s (datafiltering.ino). After 10
//             samples are averaged it sets dataReady = true, and we POST
//             the averaged reading to the backend (wifi_post.ino).
//
// Cross-file globals + function prototypes are declared in globals.h so
// every file can see them regardless of concatenation order.
// Secrets (WiFi / server / device id) live in config.h (gitignored).
// --------------------

#include <WiFiS3.h>
#include "globals.h"

void setup() {
  Serial.begin(9600);
  while (!Serial) { ; }    // wait for Serial Monitor (USB boards)

  Serial.println("=== Plant Doctor Pro ===");

  sensorsInit();           // sensor.ino — MPU6050, BH1750, SHT31, moisture
  connectToWiFi();         // wifi_post.ino
}

void loop() {
  // Reconnect if WiFi drops
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }

  // datafiltering.ino handles the 30-second sampling internally
  collectSample();

  // When 10 samples have been averaged, send them to the backend
  if (dataReady) {
    sendSensorData();      // wifi_post.ino
    dataReady = false;
  }
}
