INSERT INTO devices (plant_type, plant_name) VALUES
  ('bean', 'a'),
  ('corn', 'b'),
  ('junyoung', 'johnson');

-- Insert mock sensor readings
INSERT INTO plant_data (device_id, moisture, light, temperature, plant_status)
SELECT id, 65, 800, 22, 'Excellent' FROM devices WHERE plant_name = 'a';

INSERT INTO plant_data (device_id, moisture, light, temperature, plant_status)
SELECT id, 20, 1200, 24, 'Awesome' FROM devices WHERE plant_name = 'b';

INSERT INTO plant_data (device_id, moisture, light, temperature, plant_status)
SELECT id, 75, 400, 21, 'Terrible' FROM devices WHERE plant_name = 'johnson';

-- Insert mock care suggestions
INSERT INTO care_suggestions (device_id, suggestion)
SELECT id, 'Soil moisture is optimal' FROM devices WHERE plant_name = 'a';

INSERT INTO care_suggestions (device_id, suggestion)
SELECT id, 'Water needed soon' FROM devices WHERE plant_name = 'johnson';