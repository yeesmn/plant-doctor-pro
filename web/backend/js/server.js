
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

// Apply morgan in 'dev' mode — colorful, concise logs for development
app.use(morgan('dev'))

// No CORS middleware on purpose: the only client is the Arduino, which is not a
// browser and so is not subject to CORS at all. The dashboard talks to Supabase
// directly and never calls this server. Allowing every origin (the old
// `app.use(cors())`) only widened what a browser could be made to do here.

// Parse incoming JSON bodies — needed to read req.body
app.use(express.json())

// Mount it under /api — so routes become /api/sensor-data etc.
// Every /api call is rate limited and must carry the device secret.
app.use('/api', rateLimit, requireDeviceSecret, sensorRoutes)

// Read PORT which default to 3000.
// Hosting platforms (Render, Fly, Railway…) assign the port and pass it in as
// an env var — a hardcoded 3000 means the health check never connects and the
// deploy gets killed. 3000 stays as the local fallback.
const PORT = process.env.PORT || 3000

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})