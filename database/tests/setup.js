/**
 * Database Test Suite Configuration & Client Initializer
 * Provides isolated client instances for Section 3.1.1 testing.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment variables.');
}

// Privileged Service Role Client (for backend admin operations & schema validation)
export const serviceClient = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false }
});

// Unprivileged Anonymous / Public Client (for testing RLS policy isolation)
export const anonClient = createClient(supabaseUrl, supabasePublishableKey || supabaseSecretKey, {
  auth: { persistSession: false }
});

export const TEST_IDS = {
  ORG_1: 'a0000000-0000-0000-0000-000000000001',
  ORG_2: 'a0000000-0000-0000-0000-000000000002',
  USER_COORDINATOR: 'c0000000-0000-0000-0000-000000000001',
  USER_CITIZEN: 'c0000000-0000-0000-0000-000000000002',
  USER_VOLUNTEER: 'c0000000-0000-0000-0000-000000000003',
  RESOURCE_WATER: 'f0000000-0000-0000-0000-000000000001',
  RESOURCE_RATIONS: 'f0000000-0000-0000-0000-000000000002'
};
