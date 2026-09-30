/**
 * ResQ Hub — Functional Test Fixtures & Constants
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false }
});

export const TEST_ORGS = {
  COLOMBO_HUB: 'a0000000-0000-0000-0000-000000000001',
  SARVODAYA_HUB: 'a0000000-0000-0000-0000-000000000002'
};

export const API_BASE_URLS = {
  GATEWAY: `http://localhost:${process.env.API_GATEWAY_PORT || 3000}/api/v1`,
  USER: `http://localhost:${process.env.USER_SERVICE_PORT || 3001}`,
  ORGANIZATION: `http://localhost:${process.env.ORGANIZATION_SERVICE_PORT || 3002}`,
  RESOURCE: `http://localhost:${process.env.RESOURCE_SERVICE_PORT || 3003}`,
  REQUEST: `http://localhost:${process.env.REQUEST_SERVICE_PORT || 3004}`,
  TASK: `http://localhost:${process.env.TASK_SERVICE_PORT || 3005}`,
  VOLUNTEER: `http://localhost:${process.env.VOLUNTEER_SERVICE_PORT || 3006}`,
  NOTIFICATION: `http://localhost:${process.env.NOTIFICATION_SERVICE_PORT || 3007}`
};
