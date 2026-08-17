
import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import sensorRoutes from '../database/sensor.js'
import { requireDeviceSecret, rateLimit } from './middleware.js'

// Create the Express app
const app = express()

// Trust one proxy hop. Hosting platforms terminate TLS in front of the app and
// pass the real client address in X-Forwarded-For; without this, req.ip is the
// proxy for every request and the rate limiter would share one bucket across
// all callers. One hop only — trusting the header blindly lets clients spoof it.
app.set('trust proxy', 1)

// Apply helmet (security headers)
app.use(helmet())

// Request logging. 'dev' is colourful and short for a local terminal; hosted
// logs want the full combined format (method, path, status, size, user agent),
// and its ANSI colour codes are noise in a platform log viewer.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// No CORS middleware on purpose: the only client is the Arduino, which is not a
// browser and so is not subject to CORS at all. The dashboard talks to Supabase
// directly and never calls this server. Allowing every origin (the old
// `app.use(cors())`) only widened what a browser could be made to do here.

// Parse incoming JSON bodies — needed to read req.body
app.use(express.json())

// Health check — deliberately BEFORE the /api middleware so it needs no secret
// and is not rate limited. Hosting platforms poll this to decide whether the
// instance is alive, and it answers "is the server up?" without touching the DB.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) })
})

// Mount it under /api — so routes become /api/sensor-data etc.
// Every /api call is rate limited and must carry the device secret.
app.use('/api', rateLimit, requireDeviceSecret, sensorRoutes)

// Anything else: JSON, not Express's HTML error page. The Arduino parses the
// body, so every response from this server should be JSON.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Last-resort error handler. Express 5 forwards rejected promises from async
// handlers here; without it an unexpected throw would answer with an HTML stack
// trace. Log the detail, tell the client nothing.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Read PORT which default to 3000.
// Hosting platforms (Render, Fly, Railway…) assign the port and pass it in as
// an env var — a hardcoded 3000 means the health check never connects and the
// deploy gets killed. 3000 stays as the local fallback.
const PORT = process.env.PORT || 3000

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)

  // Writes fail closed without this, so say so at boot rather than letting the
  // first POST of the day be the thing that discovers it.
  if (!process.env.DEVICE_SECRET) {
    console.warn('DEVICE_SECRET is not set — every write will be refused with 503')
  }
})

// Graceful shutdown. Hosting platforms send SIGTERM before replacing an
// instance; without a handler the process dies immediately and any in-flight
// insert is cut off mid-request. Stop accepting connections, let the current
// ones finish, then exit — with a hard cap so a stuck request cannot block the
// deploy forever.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} received — closing server`)

    const forceExit = setTimeout(() => {
      console.error('Shutdown timed out — exiting anyway')
      process.exit(1)
    }, 10_000)

    server.close(() => {
      clearTimeout(forceExit)
      console.log('Closed cleanly')
      process.exit(0)
    })
  })
}