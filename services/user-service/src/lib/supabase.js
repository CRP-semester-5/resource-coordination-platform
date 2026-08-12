import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// In ESM, static imports are hoisted — env vars must be loaded here,
// before they are accessed, rather than relying on the calling module.
// __dirname equivalent for ESM:
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Walk up: src/lib/ → src/ → user-service/ → services/ → root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY env variables.')
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey)
