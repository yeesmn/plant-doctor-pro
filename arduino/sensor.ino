// --------------------
// sensors.ino
// --------------------
// Only contains:
// - libraries
// - global variables       ← moved OUT of loop() so all files can see them
// - sensorsInit()          ← replaces setup()
// - sensorsRead()          ← replaces loop()
// - BH1750 helper functions
//
// NO setup() or loop() here — those live in wifi_post.ino only
// --------------------

#include <Wire.h>
#include <math.h>
#include "I2Cdev.h"
#include "MPU6050.h"
#include "Adafruit_SHT31.h"

// ---------- MPU6050 ----------
MPU6050 accelgyro;

int16_t ax, ay, az;     // raw accelerometer values
int16_t gx, gy, gz;     // raw gyroscope values

// ---------- BH1750 ----------
int BH1750address = 0x23;
byte buff[2];

// ---------- SHT31 ----------
Adafruit_SHT31 sht31 = Adafruit_SHT31();

// ---------- Moisture ----------
#define MOISTURE_PIN A0

// --------------------
// These were previously declared INSIDE loop() as local variables
// Moving them here as GLOBALS makes them visible to datafiltering.ino
// and wifi_post.ino automatically
// --------------------
float    roll       = 0.0;
float    pitch      = 0.0;
uint16_t lux        = 0;
bool     lightOK    = false;
float    temp       = 0.0;
float    hum        = 0.0;
int      moistureRaw = 0;

// --------------------
// sensorsInit()
// Call this from setup() in wifi_post.ino
// Contains everything that was previously in setup()
// --------------------
void sensorsInit() {
  Wire.begin();

  Serial.print("MPU6050: ");
  Serial.println(accelgyro.initialize() ? "connected" : "connection failed");


  BH1750_Init(BH1750address);
  Serial.println("BH1750 initialized");

  if (!sht31.begin(0x44)) {
    Serial.println("SHT31 not found");
  } else {
    Serial.println("SHT31 connected");
  }

  sht31.heater(false);    // keep heater off for accurate readings

  Serial.println("Sensors ready.");
}

// --------------------
// sensorsRead()
// Call this from datafiltering.ino every 30 seconds
// Reads all sensors and updates the global variables above
// --------------------
void sensorsRead() {

  // ---------- MPU6050 ----------
  accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // Writes into global roll and pitch (not local variables anymore)
  roll  = atan2(ay, az) * 180.0 / PI;
  pitch = atan2(-ax, sqrt((float)ay * ay + (float)az * az)) * 180.0 / PI;

  // ---------- BH1750 ----------
  lightOK = false;    // reset before each read attempt

  if (BH1750_Read(BH1750address) == 2) {
    lux     = ((buff[0] << 8) | buff[1]) / 1.2;
    lightOK = true;
  }

  // ---------- SHT31 ----------
  temp = sht31.readTemperature();   // returns NaN if failed
  hum  = sht31.readHumidity();      // returns NaN if failed

  // ---------- Moisture ----------
  moistureRaw = analogRead(MOISTURE_PIN);

  // ---------- Debug print ----------
  Serial.print("Roll: ");       Serial.print(roll);
  Serial.print(" | Pitch: ");   Serial.print(pitch);
  Serial.print(" | Lux: ");     Serial.print(lightOK ? (float)lux : -1.0);
  Serial.print(" | Temp: ");    Serial.print(isnan(temp) ? -1.0 : temp);
  Serial.print(" | Hum: ");     Serial.print(isnan(hum) ? -1.0 : hum);
  Serial.print(" | Moisture: "); Serial.println(moistureRaw);
}

// ---------- BH1750 Helpers ----------

int BH1750_Read(int address) {
  int i = 0;
  Wire.requestFrom(address, 2);
  while (Wire.available() && i < 2) {
    buff[i] = Wire.read();
    i++;
  }
  return i;
}

void BH1750_Init(int address) {
  Wire.beginTransmission(address);
  Wire.write(0x10);     // continuous high resolution mode
  Wire.endTransmission();
}