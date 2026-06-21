// --------------------
// plant_status.ino
// --------------------
// This file decides the plant health/status
// based on filtered sensor values.
// --------------------

#include "globals.h"     // String type + shared declarations

String calculatePlantStatus(float moisture, float light, float temperature) {
  // Moisture logic
  // For most capacitive moisture sensors:
  // higher raw value = drier soil
  // lower raw value = wetter soil
  //
  // You should calibrate these later.
  if (moisture > 700) {
    return "needs water";
  }

  if (moisture < 250) {
    return "too wet";
  }

  // Light logic
  // light == -1 means the light sensor failed
  if (light != -1 && light < 200) {
    return "needs more light";
  }

  if (light != -1 && light > 20000) {
    return "too much direct light";
  }

  // Temperature logic
  // temperature == -1 means the temp sensor failed
  if (temperature != -1 && temperature < 15) {
    return "too cold";
  }

  if (temperature != -1 && temperature > 32) {
    return "too hot";
  }

  return "healthy";
}