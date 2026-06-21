#ifndef GLOBALS_H
#define GLOBALS_H

// --------------------
// globals.h
// --------------------
// The Arduino IDE concatenates every .ino file in this folder into one
// program. It auto-generates prototypes for FUNCTIONS across files, but
// NOT for global VARIABLES. So a global defined in one .ino is invisible
// to another unless we declare it `extern` here.
//
// This header declares every cross-file global + function prototype once,
// and each .ino #includes it. That removes all "not declared in this
// scope" errors and any dependence on file concatenation order.
//
// Definitions (the real storage) still live in their own .ino files:
//   - raw sensor globals        → sensor.ino
//   - filtered globals + flag   → datafiltering.ino
// --------------------

#include <Arduino.h>

// ---- Raw sensor readings (defined in sensor.ino) ----
extern float    roll;
extern float    pitch;
extern uint16_t lux;
extern bool     lightOK;
extern float    temp;
extern float    hum;
extern int      moistureRaw;

// ---- Filtered / averaged values (defined in datafiltering.ino) ----
extern float filtered_roll;
extern float filtered_pitch;
extern float filtered_lux;
extern float filtered_temp;
extern float filtered_hum;
extern float filtered_moisture;

// ---- Pipeline flag: true when 10 samples are averaged and ready to POST ----
extern bool dataReady;

// ---- Function prototypes (cross-file calls) ----
void   sensorsInit();      // sensor.ino
void   sensorsRead();      // sensor.ino
void   collectSample();    // datafiltering.ino
void   computeAverages();  // datafiltering.ino
String calculatePlantStatus(float moisture, float light, float temperature); // plant_status.ino
void   connectToWiFi();    // wifi_post.ino
void   sendSensorData();   // wifi_post.ino

#endif
