import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

export const config = {
  port: process.env.NOTIFICATION_SERVICE_PORT || 3007,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY,
  jwtSecret: process.env.JWT_SECRET
}

if (!config.supabaseUrl || !config.supabaseKey) {
  console.error('[FATAL] Missing Supabase credentials in environment variables.')
  process.exit(1)
}

if (!config.jwtSecret) {
  console.error('[FATAL] Missing JWT_SECRET in environment variables.')
  process.exit(1)
}
