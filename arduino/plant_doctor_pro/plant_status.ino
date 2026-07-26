// --------------------
// plant_status.ino
// --------------------
// This file decides the plant health/status
// based on filtered sensor values.
// --------------------

#include "globals.h"     // String type + shared declarations

// --------------------
// Moisture thresholds, in PERCENT (the raw ADC value is converted by
// moistureToPercent() in sensor.ino before it ever gets here).
//
// These are a coarse local fallback so the device can describe itself
// without the database. The authoritative per-species ranges live in
// `plant_types.min_moisture` / `max_moisture` and are applied by the
// dashboard.
// --------------------
#define MOISTURE_PCT_DRY   30    // below this → soil is too dry
#define MOISTURE_PCT_WET   80    // above this → soil is waterlogged

String calculatePlantStatus(float moisturePct, float light, float temperature) {
  // Moisture logic
  // moisturePct == -1 means the reading failed — say nothing about moisture
  // rather than reporting "needs water" for a -1.
  if (moisturePct != -1 && moisturePct < MOISTURE_PCT_DRY) {
    return "needs water";
  }

  if (moisturePct != -1 && moisturePct > MOISTURE_PCT_WET) {
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