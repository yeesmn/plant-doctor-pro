// --------------------
// datafiltering.ino
// --------------------
// This file sits between sensors.ino and wifi_post.ino
// It collects 10 sensor readings every 30 seconds,
// then computes averages and stores them in filtered globals
// that wifi_post.ino will use instead of raw sensor values
//
// Timeline:
// 0:00 - reading 1
// 0:30 - reading 2
// 1:00 - reading 3
// 1:30 - reading 4
// 2:00 - reading 5
// 2:30 - reading 6
// 3:00 - reading 7
// 3:30 - reading 8
// 4:00 - reading 9
// 4:30 - reading 10
// 5:00 - average computed → POST sent to backend
// --------------------

#include "globals.h"     // extern declarations for cross-file globals

// --------------------
// How many readings to collect before averaging
// --------------------
#define SAMPLE_COUNT 10

// --------------------
// How often to take a reading (30 seconds in milliseconds)
// --------------------
#define SAMPLE_INTERVAL 30000UL    // UL = unsigned long, matches millis() type

// --------------------
// Buffers — arrays that store each raw reading until we have 10
// --------------------
float   buf_roll[SAMPLE_COUNT];         // stores 10 roll readings
float   buf_pitch[SAMPLE_COUNT];        // stores 10 pitch readings
float   buf_lux[SAMPLE_COUNT];          // stores 10 lux readings
float   buf_temp[SAMPLE_COUNT];         // stores 10 temperature readings
float   buf_hum[SAMPLE_COUNT];          // stores 10 humidity readings
int     buf_moisture[SAMPLE_COUNT];     // stores 10 moisture raw readings

// --------------------
// Tracks how many valid readings we have collected so far (0 to 10)
// --------------------
int sampleIndex = 0;

// --------------------
// Timestamp of the last reading — used to check if 30 seconds have passed
// --------------------
unsigned long lastSampleTime = 0;

// --------------------
// Flag that wifi_post.ino watches
// When true:  averaged data is ready → POST should be sent
// When false: still collecting readings → do not POST yet
// --------------------
bool dataReady = false;

// --------------------
// Filtered (averaged) globals
// wifi_post.ino reads THESE instead of the raw sensor globals
// --------------------
float filtered_roll     = 0.0;
float filtered_pitch    = 0.0;
float filtered_lux      = 0.0;
float filtered_temp     = 0.0;
float filtered_hum      = 0.0;
float filtered_moisture = 0.0;

// --------------------
// collectSample()
// Call this from loop() in wifi_post.ino
// Checks if 30 seconds have passed, reads sensors, stores into buffers
// When 10 samples collected, computes averages and sets dataReady = true
// --------------------
void collectSample() {
  unsigned long currentTime = millis();

  // --------------------
  // Check if 30 seconds have passed since last reading
  // --------------------
  if (currentTime - lastSampleTime < SAMPLE_INTERVAL) {
    return;   // not time yet — exit early, do nothing
  }

  // --------------------
  // 30 seconds have passed — take a new reading
  // --------------------
  lastSampleTime = currentTime;

  // Read all sensors (fills raw globals in sensors.ino)
  sensorsRead();

  // --------------------
  // Store each sensor reading into its buffer at the current index
  // --------------------
  buf_roll[sampleIndex]     = roll;           // from sensors.ino
  buf_pitch[sampleIndex]    = pitch;          // from sensors.ino
  buf_lux[sampleIndex]      = lightOK ? lux : -1.0;   // -1 if BH1750 failed
  buf_temp[sampleIndex]     = isnan(temp) ? -1.0 : temp;
  buf_hum[sampleIndex]      = isnan(hum)  ? -1.0 : hum;
  buf_moisture[sampleIndex] = moistureRaw;    // from sensors.ino

  Serial.print("Sample ");
  Serial.print(sampleIndex + 1);    // +1 so it prints 1-10 instead of 0-9
  Serial.print("/");
  Serial.print(SAMPLE_COUNT);
  Serial.print(" collected | moisture=");
  Serial.print(moistureRaw);
  Serial.print(" | lux=");
  Serial.print(lightOK ? lux : -1.0);
  Serial.print(" | temp=");
  Serial.print(isnan(temp) ? -1.0 : temp);
  Serial.println();

  sampleIndex++;   // move to next slot in the buffer

  // --------------------
  // Check if we have collected all 10 readings
  // --------------------
  if (sampleIndex >= SAMPLE_COUNT) {
    computeAverages();    // calculate the averages
    sampleIndex = 0;      // reset index so buffer refills from the start next cycle
    dataReady = true;     // signal to wifi_post.ino that it's time to POST
  }
}

// --------------------
// computeAverages()
// Loops through each buffer, sums valid values, divides by valid count
// Skips -1 values (failed readings) so they don't drag the average down
// --------------------
void computeAverages() {
  float sumRoll = 0, sumPitch = 0, sumLux = 0;
  float sumTemp = 0, sumHum = 0;
  long  sumMoisture = 0;

  // Separate valid count per sensor
  // because one sensor might fail more often than another
  int countRoll = 0, countPitch = 0, countLux = 0;
  int countTemp = 0, countHum = 0, countMoisture = 0;

  for (int i = 0; i < SAMPLE_COUNT; i++) {

    // Roll — MPU6050 rarely fails, but check anyway
    if (buf_roll[i] != -1.0) {
      sumRoll += buf_roll[i];
      countRoll++;
    }

    // Pitch
    if (buf_pitch[i] != -1.0) {
      sumPitch += buf_pitch[i];
      countPitch++;
    }

    // Lux — BH1750 can fail if I2C is noisy
    if (buf_lux[i] != -1.0) {
      sumLux += buf_lux[i];
      countLux++;
    }

    // Temperature
    if (buf_temp[i] != -1.0) {
      sumTemp += buf_temp[i];
      countTemp++;
    }

    // Humidity
    if (buf_hum[i] != -1.0) {
      sumHum += buf_hum[i];
      countHum++;
    }

    // Moisture — always valid (analogRead never fails)
    sumMoisture += buf_moisture[i];
    countMoisture++;
  }

  // --------------------
  // Divide sum by valid count to get average
  // If ALL readings for a sensor failed (count == 0), store -1
  // --------------------
  filtered_roll     = countRoll     > 0 ? sumRoll     / countRoll     : -1.0;
  filtered_pitch    = countPitch    > 0 ? sumPitch    / countPitch    : -1.0;
  filtered_lux      = countLux      > 0 ? sumLux      / countLux      : -1.0;
  filtered_temp     = countTemp     > 0 ? sumTemp     / countTemp     : -1.0;
  filtered_hum      = countHum      > 0 ? sumHum      / countHum      : -1.0;
  filtered_moisture = countMoisture > 0 ? sumMoisture / (float)countMoisture : -1.0;

  // Print the computed averages to Serial for debugging
  Serial.println("\n===== Averaged Data Ready =====");
  Serial.print("Roll:        "); Serial.println(filtered_roll);
  Serial.print("Pitch:       "); Serial.println(filtered_pitch);
  Serial.print("Lux:         "); Serial.println(filtered_lux);
  Serial.print("Temperature: "); Serial.println(filtered_temp);
  Serial.print("Humidity:    "); Serial.println(filtered_hum);
  Serial.print("Moisture:    "); Serial.println(filtered_moisture);
  Serial.println("================================\n");
}