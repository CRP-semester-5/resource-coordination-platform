import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

export const env = {
  port: process.env.VOLUNTEER_SERVICE_PORT || 3006,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY,
  jwtSecret: process.env.JWT_SECRET,
}

if (!env.supabaseUrl || !env.supabaseKey) {
  console.error('[FATAL] Missing Supabase credentials in environment variables.')
  process.exit(1)
}

if (!env.jwtSecret) {
  console.error('[FATAL] Missing JWT_SECRET in environment variables.')
  process.exit(1)
}
