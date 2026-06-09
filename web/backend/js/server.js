
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import sensorRoutes from '../database/sensor.js' 

// Create the Express app
const app = express()

// Apply helmet (security headers)
app.use(helmet())

// Apply morgan in 'dev' mode — colorful, concise logs for development
app.use(morgan('dev'))

// Allow all origins to call this server (fine for dev/study purposes)
app.use(cors())

// Parse incoming JSON bodies — needed to read req.body
app.use(express.json())

// Mount it under /api — so routes become /api/sensor-data etc.
app.use('/api', sensorRoutes)

// Read PORT which default to 3000
const PORT = 3000

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})