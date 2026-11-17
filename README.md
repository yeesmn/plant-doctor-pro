# plant-doctor-pro
A stress-aware plant care system using Arduino UNO R4 WiFi. Monitors soil moisture, light, temperature &amp; growth in real time. Local feedback via OLED &amp; LED matrix. Sensor data synced to Supabase for deep health analysis &amp; displayed on a web dashboard.

## Try it

**Live dashboard:** https://plant-doctor-pro-frontend.onrender.com

Click **Try the demo account** on the login page, or sign in with:

| Email | Password |
|---|---|
| `demo@example.com` | `demopassword123` |

This is a real Supabase Auth login. The demo account is read-only and owns three
simulated plants: the database adds a reading for each one every 5 minutes, in the
same format the Arduino posts. Row-level security scopes data per account, so a
new account you sign up with starts empty. Setup:
[2026-11-17_demo_account.sql](web/backend/database/migrations/2026-11-17_demo_account.sql).

![Plant Doctor Pro dashboard](docs/images/dashboard.png)
*Screenshot uses the synthetic data from `VITE_USE_MOCK=true`.*

## Documentation

Project docs live in [docs/](docs/) — see the [index](docs/README.md).
Start with [docs/plan.md](docs/plan.md); **Phase 5** lists the currently open issues.

## Layout

| Path | Contents |
|---|---|
| [arduino/plant_doctor_pro/](arduino/plant_doctor_pro/) | Firmware — sensors, filtering, status logic, WiFi POST |
| [web/backend/](web/backend/) | Express API gateway + Supabase schema and SQL |
| [web/frontend/](web/frontend/) | React dashboard (Vite) |
| [docs/](docs/) | Plan, work logs, test plans |
