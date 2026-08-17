import { createClient } from '@supabase/supabase-js'

// Fail fast and loudly. Without this, missing env vars produce
// createClient(undefined, undefined), which throws something unrelated later or
// turns every query into an obscure runtime failure — the kind of thing that
// looks like a database outage for half an hour before anyone checks the config.
const missing = ['SUPABASE_URL', 'SUPABASE_KEY'].filter((key) => !process.env[key])

if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`)
  console.error('Set them in web/backend/.env locally, or in the host dashboard once deployed.')
  console.error('See web/backend/.env.example.')
  process.exit(1)
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
