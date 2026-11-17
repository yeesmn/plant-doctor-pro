# Deploying the backend

> **Status: deployed.** Both services run from the `plant-doctor-pro` Render Blueprint —
> `plant-doctor-pro-backend` (Node) and `plant-doctor-pro-frontend` (static, live since
> 2026-11-17 at <https://plant-doctor-pro-frontend.onrender.com>). The steps below are kept
> for redeploying or rebuilding from scratch.

The Express gateway in [web/backend](../web/backend) used to run on a development PC, so
readings only reached Supabase while that machine was awake and on the same network
([plan.md](plan.md) 5.7). This is how it was moved somewhere always-on.

Only one endpoint is exposed: `POST /api/sensor-data`, plus an unauthenticated
`GET /health`. The dashboard does not use this server at all — it reads Supabase directly.

---

## Why Render, and why HTTPS

The choice is driven by TLS, not by features.

The POST carries `DEVICE_SECRET` in a header. On plain HTTP that header is readable by
anything on the network path, so once the endpoint leaves the LAN, **HTTPS stops being
optional**. Hosting platforms also redirect HTTP→HTTPS, and `ArduinoHttpClient` does not
follow redirects — a plain-HTTP request to a PaaS host just fails.

That rules out the "keep plain HTTP, change nothing on the device" shortcut (Fly.io with
`force_https = false`), which was on the table before the shared secret existed. The
firmware switches to TLS instead: `USE_TLS 1` in `config.h`, three lines of effect.

Render's free tier fits the rest: 750 instance hours a month covers one always-on service,
it deploys from GitHub on push, and [render.yaml](../render.yaml) declares the whole
service. A free instance sleeps after 15 minutes without requests — a reading every
5 minutes keeps it awake, and the first POST after a cold start may time out once and
succeed on the next cycle.

---

## 1. Deploy

1. Render dashboard → **New → Blueprint** → select this repository. It reads
   [render.yaml](../render.yaml): root directory `web/backend`, `npm ci --omit=dev`,
   `npm start`, health check `/health`.
2. When prompted, paste the three secrets (Render stores them encrypted; they are never in
   the repo):

   | Variable | Value |
   |---|---|
   | `SUPABASE_URL` | same as `web/backend/.env` |
   | `SUPABASE_KEY` | the **service-role** key — server-side only, it bypasses RLS |
   | `DEVICE_SECRET` | must match `DEVICE_SECRET` in `arduino/plant_doctor_pro/config.h` **exactly** |

3. Wait for the first deploy, then confirm the service is up:

   ```bash
   curl https://YOUR-SERVICE.onrender.com/health
   # {"status":"ok","uptime":12}
   ```

## 2. Verify the endpoint before touching the firmware

Substitute the real host, secret, and a `device_id` that exists in `devices`:

```bash
# No secret → 401
curl -i -X POST https://YOUR-SERVICE.onrender.com/api/sensor-data \
  -H "Content-Type: application/json" -d '{}'

# Wrong unit → 400 (moisture is a percentage now)
curl -i -X POST https://YOUR-SERVICE.onrender.com/api/sensor-data \
  -H "Content-Type: application/json" -H "X-Device-Secret: YOUR_SECRET" \
  -d '{"device_id":"YOUR-UUID","moisture":318.4}'

# Valid → 201
curl -i -X POST https://YOUR-SERVICE.onrender.com/api/sensor-data \
  -H "Content-Type: application/json" -H "X-Device-Secret: YOUR_SECRET" \
  -d '{"device_id":"YOUR-UUID","moisture":62.5,"light":3400,"temperature":22.4,"humidity":48,"roll":2.1,"pitch":-1.4,"plant_status":"healthy"}'
```

A 201 here means the whole server side works. Anything the Arduino then hits is a firmware
or network problem, which is a much smaller search space.

## 3. Point the Arduino at it

In `arduino/plant_doctor_pro/config.h`:

```c
#define USE_TLS     1
#define SERVER_HOST "YOUR-SERVICE.onrender.com"   // host only, no https://, no trailing /
#define SERVER_PORT 443
```

Upload, then watch the Serial Monitor. It prints the full target URL and names the failure:

| Serial output | Meaning |
|---|---|
| `HTTP Status Code: 201` → `Data sent successfully.` | working |
| `Rejected: DEVICE_SECRET does not match the backend.` | 401 — the two secrets differ |
| `Rejected: rate limited...` | 429 — more than 20 requests in a minute |
| `Rejected: backend has no DEVICE_SECRET configured.` | 503 — the env var is missing on Render |
| `400` | body rejected — most likely moisture still in raw units |
| timeout / no status | TLS handshake or DNS. Try `Tools → Firmware Updater` in the IDE to refresh the radio module's certificate bundle |

## 4. Keep the LAN path working

`USE_TLS 0` with the PC's LAN IP and port 3000 still works exactly as before, so local
debugging does not require undoing the deployment. Flipping that one define is the whole
difference.

---

## What this does not solve

- **Device identity.** One shared secret proves "a device of ours", not *which* device — a
  holder of the secret can post under any `device_id`. Per-device credentials need the
  pairing flow in [plan.md](plan.md) 5.5.
- **Physical extraction.** The secret sits in the sketch's flash in plaintext. Anyone with
  the board can read it.
- ~~The PC is still needed for the dashboard.~~ No longer true — the dashboard is deployed
  too; see below.

---

# Deploying the dashboard

The frontend is a Vite SPA that talks to Supabase directly — it never calls the Express
service. [render.yaml](../render.yaml) declares it as a second service in the same
Blueprint, so a `Manual sync` picks it up.

## 1. Deploy

Render → the existing `plant-doctor-pro` Blueprint → **Manual sync**. It creates
`plant-doctor-pro-frontend` and asks for two values:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | same project URL as the backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the **publishable/anon** key — never the service-role one |

`VITE_USE_MOCK` is pinned to `false` in the blueprint. It bypasses the login gate entirely,
which is fine locally and unacceptable on a public URL.

**These are build-time values, not runtime ones.** Vite inlines them into the bundle, so if
a build runs before they are set, the site ships `createClient(undefined, undefined)` and
shows a blank page (`supabaseUrl is required` in the console). That is exactly what the
first deploy did. After adding or changing either value, run **Manual Deploy → Clear build
cache & deploy** — saving the variable alone does not rebuild the bundle.

Both values end up in the JavaScript bundle. That is by design: they identify the project
and nothing more, and row-level security is what keeps one user's plants out of another
user's browser.

## 2. Tell Supabase about the new origin

**Auth → URL Configuration** in the Supabase dashboard:

- **Site URL** → `https://plant-doctor-pro-frontend.onrender.com`
- **Redirect URLs** → add the same origin (keep `http://localhost:5173` for local work)

Skip this and sign-up confirmation links point at localhost, which fails for anyone who is
not sitting at the dev machine.

## 3. Check it

1. Open the site in a private window → the login page appears (not the dashboard).
2. Log in → the plant picker in the nav bar lists the account's plants.
3. Switch plants → the hero, sensor cards and history all follow, and the choice survives a
   reload.
4. The connection pill reads `Arduino connected` only if the selected plant reported within
   15 minutes; otherwise `Last seen …`.

## Notes

- **Devices belong to a user.** RLS filters `devices` by `auth.uid()`, so an account with no
  rows sees the empty state, not someone else's plants. Adding a plant is still a manual
  `INSERT` — the pairing flow is 5.5.
- **The picker is not device management.** Renaming, adding and removing plants are not
  built yet.
